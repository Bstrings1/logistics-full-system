import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { fmt, gp, filterPeriod, REVENUE_STATUSES } from '../utils/helpers';
import { SBadge } from '../components/ui';
import DateFilter from '../components/DateFilter';

function useFP() {
  const { period, rangeFrom, rangeTo } = useApp();
  return list => filterPeriod(list, period, rangeFrom, rangeTo);
}

export default function VendorViews({ tabId }) {
  const { session } = useApp();
  const vn = session.vendorName;
  const filterP = useFP();

  if (tabId === 'deliveries') return <VendorDeliveries vn={vn} filterP={filterP} />;
  if (tabId === 'invoice') return <VendorInvoice vn={vn} filterP={filterP} />;
  return null;
}

function VendorDeliveries({ vn, filterP }) {
  const { db, cfg } = useApp();

  const allOrders = db.orders.filter(o => gp(o).some(p => p.vendor === vn));
  const orders = filterP(allOrders).sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  function vt(o) {
    return gp(o).filter(p => p.vendor === vn).reduce((s, p) => s + (Number(p.price) || 0), 0);
  }

  const delivered = orders.filter(o => REVENUE_STATUSES.includes(o.status));
  const totalVal = delivered.reduce((s, o) => s + vt(o), 0);

  return (
    <div style={{ padding: '24px 20px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-.02em', marginBottom: 4 }}>Deliveries</h2>
        <p style={{ fontSize: 13, color: 'var(--t3)' }}>{vn}</p>
      </div>

      <DateFilter />

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div className="card" style={{ flex: 1, minWidth: 140, padding: '14px 18px' }}>
          <p style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>Total Orders</p>
          <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy)', marginTop: 4 }}>{orders.length}</p>
        </div>
        <div className="card" style={{ flex: 1, minWidth: 140, padding: '14px 18px' }}>
          <p style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>Delivered</p>
          <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--green)', marginTop: 4 }}>{delivered.length}</p>
        </div>
        <div className="card" style={{ flex: 1, minWidth: 140, padding: '14px 18px' }}>
          <p style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>Total Value</p>
          <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--purple)', marginTop: 4 }}>{fmt(totalVal, cfg.currency)}</p>
        </div>
      </div>

      {orders.length === 0 && (
        <div className="empty-box"><p className="empty-t">No deliveries in this period</p></div>
      )}

      <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>Date</th>
              <th>Customer</th>
              <th>Phone</th>
              <th>Products</th>
              <th>Value</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => {
              const prods = gp(o).filter(p => p.vendor === vn);
              return (
                <tr key={o.id}>
                  <td style={{ fontSize: 12, color: 'var(--t3)', whiteSpace: 'nowrap' }}>{o.date}</td>
                  <td style={{ fontWeight: 600 }}>{o.customerName}</td>
                  <td style={{ fontSize: 12, color: 'var(--t3)' }}>{o.phone || '—'}</td>
                  <td style={{ fontSize: 12 }}>
                    {prods.map((p, i) => (
                      <span key={i}>
                        {p.name}{p.qty > 1 ? ` ×${p.qty}` : ''}{i < prods.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </td>
                  <td style={{ fontWeight: 700 }}>{fmt(vt(o), cfg.currency)}</td>
                  <td><SBadge status={o.status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function VendorInvoice({ vn, filterP }) {
  const { db, cfg } = useApp();
  const [branch, setBranch] = useState('all');

  function vt(o) {
    return gp(o).filter(p => p.vendor === vn).reduce((s, p) => s + (Number(p.price) || 0), 0);
  }

  let orders = db.orders.filter(o =>
    gp(o).some(p => p.vendor === vn) && REVENUE_STATUSES.includes(o.status)
  );
  if (branch !== 'all') orders = orders.filter(o => o.branch === branch);
  orders = filterP(orders).sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const grandTotal = orders.reduce((s, o) => s + vt(o), 0);
  const fees = orders.reduce((s, o) => s + (db.deliveryFees[o.id] || 0), 0);
  const payments = db.vendorPayments[vn] || [];
  const totalPaid = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const outstanding = Math.max(0, grandTotal - fees - totalPaid);

  const branches = [...new Set(db.orders.filter(o => gp(o).some(p => p.vendor === vn)).map(o => o.branch))];

  return (
    <div style={{ padding: '24px 20px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-.02em', marginBottom: 4 }}>Invoice</h2>
        <p style={{ fontSize: 13, color: 'var(--t3)' }}>{vn}</p>
      </div>

      <DateFilter />

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button className={`btn btn-sm ${branch === 'all' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setBranch('all')}>All Branches</button>
        {branches.map(b => (
          <button key={b} className={`btn btn-sm ${branch === b ? 'btn-primary' : 'btn-outline'}`} onClick={() => setBranch(b)}>{b}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Gross Value', val: grandTotal, color: 'var(--navy)' },
          { label: 'Delivery Fees', val: fees, color: 'var(--red)' },
          { label: 'Net Payable', val: Math.max(0, grandTotal - fees), color: 'var(--purple)' },
          { label: 'Paid', val: totalPaid, color: 'var(--green)' },
          { label: 'Outstanding', val: outstanding, color: outstanding > 0 ? 'var(--red)' : 'var(--green)' },
        ].map(({ label, val, color }) => (
          <div key={label} className="card" style={{ padding: '14px 18px' }}>
            <p style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>{label}</p>
            <p style={{ fontSize: 18, fontWeight: 800, color, marginTop: 4 }}>{fmt(val, cfg.currency)}</p>
          </div>
        ))}
      </div>

      {orders.length === 0 && (
        <div className="empty-box"><p className="empty-t">No delivered orders in this period</p></div>
      )}

      <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>Date</th>
              <th>Customer</th>
              <th>Phone</th>
              <th>Branch</th>
              <th>Products</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => {
              const prods = gp(o).filter(p => p.vendor === vn);
              return (
                <tr key={o.id}>
                  <td style={{ fontSize: 12, color: 'var(--t3)', whiteSpace: 'nowrap' }}>{o.date}</td>
                  <td style={{ fontWeight: 600 }}>{o.customerName}</td>
                  <td style={{ fontSize: 12, color: 'var(--t3)' }}>{o.phone || '—'}</td>
                  <td><span style={{ fontSize: 11, background: 'var(--purple-lt)', color: 'var(--purple)', padding: '2px 8px', borderRadius: 99, fontWeight: 700 }}>{o.branch}</span></td>
                  <td style={{ fontSize: 12 }}>
                    {prods.map((p, i) => (
                      <span key={i}>
                        {p.name}{p.qty > 1 ? ` ×${p.qty}` : ''}{i < prods.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </td>
                  <td style={{ fontWeight: 700 }}>{fmt(vt(o), cfg.currency)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {payments.length > 0 && (
        <div className="card mt16">
          <p className="cfg-sec">Payment History</p>
          <table className="tbl">
            <thead><tr><th>Date</th><th>Amount</th><th>Bank</th><th>TXN ID</th></tr></thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id}>
                  <td style={{ fontSize: 12, color: 'var(--t3)' }}>{p.date}</td>
                  <td style={{ fontWeight: 700, color: 'var(--green)' }}>{fmt(p.amount, cfg.currency)}</td>
                  <td style={{ fontSize: 12 }}>{p.bank || '—'}</td>
                  <td><code style={{ fontSize: 11 }}>{p.txID || '—'}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
