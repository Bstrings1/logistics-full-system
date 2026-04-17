import { AppProvider, useApp } from './context/AppContext';
import LoginScreen from './components/LoginScreen';
import Sidebar from './components/Sidebar';
import EditOrderModal from './components/EditOrderModal';
import ConfigPanel from './components/ConfigPanel';
import BossViews from './views/BossViews';
import ManagerViews from './views/ManagerViews';
import RiderManagerViews from './views/RiderManagerViews';
import VendorViews from './views/VendorViews';
import InventoryViews from './views/InventoryViews';

function SvgDefs() {
  return (
    <svg style={{ display: 'none' }}>
      <defs>
        <radialGradient id="g1" cx="70%" cy="20%" r="60%"><stop offset="0%" stopColor="#ff9a6c" stopOpacity=".9"/><stop offset="100%" stopColor="#ff9a6c" stopOpacity="0"/></radialGradient>
        <radialGradient id="g2" cx="90%" cy="50%" r="55%"><stop offset="0%" stopColor="#a855f7" stopOpacity=".8"/><stop offset="100%" stopColor="#a855f7" stopOpacity="0"/></radialGradient>
        <radialGradient id="g3" cx="50%" cy="80%" r="50%"><stop offset="0%" stopColor="#635bff" stopOpacity=".75"/><stop offset="100%" stopColor="#635bff" stopOpacity="0"/></radialGradient>
        <radialGradient id="g4" cx="80%" cy="90%" r="45%"><stop offset="0%" stopColor="#f472b6" stopOpacity=".65"/><stop offset="100%" stopColor="#f472b6" stopOpacity="0"/></radialGradient>
        <radialGradient id="g5" cx="30%" cy="40%" r="50%"><stop offset="0%" stopColor="#93c5fd" stopOpacity=".45"/><stop offset="100%" stopColor="#93c5fd" stopOpacity="0"/></radialGradient>
      </defs>
    </svg>
  );
}

function AppContent() {
  const { session, activeTab, setCfgPanelOpen } = useApp();

  if (!session) return <LoginScreen />;

  function renderContent() {
    if (session.role === 'boss') return <BossViews tabId={activeTab} />;
    if (session.role === 'manager') return <ManagerViews tabId={activeTab} />;
    if (session.role === 'rider-manager') return <RiderManagerViews tabId={activeTab} />;
    if (session.role === 'vendor') return <VendorViews tabId={activeTab} />;
    if (session.role === 'inventory') return <InventoryViews tabId={activeTab} />;
    return null;
  }

  return (
    <div id="app" style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <SvgDefs />
      <div id="cfg-strip">
        <strong>Template Mode</strong>
        <span>— configure for each client before handover</span>
        <button id="cfg-open-btn" onClick={() => setCfgPanelOpen(true)}>Edit Config</button>
      </div>
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 34px)' }}>
        <Sidebar />
        <div
          id="content"
          style={{ flex: 1, minWidth: 0, overflowY: 'auto', maxHeight: 'calc(100vh - 34px)' }}
        >
          <div key={activeTab} className="au">
            {renderContent()}
          </div>
        </div>
      </div>
      <EditOrderModal />
      <ConfigPanel />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
