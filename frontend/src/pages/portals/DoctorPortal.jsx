/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { auth as authApi } from '../../api/client';
import { analyzeAndModifyExercises } from '../../services/gemini';
import { useStore } from '../../store/useStore';
import toast from 'react-hot-toast';
import { MdSearch, MdPerson, MdEdit, MdSave, MdAutoAwesome, MdTrendingUp } from 'react-icons/md';

// Simulated patient list from leaderboard
export default function DoctorPortal() {
  const { user, language } = useStore();
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [doctorNote, setDoctorNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [aiPlan, setAiPlan] = useState(null);
  const [analyzingAI, setAnalyzingAI] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditingMedical, setIsEditingMedical] = useState(false);
  const [medicalForm, setMedicalForm] = useState({});
  const [savingMedical, setSavingMedical] = useState(false);

  useEffect(() => {
    authApi.leaderboard().then(r => {
      // Filter out 'admin' role from patient list
      const pts = (r.data || []).filter(u => u.role !== 'admin').map((p, i) => ({
        id: p.id || i + 1,
        name: [p.first_name, p.last_name].filter(Boolean).join(' ') || p.username || `Patient ${i + 1}`,
        username: p.username,
        role: p.role,
        level: p.level || 1,
        points: p.total_points || 0,
        streak: p.streak_count || 0,
        avatar: (p.first_name?.[0] || p.username?.[0] || 'P').toUpperCase(),
        ageGroup: p.age_group || 'adult',
        conditions: p.medical_record?.conditions || 'None',
        medications: p.medical_record?.medications || 'None',
        allergies: p.medical_record?.allergies || 'None',
        fitness_level: p.medical_record?.fitness_level || 'beginner',
        resting_heart_rate: p.medical_record?.resting_heart_rate || 72,
        blood_pressure_systolic: p.medical_record?.blood_pressure_systolic || 120,
        blood_pressure_diastolic: p.medical_record?.blood_pressure_diastolic || 80,
        doctor_notes: p.medical_record?.doctor_notes || '',
        proposed_ai_plan: p.medical_record?.proposed_ai_plan || null,
        confirmed_ai_plan: p.medical_record?.confirmed_ai_plan || null,
        last_visit: p.medical_record?.last_updated ? new Date(p.medical_record.last_updated).toLocaleDateString() : 'New Patient',
      }));
      setPatients(pts);
    }).catch(() => {
      // Fallback demo patients
      setPatients([
        { id: 1, name: 'Arun Kumar', username: 'arun', level: 5, points: 1250, streak: 7, avatar: 'A', ageGroup: 'adult', conditions: 'Hypertension', fitness_level: 'beginner', resting_heart_rate: 78, blood_pressure_systolic: 140, blood_pressure_diastolic: 90, doctor_notes: '', last_visit: '12 Apr 2026' },
        { id: 2, name: 'Priya Devi', username: 'priya', level: 3, points: 850, streak: 3, avatar: 'P', ageGroup: 'senior', conditions: 'Diabetes Type 2', fitness_level: 'beginner', resting_heart_rate: 82, blood_pressure_systolic: 130, blood_pressure_diastolic: 85, doctor_notes: '', last_visit: '10 Apr 2026' },
        { id: 3, name: 'Ravi Shankar', username: 'ravi', level: 8, points: 3200, streak: 14, avatar: 'R', ageGroup: 'adult', conditions: 'None', fitness_level: 'advanced', resting_heart_rate: 60, blood_pressure_systolic: 115, blood_pressure_diastolic: 75, doctor_notes: '', last_visit: '14 Apr 2026' },
        { id: 4, name: 'Meena Lakshmi', username: 'meena', level: 2, points: 420, streak: 1, avatar: 'M', ageGroup: 'child', conditions: 'Asthma', fitness_level: 'beginner', resting_heart_rate: 88, blood_pressure_systolic: 110, blood_pressure_diastolic: 70, doctor_notes: '', last_visit: '8 Apr 2026' },
      ]);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.username?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSaveNote = async () => {
    setSavingNote(true);
    // In real app: authApi.updatePatientNote(selectedPatient.id, doctorNote)
    await new Promise(r => setTimeout(r, 800));
    setPatients(prev => prev.map(p => p.id === selectedPatient.id ? { ...p, doctor_notes: doctorNote } : p));
    setSelectedPatient(prev => ({ ...prev, doctor_notes: doctorNote }));
    toast.success('Doctor note saved! 📝');
    setSavingNote(false);
  };

  const handleAIAnalyze = async () => {
    setAnalyzingAI(true);
    try {
      const plan = await analyzeAndModifyExercises(
        {
          conditions: selectedPatient.conditions,
          fitness_level: selectedPatient.fitness_level,
          resting_heart_rate: selectedPatient.resting_heart_rate,
          blood_pressure_systolic: selectedPatient.blood_pressure_systolic,
          blood_pressure_diastolic: selectedPatient.blood_pressure_diastolic,
          doctor_notes: selectedPatient.doctor_notes,
        },
        selectedPatient.ageGroup,
        language
      );
      setAiPlan(plan);
      toast.success(`AI plan generated for ${selectedPatient.name}!`);
    } catch {
      toast.error('AI analysis failed');
    } finally {
      setAnalyzingAI(false);
    }
  };

  const handleApproveProposal = async () => {
    if (!selectedPatient.proposed_ai_plan) return;
    try {
      const proposal = JSON.parse(selectedPatient.proposed_ai_plan);
      // In a real app, you'd have a specific confirm endpoint. 
      // Here we simulate by clearing the proposal and adding it to AI history.
      const updatedRecord = {
        user_id: selectedPatient.id,
        conditions: selectedPatient.conditions,
        fitness_level: selectedPatient.fitness_level,
        resting_heart_rate: selectedPatient.resting_heart_rate,
        blood_pressure_systolic: selectedPatient.blood_pressure_systolic,
        blood_pressure_diastolic: selectedPatient.blood_pressure_diastolic,
        doctor_notes: selectedPatient.doctor_notes,
        proposed_ai_plan: null, // Clear proposal
        confirmed_ai_plan: JSON.stringify(proposal) // Set confirmed
      };
      
      await authApi.adminUpdateMedical(updatedRecord);
      toast.success(`AI Plan for ${selectedPatient.name} confirmed & prescribed! ✅`);
      setAiPlan(proposal);
      setPatients(prev => prev.map(p => p.id === selectedPatient.id ? { ...p, proposed_ai_plan: null, confirmed_ai_plan: JSON.stringify(proposal) } : p));
      setSelectedPatient(prev => ({ ...prev, proposed_ai_plan: null, confirmed_ai_plan: JSON.stringify(proposal) }));
    } catch {
      toast.error('Failed to approve plan');
    }
  };

  const handleStartEditMedical = () => {
    setMedicalForm({
      conditions: selectedPatient.conditions,
      fitness_level: selectedPatient.fitness_level,
      resting_heart_rate: selectedPatient.resting_heart_rate,
      blood_pressure_systolic: selectedPatient.blood_pressure_systolic,
      blood_pressure_diastolic: selectedPatient.blood_pressure_diastolic,
      doctor_notes: selectedPatient.doctor_notes,
    });
    setIsEditingMedical(true);
  };

  const handleSaveMedical = async () => {
    setSavingMedical(true);
    try {
      await authApi.adminUpdateMedical({
        user_id: selectedPatient.id,
        ...medicalForm
      });
      toast.success('Medical record updated successfully! ✅');
      setPatients(prev => prev.map(p => p.id === selectedPatient.id ? { ...p, ...medicalForm } : p));
      setSelectedPatient(prev => ({ ...prev, ...medicalForm }));
      setIsEditingMedical(false);
    } catch {
      toast.error('Failed to update medical record');
    } finally {
      setSavingMedical(false);
    }
  };

  const ageLabel = { child: '👶 Child', adult: '💪 Adult', senior: '🧓 Senior' };
  const intensityColor = { low: '#10B981', medium: '#F59E0B', high: '#EF4444' };

  return (
    <div className="fade-in" style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="h1" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          🩺 Doctor Portal
        </h1>
        <p className="text-muted">View patient records, update medical notes, and generate AI exercise plans.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Patient List */}
        <div className="card" style={{ padding: '1rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ position: 'relative' }}>
              <MdSearch style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input className="form-input" placeholder="Search patients…" value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: '2.25rem' }} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '70vh', overflowY: 'auto' }}>
            {loading ? <div className="spinner" style={{ margin: '2rem auto' }} /> : filtered.map(p => (
              <motion.button key={p.id} whileHover={{ x: 3 }}
                onClick={() => { setSelectedPatient(p); setDoctorNote(p.doctor_notes || ''); setAiPlan(null); setActiveTab('overview'); }}
                style={{
                  background: selectedPatient?.id === p.id ? 'rgba(124,58,237,0.12)' : 'transparent',
                  border: selectedPatient?.id === p.id ? '1px solid rgba(124,58,237,0.3)' : '1px solid transparent',
                  borderRadius: 'var(--radius-sm)', padding: '0.75rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.75rem', textAlign: 'left', width: '100%',
                }}>
                <div className="avatar-placeholder" style={{ width: 38, height: 38, fontSize: '0.9rem', flexShrink: 0 }}>{p.avatar}</div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{ageLabel[p.ageGroup]} · {p.conditions}</div>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                  <div>🔥 {p.streak}d</div>
                  <div>Lv{p.level}</div>
                </div>
              </motion.button>
            ))}
            {!loading && filtered.length === 0 && (
              <div className="text-muted text-sm" style={{ textAlign: 'center', padding: '2rem' }}>No patients found</div>
            )}
          </div>
        </div>

        {/* Patient Detail */}
        {selectedPatient ? (
          <motion.div key={selectedPatient.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Patient Header */}
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.25rem' }}>
              <div className="avatar-placeholder" style={{ width: 60, height: 60, fontSize: '1.4rem', flexShrink: 0 }}>{selectedPatient.avatar}</div>
              <div style={{ flex: 1 }}>
                <div className="h2">{selectedPatient.name}</div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.3rem', flexWrap: 'wrap' }}>
                  <span className="chip chip-purple">{ageLabel[selectedPatient.ageGroup]}</span>
                  <span className="chip chip-cyan">Lv {selectedPatient.level}</span>
                  <span className="chip chip-amber">🔥 {selectedPatient.streak}d streak</span>
                  <span className="chip chip-green">{selectedPatient.points.toLocaleString()} pts</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="text-xs text-muted">Last visit</div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{selectedPatient.last_visit}</div>
              </div>
            </div>

            {/* Tabs */}
            <div className="tabs">
              {[['overview', '📋 Overview'], ['vitals', '💓 Vitals'], ['notes', '📝 Doctor Notes'], ['ai', '🤖 AI Plan']].map(([t, label]) => (
                <button key={t} className={`tab-btn ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>{label}</button>
              ))}
            </div>

            {/* Tab Panels */}
            {activeTab === 'overview' && (
              <div className="card">
                <div className="h4" style={{ marginBottom: '1rem' }}>Clinical Overview</div>
                <div className="grid-2" style={{ gap: '1rem' }}>
                  {[
                    { label: 'Conditions', value: selectedPatient.conditions || 'None' },
                    { label: 'Fitness Level', value: selectedPatient.fitness_level },
                    { label: 'Resting HR', value: `${selectedPatient.resting_heart_rate} BPM` },
                    { label: 'Blood Pressure', value: `${selectedPatient.blood_pressure_systolic}/${selectedPatient.blood_pressure_diastolic} mmHg` },
                  ].map(item => (
                    <div key={item.label} style={{ background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)', padding: '1rem', border: '1px solid var(--border)' }}>
                      <div className="text-xs text-muted">{item.label}</div>
                      <div style={{ fontWeight: 700, fontSize: '1rem', marginTop: '0.25rem' }}>{item.value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                  <button className="btn btn-primary" onClick={() => setActiveTab('ai')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MdAutoAwesome /> Generate AI Plan
                  </button>
                  <button className="btn btn-secondary" onClick={() => setActiveTab('notes')}>📝 Add Note</button>
                </div>
              </div>
            )}

            {activeTab === 'vitals' && (
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <div className="h4">Vitals & Clinical Data</div>
                  {!isEditingMedical ? (
                    <button className="btn btn-secondary btn-sm" onClick={handleStartEditMedical}><MdEdit /> Edit Record</button>
                  ) : (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setIsEditingMedical(false)}>Cancel</button>
                      <button className="btn btn-primary btn-sm" onClick={handleSaveMedical} disabled={savingMedical}><MdSave /> {savingMedical ? 'Saving...' : 'Save'}</button>
                    </div>
                  )}
                </div>
                
                {isEditingMedical ? (
                  <div className="grid-2" style={{ gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Conditions</label>
                      <input className="form-input" value={medicalForm.conditions} onChange={e => setMedicalForm({...medicalForm, conditions: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Fitness Level</label>
                      <select className="form-input" value={medicalForm.fitness_level} onChange={e => setMedicalForm({...medicalForm, fitness_level: e.target.value})}>
                        {['beginner', 'intermediate', 'advanced'].map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Resting HR (BPM)</label>
                      <input className="form-input" type="number" value={medicalForm.resting_heart_rate} onChange={e => setMedicalForm({...medicalForm, resting_heart_rate: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">BP Systolic</label>
                      <input className="form-input" type="number" value={medicalForm.blood_pressure_systolic} onChange={e => setMedicalForm({...medicalForm, blood_pressure_systolic: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">BP Diastolic</label>
                      <input className="form-input" type="number" value={medicalForm.blood_pressure_diastolic} onChange={e => setMedicalForm({...medicalForm, blood_pressure_diastolic: e.target.value})} />
                    </div>
                  </div>
                ) : (
                  <div className="grid-3" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
                    {[
                      { icon: '💓', label: 'Resting HR', value: `${selectedPatient.resting_heart_rate}`, unit: 'BPM', ok: selectedPatient.resting_heart_rate < 80 },
                      { icon: '🩺', label: 'Systolic BP', value: `${selectedPatient.blood_pressure_systolic}`, unit: 'mmHg', ok: selectedPatient.blood_pressure_systolic < 130 },
                      { icon: '📊', label: 'Diastolic BP', value: `${selectedPatient.blood_pressure_diastolic}`, unit: 'mmHg', ok: selectedPatient.blood_pressure_diastolic < 85 },
                      { icon: '🏃', label: 'Fitness Level', value: selectedPatient.fitness_level, unit: '', ok: true },
                      { icon: '🔥', label: 'Day Streak', value: `${selectedPatient.streak}`, unit: 'days', ok: selectedPatient.streak > 3 },
                      { icon: '⭐', label: 'Points', value: selectedPatient.points.toLocaleString(), unit: 'pts', ok: true },
                    ].map(v => (
                      <div key={v.label} className="stat-card" style={{ padding: '1rem' }}>
                        <div style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}>{v.icon}</div>
                        <div className="stat-value" style={{ fontSize: '1.5rem', color: v.ok ? 'var(--success)' : 'var(--danger)' }}>{v.value}</div>
                        <div className="stat-label">{v.label}</div>
                        {v.unit && <div className="text-xs text-muted">{v.unit}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="card">
                <div className="h4" style={{ marginBottom: '1rem' }}>Doctor's Notes for {selectedPatient.name}</div>
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Clinical Notes & Exercise Restrictions</label>
                  <textarea className="form-input form-textarea" value={doctorNote}
                    onChange={e => setDoctorNote(e.target.value)}
                    placeholder="Add exercise restrictions, diet notes, medication interactions, recommended activities…"
                    style={{ minHeight: 160 }} />
                </div>
                <button className="btn btn-primary" onClick={handleSaveNote} disabled={savingNote}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MdSave /> {savingNote ? 'Saving…' : 'Save Notes'}
                </button>
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div className="h4">🤖 AI Exercise Plan for {selectedPatient.name}</div>
                  <button className="btn btn-primary" onClick={handleAIAnalyze} disabled={analyzingAI}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MdAutoAwesome /> {analyzingAI ? 'Analyzing…' : 'Generate Plan'}
                  </button>
                </div>
                {analyzingAI && (
                  <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <div className="spinner" style={{ margin: '0 auto 1rem' }} />
                    <p className="text-muted">AI analyzing {selectedPatient.name}'s medical data…</p>
                  </div>
                )}
                
                {selectedPatient.proposed_ai_plan && !aiPlan && !analyzingAI && (
                  <div className="card" style={{ border: '2px solid var(--amber)', background: 'rgba(245, 158, 11, 0.05)', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ fontSize: '1.5rem' }}>📩</div>
                        <div>
                          <div style={{ fontWeight: 700 }}>Pending AI Proposal</div>
                          <div className="text-xs text-muted">The patient requested an exercise plan update. Review and approve below.</div>
                        </div>
                      </div>
                      <button className="btn btn-primary btn-sm" onClick={handleApproveProposal}>Confirm & Prescribe</button>
                    </div>
                    <div className="text-sm" style={{ padding: '0.75rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', fontStyle: 'italic' }}>
                      "I've analyzed the patient's vitals. Based on their resting HR of {selectedPatient.resting_heart_rate}, I propose the following routine..."
                    </div>
                  </div>
                )}

                {!analyzingAI && !aiPlan && !selectedPatient.proposed_ai_plan && (
                  <div className="empty-state">
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🤖</div>
                    <p className="text-muted">Click "Generate Plan" to create a personalized AI exercise recommendation for this patient.</p>
                  </div>
                )}
                {aiPlan && !analyzingAI && (
                  <>
                    <div className="nudge-banner" style={{ marginBottom: '1.25rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>💡</span>
                      <p style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>{aiPlan.summary}</p>
                    </div>
                    {aiPlan.doctor_prescribed_exercises?.length > 0 && (
                      <div>
                        <div className="h4" style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontSize: '1.2rem' }}>🩺</span> Doctor Prescribed Plan
                        </div>
                        <div className="grid-2" style={{ gap: '0.75rem', marginBottom: '1rem' }}>
                          {aiPlan.doctor_prescribed_exercises.map((ex, i) => (
                            <div key={`doc-${i}`} className="card" style={{ padding: '0.875rem', borderLeft: `4px solid var(--danger)` }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                                <span style={{ fontSize: '1.2rem' }}>{ex.emoji || '🩺'}</span>
                                <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{ex.name}</span>
                                <span className="chip chip-red" style={{ fontSize: '0.65rem', marginLeft: 'auto' }}>Prescribed</span>
                              </div>
                              <div className="text-xs" style={{ color: 'var(--secondary)' }}>⏱ {ex.duration}</div>
                              <div className="text-xs text-muted" style={{ marginTop: '0.2rem' }}>{ex.reason}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {aiPlan.ai_suggested_exercises?.length > 0 && (
                      <div>
                        <div className="h4" style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontSize: '1.2rem' }}>🤖</span> AI Suggested Complementary Plan
                        </div>
                        <div className="grid-2" style={{ gap: '0.75rem', marginBottom: '1rem' }}>
                          {aiPlan.ai_suggested_exercises.map((ex, i) => (
                            <div key={`ai-${i}`} className="card" style={{ padding: '0.875rem', borderLeft: `4px solid ${intensityColor[ex.intensity] || '#7C3AED'}` }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                                <span style={{ fontSize: '1.2rem' }}>{ex.emoji || '🏃'}</span>
                                <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{ex.name}</span>
                                <span className="chip chip-purple" style={{ fontSize: '0.65rem', marginLeft: 'auto' }}>{ex.intensity}</span>
                              </div>
                              <div className="text-xs" style={{ color: 'var(--secondary)' }}>⏱ {ex.duration}</div>
                              <div className="text-xs text-muted" style={{ marginTop: '0.2rem' }}>{ex.reason}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {aiPlan.avoid?.length > 0 && (
                      <div style={{ marginBottom: '1rem' }}>
                        <div className="h4" style={{ color: 'var(--danger)', marginBottom: '0.5rem' }}>⚠ Avoid</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {aiPlan.avoid.map((a, i) => <span key={i} className="chip chip-red">{a}</span>)}
                        </div>
                      </div>
                    )}
                    {aiPlan.tips?.map((tip, i) => (
                      <div key={i} style={{ fontSize: '0.875rem', display: 'flex', gap: '0.5rem' }}>
                        <span style={{ color: 'var(--success)' }}>✓</span><span>{tip}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </motion.div>
        ) : (
          <div className="card empty-state" style={{ padding: '4rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🩺</div>
            <div className="h3" style={{ marginBottom: '0.5rem' }}>Select a Patient</div>
            <p className="text-muted">Choose a patient from the list to view their record and generate AI exercise plans.</p>
          </div>
        )}
      </div>
    </div>
  );
}
