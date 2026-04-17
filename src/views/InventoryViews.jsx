import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Badge } from '../components/ui';
import { TODAY } from '../utils/helpers';

export default function InventoryViews({ tabId }) {
  const { session } = useApp();
  const b = session.branch;

  if (tabId === 'stock') return <InvStock branch={b} />;
  if (tabId === 'waybill-in') return <WaybillIn branch={b} />;
  if (tabId === 'waybill-out') return <WaybillOut branch={b} />;
  if (tabId === 'transfer') return <Transfer branch={b} />;
  return null;
}

function InvStock({ branch }) {
  const { cfg, db } = useApp();
  const [sv, setSv] = useState('');
  const [sp, setSp] = useState('');

  const rows = cfg.vendors
    .filter(v => !sv || v.toLowerCase().includes(sv.toLowerCase()))
    .map(v => {
      const items = db.inventory[v] || {};
      const filt = Object.entries(items).filter(([p]) => !sp || p.toLowerCase().includes(sp.toLowerCase()));
      return { v, filt };
    })
    .filter(({ filt }) => filt.length > 0 || !sp);

  return (
    <>
      <div className="pg-hd"><p className="pg-title">Stock · {branch}</p></div>
      <div className="pg-body">
        <div className="g2 mb14">
          <div className="search-wrap"><span className="s-ico">🔍</span><input className="inp" placeholder="Search vendor..." value={sv} onChange={e => setSv(e.target.value)} /></div>
          <div className="search-wrap"><span className="s-ico">🔍</span><input className="inp" placeholder="Search product..." value={sp} onChange={e => setSp(e.target.value)} /></div>
        </div>
        {rows.map(({ v, filt }) => (
          <div key={v} className="mb14">
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--t3)', marginBottom: 8 }}>{v}</p>
            <div className="card card-sm">
              <table className="tbl">
                <thead><tr><th>Product</th><th>Received</th><th>Delivered</th><th>Remaining</th><th>Status</th></tr></thead>
                <tbody>
                  {filt.length ? filt.map(([p, d]) => {
                    const rem = (d.received || 0) - (d.delivered || 0);
                    return (
                      <tr key={p}>
                        <td><p style={{ fontWeight: 500 }}>{p}</p></td>
                        <td style={{ color: 'var(--green)', fontWeight: 600 }}>{d.received || 0}</td>
                        <td style={{ color: 'var(--purple)', fontWeight: 600 }}>{d.delivered || 0}</td>
                        <td style={{ fontWeight: 700, color: rem <= 0 ? 'var(--red)' : 'var(--text)' }}>{rem}</td>
                        <td><Badge text={rem <= 0 ? 'Out' : 'In stock'} type={rem <= 0 ? 'red' : 'green'} /></td>
                      </tr>
                    );
                  }) : (
                    <tr><td colSpan={5} style={{ fontSize: 12, color: 'var(--t4)' }}>No stock</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ))}
        {rows.length === 0 && <div className="empty-box"><p className="empty-t">No results</p></div>}
      </div>
    </>
  );
}

function WaybillIn({ branch }) {
  const { cfg, db, setDb } = useApp();
  const [fields, setFields] = useState({ vendor: cfg.vendors[0] || '', product: '', qty: '', date: TODAY, note: '' });

  function save() {
    const { vendor, product, qty } = fields;
    if (!product || !qty) return;
    const q = Number(qty);
    setDb(prev => {
      const inv = { ...prev.inventory };
      if (!inv[vendor]) inv[vendor] = {};
      if (!inv[vendor][product]) inv[vendor][product] = { received: 0, delivered: 0 };
      inv[vendor][product] = { ...inv[vendor][product], received: (inv[vendor][product].received || 0) + q };
      return { ...prev, inventory: inv };
    });
    setFields(f => ({ ...f, product: '', qty: '', note: '' }));
  }

  return (
    <>
      <div className="pg-hd"><p className="pg-title">Waybill In</p></div>
      <div className="pg-body">
        <div className="card">
          <div className="g2 mb12">
            <div><label className="lbl">Vendor</label><select className="inp" value={fields.vendor} onChange={e => setFields(f => ({ ...f, vendor: e.target.value }))}>{cfg.vendors.map(v => <option key={v}>{v}</option>)}</select></div>
            <div><label className="lbl">Product</label><input className="inp" value={fields.product} onChange={e => setFields(f => ({ ...f, product: e.target.value }))} placeholder="Product name..." /></div>
            <div><label className="lbl">Quantity</label><input className="inp" type="number" value={fields.qty} onChange={e => setFields(f => ({ ...f, qty: e.target.value }))} placeholder="0" /></div>
            <div><label className="lbl">Date</label><input className="inp" type="date" value={fields.date} onChange={e => setFields(f => ({ ...f, date: e.target.value }))} /></div>
            <div className="span2"><label className="lbl">Note</label><input className="inp" value={fields.note} onChange={e => setFields(f => ({ ...f, note: e.target.value }))} placeholder="Notes..." /></div>
          </div>
          <button className="btn btn-primary" onClick={save}>Waybill In</button>
        </div>
      </div>
    </>
  );
}

function WaybillOut({ branch }) {
  const { cfg, db, setDb } = useApp();
  const [fields, setFields] = useState({ vendor: cfg.vendors[0] || '', product: '', qty: '', date: TODAY, note: '' });

  function save() {
    const { vendor, product, qty } = fields;
    if (!product || !qty) return;
    const q = Number(qty);
    setDb(prev => {
      const inv = { ...prev.inventory };
      if (!inv[vendor]) inv[vendor] = {};
      if (!inv[vendor][product]) inv[vendor][product] = { received: 0, delivered: 0 };
      inv[vendor][product] = { ...inv[vendor][product], received: Math.max(0, (inv[vendor][product].received || 0) - q) };
      return { ...prev, inventory: inv };
    });
    setFields(f => ({ ...f, product: '', qty: '', note: '' }));
  }

  return (
    <>
      <div className="pg-hd"><p className="pg-title">Waybill Out</p></div>
      <div className="pg-body">
        <div className="card">
          <div className="g2 mb12">
            <div><label className="lbl">Vendor</label><select className="inp" value={fields.vendor} onChange={e => setFields(f => ({ ...f, vendor: e.target.value }))}>{cfg.vendors.map(v => <option key={v}>{v}</option>)}</select></div>
            <div><label className="lbl">Product</label><input className="inp" value={fields.product} onChange={e => setFields(f => ({ ...f, product: e.target.value }))} placeholder="Product name..." /></div>
            <div><label className="lbl">Quantity</label><input className="inp" type="number" value={fields.qty} onChange={e => setFields(f => ({ ...f, qty: e.target.value }))} placeholder="0" /></div>
            <div><label className="lbl">Date</label><input className="inp" type="date" value={fields.date} onChange={e => setFields(f => ({ ...f, date: e.target.value }))} /></div>
            <div className="span2"><label className="lbl">Note</label><input className="inp" value={fields.note} onChange={e => setFields(f => ({ ...f, note: e.target.value }))} placeholder="Notes..." /></div>
          </div>
          <button className="btn btn-primary" onClick={save}>Waybill Out</button>
        </div>
      </div>
    </>
  );
}

function Transfer({ branch }) {
  const { cfg } = useApp();
  const otherBranches = cfg.branches.filter(x => x !== branch);
  const [fields, setFields] = useState({ vendor: cfg.vendors[0] || '', product: '', qty: '', date: TODAY, note: '', toBranch: otherBranches[0] || '' });

  function save() {
    alert(`Transfer from ${branch} → ${fields.toBranch}`);
  }

  return (
    <>
      <div className="pg-hd"><p className="pg-title">Transfer</p></div>
      <div className="pg-body">
        <div className="card">
          <div className="g2 mb12">
            <div><label className="lbl">Vendor</label><select className="inp" value={fields.vendor} onChange={e => setFields(f => ({ ...f, vendor: e.target.value }))}>{cfg.vendors.map(v => <option key={v}>{v}</option>)}</select></div>
            <div><label className="lbl">Product</label><input className="inp" value={fields.product} onChange={e => setFields(f => ({ ...f, product: e.target.value }))} placeholder="Product name..." /></div>
            <div><label className="lbl">Quantity</label><input className="inp" type="number" value={fields.qty} onChange={e => setFields(f => ({ ...f, qty: e.target.value }))} placeholder="0" /></div>
            <div><label className="lbl">Date</label><input className="inp" type="date" value={fields.date} onChange={e => setFields(f => ({ ...f, date: e.target.value }))} /></div>
            <div>
              <label className="lbl">To Branch</label>
              <select className="inp" value={fields.toBranch} onChange={e => setFields(f => ({ ...f, toBranch: e.target.value }))}>
                {otherBranches.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div><label className="lbl">Note</label><input className="inp" value={fields.note} onChange={e => setFields(f => ({ ...f, note: e.target.value }))} placeholder="Notes..." /></div>
          </div>
          <button className="btn btn-primary" onClick={save}>Transfer</button>
        </div>
      </div>
    </>
  );
}
