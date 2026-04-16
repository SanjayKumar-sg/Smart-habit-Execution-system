import { useState, useEffect } from 'react';
import { social as socialApi } from '../api/client';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { MdGroupAdd, MdEmojiEvents, MdSearch, MdPersonAdd, MdCheck, MdClose, MdPerson } from 'react-icons/md';

export default function Social() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [friends, setFriends] = useState([]);
  const [pendingReceived, setPendingReceived] = useState([]);
  const [pendingSent, setPendingSent] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('leaderboard');

  const loadData = () => {
    Promise.all([
      socialApi.leaderboard(),
      socialApi.friends(),
      socialApi.challenges(),
    ]).then(([l, f, c]) => {
      setLeaderboard(Array.isArray(l.data) ? l.data : []);
      const fd = f.data || {};
      setFriends(fd.friends || []);
      setPendingReceived(fd.pending_received || []);
      setPendingSent(fd.pending_sent || []);
      setChallenges(Array.isArray(c.data) ? c.data : (c.data?.results || []));
    }).catch(() => toast.error('Failed to load social data'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleSearch = async (q) => {
    setSearchQ(q);
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const r = await socialApi.searchUsers(q);
      setSearchResults(r.data || []);
    } catch { setSearchResults([]); }
    finally { setSearching(false); }
  };

  const handleSendRequest = async (userId) => {
    try {
      await socialApi.sendRequest({ user_id: userId });
      toast.success('Friend request sent! 🤝');
      setSearchResults(prev => prev.filter(u => u.id !== userId));
      loadData();
    } catch { toast.error('Could not send request'); }
  };

  const handleRespond = async (requestId, action) => {
    try {
      await socialApi.respondRequest(requestId, { action });
      toast.success(action === 'accept' ? 'Friend request accepted! 🎉' : 'Request declined');
      loadData();
    } catch { toast.error('Failed to respond'); }
  };

  const handleJoinChallenge = async (id) => {
    try {
      await socialApi.joinChallenge(id);
      toast.success('Joined challenge! 🏆');
      loadData();
    } catch { toast.error('Already joined or error'); }
  };

  if (loading) return <div className="spinner" style={{ margin: '4rem auto' }} />;

  const pendingCount = pendingReceived.length;

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="h1">Community &amp; Social</h1>
        <p className="text-muted">Stay accountable. Compete with friends. Level up together.</p>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: '1.5rem' }}>
        {[
          ['leaderboard', '🏆 Leaderboard'],
          ['friends', `👥 Friends${pendingCount > 0 ? ` (${pendingCount})` : ''}`],
          ['challenges', '⚡ Challenges'],
        ].map(([t, label]) => (
          <button key={t} className={`tab-btn ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
            {label}
          </button>
        ))}
      </div>

      {/* Leaderboard */}
      {activeTab === 'leaderboard' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 className="h3" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MdEmojiEvents color="var(--warning)" /> Global Leaderboard
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {leaderboard.map((u, i) => (
              <motion.div key={u.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                className={`card ${i < 3 ? `rank-${i + 1}` : ''}`}
                style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ fontWeight: 800, width: 28, textAlign: 'center', fontSize: '1.1rem' }}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${u.rank}`}
                </div>
                <div className="avatar-placeholder" style={{ width: 38, height: 38 }}>
                  {(u.username || 'U')[0].toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{u.first_name || u.username}</div>
                  <div className="text-xs text-muted">Lvl {u.level} · 🔥 {u.streak_count}d streak</div>
                </div>
                <div style={{ fontWeight: 700, color: 'var(--accent)' }}>{(u.total_points || 0).toLocaleString()} pts</div>
                <button className="btn btn-ghost btn-sm" onClick={() => handleSendRequest(u.id)} title="Add Friend">
                  <MdPersonAdd size={16} />
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Friends */}
      {activeTab === 'friends' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Search */}
          <div className="card">
            <div className="h4" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MdGroupAdd color="var(--primary-light)" /> Add New Friends
            </div>
            <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
              <MdSearch style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                className="form-input"
                placeholder="Search by username…"
                value={searchQ}
                onChange={e => handleSearch(e.target.value)}
                style={{ paddingLeft: '2.25rem' }}
              />
            </div>
            <AnimatePresence>
              {searchResults.length > 0 && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {searchResults.map(u => (
                    <div key={u.id} style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-glass)', border: '1px solid var(--border)',
                    }}>
                      <div className="avatar-placeholder" style={{ width: 32, height: 32, fontSize: '0.8rem' }}>
                        {(u.username || 'U')[0].toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{u.first_name || u.username}</div>
                        <div className="text-xs text-muted">@{u.username} · Lv {u.level}</div>
                      </div>
                      <button className="btn btn-primary btn-sm" onClick={() => handleSendRequest(u.id)}>
                        <MdPersonAdd /> Add
                      </button>
                    </div>
                  ))}
                </motion.div>
              )}
              {searching && <div className="text-muted text-sm" style={{ textAlign: 'center' }}>Searching…</div>}
            </AnimatePresence>
          </div>

          {/* Pending Received */}
          {pendingReceived.length > 0 && (
            <div className="card" style={{ border: '1px solid rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.05)' }}>
              <div className="h4" style={{ marginBottom: '1rem', color: 'var(--accent)' }}>
                📩 Friend Requests ({pendingReceived.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {pendingReceived.map(fr => (
                  <div key={fr.id} style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.75rem', borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-glass)', border: '1px solid var(--border)',
                  }}>
                    <div className="avatar-placeholder" style={{ width: 38, height: 38 }}>
                      {(fr.requester?.username || 'U')[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{fr.requester?.first_name || fr.requester?.username}</div>
                      <div className="text-xs text-muted">@{fr.requester?.username} · Lv {fr.requester?.level}</div>
                    </div>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleRespond(fr.id, 'accept')}
                      style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--success)', borderColor: 'rgba(16,185,129,0.3)' }}>
                      <MdCheck /> Accept
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleRespond(fr.id, 'decline')}
                      style={{ color: 'var(--danger)' }}>
                      <MdClose />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Friends List */}
          <div className="card">
            <div className="h4" style={{ marginBottom: '1rem' }}>👥 My Friends ({friends.length})</div>
            {friends.length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <div className="empty-state-icon">🤝</div>
                <p className="text-muted text-sm">No friends yet. Start searching above!</p>
              </div>
            ) : (
              <div className="grid-2" style={{ gap: '0.75rem' }}>
                {friends.map(f => (
                  <div key={f.id} style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.875rem', borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-glass)', border: '1px solid var(--border)',
                  }}>
                    <div className="avatar-placeholder" style={{ width: 40, height: 40 }}>
                      {(f.username || 'U')[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {f.first_name || f.username}
                      </div>
                      <div className="text-xs text-muted">Lv {f.level} · {f.total_points} pts</div>
                    </div>
                    <span className="chip chip-green" style={{ fontSize: '0.65rem' }}>🔥 {f.streak_count}d</span>
                  </div>
                ))}
              </div>
            )}

            {/* Pending Sent */}
            {pendingSent.length > 0 && (
              <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                <div className="h4" style={{ marginBottom: '0.75rem', color: 'var(--text-muted)' }}>
                  ⏳ Sent Requests ({pendingSent.length})
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {pendingSent.map(fr => (
                    <span key={fr.id} className="chip" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border)' }}>
                      <MdPerson style={{ verticalAlign: 'middle' }} />
                      {fr.receiver?.first_name || fr.receiver?.username}
                      <span style={{ marginLeft: '0.3rem', color: 'var(--text-muted)', fontSize: '0.65rem' }}>pending</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Challenges */}
      {activeTab === 'challenges' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
          <div className="h3" style={{ marginBottom: '1.5rem' }}>⚡ Active Challenges</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {challenges.map(c => (
              <div key={c.id} style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontWeight: 700 }}>{c.title}</h3>
                  <span className="chip chip-cyan">{c.participant_count} joined</span>
                </div>
                <p className="text-sm text-muted" style={{ marginBottom: '1rem' }}>{c.description}</p>
                <button className="btn btn-secondary btn-sm" onClick={() => handleJoinChallenge(c.id)}>
                  Join Challenge 🏃
                </button>
              </div>
            ))}
            {challenges.length === 0 && (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <div className="empty-state-icon">⚡</div>
                <p className="text-muted">No active challenges yet.</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
