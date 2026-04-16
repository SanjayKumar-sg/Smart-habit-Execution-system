import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { auth } from '../api/client';
import toast from 'react-hot-toast';
import { MdEmail, MdLock, MdAdminPanelSettings, MdVisibility, MdVisibilityOff, MdArrowBack } from 'react-icons/md';

export default function AdminLogin() {
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
      // Force set role to admin upon logging in here
      setRole('admin');
      toast.success(`Admin access granted. Welcome ${data.user.username}. ⚙️`);
      navigate('/portal/admin');
    } catch {
      toast.error('Admin authentication failed. Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" style={{ background: '#0f172a' }}>
      <div className="auth-form-side" style={{ margin: '0 auto', flex: 'none', width: '100%', maxWidth: 480, height: '100vh', display: 'flex', alignItems: 'center' }}>
        <div className="auth-card fade-in" style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', borderTop: '4px solid #F59E0B' }}>
          <Link to="/login" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start', marginBottom: '1.5rem', color: '#94a3b8' }}>
            <MdArrowBack /> Back to Portal Selection
          </Link>

          <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, background: '#F59E0B22', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <MdAdminPanelSettings size={32} color="#F59E0B" />
            </div>
            <h2 className="h2" style={{ marginBottom: '0.3rem', color: 'white' }}>System Administrator</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Platform control access</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ color: '#cbd5e1' }}>Admin ID</label>
              <div style={{ position: 'relative' }}>
                <MdEmail style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '1.1rem' }} />
                <input className="form-input" style={{ paddingLeft: '2.5rem', background: '#0f172a', borderColor: '#334155', color: 'white' }}
                  placeholder="Enter admin ID"
                  value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
                  required autoFocus />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ color: '#cbd5e1' }}>Security Credential</label>
              <div style={{ position: 'relative' }}>
                <MdLock style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '1.1rem' }} />
                <input className="form-input" style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem', background: '#0f172a', borderColor: '#334155', color: 'white' }}
                  type={showPw ? 'text' : 'password'} placeholder="Enter security key"
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  required />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                  {showPw ? <MdVisibilityOff /> : <MdVisibility />}
                </button>
              </div>
            </div>

            <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ width: '100%', background: '#F59E0B', color: '#0f172a', fontWeight: 800 }}>
              {loading ? 'Authenticating...' : 'Authenticate →'}
            </button>
          </form>

          <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.75rem', color: '#64748b' }}>
            <MdLock style={{ verticalAlign: 'middle', marginRight: '0.2rem' }} /> Restricted System Access • Level 5 Clearance Required
          </div>
        </div>
      </div>
    </div>
  );
}
