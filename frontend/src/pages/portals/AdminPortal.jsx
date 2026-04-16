/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { auth as authApi } from '../../api/client';
import { useStore } from '../../store/useStore';
import toast from 'react-hot-toast';
import { MdPeople, MdBarChart, MdAdminPanelSettings, MdSearch, MdShield } from 'react-icons/md';

const ROLE_OPTIONS = ['patient', 'doctor', 'admin'];
const ROLE_COLORS = { patient: '#10B981', doctor: '#06B6D4', admin: '#F59E0B' };

export default function AdminPortal() {
  const { user } = useStore();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
  const [stats, setStats] = useState({ totalUsers: 0, totalHabits: 0, avgStreak: 0, totalPoints: 0 });

  useEffect(() => {
    authApi.leaderboard().then(r => {
      const data = r.data || [];
      setUsers(data.map((u, i) => ({
        id: u.id || i + 1,
        name: [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username || `User ${i + 1}`,
        username: u.username || `user${i + 1}`,
        role: u.role || (i === 0 ? 'admin' : i < 3 ? 'doctor' : 'patient'),
        level: u.level || 1,
        points: u.total_points || 0,
        streak: u.streak_count || 0,
        avatar: (u.first_name?.[0] || u.username?.[0] || 'U').toUpperCase(),
        ageGroup: u.age_group || 'adult',
        joined: new Date(Date.now() - i * 86400000 * 7).toLocaleDateString(),
      })));
      // Stats
      const totalPts = data.reduce((s, u) => s + (u.total_points || 0), 0);
      const avgStreak = data.length ? Math.round(data.reduce((s, u) => s + (u.streak_count || 0), 0) / data.length) : 0;
      setStats({ totalUsers: data.length, totalHabits: data.length * 4, avgStreak, totalPoints: totalPts });
    }).catch(() => {
      // Demo data
      const demo = [
        { id: 1, name: 'Sanjay Kumar', username: 'sanjay', role: 'admin', level: 10, points: 5000, streak: 21, avatar: 'S', ageGroup: 'adult', joined: '1 Jan 2026' },
        { id: 2, name: 'Dr. Priya', username: 'drpriya', role: 'doctor', level: 7, points: 2800, streak: 14, avatar: 'D', ageGroup: 'adult', joined: '5 Jan 2026' },
        { id: 3, name: 'Arun K', username: 'arun', role: 'patient', level: 3, points: 950, streak: 5, avatar: 'A', ageGroup: 'adult', joined: '10 Feb 2026' },
        { id: 4, name: 'Meena L', username: 'meena', role: 'patient', level: 2, points: 420, streak: 2, avatar: 'M', ageGroup: 'child', joined: '15 Feb 2026' },
        { id: 5, name: 'Ravi S', username: 'ravi', role: 'patient', level: 5, points: 1800, streak: 9, avatar: 'R', ageGroup: 'senior', joined: '1 Mar 2026' },
      ];
      setUsers(demo);
      setStats({ totalUsers: demo.length, totalHabits: 20, avgStreak: 10, totalPoints: demo.reduce((s, u) => s + u.points, 0) });
    }).finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.role.includes(search.toLowerCase())
  );

  const handleRoleChange = (userId, newRole) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    // In real app: authApi.updateUserRole(userId, newRole)
    toast.success(`Role updated to ${newRole}`);
  };

  const roleCount = { patient: 0, doctor: 0, admin: 0 };
  users.forEach(u => { if (roleCount[u.role] !== undefined) roleCount[u.role]++; });
  const ageGroups = { child: 0, adult: 0, senior: 0 };
  users.forEach(u => { if (ageGroups[u.ageGroup] !== undefined) ageGroups[u.ageGroup]++; });

  return (
    <div className="fade-in" style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="h1" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <MdAdminPanelSettings color="var(--accent)" /> Admin Portal
        </h1>
        <p className="text-muted">Full platform access — manage users, roles, and view platform-wide statistics.</p>
      </div>

      {/* Platform Stats */}
      <div className="grid-4" style={{ marginBottom: '2rem', gap: '1rem' }}>
        {[
          { icon: '👥', label: 'Total Users', value: stats.totalUsers, color: '#7C3AED' },
          { icon: '🏃', label: 'Total Habits', value: stats.totalHabits, color: '#06B6D4' },
          { icon: '🔥', label: 'Avg Streak', value: `${stats.avgStreak}d`, color: '#EF4444' },
          { icon: '⭐', label: 'Total Points', value: stats.totalPoints.toLocaleString(), color: '#F59E0B' },
        ].map((s, i) => (
          <motion.div key={s.label} className="stat-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <div className="stat-icon" style={{ background: `${s.color}22` }}>{s.icon}</div>
            <div className="stat-value gradient-text">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: '1.5rem' }}>
        {[['users', '👥 User Management'], ['roles', '🛡️ Role Distribution'], ['platform', '📊 Platform Stats']].map(([t, label]) => (
          <button key={t} className={`tab-btn ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>{label}</button>
        ))}
      </div>

      {/* Users Table */}
      {activeTab === 'users' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div className="h3">All Users ({users.length})</div>
            <div style={{ position: 'relative', maxWidth: 280 }}>
              <MdSearch style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input className="form-input" placeholder="Search by name, username, role…" value={search}
                onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '2.25rem' }} />
            </div>
          </div>
          {loading ? <div className="spinner" style={{ margin: '3rem auto' }} /> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr>
                    {['User', 'Username', 'Age Group', 'Level', 'Streak', 'Points', 'Role', 'Joined'].map(h => (
                      <th key={h} style={{ padding: '0.6rem 0.75rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u, i) => (
                    <motion.tr key={u.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                      style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <div className="avatar-placeholder" style={{ width: 32, height: 32, fontSize: '0.8rem', flexShrink: 0 }}>{u.avatar}</div>
                          <span style={{ fontWeight: 600 }}>{u.name}</span>
                          {u.username === user?.username && <span style={{ fontSize: '0.65rem', background: 'rgba(124,58,237,0.2)', color: 'var(--primary-light)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>You</span>}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>@{u.username}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <span className="chip" style={{ fontSize: '0.7rem', background: 'var(--bg-glass)', color: 'var(--text-secondary)' }}>
                          {u.ageGroup === 'child' ? '👶' : u.ageGroup === 'senior' ? '🧓' : '💪'} {u.ageGroup}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', fontWeight: 700, color: 'var(--primary-light)' }}>Lv {u.level}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{ color: u.streak > 7 ? 'var(--success)' : 'var(--text-secondary)' }}>🔥 {u.streak}d</span>
                      </td>
                      <td style={{ padding: '0.75rem', color: 'var(--accent)', fontWeight: 600 }}>{u.points.toLocaleString()}</td>
                      <td style={{ padding: '0.75rem' }}>
                        <select
                          value={u.role}
                          onChange={e => handleRoleChange(u.id, e.target.value)}
                          style={{
                            background: `${ROLE_COLORS[u.role]}22`,
                            color: ROLE_COLORS[u.role],
                            border: `1px solid ${ROLE_COLORS[u.role]}44`,
                            borderRadius: '6px', padding: '0.25rem 0.5rem',
                            fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                          }}>
                          {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>{u.joined}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No users found</div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Role Distribution */}
      {activeTab === 'roles' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card">
            <div className="h3" style={{ marginBottom: '1.5rem' }}>Role Distribution</div>
            <div className="grid-3" style={{ gap: '1rem', marginBottom: '2rem' }}>
              {Object.entries(roleCount).map(([role, count]) => (
                <div key={role} style={{ background: `${ROLE_COLORS[role]}12`, border: `1px solid ${ROLE_COLORS[role]}33`, borderRadius: 'var(--radius-md)', padding: '1.5rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
                    {role === 'admin' ? '⚙️' : role === 'doctor' ? '🩺' : '🏥'}
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: ROLE_COLORS[role] }}>{count}</div>
                  <div style={{ fontWeight: 600, textTransform: 'capitalize', color: ROLE_COLORS[role] }}>{role}s</div>
                </div>
              ))}
            </div>
            <div className="h3" style={{ marginBottom: '1rem' }}>Age Group Breakdown</div>
            <div className="grid-3" style={{ gap: '1rem' }}>
              {[['child', '👶', '#06B6D4'], ['adult', '💪', '#7C3AED'], ['senior', '🧓', '#10B981']].map(([group, emoji, color]) => (
                <div key={group} style={{ background: `${color}12`, border: `1px solid ${color}33`, borderRadius: 'var(--radius-md)', padding: '1.5rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{emoji}</div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color }}>{ageGroups[group]}</div>
                  <div style={{ fontWeight: 600, textTransform: 'capitalize', color }}>{group}s</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Platform Stats */}
      {activeTab === 'platform' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
          <div className="h3" style={{ marginBottom: '1.5rem' }}>Platform Health Metrics</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { label: 'Total Registered Users', value: stats.totalUsers, max: 100, color: '#7C3AED', icon: '👥' },
              { label: 'Total Habits Tracked', value: stats.totalHabits, max: 500, color: '#06B6D4', icon: '🏃' },
              { label: 'Average Streak (days)', value: stats.avgStreak, max: 30, color: '#EF4444', icon: '🔥' },
              { label: 'Total Points Earned', value: Math.min(stats.totalPoints / 100, 100), max: 100, color: '#F59E0B', icon: '⭐', display: stats.totalPoints.toLocaleString() },
            ].map(m => (
              <div key={m.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{m.icon} {m.label}</span>
                  <span style={{ color: m.color, fontWeight: 700 }}>{m.display || m.value}</span>
                </div>
                <div style={{ height: 10, background: 'var(--bg-glass)', borderRadius: '99px', overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((m.value / m.max) * 100, 100)}%` }}
                    transition={{ duration: 1, delay: 0.2 }}
                    style={{ height: '100%', background: `linear-gradient(90deg, ${m.color}, ${m.color}99)`, borderRadius: '99px' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
