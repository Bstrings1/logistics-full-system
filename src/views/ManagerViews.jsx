import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { fmt, filterPeriod, ot, calcBonus, getBonusCycleOrders, REVENUE_STATUSES, TODAY } from '../utils/helpers';
import { Av, Badge, SBadge } from '../components/ui';
import DateFilter from '../components/DateFilter';
import PriceInput from '../components/PriceInput';

function useFP() {
  const { period, rangeFrom, rangeTo } = useApp();
  return list => filterPeriod(list, period, rangeFrom, rangeTo);
}

function useFmt() {
  const { cfg } = useApp();
  return n => fmt(n, cfg.currency);
}

export default function ManagerViews({ tabId }) {
  const { session } = useApp();
  const filterP = useFP();
  const fmtC = useFmt();
  const b = session.branch;

  if (tabId === 'send') return <MgrSend filterP={filterP} fmtC={fmtC} branch={b} />;
  if (tabId === 'expenses') return <MgrExpenses filterP={filterP} fmtC={fmtC} branch={b} />;
  if (tabId === 'riders') return <MgrRiders filterP={filterP} fmtC={fmtC} branch={b} />;
  return <MgrRemittance filterP={filterP} fmtC={fmtC} branch={b} />;
}

function MgrRemittance({ filterP, fmtC, branch }) {
  const { db, setDb } = useApp();
  const b = branch;
  const fo = filterP(db.orders.filter(o => o.branch === b && REVENUE_STATUSES.includes(o.status)));
  const pairs = [...new Set(fo.map(o => `${o.rider}||${o.date}`))].map(k => { const [r, d] = k.split('||'); return { rider: r, date: d }; });
  const pays = filterP(Object.values(db.payments).filter(p => p.branch === b));
  const totalCash = pays.reduce((s, p) => s + (p.cash || 0), 0);
  const totalPOS = pays.reduce((s, p) => s + (p.pos || 0), 0);
  const allRiderExps = (db.riderExpenses || []).filter(e => e.branch === b);

  function saveRemittance(key, netExpected, cashVal, posVal, giftVal) {
    const netPOS = Math.max(0, posVal - giftVal);
    const rider = key.split('||')[0];
    const shortfall = Math.max(0, netExpected - cashVal - netPOS);
    setDb(prev => ({
      ...prev,
      payments: {
        ...prev.payments,
        [key]: { ...prev.payments[key], branch: b, cash: cashVal, pos: netPOS, riderGift: giftVal, expected: netExpected, shortfall, rider, date: TODAY, cleared: shortfall === 0 },
      },
    }));
  }

  function logShortfall(key, netExpected, cashVal, posVal, giftVal) {
    const netPOS = Math.max(0, posVal - giftVal);
    const rider = key.split('||')[0];
    const shortfall = Math.max(0, netExpected - cashVal - netPOS);
    if (!confirm(`Record shortfall of ${fmtC(shortfall)} for ${rider}?`)) return;
    setDb(prev => ({
      ...prev,
      payments: {
        ...prev.payments,
        [key]: { ...prev.payments[key], branch: b, cash: cashVal, pos: netPOS, riderGift: giftVal, expected: netExpected, shortfall, rider, date: TODAY, cleared: false },
      },
    }));
  }

  function payShortfall(key, addAmt) {
    if (!addAmt) return;
    setDb(prev => {
      const pay = { ...prev.payments[key] };
      pay.cash = (pay.cash || 0) + addAmt;
      pay.shortfall = Math.max(0, (pay.shortfall || 0) - addAmt);
      if (pay.shortfall <= 0) { pay.shortfall = 0; pay.cleared = true; }
      return { ...prev, payments: { ...prev.payments, [key]: pay } };
    });
  }

  return (
    <>
      <div className="pg-hd"><p className="pg-title">Rider Remittance</p><p className="pg-sub">Cash + (POS − Gift) = Net Expected</p></div>
      <div className="pg-body">
        <DateFilter />
        <div className="g2 mb20">
          <div className="stat"><p className="stat-l">Total Cash In</p><p className="stat-v" style={{ color: 'var(--blue)' }}>{fmtC(totalCash)}</p></div>
          <div className="stat"><p className="stat-l">Total POS (direct to boss)</p><p className="stat-v" style={{ color: 'var(--green)' }}>{fmtC(totalPOS)}</p></div>
        </div>
        <div className="col">
          {pairs.length ? pairs.map(({ rider, date }) => {
            const rOrders = fo.filter(o => o.rider === rider && o.date === date);
            const rExps = allRiderExps.filter(e => e.rider === rider && e.date === date);
            const ordersTotal = rOrders.reduce((s, o) => s + ot(o), 0);
            const expTotal = rExps.reduce((s, e) => s + e.amount, 0);
            const netExpected = Math.max(0, ordersTotal - expTotal);
            return (
              <RemittanceCard
                key={`${rider}||${date}`}
                rider={rider} date={date}
                orders={rOrders}
                riderExps={rExps}
                ordersTotal={ordersTotal}
                expTotal={expTotal}
                netExpected={netExpected}
                payment={db.payments[`${rider}||${date}`] || {}}
                fmtC={fmtC}
                onSave={(cash, pos, gift) => saveRemittance(`${rider}||${date}`, netExpected, cash, pos, gift)}
                onShortfall={(cash, pos, gift) => logShortfall(`${rider}||${date}`, netExpected, cash, pos, gift)}
                onPayShortfall={add => payShortfall(`${rider}||${date}`, add)}
              />
            );
          }) : <div className="empty-box"><p className="empty-t">No delivered orders in period</p></div>}
        </div>
      </div>
    </>
  );
}

