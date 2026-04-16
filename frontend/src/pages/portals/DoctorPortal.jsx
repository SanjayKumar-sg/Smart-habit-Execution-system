/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { auth as authApi } from '../../api/client';
import { analyzeAndModifyExercises } from '../../services/gemini';
import { useStore } from '../../store/useStore';
import toast from 'react-hot-toast';
import { MdSearch, MdEdit, MdSave, MdAutoAwesome, MdPersonAdd, MdCheck, MdClose, MdWarning, MdTrendingUp } from 'react-icons/md';

export default function DoctorPortal() {
  const { user, language } = useStore();
  const [patients, setPatients] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [doctorNote, setDoctorNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [aiPlan, setAiPlan] = useState(null);
  const [analyzingAI, setAnalyzingAI] = useState(false);
  const [trendSummary, setTrendSummary] = useState(null);
  const [loadingTrend, setLoadingTrend] = useState(false);
  const [activeTab, setActiveTab] = useState('myPatients');
  const [isEditingMedical, setIsEditingMedical] = useState(false);
  const [medicalForm, setMedicalForm] = useState({});
  const [savingMedical, setSavingMedical] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [triggeredAlerts, setTriggeredAlerts] = useState([]);
  const [newAlert, setNewAlert] = useState({ vital_name: 'resting_heart_rate', threshold_min: '', threshold_max: '' });
  const [savingAlert, setSavingAlert] = useState(false);

  const loadData = () => {
    authApi.doctorPatients().then(r => {
      const rels = r.data?.relationships || [];
      const accepted = rels.filter(rel => rel.status === 'accepted').map(rel => ({
        id: rel.patient_id,
        relationshipId: rel.id,
        name: rel.patient_name,
        username: rel.patient_username,
        status: rel.status,
        conditions: 'Loading…', fitness_level: 'beginner',
        resting_heart_rate: 72, blood_pressure_systolic: 120,
        blood_pressure_diastolic: 80, doctor_notes: '', streak: 0, level: 1, points: 0,
        avatar: (rel.patient_name[0] || 'P').toUpperCase(),
        ageGroup: 'adult', last_visit: 'N/A',
      }));
      setPatients(accepted);
      
      const pending = rels.filter(rel => rel.status === 'pending').map(rel => ({
        id: rel.patient_id,
        relationshipId: rel.id,
        name: rel.patient_name,
        username: rel.patient_username,
        avatar: (rel.patient_name[0] || 'P').toUpperCase(),
      }));
      setPendingRequests(pending);

      // load full patient details
      accepted.forEach(p => {
        authApi.adminFetchMedical(p.id).then(mr => {
          setPatients(prev => prev.map(pt => pt.id === p.id ? { ...pt, ...mr.data } : pt));
        }).catch(() => {});
      });
    }).catch(() => {
      setPatients([]);
      setPendingRequests([]);
    }).finally(() => setLoading(false));
    authApi.triggeredAlerts().then(r => setTriggeredAlerts(r.data || [])).catch(() => {});
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (!selectedPatient) return;
    authApi.getAlerts(selectedPatient.id).then(r => setAlerts(r.data || [])).catch(() => {});
  }, [selectedPatient]);

  const filtered = patients.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.username?.toLowerCase().includes(search.toLowerCase())
  );

  const handleActionRequest = async (relId, action) => {
    try {
      await authApi.updatePatientStatus(relId, { status: action });
      toast.success(action === 'accepted' ? 'Patient request accepted!' : 'Patient request declined.');
      loadData();
    } catch { toast.error('Failed to update status'); }
  };

  const handleSaveNote = async () => {
    setSavingNote(true);
    try {
      await authApi.adminUpdateMedical({ user_id: selectedPatient.id, doctor_notes: doctorNote });
      setPatients(prev => prev.map(p => p.id === selectedPatient.id ? { ...p, doctor_notes: doctorNote } : p));
      setSelectedPatient(prev => ({ ...prev, doctor_notes: doctorNote }));
      toast.success('Doctor note saved! 📝');
    } catch { toast.error('Failed to save note'); }
    finally { setSavingNote(false); }
  };

  const handleAIAnalyze = async () => {
    setAnalyzingAI(true);
    try {
      const plan = await analyzeAndModifyExercises(
        { conditions: selectedPatient.conditions, fitness_level: selectedPatient.fitness_level,
          resting_heart_rate: selectedPatient.resting_heart_rate, blood_pressure_systolic: selectedPatient.blood_pressure_systolic,
          blood_pressure_diastolic: selectedPatient.blood_pressure_diastolic, doctor_notes: selectedPatient.doctor_notes },
        selectedPatient.ageGroup || 'adult', language
      );
      setAiPlan(plan);
      // Save confirmed plan to patient record
      await authApi.adminUpdateMedical({ user_id: selectedPatient.id, confirmed_ai_plan: JSON.stringify(plan) });
      toast.success(`AI plan generated & saved for ${selectedPatient.name}! ✅`);
    } catch { toast.error('AI analysis failed'); }
    finally { setAnalyzingAI(false); }
  };

  const handleAITrendSummary = async () => {
    setLoadingTrend(true);
    try {
      const r = await authApi.patientTrend(selectedPatient.id);
      const data = r.data;
      // Use Groq to summarize the trend
      const { chatWithCoach } = await import('../../services/gemini');
      const prompt = `Summarize this patient's health data concisely for a doctor in 3-5 sentences.
Patient: ${data.patient?.first_name} ${data.patient?.last_name}
Conditions: ${data.medical_record?.conditions || 'None'}
Resting HR: ${data.medical_record?.resting_heart_rate} BPM
BP: ${data.medical_record?.blood_pressure_systolic}/${data.medical_record?.blood_pressure_diastolic}
Blood Glucose: ${data.medical_record?.blood_glucose || 'N/A'}
Triggered Alerts: ${data.triggered_alerts?.length || 0} alerts
Fitness Level: ${data.medical_record?.fitness_level}`;
      const summary = await chatWithCoach(prompt, {}, []);
      setTrendSummary(summary);
      toast.success('AI Clinical Summary generated! 🧠');
    } catch { toast.error('Failed to generate summary'); }
    finally { setLoadingTrend(false); }
  };

  const handleSaveMedical = async () => {
    setSavingMedical(true);
    try {
      await authApi.adminUpdateMedical({ user_id: selectedPatient.id, ...medicalForm });
      toast.success('Medical record updated! ✅');
      setPatients(prev => prev.map(p => p.id === selectedPatient.id ? { ...p, ...medicalForm } : p));
      setSelectedPatient(prev => ({ ...prev, ...medicalForm }));
      setIsEditingMedical(false);
    } catch { toast.error('Failed to update record'); }
    finally { setSavingMedical(false); }
  };

  const handleCreateAlert = async () => {
    if (!selectedPatient) return;
    setSavingAlert(true);
    try {
      await authApi.createAlert({ patient: selectedPatient.id, ...newAlert });
      toast.success('Vital alert created! 🚨');
      const r = await authApi.getAlerts(selectedPatient.id);
      setAlerts(r.data || []);
      setNewAlert({ vital_name: 'resting_heart_rate', threshold_min: '', threshold_max: '' });
    } catch { toast.error('Failed to create alert'); }
    finally { setSavingAlert(false); }
  };

  const intensityColor = { low: '#10B981', medium: '#F59E0B', high: '#EF4444' };
  const ageLabel = { child: '👶', adult: '💪', senior: '🧓' };

  const TABS = [
    ['myPatients', '🩺 My Patients'],
    ['pendingRequests', `🔔 Pending Requests (${pendingRequests.length})`],
    ...(selectedPatient ? [
      ['vitals', '💓 Vitals'],
      ['notes', '📝 Notes'],
      ['ai', '🤖 AI Plan'],
      ['alerts', '🚨 Vital Alerts'],
      ['trend', '📊 AI Summary'],
    ] : []),
  ];

  return (
    <div className="fade-in" style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="h1" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>🩺 Doctor Portal</h1>
        <p className="text-muted">Manage your patients, update medical records, generate AI exercise plans & track vital alerts.</p>
      </div>

      {/* Triggered Alerts Banner */}
      {triggeredAlerts.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <MdWarning size={24} color="var(--danger)" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: 'var(--danger)', marginBottom: '0.25rem' }}>🚨 {triggeredAlerts.length} Critical Vital Alert{triggeredAlerts.length > 1 ? 's' : ''} Triggered!</div>
            <div style={{ fontSize: '0.85rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {triggeredAlerts.map(a => (
                <span key={a.id} className="chip chip-red" style={{ fontSize: '0.75rem' }}>
                  {a.patient?.username || 'Patient'}: {a.vital_name.replace(/_/g,' ')} = {a.triggered_value}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: selectedPatient ? '280px 1fr' : '1fr', gap: '1.5rem' }}>
        {/* Patient List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Tabs */}
          <div className="tabs">
            <button className={`tab-btn ${activeTab === 'myPatients' ? 'active' : ''}`} onClick={() => setActiveTab('myPatients')}>🩺 My Patients</button>
            <button className={`tab-btn ${activeTab === 'pendingRequests' ? 'active' : ''}`} onClick={() => setActiveTab('pendingRequests')}>
              🔔 Pending {pendingRequests.length > 0 && <span style={{ background: 'var(--danger)', color: 'white', padding: '0 0.4rem', borderRadius: '10px', fontSize: '0.7rem', marginLeft: '0.4rem' }}>{pendingRequests.length}</span>}
            </button>
          </div>

          {activeTab === 'myPatients' && (
            <div className="card" style={{ padding: '1rem' }}>
              <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
                <MdSearch style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input className="form-input" placeholder="Search patients…" value={search}
                  onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '2.25rem' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '60vh', overflowY: 'auto' }}>
                {loading ? <div className="spinner" style={{ margin: '2rem auto' }} /> : filtered.map(p => (
                  <motion.button key={p.id} whileHover={{ x: 3 }}
                    onClick={() => { setSelectedPatient(p); setDoctorNote(p.doctor_notes || ''); setAiPlan(null); setActiveTab('vitals'); setTrendSummary(null); }}
                    style={{
                      background: selectedPatient?.id === p.id ? 'rgba(124,58,237,0.12)' : 'transparent',
                      border: selectedPatient?.id === p.id ? '1px solid rgba(124,58,237,0.3)' : '1px solid transparent',
                      borderRadius: 'var(--radius-sm)', padding: '0.75rem', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '0.75rem', textAlign: 'left', width: '100%',
                    }}>
                    <div className="avatar-placeholder" style={{ width: 38, height: 38, fontSize: '0.9rem', flexShrink: 0 }}>{p.avatar}</div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{ageLabel[p.ageGroup] || '💪'} {p.conditions || 'No conditions'}</div>
                    </div>
                  </motion.button>
                ))}
                {!loading && filtered.length === 0 && <p className="text-muted text-sm" style={{ padding: '1rem', textAlign: 'center' }}>No accepted patients yet.</p>}
              </div>
            </div>
          )}

          {activeTab === 'pendingRequests' && (
            <div className="card" style={{ padding: '1rem' }}>
              <div className="h4" style={{ marginBottom: '0.75rem' }}>Incoming Patient Requests</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '60vh', overflowY: 'auto' }}>
                {pendingRequests.length === 0 && <p className="text-muted text-sm" style={{ textAlign: 'center', padding: '1rem' }}>No pending requests.</p>}
                {pendingRequests.map(req => (
                  <div key={req.id} style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.6rem', borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-glass)', border: '1px solid var(--border)',
                  }}>
                    <div className="avatar-placeholder" style={{ width: 32, height: 32, fontSize: '0.75rem' }}>
                      {req.avatar}
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{req.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{req.username}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button className="btn btn-sm" style={{ padding: '0.3rem', background: 'rgba(16,185,129,0.1)', color: '#10B981' }} onClick={() => handleActionRequest(req.relationshipId, 'accepted')}>
                        <MdCheck size={18} />
                      </button>
                      <button className="btn btn-sm" style={{ padding: '0.3rem', background: 'rgba(239,68,68,0.1)', color: '#EF4444' }} onClick={() => handleActionRequest(req.relationshipId, 'rejected')}>
                        <MdClose size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Patient Detail Panel */}
        {selectedPatient && (
          <motion.div key={selectedPatient.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Patient Header */}
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.25rem' }}>
              <div className="avatar-placeholder" style={{ width: 56, height: 56, fontSize: '1.3rem' }}>{selectedPatient.avatar}</div>
              <div style={{ flex: 1 }}>
                <div className="h2">{selectedPatient.name}</div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                  <span className="chip chip-cyan">{ageLabel[selectedPatient.ageGroup] || '💪'} {selectedPatient.ageGroup || 'adult'}</span>
                  {selectedPatient.conditions && <span className="chip chip-red">⚕️ {selectedPatient.conditions.split(',')[0]}</span>}
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedPatient(null)}>
                <MdClose />
              </button>
            </div>

            {/* Sub-tabs */}
            <div className="tabs">
              {[['vitals', '💓 Vitals'], ['notes', '📝 Notes'], ['ai', '🤖 AI Plan'], ['alerts', '🚨 Alerts'], ['trend', '📊 AI Summary']].map(([t, label]) => (
                <button key={t} className={`tab-btn ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>{label}</button>
              ))}
            </div>

            {/* Vitals */}
            {activeTab === 'vitals' && (
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <div className="h4">Vitals &amp; Clinical Data</div>
                  {!isEditingMedical ? (
                    <button className="btn btn-secondary btn-sm" onClick={() => { setMedicalForm({ conditions: selectedPatient.conditions, fitness_level: selectedPatient.fitness_level, resting_heart_rate: selectedPatient.resting_heart_rate, blood_pressure_systolic: selectedPatient.blood_pressure_systolic, blood_pressure_diastolic: selectedPatient.blood_pressure_diastolic }); setIsEditingMedical(true); }}>
                      <MdEdit /> Edit Record
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setIsEditingMedical(false)}>Cancel</button>
                      <button className="btn btn-primary btn-sm" onClick={handleSaveMedical} disabled={savingMedical}>
                        <MdSave /> {savingMedical ? 'Saving…' : 'Save'}
                      </button>
                    </div>
                  )}
                </div>
                {isEditingMedical ? (
                  <div className="grid-2" style={{ gap: '1rem' }}>
                    {[['conditions', 'Conditions'], ['fitness_level', 'Fitness Level'], ['resting_heart_rate', 'Resting HR (BPM)'], ['blood_pressure_systolic', 'BP Systolic'], ['blood_pressure_diastolic', 'BP Diastolic']].map(([key, label]) => (
                      <div key={key} className="form-group">
                        <label className="form-label">{label}</label>
                        {key === 'fitness_level' ? (
                          <select className="form-input" value={medicalForm[key] || ''} onChange={e => setMedicalForm({ ...medicalForm, [key]: e.target.value })}>
                            {['beginner', 'intermediate', 'advanced'].map(l => <option key={l} value={l}>{l}</option>)}
                          </select>
                        ) : (
                          <input className="form-input" type={key.includes('rate') || key.includes('pressure') ? 'number' : 'text'} value={medicalForm[key] || ''} onChange={e => setMedicalForm({ ...medicalForm, [key]: e.target.value })} />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid-3" style={{ gap: '1rem' }}>
                    {[
                      { icon: '💓', label: 'Resting HR', value: `${selectedPatient.resting_heart_rate || '--'} BPM`, ok: (selectedPatient.resting_heart_rate || 72) < 80 },
                      { icon: '🩺', label: 'Systolic BP', value: `${selectedPatient.blood_pressure_systolic || '--'} mmHg`, ok: (selectedPatient.blood_pressure_systolic || 120) < 130 },
                      { icon: '📊', label: 'Diastolic BP', value: `${selectedPatient.blood_pressure_diastolic || '--'} mmHg`, ok: (selectedPatient.blood_pressure_diastolic || 80) < 85 },
                      { icon: '🏃', label: 'Fitness Level', value: selectedPatient.fitness_level || 'beginner', ok: true },
                      { icon: '⚕️', label: 'Conditions', value: selectedPatient.conditions || 'None', ok: !selectedPatient.conditions },
                    ].map(v => (
                      <div key={v.label} className="stat-card" style={{ padding: '1rem' }}>
                        <div style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}>{v.icon}</div>
                        <div className="stat-value" style={{ fontSize: '1.1rem', color: v.ok ? 'var(--success)' : 'var(--danger)' }}>{v.value}</div>
                        <div className="stat-label">{v.label}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Doctor Notes */}
            {activeTab === 'notes' && (
              <div className="card">
                <div className="h4" style={{ marginBottom: '1rem' }}>📝 Doctor Notes for {selectedPatient.name}</div>
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Clinical Notes &amp; Exercise Restrictions</label>
                  <textarea className="form-input form-textarea" value={doctorNote} onChange={e => setDoctorNote(e.target.value)}
                    placeholder="Add exercise restrictions, diet notes, medication interactions, recommended activities…"
                    style={{ minHeight: 160 }} />
                </div>
                <button className="btn btn-primary" onClick={handleSaveNote} disabled={savingNote}>
                  <MdSave /> {savingNote ? 'Saving…' : 'Save Notes'}
                </button>
              </div>
            )}

            {/* AI Plan */}
            {activeTab === 'ai' && (
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div className="h4">🤖 AI Exercise Plan for {selectedPatient.name}</div>
                  <button className="btn btn-primary" onClick={handleAIAnalyze} disabled={analyzingAI}>
                    <MdAutoAwesome /> {analyzingAI ? 'Generating…' : 'Generate & Save Plan'}
                  </button>
                </div>
                {analyzingAI && <div style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" style={{ margin: '0 auto 1rem' }} /><p className="text-muted">Analyzing medical data…</p></div>}
                {!analyzingAI && !aiPlan && <div className="empty-state"><div style={{ fontSize: '3rem' }}>🤖</div><p className="text-muted">Generate a personalized AI exercise plan. It will be saved to the patient's record.</p></div>}
                {aiPlan && !analyzingAI && (
                  <>
                    <div className="nudge-banner" style={{ marginBottom: '1.25rem' }}><span style={{ fontSize: '1.5rem' }}>💡</span><p style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>{aiPlan.summary}</p></div>
                    <div className="grid-2" style={{ gap: '0.75rem' }}>
                      {(aiPlan.ai_suggested_exercises || []).map((ex, i) => (
                        <div key={i} className="card" style={{ padding: '0.875rem', borderLeft: `4px solid ${intensityColor[ex.intensity] || '#7C3AED'}` }}>
                          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.3rem', alignItems: 'center' }}>
                            <span style={{ fontSize: '1.2rem' }}>{ex.emoji || '🏃'}</span>
                            <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{ex.name}</span>
                          </div>
                          <div className="text-xs" style={{ color: 'var(--secondary)' }}>⏱ {ex.duration}</div>
                          <div className="text-xs text-muted">{ex.reason}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Vital Alerts */}
            {activeTab === 'alerts' && (
              <div className="card">
                <div className="h4" style={{ marginBottom: '1rem' }}>🚨 Critical Vital Alerts for {selectedPatient.name}</div>
                <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-sm)', padding: '1rem', marginBottom: '1.25rem' }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.75rem', color: 'var(--danger)' }}>+ Create New Alert</div>
                  <div className="grid-3" style={{ gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label">Vital Sign</label>
                      <select className="form-input" value={newAlert.vital_name} onChange={e => setNewAlert({ ...newAlert, vital_name: e.target.value })}>
                        {[['resting_heart_rate', 'Resting Heart Rate'], ['blood_pressure_systolic', 'BP Systolic'], ['blood_pressure_diastolic', 'BP Diastolic'], ['blood_glucose', 'Blood Glucose']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Min Threshold</label>
                      <input className="form-input" type="number" placeholder="e.g. 50" value={newAlert.threshold_min} onChange={e => setNewAlert({ ...newAlert, threshold_min: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Max Threshold</label>
                      <input className="form-input" type="number" placeholder="e.g. 100" value={newAlert.threshold_max} onChange={e => setNewAlert({ ...newAlert, threshold_max: e.target.value })} />
                    </div>
                  </div>
                  <button className="btn btn-danger btn-sm" onClick={handleCreateAlert} disabled={savingAlert}>
                    {savingAlert ? 'Creating…' : '🚨 Create Alert'}
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {alerts.length === 0 && <p className="text-muted text-sm">No alerts set for this patient.</p>}
                  {alerts.map(a => (
                    <div key={a.id} style={{
                      display: 'flex', alignItems: 'center', gap: '1rem',
                      padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)',
                      background: a.triggered ? 'rgba(239,68,68,0.1)' : 'var(--bg-glass)',
                      border: `1px solid ${a.triggered ? 'rgba(239,68,68,0.4)' : 'var(--border)'}`,
                    }}>
                      <span style={{ fontSize: '1.3rem' }}>{a.triggered ? '🚨' : '🔔'}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{a.vital_name.replace(/_/g, ' ')}</div>
                        <div className="text-xs text-muted">
                          {a.threshold_min !== null ? `Min: ${a.threshold_min}` : ''} {a.threshold_max !== null ? `Max: ${a.threshold_max}` : ''}
                        </div>
                      </div>
                      {a.triggered && (
                        <span className="chip chip-red" style={{ fontSize: '0.7rem' }}>⚠ Breached: {a.triggered_value}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Clinical Trend Summary */}
            {activeTab === 'trend' && (
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div className="h4" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MdTrendingUp color="var(--secondary)" /> AI Clinical Trend Summary
                  </div>
                  <button className="btn btn-primary" onClick={handleAITrendSummary} disabled={loadingTrend}>
                    <MdAutoAwesome /> {loadingTrend ? 'Analyzing…' : 'Generate Summary'}
                  </button>
                </div>
                {loadingTrend && <div style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" style={{ margin: '0 auto 1rem' }} /><p className="text-muted">AI is analyzing patient trends…</p></div>}
                {!loadingTrend && !trendSummary && (
                  <div className="empty-state">
                    <div style={{ fontSize: '3rem' }}>📊</div>
                    <p className="text-muted">Generate an AI-powered clinical trend analysis for {selectedPatient.name}. Summarizes vitals, habits, and alerts into a concise medical summary.</p>
                  </div>
                )}
                {trendSummary && !loadingTrend && (
                  <div>
                    <div className="nudge-banner" style={{ marginBottom: '1rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>🧠</span>
                      <p style={{ lineHeight: 1.8, fontSize: '0.925rem' }}>{trendSummary}</p>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                      ⚠ AI summaries are for assistance only. Always apply clinical judgment.
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {!selectedPatient && activeTab === 'myPatients' && (
          <div className="card empty-state" style={{ padding: '4rem', display: patients.length > 0 ? 'none' : 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🩺</div>
            <div className="h3" style={{ marginBottom: '0.5rem' }}>Select a Patient</div>
            <p className="text-muted">Choose a patient from the list or add new patients from the "Add" tab.</p>
          </div>
        )}
      </div>
    </div>
  );
}
