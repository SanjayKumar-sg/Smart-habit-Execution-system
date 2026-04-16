/* eslint-disable no-unused-vars, react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { habits as habitsApi, insights as insightsApi } from '../api/client';
import { useStore } from '../store/useStore';
import { modifyExerciseByMood } from '../services/gemini';
import ProgressRing from '../components/ProgressRing';
import { MdAdd, MdArrowForward, MdAutoAwesome } from 'react-icons/md';
import toast from 'react-hot-toast';

const MOODS = [
  { v: 'great', e: '😊', label: 'Great' },
  { v: 'good', e: '🙂', label: 'Good' },
  { v: 'neutral', e: '😐', label: 'Neutral' },
  { v: 'bad', e: '😕', label: 'Bad' },
  { v: 'terrible', e: '😞', label: 'Terrible' },
];

const cardVariants = { hidden: { opacity: 0, y: 20 }, visible: i => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }) };

function speakNotification(text, lang = 'en') {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang === 'ta' ? 'ta-IN' : 'en-US';
  utter.rate = 0.95;
  window.speechSynthesis.speak(utter);
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [todayHabits, setTodayHabits] = useState([]);
  const [insights, setInsights] = useState([]);
  const [selectedMood, setSelectedMood] = useState('');
  const [loading, setLoading] = useState(true);
  const [moodLoading, setMoodLoading] = useState(false);
  const [moodPlan, setMoodPlan] = useState(null);
  const [programTrack, setProgramTrack] = useState([
    { id: 1, title: 'Day 1: Initial Assessment & Light Mobility', unlocked: true, completed: false, isDoctor: true },
    { id: 2, title: 'Day 2: Core Stability & Hydration Focus', unlocked: false, completed: false, isAI: true },
    { id: 3, title: 'Day 3: Progressive Strength Training', unlocked: false, completed: false, isDoctor: true },
    { id: 4, title: 'Day 4: Cardio Endurance & Recovery', unlocked: false, completed: false, isAI: true },
  ]);
  const [isMerged, setIsMerged] = useState(false);
  const [mergePlan, setMergePlan] = useState(null);
  const [mergeLoading, setMergeLoading] = useState(false);

  const { user, ageGroup, language, profilePhoto, role } = useStore();

  useEffect(() => {
    Promise.all([
      habitsApi.dashboard(),
      habitsApi.today(),
      insightsApi.list(),
    ]).then(([dash, today, ins]) => {
      const dashData = dash.data;
      setData(dashData);
      const habits = Array.isArray(today.data) ? today.data : (today.data?.habits || today.data?.results || []);
      setTodayHabits(habits);
      setInsights(Array.isArray(ins.data) ? ins.data.slice(0, 3) : ((ins.data?.results || []).slice(0, 3)));

      // Logic for Sequence Locking & Merging
      // For Demo: Assume Day 1 was scheduled but streak is 0 and no completion recorded
      const streak = dashData?.streak || 0;
      if (streak === 0 && habits.length > 0) {
        handleTriggerMerge(habits);
      }
    }).catch(() => { }).finally(() => setLoading(false));
  }, []);

  const handleTriggerMerge = async (habits) => {
    setMergeLoading(true);
    setIsMerged(true);
    try {
      const missed = habits.filter(h => h.title.includes('[Doctor]')).slice(0, 1);
      const current = habits.filter(h => h.title.includes('[AI]')).slice(0, 1);
      
      const res = await generateMergedPlan(missed, current, { ageGroup, language, medicalRecord: user?.medicalRecord });
      setMergePlan(res);
      speakNotification(language === 'ta' ? "Day 1 உடற்பயிற்சி முடிக்கப்படவில்லை, எனவே Day 1 மற்றும் Day 2 பயிற்சிகள் இணைக்கப்படும்." : "Day 1 exercise is not completed so Day 1 and Day 2 exercises will be merged.", language);
      toast.success('AI has merged your missed plan! ⚡');
    } catch {
      toast.error('AI Merge failed');
    } finally {
      setMergeLoading(false);
    }
  };

  const handleMoodLog = async mood => {
    setSelectedMood(mood);
    try {
      await insightsApi.logMood({ mood, date: new Date().toISOString().split('T')[0], energy_level: 7 });
      toast.success('Mood logged! ✨');
      // AI modifies exercises based on mood
      setMoodLoading(true);
      try {
        const plan = await modifyExerciseByMood(mood, todayHabits, ageGroup, language);
        setMoodPlan(plan);
      } catch { /* silent fail */ } finally {
        setMoodLoading(false);
      }
    } catch { toast.error('Could not log mood'); }
  };

  const handleCompleteHabit = async habit => {
    try {
      await habitsApi.createLog({ habit: habit.id, date: new Date().toISOString().split('T')[0], completed: true, energy_level: 7 });
      setTodayHabits(prev => prev.map(h => h.id === habit.id ? { ...h, today_log: { completed: true } } : h));
      toast.success(`✅ "${habit.title}" completed! +${habit.points_per_completion} pts`);
      const dash = await habitsApi.dashboard();
      setData(dash.data);
    } catch { toast.error('Already logged today'); }
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}><div className="spinner" /></div>;

  const progress = data?.today?.progress_percent || 0;
  const streak = data?.streak || 0;
  const energy = data?.energy_score || 0;
  const displayName = user ? [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username : 'there';

  return (
    <div className="fade-in">
      {/* Welcome */}
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Profile Photo Mini */}
          {profilePhoto ? (
            <img src={profilePhoto} alt="avatar" style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary-light)' }} />
          ) : (
            <div className="avatar-placeholder" style={{ width: 52, height: 52, fontSize: '1.2rem', border: '2px solid var(--primary-light)', flexShrink: 0 }}>
              {(user?.first_name?.[0] || user?.username?.[0] || '?').toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="h1">Good {getGreeting()}, {displayName} 👋</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              {ageGroup && <span className="chip chip-purple" style={{ marginLeft: '0.75rem', fontSize: '0.7rem' }}>
                {ageGroup === 'child' ? '👶 Child' : ageGroup === 'senior' ? '🧓 Senior' : '💪 Adult'}
              </span>}
            </p>
          </div>
        </div>
        {role !== 'patient' && (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link to="/tasks" className="btn btn-primary"><MdAdd />Add Task</Link>
            <Link to="/goals" className="btn btn-secondary">My Goals</Link>
          </div>
        )}
      </div>

      {/* Mood */}
      <motion.div className="card" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div>
          <div className="h4">How are you feeling today?</div>
          <p className="text-sm text-muted">AI will adapt your exercises based on your mood</p>
        </div>
        <div className="mood-picker">
          {MOODS.map(m => (
            <button key={m.v} className={`mood-btn ${selectedMood === m.v ? 'selected' : ''}`}
              onClick={() => handleMoodLog(m.v)} title={m.label}>{m.e}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Program Tracker (Sequenced) */}
      <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--danger)' }}>
        <div className="h3" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          🏔 Daily Program Track
          <span className="chip chip-red">Required</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {programTrack.map((day, idx) => {
            const isAccessible = idx === 0 || programTrack[idx - 1].completed;
            return (
              <div key={day.id} className={`stat-card ${day.completed ? 'completed' : ''}`} 
                style={{ 
                  opacity: isAccessible ? 1 : 0.5, 
                  filter: isAccessible ? 'none' : 'grayscale(1)',
                  padding: '1.25rem',
                  position: 'relative'
                }}>
                <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem' }}>
                  {!isAccessible && '🔒'}
                  {day.completed && '✅'}
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>DAY {day.id}</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, marginTop: '0.25rem' }}>{day.title}</div>
                <div style={{ marginTop: '0.75rem' }}>
                  {isAccessible && !day.completed ? (
                    <button className="btn btn-primary btn-sm" style={{ width: '100%' }} onClick={() => {
                      setProgramTrack(prev => prev.map(d => d.id === day.id ? { ...d, completed: true } : d));
                      toast.success(`Day ${day.id} Unlocked Next!`);
                    }}>Complete Day {day.id}</button>
                  ) : !isAccessible ? (
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Complete Day {idx} to unlock</div>
                  ) : (
                    <div className="text-sm" style={{ color: 'var(--success)' }}>Well done!</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Merge Notification & Exercises */}
      <AnimatePresence>
        {isMerged && (
          <motion.div className="card" style={{ marginBottom: '1.5rem', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)' }}
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ background: 'var(--danger)', color: 'white', width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>⚡</div>
              <div>
                <div className="h4" style={{ color: 'var(--danger)' }}>AI Plan Modified: Day 1 + Day 2 Merged</div>
                <p className="text-sm text-muted">You missed Day 1, so AI combined it with today's routine.</p>
              </div>
            </div>
            
            {mergeLoading ? (
              <div className="spinner" style={{ margin: '1rem auto' }} />
            ) : mergePlan && (
              <>
                <div className="nudge-banner" style={{ background: 'var(--bg-card)', marginBottom: '1rem' }}>
                  <span>⚠️</span> {mergePlan.notification}
                </div>
                <div className="grid-2" style={{ gap: '0.75rem' }}>
                  {mergePlan.mergedExercises?.map((ex, i) => (
                    <div key={i} className="card" style={{ padding: '0.75rem', borderLeft: '4px solid #7C3AED' }}>
                      <div style={{ fontWeight: 600 }}>{ex.emoji} {ex.name}</div>
                      <div className="text-xs text-muted">⏱ {ex.duration} · {ex.intensity} intensity</div>
                      <div className="text-xs" style={{ marginTop: '0.2rem', fontStyle: 'italic' }}>{ex.reason}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Mood Exercise Panel */}
      <AnimatePresence>
        {(selectedMood && (moodLoading || moodPlan)) && (
          <motion.div className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--primary)' }}
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <MdAutoAwesome color="var(--primary-light)" size={20} />
              <span className="h4">AI Mood-Adapted Exercises</span>
              {selectedMood && <span className="chip chip-purple">{MOODS.find(m => m.v === selectedMood)?.e} {selectedMood}</span>}
            </div>
            {moodLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)' }}>
                <div className="spinner" style={{ width: 24, height: 24, borderWidth: 2 }} />
                <span>AI is analyzing your mood…</span>
              </div>
            ) : moodPlan && (
              <>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>{moodPlan.moodMessage}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                  {moodPlan.modifiedExercises?.map((ex, i) => (
                    <div key={i} style={{ background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ fontSize: '1.3rem' }}>{ex.emoji}</span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{ex.name}</div>
                        <div className="text-xs text-muted">{ex.duration}</div>
                      </div>
                    </div>
                  ))}
                </div>
                {moodPlan.motivationalQuote && (
                  <div style={{ fontStyle: 'italic', color: 'var(--primary-light)', fontSize: '0.875rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                    "{moodPlan.motivationalQuote}"
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Row */}
      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        {[
          { icon: '🎯', label: 'Progress Today', value: `${progress}%`, color: '#7C3AED', chip: 'Daily Goal' },
          { icon: '🔥', label: 'Day Streak', value: `${streak}d`, color: '#EF4444', chip: 'Keep Going!' },
          { icon: '⚡', label: 'Energy Score', value: `${energy}`, color: '#F59E0B', chip: 'of 100' },
          { icon: '🏆', label: 'Total Points', value: (data?.user?.points || 0).toLocaleString(), color: '#06B6D4', chip: `Level ${data?.user?.level || 1}` },
        ].map((stat, i) => (
          <motion.div key={stat.label} className="stat-card" custom={i} variants={cardVariants} initial="hidden" animate="visible">
            <div className="stat-icon" style={{ background: `${stat.color}22` }}>{stat.icon}</div>
            <div className="stat-value gradient-text">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
            <span className="chip chip-purple" style={{ alignSelf: 'flex-start', marginTop: '0.25rem' }}>{stat.chip}</span>
          </motion.div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid-2" style={{ gap: '1.5rem' }}>
        {/* Progress Ring + Today's Habits */}
        <motion.div className="card" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <ProgressRing percent={progress} label={`${progress}%`} sublabel="done today" />
            <div>
              <div className="h3" style={{ marginBottom: '0.25rem' }}>Today's Progress</div>
              <p className="text-sm text-muted">{data?.today?.completed || 0} of {data?.today?.total || 0} habits completed</p>
              {streak > 0 && <div className="streak-badge" style={{ marginTop: '0.75rem' }}>🔥 {streak} Day Streak!</div>}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {todayHabits.slice(0, 5).map(habit => {
              const done = habit.today_log?.completed;
              return (
                <div key={habit.id} className={`habit-card ${done ? 'completed' : ''}`}
                  style={{ '--habit-color': habit.color }} onClick={() => !done && handleCompleteHabit(habit)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className={`task-check ${done ? 'done' : ''}`}>
                      {done && <span style={{ color: 'white', fontSize: '0.8rem' }}>✓</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', textDecoration: done ? 'line-through' : 'none', opacity: done ? 0.6 : 1 }}>
                        {habit.icon} {habit.title}
                      </div>
                      <div className="text-xs text-muted">{habit.duration_minutes} min · {habit.difficulty}</div>
                    </div>
                    <span className="chip chip-purple" style={{ fontSize: '0.7rem' }}>+{habit.points_per_completion}pts</span>
                  </div>
                </div>
              );
            })}
            {todayHabits.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <p className="text-muted">No habits yet. <Link to="/goals" style={{ color: 'var(--primary-light)' }}>Create a goal →</Link></p>
              </div>
            )}
          </div>
          {todayHabits.length > 5 && (
            <Link to="/tasks" className="btn btn-ghost" style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }}>
              View all tasks <MdArrowForward />
            </Link>
          )}
        </motion.div>

        {/* Insights Panel + Quick Links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <motion.div className="card" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div className="h3">🧠 Today's Insights</div>
              <Link to="/insights" className="btn btn-ghost btn-sm">View all <MdArrowForward /></Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {insights.map(ins => (
                <div key={ins.id} className="nudge-banner">
                  <span style={{ fontSize: '1.3rem' }}>{ins.icon}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{ins.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>{ins.body}</div>
                  </div>
                </div>
              ))}
              {insights.length === 0 && (
                <div className="text-muted text-sm" style={{ textAlign: 'center', padding: '1rem' }}>
                  Complete some tasks to generate insights ✨
                </div>
              )}
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div className="card" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}>
            <div className="h4" style={{ marginBottom: '1rem' }}>Quick Actions</div>
            <div className="grid-2" style={{ gap: '0.75rem' }}>
              {[
                { to: '/coach', icon: '🤖', label: 'AI Coach', desc: 'Voice-enabled · EN & Tamil', color: '#7C3AED' },
                { to: '/analytics', icon: '📊', label: 'Analytics', desc: 'View your trends', color: '#06B6D4' },
                { to: '/social', icon: '👥', label: 'Social', desc: 'Challenges & leaderboard', color: '#F59E0B' },
                { to: '/medical', icon: '❤️', label: 'Medical', desc: 'AI exercise analysis', color: '#EF4444' },
              ].map(item => (
                <Link key={item.to} to={item.to} className="card" style={{ textDecoration: 'none', padding: '1rem', cursor: 'pointer' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}>{item.icon}</div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{item.label}</div>
                  <div className="text-xs text-muted">{item.desc}</div>
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
