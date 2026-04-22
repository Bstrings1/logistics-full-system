export const TODAY = (() => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
})();

export const YESTERDAY = (() => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
})();

export const REVENUE_STATUSES = ['Delivered', 'Completed', 'Replaced'];

export function fmt(n, currency = '₦') {
  return currency + Number(n || 0).toLocaleString();
}

export function avColors(name) {
  const p = [
    ['#e0e7ff','#4338ca'],['#dcfce7','#166534'],['#fef9c3','#854d0e'],
    ['#fee2e2','#991b1b'],['#fce7f3','#9d174d'],['#e0f2fe','#075985'],
  ];
  return p[name.charCodeAt(0) % p.length];
}

export function gp(o) {
  if (!o.products) return [];
  if (typeof o.products === 'string') { try { return JSON.parse(o.products); } catch { return []; } }
  return o.products;
}

export function ot(o) {
  if (o.paidAmount !== undefined && o.paidAmount !== null) return Number(o.paidAmount);
  return gp(o).reduce((s, p) => s + (Number(p.price) || 0), 0);
}

export function otFull(o) {
  return gp(o).reduce((s, p) => s + (Number(p.price) || 0), 0);
}

export function bonusRate(n, name, cfg) {
  if (cfg.customBonus[name] !== undefined) return cfg.customBonus[name];
  for (const t of cfg.bonusTiers) { if (n <= t.upTo) return t.rate; }
  return 0;
}

export function calcBonus(n, name, cfg) {
  return n * bonusRate(n, name, cfg);
}

export function getBonusCycleOrders(rider, db) {
  const now = new Date();
  const d = now.getDate();
  const cycleStart = new Date(now.getFullYear(), now.getMonth() + (d < 14 ? -1 : 0), 14);
  const cycleEnd = new Date(cycleStart.getFullYear(), cycleStart.getMonth() + 1, 15);
  return db.orders.filter(o =>
    o.rider === rider && REVENUE_STATUSES.includes(o.status) &&
    new Date(o.date) >= cycleStart && new Date(o.date) <= cycleEnd
  );
}

export function getDups(orders) {
  const dups = new Set();
  for (let i = 0; i < orders.length; i++) {
    for (let j = i + 1; j < orders.length; j++) {
      const a = orders[i], b = orders[j];
      if (
        (a.phone && b.phone && a.phone === b.phone) ||
        (a.customerName.trim().toLowerCase() === b.customerName.trim().toLowerCase() &&
         a.address.trim().toLowerCase() === b.address.trim().toLowerCase())
      ) { dups.add(a.id); dups.add(b.id); }
    }
  }
  return dups;
}

export function filterPeriod(list, period, rangeFrom, rangeTo) {
  if (period === 'yesterday') return list.filter(o => o.date === YESTERDAY);
  if (period === 'today') return list.filter(o => o.date === TODAY);
  if (period === 'week') {
    const d = new Date(), dow = d.getDay();
    const mon = new Date(d);
    mon.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
    const dates = Array.from({ length: 7 }, (_, i) => {
      const dd = new Date(mon);
      dd.setDate(mon.getDate() + i);
      return `${dd.getFullYear()}-${String(dd.getMonth()+1).padStart(2,'0')}-${String(dd.getDate()).padStart(2,'0')}`;
    });
    return list.filter(o => dates.includes(o.date));
  }
  if (period === 'month') return list.filter(o => o.date && o.date.startsWith(TODAY.slice(0, 7)));
  if (period === 'range' && rangeFrom && rangeTo) return list.filter(o => o.date && o.date >= rangeFrom && o.date <= rangeTo);
  return list;
}

export function buildUsers(cfg) {
  const creds = cfg.credentials || {};
  const u = [{
    username: 'boss',
    password: creds.boss ?? 'boss@2025',
    role: 'boss', branch: null, display: 'Boss / CEO',
  }];
  cfg.branches.forEach(b => {
    const bl = b.toLowerCase();
    u.push({ username: `${bl}_manager`, password: creds[`manager-${b}`] ?? `${bl}mgr2025`, role: 'manager', branch: b, display: `${b} Manager` });
    u.push({ username: `${bl}_rider`, password: creds[`rider-${b}`] ?? `${bl}rider2025`, role: 'rider-manager', branch: b, display: `${b} Rider Mgr` });
    u.push({ username: `${bl}_inv`, password: creds[`inventory-${b}`] ?? `${bl}inv2025`, role: 'inventory', branch: b, display: `${b} Inventory` });
  });
  u.push({ username: 'inv_admin', password: creds['inventory-admin'] ?? 'invaadmin2025', role: 'inventory-admin', branch: null, display: 'Inventory Admin' });
  cfg.vendors.forEach(v => {
    const vl = v.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    u.push({ username: `vendor_${vl}`, password: creds[`vendor-${v}`] ?? 'vendor_2025', role: 'vendor', vendorName: v, display: v });
  });
  return u;
}

