import { useState } from 'react';
import html2canvas from 'html2canvas';
import { useApp } from '../context/AppContext';
import { fmt, gp, filterPeriod, REVENUE_STATUSES } from '../utils/helpers';
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

const CSS = `
.vv *{box-sizing:border-box}
.vv{font-family:'Plus Jakarta Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased;padding:24px 20px;max-width:900px;margin:0 auto}
.vv-title{font-size:20px;font-weight:800;letter-spacing:-.02em;margin-bottom:4px}
.vv-sub{font-size:13px;color:var(--t3);margin-bottom:18px}
.vv-sec{font-size:10px;font-weight:700;color:var(--t3);letter-spacing:.12em;text-transform:uppercase;margin:22px 0 8px}
.vv-hero{background:linear-gradient(135deg,#0d1b3e 0%,#1a3a8f 60%,#1a56db 100%);border-radius:16px;padding:20px;box-shadow:0 10px 32px rgba(13,27,62,.28);margin-bottom:20px}
.vv-hero-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.vv-hero-card{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:14px 16px}
.vv-hero-l{font-size:10px;font-weight:700;color:rgba(255,255,255,.55);letter-spacing:.1em;text-transform:uppercase;margin-bottom:6px}
.vv-hero-v{font-size:20px;font-weight:800;color:#fff;font-family:'JetBrains Mono',monospace;letter-spacing:-.02em}
.vv-hero-v.green{color:#6ee7b7}
.vv-hero-v.red{color:#fca5a5}
.vv-print-btn{display:inline-flex;align-items:center;gap:8px;background:linear-gradient(180deg,#3b54ff,#2a3ef0);color:#fff;border:none;border-radius:12px;padding:12px 22px;font-family:inherit;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 6px 18px -4px rgba(42,62,240,.5);transition:filter .15s}
.vv-print-btn:hover{filter:brightness(1.08)}
.vv-order-card{background:#fff;border:1.5px solid var(--border);border-radius:14px;padding:16px 18px;margin-bottom:10px}
.vv-prod-pill{display:inline-flex;align-items:center;background:#eef2ff;color:#3730a3;font-size:12px;font-weight:600;padding:4px 11px;border-radius:20px;white-space:nowrap}

/* Invoice page styles */
.inv-page{background:#fff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,.06)}
.inv-topbar{display:flex;justify-content:space-between;align-items:flex-start;padding:24px 32px 20px;border-bottom:1px solid #f0f0f0}
.inv-logo-row{display:flex;align-items:center;gap:10px}
.inv-logo-box{width:34px;height:34px;background:#1a3a8f;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px;font-weight:800;flex-shrink:0}
.inv-company{font-size:16px;font-weight:800;letter-spacing:-.3px;color:#0b1230}
.inv-company-sub{font-size:11px;color:#9ca3af;letter-spacing:.06em;text-transform:uppercase;margin-top:1px}
.inv-date-block{text-align:right}
.inv-date-label{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#9ca3af;margin-bottom:3px}
.inv-date-val{font-size:14px;font-weight:700;color:#0b1230;font-family:'JetBrains Mono',monospace}
.inv-for-block{padding:20px 32px;border-bottom:1px solid #f0f0f0}
.inv-for-label{font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#9ca3af;margin-bottom:6px}
.inv-for-name{font-size:24px;font-weight:800;color:#0b1230;letter-spacing:-.5px;margin-bottom:4px}
.inv-for-meta{font-size:12px;color:#6b7280}
.inv-orders-label{font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#9ca3af;padding:16px 32px 0}
.inv-tbl{width:100%;border-collapse:collapse;margin-top:6px}
.inv-tbl th{text-align:left;padding:10px 16px;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#9ca3af;border-bottom:1px solid #f0f0f0}
.inv-tbl th.r{text-align:right}
.inv-tbl td{padding:13px 16px;border-bottom:1px solid #f8f8f8;font-size:13px;color:#374151;vertical-align:middle}
.inv-tbl td.r{text-align:right}
.inv-tbl tbody tr:hover td{background:#fafafa}
.inv-tbl tfoot td{padding:13px 16px;font-size:13px}
.inv-summary{background:#f9fafb;border-top:1px solid #f0f0f0;padding:16px 32px}
.inv-summary-row{display:flex;justify-content:space-between;align-items:center;padding:6px 0}
.inv-summary-label{font-size:13px;color:#374151}
.inv-summary-label.red{color:#e0425a;font-weight:600}
.inv-summary-val{font-size:13px;font-weight:700;font-family:'JetBrains Mono',monospace;color:#0b1230}
.inv-summary-val.red{color:#e0425a}
.inv-net{display:flex;justify-content:space-between;align-items:center;padding:20px 32px;border-top:2px solid #e5e7eb}
.inv-net-label{font-size:14px;font-weight:600;color:#374151}
.inv-net-val{font-size:28px;font-weight:800;color:#1a3a8f;font-family:'JetBrains Mono',monospace;letter-spacing:-.03em}
.inv-status{padding:16px 32px;border-top:1px solid #f0f0f0;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px}
.inv-status-info p{font-size:13px;font-weight:700;color:#0b1230;margin-bottom:3px}
.inv-status-info span{font-size:12px;color:#6b7280}
.inv-badge{display:inline-block;padding:5px 14px;border-radius:20px;font-size:12px;font-weight:700}
.inv-badge.paid{background:#dcfce7;color:#166534}
.inv-badge.partial{background:#fef3c7;color:#92400e}
.inv-badge.unpaid{background:#fee2e2;color:#991b1b}
.inv-prod-section{padding:16px 32px;border-top:1px solid #f0f0f0}
.inv-pay-section{padding:16px 32px;border-top:1px solid #f0f0f0}

@media(max-width:600px){
  .vv-hero-grid{grid-template-columns:repeat(2,1fr)}
  .inv-topbar{padding:16px 18px}
  .inv-for-block,.inv-orders-label,.inv-summary,.inv-net,.inv-status,.inv-prod-section,.inv-pay-section{padding-left:18px;padding-right:18px}
  .inv-for-name{font-size:18px}
  .inv-net-val{font-size:22px}
  .inv-tbl th,.inv-tbl td{padding:10px 10px;font-size:12px}
}
`;

