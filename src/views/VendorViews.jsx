import { useRef } from 'react';
import { useApp } from '../context/AppContext';
import { fmt, filterPeriod, gp, ot, TODAY } from '../utils/helpers';
import { Badge } from '../components/ui';
import DateFilter from '../components/DateFilter';

function useFP() {
  const { period, rangeFrom, rangeTo } = useApp();
  return list => filterPeriod(list, period, rangeFrom, rangeTo);
}

function useFmt() {
  const { cfg } = useApp();
  return n => fmt(n, cfg.currency);
}

export default function VendorViews({ tabId }) {
  const { session } = useApp();
  const filterP = useFP();
  const fmtC = useFmt();
  const vn = session.vendorName;

  if (tabId === 'deliveries') return <VendorDeliveries filterP={filterP} fmtC={fmtC} vn={vn} />;
  if (tabId === 'invoice') return <VendorInvoice filterP={filterP} fmtC={fmtC} vn={vn} />;
  return null;
}

function useVendorCalc(vn, db) {
  function vt(o) { return gp(o).filter(p => p.vendor === vn).reduce((s, p) => s + (Number(p.price) || 0) * (Number(p.qty) || 1), 0); }
  const allVOrds = db.orders.filter(o => gp(o).some(p => p.vendor === vn) && (o.status === 'Delivered' || o.status === 'Failed'));
  const allDel = allVOrds.filter(o => o.status === 'Delivered');
  const allTotalVal = allDel.reduce((s, o) => s + vt(o), 0);
  const allFees = allVOrds.reduce((s, o) => s + (db.deliveryFees[o.id] || 0), 0);
  const allNet = Math.max(0, allTotalVal - allFees);
  const totalPaid = (db.vendorPayments[vn] || []).reduce((s, p) => s + p.amount, 0);
  const amountRemaining = Math.max(0, allNet - totalPaid);
  const payStatus = amountRemaining <= 0 && totalPaid > 0 ? 'paid' : totalPaid > 0 ? 'partial' : 'unpaid';
  return { allTotalVal, allFees, allNet, totalPaid, amountRemaining, payStatus, vt };
}

