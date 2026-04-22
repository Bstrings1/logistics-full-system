import { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { fmt, filterPeriod, ot, gp, calcBonus, getBonusCycleOrders, getDups, REVENUE_STATUSES, TODAY } from '../utils/helpers';
import { Av, Badge, SBadge } from '../components/ui';
import DateFilter from '../components/DateFilter';
import PriceInput from '../components/PriceInput';

function useFP() {
  const { period, rangeFrom, rangeTo } = useApp();
  return list => filterPeriod(list, period, rangeFrom, rangeTo);
}

function useFmt() {
  const { cfg } = useApp();
  return n => fmt(n, cfg.currency);
}

export default function RiderManagerViews({ tabId }) {
  const { session } = useApp();
  const filterP = useFP();
  const fmtC = useFmt();
  const b = session.branch;

  if (tabId === 'log') return <RiderLog filterP={filterP} fmtC={fmtC} branch={b} />;
  if (tabId === 'assign') return <RiderAssign filterP={filterP} fmtC={fmtC} branch={b} />;
  if (tabId === 'update') return <RiderUpdate filterP={filterP} fmtC={fmtC} branch={b} />;
  if (tabId === 'my-riders') return <RiderMyRiders filterP={filterP} fmtC={fmtC} branch={b} />;
  return null;
}

function RiderLog({ filterP, fmtC, branch }) {
  const { cfg, db, setDb, setActiveTab } = useApp();
  const b = branch;
  const riders = db.riders[b] || [];
  const unassigned = filterP(db.orders.filter(o => o.branch === b && o.status === 'Unassigned'));

  const [date, setDate] = useState(TODAY);
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [vendor, setVendor] = useState(cfg.vendors[0] || '');
  const [products, setProducts] = useState([{ id: Date.now(), name: '', price: '', qty: '1' }]);

  const validProductList = Array.isArray(cfg.products) ? cfg.products : (cfg.products?.[vendor] || []);

  function handleVendorChange(v) {
    setVendor(v);
    setProducts([{ id: Date.now(), name: '', price: '', qty: '1' }]);
  }

  function addProd() {
    setProducts(p => [...p, { id: Date.now(), name: '', price: '', qty: '1' }]);
  }

  function removeProd(id) {
    setProducts(p => p.filter(r => r.id !== id));
  }

  function updateProd(id, field, value) {
    setProducts(p => p.map(r => r.id === id ? { ...r, [field]: value } : r));
  }

  function getStockForProduct(productName) {
    const entry = db.inventory[b]?.[vendor]?.[productName];
    if (!entry) return 0;
    return (entry.received || 0) - (entry.sentOut || 0) - (entry.delivered || 0);
  }
  const allProdsValid = products.every(r => {
    if (!validProductList.includes(r.name) || Number(r.price) <= 0) return false;
    if (getStockForProduct(r.name) <= 0) return false;
    return true;
  });
  const canSave = customerName.trim() && phone.trim() && address.trim() && allProdsValid;

  function save() {
    if (!canSave) return;
    const prods = products.map(r => ({ vendor, name: r.name, price: Number(r.price), qty: Number(r.qty) || 1 }));
    setDb(prev => ({
      ...prev,
      orders: [...prev.orders, { id: Date.now(), branch: b, rider: '', customerName, phone, address, status: 'Unassigned', date, products: prods }],
    }));
    setCustomerName(''); setPhone(''); setAddress(''); setDate(TODAY);
    setProducts([{ id: Date.now(), name: '', price: '', qty: '1' }]);
  }

  return (
    <>
      <div className="pg-hd"><p className="pg-title" style={{fontSize:20}}>Log Order</p></div>
      <div className="pg-body" style={{padding:'14px 14px 48px'}}>
        <div className="card" style={{padding:12}}>
          <div className="g2 mb12" style={{gap:10}}>
            <div><label className="lbl" style={{fontSize:14,marginBottom:4}}>Date</label><input className="inp" type="date" value={date} onChange={e => setDate(e.target.value)} style={{width:'100%',minWidth:0,height:48,padding:'0 12px',fontSize:16,lineHeight:'48px',display:'flex',alignItems:'center'}} /></div>
            <div><label className="lbl" style={{fontSize:14,marginBottom:4}}>Customer Name</label><input className="inp" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="e.g. Mrs Okonkwo" style={{height:48,padding:'0 12px',fontSize:16}} /></div>
            <div><label className="lbl" style={{fontSize:14,marginBottom:4}}>Phone</label><input className="inp" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="080..." style={{height:48,padding:'0 12px',fontSize:16}} /></div>
            <div><label className="lbl" style={{fontSize:14,marginBottom:4}}>Vendor</label>
              <select className="inp" value={vendor} onChange={e => handleVendorChange(e.target.value)} style={{height:48,padding:'0 12px',fontSize:16}}>
                {cfg.vendors.map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div className="span2"><label className="lbl" style={{fontSize:14,marginBottom:4}}>Delivery Address</label><input className="inp" value={address} onChange={e => setAddress(e.target.value)} placeholder="Full address..." style={{height:48,padding:'0 12px',fontSize:16}} /></div>
          </div>
          <div className="divider" />
          <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Products</p>
          <div className="col mb10">
            {products.map((row, i) => (
              <ProdRow
                key={row.id}
                idx={i}
                row={row}
                products={validProductList}
                showRemove={products.length > 1}
                onRemove={() => removeProd(row.id)}
                onChange={(field, val) => updateProd(row.id, field, val)}
                branch={b}
                vendor={vendor}
              />
            ))}
          </div>
          <button className="btn btn-outline btn-sm mb12" onClick={addProd} style={{marginTop:16}}>+ Add Product</button>
          <div className="divider" />
          {!canSave && (customerName || phone || address || products[0].name) && (
            <p style={{ fontSize: 12, color: 'var(--amber)', marginBottom: 8 }}>
              {!customerName.trim() ? '⚠ Customer name required' :
               !phone.trim() ? '⚠ Phone required' :
               !address.trim() ? '⚠ Address required' :
               '⚠ All products must be selected from the dropdown with a valid price'}
            </p>
          )}
          <button className="btn btn-primary mt8" onClick={save} disabled={!canSave} style={{opacity:canSave?1:0.45,width:'100%'}}>
            Save Order
          </button>
        </div>
        {unassigned.length > 0 && (
          <div className="card card-amber row-b mt12">
            <div><p style={{ fontWeight: 600, color: 'var(--amber)' }}>{unassigned.length} unassigned</p><p style={{ fontSize: 12, color: 'var(--amber)' }}>Go to Assign tab</p></div>
            <button className="btn btn-amber-soft btn-sm" onClick={() => setActiveTab('assign')}>Assign →</button>
          </div>
        )}
      </div>
    </>
  );
}

function ProdRow({ idx, row, products, showRemove, onRemove, onChange, branch, vendor }) {
  const { db } = useApp();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(row.name || '');

  useEffect(() => { setQuery(row.name || ''); }, [row.name]);

  const isValid = !query || products.includes(row.name);

  function getStock(productName) {
    const entry = db.inventory[branch]?.[vendor]?.[productName];
    if (!entry) return 0;
    return (entry.received || 0) - (entry.sentOut || 0) - (entry.delivered || 0);
  }

  const stockRemaining = row.name && isValid ? getStock(row.name) : null;
  const outOfStock = stockRemaining !== null && stockRemaining <= 0;

  const filtered = query
    ? products.filter(p => p.toLowerCase().includes(query.toLowerCase()))
    : products;

  function pick(p) {
    const st = getStock(p);
    if (st !== null && st <= 0) return;
    onChange('name', p);
    setQuery(p);
    setOpen(false);
  }

  function handleInput(val) {
    setQuery(val);
    onChange('name', val);
    setOpen(true);
  }

  return (
    <div className="card card-sm mb6" style={{ borderColor: (row.name && !isValid) || outOfStock ? 'var(--red-bd)' : undefined }}>
      <div className="row-b mb8">
        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--t3)' }}>Product {idx + 1}</p>
        {showRemove && <button className="btn btn-red-soft btn-xs" onClick={onRemove}>Remove</button>}
      </div>
      <div className="g3">
        <div className="ac-wrap">
          <label className="lbl">
            Product
            {row.name && !isValid && <span style={{ color: 'var(--red)', marginLeft: 4 }}>— not in list</span>}
            {row.name && isValid && !outOfStock && <span style={{ color: 'var(--green)', marginLeft: 4 }}>✓</span>}
            {outOfStock && <span style={{ color: 'var(--red)', marginLeft: 4, fontWeight: 700 }}>— Out of Stock</span>}
          </label>
          <input
            className="inp"
            value={query}
            placeholder="Click to browse products..."
            autoComplete="off"
            style={{ borderColor: (row.name && !isValid) || outOfStock ? 'var(--red)' : row.name && isValid ? 'var(--green)' : undefined }}
            onChange={e => handleInput(e.target.value)}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 180)}
          />
          {open && (
            <div className="ac-list open">
              {filtered.length > 0
                ? filtered.map(p => {
                    const st = getStock(p);
                    const oos = st !== null && st <= 0;
                    return (
                      <div
                        key={p}
                        className="ac-item"
                        style={{ opacity: oos ? 0.4 : 1, cursor: oos ? 'not-allowed' : 'pointer' }}
                        onMouseDown={() => pick(p)}
                      >
                        {p}
                        {oos && <span style={{ fontSize: 10, color: 'var(--red)', marginLeft: 6 }}>Out of stock</span>}
                        {!oos && st > 0 && <span style={{ fontSize: 10, color: 'var(--t4)', marginLeft: 6 }}>{st} left</span>}
                      </div>
                    );
                  })
                : <div className="ac-item" style={{ color: 'var(--t4)', fontStyle: 'italic' }}>No products match</div>
              }
            </div>
          )}
        </div>
        <div><label className="lbl">Price</label><PriceInput value={row.price} onChange={v => onChange('price', v)} /></div>
        <div><label className="lbl">Qty</label><input className="inp" type="number" value={row.qty} min="1" onChange={e => onChange('qty', e.target.value)} /></div>
      </div>
      {outOfStock && (
        <p style={{ fontSize: 11, color: 'var(--red)', marginTop: 6, fontWeight: 600 }}>⚠ No stock available for this product at {branch}</p>
      )}
    </div>
  );
}