// ── Deliveries ────────────────────────────────────────────────────────────────
function VendorDeliveries({ vn, filterP }) {
  const { db, cfg } = useApp();
  const currency = cfg.currency;

  const allOrders = db.orders.filter(o => gp(o).some(p => p.vendor === vn));
  const orders = filterP(allOrders).sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  function vt(o) {
    return gp(o).filter(p => p.vendor === vn).reduce((s, p) => s + (Number(p.price) || 0) * (Number(p.qty) || 1), 0);
  }

  const deliveredOrders = orders.filter(o => REVENUE_STATUSES.includes(o.status));
  const failedOrders    = orders.filter(o => o.status === 'Failed' || o.status === 'Not Delivered');
  const pendingOrders   = orders.filter(o => !REVENUE_STATUSES.includes(o.status) && o.status !== 'Failed' && o.status !== 'Not Delivered');
  const totalVal = deliveredOrders.reduce((s, o) => s + vt(o), 0);

  const statusColor = { Delivered:'#166534',Completed:'#166534',Replaced:'#92400e',Failed:'#991b1b',Cancelled:'#991b1b','Not Delivered':'#374151',Pending:'#92400e',Unassigned:'#92400e' };
  const statusBg   = { Delivered:'#dcfce7',Completed:'#dcfce7',Replaced:'#fef3c7',Failed:'#fee2e2',Cancelled:'#fee2e2','Not Delivered':'#f3f4f6',Pending:'#fef3c7',Unassigned:'#fef3c7' };

  function OrderCard({ o }) {
    const prods = gp(o).filter(p => p.vendor === vn);
    const val = vt(o);
    const isRevenue = REVENUE_STATUSES.includes(o.status);
    return (
      <div className="vv-order-card">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, marginBottom:10 }}>
          <div style={{ minWidth:0, flex:1 }}>
            <p style={{ fontWeight:700, fontSize:15, marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{o.customerName}</p>
            <p style={{ fontSize:12, color:'var(--t3)' }}>{o.phone || '—'} &nbsp;·&nbsp; {o.date}</p>
          </div>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6, flexShrink:0 }}>
            <span style={{ display:'inline-block', padding:'3px 10px', borderRadius:20, fontSize:12, fontWeight:700, background:statusBg[o.status]||'#f3f4f6', color:statusColor[o.status]||'#374151' }}>{o.status}</span>
            <span style={{ fontSize:16, fontWeight:800, fontFamily:"'JetBrains Mono',monospace", color:isRevenue?'#1a3a8f':'var(--t3)' }}>{fmt(val, currency)}</span>
          </div>
        </div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
          {prods.map((p, i) => (
            <span key={i} className="vv-prod-pill">
              {p.name}{(Number(p.qty)||1) > 1 ? ` ×${p.qty}` : ''}
              {p.price ? <span style={{ marginLeft:6, opacity:.6 }}>{fmt((Number(p.price))*(Number(p.qty)||1), currency)}</span> : null}
            </span>
          ))}
        </div>
      </div>
    );
  }

  const SecHeader = ({ label, count, color }) => (
    <div style={{ fontSize:11, fontWeight:800, letterSpacing:'.1em', textTransform:'uppercase', color, margin:'22px 0 10px', paddingBottom:6, borderBottom:`2px solid ${color}22` }}>
      {label} &nbsp;·&nbsp; {count}
    </div>
  );

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
            <p className="vv-hero-v green">{deliveredOrders.length}</p>
          </div>
          <div className="vv-hero-card">
            <p className="vv-hero-l">Total Value</p>
            <p className="vv-hero-v">{fmt(totalVal, currency)}</p>
          </div>
        </div>
      </div>

      {orders.length === 0 && <div className="empty-box"><p className="empty-t">No deliveries in this period</p></div>}

      {orders.length > 0 && (
        <>
          <SecHeader label="Pending" count={pendingOrders.length} color="#d97706" />
          {pendingOrders.length === 0
            ? <p style={{ color:'#aaa', fontSize:13, marginBottom:12 }}>No pending orders.</p>
            : pendingOrders.map(o => <OrderCard key={o.id} o={o} />)
          }

          <SecHeader label="Delivered" count={deliveredOrders.length} color="#16a34a" />
          {deliveredOrders.length === 0
            ? <p style={{ color:'#aaa', fontSize:13, marginBottom:12 }}>No delivered orders.</p>
            : deliveredOrders.map(o => <OrderCard key={o.id} o={o} />)
          }

          <SecHeader label="Failed / Not Delivered" count={failedOrders.length} color="#dc2626" />
          {failedOrders.length === 0
            ? <p style={{ color:'#aaa', fontSize:13, marginBottom:12 }}>No failed orders.</p>
            : failedOrders.map(o => <OrderCard key={o.id} o={o} />)
          }
        </>
      )}
    </div>
  );
}

