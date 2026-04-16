/* eslint-disable no-unused-vars, react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { insights as insightsApi } from '../api/client';
import toast from 'react-hot-toast';

export default function Insights() {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      const { data } = await insightsApi.list();
      setInsights(Array.isArray(data) ? data : (data?.results || []));
    } catch {
      toast.error('Failed to load insights');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="spinner" style={{ margin: '4rem auto' }} />;

  return (
    <div className="fade-in" style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="h1">Behavioral Insights</h1>
        <p className="text-muted">AI-powered analysis of your habit completion and mood patterns.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
        {insights.map((ins, i) => (
          <motion.div key={ins.id} className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            style={{ borderLeft: `4px solid ${ins.is_positive ? 'var(--success)' : 'var(--danger)'}` }}>
            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
              <div style={{ fontSize: '2.5rem', background: 'var(--bg-surface)', padding: '0.75rem', borderRadius: '16px' }}>{ins.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h3 className="h3">{ins.title}</h3>
                  <span className="chip chip-purple" style={{ fontSize: '0.75rem', textTransform: 'capitalize' }}>{ins.category}</span>
                </div>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{ins.body}</p>
                <div className="text-xs text-muted" style={{ marginTop: '0.75rem' }}>Generated {new Date(ins.generated_at).toLocaleDateString()}</div>
              </div>
            </div>
          </motion.div>
        ))}
        {insights.length === 0 && (
          <div className="empty-state">
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🧠</div>
            <h3 className="h3">No insights yet</h3>
            <p className="text-muted">Complete more habits to generate personalized behavioral insights.</p>
          </div>
        )}
      </div>
    </div>
  );
}
