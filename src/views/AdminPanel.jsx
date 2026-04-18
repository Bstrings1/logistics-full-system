import { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { gp, fmt, otFull, statusBadgeType, buildUsers, getTabs } from '../utils/helpers';
import { SBadge } from '../components/ui';

const THEME_COLORS = [
  { name: 'Indigo', color: '#635bff' },
  { name: 'Blue', color: '#2563eb' },
  { name: 'Emerald', color: '#059669' },
  { name: 'Orange', color: '#ea580c' },
  { name: 'Rose', color: '#e11d48' },
  { name: 'Violet', color: '#7c3aed' },
  { name: 'Slate', color: '#334155' },
];

const TABS = [
  { id: 'viewas', label: '👁 View As Role' },
  { id: 'orders', label: '📋 All Orders' },
  { id: 'payments', label: '💳 Rider Payments' },
  { id: 'remittances', label: '💸 Send to Boss' },
  { id: 'inventory', label: '📦 Inventory' },
  { id: 'vpay', label: '🏭 Vendor Pay' },
  { id: 'company', label: 'Company & Branding' },
  { id: 'branches', label: 'Branches' },
  { id: 'riders', label: 'Riders' },
  { id: 'vendors', label: 'Vendors' },
  { id: 'products', label: 'Products' },
  { id: 'credentials', label: 'Credentials' },
  { id: 'bonus', label: 'Bonus Tiers' },
  { id: 'account', label: 'My Account' },
];

export default function AdminPanel() {
  const { cfg, setCfg, db, setDb, setSession, setViewAs, setActiveTab } = useApp();
  const [tab, setTab] = useState('viewas');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ background: '#0f172a', color: 'white', padding: '0 24px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 28, height: 28, background: cfg.theme?.primary || '#635bff', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: 'white' }}>A</div>
          <span style={{ fontWeight: 700, fontSize: 14 }}>Super Admin</span>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>· {cfg.company}</span>
        </div>
        <button
          onClick={() => setSession(null)}
          style={{ background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)', color: 'white', borderRadius: 7, padding: '5px 14px', fontSize: 12, cursor: 'pointer' }}
        >
          Sign out
        </button>
      </div>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 52px)' }}>
        <nav style={{ width: 210, borderRight: '1.5px solid var(--border)', padding: '16px 10px', background: 'white', flexShrink: 0 }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '9px 12px', borderRadius: 8, border: 'none',
                background: tab === t.id ? `${cfg.theme?.primary || '#635bff'}18` : 'none',
                color: tab === t.id ? (cfg.theme?.primary || '#635bff') : 'var(--t2)',
                fontWeight: tab === t.id ? 700 : 400,
                fontSize: 13, cursor: 'pointer', marginBottom: 2,
              }}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div style={{ flex: 1, overflowY: 'auto', padding: 32, maxHeight: 'calc(100vh - 52px)' }}>
          {tab === 'viewas'      && <ViewAsSection cfg={cfg} setViewAs={setViewAs} setActiveTab={setActiveTab} />}
          {tab === 'orders'      && <OrdersSection       cfg={cfg} db={db} setDb={setDb} />}
          {tab === 'payments'    && <PaymentsSection    cfg={cfg} db={db} setDb={setDb} />}
          {tab === 'remittances' && <RemittancesSection cfg={cfg} db={db} setDb={setDb} />}
          {tab === 'inventory'   && <AdminInventorySection cfg={cfg} db={db} setDb={setDb} />}
          {tab === 'vpay'        && <AdminVendorPaySection cfg={cfg} db={db} setDb={setDb} />}
          {tab === 'company'     && <CompanySection    cfg={cfg} setCfg={setCfg} />}
          {tab === 'branches'    && <BranchesSection   cfg={cfg} setCfg={setCfg} />}
          {tab === 'riders'      && <RidersSection     cfg={cfg} db={db} setDb={setDb} />}
          {tab === 'vendors'     && <VendorsSection    cfg={cfg} setCfg={setCfg} />}
          {tab === 'products'    && <ProductsSection   cfg={cfg} setCfg={setCfg} />}
          {tab === 'credentials' && <CredentialsSection cfg={cfg} setCfg={setCfg} />}
          {tab === 'bonus'       && <BonusSection      cfg={cfg} setCfg={setCfg} db={db} />}
          {tab === 'account'     && <AccountSection    cfg={cfg} setCfg={setCfg} />}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ title, sub }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <p style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-.02em' }}>{title}</p>
      {sub && <p style={{ fontSize: 13, color: 'var(--t3)', marginTop: 3 }}>{sub}</p>}
    </div>
  );
}

function SaveBtn({ onClick, saved }) {
  return (
    <button className="btn btn-primary" onClick={onClick}>
      {saved ? 'Saved!' : 'Save Changes'}
    </button>
  );
}

