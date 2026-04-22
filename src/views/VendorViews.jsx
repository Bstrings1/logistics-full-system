import { useState } from 'react';
import html2canvas from 'html2canvas';
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
  if (tabId === 'invoice')    return <VendorInvoice vn={vn} filterP={filterP} />;
  return null;
}

// ── shared tiny helpers ────────────────────────────────────────────────────────
const CSS = `
.vv *{box-sizing:border-box}
.vv{font-family:'Plus Jakarta Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased;padding:24px 20px;max-width:900px;margin:0 auto}
.vv-hero{background:linear-gradient(135deg,#0d1b3e 0%,#1a3a8f 60%,#1a56db 100%);border-radius:16px;padding:20px;box-shadow:0 10px 32px rgba(13,27,62,.28);margin-bottom:20px}
.vv-hero-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.vv-hero-grid.c5{grid-template-columns:repeat(5,1fr)}
.vv-hero-card{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:14px 16px}
.vv-hero-l{font-size:10px;font-weight:700;color:rgba(255,255,255,.55);letter-spacing:.1em;text-transform:uppercase;margin-bottom:6px}
.vv-hero-v{font-size:20px;font-weight:800;color:#fff;font-family:'JetBrains Mono',monospace;font-variant-numeric:tabular-nums;letter-spacing:-.02em}
.vv-hero-v.green{color:#6ee7b7}
.vv-hero-v.red{color:#fca5a5}
.vv-hero-v.amber{color:#fcd34d}
.vv-title{font-size:20px;font-weight:800;letter-spacing:-.02em;margin-bottom:4px}
.vv-sub{font-size:13px;color:var(--t3);margin-bottom:18px}
.vv-sec{font-size:11px;font-weight:700;color:var(--t3);letter-spacing:.1em;text-transform:uppercase;margin:20px 0 10px}
.vv-inv-box{background:#fff;border:1.5px solid var(--border);border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.06)}
.vv-inv-header{background:linear-gradient(135deg,#0d1b3e 0%,#1a3a8f 60%,#1a56db 100%);padding:24px 28px;color:#fff}
.vv-inv-header h3{font-size:22px;font-weight:800;letter-spacing:-.5px;margin-bottom:4px}
.vv-inv-header p{font-size:13px;color:rgba(255,255,255,.65)}
.vv-inv-row{display:flex;justify-content:space-between;align-items:center;padding:14px 24px;border-bottom:1px solid var(--border-soft)}
.vv-inv-row:last-child{border-bottom:none}
.vv-inv-row-l{font-size:13px;color:var(--t3)}
.vv-inv-row-v{font-size:15px;font-weight:800;font-family:'JetBrains Mono',monospace}
.vv-inv-total{background:#f6f8ff;display:flex;justify-content:space-between;align-items:center;padding:16px 24px}
.vv-inv-total-l{font-size:14px;font-weight:700;color:var(--navy)}
.vv-inv-total-v{font-size:22px;font-weight:800;font-family:'JetBrains Mono',monospace;color:#e0425a}
.vv-inv-total-v.paid{color:#1fa67a}
.vv-print-btn{display:inline-flex;align-items:center;gap:8px;background:linear-gradient(180deg,#3b54ff,#2a3ef0);color:#fff;border:none;border-radius:12px;padding:12px 22px;font-family:inherit;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 6px 18px -4px rgba(42,62,240,.5);transition:filter .15s}
.vv-print-btn:hover{filter:brightness(1.08)}
@media(max-width:600px){
  .vv-hero-grid.c5{grid-template-columns:repeat(2,1fr)}
  .vv-hero-grid{grid-template-columns:repeat(2,1fr)}
}
@media print{
  body > *:not(.vv-printable){display:none!important}
  .vv-printable{display:block!important;padding:32px}
  .vv-print-btn,.vv-no-print{display:none!important}
}
`;