function RemittanceCard({ rider, date, orders, riderExps, ordersTotal, expTotal, netExpected, payment: pay, fmtC, onSave, onShortfall, onPayShortfall }) {
  const [cash, setCash] = useState('');
  const [pos, setPos] = useState('');
  const [gift, setGift] = useState('');
  const [shortAdd, setShortAdd] = useState('');
  const cl = pay.cleared;
  const hasShort = pay.shortfall && pay.shortfall > 0;

  return (
    <div className={`rc${hasShort ? ' has-short' : cl ? ' cleared' : ''}`}>
      <div className="row-b mb12">
        <div className="row" style={{ gap: 10 }}>
          <Av name={rider} size={36} />
          <div>
            <div className="row" style={{ gap: 8 }}>
              <p style={{ fontWeight: 700, fontSize: 14 }}>{rider}</p>
              {hasShort && <span style={{ color: 'var(--red)', fontWeight: 700, fontSize: 12 }}>⚠ Shortfall: {fmtC(pay.shortfall)}</span>}
            </div>
            <p style={{ fontSize: 11, color: 'var(--t4)' }}>{date} · {orders.length} orders · Orders: <strong>{fmtC(ordersTotal)}</strong>{expTotal > 0 ? <> · Expenses: <strong style={{ color: 'var(--amber)' }}>−{fmtC(expTotal)}</strong> · Net: <strong style={{ color: 'var(--green)' }}>{fmtC(netExpected)}</strong></> : null}</p>
          </div>
        </div>
        {cl && !hasShort ? <Badge text="Cleared" type="green" /> : hasShort ? <Badge text="Shortfall" type="red" /> : <Badge text="Pending" type="amber" />}
      </div>

      {pay.cash !== undefined && (
        <div className="g3 mb10">
          <div style={{ background: '#f9f9f9', border: '1.5px solid var(--border-soft)', borderRadius: 'var(--r)', padding: 10, textAlign: 'center' }}>
            <p style={{ fontSize: 10, color: 'var(--t4)', marginBottom: 3 }}>Cash Paid</p>
            <p style={{ fontWeight: 700, color: 'var(--blue)' }}>{fmtC(pay.cash || 0)}</p>
          </div>
          <div style={{ background: '#f9f9f9', border: '1.5px solid var(--border-soft)', borderRadius: 'var(--r)', padding: 10, textAlign: 'center' }}>
            <p style={{ fontSize: 10, color: 'var(--t4)', marginBottom: 3 }}>POS (direct)</p>
            <p style={{ fontWeight: 700, color: 'var(--green)' }}>{fmtC(pay.pos || 0)}</p>
          </div>
          <div style={{ background: 'var(--amber-lt)', border: '1.5px solid var(--amber-bd)', borderRadius: 'var(--r)', padding: 10, textAlign: 'center' }}>
            <p style={{ fontSize: 10, color: 'var(--amber)', marginBottom: 3 }}>Gift</p>
            <p style={{ fontWeight: 700, color: 'var(--amber)' }}>{fmtC(pay.riderGift || 0)}</p>
          </div>
        </div>
      )}

      {pay.cash === undefined && (
        <>
          <div className="g3 mb10">
            <div><label className="lbl">Cash Received</label><PriceInput value={cash} onChange={setCash} /></div>
            <div><label className="lbl">POS Received</label><PriceInput value={pos} onChange={setPos} /></div>
            <div><label className="lbl">Rider Gift</label><PriceInput value={gift} onChange={setGift} style={{ borderColor: 'var(--amber-bd)' }} /></div>
          </div>
          <p style={{ fontSize: 11, color: 'var(--t4)', marginBottom: 10 }}>Gift is deducted from POS first. Cash + (POS − Gift) = net expected.</p>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => { onSave(Number(cash) || 0, Number(pos) || 0, Number(gift) || 0); setCash(''); setPos(''); setGift(''); }}>Confirm</button>
            <button className="btn btn-red-soft btn-sm" onClick={() => { onShortfall(Number(cash) || 0, Number(pos) || 0, Number(gift) || 0); setCash(''); setPos(''); setGift(''); }}>Log Shortfall</button>
          </div>
        </>
      )}

      {hasShort && (
        <div className="mt8">
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--red)', marginBottom: 6 }}>Outstanding: {fmtC(pay.shortfall)} — log additional payment</p>
          <div className="row">
            <PriceInput value={shortAdd} onChange={setShortAdd} placeholder="Additional amount paid..." />
            <button className="btn btn-green btn-sm" onClick={() => { onPayShortfall(Number(shortAdd) || 0); setShortAdd(''); }}>Apply</button>
          </div>
        </div>
      )}
    </div>
  );
}

