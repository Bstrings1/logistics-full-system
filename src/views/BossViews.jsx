import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { fmt, filterPeriod, branchCalc, getBonusCycleOrders, calcBonus, bonusRate, getTabs, ot, gp, TODAY } from '../utils/helpers';
import { Av, Badge, SBadge } from '../components/ui';
import DateFilter from '../components/DateFilter';

function useFP() {
  const { period, rangeFrom, rangeTo } = useApp();
  return list => filterPeriod(list, period, rangeFrom, rangeTo);
}

function useFmt() {
  const { cfg } = useApp();
  return n => fmt(n, cfg.currency);
}

export default function BossViews({ tabId }) {
  const { cfg, db, setActiveTab } = useApp();
  const filterP = useFP();
  const fmtC = useFmt();

  if (tabId === 'overview') return <BossOverview filterP={filterP} fmtC={fmtC} cfg={cfg} db={db} setActiveTab={setActiveTab} />;
  if (tabId === 'branches') return <BossBranches filterP={filterP} fmtC={fmtC} cfg={cfg} db={db} />;
  if (tabId === 'orders') return <BossOrders filterP={filterP} fmtC={fmtC} cfg={cfg} db={db} />;
  if (tabId === 'riders') return <BossRiders fmtC={fmtC} cfg={cfg} db={db} />;
  if (tabId === 'remittances') return <BossRemittances filterP={filterP} fmtC={fmtC} cfg={cfg} db={db} />;
  if (tabId === 'vendor-pay') return <BossVendorPay fmtC={fmtC} cfg={cfg} db={db} />;
  if (tabId === 'inventory') return <BossInventory cfg={cfg} db={db} />;
  if (tabId === 'tools') return <BossTools setActiveTab={setActiveTab} cfg={cfg} />;
  if (tabId === 'dfees') return <BossDeliveryFees fmtC={fmtC} cfg={cfg} db={db} setActiveTab={setActiveTab} />;
  if (tabId === 'loans') return <BossLoans fmtC={fmtC} db={db} setActiveTab={setActiveTab} />;
  return null;
}

