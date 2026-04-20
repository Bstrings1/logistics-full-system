import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { gp } from '../utils/helpers';

const S = {
  lbl: { fontSize: 11, fontWeight: 600, color: 'var(--t2)', marginBottom: 3, display: 'block' },
  inp: { width: '100%', border: '1.5px solid var(--border)', borderRadius: 8, padding: '8px 10px', fontSize: 16, outline: 'none', background: '#fff', color: 'var(--text)', boxSizing: 'border-box' },
};

export default function EditOrderModal() {
  const { db, setDb, editModalOrderId, setEditModalOrderId } = useApp();
  const [fields, setFields] = useState({ customerName: '', phone: '', address: '' });
  const [products, setProducts] = useState([]);

  const order = db.orders.find(o => o.id === editModalOrderId);

  useEffect(() => {
    if (order) {
      setFields({ customerName: order.customerName, phone: order.phone, address: order.address });
      setProducts(gp(order).map((p, i) => ({ ...p, _key: i })));
    }
  }, [editModalOrderId]);

  if (!editModalOrderId) return null;

  function close() { setEditModalOrderId(null); }

  function addProd() {
    setProducts(prev => [...prev, { name: '', price: 0, qty: 1, vendor: gp(order)[0]?.vendor || '', _key: Date.now() }]);
  }

  function updateProd(idx, field, value) {
    setProducts(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  }

  function confirmDelivered() {
    const validProds = products.filter(p => p.name && Number(p.price) > 0).map(({ _key, ...p }) => ({
      ...p, price: Number(p.price), qty: Number(p.qty) || 1,
    }));
    const finalProds = validProds.length ? validProds : gp(order);
    const branch = order.branch;

    setDb(prev => {
      const inv = JSON.parse(JSON.stringify(prev.inventory));
      finalProds.forEach(p => {
        const vendor = p.vendor;
        const qty = Number(p.qty) || 1;
        if (!vendor || !p.name) return;
        if (!inv[branch]) inv[branch] = {};
        if (!inv[branch][vendor]) inv[branch][vendor] = {};
        if (!inv[branch][vendor][p.name]) inv[branch][vendor][p.name] = { received: 0, sentOut: 0, delivered: 0 };
        inv[branch][vendor][p.name].delivered = (inv[branch][vendor][p.name].delivered || 0) + qty;
      });

      return {
        ...prev,
        inventory: inv,
        orders: prev.orders.map(o =>
          o.id === editModalOrderId
            ? { ...o, ...fields, products: finalProds, status: 'Delivered' }
            : o
        ),
      };
    });
    close();
  }

  return (
    <div className="modal-bg open">
      <div className="modal-box" style={{ padding: 0, display: 'flex', flexDirection: 'column', maxHeight: '92vh' }}>

        {/* Header */}
        <div style={{ padding: '14px 16px 10px', borderBottom: '1.5px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <p className="modal-title" style={{ fontSize: 15, marginBottom: 1 }}>Edit Before Confirming</p>
            <p style={{ fontSize: 11, color: 'var(--t3)' }}>Update details, then confirm</p>
          </div>
          <button className="btn btn-outline btn-sm" onClick={close}>Cancel</button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
          <div className="g2" style={{ gap: 10, marginBottom: 10 }}>
            <div>
              <label style={S.lbl}>Customer Name</label>
              <input style={S.inp} value={fields.customerName} onChange={e => setFields(f => ({ ...f, customerName: e.target.value }))} />
            </div>
            <div>
              <label style={S.lbl}>Phone</label>
              <input style={S.inp} value={fields.phone} onChange={e => setFields(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="span2">
              <label style={S.lbl}>Address</label>
              <input style={S.inp} value={fields.address} onChange={e => setFields(f => ({ ...f, address: e.target.value }))} />
            </div>
          </div>

          <div style={{ height: 1, background: 'var(--border-soft)', margin: '10px 0' }} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <p style={{ fontSize: 12, fontWeight: 600 }}>Products</p>
            <button className="btn btn-outline btn-sm" onClick={addProd}>+ Add Product</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {products.map((p, i) => (
              <div key={p._key} style={{ border: '1.5px solid var(--border)', borderRadius: 10, padding: '10px 12px' }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)', marginBottom: 8 }}>Product {i + 1}</p>
                <div className="g3" style={{ gap: 8 }}>
                  <div>
                    <label style={S.lbl}>Name</label>
                    <input style={S.inp} value={p.name} onChange={e => updateProd(i, 'name', e.target.value)} />
                  </div>
                  <div>
                    <label style={S.lbl}>Price</label>
                    <input style={S.inp} type="number" value={p.price} onChange={e => updateProd(i, 'price', e.target.value)} />
                  </div>
                  <div>
                    <label style={S.lbl}>Qty</label>
                    <input style={S.inp} type="number" value={p.qty} onChange={e => updateProd(i, 'qty', e.target.value)} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sticky confirm button */}
        <div style={{ padding: '10px 16px 14px', borderTop: '1.5px solid var(--border-soft)', flexShrink: 0 }}>
          <button className="btn btn-primary btn-full" onClick={confirmDelivered}>✓ Confirm Delivered</button>
        </div>

      </div>
    </div>
  );
}
