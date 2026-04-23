import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { fmt, filterPeriod, branchCalc, getBonusCycleOrders, calcBonus, bonusRate, ot, gp, REVENUE_STATUSES, TODAY } from '../utils/helpers';
import DateFilter from '../components/DateFilter';

const CSS = `
.bv *{box-sizing:border-box}
.bv{font-family:'Plus Jakarta Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased}

/* Page shell */
.bv-topbar{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:20px;gap:16px;flex-wrap:wrap}
.bv-title{font-size:24px;font-weight:700;letter-spacing:-.5px;color:#0b1230;margin:0}
.bv-sub{font-size:13.5px;color:#5b6385;margin-top:4px}
.bv-sec{font-size:11px;font-weight:700;color:#858cab;letter-spacing:.12em;text-transform:uppercase;margin:20px 0 10px}

/* KPI cards */
.bv-kpis{background:linear-gradient(135deg,#0d1b3e 0%,#1a3a8f 60%,#1a56db 100%);display:grid;gap:10px;margin-bottom:16px;border-radius:16px;padding:16px;box-shadow:0 10px 32px rgba(13,27,62,.28)}
.bv-kpis.c4{grid-template-columns:repeat(4,1fr)}
.bv-kpis.c3{grid-template-columns:repeat(3,1fr)}
.bv-kpi{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:14px 16px}
.bv-kpi-l{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.55)}
.bv-kpi-v{font-size:20px;font-weight:800;margin-top:6px;font-family:'JetBrains Mono',monospace;color:#fff;font-variant-numeric:tabular-nums;letter-spacing:-.02em}
.bv-kpi-s{font-size:11px;color:rgba(255,255,255,.45);margin-top:3px}
.bv-kpi.ok .bv-kpi-v{color:#6ee7b7}
.bv-kpi.bad .bv-kpi-v{color:#fca5a5}
.bv-kpi.warn .bv-kpi-v{color:#fcd34d}
.bv-kpi.blue .bv-kpi-v{color:#93c5fd}
.bv-kpi.accent{background:rgba(255,255,255,.18);border-color:rgba(255,255,255,.25)}
.bv-kpi.accent .bv-kpi-l{color:rgba(255,255,255,.7)}
.bv-kpi.accent .bv-kpi-v{color:#fff}
.bv-kpi.accent .bv-kpi-s{color:rgba(255,255,255,.5)}

/* Rowcard */
.bv-rowcard{background:#fff;border:1px solid #eef0f7;border-radius:14px;margin-bottom:12px;
  box-shadow:0 1px 2px rgba(11,18,48,.03)}
.bv-rowcard-head{display:flex;align-items:center;gap:12px;padding:16px 20px;border-bottom:1px solid #eef0f7}
.bv-b-av{width:36px;height:36px;border-radius:10px;display:grid;place-items:center;font-weight:800;font-size:14px;flex-shrink:0}
.bv-b-av.c0{background:#dcfce7;color:#15803d}
.bv-b-av.c1{background:#eef2ff;color:#1f2fc4}
.bv-b-av.c2{background:#fee2e2;color:#b91c1c}
.bv-b-av.c3{background:#fef3c7;color:#a16207}
.bv-b-name{font-size:15px;font-weight:700;color:#0b1230}
.bv-b-meta{font-size:12.5px;color:#5b6385;margin-top:1px}
.bv-b-side{margin-left:auto;text-align:right}

/* Minikpis */
.bv-mkpis{background:linear-gradient(135deg,#0d1b3e 0%,#1a3a8f 60%,#1a56db 100%);display:grid;grid-template-columns:repeat(4,1fr);gap:10px;padding:14px 18px;border-bottom:1px solid #eef0f7}
.bv-mk{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:10px 12px}
.bv-mk-l{font-size:10px;font-weight:700;color:rgba(255,255,255,.55);letter-spacing:.1em;text-transform:uppercase}
.bv-mk-v{font-size:15px;font-weight:800;margin-top:4px;font-family:'JetBrains Mono',monospace;color:#fff;font-variant-numeric:tabular-nums;letter-spacing:-.02em}
.bv-mk.ok .bv-mk-v{color:#6ee7b7}
.bv-mk.bad .bv-mk-v{color:#fca5a5}
.bv-mk.blue .bv-mk-v{color:#93c5fd}

/* Rowcard footer */
.bv-rowcard-foot{display:flex;align-items:center;justify-content:space-between;padding:12px 20px;
  font-size:12.5px;color:#5b6385;border-top:1px dashed #eef0f7}
.bv-rowcard-foot b{color:#0b1230;font-weight:700}

/* Status blip */
.bv-blip{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:700}
.bv-blip::before{content:'';display:inline-block;width:8px;height:8px;border-radius:50%;background:currentColor}
.bv-blip.ok{color:#1fa67a}
.bv-blip.warn{color:#e89b2f}
.bv-blip.bad{color:#e0425a}

/* Pill */
.bv-pill{display:inline-flex;align-items:center;font-size:11px;font-weight:700;letter-spacing:.04em;
  padding:3px 10px;border-radius:999px;text-transform:uppercase}
.bv-pill.g{background:#dcfce7;color:#15803d}
.bv-pill.a{background:#fef3c7;color:#a16207}
.bv-pill.r{background:#fee2e2;color:#b91c1c}
.bv-pill.b{background:#eef0f7;color:#5b6385}
.bv-pill.blue{background:#eef2ff;color:#1f2fc4}

/* Table */
.bv-tw{background:#fff;border:1px solid #eef0f7;border-radius:14px;overflow-x:auto;
  box-shadow:0 1px 2px rgba(11,18,48,.03)}
.bv-tw table{width:100%;border-collapse:collapse;font-size:13.5px;min-width:560px}
.bv-tw thead th{text-align:left;font-size:11px;font-weight:700;color:#858cab;letter-spacing:.1em;
  padding:12px 16px;background:#f6f7fb;border-bottom:1px solid #eef0f7;text-transform:uppercase;white-space:nowrap}
.bv-tw tbody td{padding:13px 16px;border-bottom:1px solid #eef0f7;color:#3a4267;vertical-align:middle}
.bv-tw tbody tr:last-child td{border-bottom:0}
.bv-tw tbody tr:hover{background:#f6f7fb}
.bv-mono{font-family:'JetBrains Mono',monospace;font-size:12.5px;color:#5b6385}
.bv-money{font-family:'JetBrains Mono',monospace;font-weight:800;font-variant-numeric:tabular-nums;letter-spacing:-.02em}
.bv-money.ok{color:#1fa67a}
.bv-money.bad{color:#e0425a}
.bv-money.warn{color:#e89b2f}
.bv-money.blue{color:#1f2fc4}
.bv-muted{color:#858cab}

/* Branch tab strip */
.bv-tabs{display:inline-flex;background:#fff;border:1px solid #eef0f7;border-radius:10px;padding:4px;margin-bottom:16px;gap:0}
.bv-tab{border:0;background:transparent;cursor:pointer;font-family:inherit;font-size:13px;font-weight:600;
  color:#5b6385;padding:7px 16px;border-radius:7px;transition:all .12s}
.bv-tab:hover{color:#0b1230}
.bv-tab.on{background:#2a3ef0;color:#fff;box-shadow:0 2px 8px -3px rgba(42,62,240,.5)}

/* Vgroup (inventory) */
.bv-vg{background:#fff;border:1px solid #eef0f7;border-radius:14px;margin-bottom:14px;overflow:hidden}
.bv-vg-head{padding:12px 18px;border-bottom:1px solid #eef0f7;font-size:11px;font-weight:700;
  color:#5b6385;letter-spacing:.1em;text-transform:uppercase;background:#f6f7fb}

/* Search row */
.bv-search-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px}
.bv-input-wrap{display:flex;align-items:center;background:#fff;border:1.5px solid #d9ddea;border-radius:10px;transition:border-color .15s}
.bv-input-wrap:focus-within{border-color:#3b54ff;box-shadow:0 0 0 3px rgba(59,84,255,.12)}
.bv-input-wrap svg{width:36px;flex-shrink:0;color:#858cab;display:grid;place-items:center;padding:0 10px}
.bv-input-wrap input{flex:1;border:0;outline:0;background:transparent;padding:10px 12px 10px 0;font:inherit;font-size:14px;color:#0b1230}

/* Btn */
.bv-btn{display:inline-flex;align-items:center;gap:8px;height:36px;padding:0 14px;border-radius:9px;font:inherit;
  font-weight:600;font-size:13px;cursor:pointer;transition:all .12s;border:1.5px solid #d9ddea;background:#fff;color:#3a4267}
.bv-btn:hover{border-color:#b4bace;background:#f6f7fb}
.bv-btn.primary{background:linear-gradient(180deg,#3b54ff,#2a3ef0);color:#fff;border:0;
  box-shadow:0 5px 14px -5px rgba(42,62,240,.5)}
.bv-btn.primary:hover{filter:brightness(1.06)}
.bv-btn.amber{background:#fef3c7;color:#a16207;border-color:#fde68a}
.bv-btn.amber:hover{background:#fde68a}

/* Form */
.bv-form-panel{background:#fff;border:1px solid #eef0f7;border-radius:14px;padding:22px}
.bv-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px 20px}
.bv-form-grid .span2{grid-column:span 2}
.bv-lbl{font-size:12px;font-weight:600;color:#1f2747;letter-spacing:.02em;display:block;margin-bottom:5px}
.bv-inp{width:100%;border:1.5px solid #d9ddea;border-radius:9px;padding:10px 12px;font:inherit;font-size:14px;
  color:#0b1230;outline:0;transition:border-color .15s}
.bv-inp:focus{border-color:#3b54ff;box-shadow:0 0 0 3px rgba(59,84,255,.12)}
.bv-sel{appearance:none;-webkit-appearance:none;background:#fff url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23858cab' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") no-repeat right 12px center;padding-right:32px;cursor:pointer}

/* Callout */
.bv-callout{display:flex;align-items:flex-start;gap:10px;padding:11px 14px;background:#eff6ff;border:1px solid #dbeafe;border-radius:10px;font-size:13px;color:#1e40af;font-weight:500;margin-bottom:14px}
.bv-callout.red{background:#fff1f2;border-color:#fecdd3;color:#be123c}

/* Empty */
.bv-empty{padding:32px;text-align:center;color:#858cab;font-size:13.5px}

/* Prog bar */
.bv-prog{height:5px;background:#eef0f7;border-radius:99px;overflow:hidden;margin-bottom:4px}
.bv-prog-fill{height:100%;border-radius:99px;background:#2a3ef0;transition:width .3s}

/* Loan card */
.bv-loan{background:#fff;border:1px solid #eef0f7;border-radius:14px;padding:18px 20px;margin-bottom:10px}

/* Responsive */
@media(max-width:700px){
  .bv-kpis.c4{grid-template-columns:repeat(2,1fr)}
  .bv-kpis.c3{grid-template-columns:repeat(2,1fr)}
  .bv-mkpis{grid-template-columns:repeat(2,1fr)}
  .bv-search-row{grid-template-columns:1fr}
  .bv-form-grid{grid-template-columns:1fr}
  .bv-form-grid .span2{grid-column:auto}
  .bv-title{font-size:20px}
  .bv-rowcard-foot{flex-wrap:wrap;gap:6px}
  .bv-rowcard-head{flex-wrap:wrap;gap:8px}
}
@media(max-width:480px){
  .bv-kpis.c4{grid-template-columns:1fr}
  .bv-kpis.c3{grid-template-columns:1fr}
  .bv-mkpis{grid-template-columns:1fr 1fr}
}
`;

