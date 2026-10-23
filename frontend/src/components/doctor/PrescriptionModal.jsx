import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../services/api';
import { Plus, Trash2, Pill, FileText } from 'lucide-react';

export const PrescriptionModal = ({ isOpen, onClose, patientId, patientName, consultationId, appointmentId, onSuccess }) => {
  const { showToast } = useToast();

  const [diagnosis, setDiagnosis] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [medicines, setMedicines] = useState([
    { name: '', dosage: '', frequency: '', duration: '' }
  ]);
  const [instructions, setInstructions] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddMedicine = () => {
    setMedicines([...medicines, { name: '', dosage: '', frequency: '', duration: '' }]);
  };

  const handleRemoveMedicine = (index) => {
    if (medicines.length === 1) return;
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleMedicineChange = (index, field, value) => {
    const updated = [...medicines];
    updated[index][field] = value;
    setMedicines(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!diagnosis.trim()) {
      showToast('Please enter a clinical diagnosis', 'warning');
      return;
    }

    const validMedicines = medicines.filter((m) => m.name.trim() !== '');
    if (validMedicines.length === 0) {
      showToast('Please specify at least one prescribed medicine', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.prescriptions.create({
        patientId,
        consultationId,
        appointmentId,
        diagnosis,
        clinicalNotes,
        medicines: validMedicines,
        instructions,
        followUpDate
      });

      if (res.success) {
        showToast('Digital prescription generated successfully', 'success');
        onClose();
        if (onSuccess) onSuccess(res.data);
      }
    } catch (err) {
      showToast(err.message || 'Failed to create prescription', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Create Digital Prescription: ${patientName || 'Patient'}`} maxWidth="680px">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Diagnosis */}
        <div className="form-group">
          <label className="form-label">Clinical Diagnosis *</label>
          <input
            type="text"
            className="form-input"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            placeholder="e.g. Acute Pharyngitis, Contact Dermatitis"
            required
          />
        </div>

        {/* Clinical Notes */}
        <div className="form-group">
          <label className="form-label">Clinical Notes / Examination Observations</label>
          <textarea
            className="form-textarea"
            style={{ minHeight: '70px' }}
            value={clinicalNotes}
            onChange={(e) => setClinicalNotes(e.target.value)}
            placeholder="Patient vitals, observed symptoms, physical exam remarks..."
          />
        </div>

        {/* Medicines Section */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Pill size={16} color="#0284c7" />
              <span>Prescribed Medicines *</span>
            </label>
            <button
              type="button"
              onClick={handleAddMedicine}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.8rem', padding: '4px 10px' }}
            >
              <Plus size={14} /> Add Medicine
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {medicines.map((med, index) => (
              <div
                key={index}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1.5fr 1fr auto',
                  gap: '8px',
                  alignItems: 'center',
                  backgroundColor: '#f8fafc',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}
              >
                <input
                  type="text"
                  placeholder="Medicine Name (e.g. Paracetamol)"
                  className="form-input"
                  style={{ padding: '6px 8px', fontSize: '0.88rem' }}
                  value={med.name}
                  onChange={(e) => handleMedicineChange(index, 'name', e.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder="Dosage (500mg)"
                  className="form-input"
                  style={{ padding: '6px 8px', fontSize: '0.88rem' }}
                  value={med.dosage}
                  onChange={(e) => handleMedicineChange(index, 'dosage', e.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder="Frequency (Twice daily)"
                  className="form-input"
                  style={{ padding: '6px 8px', fontSize: '0.88rem' }}
                  value={med.frequency}
                  onChange={(e) => handleMedicineChange(index, 'frequency', e.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder="Duration (5 days)"
                  className="form-input"
                  style={{ padding: '6px 8px', fontSize: '0.88rem' }}
                  value={med.duration}
                  onChange={(e) => handleMedicineChange(index, 'duration', e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => handleRemoveMedicine(index)}
                  disabled={medicines.length === 1}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: medicines.length === 1 ? 'not-allowed' : 'pointer',
                    color: medicines.length === 1 ? '#cbd5e1' : '#ef4444',
                    padding: '6px'
                  }}
                  title="Remove item"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="form-group">
          <label className="form-label">Advice / Dietary / General Instructions</label>
          <textarea
            className="form-textarea"
            style={{ minHeight: '60px' }}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="e.g. Drink warm fluids, avoid cold water, take medicine post food."
          />
        </div>

        {/* Follow up date */}
        <div className="form-group">
          <label className="form-label">Recommended Follow-up Date (Optional)</label>
          <input
            type="date"
            className="form-input"
            value={followUpDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => setFollowUpDate(e.target.value)}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className="btn btn-primary">
            {isSubmitting ? 'Creating Prescription...' : 'Issue Prescription'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
