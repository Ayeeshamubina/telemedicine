import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../services/api';
import { Calendar, Clock, Video, Building2, CheckCircle2 } from 'lucide-react';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const BookingModal = ({ isOpen, onClose, doctor, onBookedSuccess, defaultMode = 'online' }) => {
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [mode, setMode] = useState(defaultMode);
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [reason, setReason] = useState('General Medical Consultation');
  const [patientLanguage, setPatientLanguage] = useState(user?.preferredLanguage || 'English');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (defaultMode) setMode(defaultMode);
  }, [defaultMode]);

  // Load booked slots and determine available slots whenever date or doctor changes
  useEffect(() => {
    if (!isOpen || !doctor || !date) return;

    const fetchSlotsAndBookings = async () => {
      setLoadingSlots(true);
      setSelectedSlot(null);
      try {
        // 1. Get already booked slots for this doctor on this date
        const res = await api.appointments.getBookedSlots(doctor._id, date);
        const booked = res.data || [];
        setBookedSlots(booked);

        // 2. Determine day of week from date
        const [year, month, day] = date.split('-').map(Number);
        const selectedDateObj = new Date(year, month - 1, day);
        const dayName = DAYS_OF_WEEK[selectedDateObj.getDay()];

        // 3. Find doctor's configured availability for that day
        const dayConfig = doctor.availability?.find((d) => d.day === dayName);
        if (dayConfig && dayConfig.enabled && dayConfig.slots?.length > 0) {
          // Filter slots suitable for chosen mode
          const suitableSlots = dayConfig.slots.filter(
            (s) => s.mode === 'both' || s.mode === mode
          );
          setAvailableSlots(suitableSlots);
        } else {
          // Default standard business hours fallback if none explicitly defined
          const fallbackSlots = [
            { start: '09:00', end: '10:00' },
            { start: '10:00', end: '11:00' },
            { start: '11:00', end: '12:00' },
            { start: '14:00', end: '15:00' },
            { start: '15:00', end: '16:00' },
            { start: '16:00', end: '17:00' },
            { start: '17:00', end: '18:00' },
            { start: '18:00', end: '19:00' }
          ];
          setAvailableSlots(fallbackSlots);
        }
      } catch (err) {
        console.error('Failed to load slots:', err);
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlotsAndBookings();
  }, [isOpen, doctor, date, mode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      showToast('Please sign in as a patient to book an appointment', 'warning');
      return;
    }
    if (user?.role !== 'patient') {
      showToast('Only patients can book appointments', 'warning');
      return;
    }
    if (!selectedSlot) {
      showToast('Please select an available time slot', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.appointments.create({
        doctorId: doctor._id,
        type: mode,
        date,
        timeSlot: selectedSlot,
        speciality: doctor.speciality,
        reason,
        patientLanguage
      });

      if (res.success) {
        showToast('Appointment booked successfully!', 'success');
        onClose();
        if (onBookedSuccess) onBookedSuccess(res.data);
      }
    } catch (err) {
      showToast(err.message || 'Unable to book appointment', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!doctor) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Book Appointment with Dr. ${doctor.user?.name || ''}`}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Mode Selector */}
        <div className="form-group">
          <label className="form-label">Consultation Mode</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <button
              type="button"
              onClick={() => setMode('online')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px',
                borderRadius: '8px',
                border: `2px solid ${mode === 'online' ? '#0284c7' : '#e2e8f0'}`,
                backgroundColor: mode === 'online' ? '#f0f9ff' : '#ffffff',
                color: mode === 'online' ? '#0284c7' : '#475569',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Video size={18} />
              <span>Online Video</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('in-clinic')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px',
                borderRadius: '8px',
                border: `2px solid ${mode === 'in-clinic' ? '#0284c7' : '#e2e8f0'}`,
                backgroundColor: mode === 'in-clinic' ? '#f0f9ff' : '#ffffff',
                color: mode === 'in-clinic' ? '#0284c7' : '#475569',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Building2 size={18} />
              <span>In-Clinic Visit</span>
            </button>
          </div>
        </div>

        {/* Date Selection */}
        <div className="form-group">
          <label className="form-label">Select Date</label>
          <input
            type="date"
            className="form-input"
            value={date}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        {/* Time Slot Picker */}
        <div className="form-group">
          <label className="form-label">
            Available Time Slots {loadingSlots ? '(Checking available slots...)' : ''}
          </label>
          {loadingSlots ? (
            <div style={{ color: '#64748b', fontSize: '0.9rem', padding: '12px' }}>
              Checking available slots...
            </div>
          ) : availableSlots.length === 0 ? (
            <div style={{ color: '#94a3b8', fontSize: '0.9rem', padding: '12px', border: '1px dashed #cbd5e1', borderRadius: '8px', textAlign: 'center' }}>
              No available slots on this day. Please select a different date.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px' }}>
              {availableSlots.map((slot, index) => {
                const isBooked = bookedSlots.includes(slot.start);
                const isSelected = selectedSlot?.start === slot.start;

                return (
                  <button
                    key={index}
                    type="button"
                    disabled={isBooked}
                    onClick={() => setSelectedSlot(slot)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      border: `1px solid ${isSelected ? '#0284c7' : isBooked ? '#f1f5f9' : '#cbd5e1'}`,
                      backgroundColor: isSelected ? '#0284c7' : isBooked ? '#f8fafc' : '#ffffff',
                      color: isSelected ? '#ffffff' : isBooked ? '#cbd5e1' : '#334155',
                      cursor: isBooked ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '2px'
                    }}
                  >
                    <span>{slot.start} - {slot.end}</span>
                    <span style={{ fontSize: '0.72rem', opacity: 0.85 }}>
                      {isBooked ? 'Booked' : 'Available'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Reason for Visit */}
        <div className="form-group">
          <label className="form-label">Reason for Consultation</label>
          <input
            type="text"
            className="form-input"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Skin rash checkup, Follow-up consultation"
            required
          />
        </div>

        {/* Patient Consultation Language */}
        <div className="form-group">
          <label className="form-label">Your Preferred Language</label>
          <select
            className="form-select"
            value={patientLanguage}
            onChange={(e) => setPatientLanguage(e.target.value)}
          >
            <option value="English">English</option>
            <option value="Tamil">Tamil</option>
            <option value="Hindi">Hindi</option>
            <option value="Telugu">Telugu</option>
            <option value="Malayalam">Malayalam</option>
            <option value="Kannada">Kannada</option>
          </select>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
            If the doctor does not speak this language, an on-demand medical interpreter can be requested during the session.
          </span>
        </div>

        {/* Submit */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting || !selectedSlot} className="btn btn-primary">
            {isSubmitting ? 'Confirming Appointment...' : 'Confirm Appointment'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
