import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { BookingModal } from '../components/appointment/BookingModal';
import { Building2, Calendar, MapPin, UserCheck, ArrowRight } from 'lucide-react';

const SPECIALITIES_LIST = [
  'Cardiology',
  'Dermatology',
  'Dentistry',
  'Gynecology',
  'Neurology',
  'Orthopedics',
  'Pediatrics',
  'General Physician',
  'Nutrition'
];

export const InClinicBooking = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [selectedSpeciality, setSelectedSpeciality] = useState(SPECIALITIES_LIST[0]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  useEffect(() => {
    const fetchDoctors = async () => {
      setLoading(true);
      try {
        const res = await api.doctors.getAll({
          speciality: selectedSpeciality,
          mode: 'in-clinic'
        });
        if (res.success) {
          setDoctors(res.data || []);
        }
      } catch (err) {
        console.error('Failed to load doctors:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, [selectedSpeciality]);

  const handleBookClick = (doctor) => {
    setSelectedDoctor(doctor);
    setBookingModalOpen(true);
  };

  return (
    <div className="section" style={{ minHeight: '80vh', backgroundColor: '#f8fafc' }}>
      <div className="container" style={{ maxWidth: '900px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '9999px', backgroundColor: '#f0f9ff', color: '#0284c7', fontSize: '0.85rem', fontWeight: 600, marginBottom: '12px' }}>
            <Building2 size={16} /> In-Clinic Healthcare
          </div>
          <h1 style={{ fontSize: '2rem', marginBottom: '8px', color: '#0f172a' }}>
            Book an In-Clinic Appointment
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
            Select a speciality, choose an in-clinic physician, and reserve an appointment slot.
          </p>
        </div>

        {/* Speciality Pills */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '12px',
            marginBottom: '28px'
          }}
        >
          {SPECIALITIES_LIST.map((spec) => (
            <button
              key={spec}
              onClick={() => setSelectedSpeciality(spec)}
              style={{
                padding: '8px 16px',
                borderRadius: '9999px',
                border: `1px solid ${selectedSpeciality === spec ? '#0284c7' : '#cbd5e1'}`,
                backgroundColor: selectedSpeciality === spec ? '#0284c7' : '#ffffff',
                color: selectedSpeciality === spec ? '#ffffff' : '#475569',
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {spec}
            </button>
          ))}
        </div>

        {/* Doctors List */}
        <div>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
              Loading in-clinic doctors...
            </div>
          ) : doctors.length === 0 ? (
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px dashed #cbd5e1',
                borderRadius: '16px',
                padding: '48px 24px',
                textAlign: 'center',
                color: '#64748b'
              }}
            >
              <h3 style={{ fontSize: '1.15rem', color: '#0f172a', marginBottom: '8px' }}>
                No registered doctors found in {selectedSpeciality}
              </h3>
              <p style={{ fontSize: '0.9rem', margin: 0 }}>
                Please try another speciality or check back as more doctors join.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {doctors.map((doctor) => (
                <div
                  key={doctor._id}
                  className="card"
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '16px',
                    padding: '24px'
                  }}
                >
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        backgroundColor: '#e0f2fe',
                        color: '#0284c7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.25rem',
                        fontWeight: 700
                      }}
                    >
                      {doctor.user?.name?.charAt(0)}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.15rem', margin: '0 0 4px', color: '#0f172a' }}>
                        Dr. {doctor.user?.name}
                      </h3>
                      <div style={{ color: '#0284c7', fontSize: '0.88rem', fontWeight: 600, marginBottom: '4px' }}>
                        {doctor.speciality} • {doctor.experience} yrs exp
                      </div>
                      <div style={{ color: '#64748b', fontSize: '0.85rem' }}>
                        {doctor.clinicHospitalInfo || doctor.location}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Fee</span>
                      <strong style={{ fontSize: '1.1rem', color: '#0f172a' }}>₹{doctor.consultationFee}</strong>
                    </div>
                    <button
                      onClick={() => handleBookClick(doctor)}
                      className="btn btn-primary"
                    >
                      <Calendar size={16} /> Book Slot
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedDoctor && (
          <BookingModal
            isOpen={bookingModalOpen}
            onClose={() => setBookingModalOpen(false)}
            doctor={selectedDoctor}
            defaultMode="in-clinic"
            onBookedSuccess={() => {
              navigate('/patient/dashboard');
            }}
          />
        )}
      </div>
    </div>
  );
};
