import { useApp } from '../context/AppContext';
import { getTabs, ICONS } from '../utils/helpers';
import { LogoSvg } from './LoginScreen';

export default function Sidebar() {
  const { cfg, db, session, setSession, activeTab, setActiveTab } = useApp();

  if (!session) return null;

  const tabs = getTabs(session.role);
  const b = session.branch;
  const unassignedCount = b ? db.orders.filter(o => o.branch === b && o.status === 'Unassigned').length : 0;
  const shortBranchCount = session.role === 'boss'
    ? cfg.branches.filter(br => Object.values(db.payments).some(p => p.branch === br && p.shortfall > 0)).length
    : 0;

  const dotColor = session.role === 'boss' ? 'var(--purple)' : session.role === 'vendor' ? '#a855f7' : 'var(--green)';
  const ctxText = session.branch
    ? `${session.branch} · ${session.role}`
    : session.role === 'vendor' ? session.vendorName : session.role;

  return (
    <div id="sidebar">
      <div id="sb-head">
        <div className="sb-logo">
          <div className="sb-logo-mark">
            <LogoSvg size={16} />
          </div>
          <span className="sb-logo-name">{cfg.company}</span>
        </div>
        <div className="sb-ctx">
          <div className="sb-ctx-dot" style={{ background: dotColor }} />
          <span className="sb-ctx-txt">{ctxText}</span>
        </div>
        <p className="sb-sec">Menu</p>
        <div className="sb-nav">
          {tabs.map(t => {
            let pill = null;
            if (t.id === 'assign' && unassignedCount > 0)
              pill = <span className="sb-pill">{unassignedCount}</span>;
            if (t.id === 'remittances' && shortBranchCount > 0)
              pill = <span className="sb-pill-warn">⚠{shortBranchCount}</span>;
            return (
              <button
                key={t.id}
                className={`sb-item${activeTab === t.id ? ' active' : ''}`}
                onClick={() => setActiveTab(t.id)}
              >
                {ICONS[t.id] && <span className="ico">{ICONS[t.id]}</span>}
                <span>{t.l}</span>
                {pill}
              </button>
            );
          })}
        </div>
      </div>
      <div id="sb-foot">
        <div className="sb-user">
          <div className="sb-av">{session.display?.[0]?.toUpperCase() || '?'}</div>
          <div>
            <p className="sb-uname">{session.display}</p>
            <p className="sb-urole">{session.role}</p>
          </div>
          <button className="sb-out" onClick={() => setSession(null)}>Exit</button>
        </div>
      </div>
    </div>
  );
}