function MgrSend({ filterP, fmtC, branch }) {
  const { db, setDb, period, rangeFrom } = useApp();
  const b = branch;
  const pays = filterP(Object.values(db.payments).filter(p => p.branch === b));
  const cash = pays.reduce((s, p) => s + (p.cash || 0), 0);
  const exp = filterP(db.expenses.filter(e => e.branch === b)).reduce((s, e) => s + e.amount, 0);
  const netToSend = Math.max(0, cash - exp);
  const sent = filterP(db.remittances.filter(r => r.branch === b)).reduce((s, r) => s + r.amount, 0);
  const rem = Math.max(0, netToSend - sent);
  const pos = pays.reduce((s, p) => s + (p.pos || 0), 0);
  const txDate = period === 'range' && rangeFrom ? rangeFrom : TODAY;
  const [fields, setFields] = useState({ amount: '', bank: '', account: '', txID: '' });

  function submit() {
    const amount = Number(fields.amount);
    if (!amount) { alert('Enter an amount'); return; }
    if (!fields.txID) return;
    setDb(prev => ({
      ...prev,
      remittances: [...prev.remittances, { id: Date.now(), branch: b, amount, txID: fields.txID, date: txDate, bank: fields.bank, account: fields.account }],
    }));
    setFields({ amount: '', bank: '', account: '', txID: '' });
  }

  const prevRems = filterP(db.remittances.filter(r => r.branch === b));

  return (
    <>
      <div className="pg-hd"><p className="pg-title">Send to Boss</p><p className="pg-sub">Cash (after expenses) goes to boss. POS is already direct.</p></div>
      <div className="pg-body">
        <DateFilter />
        <div className="navy-hero mb20">
          <div className="mini-grid">
            <div className="mini-card"><p className="mini-l">Cash from Riders</p><p className="mini-v" style={{ color: '#93c5fd' }}>{fmtC(cash)}</p></div>
            <div className="mini-card"><p className="mini-l">Branch Expenses</p><p className="mini-v" style={{ color: '#fca5a5' }}>−{fmtC(exp)}</p></div>
            <div className="mini-card"><p className="mini-l">POS (direct to boss)</p><p className="mini-v" style={{ color: '#6ee7b7' }}>{fmtC(pos)}</p></div>
            <div className="mini-card"><p className="mini-l">Already Sent</p><p className="mini-v" style={{ color: '#c4b5fd' }}>{fmtC(sent)}</p></div>
          </div>
          <div className="bottom-strip">
            <div className="bs-cell"><p className="bs-l">Net to Send</p><p className="bs-v">{fmtC(netToSend)}</p></div>
            <div className="bs-cell"><p className="bs-l">Amount Sent</p><p className="bs-v" style={{ color: '#6ee7b7' }}>{fmtC(sent)}</p></div>
            <div className="bs-cell"><p className="bs-l">Still to Send</p><p className="bs-v" style={{ color: rem > 0 ? '#fca5a5' : '#6ee7b7' }}>{rem === 0 && sent > 0 ? '₦0 ✓' : fmtC(rem)}</p></div>
          </div>
        </div>
        <div className="card">
          <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Log Transfer</p>
          <div className="g2 mb12">
            <div><label className="lbl">Amount</label><PriceInput value={fields.amount} onChange={v => setFields(f => ({ ...f, amount: v }))} /></div>
            <div><label className="lbl">Bank Name</label><input className="inp" value={fields.bank} onChange={e => setFields(f => ({ ...f, bank: e.target.value }))} placeholder="GTBank, Opay..." /></div>
            <div><label className="lbl">Account Number</label><input className="inp" value={fields.account} onChange={e => setFields(f => ({ ...f, account: e.target.value }))} placeholder="0123456789" style={{ fontFamily: 'monospace' }} /></div>
            <div className="span2"><label className="lbl">Transaction ID <span style={{ color: 'var(--red)' }}>*</span></label><input className="inp" value={fields.txID} onChange={e => setFields(f => ({ ...f, txID: e.target.value }))} placeholder="TRF..." style={{ fontFamily: 'monospace', borderColor: fields.txID ? undefined : 'var(--amber-bd)' }} /></div>
          </div>
          <button className="btn btn-primary" onClick={submit} disabled={!fields.txID} style={{ opacity: fields.txID ? 1 : 0.45 }}>Submit to Boss →</button>
        </div>
        {prevRems.length > 0 && (
          <div className="card mt12">
            <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Previous transfers</p>
            <table className="tbl">
              <thead><tr><th>Amount</th><th>Bank</th><th>Account</th><th>TXN</th><th>Date</th><th>Boss</th></tr></thead>
              <tbody>
                {prevRems.map((r, i) => (
                  <tr key={i}>
                    <td style={{ color: 'var(--green)', fontWeight: 700 }}>{fmtC(r.amount)}</td>
                    <td>{r.bank || '—'}</td>
                    <td><code style={{ fontSize: 11 }}>{r.account || '—'}</code></td>
                    <td><code style={{ fontSize: 11 }}>{r.txID || '—'}</code></td>
                    <td style={{ fontSize: 11, color: 'var(--t4)' }}>{r.date}</td>
                    <td>{r.verified ? <Badge text="✓ Verified" type="green" /> : <Badge text="Pending" type="amber" />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function MgrExpenses({ filterP, fmtC, branch }) {
  const { db, setDb } = useApp();
  const b = branch;
  const exps = filterP(db.expenses.filter(e => e.branch === b));
  const total = exps.reduce((s, e) => s + e.amount, 0);
  const [fields, setFields] = useState({ desc: '', cat: '', amount: '', date: TODAY });

  function save() {
    if (!fields.desc || !fields.amount) return;
    setDb(prev => ({
      ...prev,
      expenses: [...prev.expenses, { id: Date.now(), branch: b, desc: fields.desc, cat: fields.cat || 'General', amount: Number(fields.amount), date: fields.date }],
    }));
    setFields({ desc: '', cat: '', amount: '', date: TODAY });
  }

  return (
    <>
      <div className="pg-hd"><p className="pg-title">Branch Expenses</p></div>
      <div className="pg-body">
        <DateFilter />
        <div className="card mb16">
          <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Add Expense</p>
          <div className="g2 mb12">
            <div><label className="lbl">Description</label><input className="inp" value={fields.desc} onChange={e => setFields(f => ({ ...f, desc: e.target.value }))} placeholder="What was this for?" /></div>
            <div><label className="lbl">Category</label><input className="inp" value={fields.cat} onChange={e => setFields(f => ({ ...f, cat: e.target.value }))} placeholder="Fuel, Office..." /></div>
            <div><label className="lbl">Amount</label><PriceInput value={fields.amount} onChange={v => setFields(f => ({ ...f, amount: v }))} /></div>
            <div><label className="lbl">Date</label><input className="inp" type="date" value={fields.date} onChange={e => setFields(f => ({ ...f, date: e.target.value }))} /></div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={save}>Add Expense</button>
        </div>
        <div className="row-b mb12">
          <p style={{ fontSize: 14, fontWeight: 600 }}>Total</p>
          <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--red)' }}>{fmtC(total)}</p>
        </div>
        <div className="card">
          <table className="tbl">
            <thead><tr><th>Description</th><th>Category</th><th>Amount</th><th>Date</th></tr></thead>
            <tbody>
              {exps.length ? exps.map((e, i) => (
                <tr key={i}>
                  <td>{e.desc}</td>
                  <td><Badge text={e.cat} type="gray" /></td>
                  <td style={{ color: 'var(--red)', fontWeight: 600 }}>{fmtC(e.amount)}</td>
                  <td style={{ fontSize: 11, color: 'var(--t4)' }}>{e.date}</td>
                </tr>
              )) : (
                <tr><td colSpan={4}><div className="empty-box"><p className="empty-t">No expenses</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function MgrRiders({ filterP, fmtC, branch }) {
  const { cfg, db } = useApp();
  const b = branch;
  const fo = filterP(db.orders.filter(o => o.branch === b && REVENUE_STATUSES.includes(o.status)));
  const riders = db.riders[b] || [];

  return (
    <>
      <div className="pg-hd"><p className="pg-title">Riders</p></div>
      <div className="pg-body">
        <DateFilter />
        <div className="card">
          <table className="tbl">
            <thead><tr><th>Rider</th><th>Deliveries</th><th>Value</th><th>Cycle Bonus</th></tr></thead>
            <tbody>
              {riders.map(name => {
                const ords = fo.filter(o => o.rider === name);
                const val = ords.reduce((s, o) => s + ot(o), 0);
                const cc = getBonusCycleOrders(name, db).length;
                return (
                  <tr key={name}>
                    <td><div className="row" style={{ gap: 9 }}><Av name={name} size={26} /><p style={{ fontWeight: 500 }}>{name}</p></div></td>
                    <td style={{ fontWeight: 600 }}>{ords.length}</td>
                    <td style={{ fontWeight: 600 }}>{fmtC(val)}</td>
                    <td style={{ fontWeight: 700, color: 'var(--purple)' }}>{fmtC(calcBonus(cc, name, cfg))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