function BossOverview({ filterP, fmtC, cfg, db, setActiveTab }) {
  let totalOrdersVal = 0, totalCash = 0, totalPos = 0, totalExp = 0, totalNetExp = 0, totalSent = 0, totalStillToSend = 0;
  cfg.branches.forEach(b => {
    const c = branchCalc(b, cfg, db, filterP);
    totalOrdersVal += c.ordersVal; totalCash += c.cash; totalPos += c.pos;
    totalExp += c.exp; totalNetExp += c.netExpected; totalSent += c.sent; totalStillToSend += c.stillToSend;
  });
  const shortfallPays = Object.values(db.payments).filter(p => p.shortfall && p.shortfall > 0);
  const cols = [['#e8f5e9','#388e3c'],['#e3f2fd','#1565c0'],['#fce4ec','#c62828']];

  return (
    <>
      <div className="pg-hd"><p className="pg-title">Overview</p><p className="pg-sub">All branches at a glance</p></div>
      <div className="pg-body">
        <DateFilter />
        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>Remittance Status</p>
        <div className="mb20">
          {cfg.branches.map((b, idx) => {
            const c = branchCalc(b, cfg, db, filterP);
            const allSent = c.stillToSend <= 0 && c.sent > 0;
            const [bg, fg] = cols[idx % cols.length];
            return (
              <div key={b} className={`branch-status-card ${allSent ? 'card-green' : c.shortfall > 0 ? 'card-red' : ''}`}>
                <div className="bsc-icon" style={{ background: bg, color: fg }}>{b[0]}</div>
                <div className="bsc-main">
                  <p className="bsc-name">{b}</p>
                  <p className="bsc-sub">{c.delivered} orders · {fmtC(c.ordersVal)} collected</p>
                </div>
                <div className="bsc-right">
                  {allSent && !c.shortfall ? (
                    <><p style={{ color: 'var(--green)', fontWeight: 600, fontSize: 13 }}>✓ All Sent</p><p style={{ fontSize: 11, color: 'var(--t4)' }}>{fmtC(c.sent)} sent</p></>
                  ) : c.shortfall > 0 ? (
                    <><p style={{ color: 'var(--red)', fontWeight: 700, fontSize: 13 }}>⚠ Shortfall</p><p style={{ fontSize: 11, color: 'var(--red)' }}>{fmtC(c.shortfall)} unpaid</p></>
                  ) : (
                    <><p style={{ color: 'var(--amber)', fontWeight: 600, fontSize: 13 }}>Pending</p><p style={{ fontSize: 11, color: 'var(--t4)' }}>{fmtC(c.stillToSend)} to send</p></>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>Today's Totals</p>
        <div className="navy-hero mb20">
          <div className="mini-grid">
            <div className="mini-card"><p className="mini-l">Orders Value</p><p className="mini-v" style={{ color: '#93c5fd' }}>{fmtC(totalOrdersVal)}</p></div>
            <div className="mini-card"><p className="mini-l">Cash Collected</p><p className="mini-v" style={{ color: '#fff' }}>{fmtC(totalCash)}</p></div>
            <div className="mini-card"><p className="mini-l">POS Collected</p><p className="mini-v" style={{ color: '#6ee7b7' }}>{fmtC(totalPos)}</p></div>
            <div className="mini-card"><p className="mini-l">Branch Expenses</p><p className="mini-v" style={{ color: '#fca5a5' }}>{fmtC(totalExp)}</p></div>
          </div>
          <div className="bottom-strip">
            <div className="bs-cell"><p className="bs-l">Net Expected</p><p className="bs-v">{fmtC(totalNetExp)}</p></div>
            <div className="bs-cell"><p className="bs-l">Cash Sent</p><p className="bs-v" style={{ color: '#6ee7b7' }}>{fmtC(totalSent)}</p></div>
            <div className="bs-cell"><p className="bs-l">Still to Send</p><p className="bs-v" style={{ color: totalStillToSend > 0 ? '#fca5a5' : '#6ee7b7' }}>{fmtC(totalStillToSend)}</p></div>
          </div>
        </div>

        {shortfallPays.length > 0 && (
          <>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>Outstanding Riders</p>
            {shortfallPays.map((p, i) => (
              <div key={i} className="outstanding-row">
                <Av name={p.rider || '?'} size={34} />
                <div className="or-info"><p className="or-name">{p.rider}</p><p className="or-sub">{p.branch} · {p.date}</p></div>
                <p className="or-amount">{fmtC(p.shortfall)}</p>
              </div>
            ))}
          </>
        )}
      </div>
    </>
  );
}

function BossBranches({ filterP, fmtC, cfg, db }) {
  return (
    <>
      <div className="pg-hd"><p className="pg-title">Branches</p></div>
      <div className="pg-body">
        <DateFilter />
        {cfg.branches.map(b => {
          const c = branchCalc(b, cfg, db, filterP);
          const allOrds = filterP(db.orders.filter(o => o.branch === b));
          const pct = allOrds.length ? Math.round((c.delivered / allOrds.length) * 100) : 0;
          return (
            <div key={b} className="branch-card">
              <div className="bc-head">
                <div className="row" style={{ gap: 12 }}>
                  <div className="bc-icon">{b[0]}</div>
                  <div><p style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-.02em' }}>{b}</p><p style={{ fontSize: 12, color: 'var(--t4)' }}>{c.riders.length} riders</p></div>
                </div>
                <div className="row" style={{ gap: 8 }}>
                  {c.shortfall > 0 && <span style={{ background: '#fef2f2', color: 'var(--red)', border: '1px solid var(--red-bd)', borderRadius: 99, padding: '3px 12px', fontSize: 12, fontWeight: 700 }}>Over {fmtC(c.shortfall)}</span>}
                  <span style={{ fontSize: 12, color: 'var(--t3)' }}>{c.delivered}/{allOrds.length} delivered</span>
                </div>
              </div>
              <div className="branch-card mini-stats">
                <div className="ms"><p className="ms-l">Cash Collected</p><p className="ms-v" style={{ color: 'var(--blue)' }}>{fmtC(c.cash)}</p></div>
                <div className="ms"><p className="ms-l">POS Collected</p><p className="ms-v" style={{ color: 'var(--green)' }}>{fmtC(c.pos)}</p></div>
                <div className="ms"><p className="ms-l">Net Expected</p><p className="ms-v">{fmtC(c.netExpected)}</p></div>
                <div className="ms"><p className="ms-l">Cash Sent</p><p className="ms-v">{fmtC(c.sent)}</p></div>
              </div>
              <div className="prog mb4"><div className="prog-fill" style={{ width: `${pct}%`, background: 'var(--purple)' }} /></div>
              <p style={{ fontSize: 11, color: 'var(--t4)', marginBottom: 0 }}>{pct}% delivery rate</p>
              <div className="bc-foot">
                <span>Branch expenses: <strong style={{ color: 'var(--red)' }}>{fmtC(c.exp)}</strong></span>
                <span>Bonus payable: <strong>{fmtC(c.bonus)}</strong></span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function BossOrders({ filterP, fmtC, cfg, db }) {
  const all = filterP(db.orders);
  return (
    <>
      <div className="pg-hd"><p className="pg-title">All Orders</p><p className="pg-sub">{all.length} in period</p></div>
      <div className="pg-body">
        <DateFilter />
        <div className="card">
          <table className="tbl">
            <thead><tr><th>Customer</th><th>Rider</th><th>Branch</th><th>Status</th><th>Value</th><th>Date</th></tr></thead>
            <tbody>
              {all.length ? all.map(o => (
                <tr key={o.id}>
                  <td><div className="row" style={{ gap: 8 }}><Av name={o.rider || '?'} size={24} /><div><p style={{ fontWeight: 500 }}>{o.customerName}</p><p style={{ fontSize: 11, color: 'var(--t4)' }}>{o.phone}</p></div></div></td>
                  <td><p style={{ fontSize: 12 }}>{o.rider || '—'}</p></td>
                  <td><Badge text={o.branch} type="gray" /></td>
                  <td><SBadge status={o.status} /></td>
                  <td><p style={{ fontWeight: 600 }}>{fmtC(ot(o))}</p></td>
                  <td><p style={{ fontSize: 11, color: 'var(--t4)' }}>{o.date}</p></td>
                </tr>
              )) : (
                <tr><td colSpan={6}><div className="empty-box"><p className="empty-t">No orders</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function BossRiders({ fmtC, cfg, db }) {
  return (
    <>
      <div className="pg-hd"><p className="pg-title">Riders & Bonus</p></div>
      <div className="pg-body">
        {cfg.branches.map(b => {
          const riders = db.riders[b] || [];
          const total = riders.reduce((s, n) => s + calcBonus(getBonusCycleOrders(n, db).length, n, cfg), 0);
          return (
            <div key={b} className="card mb12">
              <div className="row-b mb14">
                <p style={{ fontSize: 14, fontWeight: 700 }}>{b}</p>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--purple)' }}>{fmtC(total)} bonus</span>
              </div>
              <p style={{ fontSize: 11, color: 'var(--t4)', marginBottom: 10 }}>Cycle: 14th → 15th next month</p>
              <table className="tbl">
                <thead><tr><th>Rider</th><th>Cycle Deliveries</th><th>Rate</th><th>Bonus</th></tr></thead>
                <tbody>
                  {riders.map(name => {
                    const cc = getBonusCycleOrders(name, db).length;
                    return (
                      <tr key={name}>
                        <td><div className="row" style={{ gap: 9 }}><Av name={name} size={26} /><p style={{ fontWeight: 500 }}>{name}</p></div></td>
                        <td><p style={{ fontWeight: 600 }}>{cc}</p></td>
                        <td><p style={{ fontSize: 12, color: 'var(--t3)' }}>{fmtC(bonusRate(cc, name, cfg))}/order</p></td>
                        <td><p style={{ fontWeight: 700, color: 'var(--purple)' }}>{fmtC(calcBonus(cc, name, cfg))}</p></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </>
  );
}

function BossRemittances({ filterP, fmtC, cfg, db }) {
  return (
    <>
      <div className="pg-hd"><p className="pg-title">Remittances & Fraud Watch</p></div>
      <div className="pg-body">
        <DateFilter />
        {cfg.branches.map(b => {
          const c = branchCalc(b, cfg, db, filterP);
          const rems = filterP(db.remittances.filter(r => r.branch === b));
          const shortPays = Object.values(db.payments).filter(p => p.branch === b && p.shortfall > 0);
          return (
            <div key={b} className="card mb14">
              <div className="row-b mb14">
                <p style={{ fontSize: 15, fontWeight: 700 }}>{b} Branch</p>
                {c.stillToSend > 0
                  ? <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--red)' }}>⚠ Owes {fmtC(c.stillToSend)}</span>
                  : <Badge text="Balanced" type="green" />}
              </div>
              <div className="g4 mb12">
                <div className="stat"><p className="stat-l">Cash</p><p className="stat-v" style={{ color: 'var(--blue)' }}>{fmtC(c.cash)}</p></div>
                <div className="stat"><p className="stat-l">POS (direct)</p><p className="stat-v" style={{ color: 'var(--green)' }}>{fmtC(c.pos)}</p></div>
                <div className="stat"><p className="stat-l">Expenses</p><p className="stat-v" style={{ color: 'var(--red)' }}>{fmtC(c.exp)}</p></div>
                <div className="stat"><p className="stat-l">Net (cash-exp)</p><p className="stat-v">{fmtC(c.netExpected)}</p></div>
              </div>
              {shortPays.length > 0 && (
                <div className="card-red mb12" style={{ padding: '12px 14px', borderRadius: 'var(--r-lg)' }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--red)', marginBottom: 8 }}>⚠ Rider Shortfalls</p>
                  <table className="tbl">
                    <thead><tr><th>Rider</th><th>Expected</th><th>Paid</th><th>Shortfall</th><th>Date</th></tr></thead>
                    <tbody>
                      {shortPays.map((p, i) => (
                        <tr key={i}>
                          <td><p style={{ fontWeight: 600 }}>{p.rider}</p></td>
                          <td>{fmtC(p.expected || 0)}</td>
                          <td style={{ color: 'var(--amber)', fontWeight: 600 }}>{fmtC(p.cash || 0)}</td>
                          <td style={{ color: 'var(--red)', fontWeight: 700 }}>{fmtC(p.shortfall)}</td>
                          <td style={{ fontSize: 11, color: 'var(--t4)' }}>{p.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <table className="tbl">
                <thead><tr><th>Amount</th><th>Bank</th><th>Account</th><th>TXN ID</th><th>Sent</th></tr></thead>
                <tbody>
                  {rems.length ? rems.map((r, i) => (
                    <tr key={i}>
                      <td><p style={{ fontWeight: 700, color: 'var(--green)' }}>{fmtC(r.amount)}</p></td>
                      <td>{r.bank || '—'}</td>
                      <td><code style={{ fontSize: 11 }}>{r.account || '—'}</code></td>
                      <td><code style={{ fontSize: 11 }}>{r.txID || '—'}</code></td>
                      <td style={{ fontSize: 11, color: 'var(--t4)' }}>{r.date}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} style={{ color: 'var(--t4)', fontSize: 12 }}>No remittance logged</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </>
  );
}

function BossVendorPay({ fmtC, cfg, db }) {
  const { setDb, vpSelected, setVpSelected } = useApp();
  const [payFields, setPayFields] = useState({ amount: '', date: TODAY, bank: '', account: '', accountName: '', txID: '' });

  function vendorCalc(vn) {
    const vOrds = db.orders.filter(o => gp(o).some(p => p.vendor === vn) && (o.status === 'Delivered' || o.status === 'Failed'));
    const del = vOrds.filter(o => o.status === 'Delivered');
    function vt(o) { return gp(o).filter(p => p.vendor === vn).reduce((s, p) => s + (Number(p.price) || 0) * (Number(p.qty) || 1), 0); }
    const totalVal = del.reduce((s, o) => s + vt(o), 0);
    const fees = vOrds.reduce((s, o) => s + (db.deliveryFees[o.id] || 0), 0);
    const net = Math.max(0, totalVal - fees);
    const paid = (db.vendorPayments[vn] || []).reduce((s, p) => s + p.amount, 0);
    const remaining = Math.max(0, net - paid);
    return { totalVal, fees, net, paid, remaining };
  }

  function savePayment() {
    const amount = Number(payFields.amount);
    if (!amount) { alert('Enter an amount'); return; }
    if (!payFields.txID) { alert('Transaction ID required'); return; }
    setDb(prev => ({
      ...prev,
      vendorPayments: {
        ...prev.vendorPayments,
        [vpSelected]: [...(prev.vendorPayments[vpSelected] || []), {
          amount, txID: payFields.txID, date: payFields.date,
          bank: payFields.bank, account: payFields.account, accountName: payFields.accountName,
        }],
      },
    }));
    setPayFields({ amount: '', date: TODAY, bank: '', account: '', accountName: '', txID: '' });
  }

  const c = vpSelected ? vendorCalc(vpSelected) : null;
  const payments = vpSelected ? (db.vendorPayments[vpSelected] || []) : [];
  const payStatus = c ? (c.remaining <= 0 && c.paid > 0 ? 'paid' : c.paid > 0 ? 'partial' : 'unpaid') : 'unpaid';

  return (
    <>
      <div className="pg-hd"><p className="pg-title">Vendor Payments</p><p className="pg-sub">Search vendor → see breakdown → log payment</p></div>
      <div className="pg-body">
        <div className="card mb16">
          <label className="lbl">Select Vendor</label>
          <select className="inp" value={vpSelected} onChange={e => setVpSelected(e.target.value)} style={{ flex: 1 }}>
            <option value="">— Choose vendor —</option>
            {cfg.vendors.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>

        {vpSelected && c && (
          <>
            <div className="navy-hero mb16">
              <div className="mini-grid">
                <div className="mini-card"><p className="mini-l">Total Delivered Value</p><p className="mini-v" style={{ color: '#93c5fd' }}>{fmtC(c.totalVal)}</p></div>
                <div className="mini-card"><p className="mini-l">Delivery Fees Deducted</p><p className="mini-v" style={{ color: '#fca5a5' }}>−{fmtC(c.fees)}</p></div>
                <div className="mini-card"><p className="mini-l">Net Payable</p><p className="mini-v" style={{ color: '#fff' }}>{fmtC(c.net)}</p></div>
                <div className="mini-card"><p className="mini-l">Amount Paid</p><p className="mini-v" style={{ color: '#6ee7b7' }}>{fmtC(c.paid)}</p></div>
              </div>
              <div className="bottom-strip">
                <div className="bs-cell"><p className="bs-l">Total Owed</p><p className="bs-v">{fmtC(c.net)}</p></div>
                <div className="bs-cell"><p className="bs-l">Amount Paid</p><p className="bs-v" style={{ color: '#6ee7b7' }}>{fmtC(c.paid)}</p></div>
                <div className="bs-cell"><p className="bs-l">Remaining</p><p className="bs-v" style={{ color: c.remaining > 0 ? '#fca5a5' : '#6ee7b7' }}>{c.remaining > 0 ? fmtC(c.remaining) : '₦0 ✓'}</p></div>
              </div>
            </div>

            <div className="row-b mb14">
              <p style={{ fontSize: 14, fontWeight: 600 }}>{vpSelected}</p>
              {payStatus === 'paid' ? <Badge text="✓ Fully Paid" type="green" /> : payStatus === 'partial' ? <Badge text="Partial Payment" type="amber" /> : <Badge text="Not Yet Paid" type="red" />}
            </div>

            {c.remaining > 0 && (
              <div className="card card-purple mb16">
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--purple)', marginBottom: 14 }}>Log Payment to {vpSelected}</p>
                <p style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 14 }}>Amount remaining: <strong style={{ color: 'var(--red)' }}>{fmtC(c.remaining)}</strong></p>
                <div className="g2 mb12">
                  <div><label className="lbl">Amount Paid</label><input className="inp" type="number" value={payFields.amount} onChange={e => setPayFields(f => ({ ...f, amount: e.target.value }))} /></div>
                  <div><label className="lbl">Date</label><input className="inp" type="date" value={payFields.date} onChange={e => setPayFields(f => ({ ...f, date: e.target.value }))} /></div>
                  <div><label className="lbl">Bank Name</label><input className="inp" value={payFields.bank} onChange={e => setPayFields(f => ({ ...f, bank: e.target.value }))} placeholder="GTBank, Opay..." /></div>
                  <div><label className="lbl">Account Number</label><input className="inp" value={payFields.account} onChange={e => setPayFields(f => ({ ...f, account: e.target.value }))} placeholder="0123456789" style={{ fontFamily: 'monospace' }} /></div>
                  <div><label className="lbl">Account Name</label><input className="inp" value={payFields.accountName} onChange={e => setPayFields(f => ({ ...f, accountName: e.target.value }))} placeholder="Vendor account name" /></div>
                  <div><label className="lbl">Transaction ID</label><input className="inp" value={payFields.txID} onChange={e => setPayFields(f => ({ ...f, txID: e.target.value }))} placeholder="TRF..." style={{ fontFamily: 'monospace' }} /></div>
                </div>
                <button className="btn btn-primary" onClick={savePayment}>Submit Payment →</button>
              </div>
            )}

            {payments.length > 0 && (
              <>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--t3)', marginBottom: 10 }}>Payment History</p>
                <div className="card">
                  <table className="tbl">
                    <thead><tr><th>Amount</th><th>Bank</th><th>Account</th><th>Account Name</th><th>TXN ID</th><th>Date</th></tr></thead>
                    <tbody>
                      {payments.map((p, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 700, color: 'var(--green)' }}>{fmtC(p.amount)}</td>
                          <td style={{ fontSize: 12 }}>{p.bank || '—'}</td>
                          <td><code style={{ fontSize: 11 }}>{p.account || '—'}</code></td>
                          <td style={{ fontSize: 12 }}>{p.accountName || '—'}</td>
                          <td><code style={{ fontSize: 11 }}>{p.txID || '—'}</code></td>
                          <td style={{ fontSize: 11, color: 'var(--t4)' }}>{p.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}

        {!vpSelected && (
          <div className="card">
            <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>All Vendors — Payment Status</p>
            <table className="tbl">
              <thead><tr><th>Vendor</th><th>Net Payable</th><th>Paid</th><th>Remaining</th><th>Status</th></tr></thead>
              <tbody>
                {cfg.vendors.map(v => {
                  const vc = vendorCalc(v);
                  const st = vc.remaining <= 0 && vc.paid > 0 ? 'paid' : vc.paid > 0 ? 'partial' : 'unpaid';
                  return (
                    <tr key={v}>
                      <td style={{ fontWeight: 600, cursor: 'pointer', color: 'var(--purple)' }} onClick={() => setVpSelected(v)}>{v}</td>
                      <td style={{ fontWeight: 600 }}>{fmtC(vc.net)}</td>
                      <td style={{ color: 'var(--green)', fontWeight: 600 }}>{fmtC(vc.paid)}</td>
                      <td style={{ color: vc.remaining > 0 ? 'var(--red)' : 'var(--t4)', fontWeight: 600 }}>{vc.remaining > 0 ? fmtC(vc.remaining) : '—'}</td>
                      <td>{st === 'paid' ? <Badge text="Paid" type="green" /> : st === 'partial' ? <Badge text="Partial" type="amber" /> : <Badge text="Unpaid" type="red" />}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function BossInventory({ cfg, db }) {
  const [sv, setSv] = useState('');
  const [sp, setSp] = useState('');

  const rows = cfg.vendors
    .filter(v => !sv || v.toLowerCase().includes(sv.toLowerCase()))
    .map(v => {
      const items = db.inventory[v] || {};
      const filt = Object.entries(items).filter(([p]) => !sp || p.toLowerCase().includes(sp.toLowerCase()));
      return { v, filt };
    })
    .filter(({ filt }) => filt.length > 0 || !sp);

  return (
    <>
      <div className="pg-hd"><p className="pg-title">Inventory</p></div>
      <div className="pg-body">
        <div className="g2 mb16">
          <div className="search-wrap"><span className="s-ico">🔍</span><input className="inp" placeholder="Search vendor..." value={sv} onChange={e => setSv(e.target.value)} /></div>
          <div className="search-wrap"><span className="s-ico">🔍</span><input className="inp" placeholder="Search product..." value={sp} onChange={e => setSp(e.target.value)} /></div>
        </div>
        {rows.map(({ v, filt }) => (
          <div key={v} className="mb14">
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--t3)', marginBottom: 8 }}>{v}</p>
            <div className="card card-sm">
              <table className="tbl">
                <thead><tr><th>Product</th><th>Received</th><th>Delivered</th><th>Remaining</th><th>Status</th></tr></thead>
                <tbody>
                  {filt.length ? filt.map(([p, d]) => {
                    const rem = (d.received || 0) - (d.delivered || 0);
                    return (
                      <tr key={p}>
                        <td><p style={{ fontWeight: 500 }}>{p}</p></td>
                        <td style={{ color: 'var(--green)', fontWeight: 600 }}>{d.received || 0}</td>
                        <td style={{ color: 'var(--purple)', fontWeight: 600 }}>{d.delivered || 0}</td>
                        <td style={{ fontWeight: 700, color: rem <= 0 ? 'var(--red)' : 'var(--text)' }}>{rem}</td>
                        <td><Badge text={rem <= 0 ? 'Out' : 'In stock'} type={rem <= 0 ? 'red' : 'green'} /></td>
                      </tr>
                    );
                  }) : (
                    <tr><td colSpan={5} style={{ fontSize: 12, color: 'var(--t4)' }}>No stock</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ))}
        {rows.length === 0 && <div className="empty-box"><p className="empty-t">No results</p></div>}
      </div>
    </>
  );
}

function BossTools({ setActiveTab, cfg }) {
  return (
    <>
      <div className="pg-hd"><p className="pg-title">CEO Tools</p></div>
      <div className="pg-body">
        <div className="g2 mb16">
          <div
            className="card"
            style={{ cursor: 'pointer' }}
            onClick={() => setActiveTab('dfees')}
          >
            <div style={{ width: 42, height: 42, borderRadius: 11, background: 'var(--amber-lt)', border: '1.5px solid var(--amber-bd)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 14 }}>🏍</div>
            <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 5 }}>Delivery Fees</p>
            <p style={{ fontSize: 12, color: 'var(--t4)' }}>Set fees for failed & delivered orders from rider manager</p>
          </div>
          <div
            className="card"
            style={{ cursor: 'pointer' }}
            onClick={() => setActiveTab('loans')}
          >
            <div style={{ width: 42, height: 42, borderRadius: 11, background: 'var(--purple-lt)', border: '1.5px solid var(--purple-bd)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 14 }}>💰</div>
            <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 5 }}>Staff Loans</p>
            <p style={{ fontSize: 12, color: 'var(--t4)' }}>Track loans and repayments</p>
          </div>
        </div>
        <div className="card" style={{ background: '#fafafa' }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--t3)', marginBottom: 12 }}>Staff Login Credentials</p>
          {[{ u: 'boss', p: 'boss@2025', r: 'Boss / CEO' }, ...cfg.branches.map(b => ({ u: `${b.toLowerCase()}_manager`, p: `${b.toLowerCase()}mgr2025`, r: `${b} Manager` }))].map(u => (
            <div key={u.u} className="row-b" style={{ padding: '6px 0', borderBottom: '1.5px solid var(--border-soft)' }}>
              <span style={{ fontSize: 12, color: 'var(--t3)' }}>{u.r}</span>
              <code style={{ fontSize: 11, color: 'var(--t4)' }}>{u.u} / {u.p}</code>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function BossDeliveryFees({ fmtC, cfg, db, setActiveTab }) {
  const { setDb } = useApp();
  const [feeInputs, setFeeInputs] = useState({});

  const eligible = db.orders.filter(o => o.status === 'Delivered' || o.status === 'Failed');
  const pending = eligible.filter(o => !db.deliveryFees[o.id]);
  const done = eligible.filter(o => db.deliveryFees[o.id]);

  function saveFee(orderId) {
    const v = Number(feeInputs[orderId] || 0);
    if (!v) { alert('Enter a fee amount'); return; }
    setDb(prev => ({ ...prev, deliveryFees: { ...prev.deliveryFees, [orderId]: v } }));
    setFeeInputs(prev => { const n = { ...prev }; delete n[orderId]; return n; });
  }

  function previewNet(orderId) {
    const total = ot(db.orders.find(o => o.id === orderId));
    const fee = Number(feeInputs[orderId] || 0);
    return fee > 0 ? Math.max(0, total - fee) : null;
  }

  return (
    <>
      <div className="pg-hd">
        <p className="pg-title">Delivery Fees</p>
        <p className="pg-sub">Fee deducted from total collected — both cash & POS. Address is key identifier.</p>
      </div>
      <div className="pg-body">
        <button className="btn btn-outline btn-sm mb16" onClick={() => setActiveTab('tools')}>← Back</button>
        {pending.length > 0 && (
          <>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>Awaiting fee · {pending.length}</p>
            {pending.map(o => {
              const total = ot(o);
              const net = previewNet(o.id);
              return (
                <div key={o.id} className="card mb8">
                  <div className="row-b mb4">
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>📍 {o.address}</p>
                      <p style={{ fontSize: 12, color: 'var(--t3)' }}>Rider: <strong>{o.rider}</strong> · <Badge text={o.branch} type="gray" /> · {o.date}</p>
                      <p style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>Customer: {o.customerName} · {o.phone}</p>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginTop: 6 }}>Order total: <span style={{ color: 'var(--purple)' }}>{fmtC(total)}</span></p>
                      <p style={{ fontSize: 11, color: 'var(--t4)' }}>{gp(o).map(p => p.name + ' ×' + p.qty + ' @ ' + fmtC(p.price)).join(' | ')}</p>
                    </div>
                    <div style={{ marginLeft: 12 }}><SBadge status={o.status} /></div>
                  </div>
                  <div className="divider" />
                  <div className="row" style={{ gap: 8, alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                      <label className="lbl">Delivery Fee — will be deducted from {fmtC(total)}</label>
                      <input className="inp" type="number" placeholder="e.g. 500" value={feeInputs[o.id] || ''} onChange={e => setFeeInputs(prev => ({ ...prev, [o.id]: e.target.value }))} />
                    </div>
                    <button className="btn btn-amber-soft btn-sm" onClick={() => saveFee(o.id)}>Save Fee</button>
                  </div>
                  {net !== null && <p style={{ marginTop: 6, fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>Net to vendor after fee: {fmtC(net)}</p>}
                </div>
              );
            })}
          </>
        )}
        {done.length > 0 && (
          <>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '.07em', margin: '16px 0 10px' }}>Fee set · {done.length}</p>
            <div className="card">
              <table className="tbl">
                <thead><tr><th>Address</th><th>Rider</th><th>Status</th><th>Order Total</th><th>Fee</th><th>Net to Vendor</th></tr></thead>
                <tbody>
                  {done.map(o => {
                    const total = ot(o); const fee = db.deliveryFees[o.id];
                    return (
                      <tr key={o.id}>
                        <td><p style={{ fontWeight: 600, fontSize: 13 }}>📍 {o.address}</p><p style={{ fontSize: 11, color: 'var(--t4)' }}>{o.customerName}</p></td>
                        <td style={{ fontSize: 12 }}>{o.rider}</td>
                        <td><SBadge status={o.status} /></td>
                        <td style={{ fontWeight: 600 }}>{fmtC(total)}</td>
                        <td style={{ fontWeight: 700, color: 'var(--red)' }}>−{fmtC(fee)}</td>
                        <td style={{ fontWeight: 700, color: 'var(--green)' }}>{fmtC(Math.max(0, total - fee))}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
        {!eligible.length && <div className="empty-box"><p className="empty-t">No orders yet</p><p>Delivered and failed orders appear here once logged by rider manager</p></div>}
      </div>
    </>
  );
}

function BossLoans({ fmtC, db, setActiveTab }) {
  const { setDb } = useApp();
  const [newLoan, setNewLoan] = useState({ name: '', total: '', salary: '', date: TODAY, note: '' });
  const active = db.loans.filter(l => l.status !== 'cleared');
  const cleared = db.loans.filter(l => l.status === 'cleared');
  const owed = active.reduce((s, l) => { const r = (l.repayments || []).reduce((rs, p) => rs + p.amount, 0); return s + Math.max(0, l.total - r); }, 0);

  function saveLoan() {
    if (!newLoan.name || !newLoan.total) return;
    setDb(prev => ({ ...prev, loans: [...prev.loans, { id: Date.now(), ...newLoan, total: Number(newLoan.total), salary: Number(newLoan.salary) || 0, repayments: [], status: 'active' }] }));
    setNewLoan({ name: '', total: '', salary: '', date: TODAY, note: '' });
  }

  function saveRepay(lid, amount, date) {
    if (!amount) return;
    setDb(prev => ({
      ...prev,
      loans: prev.loans.map(l => {
        if (String(l.id) !== String(lid)) return l;
        const repayments = [...(l.repayments || []), { amount: Number(amount), date }];
        const repaid = repayments.reduce((s, r) => s + r.amount, 0);
        return { ...l, repayments, status: repaid >= l.total ? 'cleared' : 'active' };
      }),
    }));
  }

  return (
    <>
      <div className="pg-hd"><p className="pg-title">Staff Loans</p></div>
      <div className="pg-body">
        <button className="btn btn-outline btn-sm mb16" onClick={() => setActiveTab('tools')}>← Back</button>
        {owed > 0 && (
          <div className="hero-grad mb20">
            <div className="mesh"><svg viewBox="0 0 800 300" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><ellipse cx="600" cy="80" rx="320" ry="240" fill="url(#g1)"/><ellipse cx="700" cy="220" rx="260" ry="280" fill="url(#g2)"/></svg></div>
            <p style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,.55)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6, position: 'relative' }}>Total outstanding</p>
            <p style={{ fontSize: 32, fontWeight: 700, color: '#fff', letterSpacing: '-.03em', position: 'relative' }}>{fmtC(owed)}</p>
          </div>
        )}
        <div className="card card-purple mb16">
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 14 }}>Add New Loan</p>
          <div className="g2 mb12">
            <div><label className="lbl">Staff Name</label><input className="inp" value={newLoan.name} placeholder="Full name" onChange={e => setNewLoan(l => ({ ...l, name: e.target.value }))} /></div>
            <div><label className="lbl">Loan Amount</label><input className="inp" type="number" value={newLoan.total} placeholder="0" onChange={e => setNewLoan(l => ({ ...l, total: e.target.value }))} /></div>
            <div><label className="lbl">Monthly Salary</label><input className="inp" type="number" value={newLoan.salary} placeholder="0" onChange={e => setNewLoan(l => ({ ...l, salary: e.target.value }))} /></div>
            <div><label className="lbl">Date</label><input className="inp" type="date" value={newLoan.date} onChange={e => setNewLoan(l => ({ ...l, date: e.target.value }))} /></div>
            <div className="span2"><label className="lbl">Note</label><input className="inp" value={newLoan.note} placeholder="Reason..." onChange={e => setNewLoan(l => ({ ...l, note: e.target.value }))} /></div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={saveLoan}>Add Loan</button>
        </div>
        <div className="col">{active.map(l => <LoanCard key={l.id} loan={l} fmtC={fmtC} onRepay={saveRepay} />)}</div>
        {cleared.length > 0 && (
          <>
            <p style={{ fontSize: 11, color: 'var(--t4)', margin: '16px 0 8px' }}>Cleared · {cleared.length}</p>
            <div className="col">
              {cleared.map(l => (
                <div key={l.id} className="card card-green row-b">
                  <div><p style={{ fontWeight: 600 }}>{l.name}</p><p style={{ fontSize: 11, color: 'var(--t4)' }}>{l.date} · {fmtC(l.total)}</p></div>
                  <Badge text="Cleared" type="green" />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}

function LoanCard({ loan: l, fmtC, onRepay }) {
  const [repayAmt, setRepayAmt] = useState('');
  const [repayDate, setRepayDate] = useState(TODAY);
  const repaid = (l.repayments || []).reduce((s, r) => s + r.amount, 0);
  const bal = Math.max(0, l.total - repaid);
  const pct = l.total > 0 ? Math.min(100, Math.round((repaid / l.total) * 100)) : 0;

  return (
    <div className="card mb8">
      <div className="row-b mb12">
        <div>
          <p style={{ fontWeight: 700, fontSize: 15 }}>{l.name}</p>
          <p style={{ fontSize: 11, color: 'var(--t4)' }}>{l.date}{l.note ? ' · ' + l.note : ''}{l.salary ? ' · 50%=' + fmtC(l.salary * .5) : ''}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--red)' }}>{fmtC(bal)}</p>
          <p style={{ fontSize: 11, color: 'var(--t4)' }}>of {fmtC(l.total)}</p>
        </div>
      </div>
      <div className="prog mb4"><div className="prog-fill" style={{ width: `${pct}%`, background: 'var(--purple)' }} /></div>
      <p style={{ fontSize: 11, color: 'var(--t4)', marginBottom: 12 }}>{fmtC(repaid)} repaid · {pct}%</p>
      {(l.repayments || []).map((r, i) => (
        <div key={i} className="row-b" style={{ padding: '4px 0', borderBottom: '1.5px solid var(--border-soft)' }}>
          <span style={{ fontSize: 12, color: 'var(--t3)' }}>{r.date}</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--green)' }}>+{fmtC(r.amount)}</span>
        </div>
      ))}
      <div className="g2 mt12 mb8">
        <div><label className="lbl">Repayment</label><input className="inp" type="number" value={repayAmt} placeholder="0" onChange={e => setRepayAmt(e.target.value)} /></div>
        <div><label className="lbl">Date</label><input className="inp" type="date" value={repayDate} onChange={e => setRepayDate(e.target.value)} /></div>
      </div>
      <button className="btn btn-green btn-sm btn-full" onClick={() => { onRepay(l.id, repayAmt, repayDate); setRepayAmt(''); }}>+ Log Repayment</button>
    </div>
  );
}
