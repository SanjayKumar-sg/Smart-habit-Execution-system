import { useState, useEffect } from 'react';
import { social as socialApi } from '../api/client';
import toast from 'react-hot-toast';
import { MdGroupAdd, MdEmojiEvents } from 'react-icons/md';

export default function Social() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [friends, setFriends] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      socialApi.leaderboard(),
      socialApi.friends(),
      socialApi.challenges()
    ]).then(([l, f, c]) => {
      setLeaderboard(Array.isArray(l.data) ? l.data : (l.data?.results || []));
      setFriends(Array.isArray(f.data) ? f.data : (f.data?.results || []));
      setChallenges(Array.isArray(c.data) ? c.data : (c.data?.results || []));
    }).catch(() => toast.error('Failed to load social data'))
      .finally(() => setLoading(false));
  }, []);

  const handleJoinChallenge = async (id) => {
    try {
      await socialApi.joinChallenge(id);
      toast.success('Joined challenge!');
      const c = await socialApi.challenges();
      setChallenges(c.data);
    } catch { toast.error('Already joined or error'); }
  };

  if (loading) return <div className="spinner" style={{ margin: '4rem auto' }} />;

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="h1">Community & Social</h1>
        <p className="text-muted">Stay accountable. Compete with friends. Level up together.</p>
      </div>

      <div className="grid-2" style={{ gap: '2rem' }}>
        {/* Leaderboard */}
        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
            <h2 className="h3 flex align-center gap-2"><MdEmojiEvents color="var(--warning)" /> Global Leaderboard</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {leaderboard.map((u, i) => (
              <div key={u.id} className={`card ${i < 3 ? `rank-${i+1}` : ''}`} style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem', border: i >= 3 ? '1px solid transparent' : undefined }}>
                <div style={{ fontWeight: 800, width: 24, textAlign: 'center', color: i < 3 ? 'inherit' : 'var(--text-muted)' }}>#{u.rank}</div>
                <div className="avatar-placeholder" style={{ width: 36, height: 36 }}>{u.username[0].toUpperCase()}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{u.first_name || u.username}</div>
                  <div className="text-xs text-muted">Lvl {u.level} • {u.streak_count}🔥 streak</div>
                </div>
                <div style={{ fontWeight: 700 }}>{u.total_points}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Challenges */}
          <div className="card">
            <h2 className="h3" style={{ marginBottom: '1.5rem' }}>Active Challenges</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {challenges.map(c => (
                <div key={c.id} style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontWeight: 600 }}>{c.title}</h3>
                    <span className="chip chip-cyan">{c.participant_count} joined</span>
                  </div>
                  <p className="text-sm text-muted" style={{ marginBottom: '1rem' }}>{c.description}</p>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleJoinChallenge(c.id)}>Join Challenge</button>
                </div>
              ))}
              {challenges.length === 0 && <p className="text-muted text-sm">No active challenges.</p>}
            </div>
          </div>

          {/* Friends */}
          <div className="card">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
              <h2 className="h3">Friends ({friends.length})</h2>
              <button className="btn btn-ghost btn-icon"><MdGroupAdd size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexWrap:'wrap', gap: '1rem' }}>
              {friends.map(f => (
                <div key={f.id} style={{ display:'flex', alignItems:'center', gap:'0.5rem', background:'var(--bg-surface)', padding:'0.5rem 1rem', borderRadius:'99px' }}>
                  <div className="avatar-placeholder" style={{ width:24, height:24, fontSize:'0.7rem' }}>{f.username[0].toUpperCase()}</div>
                  <span style={{ fontSize:'0.9rem', fontWeight:500 }}>{f.first_name || f.username}</span>
                </div>
              ))}
              {friends.length === 0 && <p className="text-muted text-sm">No friends added yet.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
