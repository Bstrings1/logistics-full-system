import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TODAY, filterPeriod } from '../utils/helpers';

/* ─── Design-system CSS (scoped to .inv2) ─────────────────────────── */
const INV_CSS = `
  .inv2 { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
  .inv2-topbar { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:22px; gap:16px; flex-wrap:wrap; }
  .inv2-crumb { display:flex; align-items:center; gap:8px; font-size:12px; color:#858cab; font-weight:500; margin-bottom:6px; }
  .inv2-crumb .sep { color:#b4bace; }
  .inv2-page-title { margin:0 0 2px; font-size:24px; font-weight:700; letter-spacing:-0.5px; display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
  .inv2-page-sub { font-size:13.5px; color:#5b6385; margin-top:4px; }
  .inv2-chip { font-size:12px; font-weight:600; padding:3px 10px; border-radius:8px; }
  .inv2-chip.blue  { background:#eef2ff; color:#2a3ef0; }
  .inv2-chip.green { background:#dcfce7; color:#15803d; }
  .inv2-chip.red   { background:#fee2e2; color:#b91c1c; }

  /* Branch tabs */
  .inv2-branches { display:flex; gap:5px; align-items:center; background:#fff; border:1px solid #eef0f7; padding:5px; border-radius:12px; width:fit-content; max-width:100%; margin-bottom:22px; flex-wrap:wrap; overflow-x:auto; }
  .inv2-branch-btn { display:flex; align-items:center; gap:7px; padding:7px 13px; border-radius:8px; font-size:13px; font-weight:600; border:0; cursor:pointer; transition:all .15s; }
  .inv2-branch-btn.active  { background:#2a3ef0; color:#fff; box-shadow:0 4px 10px -4px rgba(42,62,240,.4); }
  .inv2-branch-btn.inactive{ background:transparent; color:#3a4267; }
  .inv2-branch-btn.inactive:hover { background:#f4f6fb; }

  /* KPI cards */
  .inv2-kpis { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:14px; }
  .inv2-kpi { background:#fff; border:1px solid #eef0f7; border-radius:16px; padding:16px 18px; }
  .inv2-kpi.danger { background:linear-gradient(180deg,#fff,#fff6f6); border-color:#f5d0d6; }
  .inv2-kpi-label { display:flex; align-items:center; gap:8px; font-size:11px; font-weight:600; letter-spacing:.08em; text-transform:uppercase; color:#858cab; }
  .inv2-kpi.danger .inv2-kpi-label { color:#e0425a; }
  .inv2-kpi-badge { font-size:10px; padding:2px 7px; border-radius:999px; background:#eef0f7; color:#5b6385; letter-spacing:0; text-transform:none; }
  .inv2-kpi.danger .inv2-kpi-badge { background:#fde2e6; color:#e0425a; }
  .inv2-kpi-val { font-size:30px; font-weight:700; letter-spacing:-0.8px; margin-top:6px; color:#0b1230; font-variant-numeric:tabular-nums; }
  .inv2-kpi.danger .inv2-kpi-val { color:#e0425a; }
  .inv2-kpi-sub { margin-top:6px; font-size:12px; font-weight:600; color:#858cab; }

  /* Dark strip */
  .inv2-strip { display:grid; grid-template-columns:repeat(3,1fr); background:linear-gradient(135deg,#0b1446,#060c2e); color:#fff; border-radius:16px; padding:18px 24px; margin-bottom:24px; }
  .inv2-strip-cell { position:relative; padding-left:22px; }
  .inv2-strip-cell+.inv2-strip-cell { border-left:1px solid rgba(255,255,255,.08); }
  .inv2-strip-label { font-size:11px; letter-spacing:.12em; text-transform:uppercase; color:rgba(255,255,255,.55); font-weight:600; }
  .inv2-strip-val { font-size:24px; font-weight:700; margin-top:6px; display:flex; align-items:baseline; gap:8px; }
  .inv2-strip-unit { color:rgba(255,255,255,.4); font-size:13px; font-weight:500; }

  /* Table wrap */
  .inv2-table-wrap { background:#fff; border:1px solid #eef0f7; border-radius:16px; overflow-x:auto; }
  .inv2 table.inv2-t { min-width:640px; }
  .inv2-table-head { display:flex; align-items:center; gap:14px; padding:16px 18px; border-bottom:1px solid #eef0f7; flex-wrap:wrap; }
  .inv2-search { position:relative; flex:1; max-width:280px; }
  .inv2-search input { width:100%; height:36px; padding:0 12px 0 34px; border:1px solid #d9ddea; border-radius:9px; background:#fff; font:inherit; font-size:13px; outline:none; color:#0b1230; }
  .inv2-search input:focus { border-color:#3b54ff; box-shadow:0 0 0 3px rgba(59,84,255,.12); }
  .inv2-search svg { position:absolute; left:10px; top:50%; transform:translateY(-50%); color:#858cab; pointer-events:none; }
  .inv2 table.inv2-t { width:100%; border-collapse:collapse; font-size:13.5px; }
  .inv2 table.inv2-t thead th { text-align:left; font-size:11px; font-weight:700; color:#858cab; letter-spacing:.1em; padding:12px 16px; background:#f6f7fb; border-bottom:1px solid #eef0f7; text-transform:uppercase; white-space:nowrap; }
  .inv2 table.inv2-t tbody td { padding:14px 16px; border-bottom:1px solid #eef0f7; color:#1f2747; vertical-align:middle; }
  .inv2 table.inv2-t tbody tr:last-child td { border-bottom:0; }
  .inv2 table.inv2-t tbody tr:hover { background:#f6f7fb; }
  .inv2 table.inv2-t tfoot td { padding:12px 16px; background:#f6f7fb; border-top:2px solid #eef0f7; font-weight:700; font-size:13px; }
  .inv2 .inv2-qty-in  { color:#1fa67a; font-weight:700; }
  .inv2 .inv2-qty-out { color:#e0425a; font-weight:700; }
  .inv2 .inv2-qty-tx  { color:#2a3ef0; font-weight:700; }
  .inv2 .inv2-mono { font-family:'JetBrains Mono',ui-monospace,monospace; font-size:12.5px; color:#858cab; }

  /* Vendor section header */
  .inv2-vendor-hd { background:#eef2ff; border-bottom:1.5px solid #c7d2fe; padding:10px 16px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; }
  .inv2-vendor-name { font-weight:700; font-size:14px; color:#2a3ef0; }
  .inv2-vendor-stats { display:flex; gap:16px; }
  .inv2-vendor-stat { font-size:12px; color:#5b6385; }

  /* Pills */
  .inv2-pill { display:inline-flex; align-items:center; gap:6px; font-size:11px; font-weight:700; letter-spacing:.04em; padding:3px 10px; border-radius:999px; text-transform:uppercase; }
  .inv2-pill.green { background:#dcfce7; color:#15803d; }
  .inv2-pill.red   { background:#fee2e2; color:#b91c1c; }
  .inv2-pill.blue  { background:#eef2ff; color:#1f2fc4; }
  .inv2-pill.in-stock  { background:#dcfce7; color:#15803d; }
  .inv2-pill.out-stock { background:#fee2e2; color:#b91c1c; }

  /* Form panel */
  .inv2-form-panel { background:#fff; border:1px solid #eef0f7; border-radius:16px; padding:24px; }
  .inv2-form-grid  { display:grid; grid-template-columns:repeat(2,1fr); gap:16px 20px; }
  .inv2-form-grid.one { grid-template-columns:1fr; }
  .inv2-wide { grid-column:span 2; }
  .inv2-field { display:flex; flex-direction:column; gap:6px; }
  .inv2-field label { font-size:12px; font-weight:600; color:#1f2747; letter-spacing:.02em; }
  .inv2-field .req { color:#e0425a; }
  .inv2-field .hint { font-size:11.5px; color:#858cab; margin-top:2px; }
  .inv2-control { position:relative; display:flex; align-items:center; background:#fff; border:1.5px solid #d9ddea; border-radius:10px; transition:border-color .15s,box-shadow .15s; }
  .inv2-control:hover { border-color:#c3c9dc; }
  .inv2-control:focus-within { border-color:#3b54ff; box-shadow:0 0 0 4px rgba(59,84,255,.14); }
  .inv2-control .lead { width:40px; display:grid; place-items:center; color:#858cab; flex-shrink:0; }
  .inv2-control input,.inv2-control select,.inv2-control textarea { flex:1; border:0; outline:0; background:transparent; padding:11px 14px; font:inherit; font-size:14px; color:#0b1230; }
  .inv2-control select { appearance:none; -webkit-appearance:none; padding-right:32px; cursor:pointer; }
  .inv2-control textarea { min-height:72px; resize:vertical; }
  .inv2-control .chev { position:absolute; right:10px; top:50%; transform:translateY(-50%); color:#858cab; pointer-events:none; }
  .inv2-control .trail { padding:0 12px; color:#858cab; font-size:12px; font-weight:600; flex-shrink:0; }
  .inv2-tx-arrow { width:40px; height:40px; border-radius:10px; background:#eef2ff; color:#2a3ef0; display:grid; place-items:center; flex-shrink:0; }
  .inv2-callout { display:flex; align-items:flex-start; gap:10px; padding:10px 14px; background:#eef2ff; border:1px solid #e0e7ff; border-radius:10px; color:#1f2fc4; font-size:13px; font-weight:500; margin-bottom:20px; }
  .inv2-callout.warn { background:#fff7eb; border-color:#fce3bc; color:#8a5a10; }
  .inv2-callout svg { flex-shrink:0; margin-top:1px; }
  .inv2-form-footer { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-top:24px; padding-top:18px; border-top:1px solid #eef0f7; flex-wrap:wrap; }
  .inv2-form-footer .helper { font-size:12px; color:#858cab; }
  .inv2-filter-bar { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:18px; align-items:end; }

  /* Buttons */
  .inv2-btn { display:inline-flex; align-items:center; gap:8px; height:38px; padding:0 14px; border-radius:10px; font:inherit; font-weight:600; font-size:13px; cursor:pointer; transition:all .15s; border:1px solid #d9ddea; background:#fff; color:#1f2747; text-decoration:none; white-space:nowrap; }
  .inv2-btn:hover { border-color:#b4bace; background:#f6f7fb; }
  .inv2-btn.primary { background:linear-gradient(180deg,#3b54ff,#2a3ef0); color:#fff; border-color:transparent; box-shadow:0 6px 14px -6px rgba(42,62,240,.5); }
  .inv2-btn.primary:hover { filter:brightness(1.05); }
  .inv2-btn.primary:disabled,.inv2-btn.primary.off { background:#c7cdf8; box-shadow:none; cursor:not-allowed; opacity:.8; filter:none; }
  .inv2-btn.lg { height:44px; padding:0 20px; font-size:14px; }

  /* Empty state */
  .inv2-empty { padding:60px 24px 68px; display:flex; flex-direction:column; align-items:center; text-align:center; }
  .inv2-empty-icon { width:96px; height:96px; border-radius:24px; background:#eef2ff; display:grid; place-items:center; margin-bottom:18px; }
  .inv2-empty-title { font-size:17px; font-weight:700; color:#0b1230; }
  .inv2-empty-sub { font-size:13.5px; color:#5b6385; margin-top:6px; max-width:420px; line-height:1.5; }
  .inv2-empty-actions { display:flex; gap:10px; margin-top:20px; flex-wrap:wrap; justify-content:center; }

  /* Top actions row */
  .inv2-top-actions { display:flex; gap:10px; align-items:center; flex-shrink:0; }

  @media (max-width:860px) {
    .inv2-kpis { grid-template-columns:repeat(2,1fr); }
    .inv2-strip { grid-template-columns:1fr; gap:14px; }
    .inv2-strip-cell+.inv2-strip-cell { border-left:none; border-top:1px solid rgba(255,255,255,.08); padding-left:0; padding-top:14px; }
    .inv2-form-grid { grid-template-columns:1fr; }
    .inv2-wide { grid-column:auto; }
    .inv2-filter-bar { grid-template-columns:1fr; }
    .inv2-page-title { font-size:18px; }
    .inv2-topbar { flex-direction:column; gap:10px; }
    .inv2-top-actions { flex-wrap:wrap; }
  }
  @media (max-width:480px) {
    .inv2-kpis { grid-template-columns:1fr; }
    .inv2-table-head { flex-direction:column; align-items:stretch; }
    .inv2-search { max-width:100%; }
  }
`;

const ChevDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 9l5 5 5-5"/></svg>
);

function Field({ label, req, hint, children }) {
  return (
    <div className="inv2-field">
      <label>{label} {req && <span className="req">*</span>}</label>
      {children}
      {hint && <div className="hint">{hint}</div>}
    </div>
  );
}

function Select({ value, onChange, options, placeholder }) {
  return (
    <div className="inv2-control">
      <select value={value} onChange={onChange}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => typeof o === 'string'
          ? <option key={o} value={o}>{o}</option>
          : <option key={o.value} value={o.value}>{o.label}</option>
        )}
      </select>
      <span className="chev"><ChevDown /></span>
    </div>
  );
}

function Input({ value, onChange, type = 'text', placeholder, trail, min }) {
  return (
    <div className="inv2-control">
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} min={min} />
      {trail && <span className="trail">{trail}</span>}
    </div>
  );
}

function Textarea({ value, onChange, placeholder }) {
  return (
    <div className="inv2-control">
      <textarea value={value} onChange={onChange} placeholder={placeholder} />
    </div>
  );
}

/* ─── Top-level router ─────────────────────────────────────── */
export default function InventoryViews({ tabId }) {
  const { session, setActiveTab } = useApp();
  const isAdmin = session.role === 'inventory-admin';
  const branch = isAdmin ? null : session.branch;

  return (
    <div className="inv2" style={{ padding: '22px 28px 40px', minWidth: 0 }}>
      <style>{INV_CSS}</style>
      {tabId === 'stock'       && <InvStock branch={branch} isAdmin={isAdmin} setActiveTab={setActiveTab} />}
      {tabId === 'waybill-in'  && isAdmin && <WaybillIn />}
      {tabId === 'waybill-out' && isAdmin && <WaybillOut />}
      {tabId === 'transfer'    && isAdmin && <Transfer />}
      {tabId === 'inv-history' && isAdmin && <InvHistory />}
    </div>
  );
}