function RiderAssign({ filterP, fmtC, branch }) {
  const { db, setDb } = useApp();
  const b = branch;
  const riders = db.riders[b] || [];
  const unassigned = filterP(db.orders.filter(o => o.branch === b && o.status === 'Unassigned'));
  const dups = getDups(unassigned);
  const [filter, setFilter] = useState({ name: '', phone: '' });
  const [selectedRiders, setSelectedRiders] = useState({});

  const sorted = [...unassigned].sort((a, bb) => (dups.has(bb.id) ? 1 : 0) - (dups.has(a.id) ? 1 : 0));
  const filtered = sorted.filter(o =>
    (!filter.name || o.customerName.toLowerCase().includes(filter.name.toLowerCase())) &&
    (!filter.phone || o.phone.includes(filter.phone))
  );

  function assign(id) {
    const rider = selectedRiders[id];
    if (!rider || rider === 'Select rider...') return;
    setDb(prev => ({ ...prev, orders: prev.orders.map(o => String(o.id) === String(id) ? { ...o, rider, status: 'Pending' } : o) }));
  }

  function cancel(id) {
    if (!confirm('Cancel this order?')) return;
    setDb(prev => ({ ...prev, orders: prev.orders.map(o => String(o.id) === String(id) ? { ...o, status: 'Cancelled' } : o) }));
  }

  return (
    <>
      <div className="pg-hd">
        <p className="pg-title">Assign Orders</p>
        <p className="pg-sub">{unassigned.length} unassigned{dups.size > 0 ? ` · ⚠ ${dups.size} possible duplicates` : ''}</p>
      </div>
      <div className="pg-body">
        {dups.size > 0 && (
          <div className="fraud-strip mb14">
            <p className="f-title">⚠ Duplicate Orders Detected</p>
            <p className="f-sub">Orders with matching phone or name+address are shown first — verify before assigning</p>
          </div>
        )}
        <div className="g2 mb20">
          <div className="search-wrap"><span className="s-ico">🔍</span><input className="inp" placeholder="Search by name..." value={filter.name} onChange={e => setFilter(f => ({ ...f, name: e.target.value }))} /></div>
          <div className="search-wrap"><span className="s-ico">🔍</span><input className="inp" placeholder="Search by phone..." value={filter.phone} onChange={e => setFilter(f => ({ ...f, phone: e.target.value }))} /></div>
        </div>
        {filtered.length ? filtered.map(o => {
          const isDup = dups.has(o.id);
          return (
            <div key={o.id} className={`card${isDup ? ' card-red' : ''} mb8`}>
              {isDup && (
                <div style={{ background: 'var(--red-lt)', border: '1.5px solid var(--red-bd)', borderRadius: 'var(--r)', padding: '8px 12px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>⚠</span>
                  <div><p style={{ fontSize: 12, fontWeight: 700, color: 'var(--red)' }}>Possible duplicate</p><p style={{ fontSize: 11, color: 'var(--amber)' }}>Same phone or name+address</p></div>
                </div>
              )}
              <div className="row-b mb10">
                <div>
                  <p style={{ fontWeight: 700 }}>{o.customerName}</p>
                  <p style={{ fontSize: 11, color: 'var(--t4)' }}>{o.phone} · {o.address}</p>
                  <p style={{ fontSize: 12, color: 'var(--t3)', marginTop: 3 }}>{gp(o).map(p => p.name + ' ×' + p.qty).join(', ')}</p>
                </div>
                <p style={{ fontWeight: 700, fontSize: 15 }}>{fmtC(ot(o))}</p>
              </div>
              <div className="row" style={{ gap: 6 }}>
                <select
                  className="inp"
                  style={{ flex: 1 }}
                  value={selectedRiders[o.id] || ''}
                  onChange={e => setSelectedRiders(prev => ({ ...prev, [o.id]: e.target.value }))}
                >
                  <option value="">Select rider...</option>
                  {riders.map(r => <option key={r}>{r}</option>)}
                </select>
                <button className="btn btn-primary btn-sm" onClick={() => assign(o.id)}>Assign</button>
                <button className="btn btn-red-soft btn-sm" onClick={() => cancel(o.id)}>Cancel</button>
              </div>
            </div>
          );
        }) : <div className="empty-box"><p className="empty-t">All orders assigned ✓</p></div>}
      </div>
    </>
  );
}

function RiderUpdate({ filterP, fmtC, branch }) {
  const { db, setDb, setEditModalOrderId, setEditModalStatus } = useApp();
  const b = branch;
  const riders = db.riders[b] || [];
  const fo = filterP(db.orders.filter(o => o.branch === b));
  const pending = fo.filter(o => o.status === 'Pending');
  const delivered = fo.filter(o => o.status === 'Delivered');
  const completed = fo.filter(o => o.status === 'Completed');
  const failed = fo.filter(o => o.status === 'Failed');
  const replaced = fo.filter(o => o.status === 'Replaced');
  const notDelivered = fo.filter(o => o.status === 'Not Delivered');
  const riderExpToday = db.riderExpenses.filter(e => e.branch === b && e.date === TODAY);
  const expByRider = riderExpToday.reduce((acc, e) => { (acc[e.rider] = acc[e.rider] || []).push(e); return acc; }, {});
  const [riderFilter, setRiderFilter] = useState('');
  const [expFields, setExpFields] = useState({ rider: riders[0] || '', amount: '', desc: '' });
  const [openDropdown, setOpenDropdown] = useState(null);
  const [completingId, setCompletingId] = useState(null);
  const [completingAmt, setCompletingAmt] = useState('');

  function setStatus(id, status) {
    setDb(prev => ({ ...prev, orders: prev.orders.map(o => String(o.id) === String(id) ? { ...o, status } : o) }));
  }

  function startComplete(order) {
    const full = order.products?.reduce((s, p) => s + (Number(p.price)||0) * (Number(p.qty)||1), 0) || 0;
    setCompletingId(order.id);
    setCompletingAmt(String(full));
  }

  function confirmComplete() {
    const paid = Number(completingAmt);
    if (!paid || paid <= 0) { alert('Enter the amount paid by customer'); return; }
    setDb(prev => ({
      ...prev,
      orders: prev.orders.map(o => String(o.id) === String(completingId)
        ? { ...o, status: 'Completed', paidAmount: paid }
        : o
      ),
    }));
    setCompletingId(null);
    setCompletingAmt('');
  }

  function saveRiderExp() {
    if (!expFields.rider || !expFields.amount) return;
    setDb(prev => ({
      ...prev,
      riderExpenses: [...prev.riderExpenses, { id: Date.now(), branch: b, rider: expFields.rider, amount: Number(expFields.amount), desc: expFields.desc || 'Expense', date: TODAY }],
    }));
    setExpFields(f => ({ ...f, amount: '', desc: '' }));
  }

  const filtPending = riderFilter ? pending.filter(o => o.rider.toLowerCase().includes(riderFilter.toLowerCase())) : pending;

  return (
    <>
      <div className="pg-hd"><p className="pg-title">Update Orders</p></div>
      <div className="pg-body">
        <DateFilter />
        <div className="g2 mb14">
          <div className="search-wrap"><span className="s-ico">🔍</span><input className="inp" placeholder="Filter by rider..." value={riderFilter} onChange={e => setRiderFilter(e.target.value)} /></div>
          <div />
        </div>

        <div className="card card-amber mb16">
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--amber)', marginBottom: 12 }}>⊟ Rider Expenses</p>
          <div className="g3 mb8">
            <div>
              <label className="lbl">Rider</label>
              <select className="inp" value={expFields.rider} onChange={e => setExpFields(f => ({ ...f, rider: e.target.value }))}>
                {riders.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div><label className="lbl">Amount (₦)</label><input className="inp" type="number" value={expFields.amount} placeholder="0" onChange={e => setExpFields(f => ({ ...f, amount: e.target.value }))} /></div>
            <div><label className="lbl">Description</label><input className="inp" value={expFields.desc} placeholder="Fuel, repair..." onChange={e => setExpFields(f => ({ ...f, desc: e.target.value }))} /></div>
          </div>
          <button className="btn btn-amber-soft btn-sm" onClick={saveRiderExp}>Save Expense</button>
          {Object.keys(expByRider).length > 0 && (
            <>
              <div className="divider" />
              <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--t4)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Today's rider expenses</p>
              {Object.entries(expByRider).map(([r, exps]) => (
                <div key={r} style={{ marginBottom: 8 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{r}</p>
                  {exps.map((e, i) => (
                    <div key={i} className="row-b" style={{ padding: '3px 0', borderBottom: '1.5px solid var(--border-soft)' }}>
                      <span style={{ fontSize: 12, color: 'var(--t3)' }}>{e.desc}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--amber)' }}>{fmtC(e.amount)}</span>
                    </div>
                  ))}
                </div>
              ))}
            </>
          )}
        </div>

        {filtPending.length > 0 && (
          <>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>Pending · {filtPending.length}</p>
            {filtPending.map(o => (
              <div key={o.id} className="card mb8">
                {String(completingId) === String(o.id) && (
                  <div style={{ background: 'var(--green-lt)', border: '1.5px solid var(--green-bd)', borderRadius: 'var(--r)', padding: '12px 14px', marginBottom: 12 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)', marginBottom: 4 }}>Confirm Completion</p>
                    <p style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 10 }}>
                      Full value: <strong>{fmtC(o.products?.reduce((s,p)=>s+(Number(p.price)||0)*(Number(p.qty)||1),0)||0)}</strong> — enter what customer actually paid:
                    </p>
                    <div className="row" style={{ gap: 8 }}>
                      <input className="inp" type="number" value={completingAmt} onChange={e => setCompletingAmt(e.target.value)} placeholder="Amount paid..." style={{ flex: 1 }} />
                      <button className="btn btn-green btn-sm" onClick={confirmComplete}>Confirm</button>
                      <button className="btn btn-outline btn-sm" onClick={() => setCompletingId(null)}>Cancel</button>
                    </div>
                  </div>
                )}
                <div className="row-b mb10">
                  <div className="row" style={{ gap: 9 }}>
                    <Av name={o.rider || '?'} size={26} />
                    <div>
                      <p style={{ fontWeight: 600 }}>{o.customerName}</p>
                      <p style={{ fontSize: 11, color: 'var(--t4)' }}>{o.rider} · {o.phone}</p>
                      <p style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>{gp(o).map(p => `${p.name} ×${p.qty} — ${fmtC(p.price)}`).join(' | ')}</p>
                    </div>
                  </div>
                  <p style={{ fontWeight: 700, fontSize: 15 }}>{fmtC(ot(o))}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <button style={{ flex: 1, padding: '7px 0', background: 'var(--green)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }} onClick={() => { setEditModalStatus('Delivered'); setEditModalOrderId(o.id); setOpenDropdown(null); }}>✓ Delivered</button>
                  <button style={{ flex: 1, padding: '7px 0', background: 'var(--red-lt)', color: 'var(--red)', border: '1.5px solid var(--red-bd)', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }} onClick={() => { setStatus(o.id, 'Not Delivered'); setOpenDropdown(null); }}>✗ Not Delivered</button>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <button style={{ padding: '7px 10px', background: '#f1f5f9', color: 'var(--t3)', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }} onClick={() => setOpenDropdown(openDropdown === o.id ? null : o.id)}>• • •</button>
                    {openDropdown === o.id && (
                      <div style={{ position: 'absolute', right: 0, top: '110%', background: '#fff', border: '1.5px solid var(--border)', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,.15)', zIndex: 200, minWidth: 140, overflow: 'hidden' }}>
                        <button style={{ display: 'block', width: '100%', padding: '11px 14px', textAlign: 'left', fontSize: 13, fontWeight: 600, background: 'none', border: 'none', borderBottom: '1px solid var(--border-soft)', color: '#0d9488', cursor: 'pointer' }} onClick={() => { setEditModalStatus('Completed'); setEditModalOrderId(o.id); setOpenDropdown(null); }}>⊕ Completed</button>
                        <button style={{ display: 'block', width: '100%', padding: '11px 14px', textAlign: 'left', fontSize: 13, fontWeight: 600, background: 'none', border: 'none', borderBottom: '1px solid var(--border-soft)', color: 'var(--red)', cursor: 'pointer' }} onClick={() => { setStatus(o.id, 'Failed'); setOpenDropdown(null); }}>✗ Failed</button>
                        <button style={{ display: 'block', width: '100%', padding: '11px 14px', textAlign: 'left', fontSize: 13, fontWeight: 600, background: 'none', border: 'none', color: 'var(--amber)', cursor: 'pointer' }} onClick={() => { setStatus(o.id, 'Replaced'); setOpenDropdown(null); }}>↩ Replaced</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {(delivered.length > 0 || completed.length > 0 || replaced.length > 0) && (
          <>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '.07em', margin: '16px 0 8px' }}>
              Delivered / Completed / Replaced · {delivered.length + completed.length + replaced.length}
            </p>
            <div className="card" style={{ padding: '4px 0' }}>
              {[...delivered, ...completed, ...replaced].map((o, i, arr) => (
                <div key={o.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: i < arr.length - 1 ? '1px solid var(--border-soft)' : 'none' }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.customerName}</p>
                    <p style={{ fontSize: 11, color: 'var(--t4)', marginTop: 1 }}>{o.rider} · {o.phone}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 8 }}>
                    <SBadge status={o.status} />
                    <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--green)', whiteSpace: 'nowrap' }}>{fmtC(ot(o))}</p>
                    <button style={{ padding: '4px 8px', fontSize: 11, fontWeight: 600, background: 'var(--purple-lt)', color: 'var(--purple)', border: '1px solid var(--purple-bd)', borderRadius: 6, cursor: 'pointer', whiteSpace: 'nowrap' }} onClick={() => { setEditModalStatus(o.status); setEditModalOrderId(o.id); }}>Edit</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {(notDelivered.length > 0 || failed.length > 0) && (
          <>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '.07em', margin: '16px 0 8px' }}>
              Not Delivered / Failed · {notDelivered.length + failed.length}
            </p>
            <div className="card" style={{ padding: '4px 0' }}>
              {[...notDelivered, ...failed].map((o, i, arr) => (
                <div key={o.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: i < arr.length - 1 ? '1px solid var(--border-soft)' : 'none' }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.customerName}</p>
                    <p style={{ fontSize: 11, color: 'var(--t4)', marginTop: 1 }}>{o.rider} · {o.phone}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 8 }}>
                    <SBadge status={o.status} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {!pending.length && !delivered.length && !completed.length && !failed.length && !replaced.length && !notDelivered.length && (
          <div className="empty-box"><p className="empty-t">No orders in this period</p></div>
        )}
      </div>
    </>
  );
}

function RiderMyRiders({ filterP, fmtC, branch }) {
  const { cfg, db } = useApp();
  const b = branch;
  const fo = filterP(db.orders.filter(o => o.branch === b));
  const riders = db.riders[b] || [];

  return (
    <>
      <div className="pg-hd"><p className="pg-title">My Riders</p></div>
      <div className="pg-body">
        <DateFilter />
        <div className="card">
          <table className="tbl">
            <thead><tr><th>Rider</th><th>Deliveries</th><th>Value</th><th>Cycle Bonus</th></tr></thead>
            <tbody>
              {riders.map(name => {
                const ords = fo.filter(o => o.rider === name && REVENUE_STATUSES.includes(o.status));
                const val = ords.reduce((s, o) => s + ot(o), 0);
                const cc = getBonusCycleOrders(name, db).length;
                return (
                  <tr key={name}>
                    <td><div className="row" style={{ gap: 9 }}><Av name={name} size={26} /><p style={{ fontWeight: 500 }}>{name}</p></div></td>
                    <td style={{ fontWeight: 600 }}>{ords.length}</td>
                    <td style={{ fontWeight: 600 }}>{fmtC(val)}</td>
                    <td style={{ fontWeight: 700, color: 'var(--purple)' }}>{fmtC(calcBonus(cc, name, cfg))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
