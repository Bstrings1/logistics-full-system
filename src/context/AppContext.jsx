import { createContext, useContext, useState } from 'react';
import { TODAY } from '../utils/helpers';

const AppContext = createContext(null);

const INITIAL_CFG = {
  company: 'LogiOps',
  tagline: 'Built for logistics teams that move fast.',
  currency: '₦',
  branches: ['NORTH', 'SOUTH', 'EAST'],
  vendors: ['VendorAlpha', 'VendorBeta', 'VendorGamma', 'VendorDelta'],
  products: ['Product A', 'Product B', 'Product C', 'Product D', 'Product E', 'Product F', 'Product G'],
  bonusTiers: [{ upTo: 200, rate: 200 }, { upTo: 250, rate: 400 }, { upTo: 300, rate: 500 }, { upTo: Infinity, rate: 700 }],
  customBonus: {},
};

const INITIAL_DB = {
  riders: {
    NORTH: ['Ahmed', 'Blessing', 'Chukwu', 'David', 'Emeka'],
    SOUTH: ['Fatima', 'Grace', 'Hassan', 'Ibrahim', 'James'],
    EAST: ['Kola', 'Lara', 'Musa', 'Ngozi', 'Obinna'],
  },
  orders: [
    { id: 1, branch: 'NORTH', rider: 'Ahmed', customerName: 'Mrs Okonkwo', phone: '08012345678', address: '12 Main St', status: 'Delivered', date: TODAY, products: [{ vendor: 'VendorAlpha', name: 'Product A', qty: 1, price: 15000 }] },
    { id: 2, branch: 'NORTH', rider: 'Blessing', customerName: 'Mr Adeyemi', phone: '08098765432', address: '45 Park Ave', status: 'Delivered', date: TODAY, products: [{ vendor: 'VendorBeta', name: 'Product B', qty: 2, price: 8000 }] },
    { id: 3, branch: 'SOUTH', rider: 'Fatima', customerName: 'Mrs Eze', phone: '07011223344', address: '3 Beach Rd', status: 'Failed', date: TODAY, products: [{ vendor: 'VendorAlpha', name: 'Product C', qty: 1, price: 12000 }] },
    { id: 4, branch: 'NORTH', rider: 'Ahmed', customerName: 'Mr Bello', phone: '09055667788', address: '7 Kings Way', status: 'Pending', date: TODAY, products: [{ vendor: 'VendorGamma', name: 'Product D', qty: 1, price: 9500 }] },
    { id: 5, branch: 'EAST', rider: 'Kola', customerName: 'Mrs Dada', phone: '08133445566', address: '22 Elm St', status: 'Delivered', date: TODAY, products: [{ vendor: 'VendorDelta', name: 'Product E', qty: 3, price: 6000 }] },
    { id: 6, branch: 'SOUTH', rider: 'Grace', customerName: 'Mr Osei', phone: '07099887766', address: '89 River Rd', status: 'Not Delivered', date: TODAY, products: [{ vendor: 'VendorBeta', name: 'Product F', qty: 1, price: 18000 }] },
    { id: 7, branch: 'EAST', rider: 'Lara', customerName: 'Miss Adaora', phone: '08077665544', address: '5 Victoria Cl', status: 'Unassigned', date: TODAY, products: [{ vendor: 'VendorGamma', name: 'Product G', qty: 2, price: 11000 }] },
    { id: 8, branch: 'NORTH', rider: '', customerName: 'Mrs Okonkwo', phone: '08012345678', address: '12 Main St', status: 'Unassigned', date: TODAY, products: [{ vendor: 'VendorAlpha', name: 'Product A', qty: 1, price: 15000 }] },
  ],
  payments: {},
  expenses: [],
  riderExpenses: [],
  remittances: [],
  deliveryFees: {},
  loans: [],
  inventory: {},
  vendorPayments: {},
};

export function AppProvider({ children }) {
  const [cfg, setCfg] = useState(INITIAL_CFG);
  const [db, setDb] = useState(INITIAL_DB);
  const [session, setSession] = useState(null);
  const [period, setPeriod] = useState('today');
  const [rangeFrom, setRangeFrom] = useState('');
  const [rangeTo, setRangeTo] = useState('');
  const [activeTab, setActiveTab] = useState('');
  const [editModalOrderId, setEditModalOrderId] = useState(null);
  const [cfgPanelOpen, setCfgPanelOpen] = useState(false);
  const [vpSelected, setVpSelected] = useState('');

  return (
    <AppContext.Provider value={{
      cfg, setCfg,
      db, setDb,
      session, setSession,
      period, setPeriod,
      rangeFrom, setRangeFrom,
      rangeTo, setRangeTo,
      activeTab, setActiveTab,
      editModalOrderId, setEditModalOrderId,
      cfgPanelOpen, setCfgPanelOpen,
      vpSelected, setVpSelected,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
