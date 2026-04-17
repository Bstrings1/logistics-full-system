import { useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { buildUsers, getTabs } from '../utils/helpers';

export default function LoginScreen() {
  const { cfg, setSession, setActiveTab } = useApp();
  const userRef = useRef();
  const passRef = useRef();
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const demoUsers = buildUsers(cfg).slice(0, 6);

  function doLogin() {
    const user = userRef.current.value.trim().toLowerCase();
    const pass = passRef.current.value;
    const found = buildUsers(cfg).find(u => u.username.toLowerCase() === user && u.password === pass);
    if (!found) {
      setError('Incorrect credentials.');
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }
    setError('');
    setSession(found);
    const tabs = getTabs(found.role);
    if (tabs.length) setActiveTab(tabs[0].id);
  }

  function handleKey(e) {
    if (e.key === 'Enter') doLogin();
  }

  return (
    <div id="login-screen">
      <div className="login-mesh">
        <svg viewBox="0 0 800 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
          <defs>
            <radialGradient id="lg1" cx="70%" cy="20%" r="60%"><stop offset="0%" stopColor="#ff9a6c" stopOpacity=".9"/><stop offset="100%" stopColor="#ff9a6c" stopOpacity="0"/></radialGradient>
            <radialGradient id="lg2" cx="90%" cy="50%" r="55%"><stop offset="0%" stopColor="#a855f7" stopOpacity=".8"/><stop offset="100%" stopColor="#a855f7" stopOpacity="0"/></radialGradient>
            <radialGradient id="lg3" cx="50%" cy="80%" r="50%"><stop offset="0%" stopColor="#635bff" stopOpacity=".75"/><stop offset="100%" stopColor="#635bff" stopOpacity="0"/></radialGradient>
            <radialGradient id="lg4" cx="80%" cy="90%" r="45%"><stop offset="0%" stopColor="#f472b6" stopOpacity=".65"/><stop offset="100%" stopColor="#f472b6" stopOpacity="0"/></radialGradient>
            <radialGradient id="lg5" cx="30%" cy="40%" r="50%"><stop offset="0%" stopColor="#93c5fd" stopOpacity=".45"/><stop offset="100%" stopColor="#93c5fd" stopOpacity="0"/></radialGradient>
          </defs>
          <rect width="800" height="900" fill="#fff"/>
          <ellipse cx="580" cy="180" rx="380" ry="320" fill="url(#lg1)" opacity=".85"/>
          <ellipse cx="700" cy="450" rx="300" ry="380" fill="url(#lg2)" opacity=".9"/>
          <ellipse cx="500" cy="700" rx="340" ry="280" fill="url(#lg3)" opacity=".8"/>
          <ellipse cx="720" cy="750" rx="250" ry="220" fill="url(#lg4)" opacity=".75"/>
          <ellipse cx="400" cy="350" rx="280" ry="240" fill="url(#lg5)" opacity=".6"/>
        </svg>
      </div>
      <div className="login-content au">
        <div className="row mb8" style={{ gap: 10, marginBottom: 22 }}>
          <div style={{ width: 32, height: 32, background: 'var(--purple)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LogoSvg size={18} />
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-.02em' }}>{cfg.company}</span>
        </div>
        <p className="login-eyebrow">Operations Portal</p>
        <h1 className="login-h">Sign in to<br/>your account</h1>
        <p className="login-sub">{cfg.tagline}</p>
        <div className={`login-card${shake ? ' shake' : ''}`}>
          {error && <div className="login-err">{error}</div>}
          <div className="mb12">
            <label className="lbl">Username</label>
            <input ref={userRef} className="inp" placeholder="e.g. north_manager" onKeyDown={handleKey} />
          </div>
          <div className="mb16">
            <label className="lbl">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                ref={passRef}
                className="inp"
                type={showPw ? 'text' : 'password'}
                placeholder="Your password"
                style={{ paddingRight: 52 }}
                onKeyDown={handleKey}
              />
              <button
                onClick={() => setShowPw(v => !v)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', fontSize: 11, fontWeight: 600, color: 'var(--t4)' }}
              >
                {showPw ? 'HIDE' : 'SHOW'}
              </button>
            </div>
          </div>
          <button className="btn btn-primary btn-full" style={{ height: 42, fontSize: 14 }} onClick={doLogin}>
            Sign in →
          </button>
        </div>
        <div className="demo-box">
          <p>Demo credentials</p>
          {demoUsers.map(u => (
            <div key={u.username} className="demo-row">
              <span>{u.display}</span>
              <span>{u.username} / {u.password}</span>
            </div>
          ))}
          <div className="demo-row" style={{ marginTop: 4, paddingTop: 4, borderTop: '1px solid #eee' }}>
            <span>Vendor</span>
            <span>vendor_vendoralpha / vendor_2025</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LogoSvg({ size = 16 }) {
  return (
    <svg width={size} height={Math.round(size * 0.7)} viewBox="0 0 80 56" fill="none">
      <path d="M10 6L10 50" stroke="white" strokeWidth="10" strokeLinecap="round"/>
      <path d="M10 28L34 6" stroke="white" strokeWidth="10" strokeLinecap="round"/>
      <path d="M10 28L36 50" stroke="rgba(255,255,255,.6)" strokeWidth="10" strokeLinecap="round"/>
    </svg>
  );
}
