/* eslint-disable no-unused-vars, react-hooks/exhaustive-deps */
import { useState, useEffect, useRef } from 'react';
import { auth as authApi } from '../api/client';
import { useStore } from '../store/useStore';
import { analyzeAndModifyExercises } from '../services/gemini';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { habits as habitsApi } from '../api/client';
import { MdMedicalInformation, MdLockOutline, MdAutoAwesome, MdAddTask } from 'react-icons/md';

export default function MedicalRecord() {
  const { ageGroup, language, setMedicalRecord: cacheMedical, role } = useStore();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiPlan, setAiPlan] = useState(null);
  const [aiLang, setAiLang] = useState(language || 'en');
  const [showPlan, setShowPlan] = useState(false);

  useEffect(() => {
    authApi.medicalRecord().then(res => {
      setRecord(res.data);
      cacheMedical(res.data);
      if (res.data.confirmed_ai_plan) {
        try {
          setAiPlan(JSON.parse(res.data.confirmed_ai_plan));
          setShowPlan(true);
        } catch (e) {
          console.error("Failed to parse confirmed plan", e);
        }
      }
    }).catch(() => toast.error('Failed to load medical record'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    if (role === 'patient') return;
    setRecord({ ...record, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await authApi.updateMedical(record);
      cacheMedical(record);
      toast.success('Medical record updated! Running AI analysis…');
      // Trigger AI analysis after save
      runAIAnalysis(record);
    } catch {
      toast.error('Failed to save record');
    } finally {
      setSaving(false);
    }
  };

  const runAIAnalysis = async (rec) => {
    setAnalyzing(true);
    setShowPlan(true);
    try {
      const plan = await analyzeAndModifyExercises(rec, ageGroup, aiLang);
      if (role === 'patient') {
        // Save as proposal
        const updated = { ...record, proposed_ai_plan: JSON.stringify(plan) };
        await authApi.updateMedical(updated);
        setRecord(updated);
        cacheMedical(updated);
        toast.success("AI Proposal sent to your Doctor for confirmation 📩");
      } else {
        setAiPlan(plan);
        toast.success('AI exercise plan generated! 🤖');
      }
    } catch {
      toast.error('AI analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading || !record) return <div className="spinner" style={{ margin: '4rem auto' }} />;

  const handleAddToTasks = async (ex, type) => {
    try {
      await habitsApi.create({
        title: `${ex.name} ${type === 'doctor' ? '[Doctor]' : '[AI]'}`,
        duration_minutes: parseInt(ex.duration) || 15,
        difficulty: ex.intensity === 'high' ? 'hard' : ex.intensity === 'medium' ? 'medium' : 'easy',
        frequency: 'daily'
      });
      toast.success(`${ex.name} added to your Habits! Check Tasks ✅`);
    } catch {
      toast.error('Could not add to tasks.');
    }
  };

  // Patients see a fully read-only view
  if (role === 'patient' || role === 'user') {
    const vitals = [
      { icon: '⚕️', label: 'Conditions', value: record.conditions || 'None' },
      { icon: '💊', label: 'Medications', value: record.medications || 'None' },
      { icon: '🌿', label: 'Allergies', value: record.allergies || 'None' },
      { icon: '💓', label: 'Resting HR', value: record.resting_heart_rate ? `${record.resting_heart_rate} BPM` : '—' },
      { icon: '🩺', label: 'BP (Sys/Dia)', value: record.blood_pressure_systolic ? `${record.blood_pressure_systolic} / ${record.blood_pressure_diastolic}` : '—' },
      { icon: '🩸', label: 'Blood Glucose', value: record.blood_glucose ? `${record.blood_glucose} mg/dL` : '—' },
      { icon: '🏃', label: 'Fitness Level', value: record.fitness_level || '—' },
    ];
    return (
      <div className="fade-in" style={{ maxWidth: 860, margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 className="h1" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <MdMedicalInformation color="var(--danger)" /> Medical Record
          </h1>
          <div className="nudge-banner" style={{ background: 'rgba(6,182,212,0.08)', borderColor: 'var(--secondary)', marginTop: '0.75rem' }}>
            <MdLockOutline size={20} />
            <p style={{ fontSize: '0.875rem' }}>
              Your medical record is <strong>managed by your doctor</strong>. Only your assigned doctor can update clinical data or exercise plans. You can view your record and track your medications below.
            </p>
          </div>
        </div>

        {/* Vitals Grid */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="h3" style={{ marginBottom: '1.25rem' }}>Your Health Summary</div>
          <div className="grid-3" style={{ gap: '1rem' }}>
            {vitals.map(v => (
              <div key={v.label} style={{ background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)', padding: '1rem', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '1.4rem', marginBottom: '0.25rem' }}>{v.icon}</div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{v.value}</div>
                <div className="text-xs text-muted">{v.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Doctor Notes */}
        {record.doctor_notes && (
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="h4" style={{ marginBottom: '0.75rem' }}>📋 Doctor's Notes</div>
            <p style={{ lineHeight: 1.7, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{record.doctor_notes}</p>
          </div>
        )}

        {/* Confirmed AI Plan */}
        {showPlan && aiPlan && (
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ borderTop: '3px solid var(--primary)' }}>
            <div className="h3" style={{ marginBottom: '1rem' }}>🤖 Your Doctor-Confirmed Exercise Plan</div>
            <div className="nudge-banner" style={{ marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '1.5rem' }}>💡</span>
              <p style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>{aiPlan.summary}</p>
            </div>
            <div className="grid-2" style={{ gap: '0.875rem' }}>
              {(aiPlan.ai_suggested_exercises || aiPlan.exercises || []).map((ex, i) => (
                <motion.div key={i} className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                  style={{ padding: '1rem', borderLeft: `4px solid ${ex.intensity === 'low' ? '#10B981' : ex.intensity === 'medium' ? '#F59E0B' : '#EF4444'}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
                    <span style={{ fontSize: '1.3rem' }}>{ex.emoji || '🏃'}</span>
                    <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{ex.name}</span>
                  </div>
                  <div className="text-xs" style={{ color: 'var(--secondary)', marginBottom: '0.25rem' }}>⏱ {ex.duration}</div>
                  <div className="text-xs text-muted">{ex.reason}</div>
                  <button className="btn btn-sm btn-secondary" style={{ marginTop: '0.75rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                    onClick={() => handleAddToTasks(ex, 'ai')}>
                    <MdAddTask /> Add to Tasks
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {!record.confirmed_ai_plan && (
          <div className="card" style={{ textAlign: 'center', padding: '2rem', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⏳</div>
            <p className="text-muted" style={{ fontSize: '0.875rem' }}>Your doctor hasn't confirmed an AI exercise plan yet. They can generate and send one from the Doctor Portal.</p>
          </div>
        )}
      </div>
    );
  }



  const intensityColor = { low: '#10B981', medium: '#F59E0B', high: '#EF4444' };

  return (
    <div className="fade-in" style={{ maxWidth: 860, margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="h1" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <MdMedicalInformation color="var(--danger)" /> Medical Record
        </h1>
        <p className="text-muted">
          Your health data securely helps the AI Coach generate personalized recommendations.{' '}
          <MdLockOutline style={{ display: 'inline', verticalAlign: 'text-bottom' }} /> Private & Encrypted.
        </p>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          <div>
            <h3 className="h4" style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Clinical Data</h3>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Conditions (Comma separated)</label>
                <input name="conditions" className="form-input" readOnly={role === 'patient'} value={record.conditions} onChange={handleChange} placeholder="e.g. Asthma, Hypertension" />
              </div>
              <div className="form-group">
                <label className="form-label">Allergies</label>
                <input name="allergies" className="form-input" readOnly={role === 'patient'} value={record.allergies} onChange={handleChange} placeholder="e.g. Penicillin, Peanuts" />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Current Medications</label>
                <input name="medications" className="form-input" readOnly={role === 'patient'} value={record.medications} onChange={handleChange} placeholder="e.g. Metformin 500mg daily" />
              </div>
            </div>
          </div>

          <div>
            <h3 className="h4" style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Vitals & Fitness Data</h3>
            <div className="grid-3">
              <div className="form-group">
                <label className="form-label">Resting Heart Rate (BPM)</label>
                <input name="resting_heart_rate" type="number" readOnly={role === 'patient'} className="form-input" value={record.resting_heart_rate || ''} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">BP Systolic</label>
                <input name="blood_pressure_systolic" type="number" readOnly={role === 'patient'} className="form-input" value={record.blood_pressure_systolic || ''} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">BP Diastolic</label>
                <input name="blood_pressure_diastolic" type="number" readOnly={role === 'patient'} className="form-input" value={record.blood_pressure_diastolic || ''} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Blood Glucose (mg/dL)</label>
                <input name="blood_glucose" type="number" step="0.1" readOnly={role === 'patient'} className="form-input" value={record.blood_glucose || ''} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Current Fitness Level</label>
                <select name="fitness_level" className="form-input form-select" disabled={role === 'patient'} value={record.fitness_level} onChange={handleChange}>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <h3 className="h4" style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Doctor's Notes (Optional)</h3>
            <div className="form-group">
              <textarea name="doctor_notes" className="form-input form-textarea" readOnly={role === 'patient'} value={record.doctor_notes} onChange={handleChange} placeholder="Details or notes from your physician regarding exercise/diet limits." />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
            <button type="button" className="btn btn-secondary"
              onClick={() => runAIAnalysis(record)} disabled={analyzing}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MdAutoAwesome color="var(--primary-light)" />
              {analyzing ? 'Analyzing…' : (role === 'patient' ? 'Request AI Plan Upgrade' : 'Analyze with AI')}
            </button>
            {role !== 'patient' && (
              <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
                {saving ? 'Saving...' : 'Securely Save Record'}
              </button>
            )}
          </div>
            {role === 'patient' && record.proposed_ai_plan && !aiPlan && (
              <div className="nudge-banner" style={{ background: 'rgba(245, 158, 11, 0.1)', borderColor: 'var(--amber)', marginTop: '1rem' }}>
                <span style={{ fontSize: '1.2rem' }}>⏳</span>
                <p style={{ fontSize: '0.875rem' }}>AI has proposed an updated exercise plan. <strong>Waiting for your Doctor's confirmation</strong> before it appears in your tasks.</p>
              </div>
            )}
          </form>
        </div>

      {/* AI Exercise Plan Panel */}
      <AnimatePresence>
        {showPlan && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="card"
            style={{ borderTop: '3px solid var(--primary)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ fontSize: '1.8rem' }}>🤖</div>
                <div>
                  <div className="h3">AI Exercise Recommendations</div>
                  <div className="text-xs text-muted">Based on your medical profile & age group: {ageGroup}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  className={`btn btn-sm ${aiLang === 'en' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => { setAiLang('en'); if (record) runAIAnalysis(record); }}>
                  🇬🇧 EN
                </button>
                <button
                  className={`btn btn-sm ${aiLang === 'ta' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => { setAiLang('ta'); if (record) runAIAnalysis(record); }}>
                  🇮🇳 தமிழ்
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowPlan(false)}>✕</button>
              </div>
            </div>

            {analyzing ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div className="spinner" style={{ margin: '0 auto 1rem' }} />
                <p className="text-muted">Analyzing your medical data with AI…</p>
              </div>
            ) : aiPlan ? (
              <>
                {/* Summary */}
                <div className="nudge-banner" style={{ marginBottom: '1.25rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>💡</span>
                  <p style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>{aiPlan.summary}</p>
                </div>

                {/* Doctor Prescribed Exercises */}
                {aiPlan.doctor_prescribed_exercises?.length > 0 && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div className="h4" style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: '1.3rem' }}>🩺</span> Doctor Prescribed Plan
                    </div>
                    <div className="grid-2" style={{ gap: '0.75rem' }}>
                      {aiPlan.doctor_prescribed_exercises.map((ex, i) => (
                        <motion.div key={`doc-${i}`} className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                          style={{ padding: '1rem', borderLeft: `4px solid var(--danger)` }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                            <span style={{ fontSize: '1.4rem' }}>{ex.emoji || '🩺'}</span>
                            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{ex.name}</span>
                            <span className={`chip chip-red`} style={{ fontSize: '0.7rem', marginLeft: 'auto' }}>Prescribed</span>
                          </div>
                          <div className="text-xs" style={{ color: 'var(--secondary)', marginBottom: '0.3rem' }}>⏱ {ex.duration}</div>
                          <div className="text-xs text-muted" style={{ marginBottom: '0.75rem' }}>{ex.reason}</div>
                          <button 
                            className="btn btn-sm btn-primary" 
                            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                            onClick={() => handleAddToTasks(ex, 'doctor')}
                          >
                            <MdAddTask /> Add to Tasks
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Suggested Exercises */}
                {aiPlan.ai_suggested_exercises?.length > 0 && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div className="h4" style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: '1.3rem' }}>🤖</span> AI Suggested Plan
                    </div>
                    <div className="grid-2" style={{ gap: '0.75rem' }}>
                      {aiPlan.ai_suggested_exercises.map((ex, i) => (
                        <motion.div key={`ai-${i}`} className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                          style={{ padding: '1rem', borderLeft: `4px solid ${intensityColor[ex.intensity] || '#7C3AED'}` }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                            <span style={{ fontSize: '1.4rem' }}>{ex.emoji || '🏃'}</span>
                            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{ex.name}</span>
                            <span className={`chip chip-${ex.intensity === 'low' ? 'green' : ex.intensity === 'medium' ? 'amber' : 'purple'}`} style={{ fontSize: '0.7rem', marginLeft: 'auto' }}>
                              {ex.intensity}
                            </span>
                          </div>
                          <div className="text-xs" style={{ color: 'var(--secondary)', marginBottom: '0.3rem' }}>⏱ {ex.duration}</div>
                          <div className="text-xs text-muted" style={{ marginBottom: '0.75rem' }}>{ex.reason}</div>
                          <button 
                            className="btn btn-sm btn-secondary" 
                            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', background: 'var(--bg-card)' }}
                            onClick={() => handleAddToTasks(ex, 'ai')}
                          >
                            <MdAddTask /> Add to Tasks
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Avoid */}
                {aiPlan.avoid?.length > 0 && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div className="h4" style={{ marginBottom: '0.5rem', color: 'var(--danger)' }}>⚠ Exercises to Avoid</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {aiPlan.avoid.map((a, i) => (
                        <span key={i} className="chip chip-red">{a}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tips */}
                {aiPlan.tips?.length > 0 && (
                  <div>
                    <div className="h4" style={{ marginBottom: '0.5rem' }}>💚 Health Tips</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {aiPlan.tips.map((tip, i) => (
                        <div key={i} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.875rem' }}>
                          <span>✓</span><span>{tip}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
