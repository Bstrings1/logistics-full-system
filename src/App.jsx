import { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import LoginScreen, { LogoSvg } from './components/LoginScreen';
import { supabase } from './lib/supabase';
import Sidebar from './components/Sidebar';
import EditOrderModal from './components/EditOrderModal';
import BossViews from './views/BossViews';
import ManagerViews from './views/ManagerViews';
import RiderManagerViews from './views/RiderManagerViews';
import VendorViews from './views/VendorViews';
import InventoryViews from './views/InventoryViews';
import DeliveryFeeViews from './views/DeliveryFeeViews';
import AdminPanel from './views/AdminPanel';

function SetPasswordScreen() {
  const { cfg } = useApp();
  const primary = cfg.theme?.primary || '#1a56db';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (password.length < 8) return setError('Password must be at least 8 characters');
    if (password !== confirm) return setError("Passwords don't match");
    setStatus('loading');
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) { setError(err.message); setStatus('idle'); return; }
    await supabase.auth.signOut();
    setStatus('done');
    window.location.hash = '';
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f6f7fb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, justifyContent: 'center' }}>
          <LogoSvg size={32} color={primary} />
          <span style={{ fontWeight: 800, fontSize: 24, letterSpacing: '-0.8px', color: '#0b1230' }}>{cfg.company}</span>
        </div>
        <div style={{ background: '#fff', borderRadius: 24, padding: '32px 32px 28px', boxShadow: '0 8px 40px -12px rgba(42,62,240,0.2)', border: '1px solid rgba(11,18,48,0.04)' }}>
          {status === 'done' ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#dcfce7', display: 'grid', placeItems: 'center', margin: '0 auto 16px', fontSize: 24 }}>✓</div>
              <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700 }}>Password Set!</h2>
              <p style={{ fontSize: 14, color: '#5b6385', margin: '0 0 20px' }}>You can now log in with your Kyne email and new password.</p>
              <a href="/" style={{ display: 'inline-block', padding: '13px 28px', background: `linear-gradient(180deg,${primary},${primary}cc)`, color: '#fff', borderRadius: 12, fontWeight: 700, textDecoration: 'none', fontSize: 15 }}>Go to Login →</a>
            </div>
          ) : (
            <>
              <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: '#0b1230' }}>Set Your Password</h1>
              <p style={{ margin: '0 0 20px', fontSize: 14, color: '#5b6385' }}>Choose a password for your Kyne account.</p>
              {error && <div style={{ background: '#fff0f2', border: '1px solid #fcc', borderRadius: 8, color: '#e0425a', fontSize: 13, fontWeight: 600, padding: '10px 14px', marginBottom: 14 }}>{error}</div>}
              <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#1f2747', display: 'block', marginBottom: 5 }}>New Password</label>
                  <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters"
                    style={{ width: '100%', border: '1.5px solid #d9ddea', borderRadius: 12, padding: '13px 14px', fontSize: 15, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#1f2747', display: 'block', marginBottom: 5 }}>Confirm Password</label>
                  <input type={showPw ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat password"
                    style={{ width: '100%', border: '1.5px solid #d9ddea', borderRadius: 12, padding: '13px 14px', fontSize: 15, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#5b6385', cursor: 'pointer' }}>
                  <input type="checkbox" checked={showPw} onChange={e => setShowPw(e.target.checked)} /> Show passwords
                </label>
                <button type="submit" disabled={status === 'loading'} style={{ height: 52, borderRadius: 14, border: 0, background: `linear-gradient(180deg,${primary},${primary}cc)`, color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit', marginTop: 4, opacity: status === 'loading' ? 0.7 : 1 }}>
                  {status === 'loading' ? 'Setting password…' : 'Set Password →'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const { session, activeTab, cfg, loading, viewAs, setViewAs } = useApp();
  const primary = cfg.theme?.primary || '#1a56db';
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isRecovery, setIsRecovery] = useState(() => window.location.hash.includes('type=recovery'));

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setIsRecovery(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const themeStyle = `:root { --purple: ${primary}; --purple-dk: ${primary}cc; --purple-lt: ${primary}18; --purple-bd: ${primary}55; --sh-blue: 0 6px 24px ${primary}55; }`;

  if (isRecovery) return (
    <>
      <style>{`:root { --purple: ${primary}; }`}</style>
      <SetPasswordScreen />
    </>
  );

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
    if (session.role === 'delivery-fee') return <DeliveryFeeViews />;
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
