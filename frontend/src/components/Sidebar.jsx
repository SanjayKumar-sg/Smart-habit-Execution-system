import { NavLink, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import {
  MdDashboard, MdChecklist, MdFlag, MdInsights, MdSmartToy,
  MdBarChart, MdGroup, MdPerson, MdMedicalServices, MdCalendarMonth,
  MdSettings, MdLogout, MdLocalHospital, MdAdminPanelSettings, MdPersonPin,
  MdFitnessCenter
} from 'react-icons/md';

const NAV_MAIN = [
  { section: 'Main' },
  { to: '/dashboard', icon: <MdDashboard />, label: 'Dashboard' },
  { to: '/tasks', icon: <MdChecklist />, label: "Today's Tasks" },
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

const ROLE_PORTALS = {
  user: [{ to: '/portal/user', icon: <MdFitnessCenter />, label: 'Wellness Hub', color: '#06B6D4' }],
  patient: [{ to: '/portal/patient', icon: <MdPersonPin />, label: 'My Health Portal', color: '#10B981' }],
  doctor: [{ to: '/portal/doctor', icon: <MdLocalHospital />, label: 'Doctor Portal', color: '#06B6D4' }],
  admin: [
    { to: '/portal/doctor', icon: <MdLocalHospital />, label: 'Doctor Portal', color: '#06B6D4' },
    { to: '/portal/patient', icon: <MdPersonPin />, label: 'Patient Portal', color: '#10B981' },
    { to: '/portal/admin', icon: <MdAdminPanelSettings />, label: 'Admin Portal', color: '#F59E0B' },
  ],
};

export default function Sidebar() {
  const { sidebarOpen, user, logout, role, profilePhoto, ageGroup } = useStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const portals = ROLE_PORTALS[role] || ROLE_PORTALS['user'];

  return (
    <aside className={`sidebar ${!sidebarOpen ? 'closed' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg,#7C3AED,#06B6D4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.1rem', flexShrink: 0
          }}>⚡</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', lineHeight: 1.2 }}>Smart Habit</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1 }}>Execution System</div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {/* Main Nav */}
        {NAV_MAIN.map((item, i) => {
          if (item.section) return <div key={i} className="nav-section-label">{item.section}</div>;
          return (
            <NavLink key={item.to} to={item.to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        {/* Portal Section */}
        <div className="nav-section-label">Portals</div>
        {portals.map(p => (
          <NavLink key={p.to} to={p.to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            style={{ borderLeft: '3px solid transparent' }}>
            <span className="nav-icon" style={{ color: p.color }}>{p.icon}</span>
            <span>{p.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Footer */}
      <div style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            {profilePhoto ? (
              <img src={profilePhoto} alt="avatar" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary-light)', flexShrink: 0 }} />
            ) : (
              <div className="avatar-placeholder" style={{ width: 36, height: 36, fontSize: '0.9rem', flexShrink: 0 }}>
                {(user.first_name?.[0] || user.username?.[0] || '?').toUpperCase()}
              </div>
            )}
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {[user.first_name, user.last_name].filter(Boolean).join(' ') || user.username}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                <span>Lv {user.level} · {user.total_points} pts</span>
{role && (
                  <span style={{
                    background: role === 'admin' ? 'rgba(245,158,11,0.2)' : role === 'doctor' ? 'rgba(6,182,212,0.2)' : role === 'patient' ? 'rgba(16,185,129,0.2)' : 'rgba(124,58,237,0.2)',
                    color: role === 'admin' ? '#F59E0B' : role === 'doctor' ? '#06B6D4' : role === 'patient' ? '#10B981' : '#7C3AED',
                    padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
                  }}>{role}</span>
                )}
              </div>
            </div>
          </div>
        )}
        <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--danger)' }} onClick={handleLogout}>
          <MdLogout /> Logout
        </button>
      </div>
    </aside>
  );
}
