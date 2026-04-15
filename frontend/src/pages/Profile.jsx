import { useState, useEffect } from 'react';
import { auth as authApi } from '../api/client';
import { useStore } from '../store/useStore';
import toast from 'react-hot-toast';
import { MdEdit } from 'react-icons/md';

export default function Profile() {
  const { user, setUser } = useStore();
  const [profile, setProfile] = useState(null);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([authApi.profile(), authApi.badges()]).then(([p, b]) => {
      setProfile(p.data);
      setBadges(b.data);
    }).catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await authApi.updateProfile(profile);
      setProfile(data);
      setUser(data);
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !profile) return <div className="spinner" style={{ margin: '4rem auto' }} />;

  return (
    <div className="fade-in" style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="h1">Your Profile</h1>
        <p className="text-muted">Manage your personal information and view achievements.</p>
      </div>

      <div className="grid-2" style={{ gap: '2rem' }}>
        {/* Profile Form */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="avatar-placeholder" style={{ width: 80, height: 80, fontSize: '2rem' }}>
              {profile.first_name?.[0] || profile.username?.[0]}
            </div>
            <div>
              <h2 className="h2">{profile.first_name} {profile.last_name}</h2>
              <div className="text-muted">@{profile.username}</div>
            </div>
          </div>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input name="first_name" className="form-input" value={profile.first_name} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input name="last_name" className="form-input" value={profile.last_name} onChange={handleChange} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Bio</label>
              <textarea name="bio" className="form-input form-textarea" value={profile.bio || ''} onChange={handleChange} placeholder="Tell us about your goals..." />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Height (cm)</label>
                <input name="height_cm" type="number" className="form-input" value={profile.height_cm || ''} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Weight (kg)</label>
                <input name="weight_kg" type="number" step="0.1" className="form-input" value={profile.weight_kg || ''} onChange={handleChange} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ marginTop: '1rem', width: 'fit-content' }}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Stats & Badges */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="card">
            <h3 className="h3" style={{ marginBottom: '1.5rem' }}>Your Progress</h3>
            <div className="grid-2">
              <div className="stat-card" style={{ padding: '1rem' }}>
                <div className="stat-value text-primary-col" style={{ fontSize: '1.8rem' }}>{profile.level}</div>
                <div className="stat-label">Current Level</div>
              </div>
              <div className="stat-card" style={{ padding: '1rem' }}>
                <div className="stat-value text-warning" style={{ fontSize: '1.8rem' }}>{profile.total_points}</div>
                <div className="stat-label">Total Points</div>
              </div>
              <div className="stat-card" style={{ padding: '1rem' }}>
                <div className="stat-value text-danger" style={{ fontSize: '1.8rem' }}>{profile.streak_count}</div>
                <div className="stat-label">Current Streak</div>
              </div>
              <div className="stat-card" style={{ padding: '1rem' }}>
                <div className="stat-value text-success" style={{ fontSize: '1.8rem' }}>{profile.longest_streak}</div>
                <div className="stat-label">Longest Streak</div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="h3" style={{ marginBottom: '1.5rem' }}>Achievements</h3>
            <div className="grid-3" style={{ gap: '1rem' }}>
              {badges.map(b => (
                <div key={b.id} className="achievement-card">
                  <div className="achievement-icon">{b.badge.icon}</div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{b.badge.name}</div>
                  <div className="text-xs text-muted" style={{ textTransform: 'capitalize' }}>{b.badge.rarity}</div>
                </div>
              ))}
              {badges.length === 0 && (
                <div style={{ gridColumn: 'span 3', textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>
                  No badges earned yet. Keep completing habits!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
