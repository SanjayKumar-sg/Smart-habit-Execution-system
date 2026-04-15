import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { habits as habitsApi } from '../api/client';
import toast from 'react-hot-toast';
import { MdAdd, MdClose } from 'react-icons/md';

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showHabitModal, setShowHabitModal] = useState(false);

  const [newGoal, setNewGoal] = useState({ title: '', category: 'fitness' });
  const [newHabit, setNewHabit] = useState({ title: '', goal: '', difficulty: 'medium', duration_minutes: 15 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [g, h] = await Promise.all([habitsApi.goals(), habitsApi.list()]);
      setGoals(g.data);
      setHabits(h.data);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    try {
      await habitsApi.createGoal(newGoal);
      toast.success('Goal created!');
      setShowGoalModal(false);
      fetchData();
      setNewGoal({ title: '', category: 'fitness' });
    } catch { toast.error('Error creating goal'); }
  };

  const handleCreateHabit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...newHabit };
      if (!payload.goal) delete payload.goal; // Optional
      await habitsApi.create(payload);
      toast.success('Habit created! Micro-tasks will be generated.');
      setShowHabitModal(false);
      fetchData();
      setNewHabit({ title: '', goal: '', difficulty: 'medium', duration_minutes: 15 });
    } catch { toast.error('Error creating habit'); }
  };

  if (loading) return <div className="spinner" style={{ margin: '4rem auto' }} />;

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="h1">Goals & Habits</h1>
          <p className="text-muted">Define the person you want to become.</p>
        </div>
        <div style={{ display:'flex', gap:'1rem' }}>
          <button className="btn btn-secondary" onClick={() => setShowGoalModal(true)}><MdAdd /> New Goal</button>
          <button className="btn btn-primary" onClick={() => setShowHabitModal(true)}><MdAdd /> New Habit</button>
        </div>
      </div>

      <div className="grid-2">
        <div>
          <h2 className="h3" style={{ marginBottom: '1rem' }}>Your Target Goals</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {goals.map((g, i) => (
              <motion.div key={g.id} className="card" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>{g.icon}</span>
                    <span style={{ fontWeight: 600 }}>{g.title}</span>
                  </div>
                  <span className="chip chip-purple" style={{ textTransform:'capitalize' }}>{g.category}</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'var(--bg-surface)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${g.progress_percent}%`, background: g.color || 'var(--primary)' }} />
                </div>
                <div className="text-xs text-muted" style={{ marginTop: '0.5rem', textAlign: 'right' }}>{g.progress_percent}% complete</div>
              </motion.div>
            ))}
            {goals.length === 0 && <div className="card text-center text-muted">No goals active. Create one to get started!</div>}
          </div>
        </div>

        <div>
          <h2 className="h3" style={{ marginBottom: '1rem' }}>Active Habits</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {habits.map((h, i) => (
              <motion.div key={h.id} className="card" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '10px', background: `${h.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                      {h.icon}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{h.title}</div>
                      <div className="text-xs text-muted" style={{ textTransform:'capitalize' }}>{h.difficulty} • {h.duration_minutes} min</div>
                    </div>
                  </div>
                  {h.streak_count > 0 && <div className="streak-badge">🔥 {h.streak_count}</div>}
                </div>
                {h.stacked_after_title && (
                  <div className="text-xs text-muted" style={{ marginTop: '0.75rem', display:'flex', alignItems:'center', gap:'0.25rem' }}>
                    🔗 Stacked after: <strong>{h.stacked_after_title}</strong>
                  </div>
                )}
              </motion.div>
            ))}
            {habits.length === 0 && <div className="card text-center text-muted">No habits active.</div>}
          </div>
        </div>
      </div>

      {showGoalModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(4px)' }}>
          <div className="card scale-in" style={{ width:'100%', maxWidth:500, margin:'1rem' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'1.5rem' }}>
              <h2 className="h3">Create New Goal</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowGoalModal(false)}><MdClose /></button>
            </div>
            <form onSubmit={handleCreateGoal} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
              <div className="form-group">
                <label className="form-label">Goal Title</label>
                <input className="form-input" required value={newGoal.title} onChange={e=>setNewGoal({...newGoal, title:e.target.value})} placeholder="e.g. Run a Marathon" />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-input form-select" value={newGoal.category} onChange={e=>setNewGoal({...newGoal, category:e.target.value})}>
                  <option value="fitness">Fitness</option>
                  <option value="hydration">Hydration</option>
                  <option value="sleep">Sleep</option>
                  <option value="nutrition">Nutrition</option>
                  <option value="mindfulness">Mindfulness</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <button className="btn btn-primary" type="submit" style={{ marginTop:'1rem', justifyContent:'center' }}>Save Goal</button>
            </form>
          </div>
        </div>
      )}

      {showHabitModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(4px)' }}>
          <div className="card scale-in" style={{ width:'100%', maxWidth:500, margin:'1rem' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'1.5rem' }}>
              <h2 className="h3">Create New Habit</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowHabitModal(false)}><MdClose /></button>
            </div>
            <form onSubmit={handleCreateHabit} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
              <div className="form-group">
                <label className="form-label">Habit Title</label>
                <input className="form-input" required value={newHabit.title} onChange={e=>setNewHabit({...newHabit, title:e.target.value})} placeholder="e.g. Morning Jog" />
              </div>
              <div className="form-group">
                <label className="form-label">Link to Goal (Optional)</label>
                <select className="form-input form-select" value={newHabit.goal} onChange={e=>setNewHabit({...newHabit, goal:e.target.value})}>
                  <option value="">-- None --</option>
                  {goals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
                </select>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Difficulty (Adaptive)</label>
                  <select className="form-input form-select" value={newHabit.difficulty} onChange={e=>setNewHabit({...newHabit, difficulty:e.target.value})}>
                    <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Est. Duration (min)</label>
                  <input type="number" className="form-input" required value={newHabit.duration_minutes} onChange={e=>setNewHabit({...newHabit, duration_minutes:e.target.value})} />
                </div>
              </div>
              <button className="btn btn-primary" type="submit" style={{ marginTop:'1rem', justifyContent:'center' }}>Save Habit</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
