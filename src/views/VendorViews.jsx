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

  function generateInvoice() {

    const rows = payments.length ? payments.map(p => `
      <tr>
        <td>${p.date || '—'}</td>
        <td style="font-weight:700;color:#1fa67a">${fmt(p.amount, currency)}</td>
        <td>${p.bank || '—'}</td>
        <td style="font-family:monospace">${p.txID || '—'}</td>
      </tr>`).join('') : '<tr><td colspan="4" style="text-align:center;color:#aaa;padding:16px">No payments recorded</td></tr>';

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice — ${vn}</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=JetBrains+Mono:wght@600;700&display=swap" rel="stylesheet">
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:#f6f7fb;padding:40px 24px;color:#0b1230;-webkit-font-smoothing:antialiased}
    .page{max-width:720px;margin:0 auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,.12)}
    .header{background:linear-gradient(135deg,#0d1b3e 0%,#1a3a8f 60%,#1a56db 100%);padding:32px 36px;color:#fff}
    .header-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px}
    .logo{font-size:26px;font-weight:800;letter-spacing:-.8px}
    .inv-label{font-size:11px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:rgba(255,255,255,.55);margin-bottom:4px}
    .inv-num{font-size:14px;font-weight:700;font-family:'JetBrains Mono',monospace;color:rgba(255,255,255,.9)}
    .vendor-name{font-size:28px;font-weight:800;letter-spacing:-.5px;margin-bottom:6px}
    .vendor-sub{font-size:13px;color:rgba(255,255,255,.6)}
    .summary{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:24px 36px;border-bottom:1px solid #eef0f7}
    .s-card{background:#f6f8ff;border:1px solid #e0e7ff;border-radius:12px;padding:16px}
    .s-label{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#858cab;margin-bottom:8px}
    .s-val{font-size:18px;font-weight:800;font-family:'JetBrains Mono',monospace;color:#0b1230}
    .s-val.green{color:#1fa67a}
    .s-val.red{color:#e0425a}
    .outstanding{display:flex;justify-content:space-between;align-items:center;padding:20px 36px;background:${outstanding <= 0 ? '#f0fdf8' : '#fff5f5'};border-bottom:1px solid #eef0f7}
    .out-label{font-size:14px;font-weight:700;color:${outstanding <= 0 ? '#1fa67a' : '#e0425a'}}
    .out-val{font-size:28px;font-weight:800;font-family:'JetBrains Mono',monospace;color:${outstanding <= 0 ? '#1fa67a' : '#e0425a'}}
    .section{padding:24px 36px}
    .sec-title{font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#858cab;margin-bottom:14px}
    table{width:100%;border-collapse:collapse;font-size:13px}
    th{text-align:left;padding:10px 14px;background:#f6f7fb;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#858cab;border-bottom:1px solid #eef0f7}
    td{padding:12px 14px;border-bottom:1px solid #f0f0f0;color:#3a4267}
    tr:last-child td{border-bottom:none}
    .footer{padding:20px 36px;border-top:1px solid #eef0f7;text-align:center;font-size:12px;color:#858cab}
    @media print{body{padding:0;background:#fff}.page{box-shadow:none;border-radius:0}}
  </style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="header-top">
      <div class="logo">${cfg.company || 'Kyne'}</div>
      <div style="text-align:right">
        <div class="inv-label">Invoice Date</div>
        <div class="inv-num">${new Date().toISOString().slice(0,10)}</div>
      </div>
    </div>
    <div class="vendor-name">${vn}</div>
    <div class="vendor-sub">Vendor Statement · ${orders.length} delivered orders</div>
  </div>

  <div class="summary">
    <div class="s-card">
      <div class="s-label">Gross Value</div>
      <div class="s-val">${fmt(grossTotal, currency)}</div>
    </div>
    <div class="s-card">
      <div class="s-label">Delivery Fees</div>
      <div class="s-val red">−${fmt(fees, currency)}</div>
    </div>
    <div class="s-card">
      <div class="s-label">Net Payable</div>
      <div class="s-val">${fmt(netPayable, currency)}</div>
    </div>
  </div>

  <div class="outstanding">
    <div class="out-label">${outstanding <= 0 ? '✓ Fully Paid' : 'Outstanding Balance'}</div>
    <div class="out-val">${outstanding <= 0 ? fmt(0, currency) : fmt(outstanding, currency)}</div>
  </div>

  <div class="section">
    <div class="sec-title">Payment History</div>
    <table>
      <thead><tr><th>Date</th><th>Amount</th><th>Bank</th><th>TXN ID</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>

  <div class="footer">Generated by ${cfg.company || 'Kyne'} Logistics · ${new Date().toLocaleDateString('en-NG', { day:'numeric', month:'long', year:'numeric' })}</div>
</div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice_${vn}_${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  return (
    <div className="vv">
      <style>{CSS}</style>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 className="vv-title">Invoice</h2>
          <p className="vv-sub">{vn}</p>
        </div>
        <button className="vv-print-btn" onClick={generateInvoice}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
          </svg>
          Generate Invoice
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
