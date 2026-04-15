import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { auth } from '../api/client';
import toast from 'react-hot-toast';
import { MdEmail, MdLock, MdVisibility, MdVisibilityOff } from 'react-icons/md';

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const setUser = useStore(s => s.setUser);
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await auth.login(form);
      localStorage.setItem('access_token', data.tokens.access);
      localStorage.setItem('refresh_token', data.tokens.refresh);
      setUser(data.user);
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
        <div style={{ textAlign:'center', maxWidth:420 }}>
          <div style={{ fontSize:'5rem', marginBottom:'1.5rem' }}>⚡</div>
          <h1 className="h1 gradient-text" style={{ marginBottom:'1rem' }}>Smart Habit Execution System</h1>
          <p style={{ color:'var(--text-secondary)', fontSize:'1.1rem', lineHeight:1.7 }}>
            Convert health awareness into consistent daily action. AI-powered, adaptive, and engaging.
          </p>
          <div style={{ display:'flex', gap:'1rem', justifyContent:'center', marginTop:'2rem', flexWrap:'wrap' }}>
            {['🎯 Goal Engine','🧠 AI Coach','🎮 Gamified','📊 Analytics'].map(item => (
              <span key={item} className="chip chip-purple">{item}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-card fade-in">
          <div style={{ marginBottom:'2rem' }}>
            <h2 className="h2" style={{ marginBottom:'0.3rem' }}>Welcome back 👋</h2>
            <p style={{ color:'var(--text-secondary)', fontSize:'0.9rem' }}>Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <div style={{ position:'relative' }}>
                <MdEmail style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', fontSize:'1.1rem' }} />
                <input className="form-input" style={{ paddingLeft:'2.5rem' }}
                  placeholder="Enter your username"
                  value={form.username} onChange={e => setForm({...form, username: e.target.value})}
                  required autoFocus />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position:'relative' }}>
                <MdLock style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', fontSize:'1.1rem' }} />
                <input className="form-input" style={{ paddingLeft:'2.5rem', paddingRight:'2.5rem' }}
                  type={showPw ? 'text' : 'password'} placeholder="Enter your password"
                  value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                  required />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer' }}>
                  {showPw ? <MdVisibilityOff /> : <MdVisibility />}
                </button>
              </div>
            </div>

            <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ width:'100%' }}>
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>

          <div className="divider" />
          <p style={{ textAlign:'center', fontSize:'0.875rem', color:'var(--text-secondary)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color:'var(--primary-light)', fontWeight:600 }}>Create one →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
