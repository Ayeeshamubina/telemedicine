import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Globe, Award, Calendar, Video, Clock, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../services/api';

export const DoctorCard = ({ doctor, onBookClick }) => {
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const doctorUser = doctor.user || {};
  const doctorName = doctorUser.name || 'Doctor';
  const speciality = doctor.speciality || 'General Physician';
  const experience = doctor.experience || 0;
  const languages = doctor.languages || ['English'];
  const location = doctor.location || doctorUser.location || 'Clinic';
  const fee = doctor.consultationFee || 500;
  const isAvailableNow = doctor.isAvailableNow;

  const handleInstantConsult = async () => {
    if (!isAuthenticated) {
      showToast('Please sign in as a patient to start an instant consultation', 'warning');
      navigate('/login');
      return;
    }
    if (user.role !== 'patient') {
      showToast('Only registered patients can initiate consultations', 'warning');
      return;
    }

    try {
      showToast('Connecting to doctor...', 'info');
      const res = await api.consultations.startInstant({
        doctorId: doctor._id,
        patientLanguage: user.preferredLanguage || 'English'
      });
      if (res.success && res.data?.roomId) {
        navigate(`/consultation/${res.data.roomId}`);
      }
    } catch (err) {
      showToast(err.message || 'Unable to initiate instant consultation', 'error');
    }
  };

  return (
    <div className="card" style={{ gap: '16px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              backgroundColor: '#e0f2fe',
              color: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
              fontWeight: 700,
              flexShrink: 0
            }}
          >
            {doctorName.charAt(0)}
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem', color: '#0f172a', marginBottom: '2px' }}>
              Dr. {doctorName}
            </h3>
            <span style={{ color: '#0284c7', fontWeight: 600, fontSize: '0.9rem' }}>
              {speciality}
            </span>
          </div>
        </div>

        {isAvailableNow && (
          <span className="badge badge-success" style={{ gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />
            Available Now
          </span>
        )}
      </div>

      {/* Meta Details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem', color: '#475569' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Award size={16} color="#64748b" style={{ flexShrink: 0 }} />
          <span>{experience} years of clinical experience</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Globe size={16} color="#64748b" style={{ flexShrink: 0 }} />
          <span>Languages: {languages.join(', ')}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MapPin size={16} color="#64748b" style={{ flexShrink: 0 }} />
          <span>{location} {doctor.clinicHospitalInfo ? `• ${doctor.clinicHospitalInfo}` : ''}</span>
        </div>
      </div>

      {/* Consultation Fee & Modes */}
      <div
        style={{
          borderTop: '1px solid #f1f5f9',
          paddingTop: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px'
        }}
      >
        <div>
          <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block' }}>Consultation Fee</span>
          <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>₹{fee}</span>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {doctor.consultationModes?.online && (
            <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
              Online Video
            </span>
          )}
          {doctor.consultationModes?.inClinic && (
            <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
              In-Clinic
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons (Section 22: View Profile, Book Appointment, Consult Now) */}
      <div className="card-footer" style={{ borderTop: '1px solid #f1f5f9', paddingTop: '14px', width: '100%' }}>
        <Link to={`/doctor/${doctor._id}`} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
          View Profile
        </Link>
        <button
          onClick={() => onBookClick && onBookClick(doctor)}
          className="btn btn-outline btn-sm"
          style={{ flex: 1 }}
        >
          <Calendar size={15} />
          <span>Book Appointment</span>
        </button>
        {doctor.consultationModes?.online && (
          <button
            onClick={handleInstantConsult}
            className="btn btn-primary btn-sm"
            style={{ flex: 1 }}
          >
            <Video size={15} />
            <span>Consult Now</span>
          </button>
        )}
      </div>
    </div>
  );
};