/* ─── Stock Overview ───────────────────────────────────────── */
function InvStock({ branch, isAdmin, setActiveTab }) {
  const { cfg, db } = useApp();
  const [sq, setSq] = useState('');
  const [selectedBranch, setSelectedBranch] = useState(branch || cfg.branches[0] || 'IDIMU');
  const [period, setPeriod] = useState('all');
  const [rangeFrom, setRangeFrom] = useState('');
  const [rangeTo, setRangeTo] = useState('');

  const viewBranch = isAdmin ? selectedBranch : branch;
  const branchInv = db.inventory[viewBranch] || {};

  // Filter history entries by period for activity-based display
  const history = db.inventoryHistory || [];
  const filteredHistory = period === 'all' ? history : filterPeriod(history, period, rangeFrom, rangeTo);
  const activeProducts = new Set(filteredHistory.filter(h => h.fromBranch === viewBranch || h.toBranch === viewBranch).map(h => `${h.vendor}::${h.product}`));

  let totalReceived = 0, totalSentOut = 0, totalDelivered = 0, totalInStock = 0, totalOut = 0;
  Object.values(branchInv).forEach(prods => {
    Object.values(prods).forEach(d => {
      totalReceived += d.received || 0;
      totalSentOut += d.sentOut || 0;
      totalDelivered += d.delivered || 0;
      const rem = (d.received || 0) - (d.sentOut || 0) - (d.delivered || 0);
      rem > 0 ? totalInStock++ : totalOut++;
    });
  });
  const totalRemaining = totalReceived - totalSentOut - totalDelivered;

  const rows = cfg.vendors
    .map(v => {
      const items = branchInv[v] || {};
      const q = sq.toLowerCase();
      const vendorMatch = !q || v.toLowerCase().includes(q);
      let filt = Object.entries(items);
      if (q && !vendorMatch) filt = filt.filter(([p]) => p.toLowerCase().includes(q));
      if (period !== 'all') filt = filt.filter(([p]) => activeProducts.has(`${v}::${p}`));
      return { v, filt };
    })
    .filter(({ filt }) => filt.length > 0);

  return (
    <>
      <div className="inv2-topbar">
        <div>
          <div className="inv2-crumb">
            <span>Operations</span><span className="sep">/</span>
            <span>Stock</span><span className="sep">/</span>
            <span style={{ color: '#1f2747', fontWeight: 600 }}>{viewBranch}</span>
          </div>
          <h1 className="inv2-page-title">
            Stock overview
            <span className="inv2-chip blue">{viewBranch} branch</span>
          </h1>
          <p className="inv2-page-sub">Monitor what's in, what's out, and what needs restocking.</p>
        </div>
        {isAdmin && (
          <div className="inv2-top-actions">
            <button className="inv2-btn primary" onClick={() => setActiveTab('waybill-in')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
              New waybill
            </button>
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="inv2-branches">
          {cfg.branches.map(b => (
            <button key={b} className={`inv2-branch-btn ${selectedBranch === b ? 'active' : 'inactive'}`} onClick={() => setSelectedBranch(b)}>{b}</button>
          ))}
        </div>
      )}

      {/* Date period filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        {[['all','All time'],['today','Today'],['week','This week'],['month','This month'],['range','Range']].map(([id, label]) => (
          <button key={id} onClick={() => setPeriod(id)} className={`inv2-btn${period === id ? ' primary' : ''}`} style={{ height: 32, padding: '0 12px', fontSize: 12 }}>{label}</button>
        ))}
        {period === 'range' && (
          <>
            <div className="inv2-control" style={{ width: 150 }}><input type="date" value={rangeFrom} onChange={e => setRangeFrom(e.target.value)} style={{ padding: '6px 10px', fontSize: 13 }} /></div>
            <div className="inv2-control" style={{ width: 150 }}><input type="date" value={rangeTo} onChange={e => setRangeTo(e.target.value)} style={{ padding: '6px 10px', fontSize: 13 }} /></div>
          </>
        )}
        {period !== 'all' && <span style={{ fontSize: 12, color: '#858cab' }}>Showing products with activity in period</span>}
      </div>

      {/* KPI cards */}
      <div className="inv2-kpis">
        {[
          { label: 'Total received', val: totalReceived, unit: 'items', sub: totalReceived === 0 ? '— no activity yet' : 'across all vendors' },
          { label: 'Total sent out', val: totalSentOut, unit: 'items', sub: totalSentOut === 0 ? '—' : 'transfers + waybill out' },
          { label: 'Total remaining', val: totalRemaining, unit: 'items', sub: totalRemaining === 0 ? 'Awaiting inbound' : 'available now' },
        ].map(({ label, val, unit, sub }) => (
          <div key={label} className="inv2-kpi">
            <div className="inv2-kpi-label">{label}</div>
            <div className="inv2-kpi-val">{val} <span style={{ fontSize: 13, color: '#858cab', fontWeight: 500 }}>{unit}</span></div>
            <div className="inv2-kpi-sub">{sub}</div>
          </div>
        ))}
        <div className="inv2-kpi danger">
          <div className="inv2-kpi-label">Out of stock <span className="inv2-kpi-badge">alert</span></div>
          <div className="inv2-kpi-val">{totalOut} <span style={{ fontSize: 13, fontWeight: 500, opacity: .7 }}>SKUs</span></div>
          <div className="inv2-kpi-sub">{totalOut === 0 ? 'None flagged — you\'re clear' : `${totalOut} product${totalOut > 1 ? 's' : ''} need restocking`}</div>
        </div>
      </div>

      {/* Dark strip */}
      <div className="inv2-strip">
        {[
          { label: 'In-stock SKUs', val: totalInStock, unit: 'in stock' },
          { label: 'Out of stock', val: totalOut, unit: 'need restock' },
          { label: 'Vendors tracked', val: Object.keys(branchInv).length, unit: 'active' },
        ].map(({ label, val, unit }, i) => (
          <div key={label} className="inv2-strip-cell" style={i === 0 ? { paddingLeft: 0 } : {}}>
            <div className="inv2-strip-label">{label}</div>
            <div className="inv2-strip-val">{val} <span className="inv2-strip-unit">{unit}</span></div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="inv2-table-wrap">
        <div className="inv2-table-head">
          <div style={{ fontWeight: 700, fontSize: 15 }}>Inventory</div>
          <div className="inv2-search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
            <input placeholder="Search products or vendors…" value={sq} onChange={e => setSq(e.target.value)} />
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="inv2-empty">
            <div className="inv2-empty-icon">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#2a3ef0" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7l9-4 9 4-9 4-9-4z"/><path d="M3 7v10l9 4 9-4V7"/><path d="M12 11v10"/></svg>
            </div>
            <div className="inv2-empty-title">No stock recorded at {viewBranch}</div>
            <div className="inv2-empty-sub">Once you record your first inbound shipment, stock will appear here and totals above will update in real time.</div>
            {isAdmin && (
              <div className="inv2-empty-actions">
                <button className="inv2-btn primary" onClick={() => setActiveTab('waybill-in')}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
                  Record waybill in
                </button>
                <button className="inv2-btn" onClick={() => setActiveTab('transfer')}>Transfer from another branch</button>
              </div>
            )}
          </div>
        ) : (
          rows.map(({ v, filt }) => {
            const vRcv = filt.reduce((s, [, d]) => s + (d.received || 0), 0);
            const vSent = filt.reduce((s, [, d]) => s + (d.sentOut || 0), 0);
            const vDel = filt.reduce((s, [, d]) => s + (d.delivered || 0), 0);
            const vRem = vRcv - vSent - vDel;
            const vOut = filt.filter(([, d]) => (d.received || 0) - (d.sentOut || 0) - (d.delivered || 0) <= 0).length;
            return (
              <div key={v}>
                <div className="inv2-vendor-hd">
                  <span className="inv2-vendor-name">{v}</span>
                  <div className="inv2-vendor-stats">
                    <span className="inv2-vendor-stat">Received: <strong style={{ color: '#1fa67a' }}>{vRcv}</strong></span>
                    <span className="inv2-vendor-stat">Sent Out: <strong style={{ color: '#e89b2f' }}>{vSent}</strong></span>
                    <span className="inv2-vendor-stat">Delivered: <strong style={{ color: '#2a3ef0' }}>{vDel}</strong></span>
                    <span className="inv2-vendor-stat" style={{ fontWeight: 700, color: vRem <= 0 ? '#e0425a' : '#0b1230' }}>Remaining: {vRem}</span>
                    {vOut > 0 && <span style={{ fontSize: 11, color: '#e0425a', fontWeight: 700 }}>⚠ {vOut} out</span>}
                  </div>
                </div>
                <table className="inv2-t">
                  <thead>
                    <tr>
                      <th>Product</th><th>Received</th><th>Sent Out</th><th>Delivered</th><th>Remaining</th><th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filt.map(([p, d]) => {
                      const rem = (d.received || 0) - (d.sentOut || 0) - (d.delivered || 0);
                      return (
                        <tr key={p} style={rem <= 0 ? { background: '#fff8f8' } : {}}>
                          <td style={{ fontWeight: 600, color: '#0b1230' }}>{p}</td>
                          <td className="inv2-qty-in">{d.received || 0}</td>
                          <td style={{ color: '#e89b2f', fontWeight: 600 }}>{d.sentOut || 0}</td>
                          <td style={{ color: '#2a3ef0', fontWeight: 600 }}>{d.delivered || 0}</td>
                          <td style={{ fontWeight: 800, fontSize: 15, color: rem <= 0 ? '#e0425a' : '#0b1230' }}>{rem}</td>
                          <td>
                            <span className={`inv2-pill ${rem <= 0 ? 'out-stock' : 'in-stock'}`}>
                              {rem <= 0 ? 'Out' : 'In Stock'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td style={{ color: '#858cab', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>Total</td>
                      <td style={{ color: '#1fa67a' }}>{vRcv}</td>
                      <td style={{ color: '#e89b2f' }}>{vSent}</td>
                      <td style={{ color: '#2a3ef0' }}>{vDel}</td>
                      <td style={{ color: vRem <= 0 ? '#e0425a' : '#0b1230' }}>{vRem}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            );
          })
        )}
      </div>

      {!isAdmin && <p style={{ fontSize: 11, color: '#858cab', marginTop: 16, textAlign: 'center' }}>View only — contact Inventory Admin for stock changes</p>}
    </>
  );
}

/* ─── Waybill In ───────────────────────────────────────────── */
function WaybillIn() {
  const { cfg, setDb } = useApp();
  const [fields, setFields] = useState({ vendor: cfg.vendors[0] || '', product: '', qty: '', date: TODAY, note: '' });
  const products = Array.isArray(cfg.products) ? cfg.products : (cfg.products?.[fields.vendor] || []);
  const canSave = fields.product && fields.qty && Number(fields.qty) > 0;

  function save() {
    if (!canSave) return;
    const q = Number(fields.qty);
    setDb(prev => {
      const inv = JSON.parse(JSON.stringify(prev.inventory));
      if (!inv['IDIMU']) inv['IDIMU'] = {};
      if (!inv['IDIMU'][fields.vendor]) inv['IDIMU'][fields.vendor] = {};
      if (!inv['IDIMU'][fields.vendor][fields.product]) inv['IDIMU'][fields.vendor][fields.product] = { received: 0, delivered: 0 };
      inv['IDIMU'][fields.vendor][fields.product].received += q;
      const histEntry = { id: Date.now(), type: 'waybill-in', fromBranch: null, toBranch: 'IDIMU', vendor: fields.vendor, product: fields.product, qty: q, date: fields.date, note: fields.note };
      return { ...prev, inventory: inv, inventoryHistory: [...prev.inventoryHistory, histEntry] };
    });
    setFields(f => ({ ...f, product: '', qty: '', note: '' }));
  }

  return (
    <>
      <div className="inv2-topbar">
        <div>
          <div className="inv2-crumb"><span>Operations</span><span className="sep">/</span><span style={{ color: '#1f2747', fontWeight: 600 }}>Waybill In</span></div>
          <h1 className="inv2-page-title">Waybill In <span className="inv2-chip green">Inbound</span></h1>
          <p className="inv2-page-sub">Record new stock arriving from a vendor into <strong>IDIMU (HQ)</strong>.</p>
        </div>
      </div>

      <div className="inv2-form-panel">
        <div className="inv2-callout">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v4"/><circle cx="12" cy="16" r="0.5" fill="currentColor"/></svg>
          <div>All inbound stock flows into <strong>IDIMU (HQ)</strong> first. Use Transfer afterwards to move it to other branches.</div>
        </div>

        <div className="inv2-form-grid">
          <Field label="Vendor" req>
            <Select value={fields.vendor} onChange={e => setFields(f => ({ ...f, vendor: e.target.value, product: '' }))} options={cfg.vendors} />
          </Field>
          <Field label="Product" req>
            <Select value={fields.product} onChange={e => setFields(f => ({ ...f, product: e.target.value }))} options={products} placeholder="— Select product —" />
          </Field>
          <Field label="Quantity" req hint="Count of individual units arriving in this shipment.">
            <Input value={fields.qty} onChange={e => setFields(f => ({ ...f, qty: e.target.value }))} type="number" placeholder="0" trail="units" min="1" />
          </Field>
          <Field label="Date received" req>
            <Input value={fields.date} onChange={e => setFields(f => ({ ...f, date: e.target.value }))} type="date" />
          </Field>
          <div className="inv2-wide">
            <Field label="Note">
              <Textarea value={fields.note} onChange={e => setFields(f => ({ ...f, note: e.target.value }))} placeholder="e.g. Damaged carton on SKU-12, 2 units short." />
            </Field>
          </div>
        </div>

        <div className="inv2-form-footer">
          <span className="helper">Submitting creates a ledger entry and updates IDIMU stock.</span>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="inv2-btn" type="button" onClick={() => setFields({ vendor: cfg.vendors[0] || '', product: '', qty: '', date: TODAY, note: '' })}>Clear</button>
            <button className={`inv2-btn primary lg ${!canSave ? 'off' : ''}`} disabled={!canSave} onClick={save}>
              Record Waybill In
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Waybill Out ──────────────────────────────────────────── */
function WaybillOut() {
  const { cfg, db, setDb } = useApp();
  const [fields, setFields] = useState({ branch: cfg.branches[0] || 'IDIMU', vendor: cfg.vendors[0] || '', product: '', qty: '', date: TODAY, reason: '', note: '' });
  const products = Array.isArray(cfg.products) ? cfg.products : (cfg.products?.[fields.vendor] || []);
  const currentStock = db.inventory[fields.branch]?.[fields.vendor]?.[fields.product];
  const remaining = currentStock ? (currentStock.received || 0) - (currentStock.sentOut || 0) - (currentStock.delivered || 0) : 0;
  const canSave = fields.product && fields.qty && Number(fields.qty) > 0 && remaining > 0;

  function save() {
    if (!canSave) return;
    const q = Number(fields.qty);
    if (q > remaining) { alert(`Only ${remaining} in stock at ${fields.branch}`); return; }
    setDb(prev => {
      const inv = JSON.parse(JSON.stringify(prev.inventory));
      if (!inv[fields.branch]) inv[fields.branch] = {};
      if (!inv[fields.branch][fields.vendor]) inv[fields.branch][fields.vendor] = {};
      if (!inv[fields.branch][fields.vendor][fields.product]) inv[fields.branch][fields.vendor][fields.product] = { received: 0, delivered: 0 };
      inv[fields.branch][fields.vendor][fields.product].sentOut = (inv[fields.branch][fields.vendor][fields.product].sentOut || 0) + q;
      const histEntry = { id: Date.now(), type: 'waybill-out', fromBranch: fields.branch, toBranch: null, vendor: fields.vendor, product: fields.product, qty: q, date: fields.date, note: fields.note || fields.reason };
      return { ...prev, inventory: inv, inventoryHistory: [...prev.inventoryHistory, histEntry] };
    });
    setFields(f => ({ ...f, product: '', qty: '', note: '', reason: '' }));
  }

  return (
    <>
      <div className="inv2-topbar">
        <div>
          <div className="inv2-crumb"><span>Operations</span><span className="sep">/</span><span style={{ color: '#1f2747', fontWeight: 600 }}>Waybill Out</span></div>
          <h1 className="inv2-page-title">Waybill Out <span className="inv2-chip red">Outbound</span></h1>
          <p className="inv2-page-sub">Remove stock from a branch — returns to vendor or write-off.</p>
        </div>
      </div>

      <div className="inv2-form-panel">
        <div className="inv2-form-grid">
          <Field label="From branch" req>
            <Select value={fields.branch} onChange={e => setFields(f => ({ ...f, branch: e.target.value }))} options={cfg.branches.map(b => ({ value: b, label: b }))} />
          </Field>
          <Field label="Vendor" req>
            <Select value={fields.vendor} onChange={e => setFields(f => ({ ...f, vendor: e.target.value, product: '' }))} options={cfg.vendors} />
          </Field>
          <Field label="Product" req>
            <Select value={fields.product} onChange={e => setFields(f => ({ ...f, product: e.target.value }))} options={products} placeholder="— Select product —" />
          </Field>
          <Field label="Quantity" req hint={fields.product ? (remaining <= 0 ? '⚠ No stock at this branch' : `Available: ${remaining} units`) : ''}>
            <Input value={fields.qty} onChange={e => setFields(f => ({ ...f, qty: e.target.value }))} type="number" placeholder="0" trail="units" min="1" />
          </Field>
          <Field label="Date" req>
            <Input value={fields.date} onChange={e => setFields(f => ({ ...f, date: e.target.value }))} type="date" />
          </Field>
          <Field label="Reason">
            <Select value={fields.reason} onChange={e => setFields(f => ({ ...f, reason: e.target.value }))} options={['Return to vendor', 'Damaged / write-off', 'Sample']} placeholder="Select reason" />
          </Field>
          <div className="inv2-wide">
            <Field label="Note">
              <Textarea value={fields.note} onChange={e => setFields(f => ({ ...f, note: e.target.value }))} placeholder="Add context for your team…" />
            </Field>
          </div>
        </div>

        <div className="inv2-callout warn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 22h20L12 2z"/><path d="M12 10v5"/><circle cx="12" cy="18" r="0.5" fill="currentColor"/></svg>
          <div>This reduces stock at the selected branch. Action is logged and <strong>cannot be undone</strong> from the UI.</div>
        </div>

        <div className="inv2-form-footer">
          <span className="helper">Outbound movements appear in History.</span>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="inv2-btn" type="button" onClick={() => setFields(f => ({ ...f, product: '', qty: '', note: '', reason: '' }))}>Clear</button>
            <button className={`inv2-btn primary lg ${!canSave ? 'off' : ''}`} disabled={!canSave} onClick={save}>
              Waybill Out
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5"/><path d="M6 11l6-6 6 6"/></svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Transfer ─────────────────────────────────────────────── */
function Transfer() {
  const { cfg, db, setDb } = useApp();
  const [fields, setFields] = useState({ fromBranch: cfg.branches[0] || 'IDIMU', toBranch: cfg.branches[1] || '', vendor: cfg.vendors[0] || '', product: '', qty: '', date: TODAY, note: '' });
  const products = Array.isArray(cfg.products) ? cfg.products : (cfg.products?.[fields.vendor] || []);
  const currentStock = db.inventory[fields.fromBranch]?.[fields.vendor]?.[fields.product];
  const remaining = currentStock ? (currentStock.received || 0) - (currentStock.sentOut || 0) - (currentStock.delivered || 0) : 0;
  const otherBranches = cfg.branches.filter(b => b !== fields.fromBranch);
  const canSave = fields.product && fields.qty && Number(fields.qty) > 0 && fields.toBranch && fields.fromBranch !== fields.toBranch && remaining > 0;

  function save() {
    if (!canSave) return;
    const q = Number(fields.qty);
    if (q > remaining) { alert(`Only ${remaining} in stock at ${fields.fromBranch}`); return; }
    setDb(prev => {
      const inv = JSON.parse(JSON.stringify(prev.inventory));
      ['fromBranch', 'toBranch'].forEach(k => {
        const br = fields[k];
        if (!inv[br]) inv[br] = {};
        if (!inv[br][fields.vendor]) inv[br][fields.vendor] = {};
        if (!inv[br][fields.vendor][fields.product]) inv[br][fields.vendor][fields.product] = { received: 0, delivered: 0 };
      });
      inv[fields.fromBranch][fields.vendor][fields.product].sentOut = (inv[fields.fromBranch][fields.vendor][fields.product].sentOut || 0) + q;
      inv[fields.toBranch][fields.vendor][fields.product].received = (inv[fields.toBranch][fields.vendor][fields.product].received || 0) + q;
      const histEntry = { id: Date.now(), type: 'transfer', fromBranch: fields.fromBranch, toBranch: fields.toBranch, vendor: fields.vendor, product: fields.product, qty: q, date: fields.date, note: fields.note };
      return { ...prev, inventory: inv, inventoryHistory: [...prev.inventoryHistory, histEntry] };
    });
    setFields(f => ({ ...f, product: '', qty: '', note: '' }));
  }

  return (
    <>
      <div className="inv2-topbar">
        <div>
          <div className="inv2-crumb"><span>Operations</span><span className="sep">/</span><span style={{ color: '#1f2747', fontWeight: 600 }}>Transfer</span></div>
          <h1 className="inv2-page-title">Transfer stock</h1>
          <p className="inv2-page-sub">Move stock between your branches.</p>
        </div>
      </div>

      <div className="inv2-form-panel">
        {/* Visual from → to */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 16, alignItems: 'end', marginBottom: 20 }}>
          <Field label="From branch" req>
            <Select
              value={fields.fromBranch}
              onChange={e => setFields(f => ({ ...f, fromBranch: e.target.value, toBranch: cfg.branches.find(b => b !== e.target.value) || '' }))}
              options={cfg.branches.map(b => ({ value: b, label: b }))}
            />
          </Field>
          <div style={{ paddingBottom: 12 }}>
            <div className="inv2-tx-arrow">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg>
            </div>
          </div>
          <Field label="To branch" req>
            <Select
              value={fields.toBranch}
              onChange={e => setFields(f => ({ ...f, toBranch: e.target.value }))}
              options={otherBranches.map(b => ({ value: b, label: b }))}
              placeholder="Destination"
            />
          </Field>
        </div>

        <div className="inv2-form-grid">
          <Field label="Vendor" req>
            <Select value={fields.vendor} onChange={e => setFields(f => ({ ...f, vendor: e.target.value, product: '' }))} options={cfg.vendors} />
          </Field>
          <Field label="Product" req>
            <Select value={fields.product} onChange={e => setFields(f => ({ ...f, product: e.target.value }))} options={products} placeholder="— Select product —" />
          </Field>
          <Field label="Quantity" req hint={fields.product ? (remaining <= 0 ? `⚠ No stock at ${fields.fromBranch}` : `Available at ${fields.fromBranch}: ${remaining} units`) : 'Available at source will be checked on submit.'}>
            <Input value={fields.qty} onChange={e => setFields(f => ({ ...f, qty: e.target.value }))} type="number" placeholder="0" trail="units" min="1" />
          </Field>
          <Field label="Date" req>
            <Input value={fields.date} onChange={e => setFields(f => ({ ...f, date: e.target.value }))} type="date" />
          </Field>
          <div className="inv2-wide">
            <Field label="Note">
              <Textarea value={fields.note} onChange={e => setFields(f => ({ ...f, note: e.target.value }))} placeholder="Rider, vehicle, or handoff notes…" />
            </Field>
          </div>
        </div>

        <div className="inv2-form-footer">
          <span className="helper">Transfers create a paired ledger entry at both branches.</span>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="inv2-btn" type="button" onClick={() => setFields(f => ({ ...f, product: '', qty: '', note: '' }))}>Clear</button>
            <button className={`inv2-btn primary lg ${!canSave ? 'off' : ''}`} disabled={!canSave} onClick={save}>
              Transfer stock
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3l4 4-4 4"/><path d="M21 7H7"/><path d="M7 21l-4-4 4-4"/><path d="M3 17h14"/></svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Inventory History ────────────────────────────────────── */
function InvHistory() {
  const { cfg, db } = useApp();
  const [typeF, setTypeF] = useState('all');
  const [branchF, setBranchF] = useState('all');
  const [vendorF, setVendorF] = useState('all');
  const [period, setPeriod] = useState('all');
  const [rangeFrom, setRangeFrom] = useState('');
  const [rangeTo, setRangeTo] = useState('');

  let history = [...(db.inventoryHistory || [])].sort((a, b) => b.id - a.id);
  if (typeF !== 'all') history = history.filter(h => h.type === typeF);
  if (vendorF !== 'all') history = history.filter(h => h.vendor === vendorF);
  if (branchF !== 'all') history = history.filter(h => h.fromBranch === branchF || h.toBranch === branchF);
  if (period !== 'all') history = filterPeriod(history, period, rangeFrom, rangeTo);

  const TYPE_PILL = {
    'waybill-in':  <span className="inv2-pill green">Waybill In</span>,
    'waybill-out': <span className="inv2-pill red">Waybill Out</span>,
    'transfer':    <span className="inv2-pill blue">Transfer</span>,
  };

  function qtyCell(h) {
    if (h.type === 'waybill-in')  return <span className="inv2-qty-in">+{h.qty}</span>;
    if (h.type === 'waybill-out') return <span className="inv2-qty-out">−{h.qty}</span>;
    return <span className="inv2-qty-tx">±{h.qty}</span>;
  }

  return (
    <>
      <div className="inv2-topbar">
        <div>
          <div className="inv2-crumb"><span>Operations</span><span className="sep">/</span><span style={{ color: '#1f2747', fontWeight: 600 }}>History</span></div>
          <h1 className="inv2-page-title">Inventory history</h1>
          <p className="inv2-page-sub">All stock movements — waybills and transfers.</p>
        </div>
      </div>

      {/* Date period filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {[['all','All time'],['today','Today'],['week','This week'],['month','This month'],['range','Range']].map(([id, label]) => (
          <button key={id} onClick={() => setPeriod(id)}
            className={`inv2-btn${period === id ? ' primary' : ''}`}
            style={{ height: 32, padding: '0 12px', fontSize: 12 }}>
            {label}
          </button>
        ))}
        {period === 'range' && (
          <>
            <div className="inv2-control" style={{ width: 150 }}>
              <input type="date" value={rangeFrom} onChange={e => setRangeFrom(e.target.value)} style={{ padding: '6px 10px', fontSize: 13 }} />
            </div>
            <div className="inv2-control" style={{ width: 150 }}>
              <input type="date" value={rangeTo} onChange={e => setRangeTo(e.target.value)} style={{ padding: '6px 10px', fontSize: 13 }} />
            </div>
          </>
        )}
      </div>

      <div className="inv2-filter-bar">
        <Field label="Type">
          <Select value={typeF} onChange={e => setTypeF(e.target.value)} options={[{ value: 'all', label: 'All types' }, { value: 'waybill-in', label: 'Waybill In' }, { value: 'waybill-out', label: 'Waybill Out' }, { value: 'transfer', label: 'Transfer' }]} />
        </Field>
        <Field label="Branch">
          <Select value={branchF} onChange={e => setBranchF(e.target.value)} options={[{ value: 'all', label: 'All branches' }, ...cfg.branches.map(b => ({ value: b, label: b }))]} />
        </Field>
        <Field label="Vendor">
          <Select value={vendorF} onChange={e => setVendorF(e.target.value)} options={[{ value: 'all', label: 'All vendors' }, ...cfg.vendors.map(v => ({ value: v, label: v }))]} />
        </Field>
      </div>

      <div className="inv2-table-wrap">
        {history.length === 0 ? (
          <div className="inv2-empty">
            <div className="inv2-empty-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2a3ef0" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
            </div>
            <div className="inv2-empty-title">No history yet</div>
            <div className="inv2-empty-sub">Every waybill in/out and transfer will appear here once recorded.</div>
          </div>
        ) : (
          <>
            <table className="inv2-t">
              <thead>
                <tr>
                  <th>Date</th><th>Type</th><th>Product</th><th>Vendor</th>
                  <th style={{ textAlign: 'right' }}>Qty</th><th>Branch</th><th>Note</th>
                </tr>
              </thead>
              <tbody>
                {history.map(h => (
                  <tr key={h.id}>
                    <td className="inv2-mono">{h.date}</td>
                    <td>{TYPE_PILL[h.type] || h.type}</td>
                    <td style={{ fontWeight: 600, color: '#0b1230' }}>{h.product}</td>
                    <td style={{ color: '#5b6385' }}>{h.vendor}</td>
                    <td style={{ textAlign: 'right' }} className="inv2-mono">{qtyCell(h)}</td>
                    <td className="inv2-mono">
                      {h.type === 'transfer'
                        ? <>{h.fromBranch} <span style={{ color: '#2a3ef0' }}>→</span> {h.toBranch}</>
                        : h.toBranch || h.fromBranch || '—'}
                    </td>
                    <td style={{ color: h.note ? '#1f2747' : '#858cab' }}>{h.note || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid #eef0f7', fontSize: 12.5, color: '#5b6385' }}>
              <span>Showing <strong>{history.length}</strong> movement{history.length !== 1 ? 's' : ''}</span>
            </div>
          </>
        )}
      </div>
    </>
  );
}
