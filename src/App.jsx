import { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import LoginScreen, { LogoSvg } from './components/LoginScreen';
import Sidebar from './components/Sidebar';
import EditOrderModal from './components/EditOrderModal';
import BossViews from './views/BossViews';
import ManagerViews from './views/ManagerViews';
import RiderManagerViews from './views/RiderManagerViews';
import VendorViews from './views/VendorViews';
import InventoryViews from './views/InventoryViews';
import AdminPanel from './views/AdminPanel';

function AppContent() {
  const { session, activeTab, cfg, loading, viewAs, setViewAs } = useApp();
  const primary = cfg.theme?.primary || '#1a56db';
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const themeStyle = `:root { --purple: ${primary}; --purple-dk: ${primary}cc; --purple-lt: ${primary}18; --purple-bd: ${primary}55; --sh-blue: 0 6px 24px ${primary}55; }`;

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 14, background: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <LogoSvg size={32} color={primary} />
        <span style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-.05em', color: primary }}>{cfg.company}</span>
      </div>
      <div style={{ width: 32, height: 32, border: `3px solid ${primary}22`, borderTopColor: primary, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!session) return (
    <>
      <style>{themeStyle}</style>
      <LoginScreen />
    </>
  );

  if (session.role === 'admin' && !viewAs) return (
    <>
      <style>{themeStyle}</style>
      <AdminPanel />
    </>
  );

  function renderContent() {
    if (session.role === 'boss') return <BossViews tabId={activeTab} />;
    if (session.role === 'manager') return <ManagerViews tabId={activeTab} />;
    if (session.role === 'rider-manager') return <RiderManagerViews tabId={activeTab} />;
    if (session.role === 'vendor') return <VendorViews tabId={activeTab} />;
    if (session.role === 'inventory') return <InventoryViews tabId={activeTab} />;
    if (session.role === 'inventory-admin') return <InventoryViews tabId={activeTab} />;
    return null;
  }

  return (
    <>
      <style>{themeStyle}</style>
      {viewAs && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999, background: '#0f172a', color: 'white', padding: '0 20px', height: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
          <span>👁 Previewing as <strong>{viewAs.display}</strong>{viewAs.branch ? ` · ${viewAs.branch}` : ''} <span style={{ color: 'rgba(255,255,255,.5)', fontSize: 11 }}>({viewAs.role})</span></span>
          <button onClick={() => setViewAs(null)} style={{ background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.25)', color: 'white', borderRadius: 6, padding: '3px 12px', fontSize: 12, cursor: 'pointer' }}>← Exit Preview</button>
        </div>
      )}
      <div id="app" style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: viewAs ? 40 : 0 }}>
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          {/* Mobile overlay */}
          {sidebarOpen && (
            <div className="sb-overlay" onClick={() => setSidebarOpen(false)} />
          )}

          <Sidebar
            sidebarOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />

          <div id="content" style={{ flex: 1, minWidth: 0, overflowY: 'auto', maxHeight: '100vh' }}>
            {/* Mobile top bar */}
            <div className="mobile-topbar">
              <button className="hamburger" onClick={() => setSidebarOpen(true)}>☰</button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <LogoSvg size={20} color={primary} />
                <span style={{ fontSize: 16, fontWeight: 900, letterSpacing: '-.04em', color: primary }}>{cfg.company}</span>
              </div>
            </div>

            <div key={activeTab} className="au">
              {renderContent()}
            </div>
          </div>
        </div>
        <EditOrderModal />
      </div>
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