// ── Invoice ───────────────────────────────────────────────────────────────────
function VendorInvoice({ vn, filterP }) {
  const { db, cfg, period, rangeFrom, rangeTo } = useApp();
  const [generating, setGenerating] = useState(false);
  const currency = cfg.currency;
  const today = new Date().toISOString().slice(0, 10);

  const periodLabel = period === 'today' ? 'Today' : period === 'yesterday' ? 'Yesterday'
    : period === 'week' ? 'This Week' : period === 'month' ? 'This Month'
    : period === 'range' && rangeFrom ? `${rangeFrom} → ${rangeTo}` : 'All Time';

  function vt(o) {
    return gp(o).filter(p => p.vendor === vn).reduce((s, p) => s + (Number(p.price)||0) * (Number(p.qty)||1), 0);
  }

  // Period-filtered delivered orders
  const orders = filterP(
    db.orders.filter(o => gp(o).some(p => p.vendor === vn) && REVENUE_STATUSES.includes(o.status))
  ).sort((a, b) => (b.date||'').localeCompare(a.date||''));

  const grossTotal = orders.reduce((s, o) => s + vt(o), 0);
  const fees = orders.reduce((s, o) => s + (db.deliveryFees[o.id] || 0), 0);
  const netPayable = Math.max(0, grossTotal - fees);

  // All-time for payment status
  const allOrders = db.orders.filter(o => gp(o).some(p => p.vendor === vn) && REVENUE_STATUSES.includes(o.status));
  const allGross = allOrders.reduce((s, o) => s + vt(o), 0);
  const allFees = allOrders.reduce((s, o) => s + (db.deliveryFees[o.id] || 0), 0);
  const allNetPayable = Math.max(0, allGross - allFees);
  const payments = [...(db.vendorPayments[vn] || [])].sort((a, b) => (b.date||'').localeCompare(a.date||''));
  const totalPaid = payments.reduce((s, p) => s + (p.amount||0), 0);
  const remaining = Math.max(0, allNetPayable - totalPaid);

  const payStatusLabel = remaining <= 0 && totalPaid > 0 ? 'Fully Paid' : totalPaid > 0 ? 'Partially Paid' : 'Not Yet Paid';
  const payStatusClass = remaining <= 0 && totalPaid > 0 ? 'paid' : totalPaid > 0 ? 'partial' : 'unpaid';

  // Product breakdown: qty sold + total value + warehouse
  const productMap = {};
  orders.forEach(o => {
    gp(o).filter(p => p.vendor === vn).forEach(p => {
      if (!productMap[p.name]) productMap[p.name] = { sold:0, value:0, warehouse:0 };
      const qty = Number(p.qty)||1;
      productMap[p.name].sold += qty;
      productMap[p.name].value += (Number(p.price)||0) * qty;
    });
  });
  Object.values(db.inventory).forEach(branchInv => {
    const vInv = branchInv[vn] || {};
    Object.entries(vInv).forEach(([product, vals]) => {
      if (!productMap[product]) productMap[product] = { sold:0, value:0, warehouse:0 };
      productMap[product].warehouse += Math.max(0, (vals.received||0) - (vals.sentOut||0) - (vals.delivered||0));
    });
  });
  const productRows = Object.entries(productMap)
    .filter(([, v]) => v.sold > 0 || v.warehouse > 0)
    .sort((a, b) => b[1].value - a[1].value);

  // ── PNG generation ─────────────────────────────────────────────────────────
  async function generateInvoice() {
    setGenerating(true);
    const dateLabel = new Date().toLocaleDateString('en-NG', { day:'numeric', month:'long', year:'numeric' });
    const outColor = remaining <= 0 && totalPaid > 0 ? '#166534' : totalPaid > 0 ? '#92400e' : '#991b1b';
    const outBg    = remaining <= 0 && totalPaid > 0 ? '#dcfce7' : totalPaid > 0 ? '#fef3c7' : '#fee2e2';

    const prodTableRows = productRows.map(([name, v]) => `<tr>
      <td style="padding:11px 16px;border-bottom:1px solid #f8f8f8;font-size:13px;font-weight:600;color:#0b1230">${name}</td>
      <td style="padding:11px 16px;border-bottom:1px solid #f8f8f8;font-size:13px;font-weight:800;font-family:monospace;text-align:center;color:#1a3a8f">${v.sold}</td>
      <td style="padding:11px 16px;border-bottom:1px solid #f8f8f8;font-size:13px;font-weight:800;font-family:monospace;color:#0b1230">${fmt(v.value, currency)}</td>
      <td style="padding:11px 16px;border-bottom:1px solid #f8f8f8;font-size:13px;font-weight:700;font-family:monospace;text-align:center;color:${v.warehouse<=0?'#e0425a':'#166534'}">${v.warehouse}</td>
    </tr>`).join('');

    const payRows = payments.length
      ? payments.map(p => `<tr>
          <td style="padding:11px 16px;border-bottom:1px solid #f8f8f8;font-size:13px;color:#6b7280">${p.date||'—'}</td>
          <td style="padding:11px 16px;border-bottom:1px solid #f8f8f8;font-weight:800;color:#166534;font-family:monospace">${fmt(p.amount, currency)}</td>
          <td style="padding:11px 16px;border-bottom:1px solid #f8f8f8;font-size:13px;color:#374151">${p.bank||'—'}</td>
          <td style="padding:11px 16px;border-bottom:1px solid #f8f8f8;font-size:12px;font-family:monospace;color:#6b7280">${p.txID||'—'}</td>
        </tr>`).join('')
      : `<tr><td colspan="4" style="padding:16px;text-align:center;color:#9ca3af;font-size:13px">No payments recorded</td></tr>`;

    const thStyle = 'text-align:left;padding:10px 16px;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#9ca3af;border-bottom:1px solid #f0f0f0';
    const thR = thStyle + ';text-align:right';

    const node = document.createElement('div');
    node.style.cssText = 'position:fixed;left:-9999px;top:0;width:800px;background:#f5f5f5;padding:28px;font-family:system-ui,sans-serif;-webkit-font-smoothing:antialiased;z-index:-1';
    node.innerHTML = `
      <div style="background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;box-shadow:0 2px 20px rgba(0,0,0,.07)">

        <!-- Top bar -->
        <div style="display:flex;justify-content:space-between;align-items:flex-start;padding:24px 32px 20px;border-bottom:1px solid #f0f0f0">
          <div style="display:flex;align-items:center;gap:10px">
            <div style="width:34px;height:34px;background:#1a3a8f;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px;font-weight:800;flex-shrink:0">${(cfg.company||'K')[0]}</div>
            <div>
              <div style="font-size:16px;font-weight:800;color:#0b1230;letter-spacing:-.3px">${cfg.company||'Kyne'}</div>
              <div style="font-size:10px;color:#9ca3af;letter-spacing:.06em;text-transform:uppercase;margin-top:1px">Vendor Invoice</div>
            </div>
          </div>
          <div style="text-align:right">
            <div style="font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#9ca3af;margin-bottom:3px">Issued</div>
            <div style="font-size:14px;font-weight:700;color:#0b1230;font-family:monospace">${today}</div>
          </div>
        </div>

        <!-- Invoice for -->
        <div style="padding:20px 32px;border-bottom:1px solid #f0f0f0">
          <div style="font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#9ca3af;margin-bottom:6px">Invoice For</div>
          <div style="font-size:24px;font-weight:800;color:#0b1230;letter-spacing:-.5px;margin-bottom:4px">${vn}</div>
          <div style="font-size:12px;color:#6b7280">Period: ${periodLabel} &nbsp;·&nbsp; Generated: ${today}</div>
        </div>

        <!-- Net payable -->
        <div style="display:flex;justify-content:space-between;align-items:center;padding:20px 32px;border-top:2px solid #e5e7eb">
          <span style="font-size:14px;font-weight:600;color:#374151">Net payable for this period</span>
          <span style="font-size:28px;font-weight:800;color:#1a3a8f;font-family:monospace;letter-spacing:-.03em">${fmt(netPayable, currency)}</span>
        </div>

        ${productRows.length > 0 ? `
        <!-- Product Summary -->
        <div style="padding:16px 32px;border-top:1px solid #f0f0f0">
          <div style="font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#9ca3af;margin-bottom:10px">Product Summary</div>
          <table style="width:100%;border-collapse:collapse">
            <thead>
              <tr style="background:#fafafa">
                <th style="${thStyle}">Product</th>
                <th style="${thStyle};text-align:center">Qty Sold</th>
                <th style="${thStyle}">Total Value</th>
                <th style="${thStyle};text-align:center">In Warehouse</th>
              </tr>
            </thead>
            <tbody>${prodTableRows}</tbody>
            <tfoot>
              <tr style="background:#f0f4ff">
                <td style="padding:11px 16px;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.06em">Total</td>
                <td style="padding:11px 16px;font-weight:800;font-family:monospace;text-align:center;color:#0b1230">${productRows.reduce((s,[,v])=>s+v.sold,0)}</td>
                <td style="padding:11px 16px;font-weight:800;font-family:monospace;color:#1a3a8f">${fmt(productRows.reduce((s,[,v])=>s+v.value,0),currency)}</td>
                <td style="padding:11px 16px;font-weight:800;font-family:monospace;text-align:center;color:#0b1230">${productRows.reduce((s,[,v])=>s+v.warehouse,0)}</td>
              </tr>
            </tfoot>
          </table>
        </div>` : ''}

        <!-- Payment history -->
        <div style="padding:16px 32px;border-top:1px solid #f0f0f0">
          <div style="font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#9ca3af;margin-bottom:10px">Payment History</div>
          <table style="width:100%;border-collapse:collapse">
            <thead>
              <tr style="background:#fafafa">
                <th style="${thStyle}">Date</th>
                <th style="${thStyle}">Amount</th>
                <th style="${thStyle}">Bank</th>
                <th style="${thStyle}">TXN ID</th>
              </tr>
            </thead>
            <tbody>${payRows}</tbody>
          </table>
        </div>

        <!-- Overall payment status -->
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;padding:16px 32px;border-top:1px solid #f0f0f0;background:#fafafa">
          <div>
            <p style="font-size:13px;font-weight:700;color:#0b1230;margin-bottom:3px">Overall payment status (all time)</p>
            <span style="font-size:12px;color:#6b7280">Total owed: ${fmt(allNetPayable,currency)} &nbsp;·&nbsp; Paid: ${fmt(totalPaid,currency)} &nbsp;·&nbsp; Remaining: ${fmt(remaining,currency)}</span>
          </div>
          <span style="display:inline-block;padding:5px 14px;border-radius:20px;font-size:12px;font-weight:700;background:${outBg};color:${outColor}">${payStatusLabel}</span>
        </div>

        <!-- Footer -->
        <div style="padding:14px 32px;border-top:1px solid #f0f0f0;text-align:center;font-size:11px;color:#9ca3af">
          Generated by ${cfg.company||'Kyne'} Logistics &nbsp;·&nbsp; ${dateLabel}
        </div>
      </div>`;

    document.body.appendChild(node);
    try {
      const canvas = await html2canvas(node, { scale:2, useCORS:true, backgroundColor:'#f5f5f5' });
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url; a.download = `Invoice_${vn}_${today}.png`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    } finally {
      document.body.removeChild(node);
      setGenerating(false);
    }
  }

  // ── On-screen render ───────────────────────────────────────────────────────
  return (
    <div className="vv">
      <style>{CSS}</style>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:12 }}>
        <div>
          <h2 className="vv-title">Invoice</h2>
          <p className="vv-sub">{vn}</p>
        </div>
        <button className="vv-print-btn" onClick={generateInvoice} disabled={generating} style={{ opacity:generating?0.7:1 }}>
          {generating ? '⏳ Generating...' : <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Download Invoice
          </>}
        </button>
      </div>

      <DateFilter />

      <div className="inv-page">
        {/* Top bar */}
        <div className="inv-topbar">
          <div className="inv-logo-row">
            <div className="inv-logo-box">{(cfg.company||'K')[0]}</div>
            <div>
              <div className="inv-company">{cfg.company||'Kyne'}</div>
              <div className="inv-company-sub">Vendor Invoice</div>
            </div>
          </div>
          <div className="inv-date-block">
            <div className="inv-date-label">Issued</div>
            <div className="inv-date-val">{today}</div>
          </div>
        </div>

        {/* Invoice for */}
        <div className="inv-for-block">
          <div className="inv-for-label">Invoice For</div>
          <div className="inv-for-name">{vn}</div>
          <div className="inv-for-meta">Period: {periodLabel} &nbsp;·&nbsp; Generated: {today}</div>
        </div>

        {/* Net payable */}
        <div className="inv-net">
          <span className="inv-net-label">Net payable for this period</span>
          <span className="inv-net-val">{fmt(netPayable, currency)}</span>
        </div>

        {/* Product summary */}
        {productRows.length > 0 && (
          <div className="inv-prod-section">
            <div className="vv-sec" style={{ margin:'0 0 8px' }}>Product Summary</div>
            <div style={{ overflowX:'auto' }}>
              <table className="inv-tbl">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th style={{ textAlign:'center' }}>Qty Sold</th>
                    <th>Total Value</th>
                    <th style={{ textAlign:'center' }}>In Warehouse</th>
                  </tr>
                </thead>
                <tbody>
                  {productRows.map(([name, v]) => (
                    <tr key={name}>
                      <td style={{ fontWeight:600 }}>{name}</td>
                      <td style={{ textAlign:'center', fontWeight:800, fontFamily:"'JetBrains Mono',monospace", color:'#1a3a8f' }}>{v.sold}</td>
                      <td style={{ fontWeight:800, fontFamily:"'JetBrains Mono',monospace" }}>{fmt(v.value, currency)}</td>
                      <td style={{ textAlign:'center', fontWeight:700, fontFamily:"'JetBrains Mono',monospace", color:v.warehouse<=0?'#e0425a':'#166534' }}>{v.warehouse}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background:'#f0f4ff' }}>
                    <td style={{ fontWeight:700, color:'var(--t3)', fontSize:12, textTransform:'uppercase', letterSpacing:'.06em' }}>Total</td>
                    <td style={{ textAlign:'center', fontWeight:800, fontFamily:"'JetBrains Mono',monospace" }}>{productRows.reduce((s,[,v])=>s+v.sold,0)}</td>
                    <td style={{ fontWeight:800, fontFamily:"'JetBrains Mono',monospace", color:'#1a3a8f' }}>{fmt(productRows.reduce((s,[,v])=>s+v.value,0),currency)}</td>
                    <td style={{ textAlign:'center', fontWeight:800, fontFamily:"'JetBrains Mono',monospace" }}>{productRows.reduce((s,[,v])=>s+v.warehouse,0)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Payment history */}
        {payments.length > 0 && (
          <div className="inv-pay-section">
            <div className="vv-sec" style={{ margin:'0 0 8px' }}>Payment History</div>
            <div style={{ overflowX:'auto' }}>
              <table className="inv-tbl">
                <thead><tr><th>Date</th><th>Amount</th><th>Bank</th><th>TXN ID</th></tr></thead>
                <tbody>
                  {payments.map((p, i) => (
                    <tr key={i}>
                      <td style={{ color:'#6b7280', whiteSpace:'nowrap' }}>{p.date}</td>
                      <td style={{ fontWeight:800, color:'#166534', fontFamily:"'JetBrains Mono',monospace" }}>{fmt(p.amount, currency)}</td>
                      <td>{p.bank||'—'}</td>
                      <td><code style={{ fontSize:12, background:'#f3f4f6', padding:'2px 6px', borderRadius:6 }}>{p.txID||'—'}</code></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Overall payment status */}
        <div className="inv-status">
          <div className="inv-status-info">
            <p>Overall payment status (all time)</p>
            <span>Total owed: {fmt(allNetPayable,currency)} &nbsp;·&nbsp; Paid: {fmt(totalPaid,currency)} &nbsp;·&nbsp; Remaining: {fmt(remaining,currency)}</span>
          </div>
          <span className={`inv-badge ${payStatusClass}`}>{payStatusLabel}</span>
        </div>
      </div>
    </div>
  );
}
