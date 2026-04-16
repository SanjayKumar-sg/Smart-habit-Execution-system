import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { auth } from '../api/client';
import toast from 'react-hot-toast';
import { MdEmail, MdLock, MdVisibility, MdVisibilityOff, MdPerson, MdLocalHospital, MdAdminPanelSettings, MdArrowForward } from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';

export default function Login() {
  const [step, setStep] = useState('select-portal'); // 'select-portal' or 'patient-login'
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const setUser = useStore(s => s.setUser);
  const setRole = useStore(s => s.setRole);
  const navigate = useNavigate();

  const handlePortalSelect = (type) => {
    if (type === 'patient') {
      setStep('patient-login');
    } else if (type === 'doctor') {
      navigate('/login/doctor');
    } else if (type === 'admin') {
      navigate('/login/admin');
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await auth.login(form);
      localStorage.setItem('access_token', data.tokens.access);
      localStorage.setItem('refresh_token', data.tokens.refresh);
      setUser(data.user);
      setRole('patient'); // Ensure role is patient
      toast.success(`Welcome back, ${data.user.first_name || data.user.username}! 🎉`);
      navigate('/dashboard');
    } catch {
      toast.error('Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-hero">
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <div style={{ fontSize: '5rem', marginBottom: '1.5rem' }}>⚡</div>
          <h1 className="h1 gradient-text" style={{ marginBottom: '1rem' }}>Smart Habit Execution System</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.7 }}>
            Convert health awareness into consistent daily action. AI-powered, adaptive, and engaging.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem', flexWrap: 'wrap' }}>
            {['🎯 Goal Engine', '🧠 AI Coach', '🎮 Gamified', '📊 Analytics'].map(item => (
              <span key={item} className="chip chip-purple">{item}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-card fade-in">
          <AnimatePresence mode="wait">
            {step === 'select-portal' && (
              <motion.div key="select" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div style={{ marginBottom: '2rem' }}>
                  <h2 className="h2" style={{ marginBottom: '0.3rem' }}>Select Portal</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Choose your login destination</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <button onClick={() => handlePortalSelect('patient')} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem', border: '2px solid transparent', cursor: 'pointer', textAlign: 'left', background: 'var(--bg-glass)', transition: '0.2s', ':hover': { borderColor: 'var(--primary-light)' } }}>
                    <div style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981', padding: '0.75rem', borderRadius: '50%' }}>
                      <MdPerson size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#10B981' }}>Patient / User</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Personal health tracking</div>
                    </div>
                    <MdArrowForward color="var(--text-muted)" />
                  </button>

                  <button onClick={() => handlePortalSelect('doctor')} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem', border: '2px solid transparent', cursor: 'pointer', textAlign: 'left', background: 'var(--bg-glass)', transition: '0.2s' }}>
                    <div style={{ background: 'rgba(6,182,212,0.1)', color: '#06B6D4', padding: '0.75rem', borderRadius: '50%' }}>
                      <MdLocalHospital size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#06B6D4' }}>Doctor Portal</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Access clinical dashboard</div>
                    </div>
                    <MdArrowForward color="var(--text-muted)" />
                  </button>

                  <button onClick={() => handlePortalSelect('admin')} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem', border: '2px solid transparent', cursor: 'pointer', textAlign: 'left', background: 'var(--bg-glass)', transition: '0.2s' }}>
                    <div style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B', padding: '0.75rem', borderRadius: '50%' }}>
                      <MdAdminPanelSettings size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#F59E0B' }}>System Admin</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Platform management</div>
                    </div>
                    <MdArrowForward color="var(--text-muted)" />
                  </button>
                </div>
                
                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    New patient?{' '}
                    <Link to="/register" style={{ color: 'var(--primary-light)', fontWeight: 600 }}>Create an account →</Link>
                  </p>
                </div>
              </motion.div>
            )}

            {step === 'patient-login' && (
              <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setStep('select-portal')} style={{ marginBottom: '1.5rem', marginLeft: '-0.5rem', color: 'var(--text-muted)' }}>
                  ← Back
                </button>
                
                <div style={{ marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.3rem' }}>
                    <div style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981', padding: '0.5rem', borderRadius: '50%' }}>
                      <MdPerson size={20} />
                    </div>
                    <h2 className="h2">Patient Login</h2>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Welcome back to your health journey</p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div className="form-group">
                    <label className="form-label">Username</label>
                    <div style={{ position: 'relative' }}>
                      <MdEmail style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '1.1rem' }} />
                      <input className="form-input" style={{ paddingLeft: '2.5rem' }}
                        placeholder="Enter your username"
                        value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
                        required autoFocus />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <div style={{ position: 'relative' }}>
                      <MdLock style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '1.1rem' }} />
                      <input className="form-input" style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                        type={showPw ? 'text' : 'password'} placeholder="Enter your password"
                        value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                        required />
                      <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                        {showPw ? <MdVisibilityOff /> : <MdVisibility />}
                      </button>
                    </div>
                  </div>

                  <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ width: '100%', background: '#10B981', borderColor: '#10B981' }}>
                    {loading ? 'Authenticating...' : 'Sign In →'}
                  </button>
                </form>

                <div className="divider" />
                <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Don't have an account?{' '}
                  <Link to="/register" style={{ color: 'var(--primary-light)', fontWeight: 600 }}>Create one →</Link>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
