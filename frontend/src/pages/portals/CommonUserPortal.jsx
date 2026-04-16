import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { auth as authApi, habits as habitsApi } from '../../api/client';
import { useStore } from '../../store/useStore';
import { chatWithCoach, analyzeAndModifyExercises } from '../../services/gemini';
import toast from 'react-hot-toast';
import { MdAutoAwesome, MdSmartToy, MdCalendarMonth, MdFitnessCenter, MdHealing } from 'react-icons/md';

export default function CommonUserPortal() {
  const { user, ageGroup, language, medicalRecord: cachedMedical } = useStore();
  const [aiPlan, setAiPlan] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [schedule, setSchedule] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'assistant', content: "👋 Hi! I'm your AI Health Coach. Ask me anything about exercise, wellness, or healthy habits!" }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const [medications, setMedications] = useState([]);
  const [newMed, setNewMed] = useState('');
  const [activeTab, setActiveTab] = useState('coach');
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    habitsApi.today().then(r => {
      setSchedule(r.data?.habits || []);
    }).catch(() => {});
    authApi.getMedications().then(r => setMedications(r.data || [])).catch(() => {});
    authApi.getDoctors().then(r => setDoctors(r.data || [])).catch(() => {});
  }, []);

  const generatePlan = async () => {
    setLoadingPlan(true);
    try {
      const plan = await analyzeAndModifyExercises(
        cachedMedical || { conditions: '', fitness_level: 'beginner' },
        ageGroup || 'adult',
        language
      );
      setAiPlan(plan);
      toast.success('AI Exercise Plan ready! 🤖');
    } catch { toast.error('Could not generate plan. Check your API key.'); }
    finally { setLoadingPlan(false); }
  };

  const handleChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    const newHistory = [...chatHistory, { role: 'user', content: userMsg }];
    setChatHistory(newHistory);
    setChatLoading(true);
    try {
      const reply = await chatWithCoach(userMsg, { user, ageGroup, language }, newHistory.slice(-6));
      setChatHistory(h => [...h, { role: 'assistant', content: reply }]);
    } catch { setChatHistory(h => [...h, { role: 'assistant', content: "Sorry, I couldn't respond. Please try again." }]); }
    finally { setChatLoading(false); }
  };

  const handleTakeMed = async (id) => {
    try {
      await authApi.takeMedication(id);
      const r = await authApi.getMedications();
      setMedications(r.data || []);
      toast.success('+5 pts! Medication logged ✅');
    } catch { toast.error('Failed to log medication'); }
  };

  const handleAddMed = async () => {
    if (!newMed.trim()) return;
    try {
      await authApi.addMedication({ medication_name: newMed.trim() });
      setNewMed('');
      const r = await authApi.getMedications();
      setMedications(r.data || []);
      toast.success('Medication added!');
    } catch { toast.error('Failed to add medication'); }
  };

  const handleRequestDoctor = async (doctorId) => {
    try {
      await authApi.requestDoctor({ doctor_id: doctorId });
      toast.success('Care request sent to doctor! 📩');
      const r = await authApi.getDoctors();
      setDoctors(r.data || []);
    } catch { toast.error('Failed to send request'); }
  };

  const displayName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.username || 'User';

  return (
    <div className="fade-in" style={{ maxWidth: 960, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="h1">🏃 Wellness Hub</h1>
        <p className="text-muted">Your personal AI-powered wellness space — exercise plans, health coach, and medication tracking.</p>
      </div>

      {/* Welcome Card */}
      <motion.div className="card" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg,rgba(6,182,212,0.12),rgba(124,58,237,0.08))', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
        <div className="avatar-placeholder" style={{ width: 64, height: 64, fontSize: '1.4rem', border: '3px solid var(--secondary)' }}>
          {(displayName[0] || '?').toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <h2 className="h2">Welcome, {displayName}!</h2>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.3rem', flexWrap: 'wrap' }}>
            <span className="chip chip-cyan">💪 Wellness Member</span>
            <span className="chip chip-purple">Level {user?.level || 1}</span>
            <span className="chip chip-amber">⭐ {user?.total_points || 0} pts</span>
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 800, fontSize: '2rem', color: 'var(--success)' }}>{user?.streak_count || 0}</div>
          <div className="text-xs text-muted">Day Streak 🔥</div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: '1.5rem' }}>
        {[['coach', '🤖 AI Coach'], ['plan', '🏋️ Exercise Plan'], ['schedule', '📅 Today\'s Schedule'], ['medication', '💊 Medications'], ['findDoctor', '🩺 Find Doctor']].map(([t, label]) => (
          <button key={t} className={`tab-btn ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>{label}</button>
        ))}
      </div>

      {/* AI Coach Chat */}
      {activeTab === 'coach' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
          <div className="h3" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MdSmartToy color="var(--primary-light)" /> AI Health Coach
          </div>
          <div style={{ height: 340, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem', padding: '0.5rem' }}>
            {chatHistory.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div className={`chat-bubble ${m.role === 'user' ? 'user' : 'assistant'}`} style={{ maxWidth: '80%' }}>
                  {m.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div className="chat-bubble assistant" style={{ display: 'flex', gap: '0.3rem' }}>
                  <span style={{ animation: 'pulse 1s infinite' }}>•</span>
                  <span style={{ animation: 'pulse 1s infinite 0.2s' }}>•</span>
                  <span style={{ animation: 'pulse 1s infinite 0.4s' }}>•</span>
                </div>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <input className="form-input" value={chatInput} onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleChat()}
              placeholder="Ask about exercises, habits, nutrition…" />
            <button className="btn btn-primary" onClick={handleChat} disabled={chatLoading || !chatInput.trim()}>Send</button>
          </div>
        </motion.div>
      )}

      {/* Exercise Plan */}
      {activeTab === 'plan' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {!aiPlan && !loadingPlan && (
            <div className="card empty-state">
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🤖</div>
              <div className="h3" style={{ marginBottom: '0.5rem' }}>No Exercise Plan Yet</div>
              <p className="text-muted" style={{ marginBottom: '1.5rem' }}>Generate a personalized AI workout plan based on your profile and fitness goals.</p>
              <button className="btn btn-primary btn-lg" onClick={generatePlan}>
                <MdAutoAwesome /> Generate My Exercise Plan
              </button>
            </div>
          )}
          {loadingPlan && (
            <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
              <div className="spinner" style={{ margin: '0 auto 1rem' }} />
              <p className="text-muted">AI is creating your personalized plan…</p>
            </div>
          )}
          {aiPlan && !loadingPlan && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div className="h3">🏋️ Your Personalized Exercise Plan</div>
                <button className="btn btn-secondary btn-sm" onClick={generatePlan}>🔄 Refresh</button>
              </div>
              <div className="nudge-banner" style={{ marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '1.5rem' }}>💡</span>
                <p style={{ lineHeight: 1.6, fontSize: '0.9rem' }}>{aiPlan.summary}</p>
              </div>
              <div className="grid-2" style={{ gap: '0.875rem', marginBottom: '1rem' }}>
                {(aiPlan.ai_suggested_exercises || aiPlan.exercises || []).map((ex, i) => (
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
              {aiPlan.tips?.map((tip, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                  <span style={{ color: 'var(--success)' }}>✓</span><span>{tip}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Today's Schedule */}
      {activeTab === 'schedule' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
          <div className="h3" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MdCalendarMonth color="var(--secondary)" /> Today's Habit Schedule
          </div>
          {schedule.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📅</div>
              <p className="text-muted">No habits scheduled for today. Go to Goals to add some!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {schedule.map(h => (
                <div key={h.id} className="habit-card" style={{ '--habit-color': '#06B6D4' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{h.title}</div>
                      <div className="text-xs text-muted">{h.duration_minutes} min · {h.frequency} · {h.difficulty}</div>
                    </div>
                    <span className={`chip ${h.streak_count > 3 ? 'chip-green' : 'chip-cyan'}`}>🔥 {h.streak_count}d</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Medication Tracker */}
      {activeTab === 'medication' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card">
            <div className="h3" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MdHealing color="var(--accent)" /> Today's Medications
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <input className="form-input" value={newMed} onChange={e => setNewMed(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddMed()}
                placeholder="Add medication (e.g. Metformin 500mg)" />
              <button className="btn btn-primary" onClick={handleAddMed} disabled={!newMed.trim()}>Add</button>
            </div>
            {medications.length === 0 ? (
              <p className="text-muted text-sm">No medications for today. Add one above.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {medications.map(med => (
                  <div key={med.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.875rem 1rem', borderRadius: 'var(--radius-sm)',
                    background: med.taken ? 'rgba(16,185,129,0.08)' : 'var(--bg-glass)',
                    border: `1px solid ${med.taken ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>{med.taken ? '✅' : '💊'}</span>
                      <div>
                        <div style={{ fontWeight: 600 }}>{med.medication_name}</div>
                        {med.dose && <div className="text-xs text-muted">{med.dose}</div>}
                        {med.taken && <div className="text-xs" style={{ color: 'var(--success)' }}>Taken at {new Date(med.taken_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>}
                      </div>
                    </div>
                    {!med.taken && (
                      <button className="btn btn-secondary btn-sm" onClick={() => handleTakeMed(med.id)}>
                        Mark Taken (+5 pts)
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="card" style={{ background: 'linear-gradient(135deg,rgba(245,158,11,0.1),rgba(16,185,129,0.05))' }}>
            <div className="h4" style={{ marginBottom: '0.5rem' }}>💊 Medication Adherence Module</div>
            <p className="text-muted text-sm">Track your daily medication intake and earn points for consistency. Consistent medication adherence is logged to your health record and earns you +5 pts per dose!</p>
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
            Need clinical guidance? Send a care request to a licensed professional to review your data and assign structured medical exercise plans.
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
