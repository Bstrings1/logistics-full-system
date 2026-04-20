import { useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { buildUsers, getTabs } from '../utils/helpers';

const CSS = `
  .kyne-login *{ box-sizing: border-box; }
  .kyne-login {
    font-family: 'Plus Jakarta Sans', system-ui, -apple-system, Segoe UI, sans-serif;
    color: #0b1230;
    background: #f6f7fb;
    min-height: 100vh;
    position: relative;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }
  .kyne-login::before {
    content: "";
    position: fixed; inset: 0; pointer-events: none; z-index: 0;
    background:
      radial-gradient(900px 500px at 85% -10%, rgba(42,62,240,0.10), transparent 60%),
      radial-gradient(700px 500px at -10% 110%, rgba(42,62,240,0.06), transparent 60%);
  }
  .kyne-stage {
    position: relative; z-index: 1;
    min-height: 100vh;
    display: flex; align-items: center; justify-content: center;
    padding: 32px 16px;
  }
  .kyne-wrap {
    width: 100%; max-width: 440px;
    display: flex; flex-direction: column; align-items: center;
  }
  .kyne-card {
    width: 100%;
    background: #ffffff;
    border-radius: 24px;
    padding: 32px 32px 28px;
    box-shadow:
      0 1px 1px rgba(11,18,48,0.04),
      0 8px 20px -8px rgba(11,18,48,0.10),
      0 30px 60px -30px rgba(42,62,240,0.25);
    border: 1px solid rgba(11,18,48,0.04);
    position: relative;
  }
  .kyne-card::before {
    content: ""; position: absolute; inset: 0 14px auto 14px; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent);
    border-radius: 1px;
  }
  .kyne-input-wrap {
    position: relative;
    display: flex; align-items: center;
    background: #fff;
    border: 1.5px solid #d9ddea;
    border-radius: 12px;
    transition: border-color .15s, box-shadow .15s;
  }
  .kyne-input-wrap:focus-within {
    border-color: #3b54ff;
    box-shadow: 0 0 0 4px rgba(59,84,255,0.14);
  }
  .kyne-input-wrap:hover:not(:focus-within) { border-color: #c3c9dc; }
  .kyne-input-icon {
    width: 44px; display: grid; place-items: center; color: #858cab; flex-shrink: 0;
  }
  .kyne-input-wrap input {
    flex: 1; border: 0; outline: 0; background: transparent;
    padding: 13px 14px 13px 0;
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    font-size: 15px; color: #0b1230; letter-spacing: 0.01em;
  }
  .kyne-input-wrap input::placeholder { color: #858cab; }
  .kyne-input-trailing {
    padding-right: 12px; display: flex; align-items: center; gap: 8px;
  }
  .kyne-show-btn {
    border: 0; background: transparent;
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    font-weight: 700; font-size: 11px; letter-spacing: 0.12em;
    color: #2a3ef0;
    padding: 6px 8px; border-radius: 6px; cursor: pointer;
  }
  .kyne-show-btn:hover { background: #eef2ff; }
  .kyne-check {
    width: 18px; height: 18px; border-radius: 50%;
    background: #1fa67a; display: grid; place-items: center; color: #fff;
  }
  .kyne-remember input {
    appearance: none; -webkit-appearance: none;
    width: 16px; height: 16px; border: 1.5px solid #d9ddea; border-radius: 4px;
    display: inline-grid; place-items: center; background: #fff; cursor: pointer;
    transition: all .15s; flex-shrink: 0;
  }
  .kyne-remember input:checked { background: #2a3ef0; border-color: #2a3ef0; }
  .kyne-remember input:checked::after {
    content: ""; width: 10px; height: 6px;
    border-left: 2px solid #fff; border-bottom: 2px solid #fff;
    transform: rotate(-45deg) translate(1px,-1px);
  }
  .kyne-btn {
    position: relative;
    display: inline-flex; align-items: center; justify-content: center; gap: 10px;
    width: 100%; height: 52px;
    border: 0; border-radius: 14px; cursor: pointer;
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    font-weight: 700; font-size: 15px; color: #fff;
    background: linear-gradient(180deg, #3b54ff, #2a3ef0);
    box-shadow:
      0 1px 0 rgba(255,255,255,0.18) inset,
      0 8px 16px -6px rgba(42,62,240,0.45),
      0 2px 4px rgba(11,18,48,0.10);
    letter-spacing: 0.01em;
    transition: transform .08s ease, box-shadow .15s ease, filter .15s ease;
  }
  .kyne-btn:hover { filter: brightness(1.05); }
  .kyne-btn:active {
    transform: translateY(1px);
    box-shadow: 0 1px 0 rgba(255,255,255,0.18) inset, 0 4px 10px -4px rgba(42,62,240,0.45);
  }
  .kyne-btn .kyne-arrow { transition: transform .2s ease; }
  .kyne-btn:hover .kyne-arrow { transform: translateX(3px); }
  .kyne-meta {
    display: flex; align-items: center; justify-content: center; gap: 14px;
    margin-top: 28px; font-size: 11px; color: #858cab;
    font-family: 'JetBrains Mono', ui-monospace, monospace; letter-spacing: 0.04em;
  }
  .kyne-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: #1fa67a; box-shadow: 0 0 0 4px rgba(31,166,122,0.15);
  }
  .kyne-err {
    background: #fff0f2; border: 1px solid #fcc; border-radius: 8px;
    color: #e0425a; font-size: 13px; font-weight: 600;
    padding: 10px 14px; margin-bottom: 14px;
  }
  .kyne-card.shake { animation: kyne-shake 0.35s ease; }
  @keyframes kyne-shake {
    0%,100%{ transform: translateX(0); }
    20%{ transform: translateX(-6px); }
    40%{ transform: translateX(6px); }
    60%{ transform: translateX(-4px); }
    80%{ transform: translateX(4px); }
  }
  @media (max-width: 480px) {
    .kyne-stage { padding: 20px 14px; align-items: center; }
    .kyne-card { padding: 22px 18px 20px; border-radius: 18px; }
    .kyne-btn { height: 48px; font-size: 14px; }
  }
`;

export default function LoginScreen() {
  const { cfg, setSession, setActiveTab } = useApp();
  const userRef = useRef();
  const passRef = useRef();
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [userVal, setUserVal] = useState('');
  const [remember, setRemember] = useState(true);

  function doLogin() {
    const user = userRef.current.value.trim();
    const pass = passRef.current.value;

    const adminCreds = cfg.credentials?.admin || { username: 'Bstrings', password: '503320' };
    if (user === adminCreds.username && pass === adminCreds.password) {
      setError('');
      setSession({ role: 'admin', display: 'Super Admin' });
      return;
    }

    const found = buildUsers(cfg).find(
      u => u.username.toLowerCase() === user.toLowerCase() && u.password === pass
    );
    if (!found) {
      setError('Incorrect credentials. Please try again.');
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

  const company = cfg.company || 'Kyne';

  return (
    <div className="kyne-login">
      <style>{CSS}</style>
      <div className="kyne-stage">
        <div className="kyne-wrap">

          {/* Brand lockup */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <KMark />
            <span style={{ fontWeight: 800, fontSize: 28, letterSpacing: '-0.8px', color: '#0b1230' }}>{company}</span>
          </div>
          <div style={{ fontSize: 13, color: '#858cab', letterSpacing: '0.02em', marginBottom: 20, textAlign: 'center' }}>
            Logistics for <strong style={{ color: '#5b6385', fontWeight: 600 }}>ecommerce operators</strong> who sweat the details.
          </div>

          {/* Card */}
          <div className={`kyne-card${shake ? ' shake' : ''}`}>
            <h1 style={{ margin: 0, fontSize: 26, lineHeight: 1.15, letterSpacing: '-0.5px', fontWeight: 700, color: '#0b1230' }}>Welcome back</h1>
            <p style={{ marginTop: 6, marginBottom: 0, fontSize: 14, color: '#5b6385' }}>Sign in to your {company} account to continue.</p>

            <form style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 14 }} onSubmit={e => { e.preventDefault(); doLogin(); }}>

              {error && <div className="kyne-err">{error}</div>}

              {/* Username */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.02em', color: '#1f2747' }}>Username</label>
                <div className="kyne-input-wrap">
                  <span className="kyne-input-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>
                    </svg>
                  </span>
                  <input
                    ref={userRef}
                    type="text"
                    autoComplete="username"
                    placeholder="Enter your username"
                    value={userVal}
                    onChange={e => setUserVal(e.target.value)}
                    onKeyDown={handleKey}
                  />
                  {userVal.trim() && (
                    <div className="kyne-input-trailing">
                      <span className="kyne-check">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <label style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.02em', color: '#1f2747' }}>Password</label>
                </div>
                <div className="kyne-input-wrap">
                  <span className="kyne-input-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="4" y="10" width="16" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>
                    </svg>
                  </span>
                  <input
                    ref={passRef}
                    type={showPw ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    onKeyDown={handleKey}
                  />
                  <div className="kyne-input-trailing">
                    <button type="button" className="kyne-show-btn" onClick={() => setShowPw(v => !v)}>
                      {showPw ? 'HIDE' : 'SHOW'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Remember me */}
              <div style={{ display: 'flex', alignItems: 'center', marginTop: 2 }}>
                <label className="kyne-remember" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#5b6385', userSelect: 'none', cursor: 'pointer' }}>
                  <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
                  Keep me signed in
                </label>
              </div>

              {/* Submit */}
              <button className="kyne-btn" type="submit" style={{ marginTop: 10 }}>
                Sign in
                <svg className="kyne-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>
                </svg>
              </button>

            </form>
          </div>

          {/* Meta footer */}
          <div className="kyne-meta">
            <span className="kyne-dot" />
            <span>All systems operational</span>
          </div>

        </div>
      </div>
    </div>
  );
}

function KMark() {
  return (
    <div style={{
      width: 44, height: 44, borderRadius: 12,
      background: 'linear-gradient(180deg, #3b54ff, #1f2fc4)',
      display: 'grid', placeItems: 'center',
      boxShadow: '0 1px 0 rgba(255,255,255,0.3) inset, 0 -6px 12px rgba(11,18,48,0.15) inset, 0 6px 16px -6px rgba(42,62,240,0.55)',
      flexShrink: 0,
    }}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M6 4.5v15" stroke="#fff" strokeWidth="2.8" strokeLinecap="round"/>
        <path d="M6 12.2 L17 4.5" stroke="#fff" strokeWidth="2.8" strokeLinecap="round"/>
        <path d="M9.6 10.8 L17.8 19.5" stroke="#fff" strokeWidth="2.8" strokeLinecap="round"/>
        <circle cx="17.8" cy="19.5" r="1.6" fill="#fff"/>
      </svg>
    </div>
  );
}

export function LogoSvg({ size = 16, color = 'white' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 5 L9 31" stroke={color} strokeWidth="5" strokeLinecap="round"/>
      <path d="M9 18 L26 6" stroke={color} strokeWidth="5" strokeLinecap="round"/>
      <path d="M9 18 L27 31" stroke={color} strokeWidth="5" strokeLinecap="round" strokeOpacity="0.6"/>
    </svg>
  );
}