function VendorDeliveries({ filterP, fmtC, vn }) {
  const { db, cfg } = useApp();
  const { allTotalVal, allFees, allNet, totalPaid, amountRemaining, payStatus } = useVendorCalc(vn, db);

  function vt(o) { return gp(o).filter(p => p.vendor === vn).reduce((s, p) => s + (Number(p.price) || 0) * (Number(p.qty) || 1), 0); }
  const vOrds = filterP(db.orders.filter(o => gp(o).some(p => p.vendor === vn)));
  const del = vOrds.filter(o => o.status === 'Delivered');
  const fail = vOrds.filter(o => o.status === 'Failed');
  const notDel = vOrds.filter(o => o.status === 'Not Delivered');
  const periodVal = del.reduce((s, o) => s + vt(o), 0);
  const periodFees = [...del, ...fail].reduce((s, o) => s + (db.deliveryFees[o.id] || 0), 0);
  const payments = db.vendorPayments[vn] || [];

  return (
    <>
      <div className="pg-hd"><p className="pg-title">{vn}</p><p className="pg-sub">Payment status & delivery report</p></div>
      <div className="pg-body">
        <div className="navy-hero mb20">
          <div className="mini-grid">
            <div className="mini-card"><p className="mini-l">Total Owed to You</p><p className="mini-v" style={{ color: '#fff' }}>{fmtC(allNet)}</p></div>
            <div className="mini-card"><p className="mini-l">Amount Paid</p><p className="mini-v" style={{ color: '#6ee7b7' }}>{fmtC(totalPaid)}</p></div>
            <div className="mini-card"><p className="mini-l">Amount Remaining</p><p className="mini-v" style={{ color: amountRemaining > 0 ? '#fca5a5' : '#6ee7b7' }}>{amountRemaining > 0 ? fmtC(amountRemaining) : '₦0 ✓'}</p></div>
            <div className="mini-card">
              <p className="mini-l">Payment Status</p>
              <p className="mini-v" style={{ color: payStatus === 'paid' ? '#6ee7b7' : payStatus === 'partial' ? '#fde68a' : '#fca5a5' }}>
                {payStatus === 'paid' ? '✓ Fully Paid' : payStatus === 'partial' ? 'Partial' : 'Not Yet Paid'}
              </p>
            </div>
          </div>
          <div className="bottom-strip">
            <div className="bs-cell"><p className="bs-l">Delivered Value</p><p className="bs-v">{fmtC(allTotalVal)}</p></div>
            <div className="bs-cell"><p className="bs-l">Fees Deducted</p><p className="bs-v" style={{ color: '#fca5a5' }}>−{fmtC(allFees)}</p></div>
            <div className="bs-cell"><p className="bs-l">Net Payable</p><p className="bs-v" style={{ color: '#93c5fd' }}>{fmtC(allNet)}</p></div>
          </div>
        </div>

        {payments.length > 0 && (
          <>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>Payments Received</p>
            <div className="card mb20">
              <table className="tbl">
                <thead><tr><th>Amount</th><th>Bank</th><th>Account</th><th>TXN ID</th><th>Date</th></tr></thead>
                <tbody>
                  {payments.map((p, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 700, color: 'var(--green)' }}>{fmtC(p.amount)}</td>
                      <td style={{ fontSize: 12 }}>{p.bank || '—'}</td>
                      <td><code style={{ fontSize: 11 }}>{p.account || '—'}</code></td>
                      <td><code style={{ fontSize: 11 }}>{p.txID || '—'}</code></td>
                      <td style={{ fontSize: 11, color: 'var(--t4)' }}>{p.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <DateFilter />
        <div className="g3 mb16">
          <div className="stat"><p className="stat-l">Delivered</p><p className="stat-v" style={{ color: 'var(--green)' }}>{del.length}</p><p className="stat-s">{fmtC(periodVal)}</p></div>
          <div className="stat"><p className="stat-l">Failed</p><p className="stat-v" style={{ color: 'var(--red)' }}>{fail.length}</p></div>
          <div className="stat"><p className="stat-l">Not Delivered</p><p className="stat-v">{notDel.length}</p></div>
        </div>

        {del.length > 0 && (
          <>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>Delivered Orders — Period</p>
            <div className="card">
              <table className="tbl">
                <thead><tr><th>Date</th><th>Rider</th><th>Products</th><th>Value</th><th>Fee</th><th>Net</th></tr></thead>
                <tbody>
                  {del.map(o => {
                    const v = vt(o); const fee = db.deliveryFees[o.id] || 0;
                    return (
                      <tr key={o.id}>
                        <td style={{ fontSize: 12, color: 'var(--t4)' }}>{o.date}</td>
                        <td style={{ fontSize: 12 }}>{o.rider}</td>
                        <td style={{ fontSize: 12, color: 'var(--t3)' }}>{gp(o).filter(p => p.vendor === vn).map(p => p.name + ' ×' + p.qty).join(', ')}</td>
                        <td style={{ fontWeight: 600 }}>{fmtC(v)}</td>
                        <td style={{ color: 'var(--red)', fontSize: 12 }}>{fee ? '−' + fmtC(fee) : '—'}</td>
                        <td style={{ fontWeight: 700, color: 'var(--green)' }}>{fmtC(Math.max(0, v - fee))}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
        {!del.length && <div className="empty-box"><p className="empty-t">No deliveries in this period</p></div>}
      </div>
    </>
  );
}

function VendorInvoice({ filterP, fmtC, vn }) {
  const { cfg, db, session, period } = useApp();
  const { allNet, totalPaid, amountRemaining, payStatus } = useVendorCalc(vn, db);
  const invoiceRef = useRef();

  function vt(o) { return gp(o).filter(p => p.vendor === vn).reduce((s, p) => s + (Number(p.price) || 0) * (Number(p.qty) || 1), 0); }
  const vOrds = filterP(db.orders.filter(o => gp(o).some(p => p.vendor === vn)));
  const del = vOrds.filter(o => o.status === 'Delivered');
  const fail = vOrds.filter(o => o.status === 'Failed');
  const notDel = vOrds.filter(o => o.status === 'Not Delivered');
  const periodVal = del.reduce((s, o) => s + vt(o), 0);
  const periodFees = [...del, ...fail].reduce((s, o) => s + (db.deliveryFees[o.id] || 0), 0);

  function downloadInvoice() {
    const el = invoiceRef.current;
    if (!el) return;
    if (typeof window.html2canvas === 'undefined') { alert('Download library not loaded. Please check internet connection.'); return; }
    window.html2canvas(el, { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false }).then(canvas => {
      const link = document.createElement('a');
      link.download = `Invoice_${vn}_${TODAY}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }).catch(() => alert('Download failed. Try again.'));
  }

  return (
    <>
      <div className="pg-hd">
        <p className="pg-title">Invoice</p>
        <div className="row" style={{ gap: 8, marginTop: 8 }}>
          <button className="btn btn-primary btn-sm" onClick={downloadInvoice}>⬇ Download as Image</button>
        </div>
      </div>
      <div className="pg-body">
        <DateFilter />
        <div ref={invoiceRef} className="inv" style={{ background: '#fff' }}>
          <div className="inv-head">
            <div className="inv-mesh">
              <svg viewBox="0 0 800 200" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <ellipse cx="580" cy="60" rx="320" ry="180" fill="url(#g1)" opacity=".8"/>
                <ellipse cx="700" cy="150" rx="260" ry="200" fill="url(#g2)" opacity=".85"/>
                <ellipse cx="450" cy="180" rx="300" ry="160" fill="url(#g3)" opacity=".75"/>
              </svg>
            </div>
            <div style={{ position: 'relative' }}>
              <div className="row mb8" style={{ gap: 9 }}>
                <div style={{ width: 28, height: 28, background: 'var(--purple)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="15" height="10" viewBox="0 0 80 56" fill="none"><path d="M10 6L10 50" stroke="white" strokeWidth="10" strokeLinecap="round"/><path d="M10 28L34 6" stroke="white" strokeWidth="10" strokeLinecap="round"/><path d="M10 28L36 50" stroke="rgba(255,255,255,.55)" strokeWidth="10" strokeLinecap="round"/></svg>
                </div>
                <span style={{ fontSize: 14, fontWeight: 700 }}>{cfg.company}</span>
              </div>
              <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '.09em' }}>Vendor Invoice</p>
            </div>
            <div style={{ position: 'relative', textAlign: 'right' }}>
              <p style={{ fontSize: 11, color: 'var(--t4)' }}>Issued</p>
              <p style={{ fontSize: 12, fontWeight: 600 }}>{TODAY}</p>
            </div>
          </div>
          <div className="inv-body">
            <p style={{ fontSize: 10, color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 5 }}>Invoice for</p>
            <p style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-.03em', marginBottom: 3 }}>{vn}</p>
            <p style={{ fontSize: 12, color: 'var(--t4)', marginBottom: 20 }}>Period: {period} &nbsp;·&nbsp; Generated: {TODAY}</p>

            {del.length > 0 && (
              <>
                <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8 }}>Delivered Orders</p>
                <table className="tbl" style={{ marginBottom: 16 }}>
                  <thead><tr><th>Date</th><th>Rider</th><th>Products</th><th style={{ textAlign: 'right' }}>Value</th><th style={{ textAlign: 'right' }}>Fee</th><th style={{ textAlign: 'right' }}>Net</th></tr></thead>
                  <tbody>
                    {del.map(o => {
                      const v = vt(o); const fee = db.deliveryFees[o.id] || 0;
                      return (
                        <tr key={o.id}>
                          <td style={{ fontSize: 11, color: 'var(--t4)' }}>{o.date}</td>
                          <td style={{ fontSize: 12 }}>{o.rider}</td>
                          <td style={{ fontSize: 12, color: 'var(--t3)' }}>{gp(o).filter(p => p.vendor === vn).map(p => p.name + ' ×' + p.qty).join(', ')}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmtC(v)}</td>
                          <td style={{ textAlign: 'right', color: 'var(--red)', fontSize: 12 }}>{fee ? '−' + fmtC(fee) : '—'}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--green)' }}>{fmtC(Math.max(0, v - fee))}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </>
            )}

            <div style={{ background: '#f8f9fa', borderRadius: 'var(--r-lg)', padding: 16, marginBottom: 16 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr><td style={{ fontSize: 13, color: 'var(--t3)', padding: '5px 0' }}>Total Delivered Value</td><td style={{ textAlign: 'right', fontWeight: 600 }}>{fmtC(periodVal)}</td></tr>
                  <tr><td style={{ fontSize: 13, color: 'var(--red)', padding: '5px 0' }}>Delivery Fees Deducted</td><td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--red)' }}>−{fmtC(periodFees)}</td></tr>
                  {fail.length > 0 && <tr><td style={{ fontSize: 12, color: 'var(--t4)', padding: '5px 0' }}>Failed orders (charged)</td><td style={{ textAlign: 'right', fontSize: 12, color: 'var(--t4)' }}>{fail.length} orders</td></tr>}
                  {notDel.length > 0 && <tr><td style={{ fontSize: 12, color: 'var(--t4)', padding: '5px 0' }}>Not delivered (no charge)</td><td style={{ textAlign: 'right', fontSize: 12, color: 'var(--t4)' }}>{notDel.length} orders</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
          <div className="inv-foot">
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--t3)' }}>Net payable for this period</p>
            <p style={{ fontSize: 26, fontWeight: 700, color: 'var(--purple)', letterSpacing: '-.03em' }}>{fmtC(Math.max(0, periodVal - periodFees))}</p>
          </div>
          <div style={{ background: '#fafafa', borderTop: '1.5px solid var(--border-soft)', padding: '16px 28px' }}>
            <div className="row-b">
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--t3)', marginBottom: 2 }}>Overall payment status (all time)</p>
                <p style={{ fontSize: 12, color: 'var(--t4)' }}>Total owed: {fmtC(allNet)} · Paid: {fmtC(totalPaid)} · Remaining: {fmtC(amountRemaining)}</p>
              </div>
              {payStatus === 'paid' ? <Badge text="✓ Fully Paid" type="green" /> : payStatus === 'partial' ? <Badge text="Partial Payment" type="amber" /> : <Badge text="Not Yet Paid" type="red" />}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