function useFP() {
  const { period, rangeFrom, rangeTo } = useApp();
  return list => filterPeriod(list, period, rangeFrom, rangeTo);
}
function useFmt() {
  const { cfg } = useApp();
  return n => fmt(n, cfg.currency);
}

const AV_COLORS = ['c0','c1','c2','c3'];
function branchColor(branches, b) {
  const idx = branches.indexOf(b);
  return AV_COLORS[idx % AV_COLORS.length];
}

function Pill({ children, type = 'b' }) {
  return <span className={`bv-pill ${type}`}>{children}</span>;
}
function Blip({ type = 'ok', children }) {
  return <span className={`bv-blip ${type}`}>{children}</span>;
}
function Money({ children, tone = '', big }) {
  return <span className={`bv-money${tone ? ' ' + tone : ''}${big ? ' bv-money-big' : ''}`}>{children}</span>;
}

function VerifyModal({ rem, fmtC, onConfirm, onClose }) {
  if (!rem) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(11,18,48,.55)', backdropFilter: 'blur(3px)' }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', padding: '0 0 32px' }} onClick={e => e.stopPropagation()}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: '#d9ddea' }} />
        </div>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,#0d1b3e 0%,#1a3a8f 60%,#1a56db 100%)', padding: '20px 24px 22px', margin: '0 0 0' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.55)', marginBottom: 4 }}>Transfer Details</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', fontFamily: "'JetBrains Mono',monospace", letterSpacing: '-.02em' }}>{fmtC(rem.amount)}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', marginTop: 4 }}>{rem.branch} · {rem.date}</div>
        </div>
        {/* Details */}
        <div style={{ padding: '20px 24px 0' }}>
          {[
            { l: 'Branch', v: rem.branch },
            { l: 'Amount', v: fmtC(rem.amount) },
            { l: 'Bank', v: rem.bank || '—' },
            { l: 'Account Number', v: rem.account || '—' },
            { l: 'Transaction ID', v: rem.txID || '—' },
            { l: 'Date', v: rem.date },
          ].map(({ l, v }) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', borderBottom: '1px solid #f0f0f5' }}>
              <span style={{ fontSize: 13, color: '#858cab', fontWeight: 600 }}>{l}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#0b1230', fontFamily: l === 'Transaction ID' || l === 'Account Number' ? 'monospace' : 'inherit' }}>{v}</span>
            </div>
          ))}
        </div>
        {/* Receipt */}
        <div style={{ padding: '18px 24px 0' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#858cab', marginBottom: 10 }}>Receipt</div>
          {rem.receiptUrl
            ? <a href={rem.receiptUrl} target="_blank" rel="noreferrer">
                <img src={rem.receiptUrl} alt="receipt" style={{ width: '100%', borderRadius: 12, border: '1.5px solid #eef0f7', display: 'block', objectFit: 'contain', maxHeight: 320 }} />
              </a>
            : <div style={{ background: '#f6f7fb', border: '1.5px dashed #d9ddea', borderRadius: 12, padding: '28px 0', textAlign: 'center', color: '#858cab', fontSize: 13 }}>No receipt attached</div>}
        </div>
        {/* Actions */}
        <div style={{ padding: '20px 24px 0', display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '13px 0', borderRadius: 12, border: '1.5px solid #d9ddea', background: '#fff', fontSize: 14, fontWeight: 600, color: '#5b6385', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex: 2, padding: '13px 0', borderRadius: 12, border: 0, background: 'linear-gradient(180deg,#1fa67a,#17896a)', fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 16px -4px rgba(31,166,122,.5)' }}>✓ Confirm & Verify</button>
        </div>
      </div>
    </div>
  );
}

export default function BossViews({ tabId }) {
  const { cfg, db, setActiveTab } = useApp();
  const filterP = useFP();
  const fmtC = useFmt();

  if (tabId === 'overview')    return <BossOverview     filterP={filterP} fmtC={fmtC} cfg={cfg} db={db} setActiveTab={setActiveTab} />;
  if (tabId === 'branches')    return <BossBranches     filterP={filterP} fmtC={fmtC} cfg={cfg} db={db} />;
  if (tabId === 'orders')      return <BossOrders       filterP={filterP} fmtC={fmtC} cfg={cfg} db={db} />;
  if (tabId === 'riders')      return <BossRiders       fmtC={fmtC} cfg={cfg} db={db} />;
  if (tabId === 'vendor-pay')  return <BossVendorPay    filterP={filterP} fmtC={fmtC} cfg={cfg} db={db} />;
  if (tabId === 'inventory')   return <BossInventory    cfg={cfg} db={db} />;
  if (tabId === 'tools')       return <BossTools        setActiveTab={setActiveTab} cfg={cfg} />;
  if (tabId === 'dfees')       return <BossDeliveryFees fmtC={fmtC} cfg={cfg} db={db} setActiveTab={setActiveTab} />;
  if (tabId === 'loans')       return <BossLoans        fmtC={fmtC} db={db} setActiveTab={setActiveTab} />;
  return null;
}

// ─── Overview ─────────────────────────────────────────────────────────────────

function BossOverview({ filterP, fmtC, cfg, db, setActiveTab }) {
  const { setDb } = useApp();
  const [verifyRem, setVerifyRem] = useState(null);
  let totalOrdersVal = 0, totalCash = 0, totalPos = 0, totalExp = 0, totalNetExp = 0, totalSent = 0, totalStillToSend = 0;
  cfg.branches.forEach(b => {
    const c = branchCalc(b, cfg, db, filterP);
    totalOrdersVal += c.ordersVal; totalCash += c.cash; totalPos += c.pos;
    totalExp += c.exp; totalNetExp += c.netExpected; totalSent += c.sent; totalStillToSend += c.stillToSend;
  });
  const shortfallPays = Object.values(db.payments).filter(p => p.shortfall && p.shortfall > 0);
  const unverifiedRems = filterP(db.remittances.filter(r => !r.verified));

  function confirmVerify() {
    setDb(prev => ({
      ...prev,
      remittances: prev.remittances.map(r => r.id === verifyRem.id ? { ...r, verified: true } : r),
    }));
    setVerifyRem(null);
  }

  return (
    <div className="bv">
      <style>{CSS}</style>
      <div className="pg-hd"><p className="pg-title">Overview</p><p className="pg-sub">All branches at a glance</p></div>
      <div className="pg-body">
        <DateFilter />

        <p className="bv-sec">Remittance Status</p>
        {cfg.branches.map((b, idx) => {
          const c = branchCalc(b, cfg, db, filterP);
          return (
            <div key={b} className="bv-rowcard" style={{ padding: '14px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div className={`bv-b-av ${branchColor(cfg.branches, b)}`}>{b[0]}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="bv-b-name">{b}</div>
                  <div className="bv-b-meta">{c.delivered} orders · {fmtC(c.cash + c.pos)} collected</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {c.netExpected <= 0
                    ? <div style={{ fontSize: 13, fontWeight: 700, color: '#858cab' }}>₦0</div>
                    : c.sent === 0
                      ? <><div style={{ fontSize: 13, fontWeight: 700, color: '#e0425a' }}>⚠ Not Sent</div><div style={{ fontSize: 11.5, color: '#e0425a', marginTop: 2 }}>{fmtC(c.stillToSend)} pending</div></>
                      : c.stillToSend > 0
                        ? <><div style={{ fontSize: 13, fontWeight: 700, color: '#d97706' }}>⚠ Partial</div><div style={{ fontSize: 11.5, color: '#d97706', marginTop: 2 }}>{fmtC(c.stillToSend)} remaining</div></>
                        : <><Blip type="ok">Confirmed</Blip><div style={{ fontSize: 11.5, color: '#858cab', marginTop: 2 }}>{fmtC(c.sent)} sent</div></>}
                </div>
              </div>
            </div>
          );
        })}

        <p className="bv-sec">Today's Totals</p>
        <div className="navy-hero mb20">
          <div className="mini-grid">
            <div className="mini-card"><p className="mini-l">Orders Value</p><p className="mini-v" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmtC(totalOrdersVal)}</p></div>
            <div className="mini-card"><p className="mini-l">Cash Collected</p><p className="mini-v" style={{ color: '#93c5fd', fontFamily: "'JetBrains Mono', monospace" }}>{fmtC(totalCash)}</p></div>
            <div className="mini-card"><p className="mini-l">POS Collected</p><p className="mini-v" style={{ color: '#6ee7b7', fontFamily: "'JetBrains Mono', monospace" }}>{fmtC(totalPos)}</p></div>
            <div className="mini-card"><p className="mini-l">Branch Expenses</p><p className="mini-v" style={{ color: '#fca5a5', fontFamily: "'JetBrains Mono', monospace" }}>−{fmtC(totalExp)}</p></div>
          </div>
          <div className="bottom-strip">
            <div className="bs-cell"><p className="bs-l">Net Expected</p><p className="bs-v" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmtC(totalNetExp)}</p></div>
            <div className="bs-cell"><p className="bs-l">Cash Sent</p><p className="bs-v" style={{ color: '#6ee7b7', fontFamily: "'JetBrains Mono', monospace" }}>{fmtC(totalSent)}</p></div>
            <div className="bs-cell"><p className="bs-l">Still to Send</p><p className="bs-v" style={{ color: totalStillToSend > 0 ? '#fca5a5' : '#6ee7b7', fontFamily: "'JetBrains Mono', monospace" }}>{totalStillToSend <= 0 && totalSent > 0 ? '₦0 ✓' : fmtC(Math.max(0, totalStillToSend))}</p></div>
          </div>
        </div>

        {shortfallPays.length > 0 && (
          <>
            <p className="bv-sec" style={{ color: '#e0425a' }}>Outstanding Riders</p>
            <div className="bv-tw">
              <table>
                <thead><tr><th>Rider</th><th>Branch</th><th>Date</th><th style={{ textAlign: 'right' }}>Shortfall</th></tr></thead>
                <tbody>
                  {shortfallPays.map((p, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{p.rider}</td>
                      <td><Pill>{p.branch}</Pill></td>
                      <td className="bv-mono">{p.date}</td>
                      <td style={{ textAlign: 'right' }}><Money tone="bad">{fmtC(p.shortfall)}</Money></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {unverifiedRems.length > 0 && (
          <>
            <p className="bv-sec" style={{ color: '#d97706' }}>⏳ Pending Verification</p>
            <div className="bv-tw">
              <table>
                <thead><tr><th>Branch</th><th>Amount</th><th>Bank</th><th>TXN ID</th><th>Date</th><th>Receipt</th><th></th></tr></thead>
                <tbody>
                  {unverifiedRems.map((r, i) => (
                    <tr key={i}>
                      <td><Pill>{r.branch}</Pill></td>
                      <td><Money tone="ok">{fmtC(r.amount)}</Money></td>
                      <td>{r.bank || '—'}</td>
                      <td className="bv-mono">{r.txID || '—'}</td>
                      <td className="bv-mono">{r.date}</td>
                      <td>
                        {r.receiptUrl
                          ? <a href={r.receiptUrl} target="_blank" rel="noreferrer">
                              <img src={r.receiptUrl} alt="receipt" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 8, border: '1.5px solid #d9ddea', cursor: 'pointer' }} />
                            </a>
                          : <span style={{ fontSize: 11, color: '#858cab' }}>—</span>}
                      </td>
                      <td><button className="bv-btn amber" style={{ height: 30, fontSize: 12 }} onClick={() => setVerifyRem(r)}>Verify →</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
      <VerifyModal rem={verifyRem} fmtC={fmtC} onConfirm={confirmVerify} onClose={() => setVerifyRem(null)} />
    </div>
  );
}

// ─── Branches & Remittances ───────────────────────────────────────────────────

function BossBranches({ filterP, fmtC, cfg, db }) {
  const { setDb } = useApp();
  const [verifyRem, setVerifyRem] = useState(null);

  function confirmVerify() {
    setDb(prev => ({
      ...prev,
      remittances: prev.remittances.map(r => r.id === verifyRem.id ? { ...r, verified: true } : r),
    }));
    setVerifyRem(null);
  }

  return (
    <div className="bv">
      <style>{CSS}</style>
      <div className="pg-hd"><p className="pg-title">Branches & Remittances</p><p className="pg-sub">Per-branch position, delivery rate & transfer verification</p></div>
      <div className="pg-body">
        <DateFilter />
        {cfg.branches.map(b => {
          const c = branchCalc(b, cfg, db, filterP);
          const allOrds = filterP(db.orders.filter(o => o.branch === b));
          const pct = allOrds.length ? Math.round((c.delivered / allOrds.length) * 100) : 0;
          const rems = filterP(db.remittances.filter(r => r.branch === b));
          const shortPays = Object.values(db.payments).filter(p => p.branch === b && p.shortfall > 0);
          const unverified = rems.filter(r => !r.verified).length;
          const balanced = c.stillToSend <= 0;
          return (
            <div key={b} className="bv-rowcard" style={{ padding: 0 }}>
              <div className="bv-rowcard-head">
                <div className={`bv-b-av ${branchColor(cfg.branches, b)}`}>{b[0]}</div>
                <div style={{ flex: 1 }}>
                  <div className="bv-b-name">{b}</div>
                  <div className="bv-b-meta">{c.riders.length} riders · {c.delivered}/{allOrds.length} delivered · {pct}%{unverified > 0 ? ` · ⏳ ${unverified} unverified` : ''}</div>
                </div>
                <Pill type={balanced ? 'g' : 'a'}>{balanced ? 'Balanced' : 'Pending'}</Pill>
              </div>
              <div className="bv-mkpis">
                <div className="bv-mk ok"><div className="bv-mk-l">Cash</div><div className="bv-mk-v">{fmtC(c.cash)}</div></div>
                <div className="bv-mk blue"><div className="bv-mk-l">POS</div><div className="bv-mk-v">{fmtC(c.pos)}</div></div>
                <div className="bv-mk bad"><div className="bv-mk-l">Expenses</div><div className="bv-mk-v">{fmtC(c.exp)}</div></div>
                <div className="bv-mk"><div className="bv-mk-l">Net Expected</div><div className="bv-mk-v">{fmtC(c.netExpected)}</div></div>
              </div>
              <div style={{ padding: '10px 18px 12px' }}>
                <div className="bv-prog"><div className="bv-prog-fill" style={{ width: `${pct}%` }} /></div>
              </div>
              <div className="bv-rowcard-foot">
                <div>Cash Sent: <b style={{ color: '#1fa67a' }}>{fmtC(c.sent)}</b></div>
                <div>Bonus payable: <b>{fmtC(c.bonus)}</b></div>
                {c.shortfall > 0 && <div style={{ color: '#e0425a', fontWeight: 700 }}>⚠ Shortfall: {fmtC(c.shortfall)}</div>}
              </div>
              {shortPays.length > 0 && (
                <div>
                  <div style={{ margin: '0 18px', borderTop: '1px solid #fee2e2', paddingTop: 10, paddingBottom: 2 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#e0425a', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 6 }}>⚠ Rider Shortfalls</div>
                  </div>
                  <div className="bv-tw" style={{ border: 0, borderRadius: 0, boxShadow: 'none', margin: '0 0 1px' }}>
                    <table>
                      <thead><tr><th>Rider</th><th>Expected</th><th>Paid</th><th>Shortfall</th><th>Date</th></tr></thead>
                      <tbody>
                        {shortPays.map((p, i) => (
                          <tr key={i}>
                            <td style={{ fontWeight: 600 }}>{p.rider}</td>
                            <td><Money>{fmtC(p.expected || 0)}</Money></td>
                            <td><Money tone="warn">{fmtC(p.cash || 0)}</Money></td>
                            <td><Money tone="bad">{fmtC(p.shortfall)}</Money></td>
                            <td className="bv-mono">{p.date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              <div className="bv-tw" style={{ border: 0, borderRadius: 0, boxShadow: 'none', borderTop: '1px solid #eef0f7' }}>
                <table>
                  <thead><tr><th>Amount</th><th>Bank</th><th>TXN ID</th><th>Date</th><th>Receipt</th><th>Status</th></tr></thead>
                  <tbody>
                    {rems.length ? rems.map((r, i) => (
                      <tr key={i}>
                        <td><Money tone="ok">{fmtC(r.amount)}</Money></td>
                        <td>{r.bank || '—'}</td>
                        <td className="bv-mono">{r.txID || '—'}</td>
                        <td className="bv-mono">{r.date}</td>
                        <td>
                          {r.receiptUrl
                            ? <a href={r.receiptUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-block' }}>
                                <img src={r.receiptUrl} alt="receipt" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8, border: '1.5px solid #d9ddea', cursor: 'pointer' }} />
                              </a>
                            : <span style={{ fontSize: 11, color: '#858cab' }}>—</span>}
                        </td>
                        <td>{r.verified ? <Blip type="ok">Verified</Blip> : <button className="bv-btn amber" style={{ height: 30, fontSize: 12 }} onClick={() => setVerifyRem(r)}>Verify →</button>}</td>
                      </tr>
                    )) : <tr><td colSpan={6}><div className="bv-empty">No remittance logged</div></td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
      <VerifyModal rem={verifyRem} fmtC={fmtC} onConfirm={confirmVerify} onClose={() => setVerifyRem(null)} />
    </div>
  );
}

// ─── Orders ───────────────────────────────────────────────────────────────────

const STATUS_PILL = {
  delivered:    <span className="bv-pill g">Delivered</span>,
  pending:      <span className="bv-pill a">Pending</span>,
  'in-transit': <span className="bv-pill blue">In transit</span>,
  cancelled:    <span className="bv-pill r">Cancelled</span>,
  failed:       <span className="bv-pill r">Failed</span>,
  replaced:     <span className="bv-pill a">Replaced</span>,
};

function statusPill(s) {
  return STATUS_PILL[s?.toLowerCase()] || <span className="bv-pill b">{s}</span>;
}

function BossOrders({ filterP, fmtC, cfg, db }) {
  const all = filterP(db.orders);
  const total = all.reduce((s, o) => s + ot(o), 0);
  return (
    <div className="bv">
      <style>{CSS}</style>
      <div className="pg-hd"><p className="pg-title">All Orders</p><p className="pg-sub">{all.length} orders in period · {fmtC(total)} total value</p></div>
      <div className="pg-body">
        <DateFilter />
        <div className="bv-tw">
          <table>
            <thead>
              <tr><th>Customer</th><th>Rider</th><th>Branch</th><th>Status</th><th style={{ textAlign: 'right' }}>Value</th><th>Date</th></tr>
            </thead>
            <tbody>
              {all.length ? all.map(o => (
                <tr key={o.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0b1230' }}>{o.customerName}</div>
                    <div className="bv-mono" style={{ marginTop: 2 }}>{o.phone}</div>
                  </td>
                  <td style={{ color: o.rider ? '#3a4267' : '#858cab' }}>{o.rider || '—'}</td>
                  <td><Pill>{o.branch}</Pill></td>
                  <td>{statusPill(o.status)}</td>
                  <td style={{ textAlign: 'right' }}><Money>{fmtC(ot(o))}</Money></td>
                  <td className="bv-mono">{o.date}</td>
                </tr>
              )) : (
                <tr><td colSpan={6}><div className="bv-empty">No orders in this period</div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Riders ───────────────────────────────────────────────────────────────────

function BossRiders({ fmtC, cfg, db }) {
  return (
    <div className="bv">
      <style>{CSS}</style>
      <div className="pg-hd"><p className="pg-title">Riders & Bonus</p><p className="pg-sub">Cycle: 14th → 15th next month · auto-calculated</p></div>
      <div className="pg-body">
        {cfg.branches.map(b => {
          const riders = db.riders[b] || [];
          const total = riders.reduce((s, name) => s + calcBonus(getBonusCycleOrders(name, db).length, name, cfg), 0);
          return (
            <div key={b} className="bv-rowcard" style={{ padding: 0 }}>
              <div className="bv-rowcard-head">
                <div className={`bv-b-av ${branchColor(cfg.branches, b)}`}>{b[0]}</div>
                <div>
                  <div className="bv-b-name">{b}</div>
                  <div className="bv-b-meta">{riders.length} riders · cycle 14th → 15th</div>
                </div>
                <div className="bv-b-side">
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#858cab' }}>Total Bonus</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#1fa67a', fontFamily: "'JetBrains Mono',monospace", marginTop: 3 }}>{fmtC(total)}</div>
                </div>
              </div>
              {riders.length === 0
                ? <div className="bv-empty">No riders in this branch</div>
                : <div className="bv-tw" style={{ border: 0, borderRadius: 0, boxShadow: 'none' }}>
                    <table>
                      <thead><tr><th>Rider</th><th style={{ textAlign: 'right' }}>Cycle Deliveries</th><th style={{ textAlign: 'right' }}>Rate</th><th style={{ textAlign: 'right' }}>Bonus</th></tr></thead>
                      <tbody>
                        {riders.map(name => {
                          const cc = getBonusCycleOrders(name, db).length;
                          return (
                            <tr key={name}>
                              <td style={{ fontWeight: 600 }}>{name}</td>
                              <td style={{ textAlign: 'right' }} className="bv-mono">{cc}</td>
                              <td style={{ textAlign: 'right' }} className="bv-mono">{fmtC(bonusRate(cc, name, cfg))}/order</td>
                              <td style={{ textAlign: 'right' }}><Money tone="ok">{fmtC(calcBonus(cc, name, cfg))}</Money></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
              }
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Vendor Payments ──────────────────────────────────────────────────────────

function BossVendorPay({ filterP, fmtC, cfg, db }) {
  const { setDb, vpSelected, setVpSelected } = useApp();
  const [payFields, setPayFields] = useState({ amount: '', date: TODAY, bank: '', account: '', accountName: '', txID: '' });

  function vendorCalc(vn) {
    const vOrds = filterP(db.orders.filter(o => gp(o).some(p => p.vendor === vn) && (REVENUE_STATUSES.includes(o.status) || o.status === 'Failed' || o.status === 'Replaced')));
    const del = vOrds.filter(o => REVENUE_STATUSES.includes(o.status));
    function vt(o) { return gp(o).filter(p => p.vendor === vn).reduce((s, p) => s + (Number(p.price) || 0), 0); }
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

  // All-vendors summary table
  const allRows = cfg.vendors.map(v => {
    const vc = vendorCalc(v);
    const st = vc.remaining <= 0 && vc.paid > 0 ? 'paid' : vc.paid > 0 ? 'partial' : 'unpaid';
    return { v, ...vc, st };
  });
  const totalPayable = allRows.reduce((s, r) => s + r.net, 0);
  const totalPaid    = allRows.reduce((s, r) => s + r.paid, 0);
  const totalRem     = totalPayable - totalPaid;

  return (
    <div className="bv">
      <style>{CSS}</style>
      <div className="pg-hd"><p className="pg-title">Vendor Payments</p><p className="pg-sub">Select a vendor to see breakdown & log a payment</p></div>
      <div className="pg-body">
        <DateFilter />
        <div className="bv-kpis c3" style={{ marginBottom: 16 }}>
          <div className="bv-kpi"><div className="bv-kpi-l">Total Payable</div><div className="bv-kpi-v">{fmtC(totalPayable)}</div></div>
          <div className="bv-kpi ok"><div className="bv-kpi-l">Paid</div><div className="bv-kpi-v">{fmtC(totalPaid)}</div></div>
          <div className={`bv-kpi ${totalRem > 0 ? 'warn' : 'ok'}`}><div className="bv-kpi-l">Remaining</div><div className="bv-kpi-v">{fmtC(totalRem)}</div></div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label className="bv-lbl">Select Vendor</label>
          <select className={`bv-inp bv-sel`} value={vpSelected || ''} onChange={e => setVpSelected(e.target.value)} style={{ maxWidth: 320 }}>
            <option value="">— Choose vendor —</option>
            {cfg.vendors.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>

        {!vpSelected && (
          <div className="bv-tw">
            <table>
              <thead><tr><th>Vendor</th><th style={{ textAlign: 'right' }}>Net Payable</th><th style={{ textAlign: 'right' }}>Paid</th><th style={{ textAlign: 'right' }}>Remaining</th><th>Status</th></tr></thead>
              <tbody>
                {allRows.map(r => (
                  <tr key={r.v} style={{ cursor: 'pointer' }} onClick={() => setVpSelected(r.v)}>
                    <td style={{ fontWeight: 700, color: '#1f2fc4' }}>{r.v}</td>
                    <td style={{ textAlign: 'right' }}><Money>{fmtC(r.net)}</Money></td>
                    <td style={{ textAlign: 'right' }}><Money tone={r.paid > 0 ? 'ok' : ''}>{fmtC(r.paid)}</Money></td>
                    <td style={{ textAlign: 'right' }}><Money tone={r.remaining > 0 ? 'bad' : 'ok'}>{r.remaining === 0 ? '—' : fmtC(r.remaining)}</Money></td>
                    <td>{r.st === 'paid' ? <Pill type="g">Paid</Pill> : r.st === 'partial' ? <Pill type="a">Partial</Pill> : <Pill type="r">Unpaid</Pill>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {vpSelected && c && (
          <>
            <div className="bv-kpis c4" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 16 }}>
              <div className="bv-kpi blue"><div className="bv-kpi-l">Delivered Value</div><div className="bv-kpi-v">{fmtC(c.totalVal)}</div></div>
              <div className="bv-kpi bad"><div className="bv-kpi-l">Fees Deducted</div><div className="bv-kpi-v">−{fmtC(c.fees)}</div></div>
              <div className="bv-kpi"><div className="bv-kpi-l">Net Payable</div><div className="bv-kpi-v">{fmtC(c.net)}</div></div>
              <div className="bv-kpi ok"><div className="bv-kpi-l">Amount Paid</div><div className="bv-kpi-v">{fmtC(c.paid)}</div></div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 14, fontWeight: 700 }}>{vpSelected}</span>
              {payStatus === 'paid' ? <Pill type="g">Fully Paid</Pill> : payStatus === 'partial' ? <Pill type="a">Partial Payment</Pill> : <Pill type="r">Not Yet Paid</Pill>}
            </div>

            {c.remaining > 0 && (
              <div className="bv-form-panel" style={{ marginBottom: 16, borderColor: '#e0e7ff', background: '#fafbff' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2fc4', marginBottom: 14 }}>Log Payment to {vpSelected}</div>
                <div style={{ fontSize: 12, color: '#5b6385', marginBottom: 14 }}>Remaining: <strong style={{ color: '#e0425a' }}>{fmtC(c.remaining)}</strong></div>
                <div className="bv-form-grid" style={{ marginBottom: 14 }}>
                  <div><label className="bv-lbl">Amount Paid</label><input className="bv-inp" type="number" value={payFields.amount} onChange={e => setPayFields(f => ({ ...f, amount: e.target.value }))} /></div>
                  <div><label className="bv-lbl">Date</label><input className="bv-inp" type="date" value={payFields.date} onChange={e => setPayFields(f => ({ ...f, date: e.target.value }))} /></div>
                  <div><label className="bv-lbl">Bank Name</label><input className="bv-inp" value={payFields.bank} onChange={e => setPayFields(f => ({ ...f, bank: e.target.value }))} placeholder="GTBank, Opay..." /></div>
                  <div><label className="bv-lbl">Account Number</label><input className="bv-inp" value={payFields.account} onChange={e => setPayFields(f => ({ ...f, account: e.target.value }))} placeholder="0123456789" style={{ fontFamily: 'monospace' }} /></div>
                  <div><label className="bv-lbl">Account Name</label><input className="bv-inp" value={payFields.accountName} onChange={e => setPayFields(f => ({ ...f, accountName: e.target.value }))} /></div>
                  <div><label className="bv-lbl">Transaction ID <span style={{ color: '#e0425a' }}>*</span></label><input className="bv-inp" value={payFields.txID} onChange={e => setPayFields(f => ({ ...f, txID: e.target.value }))} placeholder="TRF..." style={{ fontFamily: 'monospace' }} /></div>
                </div>
                <button className="bv-btn primary" onClick={savePayment}>Submit Payment →</button>
              </div>
            )}

            {payments.length > 0 && (
              <>
                <div className="bv-sec">Payment History</div>
                <div className="bv-tw">
                  <table>
                    <thead><tr><th>Amount</th><th>Bank</th><th>Account</th><th>Account Name</th><th>TXN ID</th><th>Date</th></tr></thead>
                    <tbody>
                      {payments.map((p, i) => (
                        <tr key={i}>
                          <td><Money tone="ok">{fmtC(p.amount)}</Money></td>
                          <td>{p.bank || '—'}</td>
                          <td className="bv-mono">{p.account || '—'}</td>
                          <td style={{ fontSize: 12 }}>{p.accountName || '—'}</td>
                          <td className="bv-mono">{p.txID || '—'}</td>
                          <td className="bv-mono">{p.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Inventory (boss read-only) ───────────────────────────────────────────────

function BossInventory({ cfg, db }) {
  const [sv, setSv] = useState('');
  const [sp, setSp] = useState('');

  // Aggregate across all branches per vendor/product
  // Received = IDIMU only (stock comes in at IDIMU)
  // Delivered = sum across all branches
  function aggregate(vendor, product) {
    const idimuEntry = db.inventory['IDIMU']?.[vendor]?.[product] || {};
    const received = idimuEntry.received || 0;
    const delivered = cfg.branches.reduce((s, b) => {
      return s + (db.inventory[b]?.[vendor]?.[product]?.delivered || 0);
    }, 0);
    const remaining = received - delivered;
    return { received, delivered, remaining };
  }

  // Collect all products per vendor across all branches
  function vendorProducts(vendor) {
    const seen = new Set();
    cfg.branches.forEach(b => {
      Object.keys(db.inventory[b]?.[vendor] || {}).forEach(p => seen.add(p));
    });
    return [...seen];
  }

  const rows = cfg.vendors
    .filter(v => !sv || v.toLowerCase().includes(sv.toLowerCase()))
    .map(v => {
      const prods = vendorProducts(v)
        .filter(p => !sp || p.toLowerCase().includes(sp.toLowerCase()))
        .map(p => ({ p, ...aggregate(v, p) }));
      return { v, prods };
    })
    .filter(({ prods }) => prods.length > 0);

  const grandReceived  = rows.reduce((s, { prods }) => s + prods.reduce((a, r) => a + r.received, 0), 0);
  const grandDelivered = rows.reduce((s, { prods }) => s + prods.reduce((a, r) => a + r.delivered, 0), 0);
  const grandRemaining = grandReceived - grandDelivered;

  return (
    <div className="bv">
      <style>{CSS}</style>
      <div className="pg-hd"><p className="pg-title">Inventory</p><p className="pg-sub">All vendors · received at IDIMU · delivered across all branches</p></div>
      <div className="pg-body">

        <div className="bv-kpis c3" style={{ marginBottom: 16 }}>
          <div className="bv-kpi blue"><div className="bv-kpi-l">Total Received</div><div className="bv-kpi-v">{grandReceived}</div><div className="bv-kpi-s">into IDIMU warehouse</div></div>
          <div className="bv-kpi ok"><div className="bv-kpi-l">Total Delivered</div><div className="bv-kpi-v">{grandDelivered}</div><div className="bv-kpi-s">across all branches</div></div>
          <div className={`bv-kpi ${grandRemaining <= 0 ? 'bad' : ''}`}><div className="bv-kpi-l">Total Remaining</div><div className="bv-kpi-v">{grandRemaining}</div><div className="bv-kpi-s">{grandRemaining <= 0 ? 'out of stock' : 'in stock'}</div></div>
        </div>

        <div className="bv-search-row">
          <div className="bv-input-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ padding: '0 10px', flexShrink: 0, width: 36 }}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
            <input placeholder="Search vendor…" value={sv} onChange={e => setSv(e.target.value)} />
          </div>
          <div className="bv-input-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ padding: '0 10px', flexShrink: 0, width: 36 }}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
            <input placeholder="Search product…" value={sp} onChange={e => setSp(e.target.value)} />
          </div>
        </div>

        {rows.length === 0
          ? <div className="bv-empty">No stock entries found</div>
          : rows.map(({ v, prods }) => {
            const vRec = prods.reduce((s, r) => s + r.received, 0);
            const vDel = prods.reduce((s, r) => s + r.delivered, 0);
            const vRem = vRec - vDel;
            return (
            <div key={v} className="bv-vg">
              <div className="bv-vg-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{v}</span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: vRem <= 0 ? '#e0425a' : '#1fa67a' }}>
                  {vRec} in · {vDel} out · {vRem} left
                </span>
              </div>
              <div className="bv-tw" style={{ border: 0, borderRadius: 0, boxShadow: 'none' }}>
                <table>
                  <thead><tr>
                    <th>Product</th>
                    <th style={{ textAlign: 'right' }}>Received (IDIMU)</th>
                    <th style={{ textAlign: 'right' }}>Delivered (all)</th>
                    <th style={{ textAlign: 'right' }}>Remaining</th>
                    <th>Status</th>
                  </tr></thead>
                  <tbody>
                    {prods.map(({ p, received, delivered, remaining }) => (
                      <tr key={p}>
                        <td style={{ fontWeight: 600 }}>{p}</td>
                        <td style={{ textAlign: 'right' }} className="bv-mono">{received}</td>
                        <td style={{ textAlign: 'right' }}><Money tone="ok">{delivered}</Money></td>
                        <td style={{ textAlign: 'right' }}><Money tone={remaining <= 0 ? 'bad' : ''}>{remaining}</Money></td>
                        <td>
                          {remaining <= 0 ? <Pill type="r">Out</Pill>
                            : remaining <= 5 ? <Pill type="a">Low</Pill>
                            : <Pill type="g">In Stock</Pill>}
                        </td>
                      </tr>
                    ))}
                    <tr style={{ background: '#f6f7fb', borderTop: '2px solid #eef0f7' }}>
                      <td style={{ fontWeight: 700, color: '#5b6385', fontSize: 12 }}>SUBTOTAL</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }} className="bv-mono">{vRec}</td>
                      <td style={{ textAlign: 'right' }}><Money tone="ok">{vDel}</Money></td>
                      <td style={{ textAlign: 'right' }}><Money tone={vRem <= 0 ? 'bad' : ''}>{vRem}</Money></td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            );
          })
        }

        {rows.length > 0 && (
          <div className="bv-rowcard" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0b1230' }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: '#fff', letterSpacing: '.06em', textTransform: 'uppercase' }}>Grand Total</span>
            <div style={{ display: 'flex', gap: 28 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#858cab', letterSpacing: '.1em', textTransform: 'uppercase' }}>Received</div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 18, color: '#93c5fd', marginTop: 2 }}>{grandReceived}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#858cab', letterSpacing: '.1em', textTransform: 'uppercase' }}>Delivered</div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 18, color: '#6ee7b7', marginTop: 2 }}>{grandDelivered}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#858cab', letterSpacing: '.1em', textTransform: 'uppercase' }}>Remaining</div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 18, color: grandRemaining <= 0 ? '#fca5a5' : '#fff', marginTop: 2 }}>{grandRemaining}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CEO Tools ────────────────────────────────────────────────────────────────

function BossTools({ setActiveTab, cfg }) {
  return (
    <div className="bv">
      <style>{CSS}</style>
      <div className="pg-hd"><p className="pg-title">CEO Tools</p></div>
      <div className="pg-body">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div className="bv-rowcard" style={{ padding: 20, cursor: 'pointer' }} onClick={() => setActiveTab('dfees')}>
            <div style={{ width: 42, height: 42, borderRadius: 11, background: '#fef3c7', border: '1.5px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 14 }}>🏍</div>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 5 }}>Delivery Fees</div>
            <div style={{ fontSize: 12, color: '#5b6385' }}>Set fees for failed & delivered orders from rider manager</div>
          </div>
          <div className="bv-rowcard" style={{ padding: 20, cursor: 'pointer' }} onClick={() => setActiveTab('loans')}>
            <div style={{ width: 42, height: 42, borderRadius: 11, background: '#ede9fe', border: '1.5px solid #ddd6fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 14 }}>💰</div>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 5 }}>Staff Loans</div>
            <div style={{ fontSize: 12, color: '#5b6385' }}>Track loans and repayments</div>
          </div>
        </div>
        <div className="bv-rowcard" style={{ padding: 18, background: '#fafbff' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#858cab', marginBottom: 12 }}>Staff Login Credentials</div>
          {[{ u: 'boss', p: 'boss@2025', r: 'Boss / CEO' }, ...cfg.branches.map(b => ({ u: `${b.toLowerCase()}_manager`, p: `${b.toLowerCase()}mgr2025`, r: `${b} Manager` }))].map(u => (
            <div key={u.u} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #eef0f7' }}>
              <span style={{ fontSize: 12, color: '#5b6385' }}>{u.r}</span>
              <code style={{ fontSize: 11, color: '#858cab' }}>{u.u} / {u.p}</code>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Delivery Fees ────────────────────────────────────────────────────────────

function BossDeliveryFees({ fmtC, cfg, db, setActiveTab }) {
  const { setDb } = useApp();
  const [feeInputs, setFeeInputs] = useState({});

  const eligible = db.orders.filter(o => REVENUE_STATUSES.includes(o.status) || o.status === 'Failed' || o.status === 'Replaced');
  const pending = eligible.filter(o => !db.deliveryFees[o.id]);
  const done = eligible.filter(o => db.deliveryFees[o.id]);

  function saveFee(orderId) {
    const v = Number(feeInputs[orderId] || 0);
    if (!v) { alert('Enter a fee amount'); return; }
    setDb(prev => ({ ...prev, deliveryFees: { ...prev.deliveryFees, [orderId]: v } }));
    setFeeInputs(prev => { const n = { ...prev }; delete n[orderId]; return n; });
  }

  return (
    <div className="bv">
      <style>{CSS}</style>
      <div className="pg-hd"><p className="pg-title">Delivery Fees</p><p className="pg-sub">Fee deducted from total collected. Address is the key identifier.</p></div>
      <div className="pg-body">
        <button className="bv-btn" style={{ marginBottom: 16 }} onClick={() => setActiveTab('tools')}>← Back</button>
        {pending.length > 0 && (
          <>
            <div className="bv-sec" style={{ color: '#e89b2f' }}>Awaiting fee · {pending.length}</div>
            {pending.map(o => {
              const total = ot(o);
              const fee = Number(feeInputs[o.id] || 0);
              const net = fee > 0 ? Math.max(0, total - fee) : null;
              return (
                <div key={o.id} className="bv-rowcard" style={{ padding: 18, marginBottom: 8 }}>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 3 }}>📍 {o.address}</div>
                    <div style={{ fontSize: 12, color: '#5b6385' }}>Rider: <strong>{o.rider}</strong> · {o.branch} · {o.date}</div>
                    <div style={{ fontSize: 12, color: '#5b6385', marginTop: 2 }}>{o.customerName} · {o.phone}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginTop: 6 }}>Order total: <span style={{ color: '#1f2fc4' }}>{fmtC(total)}</span></div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                      <label className="bv-lbl">Delivery Fee</label>
                      <input className="bv-inp" type="number" placeholder="e.g. 500" value={feeInputs[o.id] || ''} onChange={e => setFeeInputs(p => ({ ...p, [o.id]: e.target.value }))} />
                    </div>
                    <button className="bv-btn amber" onClick={() => saveFee(o.id)}>Save Fee</button>
                  </div>
                  {net !== null && <div style={{ marginTop: 6, fontSize: 12, color: '#1fa67a', fontWeight: 600 }}>Net to vendor after fee: {fmtC(net)}</div>}
                </div>
              );
            })}
          </>
        )}
        {done.length > 0 && (
          <>
            <div className="bv-sec" style={{ color: '#1fa67a' }}>Fee set · {done.length}</div>
            <div className="bv-tw">
              <table>
                <thead><tr><th>Address</th><th>Rider</th><th>Order Total</th><th>Fee</th><th>Net to Vendor</th></tr></thead>
                <tbody>
                  {done.map(o => {
                    const total = ot(o); const fee = db.deliveryFees[o.id];
                    return (
                      <tr key={o.id}>
                        <td><div style={{ fontWeight: 600 }}>📍 {o.address}</div><div style={{ fontSize: 11, color: '#858cab' }}>{o.customerName}</div></td>
                        <td style={{ fontSize: 12 }}>{o.rider}</td>
                        <td><Money>{fmtC(total)}</Money></td>
                        <td><Money tone="bad">−{fmtC(fee)}</Money></td>
                        <td><Money tone="ok">{fmtC(Math.max(0, total - fee))}</Money></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
        {!eligible.length && <div className="bv-empty">No orders yet. Delivered and failed orders appear here once logged by rider manager.</div>}
      </div>
    </div>
  );
}

// ─── Staff Loans ──────────────────────────────────────────────────────────────

function BossLoans({ fmtC, db, setActiveTab }) {
  const { setDb } = useApp();
  const [newLoan, setNewLoan] = useState({ name: '', total: '', salary: '', date: TODAY, note: '' });
  const active = db.loans.filter(l => l.status !== 'cleared');
  const cleared = db.loans.filter(l => l.status === 'cleared');
  const owed = active.reduce((s, l) => {
    const r = (l.repayments || []).reduce((rs, p) => rs + p.amount, 0);
    return s + Math.max(0, l.total - r);
  }, 0);

  function saveLoan() {
    if (!newLoan.name || !newLoan.total) return;
    setDb(prev => ({
      ...prev,
      loans: [...prev.loans, { id: Date.now(), ...newLoan, total: Number(newLoan.total), salary: Number(newLoan.salary) || 0, repayments: [], status: 'active' }],
    }));
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
    <div className="bv">
      <style>{CSS}</style>
      <div className="pg-hd"><p className="pg-title">Staff Loans</p></div>
      <div className="pg-body">
        <button className="bv-btn" style={{ marginBottom: 16 }} onClick={() => setActiveTab('tools')}>← Back</button>

        {owed > 0 && (
          <div className="bv-kpi accent" style={{ marginBottom: 16, padding: '20px 22px' }}>
            <div className="bv-kpi-l">Total Outstanding</div>
            <div style={{ fontSize: 32, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", color: '#e0425a', marginTop: 6 }}>{fmtC(owed)}</div>
          </div>
        )}

        <div className="bv-form-panel" style={{ marginBottom: 16, borderColor: '#e0e7ff', background: '#fafbff' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2fc4', marginBottom: 14 }}>Add New Loan</div>
          <div className="bv-form-grid" style={{ marginBottom: 14 }}>
            <div><label className="bv-lbl">Staff Name</label><input className="bv-inp" value={newLoan.name} placeholder="Full name" onChange={e => setNewLoan(l => ({ ...l, name: e.target.value }))} /></div>
            <div><label className="bv-lbl">Loan Amount</label><input className="bv-inp" type="number" value={newLoan.total} placeholder="0" onChange={e => setNewLoan(l => ({ ...l, total: e.target.value }))} /></div>
            <div><label className="bv-lbl">Monthly Salary</label><input className="bv-inp" type="number" value={newLoan.salary} placeholder="0" onChange={e => setNewLoan(l => ({ ...l, salary: e.target.value }))} /></div>
            <div><label className="bv-lbl">Date</label><input className="bv-inp" type="date" value={newLoan.date} onChange={e => setNewLoan(l => ({ ...l, date: e.target.value }))} /></div>
            <div className="span2"><label className="bv-lbl">Note</label><input className="bv-inp" value={newLoan.note} placeholder="Reason..." onChange={e => setNewLoan(l => ({ ...l, note: e.target.value }))} /></div>
          </div>
          <button className="bv-btn primary" onClick={saveLoan}>Add Loan</button>
        </div>

        {active.map(l => <LoanCard key={l.id} loan={l} fmtC={fmtC} onRepay={saveRepay} />)}

        {cleared.length > 0 && (
          <>
            <div className="bv-sec">Cleared · {cleared.length}</div>
            {cleared.map(l => (
              <div key={l.id} className="bv-rowcard" style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{l.name}</div>
                  <div style={{ fontSize: 11, color: '#858cab' }}>{l.date} · {fmtC(l.total)}</div>
                </div>
                <Pill type="g">Cleared</Pill>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function LoanCard({ loan: l, fmtC, onRepay }) {
  const [repayAmt, setRepayAmt] = useState('');
  const [repayDate, setRepayDate] = useState(TODAY);
  const repaid = (l.repayments || []).reduce((s, r) => s + r.amount, 0);
  const bal = Math.max(0, l.total - repaid);
  const pct = l.total > 0 ? Math.min(100, Math.round((repaid / l.total) * 100)) : 0;

  return (
    <div className="bv-loan" style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{l.name}</div>
          <div style={{ fontSize: 11, color: '#858cab' }}>{l.date}{l.note ? ' · ' + l.note : ''}{l.salary ? ' · 50%=' + fmtC(l.salary * .5) : ''}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#e0425a', fontFamily: "'JetBrains Mono',monospace" }}>{fmtC(bal)}</div>
          <div style={{ fontSize: 11, color: '#858cab' }}>of {fmtC(l.total)}</div>
        </div>
      </div>
      <div className="bv-prog"><div className="bv-prog-fill" style={{ width: `${pct}%` }} /></div>
      <div style={{ fontSize: 11, color: '#858cab', marginBottom: 12 }}>{fmtC(repaid)} repaid · {pct}%</div>
      {(l.repayments || []).map((r, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #eef0f7', fontSize: 12 }}>
          <span style={{ color: '#5b6385' }}>{r.date}</span>
          <Money tone="ok">+{fmtC(r.amount)}</Money>
        </div>
      ))}
      <div className="bv-form-grid" style={{ marginTop: 14, marginBottom: 10 }}>
        <div><label className="bv-lbl">Repayment</label><input className="bv-inp" type="number" value={repayAmt} placeholder="0" onChange={e => setRepayAmt(e.target.value)} /></div>
        <div><label className="bv-lbl">Date</label><input className="bv-inp" type="date" value={repayDate} onChange={e => setRepayDate(e.target.value)} /></div>
      </div>
      <button className="bv-btn primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => { onRepay(l.id, repayAmt, repayDate); setRepayAmt(''); }}>+ Log Repayment</button>
    </div>
  );
}