function useSave(cfg, setCfg, fields) {
  const [saved, setSaved] = useState(false);
  function save(updates) {
    setCfg(prev => ({ ...prev, ...updates }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }
  return { saved, save };
}

// ─── Company & Branding ───────────────────────────────────────────────────────

function CompanySection({ cfg, setCfg }) {
  const [local, setLocal] = useState({
    company: cfg.company,
    tagline: cfg.tagline,
    currency: cfg.currency,
    logo: cfg.logo || null,
    theme: { ...(cfg.theme || { primary: '#635bff' }) },
  });
  const [saved, setSaved] = useState(false);
  const fileRef = useRef();

  function handleLogo(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setLocal(l => ({ ...l, logo: ev.target.result }));
    reader.readAsDataURL(file);
  }

  function save() {
    setCfg(prev => ({ ...prev, ...local }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <SectionTitle title="Company & Branding" sub="Name, logo, and theme shown across the app" />

      <div className="card mb16">
        <p className="cfg-sec">General</p>
        <div className="g2 mb12">
          <div>
            <label className="lbl">Company Name</label>
            <input className="inp" value={local.company} onChange={e => setLocal(l => ({ ...l, company: e.target.value }))} />
          </div>
          <div>
            <label className="lbl">Currency Symbol</label>
            <input className="inp" value={local.currency} style={{ maxWidth: 80 }} onChange={e => setLocal(l => ({ ...l, currency: e.target.value }))} />
          </div>
        </div>
        <div>
          <label className="lbl">Tagline</label>
          <input className="inp" value={local.tagline} onChange={e => setLocal(l => ({ ...l, tagline: e.target.value }))} />
        </div>
      </div>

      <div className="card mb16">
        <p className="cfg-sec">Logo</p>
        {local.logo && (
          <div style={{ marginBottom: 12, padding: 12, background: '#f8f8f8', borderRadius: 8, display: 'inline-block' }}>
            <img src={local.logo} style={{ maxHeight: 56, maxWidth: 180, objectFit: 'contain', display: 'block' }} alt="logo" />
          </div>
        )}
        <div className="row" style={{ gap: 8 }}>
          <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer' }}>
            {local.logo ? 'Replace Logo' : 'Upload Logo'}
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogo} />
          </label>
          {local.logo && (
            <button className="btn btn-red-soft btn-sm" onClick={() => setLocal(l => ({ ...l, logo: null }))}>Remove</button>
          )}
        </div>
        <p style={{ fontSize: 11, color: 'var(--t4)', marginTop: 8 }}>Recommended: PNG or SVG under 100KB</p>
      </div>

      <div className="card mb20">
        <p className="cfg-sec">Theme Color</p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          {THEME_COLORS.map(t => (
            <button
              key={t.color}
              title={t.name}
              onClick={() => setLocal(l => ({ ...l, theme: { primary: t.color } }))}
              style={{
                width: 34, height: 34, borderRadius: 8, background: t.color, border: 'none',
                outline: local.theme?.primary === t.color ? '3px solid #0f172a' : '2px solid transparent',
                outlineOffset: 2, cursor: 'pointer',
              }}
            />
          ))}
        </div>
        <div>
          <label className="lbl">Custom hex color</label>
          <div className="row" style={{ gap: 8 }}>
            <input
              className="inp"
              value={local.theme?.primary || '#635bff'}
              style={{ maxWidth: 140, fontFamily: 'monospace' }}
              onChange={e => setLocal(l => ({ ...l, theme: { primary: e.target.value } }))}
            />
            <div style={{ width: 32, height: 32, borderRadius: 6, background: local.theme?.primary, border: '1.5px solid var(--border)' }} />
          </div>
        </div>
      </div>

      <SaveBtn onClick={save} saved={saved} />
    </div>
  );
}

// ─── Branches ────────────────────────────────────────────────────────────────

function BranchesSection({ cfg, setCfg }) {
  const [branches, setBranches] = useState([...cfg.branches]);
  const [newVal, setNewVal] = useState('');
  const [saved, setSaved] = useState(false);

  function save() {
    setCfg(prev => ({ ...prev, branches }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div style={{ maxWidth: 500 }}>
      <SectionTitle title="Branches" sub="Add, remove, or rename branches" />
      <div className="card mb12">
        <div className="col mb10">
          {branches.map((b, i) => (
            <div key={i} className="row" style={{ gap: 8 }}>
              <input
                className="inp"
                value={b}
                style={{ flex: 1, textTransform: 'uppercase' }}
                onChange={e => {
                  const arr = [...branches];
                  arr[i] = e.target.value.toUpperCase();
                  setBranches(arr);
                }}
              />
              <button className="btn btn-red-soft btn-xs" onClick={() => setBranches(branches.filter((_, j) => j !== i))}>×</button>
            </div>
          ))}
        </div>
        <div className="row" style={{ gap: 8 }}>
          <input
            className="inp"
            value={newVal}
            placeholder="New branch name..."
            style={{ flex: 1, textTransform: 'uppercase' }}
            onChange={e => setNewVal(e.target.value.toUpperCase())}
            onKeyDown={e => { if (e.key === 'Enter' && newVal.trim()) { setBranches([...branches, newVal.trim()]); setNewVal(''); } }}
          />
          <button className="btn btn-outline btn-sm" onClick={() => { if (newVal.trim()) { setBranches([...branches, newVal.trim()]); setNewVal(''); } }}>Add</button>
        </div>
      </div>
      <p style={{ fontSize: 12, color: 'var(--amber)', marginBottom: 16 }}>Renaming a branch does not update existing order records linked to the old name.</p>
      <SaveBtn onClick={save} saved={saved} />
    </div>
  );
}

// ─── Riders ──────────────────────────────────────────────────────────────────

function RidersSection({ cfg, db, setDb }) {
  const [branch, setBranch] = useState(cfg.branches[0] || '');
  const [newRider, setNewRider] = useState('');
  const riders = db.riders[branch] || [];

  function addRider() {
    const name = newRider.trim();
    if (!name || riders.includes(name)) return;
    setDb(prev => ({
      ...prev,
      riders: { ...prev.riders, [branch]: [...(prev.riders[branch] || []), name] },
    }));
    setNewRider('');
  }

  function removeRider(name) {
    if (!confirm(`Remove ${name} from ${branch}?`)) return;
    setDb(prev => ({
      ...prev,
      riders: { ...prev.riders, [branch]: (prev.riders[branch] || []).filter(r => r !== name) },
    }));
  }

  return (
    <div style={{ maxWidth: 500 }}>
      <SectionTitle title="Riders" sub="Manage riders per branch — changes save instantly" />

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {cfg.branches.map(b => (
          <button
            key={b}
            onClick={() => setBranch(b)}
            className={`btn btn-sm ${branch === b ? 'btn-primary' : 'btn-outline'}`}
          >
            {b}
          </button>
        ))}
      </div>

      <div className="card">
        {riders.length ? (
          <div style={{ marginBottom: 12 }}>
            {riders.map(r => (
              <div
                key={r}
                className="row-b"
                style={{ padding: '9px 0', borderBottom: '1px solid var(--border-soft)' }}
              >
                <span style={{ fontWeight: 500 }}>{r}</span>
                <button className="btn btn-red-soft btn-xs" onClick={() => removeRider(r)}>Remove</button>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--t4)', fontSize: 13, marginBottom: 12 }}>No riders in {branch} yet.</p>
        )}
        <div className="row" style={{ gap: 8 }}>
          <input
            className="inp"
            value={newRider}
            placeholder="Rider full name..."
            style={{ flex: 1 }}
            onChange={e => setNewRider(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addRider()}
          />
          <button className="btn btn-primary btn-sm" onClick={addRider}>Add</button>
        </div>
      </div>
    </div>
  );
}

// ─── Vendors ─────────────────────────────────────────────────────────────────

function VendorsSection({ cfg, setCfg }) {
  const [vendors, setVendors] = useState([...cfg.vendors]);
  const [newVal, setNewVal] = useState('');
  const [saved, setSaved] = useState(false);

  function save() {
    setCfg(prev => ({ ...prev, vendors }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div style={{ maxWidth: 500 }}>
      <SectionTitle title="Vendors" sub="Vendors available when logging orders" />
      <div className="card mb16">
        <div className="col mb10">
          {vendors.map((v, i) => (
            <div key={i} className="row" style={{ gap: 8 }}>
              <input className="inp" value={v} style={{ flex: 1 }} onChange={e => { const arr = [...vendors]; arr[i] = e.target.value; setVendors(arr); }} />
              <button className="btn btn-red-soft btn-xs" onClick={() => setVendors(vendors.filter((_, j) => j !== i))}>×</button>
            </div>
          ))}
        </div>
        <div className="row" style={{ gap: 8 }}>
          <input className="inp" value={newVal} placeholder="Vendor name..." style={{ flex: 1 }} onChange={e => setNewVal(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && newVal.trim()) { setVendors([...vendors, newVal.trim()]); setNewVal(''); } }} />
          <button className="btn btn-outline btn-sm" onClick={() => { if (newVal.trim()) { setVendors([...vendors, newVal.trim()]); setNewVal(''); } }}>Add</button>
        </div>
      </div>
      <SaveBtn onClick={save} saved={saved} />
    </div>
  );
}

// ─── Products ────────────────────────────────────────────────────────────────

function ProductsSection({ cfg, setCfg }) {
  const existing = (!Array.isArray(cfg.products) && cfg.products) ? cfg.products : {};
  const [allProducts, setAllProducts] = useState({ ...existing });
  const [vendor, setVendor] = useState(cfg.vendors[0] || '');
  const [newVal, setNewVal] = useState('');
  const [saved, setSaved] = useState(false);

  const current = allProducts[vendor] || [];

  function add() {
    if (!newVal.trim()) return;
    setAllProducts(prev => ({ ...prev, [vendor]: [...(prev[vendor] || []), newVal.trim()] }));
    setNewVal('');
  }

  function remove(i) {
    setAllProducts(prev => ({ ...prev, [vendor]: (prev[vendor] || []).filter((_, j) => j !== i) }));
  }

  function update(i, val) {
    setAllProducts(prev => {
      const arr = [...(prev[vendor] || [])];
      arr[i] = val;
      return { ...prev, [vendor]: arr };
    });
  }

  function save() {
    setCfg(prev => ({ ...prev, products: allProducts }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div style={{ maxWidth: 500 }}>
      <SectionTitle title="Products" sub="Each vendor has their own product catalogue" />

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {cfg.vendors.map(v => (
          <button key={v} onClick={() => setVendor(v)} className={`btn btn-sm ${vendor === v ? 'btn-primary' : 'btn-outline'}`}>
            {v}
          </button>
        ))}
      </div>

      <div className="card mb16">
        {current.length > 0 ? (
          <div className="col mb10">
            {current.map((p, i) => (
              <div key={i} className="row" style={{ gap: 8 }}>
                <input className="inp" value={p} style={{ flex: 1 }} onChange={e => update(i, e.target.value)} />
                <button className="btn btn-red-soft btn-xs" onClick={() => remove(i)}>×</button>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--t4)', fontSize: 13, marginBottom: 12 }}>No products for {vendor} yet.</p>
        )}
        <div className="row" style={{ gap: 8 }}>
          <input
            className="inp"
            value={newVal}
            placeholder={`Add product for ${vendor}...`}
            style={{ flex: 1 }}
            onChange={e => setNewVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && add()}
          />
          <button className="btn btn-outline btn-sm" onClick={add}>Add</button>
        </div>
      </div>

      <SaveBtn onClick={save} saved={saved} />
    </div>
  );
}

// ─── Credentials ─────────────────────────────────────────────────────────────

function CredentialsSection({ cfg, setCfg }) {
  const [creds, setCreds] = useState({ ...(cfg.credentials || {}) });
  const [saved, setSaved] = useState(false);

  function set(key, val) {
    setCreds(prev => ({ ...prev, [key]: val }));
  }

  function save() {
    setCfg(prev => ({ ...prev, credentials: creds }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function defaultPw(key, branch) {
    const bl = branch?.toLowerCase() || '';
    if (key === 'boss') return 'boss@2025';
    if (key.startsWith('manager-')) return `${bl}mgr2025`;
    if (key.startsWith('rider-')) return `${bl}rider2025`;
    if (key.startsWith('inventory-')) return `${bl}inv2025`;
    return 'vendor_2025';
  }

  return (
    <div style={{ maxWidth: 700 }}>
      <SectionTitle title="Credentials" sub="Set login passwords for each role. Usernames are auto-generated." />

      <div className="card mb16">
        <p className="cfg-sec">Boss / CEO</p>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <label className="lbl">Username (fixed)</label>
            <input className="inp" value="boss" disabled style={{ opacity: 0.45 }} />
          </div>
          <div style={{ flex: 1 }}>
            <label className="lbl">Password</label>
            <input className="inp" value={creds.boss ?? 'boss@2025'} onChange={e => set('boss', e.target.value)} />
          </div>
        </div>
      </div>

      {cfg.branches.map(branch => {
        const bl = branch.toLowerCase();
        const roles = [
          { key: `manager-${branch}`, username: `${bl}_manager`, label: 'Manager' },
          { key: `rider-${branch}`, username: `${bl}_rider`, label: 'Rider Manager' },
          { key: `inventory-${branch}`, username: `${bl}_inv`, label: 'Inventory' },
        ];
        return (
          <div key={branch} className="card mb16">
            <p className="cfg-sec">{branch}</p>
            <div className="col" style={{ gap: 10 }}>
              {roles.map(({ key, username, label }) => (
                <div key={key} style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <label className="lbl">{label} — username</label>
                    <input className="inp" value={username} disabled style={{ opacity: 0.45, fontFamily: 'monospace', fontSize: 12 }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="lbl">Password</label>
                    <input className="inp" value={creds[key] ?? defaultPw(key, branch)} onChange={e => set(key, e.target.value)} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div className="card mb20">
        <p className="cfg-sec">Vendors</p>
        <div className="col" style={{ gap: 10 }}>
          {cfg.vendors.map(vendor => {
            const vl = vendor.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
            const key = `vendor-${vendor}`;
            return (
              <div key={key} style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <label className="lbl">{vendor} — username</label>
                  <input className="inp" value={`vendor_${vl}`} disabled style={{ opacity: 0.45, fontFamily: 'monospace', fontSize: 12 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="lbl">Password</label>
                  <input className="inp" value={creds[key] ?? 'vendor_2025'} onChange={e => set(key, e.target.value)} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card mb20">
        <p className="cfg-sec">Inventory Admin</p>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <label className="lbl">Username (fixed)</label>
            <input className="inp" value="inv_admin" disabled style={{ opacity: 0.45, fontFamily: 'monospace', fontSize: 12 }} />
          </div>
          <div style={{ flex: 1 }}>
            <label className="lbl">Password</label>
            <input className="inp" value={creds['inventory-admin'] ?? 'invaadmin2025'} onChange={e => set('inventory-admin', e.target.value)} />
          </div>
        </div>
      </div>

      <SaveBtn onClick={save} saved={saved} />
    </div>
  );
}

// ─── Bonus Tiers ─────────────────────────────────────────────────────────────

function BonusSection({ cfg, setCfg, db }) {
  const [tiers, setTiers] = useState(cfg.bonusTiers.map(t => ({ ...t })));
  const [customBonus, setCustomBonus] = useState({ ...cfg.customBonus });
  const [newRider, setNewRider] = useState('');
  const [newRate, setNewRate] = useState('');
  const [saved, setSaved] = useState(false);
  const allRiders = Object.values(db.riders).flat();

  function save() {
    setCfg(prev => ({ ...prev, bonusTiers: tiers, customBonus }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function addCustom() {
    if (!newRider || newRate === '') return;
    setCustomBonus(prev => ({ ...prev, [newRider]: Number(newRate) }));
    setNewRider(''); setNewRate('');
  }

  function removeCustom(rider) {
    setCustomBonus(prev => { const n = { ...prev }; delete n[rider]; return n; });
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <SectionTitle title="Bonus Tiers" sub="14th → 15th next month delivery cycle" />

      <div className="card mb16">
        <p className="cfg-sec">Standard Tiers</p>
        <table className="tbl">
          <thead><tr><th>Max Orders</th><th>Rate per delivery (₦)</th></tr></thead>
          <tbody>
            {tiers.map((t, i) => (
              <tr key={i}>
                <td style={{ color: 'var(--t3)', fontSize: 13 }}>{t.upTo === Infinity ? '∞ (top tier)' : `≤ ${t.upTo}`}</td>
                <td>
                  <input
                    type="number"
                    className="inp"
                    style={{ maxWidth: 120 }}
                    value={t.rate}
                    onChange={e => setTiers(prev => prev.map((ti, j) => j === i ? { ...ti, rate: Number(e.target.value) } : ti))}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card mb20">
        <p className="cfg-sec">Custom Bonus per Rider</p>
        {Object.entries(customBonus).length > 0 && (
          <table className="tbl mb12">
            <thead><tr><th>Rider</th><th>Rate (₦/delivery)</th><th></th></tr></thead>
            <tbody>
              {Object.entries(customBonus).map(([rider, rate]) => (
                <tr key={rider}>
                  <td>{rider}</td>
                  <td>
                    <input
                      type="number"
                      className="inp"
                      style={{ maxWidth: 100 }}
                      value={rate}
                      onChange={e => setCustomBonus(prev => ({ ...prev, [rider]: Number(e.target.value) }))}
                    />
                  </td>
                  <td><button className="btn btn-red-soft btn-xs" onClick={() => removeCustom(rider)}>×</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="g3">
          <div>
            <label className="lbl">Rider</label>
            <select className="inp" value={newRider} onChange={e => setNewRider(e.target.value)}>
              <option value="">Select rider...</option>
              {allRiders.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="lbl">Rate (₦/delivery)</label>
            <input type="number" className="inp" value={newRate} placeholder="0" onChange={e => setNewRate(e.target.value)} />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button className="btn btn-outline btn-sm" onClick={addCustom}>Add</button>
          </div>
        </div>
      </div>

      <SaveBtn onClick={save} saved={saved} />
    </div>
  );
}

// ─── All Orders ──────────────────────────────────────────────────────────────

const ALL_STATUSES = ['Unassigned','Pending','Delivered','Completed','Failed','Replaced','Not Delivered','Cancelled'];
const STATUS_COLOR = { Delivered:'green', Completed:'green', Failed:'red', Replaced:'amber', Cancelled:'red', Pending:'amber', 'Not Delivered':'gray', Unassigned:'amber' };

function OrdersSection({ cfg, db, setDb }) {
  const [branchF, setBranchF] = useState('all');
  const [statusF, setStatusF] = useState('all');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editPrices, setEditPrices] = useState({});
  const [editPaid, setEditPaid] = useState('');

  let orders = [...db.orders];
  if (branchF !== 'all') orders = orders.filter(o => o.branch === branchF);
  if (statusF !== 'all') orders = orders.filter(o => o.status === statusF);
  if (search) orders = orders.filter(o =>
    (o.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
    (o.phone || '').includes(search) ||
    (o.rider || '').toLowerCase().includes(search.toLowerCase())
  );
  orders.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  function startEdit(o) {
    setEditingId(o.id);
    const prices = {};
    gp(o).forEach((p, i) => { prices[i] = p.price; });
    setEditPrices(prices);
    setEditPaid(o.paidAmount !== undefined ? String(o.paidAmount) : '');
  }

  function saveEdit(orderId) {
    setDb(prev => ({
      ...prev,
      orders: prev.orders.map(o => {
        if (String(o.id) !== String(orderId)) return o;
        const prods = gp(o).map((p, i) => ({ ...p, price: Number(editPrices[i] ?? p.price) }));
        const upd = { ...o, products: prods };
        if (editPaid !== '') upd.paidAmount = Number(editPaid) || undefined;
        return upd;
      }),
    }));
    setEditingId(null);
  }

  function editStatus(orderId, newStatus) {
    setDb(prev => ({
      ...prev,
      orders: prev.orders.map(o => String(o.id) === String(orderId) ? { ...o, status: newStatus } : o),
    }));
  }

  return (
    <div>
      <SectionTitle title="All Orders" sub="View all orders across every branch. Only you can correct prices — riders and managers cannot." />

      <div className="card mb16">
        <div className="g3">
          <div>
            <label className="lbl">Branch</label>
            <select className="inp" value={branchF} onChange={e => setBranchF(e.target.value)}>
              <option value="all">All Branches</option>
              {cfg.branches.map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="lbl">Status</label>
            <select className="inp" value={statusF} onChange={e => setStatusF(e.target.value)}>
              <option value="all">All Statuses</option>
              {ALL_STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="lbl">Search customer / rider / phone</label>
            <input className="inp" value={search} onChange={e => setSearch(e.target.value)} placeholder="Type to filter..." />
          </div>
        </div>
      </div>

      <p style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 14 }}>
        <strong style={{ color: 'var(--navy)' }}>{orders.length}</strong> orders found
      </p>

      {orders.length === 0 && <div className="empty-box"><p className="empty-t">No orders found</p></div>}

      {orders.map(o => {
        const prods = gp(o);
        const fullVal = otFull(o);
        const paidVal = o.paidAmount !== undefined ? Number(o.paidAmount) : fullVal;
        const isEditing = String(editingId) === String(o.id);
        const sc = STATUS_COLOR[o.status] || 'gray';

        return (
          <div key={o.id} className="card mb10" style={{ borderLeft: `4px solid var(--${sc === 'green' ? 'green' : sc === 'red' ? 'red' : sc === 'amber' ? 'amber' : 'purple'})` }}>
            <div className="row-b mb8">
              <div>
                <div className="row" style={{ gap: 7, marginBottom: 3, flexWrap: 'wrap' }}>
                  <p style={{ fontWeight: 700, fontSize: 14 }}>{o.customerName}</p>
                  <SBadge status={o.status} />
                  <span style={{ fontSize: 11, background: 'var(--purple-lt)', color: 'var(--purple)', padding: '2px 8px', borderRadius: 99, fontWeight: 700 }}>{o.branch}</span>
                </div>
                <p style={{ fontSize: 11, color: 'var(--t4)' }}>
                  {o.date} · {o.phone} · Rider: <strong>{o.rider || '—'}</strong>
                  {o.address && ` · ${o.address}`}
                </p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ fontWeight: 800, fontSize: 15, color: 'var(--navy)' }}>{fmt(paidVal, cfg.currency)}</p>
                {o.paidAmount !== undefined && paidVal !== fullVal && (
                  <p style={{ fontSize: 11, color: 'var(--t4)' }}>Full: {fmt(fullVal, cfg.currency)}</p>
                )}
              </div>
            </div>

            <div style={{ marginBottom: 10, background: 'var(--bg)', borderRadius: 8, overflow: 'hidden' }}>
              {prods.map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 12px', borderBottom: i < prods.length - 1 ? '1px solid var(--border-soft)' : 'none' }}>
                  <span style={{ fontSize: 13 }}>{p.name} <span style={{ color: 'var(--t4)' }}>×{p.qty || 1}</span></span>
                  {isEditing ? (
                    <div className="row" style={{ gap: 4 }}>
                      <span style={{ fontSize: 11, color: 'var(--t4)' }}>{cfg.currency}</span>
                      <input
                        type="number"
                        className="inp"
                        style={{ width: 110, textAlign: 'right', padding: '4px 8px', fontSize: 13 }}
                        value={editPrices[i] ?? p.price}
                        onChange={e => setEditPrices(prev => ({ ...prev, [i]: e.target.value }))}
                      />
                    </div>
                  ) : (
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{fmt(Number(p.price), cfg.currency)}</span>
                  )}
                </div>
              ))}
            </div>

            {isEditing && o.status === 'Completed' && (
              <div className="row mb10" style={{ gap: 8 }}>
                <label className="lbl" style={{ marginBottom: 0, whiteSpace: 'nowrap' }}>Paid Amount:</label>
                <input
                  type="number"
                  className="inp"
                  style={{ maxWidth: 160 }}
                  value={editPaid}
                  placeholder={String(fullVal)}
                  onChange={e => setEditPaid(e.target.value)}
                />
                <span style={{ fontSize: 11, color: 'var(--t3)' }}>(leave blank = use full value)</span>
              </div>
            )}

            <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
              {isEditing ? (
                <>
                  <button className="btn btn-green btn-xs" onClick={() => saveEdit(o.id)}>✓ Save Changes</button>
                  <button className="btn btn-outline btn-xs" onClick={() => setEditingId(null)}>Cancel</button>
                </>
              ) : (
                <>
                  <button className="btn btn-outline btn-xs" onClick={() => startEdit(o)}>✎ Edit Prices</button>
                  <select
                    className="inp"
                    style={{ fontSize: 12, padding: '5px 10px', height: 30, width: 'auto', borderRadius: 99 }}
                    value={o.status}
                    onChange={e => editStatus(o.id, e.target.value)}
                  >
                    {ALL_STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                  <button
                    className="btn btn-danger btn-xs"
                    onClick={() => {
                      if (!confirm(`Delete order for "${o.customerName}"? This cannot be undone.`)) return;
                      setDb(prev => ({ ...prev, orders: prev.orders.filter(x => String(x.id) !== String(o.id)) }));
                    }}
                  >
                    🗑 Delete
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Rider Payments ──────────────────────────────────────────────────────────

function PaymentsSection({ cfg, db, setDb }) {
  const [branchF, setBranchF] = useState('all');
  const [editKey, setEditKey] = useState(null);
  const [editVals, setEditVals] = useState({});

  const entries = Object.entries(db.payments)
    .filter(([, p]) => branchF === 'all' || p.branch === branchF)
    .sort(([, a], [, b]) => (b.date || '').localeCompare(a.date || ''));

  function startEdit(key, p) {
    setEditKey(key);
    setEditVals({ cash: String(p.cash || 0), pos: String(p.pos || 0), shortfall: String(p.shortfall || 0) });
  }

  function saveEdit(key) {
    setDb(prev => {
      const p = { ...prev.payments[key] };
      p.cash = Number(editVals.cash) || 0;
      p.pos = Number(editVals.pos) || 0;
      p.shortfall = Number(editVals.shortfall) || 0;
      p.cleared = p.shortfall <= 0;
      return { ...prev, payments: { ...prev.payments, [key]: p } };
    });
    setEditKey(null);
  }

  function deletePayment(key) {
    if (!confirm('Delete this payment record?')) return;
    setDb(prev => {
      const payments = { ...prev.payments };
      delete payments[key];
      return { ...prev, payments };
    });
  }

  return (
    <div>
      <SectionTitle title="Rider Payments" sub="Edit cash/POS collected and shortfall records. Changes are instant." />
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button className={`btn btn-sm ${branchF === 'all' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setBranchF('all')}>All</button>
        {cfg.branches.map(b => <button key={b} className={`btn btn-sm ${branchF === b ? 'btn-primary' : 'btn-outline'}`} onClick={() => setBranchF(b)}>{b}</button>)}
      </div>
      {entries.length === 0 && <div className="empty-box"><p className="empty-t">No payment records</p></div>}
      {entries.map(([key, p]) => {
        const isEditing = editKey === key;
        return (
          <div key={key} className="card mb8">
            <div className="row-b mb8">
              <div>
                <p style={{ fontWeight: 700 }}>{p.rider}</p>
                <p style={{ fontSize: 11, color: 'var(--t4)' }}>{p.branch} · {p.date}</p>
              </div>
              <div className="row" style={{ gap: 6 }}>
                {p.shortfall > 0
                  ? <span style={{ fontSize: 11, color: 'var(--red)', fontWeight: 700 }}>⚠ Shortfall: {fmt(p.shortfall)}</span>
                  : <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>✓ Cleared</span>}
              </div>
            </div>
            {isEditing ? (
              <>
                <div className="g3 mb10">
                  <div><label className="lbl">Cash</label><input className="inp" type="number" value={editVals.cash} onChange={e => setEditVals(v => ({ ...v, cash: e.target.value }))} /></div>
                  <div><label className="lbl">POS</label><input className="inp" type="number" value={editVals.pos} onChange={e => setEditVals(v => ({ ...v, pos: e.target.value }))} /></div>
                  <div><label className="lbl">Shortfall</label><input className="inp" type="number" value={editVals.shortfall} onChange={e => setEditVals(v => ({ ...v, shortfall: e.target.value }))} /></div>
                </div>
                <div className="row" style={{ gap: 6 }}>
                  <button className="btn btn-green btn-xs" onClick={() => saveEdit(key)}>✓ Save</button>
                  <button className="btn btn-outline btn-xs" onClick={() => setEditKey(null)}>Cancel</button>
                </div>
              </>
            ) : (
              <>
                <div className="g3 mb8">
                  <div style={{ fontSize: 12 }}>Cash: <strong>{fmt(p.cash || 0)}</strong></div>
                  <div style={{ fontSize: 12 }}>POS: <strong style={{ color: 'var(--green)' }}>{fmt(p.pos || 0)}</strong></div>
                  <div style={{ fontSize: 12 }}>Expected: <strong>{fmt(p.expected || 0)}</strong></div>
                </div>
                <div className="row" style={{ gap: 6 }}>
                  <button className="btn btn-outline btn-xs" onClick={() => startEdit(key, p)}>✎ Edit</button>
                  <button className="btn btn-danger btn-xs" onClick={() => deletePayment(key)}>🗑</button>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Send to Boss Remittances ─────────────────────────────────────────────────

function RemittancesSection({ cfg, db, setDb }) {
  const [branchF, setBranchF] = useState('all');
  const [editId, setEditId] = useState(null);
  const [editVals, setEditVals] = useState({});

  const rems = db.remittances
    .filter(r => branchF === 'all' || r.branch === branchF)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  function startEdit(r) {
    setEditId(r.id);
    setEditVals({ amount: String(r.amount), bank: r.bank || '', account: r.account || '', txID: r.txID || '' });
  }

  function saveEdit(id) {
    setDb(prev => ({
      ...prev,
      remittances: prev.remittances.map(r => r.id === id ? { ...r, ...editVals, amount: Number(editVals.amount) || r.amount } : r),
    }));
    setEditId(null);
  }

  function deleteRem(id) {
    if (!confirm('Delete this remittance record?')) return;
    setDb(prev => ({ ...prev, remittances: prev.remittances.filter(r => r.id !== id) }));
  }

  return (
    <div>
      <SectionTitle title="Send to Boss Records" sub="Edit or delete transfer records logged by branch managers." />
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button className={`btn btn-sm ${branchF === 'all' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setBranchF('all')}>All</button>
        {cfg.branches.map(b => <button key={b} className={`btn btn-sm ${branchF === b ? 'btn-primary' : 'btn-outline'}`} onClick={() => setBranchF(b)}>{b}</button>)}
      </div>
      {rems.length === 0 && <div className="empty-box"><p className="empty-t">No remittance records</p></div>}
      {rems.map(r => {
        const isEditing = editId === r.id;
        return (
          <div key={r.id} className="card mb8">
            <div className="row-b mb6">
              <div>
                <p style={{ fontWeight: 700, color: 'var(--green)', fontSize: 15 }}>{fmt(r.amount)}</p>
                <p style={{ fontSize: 11, color: 'var(--t4)' }}>{r.branch} · {r.date} {r.verified ? '· ✓ Verified' : '· Unverified'}</p>
              </div>
              {!isEditing && (
                <div className="row" style={{ gap: 6 }}>
                  <button className="btn btn-outline btn-xs" onClick={() => startEdit(r)}>✎ Edit</button>
                  <button className="btn btn-danger btn-xs" onClick={() => deleteRem(r.id)}>🗑</button>
                </div>
              )}
            </div>
            {isEditing ? (
              <>
                <div className="g2 mb10">
                  <div><label className="lbl">Amount</label><input className="inp" type="number" value={editVals.amount} onChange={e => setEditVals(v => ({ ...v, amount: e.target.value }))} /></div>
                  <div><label className="lbl">Bank</label><input className="inp" value={editVals.bank} onChange={e => setEditVals(v => ({ ...v, bank: e.target.value }))} /></div>
                  <div><label className="lbl">Account</label><input className="inp" value={editVals.account} onChange={e => setEditVals(v => ({ ...v, account: e.target.value }))} /></div>
                  <div><label className="lbl">TXN ID</label><input className="inp" value={editVals.txID} onChange={e => setEditVals(v => ({ ...v, txID: e.target.value }))} /></div>
                </div>
                <div className="row" style={{ gap: 6 }}>
                  <button className="btn btn-green btn-xs" onClick={() => saveEdit(r.id)}>✓ Save</button>
                  <button className="btn btn-outline btn-xs" onClick={() => setEditId(null)}>Cancel</button>
                </div>
              </>
            ) : (
              <p style={{ fontSize: 12, color: 'var(--t3)' }}>{r.bank || '—'} · {r.account || '—'} · <code style={{ fontSize: 11 }}>{r.txID || '—'}</code></p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Admin Inventory ──────────────────────────────────────────────────────────

function AdminInventorySection({ cfg, db, setDb }) {
  const [branch, setBranch] = useState(cfg.branches[0] || 'IDIMU');
  const [vendor, setVendor] = useState(cfg.vendors[0] || '');
  const [editKey, setEditKey] = useState(null);
  const [editVals, setEditVals] = useState({});

  const branchVendorInv = db.inventory[branch]?.[vendor] || {};

  function startEdit(product, d) {
    setEditKey(product);
    setEditVals({ received: String(d.received || 0), sentOut: String(d.sentOut || 0), delivered: String(d.delivered || 0) });
  }

  function saveEdit(product) {
    setDb(prev => {
      const inv = JSON.parse(JSON.stringify(prev.inventory));
      if (!inv[branch]) inv[branch] = {};
      if (!inv[branch][vendor]) inv[branch][vendor] = {};
      inv[branch][vendor][product] = { received: Number(editVals.received) || 0, sentOut: Number(editVals.sentOut) || 0, delivered: Number(editVals.delivered) || 0 };
      return { ...prev, inventory: inv };
    });
    setEditKey(null);
  }

  function addNew(product) {
    if (!product.trim()) return;
    setDb(prev => {
      const inv = JSON.parse(JSON.stringify(prev.inventory));
      if (!inv[branch]) inv[branch] = {};
      if (!inv[branch][vendor]) inv[branch][vendor] = {};
      inv[branch][vendor][product] = { received: 0, sentOut: 0, delivered: 0 };
      return { ...prev, inventory: inv };
    });
  }

  const [newProd, setNewProd] = useState('');
  const products = Array.isArray(cfg.products) ? cfg.products : (cfg.products?.[vendor] || []);

  return (
    <div>
      <SectionTitle title="Inventory" sub="Directly edit stock counts per branch and vendor." />
      <div className="card mb16">
        <div className="g2">
          <div>
            <label className="lbl">Branch</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {cfg.branches.map(b => <button key={b} className={`btn btn-sm ${branch === b ? 'btn-primary' : 'btn-outline'}`} onClick={() => setBranch(b)}>{b}</button>)}
            </div>
          </div>
          <div>
            <label className="lbl">Vendor</label>
            <select className="inp" value={vendor} onChange={e => setVendor(e.target.value)}>{cfg.vendors.map(v => <option key={v}>{v}</option>)}</select>
          </div>
        </div>
      </div>
      <div className="card mb12">
        <table className="tbl">
          <thead><tr><th>Product</th><th>Received</th><th>Sent Out</th><th>Delivered</th><th>Remaining</th><th></th></tr></thead>
          <tbody>
            {Object.entries(branchVendorInv).map(([p, d]) => {
              const rem = (d.received || 0) - (d.sentOut || 0) - (d.delivered || 0);
              const isEditing = editKey === p;
              return (
                <tr key={p}>
                  <td style={{ fontWeight: 500 }}>{p}</td>
                  {isEditing ? (
                    <>
                      <td><input className="inp" type="number" style={{ width: 70, padding: '4px 8px' }} value={editVals.received} onChange={e => setEditVals(v => ({ ...v, received: e.target.value }))} /></td>
                      <td><input className="inp" type="number" style={{ width: 70, padding: '4px 8px' }} value={editVals.sentOut} onChange={e => setEditVals(v => ({ ...v, sentOut: e.target.value }))} /></td>
                      <td><input className="inp" type="number" style={{ width: 70, padding: '4px 8px' }} value={editVals.delivered} onChange={e => setEditVals(v => ({ ...v, delivered: e.target.value }))} /></td>
                      <td style={{ fontWeight: 700, color: rem <= 0 ? 'var(--red)' : 'var(--text)' }}>{rem}</td>
                      <td>
                        <div className="row" style={{ gap: 4 }}>
                          <button className="btn btn-green btn-xs" onClick={() => saveEdit(p)}>✓</button>
                          <button className="btn btn-outline btn-xs" onClick={() => setEditKey(null)}>✕</button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ color: 'var(--green)', fontWeight: 600 }}>{d.received || 0}</td>
                      <td style={{ color: '#d97706', fontWeight: 600 }}>{d.sentOut || 0}</td>
                      <td style={{ color: 'var(--purple)', fontWeight: 600 }}>{d.delivered || 0}</td>
                      <td style={{ fontWeight: 700, color: rem <= 0 ? 'var(--red)' : 'var(--text)' }}>{rem}</td>
                      <td><button className="btn btn-outline btn-xs" onClick={() => startEdit(p, d)}>✎</button></td>
                    </>
                  )}
                </tr>
              );
            })}
            {Object.keys(branchVendorInv).length === 0 && (
              <tr><td colSpan={6} style={{ fontSize: 12, color: 'var(--t4)' }}>No stock entries</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="row" style={{ gap: 8 }}>
        <select className="inp" value={newProd} onChange={e => setNewProd(e.target.value)} style={{ flex: 1 }}>
          <option value="">— Add product to stock —</option>
          {products.filter(p => !branchVendorInv[p]).map(p => <option key={p}>{p}</option>)}
        </select>
        <button className="btn btn-outline btn-sm" onClick={() => { addNew(newProd); setNewProd(''); }} disabled={!newProd}>Add</button>
      </div>
    </div>
  );
}

// ─── Admin Vendor Pay ─────────────────────────────────────────────────────────

function AdminVendorPaySection({ cfg, db, setDb }) {
  const [vendor, setVendor] = useState('');
  const [editId, setEditId] = useState(null);
  const [editVals, setEditVals] = useState({});

  const payments = vendor ? (db.vendorPayments[vendor] || []) : [];

  function startEdit(p) {
    setEditId(p.id);
    setEditVals({ amount: String(p.amount), bank: p.bank || '', account: p.account || '', txID: p.txID || '' });
  }

  function saveEdit(id) {
    setDb(prev => ({
      ...prev,
      vendorPayments: {
        ...prev.vendorPayments,
        [vendor]: (prev.vendorPayments[vendor] || []).map(p => p.id === id ? { ...p, ...editVals, amount: Number(editVals.amount) || p.amount } : p),
      },
    }));
    setEditId(null);
  }

  function deletePayment(id) {
    if (!confirm('Delete this vendor payment?')) return;
    setDb(prev => ({
      ...prev,
      vendorPayments: { ...prev.vendorPayments, [vendor]: (prev.vendorPayments[vendor] || []).filter(p => p.id !== id) },
    }));
  }

  return (
    <div>
      <SectionTitle title="Vendor Payments" sub="Edit or delete vendor payment records." />
      <div className="card mb16">
        <label className="lbl">Select Vendor</label>
        <select className="inp" value={vendor} onChange={e => setVendor(e.target.value)}>
          <option value="">— Choose vendor —</option>
          {cfg.vendors.filter(v => db.vendorPayments[v]?.length > 0).map(v => <option key={v}>{v}</option>)}
        </select>
      </div>
      {vendor && payments.length === 0 && <div className="empty-box"><p className="empty-t">No payments for {vendor}</p></div>}
      {payments.map(p => {
        const isEditing = editId === p.id;
        return (
          <div key={p.id} className="card mb8">
            <div className="row-b mb6">
              <div>
                <p style={{ fontWeight: 700, color: 'var(--green)', fontSize: 15 }}>{fmt(p.amount)}</p>
                <p style={{ fontSize: 11, color: 'var(--t4)' }}>{p.date}</p>
              </div>
              {!isEditing && (
                <div className="row" style={{ gap: 6 }}>
                  <button className="btn btn-outline btn-xs" onClick={() => startEdit(p)}>✎ Edit</button>
                  <button className="btn btn-danger btn-xs" onClick={() => deletePayment(p.id)}>🗑</button>
                </div>
              )}
            </div>
            {isEditing ? (
              <>
                <div className="g2 mb10">
                  <div><label className="lbl">Amount</label><input className="inp" type="number" value={editVals.amount} onChange={e => setEditVals(v => ({ ...v, amount: e.target.value }))} /></div>
                  <div><label className="lbl">Bank</label><input className="inp" value={editVals.bank} onChange={e => setEditVals(v => ({ ...v, bank: e.target.value }))} /></div>
                  <div><label className="lbl">Account</label><input className="inp" value={editVals.account} onChange={e => setEditVals(v => ({ ...v, account: e.target.value }))} /></div>
                  <div><label className="lbl">TXN ID</label><input className="inp" value={editVals.txID} onChange={e => setEditVals(v => ({ ...v, txID: e.target.value }))} /></div>
                </div>
                <div className="row" style={{ gap: 6 }}>
                  <button className="btn btn-green btn-xs" onClick={() => saveEdit(p.id)}>✓ Save</button>
                  <button className="btn btn-outline btn-xs" onClick={() => setEditId(null)}>Cancel</button>
                </div>
              </>
            ) : (
              <p style={{ fontSize: 12, color: 'var(--t3)' }}>{p.bank || '—'} · {p.account || '—'} · <code style={{ fontSize: 11 }}>{p.txID || '—'}</code></p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── View As Role ────────────────────────────────────────────────────────────

const ROLE_META = {
  boss:            { color: '#0f172a', bg: '#f1f5f9', label: 'Boss / CEO',     icon: '◈' },
  manager:         { color: '#166534', bg: '#dcfce7', label: 'Branch Manager', icon: '⊞' },
  'rider-manager': { color: '#1e40af', bg: '#dbeafe', label: 'Rider Manager',  icon: '◎' },
  inventory:       { color: '#7c3aed', bg: '#ede9fe', label: 'Inventory',      icon: '▦' },
  'inventory-admin':{ color: '#b45309', bg: '#fef9c3', label: 'Inv Admin',     icon: '▦' },
  vendor:          { color: '#9d174d', bg: '#fce7f3', label: 'Vendor',         icon: '⊕' },
};

function ViewAsSection({ cfg, setViewAs, setActiveTab }) {
  const users = buildUsers(cfg);
  const grouped = {
    special: users.filter(u => u.role === 'boss' || u.role === 'inventory-admin'),
    branches: cfg.branches.map(b => users.filter(u => u.branch === b)),
    vendors: users.filter(u => u.role === 'vendor'),
  };

  function go(user) {
    const tabs = getTabs(user.role);
    setActiveTab(tabs[0]?.id || '');
    setViewAs(user);
  }

  function RoleCard({ user }) {
    const m = ROLE_META[user.role] || ROLE_META.manager;
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', borderRadius: 10, border: '1.5px solid var(--border)', marginBottom: 8, background: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: m.bg, color: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15 }}>{m.icon}</div>
          <div>
            <p style={{ fontWeight: 700, fontSize: 13 }}>{user.display}</p>
            <p style={{ fontSize: 11, color: 'var(--t4)', fontFamily: 'monospace' }}>{user.username}</p>
          </div>
        </div>
        <button
          onClick={() => go(user)}
          style={{ background: 'var(--purple)', color: 'white', border: 'none', borderRadius: 7, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
        >
          View As →
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 580 }}>
      <SectionTitle title="View As Role" sub="See exactly what each user sees — and fix things on the spot. A banner lets you exit back to admin." />

      <div className="card mb20">
        <p className="cfg-sec">Global Roles</p>
        {grouped.special.map(u => <RoleCard key={u.username} user={u} />)}
      </div>

      {cfg.branches.map((b, i) => (
        <div key={b} className="card mb16">
          <p className="cfg-sec">{b}</p>
          {grouped.branches[i].map(u => <RoleCard key={u.username} user={u} />)}
        </div>
      ))}

      {grouped.vendors.length > 0 && (
        <div className="card mb16">
          <p className="cfg-sec">Vendors</p>
          {grouped.vendors.map(u => <RoleCard key={u.username} user={u} />)}
        </div>
      )}
    </div>
  );
}

// ─── My Account ──────────────────────────────────────────────────────────────

function AccountSection({ cfg, setCfg }) {
  const adminCreds = cfg.credentials?.admin || { username: 'Bstrings', password: '503320' };
  const [username, setUsername] = useState(adminCreds.username);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState('');

  function save() {
    if (password && password !== confirm) { setMsg('Passwords do not match.'); return; }
    if (!username.trim()) { setMsg('Username cannot be empty.'); return; }
    setCfg(prev => ({
      ...prev,
      credentials: {
        ...prev.credentials,
        admin: { username: username.trim(), password: password || adminCreds.password },
      },
    }));
    setMsg('Saved!');
    setPassword(''); setConfirm('');
    setTimeout(() => setMsg(''), 2500);
  }

  return (
    <div style={{ maxWidth: 400 }}>
      <SectionTitle title="My Account" sub="Change your super admin login" />
      <div className="card">
        <div className="mb12">
          <label className="lbl">Username</label>
          <input className="inp" value={username} onChange={e => setUsername(e.target.value)} />
        </div>
        <div className="mb12">
          <label className="lbl">New Password</label>
          <input className="inp" type="password" value={password} placeholder="Leave blank to keep current" onChange={e => setPassword(e.target.value)} />
        </div>
        <div className="mb16">
          <label className="lbl">Confirm New Password</label>
          <input className="inp" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} />
        </div>
        {msg && (
          <p style={{ fontSize: 13, color: msg === 'Saved!' ? 'var(--green)' : 'var(--red)', marginBottom: 12 }}>{msg}</p>
        )}
        <button className="btn btn-primary" onClick={save}>Save Account</button>
      </div>
    </div>
  );
}
