import { useState, useEffect } from 'react';
import { analytics as analyticsApi } from '../api/client';
import toast from 'react-hot-toast';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { MdDownload, MdTrendingUp } from 'react-icons/md';

export default function Analytics() {
  const [weekly, setWeekly] = useState([]);
  const [monthly, setMonthly] = useState(null);
  const [consistency, setConsistency] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsApi.weekly(),
      analyticsApi.monthly(),
      analyticsApi.consistency(),
      analyticsApi.reports(),
    ]).then(([w, m, c, r]) => {
      setWeekly(w.data.weekly);
      setMonthly(m.data);
      setConsistency(c.data);
      setReports(r.data);
    }).catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  const handleGenerateReport = async () => {
    try {
      const { data } = await analyticsApi.generateReport();
      setReports([data, ...reports]);
      toast.success('Report generated successfully!');
    } catch {
      toast.error('Failed to generate report');
    }
  };

  if (loading) return <div className="spinner" style={{ margin: '4rem auto' }} />;

  return (
    <div className="fade-in">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'2rem' }}>
        <div>
          <h1 className="h1">Analytics Dashboard</h1>
          <p className="text-muted">Track your performance, consistency, and overall health score.</p>
        </div>
        <button className="btn btn-primary" onClick={handleGenerateReport}>
          <MdTrendingUp /> Generate Monthly Report
        </button>
      </div>

      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        {[
          { label: 'Completion Rate', value: `${monthly?.completion_rate || 0}%`, color: 'var(--primary)' },
          { label: 'Avg Energy', value: `${monthly?.avg_energy || 0}/10`, color: 'var(--accent)' },
          { label: 'Total Completed', value: monthly?.completed || 0, color: 'var(--success)' },
          { label: 'Health Score', value: monthly?.health_score || 0, color: 'var(--secondary)' },
        ].map((stat, i) => (
          <div key={i} className="stat-card">
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label" style={{ color: stat.color }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <h3 className="h4" style={{ marginBottom: '1rem' }}>Last 7 Days Performance</h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weekly}>
                <defs>
                  <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary-light)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--primary-light)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="rate" name="Completion %" stroke="var(--primary-light)" strokeWidth={3} fillOpacity={1} fill="url(#colorRate)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="h4" style={{ marginBottom: '1rem' }}>30-Day Consistency by Habit</h3>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={consistency} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="habit" type="category" stroke="var(--text-primary)" fontSize={12} width={100} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }} cursor={{fill: 'var(--bg-hover)'}} />
                <Bar dataKey="completion_rate" name="Consistency %" fill="var(--secondary)" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="h3" style={{ marginBottom: '1rem' }}>Health Reports Archive</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {reports.map(report => (
            <div key={report.id} style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{report.title}</h4>
                <div className="text-sm text-muted">{new Date(report.generated_at).toLocaleDateString()} • Score: {report.completion_rate}%</div>
              </div>
              <button className="btn btn-ghost btn-icon"><MdDownload size={20} /></button>
            </div>
          ))}
          {reports.length === 0 && <div className="text-muted text-center" style={{ padding: '2rem' }}>No reports generated yet. Click generate above.</div>}
        </div>
      </div>
    </div>
  );
}
