import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { BookingModal } from '../components/appointment/BookingModal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import {
  MapPin,
  Globe,
  Award,
  Calendar,
  Video,
  Clock,
  Building2,
  CheckCircle,
  ArrowLeft,
  ShieldCheck
} from 'lucide-react';

export const DoctorProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingMode, setBookingMode] = useState('online');

  useEffect(() => {
    const fetchDoctor = async () => {
      setLoading(true);
      try {
        const res = await api.doctors.getById(id);
        if (res.success) {
          setDoctor(res.data);
        } else {
          setError('Doctor profile not found');
        }
      } catch (err) {
        console.error('Failed to load doctor profile:', err);
        setError('Doctor is no longer available or profile could not be loaded.');
      } finally {
        setLoading(false);
      }
    };
    fetchDoctor();
  }, [id]);

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
      showToast(err.message || 'Unable to initiate consultation', 'error');
    }
  };

  const openBooking = (mode) => {
    setBookingMode(mode);
    setBookingModalOpen(true);
  };

  if (loading) {
    return <LoadingSpinner message="Loading doctor profile..." size="large" />;
  }

  if (error || !doctor) {
    return (
      <div className="section">
        <div className="container" style={{ textAlign: 'center', maxWidth: '500px' }}>
          <div className="alert alert-danger">{error || 'Doctor not found'}</div>
          <Link to="/find-doctors" className="btn btn-secondary">
            <ArrowLeft size={16} /> Return to Find Doctors
          </Link>
        </div>
      </div>
    );
  }

  const doctorUser = doctor.user || {};

  return (
    <div className="section" style={{ minHeight: '80vh', backgroundColor: '#f8fafc' }}>
      <div className="container" style={{ maxWidth: '960px' }}>
        {/* Back Link */}
        <div style={{ marginBottom: '20px' }}>
          <Link to="/find-doctors" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.9rem', fontWeight: 500 }}>
            <ArrowLeft size={16} /> Back to Find Doctors
          </Link>
        </div>

        {/* Doctor Header Card */}
        <div
          className="card"
          style={{
            marginBottom: '24px',
            padding: '32px',
            backgroundColor: '#ffffff'
          }}
        >
          <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div
              style={{
                width: '84px',
                height: '84px',
                borderRadius: '50%',
                backgroundColor: '#e0f2fe',
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                fontWeight: 700,
                flexShrink: 0
              }}
            >
              {doctorUser.name?.charAt(0) || 'D'}
            </div>

            <div style={{ flex: 1, minWidth: '260px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                <h1 style={{ fontSize: '1.75rem', margin: 0, color: '#0f172a' }}>
                  Dr. {doctorUser.name}
                </h1>
                <span className="badge badge-success" style={{ gap: '4px' }}>
                  <ShieldCheck size={14} /> Verified Practitioner
                </span>
                {doctor.isAvailableNow && (
                  <span className="badge badge-primary">Available for Instant Consultation</span>
                )}
              </div>

              <div style={{ color: '#0284c7', fontWeight: 600, fontSize: '1.05rem', marginBottom: '14px' }}>
                {doctor.speciality}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', color: '#475569', fontSize: '0.92rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Award size={18} color="#0284c7" />
                  <span>{doctor.experience} years clinical experience</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Globe size={18} color="#0284c7" />
                  <span>Languages: {doctor.languages?.join(', ')}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={18} color="#0284c7" />
                  <span>{doctor.location}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building2 size={18} color="#0284c7" />
                  <span>{doctor.clinicHospitalInfo}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons (Section 23: Book Appointment, Consult Now) */}
          <div
            style={{
              marginTop: '28px',
              paddingTop: '24px',
              borderTop: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px'
            }}
          >
            <div>
              <span style={{ fontSize: '0.85rem', color: '#64748b', display: 'block' }}>Consultation Fee</span>
              <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a' }}>₹{doctor.consultationFee}</span>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={() => openBooking('in-clinic')}
                className="btn btn-secondary"
              >
                <Calendar size={18} />
                <span>Book In-Clinic Visit</span>
              </button>

              <button
                onClick={() => openBooking('online')}
                className="btn btn-outline"
              >
                <Video size={18} />
                <span>Schedule Online Call</span>
              </button>

              {doctor.consultationModes?.online && (
                <button
                  onClick={handleInstantConsult}
                  className="btn btn-primary"
                >
                  <Video size={18} />
                  <span>Consult Now</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* About & Bio */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '12px' }}>Professional Background</h3>
          <p style={{ fontSize: '0.95rem', color: '#475569', lineHeight: 1.6, margin: 0 }}>
            {doctor.professionalBio ||
              `Dr. ${doctorUser.name} is a dedicated ${doctor.speciality} with over ${doctor.experience} years of clinical practice, providing personalized care and consultations at ${doctor.clinicHospitalInfo || doctor.location}.`}
          </p>
        </div>

        {/* Configured Availability Schedule */}
        <div className="card">
          <h3 style={{ fontSize: '1.15rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={18} color="#0284c7" />
            <span>Consultation Schedule & Availability</span>
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
            {doctor.availability?.map((dayConfig) => (
              <div
                key={dayConfig.day}
                style={{
                  backgroundColor: dayConfig.enabled ? '#ffffff' : '#f8fafc',
                  border: `1px solid ${dayConfig.enabled ? '#cbd5e1' : '#f1f5f9'}`,
                  borderRadius: '10px',
                  padding: '12px',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: dayConfig.enabled ? '#0f172a' : '#94a3b8', marginBottom: '6px' }}>
                  {dayConfig.day.substring(0, 3)}
                </div>
                {dayConfig.enabled && dayConfig.slots?.length > 0 ? (
                  <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>
                    {dayConfig.slots.length} Slots
                  </div>
                ) : (
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    Closed
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        doctor={doctor}
        defaultMode={bookingMode}
        onBookedSuccess={() => {
          navigate('/patient/dashboard');
        }}
      />
    </div>
  );
};
