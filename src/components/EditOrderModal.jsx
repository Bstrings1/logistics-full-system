import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { gp } from '../utils/helpers';

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
    setDb(prev => ({
      ...prev,
      orders: prev.orders.map(o =>
        o.id === editModalOrderId
          ? { ...o, ...fields, products: validProds.length ? validProds : gp(o), status: 'Delivered' }
          : o
      ),
    }));
    close();
  }

  return (
    <div className="modal-bg open">
      <div className="modal-box">
        <div className="row-b mb20">
          <div>
            <p className="modal-title">Edit Before Confirming</p>
            <p className="modal-sub">Update products or details, then confirm</p>
          </div>
          <button className="btn btn-outline btn-sm" onClick={close}>Cancel</button>
        </div>

        <div className="g2 mb12">
          <div>
            <label className="lbl">Customer Name</label>
            <input className="inp" value={fields.customerName} onChange={e => setFields(f => ({ ...f, customerName: e.target.value }))} />
          </div>
          <div>
            <label className="lbl">Phone</label>
            <input className="inp" value={fields.phone} onChange={e => setFields(f => ({ ...f, phone: e.target.value }))} />
          </div>
          <div className="span2">
            <label className="lbl">Address</label>
            <input className="inp" value={fields.address} onChange={e => setFields(f => ({ ...f, address: e.target.value }))} />
          </div>
        </div>
        <div className="divider" />
        <div className="row-b mb10">
          <p style={{ fontSize: 13, fontWeight: 600 }}>Products</p>
          <button className="btn btn-outline btn-sm" onClick={addProd}>+ Add Product</button>
        </div>
        <div className="col mb16">
          {products.map((p, i) => (
            <div key={p._key} className="card card-sm">
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--t3)', marginBottom: 8 }}>Product {i + 1}</p>
              <div className="g3">
                <div>
                  <label className="lbl">Name</label>
                  <input className="inp" value={p.name} onChange={e => updateProd(i, 'name', e.target.value)} />
                </div>
                <div>
                  <label className="lbl">Price</label>
                  <input className="inp" type="number" value={p.price} onChange={e => updateProd(i, 'price', e.target.value)} />
                </div>
                <div>
                  <label className="lbl">Qty</label>
                  <input className="inp" type="number" value={p.qty} onChange={e => updateProd(i, 'qty', e.target.value)} />
                </div>
              </div>
            </div>
          ))}
        </div>
        <button className="btn btn-primary btn-full" onClick={confirmDelivered}>✓ Confirm Delivered</button>
      </div>
    </div>
  );
}
