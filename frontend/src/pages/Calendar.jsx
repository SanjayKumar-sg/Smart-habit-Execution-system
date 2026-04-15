import { useState, useEffect } from 'react';
import { habits as habitsApi } from '../api/client';
import toast from 'react-hot-toast';

export default function Calendar() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // For a simple demo, we fetch the logs of all habits and color today's calendar based on completeness.
  // In a robust implementation, we'd fetch logs grouped by date across a month block.
  useEffect(() => {
    // Just fetch recent logs (no habit_id to fetch all)
    habitsApi.logs('').then(res => {
      setLogs(res.data);
    }).catch(() => toast.error('Failed to load past logs'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner" style={{ margin: '4rem auto' }} />;

  // Generate calendar grid for the current month
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const days = Array.from({ length: 42 }); // 6 rows of 7 days

  const renderDay = (idx) => {
    const dayNumber = idx - firstDay + 1;
    if (dayNumber < 1 || dayNumber > daysInMonth) return <div key={idx} className="cal-day" style={{ opacity: 0 }} />;

    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
    const dayLogs = logs.filter(l => l.date === dateStr);
    const completedAll = dayLogs.length > 0 && dayLogs.every(l => l.completed);
    const completedSome = dayLogs.length > 0 && dayLogs.some(l => l.completed);
    const isToday = dayNumber === today.getDate();

    let className = 'cal-day ';
    if (isToday) className += 'today ';
    if (completedAll) className += 'completed ';
    else if (completedSome) className += 'has-habit ';

    return (
      <div key={idx} className={className} title={`${dayLogs.length} habits matched on ${dateStr}`}>
        {dayNumber}
      </div>
    );
  };

  return (
    <div className="fade-in" style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="h1">Routine Planner</h1>
        <p className="text-muted">Weekly and monthly view of your habit consistency.</p>
      </div>

      <div className="card">
        <h3 className="h3" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          {today.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', marginBottom: '10px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
        </div>
        
        <div className="calendar-grid">
          {days.map((_, i) => renderDay(i))}
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem', fontSize: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div className="cal-day completed" style={{ width: 24, height: 24, margin: 0 }} /> All Completed
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div className="cal-day has-habit" style={{ width: 24, height: 24, margin: 0 }} /> Partially Completed
          </div>
        </div>
      </div>
    </div>
  );
}