export const ICONS = {
  overview: '◈', branches: '⊞', orders: '≡', riders: '◎', remittances: '⇄',
  'vendor-pay': '⊕', inventory: '▦', tools: '⚙', remittance: '⇄', send: '↑',
  expenses: '⊟', log: '＋', assign: '↗', update: '✎', 'my-riders': '◎',
  deliveries: '◉', invoice: '□', stock: '▦', 'waybill-in': '↓', 'waybill-out': '↑', transfer: '⇌', 'inv-history': '◷',
};

export function getTabs(role) {
  if (role === 'boss') return [
    { id: 'overview', l: 'Overview' }, { id: 'branches', l: 'Branches' }, { id: 'orders', l: 'Orders' },
    { id: 'riders', l: 'Riders' }, { id: 'remittances', l: 'Remittances' },
    { id: 'vendor-pay', l: 'Vendor Payments' }, { id: 'inventory', l: 'Inventory' }, { id: 'tools', l: 'CEO Tools' },
  ];
  if (role === 'manager') return [
    { id: 'remittance', l: 'Remittance' }, { id: 'send', l: 'Send to Boss' }, { id: 'expenses', l: 'Expenses' }, { id: 'riders', l: 'Riders' },
  ];
  if (role === 'rider-manager') return [
    { id: 'log', l: 'Log Orders' }, { id: 'assign', l: 'Assign' }, { id: 'update', l: 'Update' }, { id: 'my-riders', l: 'My Riders' },
  ];
  if (role === 'vendor') return [{ id: 'deliveries', l: 'Deliveries' }, { id: 'invoice', l: 'Invoice' }];
  if (role === 'inventory') return [{ id: 'stock', l: 'Stock' }];
  if (role === 'inventory-admin') return [
    { id: 'stock', l: 'Stock' }, { id: 'waybill-in', l: 'Waybill In' }, { id: 'waybill-out', l: 'Waybill Out' }, { id: 'transfer', l: 'Transfer' }, { id: 'inv-history', l: 'History' },
  ];
  return [];
}

export function statusBadgeType(s) {
  return {
    Delivered: 'green', Completed: 'green',
    Failed: 'red', Replaced: 'amber', Cancelled: 'red',
    Pending: 'amber', 'Not Delivered': 'gray', Unassigned: 'amber',
  }[s] || 'gray';
}

export function branchCalc(b, cfg, db, filterP) {
  const fo = filterP(db.orders.filter(o => o.branch === b && REVENUE_STATUSES.includes(o.status)));
  const pays = Object.values(db.payments).filter(p => p.branch === b);
  const cash = pays.reduce((s, p) => s + (p.cash || 0), 0);
  const pos = pays.reduce((s, p) => s + (p.pos || 0), 0);
  const exp = filterP(db.expenses.filter(e => e.branch === b)).reduce((s, e) => s + e.amount, 0);
  const netExpected = Math.max(0, cash - exp);
  const sent = filterP(db.remittances.filter(r => r.branch === b)).reduce((s, r) => s + r.amount, 0);
  const stillToSend = Math.max(0, netExpected - sent);
  const shortfall = pays.reduce((s, p) => s + (p.shortfall || 0), 0);
  const ordersVal = fo.reduce((s, o) => s + ot(o), 0);
  const riders = db.riders[b] || [];
  const bonus = riders.reduce((s, n) => s + calcBonus(getBonusCycleOrders(n, db).length, n, cfg), 0);
  const total = filterP(db.orders.filter(o => o.branch === b)).length;
  const delivered = fo.length;
  return { cash, pos, exp, netExpected, sent, stillToSend, shortfall, ordersVal, bonus, riders, total, delivered };
}