// ── Deliveries ────────────────────────────────────────────────────────────────
function VendorDeliveries({ vn, filterP }) {
  const { db, cfg } = useApp();

  const allOrders = db.orders.filter(o => gp(o).some(p => p.vendor === vn));
  const orders = filterP(allOrders).sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  function vt(o) {
    return gp(o).filter(p => p.vendor === vn).reduce((s, p) => s + (Number(p.price) || 0) * (Number(p.qty) || 1), 0);
  }

  const delivered = orders.filter(o => REVENUE_STATUSES.includes(o.status));
  const totalVal = delivered.reduce((s, o) => s + vt(o), 0);

  return (
    <div className="vv">
      <style>{CSS}</style>
      <h2 className="vv-title">Deliveries</h2>
      <p className="vv-sub">{vn}</p>

      <DateFilter />

      <div className="vv-hero">
        <div className="vv-hero-grid">
          <div className="vv-hero-card">
            <p className="vv-hero-l">Total Orders</p>
            <p className="vv-hero-v">{orders.length}</p>
          </div>
          <div className="vv-hero-card">
            <p className="vv-hero-l">Delivered</p>
            <p className="vv-hero-v green">{delivered.length}</p>
          </div>
          <div className="vv-hero-card">
            <p className="vv-hero-l">Total Value</p>
            <p className="vv-hero-v">{fmt(totalVal, cfg.currency)}</p>
          </div>
        </div>
      </div>

      {orders.length === 0
        ? <div className="empty-box"><p className="empty-t">No deliveries in this period</p></div>
        : (
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
                          <span key={i}>{p.name}{p.qty > 1 ? ` ×${p.qty}` : ''}{i < prods.length - 1 ? ', ' : ''}</span>
                        ))}
                      </td>
                      <td style={{ fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>{fmt(vt(o), cfg.currency)}</td>
                      <td><SBadge status={o.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      }
    </div>
  );
}

// ── Invoice ───────────────────────────────────────────────────────────────────
function VendorInvoice({ vn, filterP }) {
  const { db, cfg } = useApp();
  const [generating, setGenerating] = useState(false);

  function vt(o) {
    return gp(o).filter(p => p.vendor === vn).reduce((s, p) => s + (Number(p.price) || 0) * (Number(p.qty) || 1), 0);
  }

  const orders = filterP(
    db.orders.filter(o => gp(o).some(p => p.vendor === vn) && REVENUE_STATUSES.includes(o.status))
  );

  const grossTotal = orders.reduce((s, o) => s + vt(o), 0);
  const fees = orders.reduce((s, o) => s + (db.deliveryFees[o.id] || 0), 0);
  const netPayable = Math.max(0, grossTotal - fees);
  const payments = filterP(db.vendorPayments[vn] || []);
  const totalPaid = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const outstanding = Math.max(0, netPayable - totalPaid);
  const currency = cfg.currency;

  async function generateInvoice() {
    setGenerating(true);
    const today = new Date().toISOString().slice(0, 10);
    const dateLabel = new Date().toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' });
    const outColor = outstanding <= 0 ? '#1fa67a' : '#e0425a';
    const outBg = outstanding <= 0 ? '#f0fdf8' : '#fff5f5';

    const payRows = payments.length
      ? payments.map(p => `<tr>
          <td style="padding:11px 14px;border-bottom:1px solid #f0f0f0;font-size:13px;color:#3a4267">${p.date || '—'}</td>
          <td style="padding:11px 14px;border-bottom:1px solid #f0f0f0;font-weight:800;color:#1fa67a;font-family:monospace">${fmt(p.amount, currency)}</td>
          <td style="padding:11px 14px;border-bottom:1px solid #f0f0f0;font-size:13px;color:#3a4267">${p.bank || '—'}</td>
          <td style="padding:11px 14px;border-bottom:1px solid #f0f0f0;font-size:12px;color:#3a4267;font-family:monospace">${p.txID || '—'}</td>
        </tr>`).join('')
      : `<tr><td colspan="4" style="padding:16px;text-align:center;color:#aaa;font-size:13px">No payments recorded</td></tr>`;

    const node = document.createElement('div');
    node.style.cssText = 'position:fixed;left:-9999px;top:0;width:720px;background:#f6f7fb;padding:32px 24px;font-family:system-ui,sans-serif;-webkit-font-smoothing:antialiased;z-index:-1';
    node.innerHTML = `
      <div style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,.12)">
        <div style="background:linear-gradient(135deg,#0d1b3e 0%,#1a3a8f 60%,#1a56db 100%);padding:32px 36px;color:#fff">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px">
            <div style="font-size:26px;font-weight:800;letter-spacing:-.8px">${cfg.company || 'Kyne'}</div>
            <div style="text-align:right">
              <div style="font-size:10px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:rgba(255,255,255,.55);margin-bottom:4px">Invoice Date</div>
              <div style="font-size:14px;font-weight:700;font-family:monospace;color:rgba(255,255,255,.9)">${today}</div>
            </div>
          </div>
          <div style="font-size:28px;font-weight:800;letter-spacing:-.5px;margin-bottom:6px">${vn}</div>
          <div style="font-size:13px;color:rgba(255,255,255,.6)">Vendor Statement · ${orders.length} delivered orders</div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:24px 36px;border-bottom:1px solid #eef0f7">
          <div style="background:#f6f8ff;border:1px solid #e0e7ff;border-radius:12px;padding:16px">
            <div style="font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#858cab;margin-bottom:8px">Gross Value</div>
            <div style="font-size:18px;font-weight:800;font-family:monospace;color:#0b1230">${fmt(grossTotal, currency)}</div>
          </div>
          <div style="background:#f6f8ff;border:1px solid #e0e7ff;border-radius:12px;padding:16px">
            <div style="font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#858cab;margin-bottom:8px">Delivery Fees</div>
            <div style="font-size:18px;font-weight:800;font-family:monospace;color:#e0425a">−${fmt(fees, currency)}</div>
          </div>
          <div style="background:#f6f8ff;border:1px solid #e0e7ff;border-radius:12px;padding:16px">
            <div style="font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#858cab;margin-bottom:8px">Net Payable</div>
            <div style="font-size:18px;font-weight:800;font-family:monospace;color:#0b1230">${fmt(netPayable, currency)}</div>
          </div>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;padding:20px 36px;background:${outBg};border-bottom:1px solid #eef0f7">
          <div style="font-size:14px;font-weight:700;color:${outColor}">${outstanding <= 0 ? '✓ Fully Paid' : 'Outstanding Balance'}</div>
          <div style="font-size:28px;font-weight:800;font-family:monospace;color:${outColor}">${outstanding <= 0 ? fmt(0, currency) : fmt(outstanding, currency)}</div>
        </div>

        <div style="padding:24px 36px">
          <div style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#858cab;margin-bottom:14px">Payment History</div>
          <table style="width:100%;border-collapse:collapse">
            <thead>
              <tr style="background:#f6f7fb">
                <th style="text-align:left;padding:10px 14px;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#858cab;border-bottom:1px solid #eef0f7">Date</th>
                <th style="text-align:left;padding:10px 14px;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#858cab;border-bottom:1px solid #eef0f7">Amount</th>
                <th style="text-align:left;padding:10px 14px;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#858cab;border-bottom:1px solid #eef0f7">Bank</th>
                <th style="text-align:left;padding:10px 14px;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#858cab;border-bottom:1px solid #eef0f7">TXN ID</th>
              </tr>
            </thead>
            <tbody>${payRows}</tbody>
          </table>
        </div>

        <div style="padding:20px 36px;border-top:1px solid #eef0f7;text-align:center;font-size:12px;color:#858cab">
          Generated by ${cfg.company || 'Kyne'} Logistics · ${dateLabel}
        </div>
      </div>`;

    document.body.appendChild(node);
    try {
      const canvas = await html2canvas(node, { scale: 2, useCORS: true, backgroundColor: '#f6f7fb' });
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice_${vn}_${today}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      document.body.removeChild(node);
      setGenerating(false);
    }
  }

  return (
    <div className="vv">
      <style>{CSS}</style>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 className="vv-title">Invoice</h2>
          <p className="vv-sub">{vn}</p>
        </div>
        <button className="vv-print-btn" onClick={generateInvoice} disabled={generating} style={{ opacity: generating ? 0.7 : 1 }}>
          {generating ? '⏳ Generating...' : <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Download Invoice
          </>}
        </button>
      </div>

      <DateFilter />

      {/* Financial summary — navy hero */}
      <div className="vv-hero">
        <div className="vv-hero-grid c5">
          <div className="vv-hero-card">
            <p className="vv-hero-l">Gross Value</p>
            <p className="vv-hero-v">{fmt(grossTotal, currency)}</p>
          </div>
          <div className="vv-hero-card">
            <p className="vv-hero-l">Delivery Fees</p>
            <p className="vv-hero-v red">−{fmt(fees, currency)}</p>
          </div>
          <div className="vv-hero-card">
            <p className="vv-hero-l">Net Payable</p>
            <p className="vv-hero-v">{fmt(netPayable, currency)}</p>
          </div>
          <div className="vv-hero-card">
            <p className="vv-hero-l">Paid</p>
            <p className="vv-hero-v green">{fmt(totalPaid, currency)}</p>
          </div>
          <div className="vv-hero-card">
            <p className="vv-hero-l">Outstanding</p>
            <p className={`vv-hero-v ${outstanding > 0 ? 'red' : 'green'}`}>
              {outstanding <= 0 ? '₦0 ✓' : fmt(outstanding, currency)}
            </p>
          </div>
        </div>
      </div>

      {/* Outstanding callout */}
      {outstanding > 0 && (
        <div style={{ background: '#fff5f5', border: '1.5px solid #fecaca', borderRadius: 12, padding: '14px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#e0425a' }}>Outstanding Balance</p>
            <p style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>Payment is pending from Kyne</p>
          </div>
          <p style={{ fontSize: 22, fontWeight: 800, color: '#e0425a', fontFamily: "'JetBrains Mono',monospace" }}>{fmt(outstanding, currency)}</p>
        </div>
      )}
      {outstanding <= 0 && totalPaid > 0 && (
        <div style={{ background: '#f0fdf8', border: '1.5px solid #bbf7d0', borderRadius: 12, padding: '14px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>✓</span>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#1fa67a' }}>Fully paid — no outstanding balance</p>
        </div>
      )}

      {/* Payment history */}
      {payments.length > 0 && (
        <>
          <p className="vv-sec">Payment History</p>
          <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
            <table className="tbl">
              <thead><tr><th>Date</th><th>Amount</th><th>Bank</th><th>Account</th><th>TXN ID</th></tr></thead>
              <tbody>
                {payments.map((p, i) => (
                  <tr key={i}>
                    <td style={{ fontSize: 12, color: 'var(--t3)' }}>{p.date}</td>
                    <td style={{ fontWeight: 800, color: 'var(--green)', fontFamily: "'JetBrains Mono',monospace" }}>{fmt(p.amount, currency)}</td>
                    <td style={{ fontSize: 12 }}>{p.bank || '—'}</td>
                    <td><code style={{ fontSize: 11 }}>{p.account || '—'}</code></td>
                    <td><code style={{ fontSize: 11 }}>{p.txID || '—'}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {orders.length === 0 && payments.length === 0 && (
        <div className="empty-box"><p className="empty-t">No data for this period</p></div>
      )}
    </div>
  );
}
