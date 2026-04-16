import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { auth } from '../api/client';
import toast from 'react-hot-toast';
import { MdEmail, MdLock, MdLocalHospital, MdVisibility, MdVisibilityOff, MdArrowBack } from 'react-icons/md';

export default function DoctorLogin() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const setUser = useStore(s => s.setUser);
  const setRole = useStore(s => s.setRole);
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await auth.login(form);
      localStorage.setItem('access_token', data.tokens.access);
      localStorage.setItem('refresh_token', data.tokens.refresh);
      setUser(data.user);
      // Force set role to doctor upon logging in here
      setRole('doctor');
      toast.success(`Welcome back, Dr. ${data.user.last_name || data.user.first_name || data.user.username}! 🩺`);
      navigate('/portal/doctor');
    } catch {
      toast.error('Invalid doctor credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" style={{ background: 'var(--bg-card)' }}>
      <div className="auth-form-side" style={{ margin: '0 auto', flex: 'none', width: '100%', maxWidth: 480, height: '100vh', display: 'flex', alignItems: 'center' }}>
        <div className="auth-card fade-in" style={{ width: '100%', borderTop: '4px solid #06B6D4' }}>
          <Link to="/login" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start', marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
            <MdArrowBack /> Back to Portal Selection
          </Link>

          <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, background: '#06B6D422', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <MdLocalHospital size={32} color="#06B6D4" />
            </div>
            <h2 className="h2" style={{ marginBottom: '0.3rem' }}>Clinician Portal</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Secure access for healthcare providers</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Provider ID or Username</label>
              <div style={{ position: 'relative' }}>
                <MdEmail style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '1.1rem' }} />
                <input className="form-input" style={{ paddingLeft: '2.5rem' }}
                  placeholder="Enter your provider username"
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

            <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ width: '100%', background: '#06B6D4', color: 'white' }}>
              {loading ? 'Authenticating...' : 'Secure Login →'}
            </button>
          </form>

          <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <MdLock style={{ verticalAlign: 'middle', marginRight: '0.2rem' }} /> HIPAA Compliant Portal • Authorized Personnel Only
          </div>
        </div>
      </div>
    </div>
  );
}
