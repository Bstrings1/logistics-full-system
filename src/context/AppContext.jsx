import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { TODAY } from '../utils/helpers';
import { supabase } from '../lib/supabase';

const AppContext = createContext(null);

export const INITIAL_CFG = {
  company: 'Kyne',
  tagline: 'Your E-commerce Logistics Bro',
  currency: '₦',
  branches: ['AJA', 'IDIMU', 'KETU'],
  vendors: ['LADEX','TOPMO','LASUMAX GROUP','MUMART','EDZU','AKOVIL','VITAL HERB','ZUMA','HORLA','BAZAKI','E-CLAX','SYSTERA','ABBEX','ZAKI','CALLYTUS','TSEIGBESA','JOHNMAX','STYLE','LOLLYTOS','KENDUMA','Madam Gift','KING ROYCE','KYNE-RANDOM','SMART CLEANSER KYNE','CEENO LAGOS','ISYLIFE','GLAMOUR TROVE','SENDJON','Zavina Group','SEFWAY Group','Awoof Mall','BMP Group','NUTRICARE','MIRAC GLOBAL','ADEITAN NETFAIR','HYPERFIT','OPTIMAL HORIZON','29 carat','EDDY','LAGOS BATCH AFROMEDIA','DR MIKE','PAVENA','KYNE LENSTONE','DSP','ZEMA','KIDS MULTIVITAMIN','MEN GUMMIES','ZEGOODIES','LOPGRADE','CHARZZY GROUP','MIRA HEALTH','PROMAX ENTERPRISE','M&B','Temi design','Nail care pen','Mk oil','Fortune'],
  products: {
    'LADEX': ['Jandes','Boshjex','Boshjex pro','Xebenco powder','Propazi'],
    'TOPMO': ['Elipy cap','Elipy balm','Sabbana','HYPERTOP','Vertidem','Topmo cleanser tea','Topmo capsule','Senior cap','Topmo detox','Prosma','Venaba','Tabizo','Charzzy','Elano','Vaniso','Cendez','Sb latein','Suyem','Zavina','Yemit'],
    'LASUMAX GROUP': ['Padosa','TUNFALZ','Kidema oil','Kidema capsule','Lavosa','Lasumax tea','Lasumax cap','Provena capsule','Provena cleanser','Kenzai','Yenita'],
    'MUMART': ['Eye gel','Guava boost','PSORIASIS Cream','5 in 1 facial','Lizard spray','Collagen oil','Foot peeling cream','Stamina pro','Collagen face mask','Retinol antioxidants'],
    'EDZU': ['Davigormax','Davigormax powder','Venature','Yilest','QISE Anti wrinkle','A pack','Shilajit capsule','Retinol lotion','Fyto infection flusher'],
    'AKOVIL': ['Chillflex','PYRU TEA','Slimcore','Cendez cleanser','Joint & bone','Wart removal','Beevenom','Beevana','Bhamiza TEA','Dim Capsule','Dim tea','VIMEX tea'],
    'VITAL HERB': ['Hermona Tea','Laxira','Calmira','Liver tea','Loriven capsule'],
    'ZUMA': ['Perfect X','Loovita','SAAM','Ziphra capsule','Ziphra Tea','Kozep tea'],
    'HORLA': ['Pomegranate','Fenugreek','Diabetic foot cream','Diabilin','Okokoriko'],
    'BAZAKI': ['Ginseng capsule','Ginseng Root tea','Chancaflow','Deos','Maca ginseng'],
    'E-CLAX': ['SAAM Renewal face cream','Utogru Teeth whitening','Bright toothpaste'],
    'SYSTERA': ['Snake venom','SAAM Renewal face cream'],
    'ABBEX': ['Yoxier scar cream','Maycheer purifying gel','Basil deep mask'],
    'ZAKI': ['Beevenom'],
    'CALLYTUS': ['Biotin and collagen','Nada plus'],
    'TSEIGBESA': ['Beevana'],
    'JOHNMAX': ['Herbal bone ointment','Maxman'],
    'STYLE': ['Mag black','Mag gold','Vintage black','Vintage red','Chenxi','Oulm','Fusili silver','Fusili gold','Bos design','Mag leather'],
    'LOLLYTOS': ['Small portable juicer','Electronic lunch box','Electric mug','Pulse massager','Wheel roller','Fruit press','Toothbrush sterilizer','Solar camp light','Juicing cup','Leakage fix tape','Rechargeable juice','Mini flask','Mini massager','Blue tape'],
    'KENDUMA': ['Pet collar','Pet spray','Pet Insect repellant'],
    'Madam Gift': ['Building block','Magnetic drawing board','Finger Arithmetic','Bubble gun'],
    'KING ROYCE': ['Reachable car charger','Single car charger','5in1 car charger','Executive bag','Handbag','Crossbag'],
    'KYNE-RANDOM': ['Random energy capsule'],
    'SMART CLEANSER KYNE': ['Smart Cleanser','Sanora capsule','Sanora balm','Verticure'],
    'CEENO LAGOS': ['Nano tapes','Turmeric soaps','Pink lip serum','Shilajit gummies','Brown flower wallpaper','Green flower wallpaper','IMAX SPRAY','Boka toothpaste','Lunavia pen','Fenugreek seed tea'],
    'ISYLIFE': ['Richard mille','Cctv','INVICTA','Lamborghini','Smart watch','Daniel Wellington','Bvlgart watch','Nepic watch'],
    'GLAMOUR TROVE': ['Kids multivitamin'],
    'SENDJON': ['Renewal face cream','Repair Scar cream','Body cream','Acne Serum','Eye cream','Advanced Daily SAAM','Facial cleanser','Micellar water','Cotton pad','Eyebrow','Primeman potency','Primeman booster'],
    'Zavina Group': ['Zavina tea','Veritol cap','Vetra tea','Gotura capsule'],
    'SEFWAY Group': ['Sefway Herbal'],
    'Awoof Mall': ['Wireless Mic','Sx8mic','Ultrapod PRO','Sx31mic','Wireless hand held'],
    'BMP Group': ['Lenstone Herbal'],
    'NUTRICARE': ['Beyond the like','Beyond the likes','Not just a girl','Stroke fighter','Fresh breath','Good breath','Asthma fighter','Ultimate stroke fighter','Diabetes ultra'],
    'MIRAC GLOBAL': ['Liver restore','Sperm revive capsule','Infection flusher','Hepafix','Infection crusher','Hepaflush'],
    'ADEITAN NETFAIR': ['Cucumber oil','Liver restore','Liver cur','Asthmacur','Lung cleanser','Infection flusher','Infection crusher','Ivision capsule','Eye cleanser tea','Detox tea','Ovucare tea','Fertility plus','Sleep cur','Knacker boost','Knacker capsule','Firm fix','Cemenplus','Sperm revive','Alpha man capsule','Alpha man syrup','Knacker plus','Fibguard','Fibroid flush','Prostaflush','Immune booster','Fibroid cur','Fertile cur','Prostaclen','Pile fix','Liver purifier','Liver forte','Fibroid cure','Florawet','Hi vision tea'],
    'HYPERFIT': ['Egg cracker','Pepper spray','Combat pouch'],
    'OPTIMAL HORIZON': ['Natural erect','Strike hard'],
    '29 carat': ['OLEVS wristwatch'],
    'EDDY': ['Soursoup','Sealant spray','Mosquito swatter','Aloe vera gel','Sleep mask','Wall mending ointment'],
    'LAGOS BATCH AFROMEDIA': ['Erabab capsule','Hamachin tea','Hamachin capsule'],
    'DR MIKE': ['Sureza capsule','Sureza','Fayamax cleanser','Fayamax capsule','Fayamax oil','Fayamax tea','Hyperform capsule','Hyperfom capsule','Hyperform tea','Hyperfom tea'],
    'PAVENA': ['Retinol Serum','Retinol Cream','Vitamin C Soap','Salicylic Soap','Niacinamide Soap','Vibrant Sunscreen','Estlein Sunscreen','Retinol Eye cream','Cayman Eye cream','Collagen Eye Mask','Retinol Mask','Crystal eye mask','Head massage gun'],
    'KYNE LENSTONE': ['Lenstone capsule'],
    'DSP': ['Snore Spray','Mask','Nylon','Batana oil','Batana Cream','Front Hair & scalp','Eelhoe vitamin c'],
    'ZEMA': ['Orange exfoliating gel','BEEVENOM comprehensive cream'],
    'KIDS MULTIVITAMIN': ['Kids multivitamin gummies'],
    'MEN GUMMIES': ['Men power gummies'],
    'ZEGOODIES': ['Big solar lamp','Small solar lamp','Green flat tummy gummies','Red flat tummy gummies','Apple Cider gummies','Keto Active gummies'],
    'LOPGRADE': ['Yoxier scar repair cream'],
    'CHARZZY GROUP': ['Gotura','Latein capsule','Charzzy capsule'],
    'MIRA HEALTH': ['Hernia removal','Pure MORINGA TEA','Natural pain killer'],
    'PROMAX ENTERPRISE': ['Promax syrup','Promax oil','Mardes cap'],
    'M&B': ['Repair scar cream'],
    'Temi design': ['School bag','Water bottle'],
    'Nail care pen': ['Nail care pen'],
    'Mk oil': ['Mk oil'],
    'Fortune': ['Ginger serum'],
  },
  bonusTiers: [{ upTo: 200, rate: 200 }, { upTo: 250, rate: 400 }, { upTo: 300, rate: 500 }, { upTo: Infinity, rate: 700 }],
  customBonus: {},
  logo: null,
  theme: { primary: '#1a56db' },
  credentials: {
    admin: { username: 'Bstrings', password: '503320' },
  },
};

