import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { habits as habitsApi, insights as insightsApi } from '../api/client';
import { useStore } from '../store/useStore';
import ProgressRing from '../components/ProgressRing';
import { MdAdd, MdArrowForward } from 'react-icons/md';
import toast from 'react-hot-toast';

const MOODS = [{ v:'great', e:'😊' },{ v:'good', e:'🙂' },{ v:'neutral', e:'😐' },{ v:'bad', e:'😕' },{ v:'terrible', e:'😞' }];

const cardVariants = { hidden:{ opacity:0, y:20 }, visible:i => ({ opacity:1, y:0, transition:{ delay:i*0.08, duration:0.4 } }) };

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [todayHabits, setTodayHabits] = useState([]);
  const [insights, setInsights] = useState([]);
  const [selectedMood, setSelectedMood] = useState('');
  const [loading, setLoading] = useState(true);
  const user = useStore(s => s.user);

  useEffect(() => {
    Promise.all([
      habitsApi.dashboard(),
      habitsApi.today(),
      insightsApi.list(),
    ]).then(([dash, today, ins]) => {
      setData(dash.data);
      setTodayHabits(today.data.habits || []);
      setInsights(ins.data.slice(0, 3));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleMoodLog = async mood => {
    setSelectedMood(mood);
    try {
      await insightsApi.logMood({ mood, date: new Date().toISOString().split('T')[0], energy_level: 7 });
      toast.success('Mood logged! ✨');
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

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh' }}><div className="spinner" /></div>;

  const progress = data?.today?.progress_percent || 0;
  const streak = data?.streak || 0;
  const energy = data?.energy_score || 0;

  return (
    <div className="fade-in">
      {/* Welcome */}
      <div style={{ marginBottom:'2rem', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'1rem' }}>
        <div>
          <h1 className="h1">Good {getGreeting()}, {user?.first_name || user?.username} 👋</h1>
          <p style={{ color:'var(--text-secondary)', marginTop:'0.25rem' }}>{new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })}</p>
        </div>
        <div style={{ display:'flex', gap:'0.75rem' }}>
          <Link to="/tasks" className="btn btn-primary"><MdAdd />Add Task</Link>
          <Link to="/goals" className="btn btn-secondary">My Goals</Link>
        </div>
      </div>

      {/* Mood */}
      <motion.div className="card" style={{ marginBottom:'1.5rem', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'1rem' }}
        initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4 }}>
        <div>
          <div className="h4">How are you feeling today?</div>
          <p className="text-sm text-muted">Tracking your mood helps personalize insights</p>
        </div>
        <div className="mood-picker">
          {MOODS.map(m => (
            <button key={m.v} className={`mood-btn ${selectedMood === m.v ? 'selected' : ''}`}
              onClick={() => handleMoodLog(m.v)} title={m.v}>{m.e}</button>
          ))}
        </div>
      </motion.div>

      {/* Stats Row */}
      <div className="grid-4" style={{ marginBottom:'1.5rem' }}>
        {[
          { icon:'🎯', label:'Progress Today', value:`${progress}%`, color:'#7C3AED', chip:'Daily Goal' },
          { icon:'🔥', label:'Day Streak', value:`${streak}d`, color:'#EF4444', chip:'Keep Going!' },
          { icon:'⚡', label:'Energy Score', value:`${energy}`, color:'#F59E0B', chip:'of 100' },
          { icon:'🏆', label:'Total Points', value:(data?.user?.points || 0).toLocaleString(), color:'#06B6D4', chip:`Level ${data?.user?.level || 1}` },
        ].map((stat, i) => (
          <motion.div key={stat.label} className="stat-card" custom={i} variants={cardVariants} initial="hidden" animate="visible">
            <div className="stat-icon" style={{ background:`${stat.color}22` }}>{stat.icon}</div>
            <div className="stat-value gradient-text">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
            <span className="chip chip-purple" style={{ alignSelf:'flex-start', marginTop:'0.25rem' }}>{stat.chip}</span>
          </motion.div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid-2" style={{ gap:'1.5rem' }}>
        {/* Progress Ring + Today's Habits */}
        <motion.div className="card" initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.2 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'1.5rem', marginBottom:'1.5rem' }}>
            <ProgressRing percent={progress} label={`${progress}%`} sublabel="done today" />
            <div>
              <div className="h3" style={{ marginBottom:'0.25rem' }}>Today's Progress</div>
              <p className="text-sm text-muted">{data?.today?.completed || 0} of {data?.today?.total || 0} habits completed</p>
              {streak > 0 && <div className="streak-badge" style={{ marginTop:'0.75rem' }}>🔥 {streak} Day Streak!</div>}
            </div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
            {todayHabits.slice(0, 5).map(habit => {
              const done = habit.today_log?.completed;
              return (
                <div key={habit.id} className={`habit-card ${done ? 'completed' : ''}`}
                  style={{ '--habit-color': habit.color }} onClick={() => !done && handleCompleteHabit(habit)}>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                    <div className={`task-check ${done ? 'done' : ''}`}>
                      {done && <span style={{ color:'white', fontSize:'0.8rem' }}>✓</span>}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:600, fontSize:'0.9rem', textDecoration: done ? 'line-through' : 'none', opacity: done ? 0.6 : 1 }}>
                        {habit.icon} {habit.title}
                      </div>
                      <div className="text-xs text-muted">{habit.duration_minutes} min · {habit.difficulty}</div>
                    </div>
                    <span className="chip chip-purple" style={{ fontSize:'0.7rem' }}>+{habit.points_per_completion}pts</span>
                  </div>
                </div>
              );
            })}
            {todayHabits.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <p className="text-muted">No habits yet. <Link to="/goals" style={{ color:'var(--primary-light)' }}>Create a goal →</Link></p>
              </div>
            )}
          </div>
          {todayHabits.length > 5 && (
            <Link to="/tasks" className="btn btn-ghost" style={{ marginTop:'1rem', width:'100%', justifyContent:'center' }}>
              View all tasks <MdArrowForward />
            </Link>
          )}
        </motion.div>

        {/* Insights Panel */}
        <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
          <motion.div className="card" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.25 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem' }}>
              <div className="h3">🧠 Today's Insights</div>
              <Link to="/insights" className="btn btn-ghost btn-sm">View all <MdArrowForward /></Link>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
              {insights.map(ins => (
                <div key={ins.id} className="nudge-banner">
                  <span style={{ fontSize:'1.3rem' }}>{ins.icon}</span>
                  <div>
                    <div style={{ fontWeight:600, fontSize:'0.875rem' }}>{ins.title}</div>
                    <div style={{ fontSize:'0.8rem', color:'var(--text-secondary)', marginTop:'0.15rem' }}>{ins.body}</div>
                  </div>
                </div>
              ))}
              {insights.length === 0 && (
                <div className="text-muted text-sm" style={{ textAlign:'center', padding:'1rem' }}>
                  Complete some tasks to generate insights ✨
                </div>
              )}
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div className="card" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.35 }}>
            <div className="h4" style={{ marginBottom:'1rem' }}>Quick Actions</div>
            <div className="grid-2" style={{ gap:'0.75rem' }}>
              {[
                { to:'/coach', icon:'🤖', label:'AI Coach', desc:'Get personalized advice', color:'#7C3AED' },
                { to:'/analytics', icon:'📊', label:'Analytics', desc:'View your trends', color:'#06B6D4' },
                { to:'/social', icon:'👥', label:'Social', desc:'Challenges & leaderboard', color:'#F59E0B' },
                { to:'/medical', icon:'❤️', label:'Medical', desc:'Update health data', color:'#EF4444' },
              ].map(item => (
                <Link key={item.to} to={item.to} className="card" style={{ textDecoration:'none', padding:'1rem', cursor:'pointer' }}>
                  <div style={{ fontSize:'1.5rem', marginBottom:'0.3rem' }}>{item.icon}</div>
                  <div style={{ fontWeight:600, fontSize:'0.85rem' }}>{item.label}</div>
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
