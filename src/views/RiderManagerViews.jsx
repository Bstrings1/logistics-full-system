import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { fmt, filterPeriod, ot, gp, calcBonus, getBonusCycleOrders, getDups, TODAY } from '../utils/helpers';
import { Av, Badge, SBadge } from '../components/ui';
import DateFilter from '../components/DateFilter';

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

  function addProd() {
    setProducts(p => [...p, { id: Date.now(), name: '', price: '', qty: '1' }]);
  }

  function removeProd(id) {
    setProducts(p => p.filter(r => r.id !== id));
  }

  function updateProd(id, field, value) {
    setProducts(p => p.map(r => r.id === id ? { ...r, [field]: value } : r));
  }

  function save() {
    if (!customerName) { alert('Customer name required'); return; }
    const prods = products.filter(r => r.name && Number(r.price) > 0).map(r => ({ vendor, name: r.name, price: Number(r.price), qty: Number(r.qty) || 1 }));
    if (!prods.length) { alert('Add at least one product'); return; }
    setDb(prev => ({
      ...prev,
      orders: [...prev.orders, { id: Date.now(), branch: b, rider: '', customerName, phone, address, status: 'Unassigned', date, products: prods }],
    }));
    setCustomerName(''); setPhone(''); setAddress(''); setDate(TODAY);
    setProducts([{ id: Date.now(), name: '', price: '', qty: '1' }]);
  }

  return (
    <>
      <div className="pg-hd"><p className="pg-title">Log Order</p></div>
      <div className="pg-body">
        <div className="card">
          <div className="g2 mb12">
            <div><label className="lbl">Date</label><input className="inp" type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
            <div><label className="lbl">Customer Name</label><input className="inp" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="e.g. Mrs Okonkwo" /></div>
            <div><label className="lbl">Phone</label><input className="inp" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="080..." /></div>
            <div><label className="lbl">Vendor</label>
              <select className="inp" value={vendor} onChange={e => setVendor(e.target.value)}>
                {cfg.vendors.map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div className="span2"><label className="lbl">Delivery Address</label><input className="inp" value={address} onChange={e => setAddress(e.target.value)} placeholder="Full address..." /></div>
          </div>
          <div className="divider" />
          <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Products</p>
          <div className="col mb10">
            {products.map((row, i) => (
              <ProdRow
                key={row.id}
                idx={i}
                row={row}
                products={cfg.products}
                showRemove={products.length > 1}
                onRemove={() => removeProd(row.id)}
                onChange={(field, val) => updateProd(row.id, field, val)}
              />
            ))}
          </div>
          <button className="btn btn-outline btn-sm mb12" onClick={addProd}>+ Add Product</button>
          <div className="divider" />
          <button className="btn btn-primary mt8" onClick={save}>Save Order</button>
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

function ProdRow({ idx, row, products, showRemove, onRemove, onChange }) {
  const [suggestions, setSuggestions] = useState([]);

  function handleInput(val) {
    onChange('name', val);
    if (val) setSuggestions(products.filter(p => p.toLowerCase().includes(val.toLowerCase())));
    else setSuggestions([]);
  }

  return (
    <div className="card card-sm mb6">
      <div className="row-b mb8">
        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--t3)' }}>Product {idx + 1}</p>
        {showRemove && <button className="btn btn-red-soft btn-xs" onClick={onRemove}>Remove</button>}
      </div>
      <div className="g3">
        <div className="ac-wrap">
          <label className="lbl">Name (type to search)</label>
          <input
            className="inp"
            value={row.name}
            placeholder="Product name..."
            autoComplete="off"
            onChange={e => handleInput(e.target.value)}
            onBlur={() => setTimeout(() => setSuggestions([]), 200)}
          />
          {suggestions.length > 0 && (
            <div className="ac-list open">
              {suggestions.map(p => (
                <div key={p} className="ac-item" onMouseDown={() => { onChange('name', p); setSuggestions([]); }}>{p}</div>
              ))}
            </div>
          )}
        </div>
        <div><label className="lbl">Price (₦)</label><input className="inp" type="number" value={row.price} placeholder="0" onChange={e => onChange('price', e.target.value)} /></div>
        <div><label className="lbl">Qty</label><input className="inp" type="number" value={row.qty} min="1" onChange={e => onChange('qty', e.target.value)} /></div>
      </div>
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
        <div className="g2 mb14">
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
  const { db, setDb, setEditModalOrderId } = useApp();
  const b = branch;
  const riders = db.riders[b] || [];
  const fo = filterP(db.orders.filter(o => o.branch === b));
  const pending = fo.filter(o => o.status === 'Pending');
  const delivered = fo.filter(o => o.status === 'Delivered');
  const failed = fo.filter(o => o.status === 'Failed');
  const notDelivered = fo.filter(o => o.status === 'Not Delivered');
  const riderExpToday = db.riderExpenses.filter(e => e.branch === b && e.date === TODAY);
  const expByRider = riderExpToday.reduce((acc, e) => { (acc[e.rider] = acc[e.rider] || []).push(e); return acc; }, {});
  const [riderFilter, setRiderFilter] = useState('');
  const [expFields, setExpFields] = useState({ rider: riders[0] || '', amount: '', desc: '' });

  function setStatus(id, status) {
    setDb(prev => ({ ...prev, orders: prev.orders.map(o => String(o.id) === String(id) ? { ...o, status } : o) }));
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
                <div className="row" style={{ gap: 6 }}>
                  <button className="btn btn-green btn-sm" style={{ flex: 1 }} onClick={() => setEditModalOrderId(o.id)}>✓ Delivered (Edit first)</button>
                  <button className="btn btn-red-soft btn-sm" style={{ flex: 1 }} onClick={() => setStatus(o.id, 'Failed')}>✗ Failed</button>
                  <button className="btn btn-outline btn-xs" onClick={() => setStatus(o.id, 'Not Delivered')}>Not out</button>
                </div>
              </div>
            ))}
          </>
        )}

        {notDelivered.length > 0 && (
          <>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.07em', margin: '16px 0 10px' }}>Not Delivered · {notDelivered.length} (can still be delivered)</p>
            {notDelivered.map(o => (
              <div key={o.id} className="card mb8" style={{ borderLeft: '3px solid var(--t4)', paddingLeft: 15 }}>
                <div className="row-b mb8">
                  <div><p style={{ fontWeight: 600 }}>{o.customerName}</p><p style={{ fontSize: 11, color: 'var(--t4)' }}>{o.rider} · {o.phone}</p></div>
                  <div className="row" style={{ gap: 6 }}>
                    <button className="btn btn-green btn-sm" onClick={() => setEditModalOrderId(o.id)}>✓ Now Delivered</button>
                    <button className="btn btn-outline btn-xs" onClick={() => setStatus(o.id, 'Pending')}>Re-assign</button>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {delivered.length > 0 && (
          <>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '.07em', margin: '16px 0 10px' }}>Delivered · {delivered.length}</p>
            <div className="card">
              <table className="tbl">
                <thead><tr><th>Customer</th><th>Rider</th><th>Value</th></tr></thead>
                <tbody>
                  {delivered.map(o => (
                    <tr key={o.id}>
                      <td style={{ fontWeight: 500 }}>{o.customerName}</td>
                      <td style={{ fontSize: 12 }}>{o.rider}</td>
                      <td style={{ fontWeight: 600, color: 'var(--green)' }}>{fmtC(ot(o))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {failed.length > 0 && (
          <>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '.07em', margin: '16px 0 10px' }}>Failed · {failed.length}</p>
            <div className="card">
              <table className="tbl">
                <tbody>
                  {failed.map(o => (
                    <tr key={o.id}>
                      <td style={{ fontWeight: 500 }}>{o.customerName}</td>
                      <td><SBadge status="Failed" /></td>
                      <td style={{ fontSize: 11, color: 'var(--t4)' }}>Fee set by CEO</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {!pending.length && !delivered.length && !failed.length && !notDelivered.length && (
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
                const ords = fo.filter(o => o.rider === name && o.status === 'Delivered');
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
