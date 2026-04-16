/* eslint-disable no-unused-vars, react-hooks/exhaustive-deps */
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { habits as habitsApi } from '../api/client';
import toast from 'react-hot-toast';
import { MdCheck, MdMic, MdMicOff, MdAdd } from 'react-icons/md';

// Basic Web Speech API standard/webkit polyfill
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    fetchTasks();
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';
      rec.onresult = (e) => handleVoiceCommand(e.results[0][0].transcript);
      rec.onerror = () => setListening(false);
      rec.onend = () => setListening(false);
      recognitionRef.current = rec;
    }
  }, []);

  const fetchTasks = async () => {
    try {
      const { data } = await habitsApi.microtasks();
      setTasks(Array.isArray(data) ? data : (data?.results || []));
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (task) => {
    try {
      await habitsApi.updateMicrotask(task.id, { status: task.status === 'completed' ? 'pending' : 'completed' });
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: t.status === 'completed' ? 'pending' : 'completed' } : t));
      if (task.status !== 'completed') toast.success(`Task completed! +${task.points} pts`, { icon: '✨' });
    } catch {
      toast.error('Error updating task');
    }
  };

  const toggleListen = () => {
    if (!recognitionRef.current) return toast.error('Voice commands not supported in this browser');
    if (listening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setListening(true);
      toast('Listening... Try saying "Complete task"', { icon: '🎤' });
    }
  };

  const handleVoiceCommand = (transcript) => {
    const text = transcript.toLowerCase();
    toast(`Voice: "${text}"`);
    if (text.includes('complete') || text.includes('mark') || text.includes('done')) {
      const pendingTask = tasks.find(t => t.status !== 'completed');
      if (pendingTask) {
        handleComplete(pendingTask);
      } else {
        toast('No pending tasks to complete.');
      }
    }
  };

  const pending = tasks.filter(t => t.status !== 'completed');
  const completed = tasks.filter(t => t.status === 'completed');

  if (loading) return <div className="spinner" style={{ margin: '4rem auto' }} />;

  return (
    <div className="fade-in" style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="h1">Today's Tasks</h1>
          <p className="text-muted">Your goals broken down into actionable steps.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button className={`voice-btn ${listening ? 'listening' : ''}`} onClick={toggleListen} title="Voice Assistant">
            {listening ? <MdMic /> : <MdMicOff />}
          </button>
        </div>
      </div>

      <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1.5rem' }}>
        <span className="chip chip-amber">{pending.length} Pending</span>
        <span className="chip chip-green">{completed.length} Completed</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <AnimatePresence>
          {[...pending, ...completed].map((task, i) => (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: i * 0.05 }}
              className={`card ${task.status === 'completed' ? 'completed' : ''}`}
              style={{ cursor: 'pointer', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}
              onClick={() => handleComplete(task)}
            >
              <div className={`task-check ${task.status === 'completed' ? 'done' : ''}`} style={{ width: 28, height: 28 }}>
                {task.status === 'completed' && <MdCheck color="white" />}
              </div>
              <div style={{ flex: 1 }}>
                <h3 className="h4" style={{
                  textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                  opacity: task.status === 'completed' ? 0.6 : 1,
                  display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap'
                }}>
                  {task.title.replace(' [Doctor]', '').replace(' [AI]', '')}
                  {task.title.includes('[Doctor]') && <span className="chip chip-red" style={{ fontSize: '0.7rem', padding: '0.1rem 0.5rem' }}>🩺 Doctor Plan</span>}
                  {task.title.includes('[AI]') && <span className="chip chip-purple" style={{ fontSize: '0.7rem', padding: '0.1rem 0.5rem' }}>🤖 AI Plan</span>}
                </h3>
                <div className="text-sm text-muted">Est: {task.duration_minutes} mins</div>
              </div>
              <div className="chip chip-purple" style={{ fontSize: '0.8rem' }}>+{task.points} pts</div>
            </motion.div>
          ))}
        </AnimatePresence>

        {tasks.length === 0 && (
          <div className="empty-state">
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📋</div>
            <h3 className="h3">No tasks today</h3>
            <p className="text-muted">Wait for your habits to generate tasks, or create new goals.</p>
          </div>
        )}
      </div>
    </div>
  );
}