const EMPTY_DB = {
  riders: {},
  orders: [],
  payments: {},
  expenses: [],
  riderExpenses: [],
  remittances: [],
  deliveryFees: {},
  loans: [],
  inventory: {},
  vendorPayments: {},
  inventoryHistory: [],
};

function serializeCfg(cfg) {
  return {
    ...cfg,
    bonusTiers: cfg.bonusTiers.map(t => ({ ...t, upTo: t.upTo === Infinity ? null : t.upTo })),
  };
}

function deserializeCfg(data) {
  return {
    ...INITIAL_CFG,
    ...data,
    credentials: {
      ...INITIAL_CFG.credentials,
      ...(data.credentials || {}),
    },
    products: Array.isArray(data.products) ? INITIAL_CFG.products : (data.products || INITIAL_CFG.products),
    bonusTiers: (data.bonusTiers || INITIAL_CFG.bonusTiers).map(t => ({
      ...t, upTo: t.upTo === null ? Infinity : t.upTo,
    })),
  };
}

function rowsToDb({ orders = [], riders = [], payments = [], expenses = [],
  riderExpenses = [], remittances = [], deliveryFees = [], loans = [],
  inventory = [], vendorPayments = [], inventoryHistory = [] }) {

  const ridersObj = {};
  riders.forEach(r => { (ridersObj[r.branch] = ridersObj[r.branch] || []).push(r.name); });

  const paymentsObj = {};
  payments.forEach(p => {
    paymentsObj[p.key] = {
      branch: p.branch, rider: p.rider, date: p.date,
      cash: p.cash, pos: p.pos, riderGift: p.rider_gift,
      expected: p.expected, shortfall: p.shortfall, cleared: p.cleared,
    };
  });

  const deliveryFeesObj = {};
  deliveryFees.forEach(f => { deliveryFeesObj[f.order_id] = f.fee; });

  const inventoryObj = {};
  inventory.forEach(i => {
    const br = i.branch || 'IDIMU';
    if (!inventoryObj[br]) inventoryObj[br] = {};
    if (!inventoryObj[br][i.vendor]) inventoryObj[br][i.vendor] = {};
    inventoryObj[br][i.vendor][i.product] = { received: i.received || 0, sentOut: i.sent_out || 0, delivered: i.delivered || 0 };
  });

  const vendorPaymentsObj = {};
  vendorPayments.forEach(p => {
    (vendorPaymentsObj[p.vendor] = vendorPaymentsObj[p.vendor] || []).push(
      { id: p.id, amount: p.amount, bank: p.bank, txID: p.tx_id, date: p.date }
    );
  });

  return {
    orders: orders.map(o => ({
      id: o.id, branch: o.branch, rider: o.rider,
      customerName: o.customer_name, phone: o.phone, address: o.address,
      status: o.status, date: o.date, products: o.products || [],
      paidAmount: o.paid_amount !== undefined ? o.paid_amount : undefined,
    })),
    riders: ridersObj,
    payments: paymentsObj,
    expenses: expenses.map(e => ({ id: e.id, branch: e.branch, desc: e.description, cat: e.cat, amount: e.amount, date: e.date })),
    riderExpenses: riderExpenses.map(e => ({ id: e.id, branch: e.branch, rider: e.rider, amount: e.amount, desc: e.description, date: e.date })),
    remittances: remittances.map(r => ({ id: r.id, branch: r.branch, amount: r.amount, txID: r.tx_id, date: r.date, bank: r.bank, account: r.account, verified: r.verified || false })),
    deliveryFees: deliveryFeesObj,
    loans: loans.map(l => ({ id: l.id, staff: l.staff, amount: l.amount, salary: l.salary, date: l.date, repayments: l.repayments || [] })),
    inventory: inventoryObj,
    vendorPayments: vendorPaymentsObj,
    inventoryHistory: inventoryHistory.map(h => ({
      id: h.id, type: h.type, fromBranch: h.from_branch, toBranch: h.to_branch,
      vendor: h.vendor, product: h.product, qty: h.qty, date: h.date, note: h.note,
    })),
  };
}

