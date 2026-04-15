import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { auth } from '../api/client';
import toast from 'react-hot-toast';

export default function Register() {
  const [form, setForm] = useState({ username:'', email:'', first_name:'', last_name:'', password:'' });
  const [loading, setLoading] = useState(false);
  const setUser = useStore(s => s.setUser);
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await auth.register(form);
      localStorage.setItem('access_token', data.tokens.access);
      localStorage.setItem('refresh_token', data.tokens.refresh);
      setUser(data.user);
      toast.success('Account created! Let\'s build great habits 🚀');
      navigate('/dashboard');
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
        <div style={{ textAlign:'center', maxWidth:420 }}>
          <div style={{ fontSize:'5rem', marginBottom:'1.5rem' }}>🌟</div>
          <h1 className="h1 gradient-text" style={{ marginBottom:'1rem' }}>Start Your Journey</h1>
          <p style={{ color:'var(--text-secondary)', fontSize:'1.1rem', lineHeight:1.7 }}>
            Join thousands building life-changing habits with AI-powered guidance and behavioral insights.
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginTop:'2rem' }}>
            {[['🎯','Goal Engine','Auto-break goals into tasks'],['🤖','AI Coach','Personalized guidance'],['🔥','Streaks','Build consistency'],['📊','Insights','Behavioral analytics']].map(([icon, title, desc]) => (
              <div key={title} className="card" style={{ textAlign:'left', padding:'1rem' }}>
                <div style={{ fontSize:'1.5rem', marginBottom:'0.3rem' }}>{icon}</div>
                <div style={{ fontWeight:600, fontSize:'0.85rem' }}>{title}</div>
                <div style={{ color:'var(--text-muted)', fontSize:'0.75rem' }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-card fade-in">
          <div style={{ marginBottom:'2rem' }}>
            <h2 className="h2" style={{ marginBottom:'0.3rem' }}>Create Account ✨</h2>
            <p style={{ color:'var(--text-secondary)', fontSize:'0.9rem' }}>Free forever. No credit card needed.</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input className="form-input" placeholder="John" value={form.first_name}
                  onChange={e => setForm({...form, first_name: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input className="form-input" placeholder="Doe" value={form.last_name}
                  onChange={e => setForm({...form, last_name: e.target.value})} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Username *</label>
              <input className="form-input" placeholder="johndoe" value={form.username}
                onChange={e => setForm({...form, username: e.target.value})} required autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input className="form-input" type="email" placeholder="john@example.com" value={form.email}
                onChange={e => setForm({...form, email: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password *</label>
              <input className="form-input" type="password" placeholder="Min. 8 characters" value={form.password}
                onChange={e => setForm({...form, password: e.target.value})} required minLength={8} />
            </div>
            <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ width:'100%', marginTop:'0.5rem' }}>
              {loading ? 'Creating account...' : 'Create Account →'}
            </button>
          </form>

          <div className="divider" />
          <p style={{ textAlign:'center', fontSize:'0.875rem', color:'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color:'var(--primary-light)', fontWeight:600 }}>Sign in →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
