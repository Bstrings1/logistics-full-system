import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

export default function ConfigPanel() {
  const { cfg, setCfg, cfgPanelOpen, setCfgPanelOpen } = useApp();
  const [local, setLocal] = useState({ ...cfg });

  useEffect(() => {
    if (cfgPanelOpen) setLocal({ ...cfg, branches: [...cfg.branches], vendors: [...cfg.vendors], products: [...cfg.products], bonusTiers: cfg.bonusTiers.map(t => ({ ...t })) });
  }, [cfgPanelOpen]);

  if (!cfgPanelOpen) return null;

  function apply() {
    setCfg({ ...local });
    setCfgPanelOpen(false);
  }

  function updateBranch(i, v) { setLocal(l => { const b = [...l.branches]; b[i] = v; return { ...l, branches: b }; }); }
  function removeBranch(i) { setLocal(l => ({ ...l, branches: l.branches.filter((_, j) => j !== i) })); }
  function addBranch(v) { if (v.trim()) setLocal(l => ({ ...l, branches: [...l.branches, v.trim()] })); }

  function updateVendor(i, v) { setLocal(l => { const arr = [...l.vendors]; arr[i] = v; return { ...l, vendors: arr }; }); }
  function removeVendor(i) { setLocal(l => ({ ...l, vendors: l.vendors.filter((_, j) => j !== i) })); }
  function addVendor(v) { if (v.trim()) setLocal(l => ({ ...l, vendors: [...l.vendors, v.trim()] })); }

  function updateProduct(i, v) { setLocal(l => { const arr = [...l.products]; arr[i] = v; return { ...l, products: arr }; }); }
  function removeProduct(i) { setLocal(l => ({ ...l, products: l.products.filter((_, j) => j !== i) })); }
  function addProduct(v) { if (v.trim()) setLocal(l => ({ ...l, products: [...l.products, v.trim()] })); }

  function updateTierRate(i, v) { setLocal(l => { const t = l.bonusTiers.map((ti, j) => j === i ? { ...ti, rate: Number(v) } : ti); return { ...l, bonusTiers: t }; }); }

  return (
    <div id="cfg-panel" className="open">
      <div className="cfg-box">
        <div className="row-b mb20">
          <div>
            <p className="cfg-h">Client Configuration</p>
            <p className="cfg-s">Edit before handing to client</p>
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => setCfgPanelOpen(false)}>Done</button>
        </div>

        <div className="g2 mb12">
          <div><label className="lbl">Company Name</label><input className="inp" value={local.company} onChange={e => setLocal(l => ({ ...l, company: e.target.value }))} /></div>
          <div><label className="lbl">Currency</label><input className="inp" value={local.currency} onChange={e => setLocal(l => ({ ...l, currency: e.target.value }))} style={{ maxWidth: 80 }} /></div>
        </div>
        <div className="mb16"><label className="lbl">Tagline</label><input className="inp" value={local.tagline} onChange={e => setLocal(l => ({ ...l, tagline: e.target.value }))} /></div>

        <p className="cfg-sec">Branches</p>
        <div className="col mb8">
          {local.branches.map((b, i) => (
            <div key={i} className="row">
              <input className="inp" value={b} onChange={e => updateBranch(i, e.target.value)} style={{ flex: 1 }} />
              <button className="btn btn-red-soft btn-xs" onClick={() => removeBranch(i)}>×</button>
            </div>
          ))}
        </div>
        <AddRow placeholder="New branch..." onAdd={addBranch} className="mb16" />

        <p className="cfg-sec">Vendors</p>
        <div className="col mb8">
          {local.vendors.map((v, i) => (
            <div key={i} className="row">
              <input className="inp" value={v} onChange={e => updateVendor(i, e.target.value)} style={{ flex: 1 }} />
              <button className="btn btn-red-soft btn-xs" onClick={() => removeVendor(i)}>×</button>
            </div>
          ))}
        </div>
        <AddRow placeholder="New vendor..." onAdd={addVendor} className="mb16" />

        <p className="cfg-sec">Products Catalogue</p>
        <div className="col mb8">
          {local.products.map((p, i) => (
            <div key={i} className="row">
              <input className="inp" value={p} onChange={e => updateProduct(i, e.target.value)} style={{ flex: 1 }} />
              <button className="btn btn-red-soft btn-xs" onClick={() => removeProduct(i)}>×</button>
            </div>
          ))}
        </div>
        <AddRow placeholder="Add product..." onAdd={addProduct} className="mb16" />

        <p className="cfg-sec">Bonus Tiers (14th → 15th next month)</p>
        <div className="col mb16">
          {local.bonusTiers.map((t, i) => (
            <div key={i} className="row">
              <span style={{ fontSize: 12, color: 'var(--t4)', minWidth: 48 }}>≤{t.upTo === Infinity ? '∞' : t.upTo}</span>
              <input type="number" className="inp" value={t.rate} onChange={e => updateTierRate(i, e.target.value)} style={{ flex: 1 }} />
              <span style={{ fontSize: 11, color: 'var(--t4)', whiteSpace: 'nowrap' }}>/order</span>
            </div>
          ))}
        </div>

        <button className="btn btn-primary btn-full" onClick={apply}>Apply Configuration</button>
      </div>
    </div>
  );
}

function AddRow({ placeholder, onAdd, className = '' }) {
  const [val, setVal] = useState('');
  return (
    <div className={`row ${className}`}>
      <input className="inp" value={val} placeholder={placeholder} onChange={e => setVal(e.target.value)} style={{ flex: 1 }} />
      <button className="btn btn-primary btn-sm" onClick={() => { onAdd(val); setVal(''); }}>Add</button>
    </div>
  );
}