async function syncChanges(prev, next) {
  const ops = [];

  if (prev.orders !== next.orders) {
    const prevMap = new Map(prev.orders.map(o => [o.id, JSON.stringify(o)]));
    const nextSet = new Set(next.orders.map(o => o.id));
    const toUpsert = next.orders.filter(o => prevMap.get(o.id) !== JSON.stringify(o));
    const toDelete = prev.orders.filter(o => !nextSet.has(o.id)).map(o => o.id);
    if (toUpsert.length) {
      ops.push(supabase.from('orders').upsert(toUpsert.map(o => ({
        id: o.id, branch: o.branch, rider: o.rider,
        customer_name: o.customerName, phone: o.phone, address: o.address,
        status: o.status, date: o.date, products: o.products,
        paid_amount: o.paidAmount !== undefined ? o.paidAmount : null,
      }))));
    }
    if (toDelete.length) {
      ops.push(supabase.from('orders').delete().in('id', toDelete));
    }
  }

  if (prev.payments !== next.payments) {
    const changed = Object.entries(next.payments).filter(([k, v]) =>
      JSON.stringify(prev.payments[k]) !== JSON.stringify(v)
    );
    if (changed.length) {
      ops.push(supabase.from('payments').upsert(changed.map(([key, p]) => ({
        key, branch: p.branch, rider: p.rider, date: p.date,
        cash: p.cash, pos: p.pos, rider_gift: p.riderGift,
        expected: p.expected, shortfall: p.shortfall, cleared: p.cleared,
      }))));
    }
  }

  if (prev.expenses !== next.expenses) {
    const prevIds = new Set(prev.expenses.map(e => e.id));
    const toInsert = next.expenses.filter(e => !prevIds.has(e.id));
    if (toInsert.length) {
      ops.push(supabase.from('expenses').insert(toInsert.map(e => ({
        id: e.id, branch: e.branch, description: e.desc, cat: e.cat, amount: e.amount, date: e.date,
      }))));
    }
  }

  if (prev.riderExpenses !== next.riderExpenses) {
    const prevIds = new Set(prev.riderExpenses.map(e => e.id));
    const toInsert = next.riderExpenses.filter(e => !prevIds.has(e.id));
    if (toInsert.length) {
      ops.push(supabase.from('rider_expenses').insert(toInsert.map(e => ({
        id: e.id, branch: e.branch, rider: e.rider, amount: e.amount, description: e.desc, date: e.date,
      }))));
    }
  }

  if (prev.remittances !== next.remittances) {
    const prevMap = new Map(prev.remittances.map(r => [r.id, JSON.stringify(r)]));
    const nextSet = new Set(next.remittances.map(r => r.id));
    const toUpsert = next.remittances.filter(r => prevMap.get(r.id) !== JSON.stringify(r));
    const toDelete = prev.remittances.filter(r => !nextSet.has(r.id)).map(r => r.id);
    if (toUpsert.length) {
      ops.push(supabase.from('remittances').upsert(toUpsert.map(r => ({
        id: r.id, branch: r.branch, amount: r.amount, tx_id: r.txID, date: r.date,
        bank: r.bank, account: r.account, verified: r.verified || false,
      }))));
    }
    if (toDelete.length) {
      ops.push(supabase.from('remittances').delete().in('id', toDelete));
    }
  }

  if (prev.deliveryFees !== next.deliveryFees) {
    const toUpsert = Object.entries(next.deliveryFees).filter(([k, v]) => prev.deliveryFees[k] !== v);
    if (toUpsert.length) {
      ops.push(supabase.from('delivery_fees').upsert(toUpsert.map(([order_id, fee]) => ({ order_id: Number(order_id), fee }))));
    }
  }

  if (prev.loans !== next.loans) {
    const prevMap = new Map(prev.loans.map(l => [l.id, JSON.stringify(l)]));
    const toUpsert = next.loans.filter(l => prevMap.get(l.id) !== JSON.stringify(l));
    if (toUpsert.length) {
      ops.push(supabase.from('loans').upsert(toUpsert.map(l => ({
        id: l.id, staff: l.staff, amount: l.amount, salary: l.salary, date: l.date, repayments: l.repayments,
      }))));
    }
  }

  if (prev.inventory !== next.inventory) {
    const rows = [];
    Object.entries(next.inventory).forEach(([branch, vendors]) => {
      Object.entries(vendors).forEach(([vendor, products]) => {
        Object.entries(products).forEach(([product, vals]) => {
          const p = prev.inventory[branch]?.[vendor]?.[product];
          if (!p || p.received !== vals.received || p.sentOut !== vals.sentOut || p.delivered !== vals.delivered) {
            rows.push({ branch, vendor, product, received: vals.received || 0, sent_out: vals.sentOut || 0, delivered: vals.delivered || 0 });
          }
        });
      });
    });
    if (rows.length) ops.push(supabase.from('inventory').upsert(rows, { onConflict: 'branch,vendor,product' }));
  }

  if (prev.vendorPayments !== next.vendorPayments) {
    const prevIds = new Set(Object.values(prev.vendorPayments).flat().map(p => p.id));
    const toInsert = [];
    Object.entries(next.vendorPayments).forEach(([vendor, pmts]) => {
      pmts.forEach(p => {
        if (!prevIds.has(p.id)) toInsert.push({ id: p.id, vendor, amount: p.amount, bank: p.bank, tx_id: p.txID, date: p.date });
      });
    });
    if (toInsert.length) ops.push(supabase.from('vendor_payments').insert(toInsert));
  }

  if (prev.inventoryHistory !== next.inventoryHistory) {
    const prevIds = new Set(prev.inventoryHistory.map(h => h.id));
    const toInsert = next.inventoryHistory.filter(h => !prevIds.has(h.id));
    if (toInsert.length) {
      ops.push(supabase.from('inventory_history').insert(toInsert.map(h => ({
        id: h.id, type: h.type, from_branch: h.fromBranch || null, to_branch: h.toBranch || null,
        vendor: h.vendor, product: h.product, qty: h.qty, date: h.date, note: h.note || null,
      }))));
    }
  }

  if (prev.riders !== next.riders) {
    const prevFlat = Object.entries(prev.riders).flatMap(([b, ns]) => ns.map(n => ({ branch: b, name: n })));
    const nextSet = new Set(Object.entries(next.riders).flatMap(([b, ns]) => ns.map(n => `${b}::${n}`)));
    const prevSet = new Set(prevFlat.map(r => `${r.branch}::${r.name}`));

    const toDelete = prevFlat.filter(r => !nextSet.has(`${r.branch}::${r.name}`));
    for (const r of toDelete) {
      ops.push(supabase.from('riders').delete().eq('branch', r.branch).eq('name', r.name));
    }

    const toUpsert = Object.entries(next.riders)
      .flatMap(([b, ns]) => ns.map(n => ({ branch: b, name: n })))
      .filter(r => !prevSet.has(`${r.branch}::${r.name}`));
    if (toUpsert.length) ops.push(supabase.from('riders').upsert(toUpsert));
  }

  await Promise.all(ops);
}

