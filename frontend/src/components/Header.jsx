import { useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { MdMenu, MdDarkMode, MdLightMode, MdNotifications, MdVolumeUp } from 'react-icons/md';
import { useState, useEffect, useCallback } from 'react';
import { habits as habitsApi } from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';

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
  '/portal/doctor': '🩺 Doctor Portal',
  '/portal/patient': '🏥 Patient Portal',
  '/portal/admin': '⚙️ Admin Portal',
};

function speakMessage(text, lang = 'en') {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang === 'ta' ? 'ta-IN' : 'en-US';
  utter.rate = 0.92;
  utter.pitch = 1.05;
  window.speechSynthesis.speak(utter);
}

export default function Header() {
  const { sidebarOpen, toggleSidebar, theme, toggleTheme, setNudges, nudges, user, language, profilePhoto } = useStore();
  const location = useLocation();
  const [showNudges, setShowNudges] = useState(false);
  const title = PAGE_TITLES[location.pathname] || 'Smart Habit';

  useEffect(() => {
    habitsApi.nudges().then(r => {
      const dataArray = Array.isArray(r.data) ? r.data : (r.data?.results || []);
      setNudges(dataArray);
      // Auto-speak exercise nudges on arrival
      const exerciseNudge = dataArray.find(n =>
        n.message?.toLowerCase().includes('exercise') ||
        n.message?.toLowerCase().includes('workout') ||
        n.message?.toLowerCase().includes('habit')
      );
      if (exerciseNudge && r.data.length > 0) {
        const name = user?.first_name || user?.username || '';
        const msgEn = `${name ? name + ', ' : ''}It's exercise time! ${exerciseNudge.message}`;
        const msgTa = `${name ? name + ', ' : ''}இது உடற்பயிற்சி நேரம்!`;
        // Speak English first then Tamil
        speakMessage(msgEn, 'en');
        setTimeout(() => speakMessage(msgTa, 'ta'), 4000);
        // Browser notification
        if (Notification.permission === 'granted') {
          new Notification(`🏋️ Exercise Time${name ? `, ${name}` : ''}!`, {
            body: exerciseNudge.message,
            icon: '/vite.svg',
          });
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then(p => {
            if (p === 'granted') {
              new Notification(`🏋️ Exercise Time${name ? `, ${name}` : ''}!`, { body: exerciseNudge.message });
            }
          });
        }
      }
    }).catch(() => {});
  }, [location.pathname]);

  const handleSpeakNudge = useCallback((nudge) => {
    const name = user?.first_name || '';
    const msgEn = `${name ? name + ', ' : ''}${nudge.message}`;
    const msgTa = language === 'ta' ? `${name ? name + ', ' : ''}${nudge.message}` : `${name ? name + ', ' : ''}உங்கள் நினைவூட்டல்: ${nudge.message}`;
    speakMessage(language === 'ta' ? msgTa : msgEn, language);
  }, [user, language]);

  return (
    <header className={`header ${!sidebarOpen ? 'sidebar-closed' : ''}`}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button className="btn btn-ghost btn-icon" onClick={toggleSidebar} title="Toggle sidebar">
          <MdMenu size={20} />
        </button>
        <h1 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{title}</h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', position: 'relative' }}>
        <button className="btn btn-ghost btn-icon" onClick={toggleTheme} title="Toggle theme">
          {theme === 'dark' ? <MdLightMode size={19} /> : <MdDarkMode size={19} />}
        </button>

        {/* Notification Bell */}
        <div style={{ position: 'relative' }}>
          <button className="btn btn-ghost btn-icon" onClick={() => setShowNudges(!showNudges)} title="Notifications">
            <MdNotifications size={19} />
            {nudges.length > 0 && (
              <motion.span
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                style={{
                  position: 'absolute', top: 2, right: 2, width: 9, height: 9,
                  background: 'var(--danger)', borderRadius: '50%', border: '2px solid var(--bg-surface)',
                  display: 'block',
                }}
              />
            )}
          </button>

          <AnimatePresence>
            {showNudges && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 340,
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)', zIndex: 200,
                  boxShadow: 'var(--shadow-lg)', overflow: 'hidden',
                }}>
                <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>🔔 Notifications</div>
                  <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }} onClick={() => setShowNudges(false)}>✕</button>
                </div>
                <div style={{ maxHeight: 360, overflowY: 'auto', padding: '0.5rem' }}>
                  {nudges.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1.5rem', textAlign: 'center' }}>
                      All caught up! ✨
                    </div>
                  ) : nudges.map(n => (
                    <motion.div key={n.id} className="nudge-banner" style={{ marginBottom: '0.4rem', padding: '0.75rem' }}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <span style={{ fontSize: '1.2rem' }}>
                        {n.message?.toLowerCase().includes('exercise') || n.message?.toLowerCase().includes('workout') ? '🏋️' : '💡'}
                      </span>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: '0.82rem' }}>{n.message}</span>
                        {n.message?.toLowerCase().includes('exercise') || n.message?.toLowerCase().includes('workout') ? (
                          <div style={{ fontSize: '0.7rem', color: 'var(--primary-light)', fontWeight: 600, marginTop: '0.2rem' }}>
                            🏃 Exercise Time Reminder
                          </div>
                        ) : null}
                      </div>
                      <button
                        className="btn btn-ghost btn-icon"
                        style={{ width: 30, height: 30, fontSize: '0.85rem' }}
                        title="Speak this notification"
                        onClick={() => handleSpeakNudge(n)}
                      >
                        <MdVolumeUp size={15} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Avatar */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.25rem' }}>
            {profilePhoto ? (
              <img src={profilePhoto} alt="avatar" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary-light)' }} />
            ) : (
              <div className="avatar-placeholder" style={{ width: 32, height: 32, fontSize: '0.8rem' }}>
                {(user.first_name?.[0] || user.username?.[0] || '?').toUpperCase()}
              </div>
            )}
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {user.first_name || user.username}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
