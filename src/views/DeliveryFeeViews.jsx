import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ot, gp } from '../utils/helpers';
import { SBadge } from '../components/ui';

const CSS = `
.df *{box-sizing:border-box}
.df{font-family:'Plus Jakarta Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.df-sec{font-size:11px;font-weight:700;color:#858cab;letter-spacing:.12em;text-transform:uppercase;margin:20px 0 10px}
.df-card{background:#fff;border:1px solid #eef0f7;border-radius:14px;margin-bottom:10px;padding:18px;box-shadow:0 1px 2px rgba(11,18,48,.03)}
.df-lbl{font-size:11px;font-weight:700;color:#858cab;letter-spacing:.06em;text-transform:uppercase;margin-bottom:4px;display:block}
.df-inp{width:100%;border:1px solid #dde1ef;border-radius:8px;padding:9px 12px;font-size:14px;font-family:inherit;outline:none;transition:border .12s}
.df-inp:focus{border-color:var(--purple)}
.df-btn{border:0;border-radius:8px;padding:9px 18px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;background:var(--purple);color:#fff;transition:opacity .12s}
.df-btn:hover{opacity:.88}
.df-btn.amber{background:#f59e0b;color:#fff}
.df-tw{background:#fff;border:1px solid #eef0f7;border-radius:14px;overflow-x:auto;box-shadow:0 1px 2px rgba(11,18,48,.03)}
.df-tw table{width:100%;border-collapse:collapse;font-size:13.5px;min-width:600px}
.df-tw thead th{text-align:left;font-size:11px;font-weight:700;color:#858cab;letter-spacing:.1em;padding:12px 16px;background:#f6f7fb;border-bottom:1px solid #eef0f7;text-transform:uppercase;white-space:nowrap}
.df-tw tbody td{padding:13px 16px;border-bottom:1px solid #eef0f7;color:#3a4267;vertical-align:middle}
.df-tw tbody tr:last-child td{border-bottom:0}
.df-tw tbody tr:hover{background:#f6f7fb}
.df-money{font-family:'JetBrains Mono',monospace;font-weight:800;font-variant-numeric:tabular-nums;letter-spacing:-.02em}
.df-money.ok{color:#1fa67a}
.df-money.bad{color:#e0425a}
`;

function Money({ children, tone }) {
  return <span className={`df-money${tone ? ' ' + tone : ''}`}>{children}</span>;
}

export default function DeliveryFeeViews() {
  const { db, setDb, cfg } = useApp();
  const [feeInputs, setFeeInputs] = useState({});
  const [search, setSearch] = useState('');

  const fmt = v => (cfg.currency || '₦') + Number(v || 0).toLocaleString();

  const eligible = db.orders.filter(o =>
    o.status && o.status !== 'Not Delivered' && o.status !== 'Unassigned' && o.status !== 'Pending'
  );

  const q = search.trim().toLowerCase();
  const filter = list => q
    ? list.filter(o =>
        o.address?.toLowerCase().includes(q) ||
        o.customerName?.toLowerCase().includes(q) ||
        o.branch?.toLowerCase().includes(q) ||
        o.rider?.toLowerCase().includes(q)
      )
    : list;

  const pending = filter(eligible.filter(o => !db.deliveryFees[o.id]));
  const done = filter(eligible.filter(o => db.deliveryFees[o.id]));

  function saveFee(orderId) {
    const v = Number(feeInputs[orderId] || 0);
    if (!v) { alert('Enter a fee amount'); return; }
    setDb(prev => ({ ...prev, deliveryFees: { ...prev.deliveryFees, [orderId]: v } }));
    setFeeInputs(prev => { const n = { ...prev }; delete n[orderId]; return n; });
  }

  return (
    <div className="df">
      <style>{CSS}</style>
      <div className="pg-hd">
        <p className="pg-title">Delivery Fees</p>
        <p className="pg-sub">Set delivery fees for each order. Fee is deducted from vendor payout.</p>
      </div>
      <div className="pg-body">
        <input
          className="df-inp"
          style={{ marginBottom: 16, maxWidth: 340 }}
          placeholder="Search by address, customer, branch, rider…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        {pending.length > 0 && (
          <>
            <div className="df-sec" style={{ color: '#e89b2f' }}>Awaiting fee · {pending.length}</div>
            {pending.map(o => {
              const total = ot(o);
              const fee = Number(feeInputs[o.id] || 0);
              const net = fee > 0 ? Math.max(0, total - fee) : null;
              return (
                <div key={o.id} className="df-card">
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 15, fontWeight: 700 }}>📍 {o.address}</span>
                      <SBadge status={o.status} />
                    </div>
                    <div style={{ fontSize: 12, color: '#5b6385' }}>
                      Rider: <strong>{o.rider}</strong> · {o.branch} · {o.date}
                    </div>
                    <div style={{ fontSize: 12, color: '#5b6385', marginTop: 2 }}>
                      {o.customerName}{o.phone ? ` · ${o.phone}` : ''}
                    </div>
                    <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {gp(o).map((p, i) => (
                        <span key={i} style={{ fontSize: 11, background: '#f0f4ff', color: '#3730a3', borderRadius: 4, padding: '2px 7px', fontWeight: 600 }}>
                          {p.name} ×{p.qty || 1}
                        </span>
                      ))}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginTop: 6 }}>
                      Order total: <span style={{ color: '#1f2fc4' }}>{fmt(total)}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                      <label className="df-lbl">Delivery Fee</label>
                      <input
                        className="df-inp"
                        type="number"
                        placeholder="e.g. 500"
                        value={feeInputs[o.id] || ''}
                        onChange={e => setFeeInputs(p => ({ ...p, [o.id]: e.target.value }))}
                      />
                    </div>
                    <button className="df-btn amber" onClick={() => saveFee(o.id)}>Save Fee</button>
                  </div>
                  {net !== null && (
                    <div style={{ marginTop: 6, fontSize: 12, color: '#1fa67a', fontWeight: 600 }}>
                      Net to vendor after fee: {fmt(net)}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}

        {done.length > 0 && (
          <>
            <div className="df-sec" style={{ color: '#1fa67a' }}>Fee set · {done.length}</div>
            <div className="df-tw">
              <table>
                <thead>
                  <tr>
                    <th>Address / Customer</th>
                    <th>Status</th>
                    <th>Products</th>
                    <th>Branch · Rider</th>
                    <th>Order Total</th>
                    <th>Fee</th>
                    <th>Net to Vendor</th>
                  </tr>
                </thead>
                <tbody>
                  {done.map(o => {
                    const total = ot(o);
                    const fee = db.deliveryFees[o.id];
                    return (
                      <tr key={o.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>📍 {o.address}</div>
                          <div style={{ fontSize: 11, color: '#858cab' }}>{o.customerName}</div>
                        </td>
                        <td><SBadge status={o.status} /></td>
                        <td>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                            {gp(o).map((p, i) => (
                              <span key={i} style={{ fontSize: 11, background: '#f0f4ff', color: '#3730a3', borderRadius: 4, padding: '2px 6px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                {p.name} ×{p.qty || 1}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td style={{ fontSize: 12 }}>{o.branch} · {o.rider}</td>
                        <td><Money>{fmt(total)}</Money></td>
                        <td><Money tone="bad">−{fmt(fee)}</Money></td>
                        <td><Money tone="ok">{fmt(Math.max(0, total - fee))}</Money></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {eligible.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#aaa', fontSize: 14 }}>
            No eligible orders yet. Orders appear here once they have a delivery-attempt status.
          </div>
        )}
      </div>
    </div>
  );
}
