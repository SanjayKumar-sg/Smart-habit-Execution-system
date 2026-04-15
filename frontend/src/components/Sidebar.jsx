import { NavLink, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import {
  MdDashboard, MdChecklist, MdFlag, MdInsights, MdSmartToy,
  MdBarChart, MdGroup, MdPerson, MdMedicalServices, MdCalendarMonth,
  MdSettings, MdLogout
} from 'react-icons/md';

const NAV = [
  { section: 'Main' },
  { to: '/dashboard', icon: <MdDashboard />, label: 'Dashboard' },
  { to: '/tasks', icon: <MdChecklist />, label: 'Today\'s Tasks' },
  { to: '/goals', icon: <MdFlag />, label: 'Goals' },
  { to: '/calendar', icon: <MdCalendarMonth />, label: 'Calendar' },
  { section: 'Intelligence' },
  { to: '/insights', icon: <MdInsights />, label: 'Insights' },
  { to: '/coach', icon: <MdSmartToy />, label: 'AI Coach' },
  { to: '/analytics', icon: <MdBarChart />, label: 'Analytics' },
  { section: 'Community' },
  { to: '/social', icon: <MdGroup />, label: 'Social' },
  { section: 'You' },
  { to: '/profile', icon: <MdPerson />, label: 'Profile' },
  { to: '/medical', icon: <MdMedicalServices />, label: 'Medical Record' },
  { to: '/settings', icon: <MdSettings />, label: 'Settings' },
];

export default function Sidebar() {
  const { sidebarOpen, user, logout } = useStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={`sidebar ${!sidebarOpen ? 'closed' : ''}`}>
      <div className="sidebar-logo">
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          <div style={{
            width:36, height:36, borderRadius:10,
            background:'linear-gradient(135deg,#7C3AED,#06B6D4)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:'1.1rem', flexShrink:0
          }}>⚡</div>
          <div>
            <div style={{ fontWeight:800, fontSize:'0.95rem', lineHeight:1.2 }}>Smart Habit</div>
            <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', lineHeight:1 }}>Execution System</div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV.map((item, i) => {
          if (item.section) return <div key={i} className="nav-section-label">{item.section}</div>;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div style={{ padding:'1rem', borderTop:'1px solid var(--border)' }}>
        {user && (
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'0.75rem' }}>
            <div className="avatar-placeholder" style={{ width:36, height:36, fontSize:'0.9rem', flexShrink:0 }}>
              {(user.first_name?.[0] || user.username?.[0] || '?').toUpperCase()}
            </div>
            <div style={{ overflow:'hidden' }}>
              <div style={{ fontSize:'0.85rem', fontWeight:600, truncate:true }}>{user.first_name || user.username}</div>
              <div style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>Level {user.level} · {user.total_points} pts</div>
            </div>
          </div>
        )}
        <button className="btn btn-ghost" style={{ width:'100%', justifyContent:'flex-start', color:'var(--danger)' }} onClick={handleLogout}>
          <MdLogout /> Logout
        </button>
      </div>
    </aside>
  );
}
