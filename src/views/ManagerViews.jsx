import { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { fmt, filterPeriod, ot, calcBonus, getBonusCycleOrders, getCycleAllOrders, REVENUE_STATUSES, TODAY } from '../utils/helpers';
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
  if (tabId === 'loans') return <MgrLoans fmtC={fmtC} branch={b} />;
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

async function compressImage(file) {
  return new Promise(resolve => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const maxW = 1200;
      const scale = Math.min(1, maxW / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob(resolve, 'image/jpeg', 0.78);
    };
    img.src = url;
  });
}

function MgrSend({ filterP, fmtC, branch }) {
  const { db, setDb, period, rangeFrom, setPeriod, setRangeFrom, setRangeTo } = useApp();

  function jumpToDate(date) {
    setPeriod('range');
    setRangeFrom(date);
    setRangeTo(date);
  }
  const b = branch;
  const pays = filterP(Object.values(db.payments).filter(p => p.branch === b));
  const cash = pays.reduce((s, p) => s + (p.cash || 0), 0);
  const branchExps = filterP(db.expenses.filter(e => e.branch === b));
  const cashExp = branchExps.filter(e => e.source !== 'pos').reduce((s, e) => s + e.amount, 0);
  const posExp = branchExps.filter(e => e.source === 'pos').reduce((s, e) => s + e.amount, 0);
  const netToSend = Math.max(0, cash - cashExp);
  const sent = filterP(db.remittances.filter(r => r.branch === b)).reduce((s, r) => s + r.amount, 0);
  const rem = Math.max(0, netToSend - sent);
  const pos = pays.reduce((s, p) => s + (p.pos || 0), 0);
  const netPos = Math.max(0, pos - posExp);
  const txDate = period === 'range' && rangeFrom ? rangeFrom : TODAY;

  // All-time per-date breakdown to show past unremitted days
  const allPays = Object.values(db.payments).filter(p => p.branch === b);
  const allRems = db.remittances.filter(r => r.branch === b);
  const allSent = allRems.reduce((s, r) => s + r.amount, 0);
  const allCash = allPays.reduce((s, p) => s + (p.cash || 0), 0);
  const allCashExp = db.expenses.filter(e => e.branch === b && e.source !== 'pos').reduce((s, e) => s + e.amount, 0);
  const allOutstanding = Math.max(0, allCash - allCashExp - allSent);
  const dateRows = Object.values(
    allPays.reduce((acc, p) => {
      const d = p.date || TODAY;
      if (!acc[d]) acc[d] = { date: d, cash: 0 };
      acc[d].cash += p.cash || 0;
      return acc;
    }, {})
  ).map(row => {
    const dayExp = db.expenses.filter(e => e.branch === b && e.date === row.date && e.source !== 'pos').reduce((s, e) => s + e.amount, 0);
    const dayPaid = allRems.filter(r => r.date === row.date).reduce((s, r) => s + r.amount, 0);
    const net = Math.max(0, row.cash - dayExp);
    const owe = Math.max(0, net - dayPaid);
    return { date: row.date, net, paid: dayPaid, owe };
  }).filter(row => row.date !== TODAY && row.owe > 0).sort((a, b) => a.date.localeCompare(b.date));
  const [fields, setFields] = useState({ amount: '', bank: '', account: '', txID: '' });
  const [receipt, setReceipt] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef();

  function pickReceipt(e) {
    const file = e.target.files[0];
    if (!file) return;
    setReceipt(file);
    setReceiptPreview(URL.createObjectURL(file));
  }

  function clearReceipt() {
    setReceipt(null);
    setReceiptPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function submit() {
    const amount = Number(fields.amount);
    if (!amount) { alert('Enter an amount'); return; }
    if (!fields.txID) return;
    setSubmitting(true);
    let receiptUrl = null;
    if (receipt) {
      try {
        const compressed = await compressImage(receipt);
        const path = `${b}/${Date.now()}.jpg`;
        const { error } = await supabase.storage.from('receipts').upload(path, compressed, { contentType: 'image/jpeg' });
        if (!error) {
          const { data } = supabase.storage.from('receipts').getPublicUrl(path);
          receiptUrl = data.publicUrl;
        }
      } catch {}
    }
    setDb(prev => ({
      ...prev,
      remittances: [...prev.remittances, { id: Date.now(), branch: b, amount, txID: fields.txID, date: txDate, bank: fields.bank, account: fields.account, verified: false, receiptUrl }],
    }));
    setFields({ amount: '', bank: '', account: '', txID: '' });
    clearReceipt();
    setSubmitting(false);
  }

  const prevRems = filterP(db.remittances.filter(r => r.branch === b));

  return (
    <>
      <div className="pg-hd"><p className="pg-title">Send to Boss</p><p className="pg-sub">Cash (after expenses) goes to boss. POS is already direct.</p></div>
      <div className="pg-body">
        {allOutstanding > 0 && dateRows.length > 0 && (
          <div style={{ background: '#fff5f5', border: '1.5px solid #fecaca', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 18 }}>⚠️</span>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#e0425a' }}>Outstanding from past days — {fmtC(allOutstanding)} total</p>
                <p style={{ fontSize: 11, color: '#be123c', marginTop: 2 }}>These days still have uncovered cash</p>
              </div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #fecaca' }}>
                  <th style={{ textAlign: 'left', padding: '4px 8px', color: '#be123c', fontWeight: 700 }}>Date</th>
                  <th style={{ textAlign: 'right', padding: '4px 8px', color: '#be123c', fontWeight: 700 }}>Net Due</th>
                  <th style={{ textAlign: 'right', padding: '4px 8px', color: '#be123c', fontWeight: 700 }}>Paid</th>
                  <th style={{ textAlign: 'right', padding: '4px 8px', color: '#be123c', fontWeight: 700 }}>Owe</th>
                </tr>
              </thead>
              <tbody>
                {dateRows.map(row => (
                  <tr key={row.date} style={{ borderBottom: '1px solid #fee2e2' }}>
                    <td style={{ padding: '6px 8px' }}>
                      <button onClick={() => jumpToDate(row.date)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontWeight: 700, color: '#e0425a', fontSize: 12, textDecoration: 'underline', fontFamily: 'inherit' }}>
                        {row.date} →
                      </button>
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', color: '#3a4267' }}>{fmtC(row.net)}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', color: '#1fa67a', fontWeight: 600 }}>{row.paid > 0 ? fmtC(row.paid) : '—'}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 700, color: '#e0425a' }}>{fmtC(row.owe)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <DateFilter />
        <div className="navy-hero mb20">
          <div className="mini-grid">
            <div className="mini-card"><p className="mini-l">Still to Send</p><p className="mini-v" style={{ color: rem > 0 ? '#fca5a5' : '#6ee7b7' }}>{rem === 0 && sent > 0 ? '₦0 ✓' : fmtC(rem)}</p></div>
            <div className="mini-card"><p className="mini-l">Cash from Riders</p><p className="mini-v" style={{ color: '#93c5fd' }}>{fmtC(cash)}</p></div>
            <div className="mini-card"><p className="mini-l">Cash Expenses</p><p className="mini-v" style={{ color: '#fca5a5' }}>−{fmtC(cashExp)}</p></div>
            <div className="mini-card">
              <p className="mini-l">POS (direct to boss)</p>
              <p className="mini-v" style={{ color: '#6ee7b7' }}>{fmtC(netPos)}</p>
              {posExp > 0 && <p style={{ fontSize: 10, color: '#fca5a5', marginTop: 2 }}>−{fmtC(posExp)} expenses</p>}
            </div>
          </div>
          <div className="bottom-strip">
            <div className="bs-cell"><p className="bs-l">Net to Send</p><p className="bs-v">{fmtC(netToSend)}</p></div>
            <div className="bs-cell"><p className="bs-l">Already Sent</p><p className="bs-v" style={{ color: '#c4b5fd' }}>{fmtC(sent)}</p></div>
            <div className="bs-cell"><p className="bs-l">Balance</p><p className="bs-v" style={{ color: rem > 0 ? '#fca5a5' : '#6ee7b7' }}>{rem === 0 && sent > 0 ? '₦0 ✓' : fmtC(rem)}</p></div>
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

          {/* Receipt upload */}
          <div className="mb12">
            <label className="lbl">Receipt / Screenshot</label>
            {receiptPreview ? (
              <div style={{ position: 'relative', display: 'inline-block', marginTop: 6 }}>
                <img src={receiptPreview} alt="receipt" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 10, border: '1.5px solid var(--border)', display: 'block' }} />
                <button onClick={clearReceipt} style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,.55)', color: '#fff', border: 'none', borderRadius: '50%', width: 26, height: 26, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>
            ) : (
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, padding: '10px 14px', border: '1.5px dashed var(--border)', borderRadius: 10, cursor: 'pointer', color: 'var(--t3)', fontSize: 13 }}>
                <span style={{ fontSize: 20 }}>📎</span>
                <span>Tap to attach receipt image</span>
                <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={pickReceipt} />
              </label>
            )}
          </div>

          <button className="btn btn-primary" onClick={submit} disabled={!fields.txID || submitting} style={{ opacity: fields.txID && !submitting ? 1 : 0.45 }}>
            {submitting ? 'Uploading...' : 'Submit to Boss →'}
          </button>
        </div>
        {prevRems.length > 0 && (
          <div className="card mt12">
            <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Previous transfers</p>
            <table className="tbl">
              <thead><tr><th>Amount</th><th>Bank</th><th>TXN</th><th>Date</th><th>Receipt</th><th>Boss</th></tr></thead>
              <tbody>
                {prevRems.map((r, i) => (
                  <tr key={i}>
                    <td style={{ color: 'var(--green)', fontWeight: 700 }}>{fmtC(r.amount)}</td>
                    <td>{r.bank || '—'}</td>
                    <td><code style={{ fontSize: 11 }}>{r.txID || '—'}</code></td>
                    <td style={{ fontSize: 11, color: 'var(--t4)' }}>{r.date}</td>
                    <td>{r.receiptUrl ? <a href={r.receiptUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--blue)' }}>View</a> : <span style={{ fontSize: 11, color: 'var(--t4)' }}>—</span>}</td>
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
  const [fields, setFields] = useState({ desc: '', cat: '', amount: '', date: TODAY, source: 'cash' });

  function save() {
    if (!fields.desc || !fields.amount) return;
    setDb(prev => ({
      ...prev,
      expenses: [...prev.expenses, { id: Date.now(), branch: b, desc: fields.desc, cat: fields.cat || 'General', amount: Number(fields.amount), date: fields.date, source: fields.source }],
    }));
    setFields({ desc: '', cat: '', amount: '', date: TODAY, source: 'cash' });
  }

  const cashTotal = exps.filter(e => e.source !== 'pos').reduce((s, e) => s + e.amount, 0);
  const posTotal = exps.filter(e => e.source === 'pos').reduce((s, e) => s + e.amount, 0);

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
            <div style={{ gridColumn: '1/-1' }}>
              <label className="lbl">Deduct From</label>
              <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                {[['cash', 'Cash'], ['pos', 'POS']].map(([val, label]) => (
                  <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', padding: '6px 14px', borderRadius: 8, border: `1.5px solid ${fields.source === val ? 'var(--primary)' : 'var(--border)'}`, background: fields.source === val ? '#eff6ff' : '#fff', fontWeight: fields.source === val ? 700 : 400 }}>
                    <input type="radio" value={val} checked={fields.source === val} onChange={() => setFields(f => ({ ...f, source: val }))} style={{ display: 'none' }} />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={save}>Add Expense</button>
        </div>
        <div className="row-b mb12">
          <p style={{ fontSize: 14, fontWeight: 600 }}>Total: {fmtC(total)}</p>
          <div style={{ display: 'flex', gap: 12 }}>
            {cashTotal > 0 && <span style={{ fontSize: 12, color: 'var(--t3)' }}>Cash: <b style={{ color: 'var(--red)' }}>{fmtC(cashTotal)}</b></span>}
            {posTotal > 0 && <span style={{ fontSize: 12, color: 'var(--t3)' }}>POS: <b style={{ color: 'var(--red)' }}>{fmtC(posTotal)}</b></span>}
          </div>
        </div>
        <div className="card">
          <table className="tbl">
            <thead><tr><th>Description</th><th>Category</th><th>Source</th><th>Amount</th><th>Date</th></tr></thead>
            <tbody>
              {exps.length ? exps.map((e, i) => (
                <tr key={i}>
                  <td>{e.desc}</td>
                  <td><Badge text={e.cat} type="gray" /></td>
                  <td><Badge text={e.source === 'pos' ? 'POS' : 'Cash'} type={e.source === 'pos' ? 'green' : 'amber'} /></td>
                  <td style={{ color: 'var(--red)', fontWeight: 600 }}>{fmtC(e.amount)}</td>
                  <td style={{ fontSize: 11, color: 'var(--t4)' }}>{e.date}</td>
                </tr>
              )) : (
                <tr><td colSpan={5}><div className="empty-box"><p className="empty-t">No expenses</p></div></td></tr>
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
  const allOrders = filterP(db.orders.filter(o => o.branch === b));
  const riders = db.riders[b] || [];

  return (
    <>
      <div className="pg-hd"><p className="pg-title">Riders</p></div>
      <div className="pg-body">
        <DateFilter />
        <div className="card">
          <table className="tbl">
            <thead>
              <tr>
                <th>Rider</th>
                <th>Total Orders</th>
                <th>Total Delivered</th>
                <th>Returns</th>
                <th>Success Rate</th>
                <th>Cycle Bonus</th>
              </tr>
            </thead>
            <tbody>
              {riders.map(name => {
                const ords = allOrders.filter(o => o.rider === name);
                const delivered = ords.filter(o => REVENUE_STATUSES.includes(o.status)).length;
                const returns = ords.filter(o => o.status === 'Failed' || o.status === 'Not Delivered').length;
                const rate = ords.length > 0 ? Math.round((delivered / ords.length) * 100) : 0;
                const cc = getBonusCycleOrders(name, db).length;
                const ct = getCycleAllOrders(name, db).length;
                const cycleRate = ct > 0 ? Math.round((cc / ct) * 100) : 0;
                return (
                  <tr key={name}>
                    <td><div className="row" style={{ gap: 9 }}><Av name={name} size={26} /><p style={{ fontWeight: 500 }}>{name}</p></div></td>
                    <td style={{ fontWeight: 600 }}>{ords.length}</td>
                    <td style={{ fontWeight: 600, color: 'var(--green)' }}>{delivered}</td>
                    <td style={{ fontWeight: 600, color: returns > 0 ? 'var(--red)' : 'var(--t4)' }}>{returns}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, background: '#e5e7eb', borderRadius: 4, height: 6, overflow: 'hidden', minWidth: 60 }}>
                          <div style={{ width: `${rate}%`, background: rate >= 80 ? 'var(--green)' : rate >= 50 ? 'var(--amber)' : 'var(--red)', height: '100%', transition: 'width .3s' }} />
                        </div>
                        <span style={{ fontWeight: 700, fontSize: 13, color: rate >= 80 ? 'var(--green)' : rate >= 50 ? 'var(--amber)' : 'var(--red)', whiteSpace: 'nowrap' }}>{rate}%</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--purple)' }}>{fmtC(calcBonus(cc, cycleRate, name, cfg))}</td>
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

function genInstallments(loanId, amount, salary, pct, startDate) {
  const monthly = Math.round(salary * pct / 100);
  if (!monthly) return [];
  const count = Math.ceil(amount / monthly);
  const [yr, mo] = startDate.split('-').map(Number);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(yr, mo + i, 1);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const isLast = i === count - 1;
    return { id: `${loanId}-${i}`, month, amount: isLast ? amount - monthly * (count - 1) : monthly, status: 'pending', paidDate: null };
  });
}

function MgrLoans({ fmtC, branch }) {
  const { db, setDb } = useApp();
  const loans = (db.loans || []).filter(l => l.branch === branch);
  const active = loans.filter(l => {
    const paid = (l.repayments || []).reduce((s, r) => s + r.amount, 0);
    return paid < l.amount;
  });
  const cleared = loans.filter(l => {
    const paid = (l.repayments || []).reduce((s, r) => s + r.amount, 0);
    return paid >= l.amount;
  });
  const totalOutstanding = active.reduce((s, l) => {
    const paid = (l.repayments || []).reduce((r, x) => r + x.amount, 0);
    return s + Math.max(0, l.amount - paid);
  }, 0);

  const todayD = new Date();
  const lastDay = new Date(todayD.getFullYear(), todayD.getMonth() + 1, 0).getDate();
  const isMonthEnd = todayD.getDate() >= lastDay - 4;
  const currentMonth = TODAY.slice(0, 7);
  const pendingThisMonth = active.filter(l =>
    l.repayMethod === 'salary' && (l.installments || []).some(i => i.month === currentMonth && i.status === 'pending')
  );

  const [form, setForm] = useState({ staff: '', amount: '', salary: '', date: TODAY, note: '', repayMethod: 'manual', salaryPct: '' });
  const [showForm, setShowForm] = useState(false);
  const [repForm, setRepForm] = useState({});
  const [openLoan, setOpenLoan] = useState(null);

  function addLoan() {
    if (!form.staff || !form.amount) return alert('Staff name and amount required');
    const id = Date.now();
    const amount = Number(form.amount);
    const salary = Number(form.salary) || 0;
    const salaryPct = Number(form.salaryPct) || 0;
    const installments = form.repayMethod === 'salary' ? genInstallments(id, amount, salary, salaryPct, form.date) : [];
    const loan = { id, branch, staff: form.staff, amount, salary, date: form.date, note: form.note, repayments: [], repayMethod: form.repayMethod, salaryPct, installments, status: 'active' };
    setDb(d => ({ ...d, loans: [...(d.loans || []), loan] }));
    setForm({ staff: '', amount: '', salary: '', date: TODAY, note: '', repayMethod: 'manual', salaryPct: '' });
    setShowForm(false);
  }

  function logRepayment(loanId) {
    const rf = repForm[loanId] || {};
    const amount = Number(rf.amount);
    if (!amount) return alert('Enter repayment amount');
    const rep = { id: Date.now(), amount, date: rf.date || TODAY };
    setDb(d => ({ ...d, loans: (d.loans || []).map(l => l.id === loanId ? { ...l, repayments: [...(l.repayments || []), rep] } : l) }));
    setRepForm(f => ({ ...f, [loanId]: { amount: '', date: TODAY } }));
  }

  function markInstallmentPaid(loanId, instId, instAmount) {
    setDb(d => ({
      ...d,
      loans: (d.loans || []).map(l => {
        if (l.id !== loanId) return l;
        const installments = (l.installments || []).map(inst =>
          inst.id === instId ? { ...inst, status: 'paid', paidDate: TODAY } : inst
        );
        const repayments = [...(l.repayments || []), { id: Date.now(), amount: instAmount, date: TODAY }];
        return { ...l, installments, repayments };
      }),
    }));
  }

  const monthlyAmt = form.repayMethod === 'salary' && form.salary && form.salaryPct
    ? Math.round(Number(form.salary) * Number(form.salaryPct) / 100) : 0;
  const totalMonths = monthlyAmt && form.amount ? Math.ceil(Number(form.amount) / monthlyAmt) : 0;

  return (
    <>
      <div className="pg-hd"><p className="pg-title">Staff Loans — {branch}</p></div>
      <div className="pg-body">
        {isMonthEnd && pendingThisMonth.length > 0 && (
          <div className="card" style={{ background: '#fff7ed', border: '1.5px solid #fb923c', marginBottom: 16 }}>
            <p style={{ fontWeight: 700, color: '#c2410c', marginBottom: 6 }}>⚠ Month-End Reminder</p>
            <p style={{ fontSize: 13, color: '#92400e', marginBottom: 6 }}>These salary deductions are due this month:</p>
            {pendingThisMonth.map(l => {
              const inst = (l.installments || []).find(i => i.month === currentMonth && i.status === 'pending');
              return <p key={l.id} style={{ fontSize: 13, fontWeight: 600 }}>{l.staff} — {fmtC(inst?.amount || 0)}</p>;
            })}
          </div>
        )}
        {totalOutstanding > 0 && (
          <div className="card" style={{ background: '#fff7ed', border: '1px solid #fed7aa', marginBottom: 16 }}>
            <p style={{ color: '#c2410c', fontWeight: 700 }}>Total Outstanding: {fmtC(totalOutstanding)}</p>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <button className="btn-primary" onClick={() => setShowForm(v => !v)}>{showForm ? 'Cancel' : '+ Add New Loan'}</button>
        </div>
        {showForm && (
          <div className="card" style={{ marginBottom: 16 }}>
            <p style={{ fontWeight: 600, marginBottom: 10 }}>New Loan</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div><label className="lbl">Staff Name</label><input className="inp" value={form.staff} onChange={e => setForm(f => ({ ...f, staff: e.target.value }))} /></div>
              <div><label className="lbl">Loan Amount</label><PriceInput value={form.amount} onChange={v => setForm(f => ({ ...f, amount: v }))} /></div>
              <div><label className="lbl">Monthly Salary</label><PriceInput value={form.salary} onChange={v => setForm(f => ({ ...f, salary: v }))} /></div>
              <div><label className="lbl">Date</label><input className="inp" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
              <div style={{ gridColumn: '1/-1' }}><label className="lbl">Note</label><input className="inp" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} /></div>
              <div style={{ gridColumn: '1/-1' }}>
                <label className="lbl">Repayment Method</label>
                <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
                  {['manual', 'salary'].map(m => (
                    <label key={m} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                      <input type="radio" value={m} checked={form.repayMethod === m} onChange={() => setForm(f => ({ ...f, repayMethod: m }))} />
                      {m === 'manual' ? 'Manual' : 'Salary Deduction'}
                    </label>
                  ))}
                </div>
              </div>
              {form.repayMethod === 'salary' && (
                <div style={{ gridColumn: '1/-1' }}>
                  <label className="lbl">% of Salary per Month</label>
                  <input className="inp" type="number" min="1" max="100" value={form.salaryPct} placeholder="e.g. 25" onChange={e => setForm(f => ({ ...f, salaryPct: e.target.value }))} />
                  {monthlyAmt > 0 && (
                    <p style={{ fontSize: 11, color: '#3b9fd4', marginTop: 4, fontWeight: 600 }}>
                      ≈ {fmtC(monthlyAmt)} / month · {totalMonths} month{totalMonths !== 1 ? 's' : ''} total
                    </p>
                  )}
                </div>
              )}
            </div>
            <button className="btn-primary" style={{ marginTop: 12 }} onClick={addLoan}>Save Loan</button>
          </div>
        )}
        <p style={{ fontWeight: 600, marginBottom: 8 }}>Active Loans ({active.length})</p>
        {active.length === 0 && <div className="card"><p style={{ color: '#888' }}>No active loans.</p></div>}
        {active.map(l => {
          const paid = (l.repayments || []).reduce((s, r) => s + r.amount, 0);
          const remaining = Math.max(0, l.amount - paid);
          const pct = Math.min(100, Math.round((paid / l.amount) * 100));
          const rf = repForm[l.id] || { amount: '', date: TODAY };
          const open = openLoan === l.id;
          const isSalary = l.repayMethod === 'salary';
          const dueThisMonth = isSalary && (l.installments || []).some(i => i.month === currentMonth && i.status === 'pending');
          return (
            <div key={l.id} className="card" style={{ marginBottom: 12, border: dueThisMonth && isMonthEnd ? '1.5px solid #fb923c' : undefined }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <p style={{ fontWeight: 700 }}>{l.staff}</p>
                    {isSalary && <span style={{ fontSize: 10, background: '#e0f2fe', color: '#0369a1', borderRadius: 4, padding: '2px 6px', fontWeight: 600 }}>SALARY {l.salaryPct}%</span>}
                    {dueThisMonth && isMonthEnd && <span style={{ fontSize: 10, background: '#fff7ed', color: '#c2410c', borderRadius: 4, padding: '2px 6px', fontWeight: 700 }}>⚠ DUE</span>}
                  </div>
                  <p style={{ fontSize: 12, color: '#888' }}>{l.date}{l.note ? ` • ${l.note}` : ''}</p>
                </div>
                <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => setOpenLoan(open ? null : l.id)}>{open ? 'Close' : 'Details'}</button>
              </div>
              <div style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span>Loan: {fmtC(l.amount)}</span><span>Remaining: <b style={{ color: '#dc2626' }}>{fmtC(remaining)}</b></span>
                </div>
                <div style={{ background: '#e5e7eb', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, background: 'var(--primary)', height: '100%', transition: 'width .3s' }} />
                </div>
                <p style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{pct}% repaid</p>
              </div>
              {open && (
                <div style={{ marginTop: 10, borderTop: '1px solid #e5e7eb', paddingTop: 10 }}>
                  {isSalary ? (
                    <>
                      <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Installment Schedule</p>
                      {(l.installments || []).map(inst => {
                        const isPaid = inst.status === 'paid';
                        const isDue = inst.month === currentMonth && !isPaid;
                        return (
                          <div key={inst.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', marginBottom: 6, borderRadius: 8, background: isPaid ? '#f0fdf4' : isDue ? '#fff7ed' : '#f8fafc', border: `1px solid ${isPaid ? '#bbf7d0' : isDue ? '#fed7aa' : '#e5e7eb'}` }}>
                            <div>
                              <p style={{ fontSize: 13, fontWeight: 600 }}>{inst.month}</p>
                              {isPaid && <p style={{ fontSize: 11, color: '#16a34a' }}>Paid {inst.paidDate}</p>}
                              {isDue && <p style={{ fontSize: 11, color: '#c2410c', fontWeight: 600 }}>Due this month</p>}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontWeight: 700, fontSize: 13 }}>{fmtC(inst.amount)}</span>
                              {isPaid
                                ? <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 700 }}>✓ Paid</span>
                                : <button className="btn-primary btn-sm" onClick={() => { if (confirm(`Mark ${inst.month} installment of ${fmtC(inst.amount)} as paid?`)) markInstallmentPaid(l.id, inst.id, inst.amount); }}>Mark Paid</button>
                              }
                            </div>
                          </div>
                        );
                      })}
                    </>
                  ) : (
                    <>
                      <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Repayment History</p>
                      {(l.repayments || []).length === 0 && <p style={{ color: '#aaa', fontSize: 13 }}>No repayments yet.</p>}
                      {(l.repayments || []).map(r => (
                        <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '3px 0', borderBottom: '1px solid #f3f4f6' }}>
                          <span>{r.date}</span><span style={{ fontWeight: 600 }}>{fmtC(r.amount)}</span>
                        </div>
                      ))}
                      <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
                        <PriceInput value={rf.amount} onChange={v => setRepForm(f => ({ ...f, [l.id]: { ...rf, amount: v } }))} style={{ flex: 1 }} />
                        <input className="inp" type="date" value={rf.date} onChange={e => setRepForm(f => ({ ...f, [l.id]: { ...rf, date: e.target.value } }))} style={{ flex: 1 }} />
                        <button className="btn-primary" style={{ whiteSpace: 'nowrap' }} onClick={() => logRepayment(l.id)}>Log</button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {cleared.length > 0 && (
          <>
            <p style={{ fontWeight: 600, marginTop: 16, marginBottom: 8, color: '#16a34a' }}>Cleared Loans ({cleared.length})</p>
            {cleared.map(l => (
              <div key={l.id} className="card" style={{ marginBottom: 8, opacity: 0.7 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontWeight: 700 }}>{l.staff}</p>
                    <p style={{ fontSize: 12, color: '#888' }}>{l.date}{l.note ? ` • ${l.note}` : ''}</p>
                  </div>
                  <span style={{ color: '#16a34a', fontWeight: 700, fontSize: 13 }}>CLEARED — {fmtC(l.amount)}</span>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </>
  );
}
