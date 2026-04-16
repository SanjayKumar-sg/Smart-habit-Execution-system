/* eslint-disable no-unused-vars */
import { useState, useEffect, useRef } from 'react';
import { auth as authApi } from '../api/client';
import { useStore } from '../store/useStore';
import toast from 'react-hot-toast';
import { MdEdit, MdCameraAlt, MdUpload } from 'react-icons/md';
import { motion } from 'framer-motion';

const AGE_GROUP_LABELS = { child: '👶 Child', adult: '💪 Adult', senior: '🧓 Senior' };

export default function Profile() {
  const { user, setUser, ageGroup, setAgeGroup, profilePhoto, setProfilePhoto } = useStore();
  const [profile, setProfile] = useState(null);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    Promise.all([authApi.profile(), authApi.badges()]).then(([p, b]) => {
      setProfile(p.data);
      setBadges(Array.isArray(b.data) ? b.data : (b.data?.results || []));
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
      toast.success('Profile updated! ✨');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Photo must be under 5MB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setProfilePhoto(ev.target.result);
      toast.success('Profile photo updated! 📸');
    };
    reader.readAsDataURL(file);
  };

  if (loading || !profile) return <div className="spinner" style={{ margin: '4rem auto' }} />;

  const displayName = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.username;

  return (
    <div className="fade-in" style={{ maxWidth: 960, margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="h1">Your Profile</h1>
        <p className="text-muted">Manage your personal information and view achievements.</p>
      </div>

      <div className="grid-2" style={{ gap: '2rem' }}>
        {/* Profile Form */}
        <div className="card">
          {/* Avatar + Photo Upload */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => fileInputRef.current?.click()}>
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  alt="Profile"
                  className="avatar"
                  style={{ width: 88, height: 88, objectFit: 'cover', border: '3px solid var(--primary-light)' }}
                />
              ) : (
                <div className="avatar-placeholder" style={{ width: 88, height: 88, fontSize: '2rem', border: '3px solid var(--primary-light)' }}>
                  {(profile.first_name?.[0] || profile.username?.[0] || '?').toUpperCase()}
                </div>
              )}
              <div style={{
                position: 'absolute', bottom: 0, right: 0, width: 28, height: 28,
                background: 'var(--primary)', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid var(--bg-card)',
              }}>
                <MdCameraAlt size={14} color="white" />
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} />
            </div>
            <div>
              <h2 className="h2">{displayName}</h2>
              <div className="text-muted">@{profile.username}</div>
              <div style={{ marginTop: '0.4rem' }}>
                <span className="chip chip-purple" style={{ fontSize: '0.75rem' }}>
                  {AGE_GROUP_LABELS[ageGroup] || '💪 Adult'}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input name="first_name" className="form-input" value={profile.first_name || ''} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input name="last_name" className="form-input" value={profile.last_name || ''} onChange={handleChange} />
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
            <div className="form-group">
              <label className="form-label">Age Group</label>
              <select className="form-input form-select" value={ageGroup} onChange={e => setAgeGroup(e.target.value)}>
                <option value="child">👶 Child (Under 18)</option>
                <option value="adult">💪 Adult (18-59)</option>
                <option value="senior">🧓 Senior (60+)</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ marginTop: '0.5rem', width: 'fit-content' }}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Stats & Badges */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="card">
            <h3 className="h3" style={{ marginBottom: '1.5rem' }}>Your Progress</h3>
            <div className="grid-2">
              {[
                { label: 'Current Level', value: profile.level, color: 'var(--primary-light)' },
                { label: 'Total Points', value: profile.total_points?.toLocaleString(), color: 'var(--accent)' },
                { label: 'Current Streak', value: `${profile.streak_count}d`, color: 'var(--danger)' },
                { label: 'Longest Streak', value: `${profile.longest_streak}d`, color: 'var(--success)' },
              ].map(stat => (
                <motion.div key={stat.label} className="stat-card" style={{ padding: '1rem' }}
                  whileHover={{ scale: 1.02, translateY: -3 }}>
                  <div className="stat-value" style={{ fontSize: '1.8rem', color: stat.color }}>{stat.value}</div>
                  <div className="stat-label">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="h3" style={{ marginBottom: '1.5rem' }}>Achievements 🏆</h3>
            <div className="grid-3" style={{ gap: '1rem' }}>
              {badges.map(b => (
                <motion.div key={b.id} className="achievement-card" whileHover={{ scale: 1.05, translateY: -3 }}>
                  <div className="achievement-icon">{b.badge.icon}</div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{b.badge.name}</div>
                  <div className="text-xs text-muted" style={{ textTransform: 'capitalize' }}>{b.badge.rarity}</div>
                </motion.div>
              ))}
              {badges.length === 0 && (
                <div style={{ gridColumn: 'span 3', textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎖️</div>
                  <p>No badges yet. Keep completing habits!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
