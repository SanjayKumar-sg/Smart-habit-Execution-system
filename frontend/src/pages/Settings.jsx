import { useState, useEffect } from 'react';
import { auth as authApi } from '../api/client';
import { useStore } from '../store/useStore';
import toast from 'react-hot-toast';

export default function Settings() {
  const [prefs, setPrefs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { theme, toggleTheme, language, setLanguage, role, setRole } = useStore();

  useEffect(() => {
    authApi.preferences().then(res => {
      setPrefs(res.data);
    }).catch(() => toast.error('Failed to load preferences'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setPrefs({ ...prefs, [e.target.name]: val });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await authApi.updatePreferences(prefs);
      toast.success('Settings updated ✅');
    } catch {
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !prefs) return <div className="spinner" style={{ margin: '4rem auto' }} />;

  return (
    <div className="fade-in" style={{ maxWidth: 700, margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="h1">Settings & Preferences</h1>
        <p className="text-muted">Customize your experience, language, notifications, and portal access.</p>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

        {/* Appearance */}
        <div className="card">
          <h3 className="h4" style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Appearance & Language</h3>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Theme</label>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{theme}</span>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => {
                  toggleTheme();
                  handleChange({ target: { name: 'theme', value: theme === 'dark' ? 'light' : 'dark' } });
                }}>Toggle Theme</button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">AI Coach Language</label>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  className={`btn btn-sm ${language === 'en' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => { setLanguage('en'); toast.success('Language set to English 🇬🇧'); }}
                >
                  🇬🇧 English
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${language === 'ta' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => { setLanguage('ta'); toast.success('மொழி தமிழாக அமைக்கப்பட்டது 🇮🇳'); }}
                >
                  🇮🇳 தமிழ்
                </button>
              </div>
              <p className="text-xs text-muted" style={{ marginTop: '0.4rem' }}>
                {language === 'ta' ? 'AI Coach தமிழில் பதில் அளிக்கும்' : 'AI Coach responds in English'}
              </p>
            </div>
          </div>
        </div>



        {/* Notifications */}
        <div className="card">
          <h3 className="h4" style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Notifications & Voice Alerts</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}>
              <input type="checkbox" style={{ transform: 'scale(1.2)' }} name="notifications_habit_reminders" checked={prefs.notifications_habit_reminders} onChange={handleChange} />
              <div>
                <div style={{ fontWeight: 600 }}>Habit Reminders</div>
                <div className="text-xs text-muted">Receive alerts for scheduled habits (spoken aloud)</div>
              </div>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}>
              <input type="checkbox" style={{ transform: 'scale(1.2)' }} name="notifications_nudges" checked={prefs.notifications_nudges} onChange={handleChange} />
              <div>
                <div style={{ fontWeight: 600 }}>Smart Nudges</div>
                <div className="text-xs text-muted">Contextual tips and motivational messages</div>
              </div>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}>
              <input type="checkbox" style={{ transform: 'scale(1.2)' }} name="notifications_social" checked={prefs.notifications_social} onChange={handleChange} />
              <div>
                <div style={{ fontWeight: 600 }}>Social Alerts</div>
                <div className="text-xs text-muted">Friend requests and challenge updates</div>
              </div>
            </label>
          </div>
        </div>

        {/* Timing */}
        <div className="card">
          <h3 className="h4" style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Timing & Goals</h3>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Quiet Hours Start</label>
              <input name="quiet_hours_start" type="time" className="form-input" value={prefs.quiet_hours_start || ''} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Quiet Hours End</label>
              <input name="quiet_hours_end" type="time" className="form-input" value={prefs.quiet_hours_end || ''} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Preferred Workout Time</label>
              <input name="preferred_workout_time" type="time" className="form-input" value={prefs.preferred_workout_time || ''} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Weekly Activity Goal (Hours)</label>
              <input name="weekly_goal_hours" type="number" className="form-input" value={prefs.weekly_goal_hours} onChange={handleChange} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
