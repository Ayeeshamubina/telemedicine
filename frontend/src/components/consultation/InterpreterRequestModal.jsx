import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../services/api';
import { Languages, UserCheck, AlertTriangle } from 'lucide-react';

const COMMON_LANGUAGES = ['English', 'Tamil', 'Hindi', 'Telugu', 'Malayalam', 'Kannada'];

export const InterpreterRequestModal = ({
  isOpen,
  onClose,
  roomId,
  initialPatientLang = 'English',
  initialDoctorLang = 'English',
  onRequestSent
}) => {
  const { showToast } = useToast();
  const [patientLang, setPatientLang] = useState(initialPatientLang);
  const [doctorLang, setDoctorLang] = useState(initialDoctorLang);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleRequest = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await api.interpreters.request({
        roomId,
        patientLanguage: patientLang,
        doctorLanguage: doctorLang
      });

      if (res.success) {
        showToast(`Request sent to ${res.matchedCount} available interpreter(s)`, 'success');
        if (onRequestSent) onRequestSent(res.data);
        onClose();
      }
    } catch (err) {
      const msg = err.message || 'Unable to request interpreter at this time.';
      setErrorMessage(msg);
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Request Human Medical Interpreter">
      <form onSubmit={handleRequest} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <p style={{ fontSize: '0.9rem', color: '#64748b', margin: 0 }}>
          Connect an active registered human interpreter into this consultation to translate live between patient and doctor.
        </p>

        {errorMessage && (
          <div className="alert alert-danger" style={{ fontSize: '0.88rem' }}>
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <div>{errorMessage}</div>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Patient Primary Language</label>
          <select
            className="form-select"
            value={patientLang}
            onChange={(e) => setPatientLang(e.target.value)}
          >
            {COMMON_LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Doctor Primary Language</label>
          <select
            className="form-select"
            value={doctorLang}
            onChange={(e) => setDoctorLang(e.target.value)}
          >
            {COMMON_LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
        </div>

        <div
          style={{
            backgroundColor: '#f0f9ff',
            borderRadius: '8px',
            padding: '12px 14px',
            fontSize: '0.85rem',
            color: '#0369a1',
            lineHeight: 1.4
          }}
        >
          An interpreter request will be dispatched to currently active interpreters who speak both <strong>{patientLang}</strong> and <strong>{doctorLang}</strong>. Once accepted, they will join this video consultation immediately.
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className="btn btn-primary">
            {isSubmitting ? 'Locating Interpreters...' : 'Request Interpreter'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
