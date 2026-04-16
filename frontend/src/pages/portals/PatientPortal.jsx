/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { auth as authApi, habits as habitsApi, insights as insightsApi } from '../../api/client';
import { analyzeAndModifyExercises } from '../../services/gemini';
import { useStore } from '../../store/useStore';
import ProgressRing from '../../components/ProgressRing';
import toast from 'react-hot-toast';
import { MdAutoAwesome, MdMedicalServices, MdTrendingUp, MdEmojiEvents, MdFitnessCenter } from 'react-icons/md';

export default function PatientPortal() {
  const { user, ageGroup, language, medicalRecord: cachedMedical, profilePhoto } = useStore();
  const [profile, setProfile] = useState(null);
  const [dashData, setDashData] = useState(null);
  const [medRecord, setMedRecord] = useState(cachedMedical);
  const [badges, setBadges] = useState([]);
  const [insights, setInsights] = useState([]);
  const [aiPlan, setAiPlan] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('health');
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    Promise.all([
      authApi.profile(),
      habitsApi.dashboard(),
      authApi.medicalRecord(),
      authApi.badges(),
      insightsApi.list(),
      authApi.getDoctors(),
    ]).then(([p, d, m, b, ins, docs]) => {
      setProfile(p.data);
      setDashData(d.data);
      setMedRecord(m.data);
      setBadges(b.data.slice(0, 6));
      setInsights(ins.data.slice(0, 4));
      setDoctors(docs.data || []);
    }).catch(() => { }).finally(() => setLoading(false));
  }, []);

  const generatePlan = async () => {
    setLoadingPlan(true);
    try {
      const plan = await analyzeAndModifyExercises(medRecord, ageGroup, language);
      setAiPlan(plan);
      toast.success('Your AI health plan is ready! 🤖');
    } catch { toast.error('Could not generate plan'); }
    finally { setLoadingPlan(false); }
  };

  const handleRequestDoctor = async (doctorId) => {
    try {
      await authApi.requestDoctor({ doctor_id: doctorId });
      toast.success('Care request sent to doctor! 📩');
      const r = await authApi.getDoctors();
      setDoctors(r.data || []);
    } catch { toast.error('Failed to send request'); }
  };

  if (loading) return <div className="spinner" style={{ margin: '4rem auto' }} />;

  const progress = dashData?.today?.progress_percent || 0;
  const streak = dashData?.streak || 0;
  const displayName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || profile?.username || (user ? [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username : 'Patient');
  const ageLabel = { child: '👶 Child', adult: '💪 Adult', senior: '🧓 Senior' };

  return (
    <div className="fade-in" style={{ maxWidth: 1000, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="h1" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          🏥 Patient Health Portal
        </h1>
        <p className="text-muted">Your personal health dashboard, progress, AI exercise plan, and achievements.</p>
      </div>

      {/* Patient Card */}
      <motion.div className="card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(6,182,212,0.08))', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}
        initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        {profilePhoto ? (
          <img src={profilePhoto} alt="avatar" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary-light)' }} />
        ) : (
          <div className="avatar-placeholder" style={{ width: 72, height: 72, fontSize: '1.5rem', border: '3px solid var(--primary-light)' }}>
            {(displayName[0] || '?').toUpperCase()}
          </div>
        )}
        <div style={{ flex: 1 }}>
          <h2 className="h2">{displayName}</h2>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.3rem', flexWrap: 'wrap' }}>
            <span className="chip chip-purple">{ageLabel[ageGroup] || '💪 Adult'}</span>
            <span className="chip chip-cyan">Level {profile?.level || 1}</span>
            <span className="chip chip-amber">🔥 {streak}d Streak</span>
            {medRecord?.conditions && <span className="chip chip-red">⚕️ {medRecord.conditions.split(',')[0]}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <ProgressRing percent={progress} label={`${progress}%`} sublabel="today" />
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.8rem', color: 'var(--accent)' }}>{profile?.total_points?.toLocaleString() || 0}</div>
            <div className="text-xs text-muted">Total Points</div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: '1.5rem' }}>
        {[['health', '❤️ Health Overview'], ['plan', '🤖 AI Exercise Plan'], ['progress', '📈 Progress'], ['achievements', '🏆 Achievements'], ['findDoctor', '🩺 Find Doctor']].map(([t, label]) => (
          <button key={t} className={`tab-btn ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>{label}</button>
        ))}
      </div>

      {/* Health Overview */}
      {activeTab === 'health' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card">
            <div className="h3" style={{ marginBottom: '1.25rem' }}>Your Vitals</div>
            <div className="grid-3" style={{ gap: '1rem' }}>
              {[
                { icon: '💓', label: 'Resting HR', value: medRecord?.resting_heart_rate ? `${medRecord.resting_heart_rate} BPM` : '–' },
                { icon: '🩺', label: 'Blood Pressure', value: medRecord?.blood_pressure_systolic ? `${medRecord.blood_pressure_systolic}/${medRecord.blood_pressure_diastolic}` : '–' },
                { icon: '🩸', label: 'Blood Glucose', value: medRecord?.blood_glucose ? `${medRecord.blood_glucose} mg/dL` : '–' },
                { icon: '🏃', label: 'Fitness Level', value: medRecord?.fitness_level || 'Not set' },
                { icon: '⚕️', label: 'Conditions', value: medRecord?.conditions || 'None' },
                { icon: '💊', label: 'Medications', value: medRecord?.medications || 'None' },
              ].map(v => (
                <div key={v.label} style={{ background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)', padding: '1rem', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '1.4rem', marginBottom: '0.25rem' }}>{v.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{v.value}</div>
                  <div className="text-xs text-muted">{v.label}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
              <Link to="/medical" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MdMedicalServices /> Update Medical Record
              </Link>
              <button className="btn btn-primary" onClick={generatePlan} disabled={loadingPlan}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MdAutoAwesome /> {loadingPlan ? 'Generating…' : 'Generate AI Exercise Plan'}
              </button>
            </div>
          </div>
          {/* Insights */}
          {insights.length > 0 && (
            <div className="card">
              <div className="h3" style={{ marginBottom: '1rem' }}>🧠 AI Insights for You</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {insights.map(ins => (
                  <div key={ins.id} className="nudge-banner" style={{ borderLeft: `4px solid ${ins.is_positive ? 'var(--success)' : 'var(--danger)'}` }}>
                    <span style={{ fontSize: '1.3rem' }}>{ins.icon}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{ins.title}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>{ins.body}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* AI Plan */}
      {activeTab === 'plan' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {!aiPlan && !loadingPlan && (
            <div className="card empty-state">
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🤖</div>
              <div className="h3" style={{ marginBottom: '0.5rem' }}>No AI Plan Yet</div>
              <p className="text-muted" style={{ marginBottom: '1.5rem' }}>Generate a personalized exercise plan based on your medical records and age group.</p>
              <button className="btn btn-primary btn-lg" onClick={generatePlan} disabled={loadingPlan}>
                <MdAutoAwesome /> Generate My AI Exercise Plan
              </button>
            </div>
          )}
          {loadingPlan && (
            <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
              <div className="spinner" style={{ margin: '0 auto 1rem' }} />
              <p className="text-muted">AI is analyzing your health profile…</p>
            </div>
          )}
          {aiPlan && !loadingPlan && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div className="h3">Your Personalized Exercise Plan</div>
                <button className="btn btn-secondary btn-sm" onClick={generatePlan}>🔄 Refresh</button>
              </div>
              <div className="nudge-banner" style={{ marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '1.5rem' }}>💡</span>
                <p style={{ lineHeight: 1.6, fontSize: '0.9rem' }}>{aiPlan.summary}</p>
              </div>
              <div className="grid-2" style={{ gap: '0.875rem', marginBottom: '1rem' }}>
                {aiPlan.exercises?.map((ex, i) => (
                  <motion.div key={i} className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                    style={{ padding: '1rem', borderLeft: `4px solid ${ex.intensity === 'low' ? '#10B981' : ex.intensity === 'medium' ? '#F59E0B' : '#EF4444'}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
                      <span style={{ fontSize: '1.3rem' }}>{ex.emoji || '🏃'}</span>
                      <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{ex.name}</span>
                    </div>
                    <div className="text-xs" style={{ color: 'var(--secondary)', marginBottom: '0.25rem' }}>⏱ {ex.duration}</div>
                    <div className="text-xs text-muted">{ex.reason}</div>
                  </motion.div>
                ))}
              </div>
              {aiPlan.avoid?.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontWeight: 600, color: 'var(--danger)', marginBottom: '0.4rem', fontSize: '0.875rem' }}>⚠ Exercises to Avoid</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {aiPlan.avoid.map((a, i) => <span key={i} className="chip chip-red">{a}</span>)}
                  </div>
                </div>
              )}
              {aiPlan.tips?.map((tip, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                  <span style={{ color: 'var(--success)' }}>✓</span><span>{tip}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Progress */}
      {activeTab === 'progress' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="grid-4" style={{ gap: '1rem' }}>
            {[
              { icon: '🎯', label: 'Today\'s Progress', value: `${progress}%`, color: '#7C3AED' },
              { icon: '🔥', label: 'Day Streak', value: `${streak}d`, color: '#EF4444' },
              { icon: '⭐', label: 'Total Points', value: (profile?.total_points || 0).toLocaleString(), color: '#F59E0B' },
              { icon: '🏅', label: 'Level', value: profile?.level || 1, color: '#06B6D4' },
            ].map((s, i) => (
              <motion.div key={s.label} className="stat-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <div className="stat-icon" style={{ background: `${s.color}22` }}>{s.icon}</div>
                <div className="stat-value gradient-text">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Achievements */}
      {activeTab === 'achievements' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
          <div className="h3" style={{ marginBottom: '1.5rem' }}>🏆 Your Achievements</div>
          <div className="grid-3" style={{ gap: '1rem' }}>
            {badges.map(b => (
              <motion.div key={b.id} className="achievement-card" whileHover={{ scale: 1.05 }}>
                <div className="achievement-icon">{b.badge.icon}</div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{b.badge.name}</div>
                <div className="text-xs text-muted" style={{ textTransform: 'capitalize' }}>{b.badge.rarity}</div>
              </motion.div>
            ))}
            {badges.length === 0 && (
              <div style={{ gridColumn: 'span 3', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎖️</div>
                <p>Complete more habits to earn badges!</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Find Doctor */}
      {activeTab === 'findDoctor' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
          <div className="h3" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MdFitnessCenter color="var(--primary)" /> Find a Doctor
          </div>
          <p className="text-muted text-sm" style={{ marginBottom: '1.5rem' }}>
            Looking to switch or find a primary care doctor? Send a care request to a licensed professional to review your data and assign structured medical exercise plans.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {doctors.length === 0 ? (
              <p className="text-muted">No doctors available on the platform yet.</p>
            ) : (
              doctors.map(doc => (
                <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-glass)', border: '1px solid var(--border)' }}>
                  <div className="avatar-placeholder" style={{ width: 48, height: 48, fontSize: '1.2rem' }}>
                    {(doc.first_name?.[0] || doc.username?.[0] || 'D').toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>Dr. {[doc.first_name, doc.last_name].join(' ').trim() || doc.username}</div>
                    <div className="text-xs text-muted" style={{ marginBottom: '0.5rem' }}>@{doc.username}</div>
                    
                    {doc.relationship_status === 'pending' ? (
                      <span className="chip chip-amber" style={{ fontSize: '0.7rem' }}>⏳ Request Pending</span>
                    ) : doc.relationship_status === 'accepted' ? (
                      <span className="chip chip-green" style={{ fontSize: '0.7rem' }}>✅ Your Doctor</span>
                    ) : (
                      <button className="btn btn-primary btn-sm" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }} onClick={() => handleRequestDoctor(doc.id)}>
                        Send Request
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
