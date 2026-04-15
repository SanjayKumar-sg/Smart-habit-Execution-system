import { useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { MdMenu, MdDarkMode, MdLightMode, MdNotifications } from 'react-icons/md';
import { useState, useEffect } from 'react';
import { habits as habitsApi } from '../api/client';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/tasks': "Today's Tasks",
  '/goals': 'Goals',
  '/insights': 'Insights',
  '/coach': 'AI Habit Coach',
  '/analytics': 'Analytics',
  '/social': 'Social',
  '/profile': 'Profile',
  '/medical': 'Medical Record',
  '/calendar': 'Calendar',
  '/settings': 'Settings',
};

export default function Header() {
  const { sidebarOpen, toggleSidebar, theme, toggleTheme, setNudges, nudges } = useStore();
  const location = useLocation();
  const [showNudges, setShowNudges] = useState(false);
  const title = PAGE_TITLES[location.pathname] || 'Smart Habit';

  useEffect(() => {
    habitsApi.nudges().then(r => setNudges(r.data)).catch(() => {});
  }, [location.pathname]);

  return (
    <header className={`header ${!sidebarOpen ? 'sidebar-closed' : ''}`}>
      <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
        <button className="btn btn-ghost btn-icon" onClick={toggleSidebar} title="Toggle sidebar">
          <MdMenu size={20} />
        </button>
        <h1 style={{ fontSize:'1.15rem', fontWeight:700 }}>{title}</h1>
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', position:'relative' }}>
        <button className="btn btn-ghost btn-icon" onClick={toggleTheme} title="Toggle theme">
          {theme === 'dark' ? <MdLightMode size={19} /> : <MdDarkMode size={19} />}
        </button>

        <div style={{ position:'relative' }}>
          <button className="btn btn-ghost btn-icon" onClick={() => setShowNudges(!showNudges)} title="Notifications">
            <MdNotifications size={19} />
            {nudges.length > 0 && (
              <span style={{
                position:'absolute', top:2, right:2, width:8, height:8,
                background:'var(--danger)', borderRadius:'50%', border:'2px solid var(--bg-surface)'
              }} />
            )}
          </button>
          {showNudges && (
            <div style={{
              position:'absolute', top:'calc(100% + 8px)', right:0, width:320,
              background:'var(--bg-card)', border:'1px solid var(--border)',
              borderRadius:'var(--radius-md)', padding:'0.75rem', zIndex:200,
              boxShadow:'var(--shadow-lg)'
            }}>
              <div style={{ fontWeight:600, marginBottom:'0.5rem', fontSize:'0.85rem' }}>Nudges</div>
              {nudges.length === 0 ? (
                <div style={{ color:'var(--text-muted)', fontSize:'0.85rem', padding:'1rem 0', textAlign:'center' }}>All caught up! ✨</div>
              ) : nudges.map(n => (
                <div key={n.id} className="nudge-banner" style={{ marginBottom:'0.5rem' }}>
                  <span style={{ fontSize:'1.2rem' }}>💡</span>
                  <span style={{ fontSize:'0.82rem' }}>{n.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