export function AppProvider({ children }) {
  const [cfg, setCfgState] = useState(INITIAL_CFG);
  const [db, setDbState] = useState(EMPTY_DB);
  const [session, setSession] = useState(null);
  const [viewAs, setViewAsState] = useState(null);
  const [period, setPeriod] = useState('today');
  const [rangeFrom, setRangeFrom] = useState('');
  const [rangeTo, setRangeTo] = useState('');
  const [activeTab, setActiveTab] = useState('');
  const [editModalOrderId, setEditModalOrderId] = useState(null);
  const [cfgPanelOpen, setCfgPanelOpen] = useState(false);
  const [vpSelected, setVpSelected] = useState('');
  const [loading, setLoading] = useState(true);

  const prevDbRef = useRef(EMPTY_DB);
  const loadedRef = useRef(false);

  useEffect(() => {
    async function load() {
      const [
        { data: orders }, { data: riders }, { data: payments },
        { data: expenses }, { data: riderExpenses }, { data: remittances },
        { data: deliveryFees }, { data: loans }, { data: inventory },
        { data: vendorPayments }, { data: inventoryHistory }, { data: configRow },
      ] = await Promise.all([
        supabase.from('orders').select('*'),
        supabase.from('riders').select('*'),
        supabase.from('payments').select('*'),
        supabase.from('expenses').select('*'),
        supabase.from('rider_expenses').select('*'),
        supabase.from('remittances').select('*'),
        supabase.from('delivery_fees').select('*'),
        supabase.from('loans').select('*'),
        supabase.from('inventory').select('*'),
        supabase.from('vendor_payments').select('*'),
        supabase.from('inventory_history').select('*'),
        supabase.from('config').select('*').eq('id', 1).maybeSingle(),
      ]);

      const appDb = rowsToDb({ orders, riders, payments, expenses, riderExpenses, remittances, deliveryFees, loans, inventory, vendorPayments, inventoryHistory: inventoryHistory || [] });
      prevDbRef.current = appDb;
      setDbState(appDb);
      if (configRow?.data) setCfgState(deserializeCfg(configRow.data));
      loadedRef.current = true;
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (!loadedRef.current) return;
    syncChanges(prevDbRef.current, db).catch(e => console.error('DB sync error:', e));
    prevDbRef.current = db;
  }, [db]);

  useEffect(() => {
    if (!loadedRef.current) return;
    supabase.from('config')
      .upsert({ id: 1, data: serializeCfg(cfg) })
      .then(({ error }) => { if (error) console.error('Config save error:', error); });
  }, [cfg]);

  function setDb(updater) {
    setDbState(prev => typeof updater === 'function' ? updater(prev) : updater);
  }

  function setCfg(updater) {
    setCfgState(prev => typeof updater === 'function' ? updater(prev) : updater);
  }

  function setViewAs(v) {
    setViewAsState(v);
    setActiveTab('');
  }

  return (
    <AppContext.Provider value={{
      cfg, setCfg,
      db, setDb,
      session: viewAs || session, setSession,
      viewAs, setViewAs,
      period, setPeriod,
      rangeFrom, setRangeFrom,
      rangeTo, setRangeTo,
      activeTab, setActiveTab,
      editModalOrderId, setEditModalOrderId,
      cfgPanelOpen, setCfgPanelOpen,
      vpSelected, setVpSelected,
      loading,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
