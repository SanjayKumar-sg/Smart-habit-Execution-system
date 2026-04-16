/* eslint-disable no-unused-vars */
/* eslint-disable no-unused-vars */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { auth } from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const AGE_GROUPS = [
  {
    id: 'child',
    emoji: '👶',
    label: 'Child',
    labelTa: 'குழந்தை',
    range: 'Under 18 years',
    color: '#06B6D4',
    desc: 'Fun, light activities tailored for growth',
  },
  {
    id: 'adult',
    emoji: '💪',
    label: 'Adult',
    labelTa: 'வயது வந்தவர்',
    range: '18 – 59 years',
    color: '#7C3AED',
    desc: 'Balanced fitness and productivity goals',
  },
  {
    id: 'senior',
    emoji: '🧓',
    label: 'Senior',
    labelTa: 'மூத்தவர்',
    range: '60+ years',
    color: '#10B981',
    desc: 'Gentle, joint-friendly exercises and wellness',
  },
];

export default function Register() {
  const [step, setStep] = useState(1); // 1=age group, 2=role, 3=form
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedRole, setSelectedRole] = useState('user');
  const [form, setForm] = useState({ username: '', email: '', first_name: '', last_name: '', password: '' });
  const [loading, setLoading] = useState(false);
  const setUser = useStore(s => s.setUser);
  const setAgeGroup = useStore(s => s.setAgeGroup);
  const setRole = useStore(s => s.setRole);
  const navigate = useNavigate();

  const handleGroupSelect = (id) => {
    setSelectedGroup(id);
  };

  const handleNext = () => {
    if (!selectedGroup) { toast.error('Please select your age group'); return; }
    setAgeGroup(selectedGroup);
    setStep(2);
  };

  const handleNextRole = () => {
    setStep(3);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await auth.register({ ...form, age_group: selectedGroup, role: selectedRole });
      localStorage.setItem('access_token', data.tokens.access);
      localStorage.setItem('refresh_token', data.tokens.refresh);
      setUser(data.user);
      setAgeGroup(selectedGroup);
      const role = data.user?.role || 'user';
      setRole(role);
      toast.success('Account created! Welcome 🚀');
      if (role === 'doctor') navigate('/portal/doctor');
      else if (role === 'admin') navigate('/portal/admin');
      else if (role === 'user') navigate('/portal/user');
      else navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data ? Object.values(err.response.data)[0]?.[0] : 'Registration failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-hero">
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <div style={{ fontSize: '5rem', marginBottom: '1.5rem' }}>🌟</div>
          <h1 className="h1 gradient-text" style={{ marginBottom: '1rem' }}>Start Your Journey</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.7 }}>
            Join thousands building life-changing habits with AI-powered guidance and behavioral insights.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '2rem' }}>
            {[['🎯', 'Goal Engine', 'Auto-break goals into tasks'], ['🤖', 'AI Coach', 'Personalized in English & Tamil'], ['🔥', 'Streaks', 'Build consistency'], ['📊', 'Insights', 'Behavioral analytics']].map(([icon, title, desc]) => (
              <div key={title} className="card" style={{ textAlign: 'left', padding: '1rem' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}>{icon}</div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{title}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-card fade-in">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div style={{ marginBottom: '2rem' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👤</div>
                  <h2 className="h2" style={{ marginBottom: '0.3rem' }}>Who are you?</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    We personalize your exercise plan based on your age group.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '1.5rem' }}>
                  {AGE_GROUPS.map(group => (
                    <motion.button
                      key={group.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleGroupSelect(group.id)}
                      style={{
                        background: selectedGroup === group.id
                          ? `linear-gradient(135deg, ${group.color}22, ${group.color}11)`
                          : 'var(--bg-glass)',
                        border: `2px solid ${selectedGroup === group.id ? group.color : 'var(--border)'}`,
                        borderRadius: 'var(--radius-md)',
                        padding: '1.25rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        textAlign: 'left',
                        transition: 'var(--transition)',
                        width: '100%',
                      }}
                    >
                      <div style={{
                        width: 52, height: 52, borderRadius: '50%',
                        background: `${group.color}22`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.6rem', flexShrink: 0,
                      }}>{group.emoji}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '1rem', color: selectedGroup === group.id ? group.color : 'var(--text-primary)' }}>
                          {group.label} <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>/ {group.labelTa}</span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{group.range}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{group.desc}</div>
                      </div>
                      {selectedGroup === group.id && (
                        <div style={{ fontSize: '1.2rem', color: group.color }}>✓</div>
                      )}
                    </motion.button>
                  ))}
                </div>

                <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={handleNext}>
                  Continue: Choose Role →
                </button>
                <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '1rem' }}>
                  Already have an account?{' '}
                  <Link to="/login" style={{ color: 'var(--primary-light)', fontWeight: 600 }}>Sign in →</Link>
                </p>
              </motion.div>
            ) : step === 2 ? (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setStep(1)} style={{ marginBottom: '1rem' }}>← Back</button>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎭</div>
                <h2 className="h2" style={{ marginBottom: '0.3rem' }}>What's your role?</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Choose how you'll use the platform.</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {[
                  { id: 'user', emoji: '🏃', label: 'Wellness User', desc: 'AI exercise plans & health coaching', color: '#06B6D4' },
                  { id: 'patient', emoji: '🤒', label: 'Patient', desc: 'Under doctor care — tracked medical AI plans', color: '#10B981' },
                  { id: 'doctor', emoji: '👨‍⚕️', label: 'Doctor', desc: 'Manage patients & generate clinical AI plans', color: '#7C3AED' },
                ].map(r => (
                  <button key={r.id} onClick={() => setSelectedRole(r.id)} style={{
                    background: selectedRole === r.id ? `${r.color}18` : 'var(--bg-glass)',
                    border: `2px solid ${selectedRole === r.id ? r.color : 'var(--border)'}`,
                    borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem', textAlign: 'left', width: '100%',
                    transition: 'var(--transition)',
                  }}>
                    <span style={{ fontSize: '1.8rem' }}>{r.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: selectedRole === r.id ? r.color : 'var(--text-primary)' }}>{r.label}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{r.desc}</div>
                    </div>
                    {selectedRole === r.id && <span style={{ color: r.color, fontSize: '1.2rem' }}>✓</span>}
                  </button>
                ))}
              </div>
              <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={handleNextRole}>Continue →</button>
            </motion.div>
            ) : (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setStep(2)} style={{ marginBottom: '1rem', padding: '0.4rem 0.8rem' }}>
                    ← Back
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.3rem' }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%',
                      background: `${AGE_GROUPS.find(g => g.id === selectedGroup)?.color}22`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem',
                    }}>
                      {AGE_GROUPS.find(g => g.id === selectedGroup)?.emoji}
                    </div>
                    <h2 className="h2">Create Account ✨</h2>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    Registering as: <strong style={{ color: 'var(--primary-light)' }}>
                      {AGE_GROUPS.find(g => g.id === selectedGroup)?.label}
                    </strong>
                  </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">First Name</label>
                      <input className="form-input" placeholder="John" value={form.first_name}
                        onChange={e => setForm({ ...form, first_name: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Last Name</label>
                      <input className="form-input" placeholder="Doe" value={form.last_name}
                        onChange={e => setForm({ ...form, last_name: e.target.value })} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Username *</label>
                    <input className="form-input" placeholder="johndoe" value={form.username}
                      onChange={e => setForm({ ...form, username: e.target.value })} required autoFocus />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email *</label>
                    <input className="form-input" type="email" placeholder="john@example.com" value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Password *</label>
                    <input className="form-input" type="password" placeholder="Min. 8 characters" value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })} required minLength={8} />
                  </div>
                  <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ width: '100%', marginTop: '0.5rem' }}>
                    {loading ? 'Creating account...' : 'Create Account →'}
                  </button>
                </form>

                <div className="divider" />
                <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Already have an account?{' '}
                  <Link to="/login" style={{ color: 'var(--primary-light)', fontWeight: 600 }}>Sign in →</Link>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
