import { useState, useEffect } from 'react';
import { auth as authApi } from '../api/client';
import toast from 'react-hot-toast';
import { MdMedicalInformation, MdLockOutline } from 'react-icons/md';

export default function MedicalRecord() {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    authApi.medicalRecord().then(res => {
      setRecord(res.data);
    }).catch(() => toast.error('Failed to load medical record'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    setRecord({ ...record, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await authApi.updateMedical(record);
      toast.success('Medical record updated successfully');
    } catch {
      toast.error('Failed to save record');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !record) return <div className="spinner" style={{ margin: '4rem auto' }} />;

  return (
    <div className="fade-in" style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="h1 flex align-center gap-2"><MdMedicalInformation color="var(--danger)" /> Medical Record</h1>
        <p className="text-muted">Your health data securely helps the AI AI Coach generate personalized recommendations. <MdLockOutline style={{ display: 'inline', verticalAlign: 'text-bottom' }} /> Private & Encrypted.</p>
      </div>

      <div className="card">
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div>
            <h3 className="h4" style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Clinical Data</h3>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Conditions (Comma separated)</label>
                <input name="conditions" className="form-input" value={record.conditions} onChange={handleChange} placeholder="e.g. Asthma, Hypertension" />
              </div>
              <div className="form-group">
                <label className="form-label">Allergies</label>
                <input name="allergies" className="form-input" value={record.allergies} onChange={handleChange} placeholder="e.g. Penicillin, Peanuts" />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Current Medications</label>
                <input name="medications" className="form-input" value={record.medications} onChange={handleChange} placeholder="e.g. Metformin 500mg daily" />
              </div>
            </div>
          </div>

          <div>
            <h3 className="h4" style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Vitals & Fitness Data</h3>
            <div className="grid-3">
              <div className="form-group">
                <label className="form-label">Resting Heart Rate (BPM)</label>
                <input name="resting_heart_rate" type="number" className="form-input" value={record.resting_heart_rate || ''} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">BP Systolic</label>
                <input name="blood_pressure_systolic" type="number" className="form-input" value={record.blood_pressure_systolic || ''} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">BP Diastolic</label>
                <input name="blood_pressure_diastolic" type="number" className="form-input" value={record.blood_pressure_diastolic || ''} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Blood Glucose (mg/dL)</label>
                <input name="blood_glucose" type="number" step="0.1" className="form-input" value={record.blood_glucose || ''} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Current Fitness Level</label>
                <select name="fitness_level" className="form-input form-select" value={record.fitness_level} onChange={handleChange}>
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
              <textarea name="doctor_notes" className="form-input form-textarea" value={record.doctor_notes} onChange={handleChange} placeholder="Details or notes from your physician regarding exercise/diet limits." />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
              {saving ? 'Saving...' : 'Securely Save Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
