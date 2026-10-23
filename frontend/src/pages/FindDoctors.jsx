import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { DoctorCard } from '../components/doctor/DoctorCard';
import { BookingModal } from '../components/appointment/BookingModal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { Search, Filter, Stethoscope, MapPin, Globe, UserCheck } from 'lucide-react';

const SPECIALITIES = [
  'All',
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

const LANGUAGES = ['All', 'English', 'Tamil', 'Hindi', 'Telugu', 'Malayalam', 'Kannada'];

export const FindDoctors = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedSpeciality, setSelectedSpeciality] = useState(searchParams.get('speciality') || 'All');
  const [selectedLanguage, setSelectedLanguage] = useState(searchParams.get('language') || 'All');
  const [locationQuery, setLocationQuery] = useState(searchParams.get('location') || '');
  const [consultationMode, setConsultationMode] = useState(searchParams.get('mode') || 'all');

  // Booking Modal
  const [activeDoctorForBooking, setActiveDoctorForBooking] = useState(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  const fetchDoctors = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (selectedSpeciality && selectedSpeciality !== 'All') params.speciality = selectedSpeciality;
      if (selectedLanguage && selectedLanguage !== 'All') params.language = selectedLanguage;
      if (locationQuery && locationQuery !== 'NearMe') params.location = locationQuery;
      if (consultationMode && consultationMode !== 'all') params.mode = consultationMode;

      const res = await api.doctors.getAll(params);
      if (res.success) {
        setDoctors(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load doctors:', err);
      setError('Unable to load doctors. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [selectedSpeciality, selectedLanguage, consultationMode]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDoctors();
  };

  const handleOpenBooking = (doctor) => {
    setActiveDoctorForBooking(doctor);
    setBookingModalOpen(true);
  };

  return (
    <div className="section" style={{ minHeight: '80vh' }}>
      <div className="container">
        {/* Title */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '8px', color: '#0f172a' }}>
            Find a Doctor
          </h1>
          <p style={{ color: '#64748b', fontSize: '1rem', margin: 0 }}>
            Connect with verified healthcare practitioners for in-clinic visits or live online consultations.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '32px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}
        >
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Top search inputs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              <div style={{ position: 'relative' }}>
                <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Doctor name or hospital..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '38px' }}
                />
              </div>

              <div style={{ position: 'relative' }}>
                <MapPin size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="City, area, or location..."
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '38px' }}
                />
              </div>

              <button type="submit" className="btn btn-primary">
                <Search size={18} />
                <span>Search Doctors</span>
              </button>
            </div>

            {/* Filter Dropdowns (Section 22: Speciality, Language, Availability, Mode) */}
            <div
              style={{
                display: 'flex',
                gap: '12px',
                flexWrap: 'wrap',
                paddingTop: '16px',
                borderTop: '1px solid #f1f5f9',
                alignItems: 'center'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.88rem', fontWeight: 600 }}>
                <Filter size={16} />
                <span>Filters:</span>
              </div>

              {/* Speciality */}
              <select
                aria-label="Filter by speciality"
                value={selectedSpeciality}
                onChange={(e) => setSelectedSpeciality(e.target.value)}
                className="form-select"
                style={{ width: 'auto', minWidth: '150px', padding: '6px 12px', fontSize: '0.88rem' }}
              >
                {SPECIALITIES.map((s) => (
                  <option key={s} value={s}>{s === 'All' ? 'All Specialities' : s}</option>
                ))}
              </select>

              {/* Language */}
              <select
                aria-label="Filter by language"
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="form-select"
                style={{ width: 'auto', minWidth: '140px', padding: '6px 12px', fontSize: '0.88rem' }}
              >
                {LANGUAGES.map((l) => (
                  <option key={l} value={l}>{l === 'All' ? 'All Languages' : l}</option>
                ))}
              </select>

              {/* Mode */}
              <select
                aria-label="Filter by consultation mode"
                value={consultationMode}
                onChange={(e) => setConsultationMode(e.target.value)}
                className="form-select"
                style={{ width: 'auto', minWidth: '150px', padding: '6px 12px', fontSize: '0.88rem' }}
              >
                <option value="all">All Modes</option>
                <option value="online">Online Video Call</option>
                <option value="in-clinic">In-Clinic Visit</option>
              </select>

              {(searchQuery || locationQuery || selectedSpeciality !== 'All' || selectedLanguage !== 'All' || consultationMode !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setLocationQuery('');
                    setSelectedSpeciality('All');
                    setSelectedLanguage('All');
                    setConsultationMode('all');
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ marginLeft: 'auto' }}
                >
                  Reset Filters
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Doctor Results (Section 10 & 22) */}
        {loading ? (
          <LoadingSpinner message="Loading doctors..." size="large" />
        ) : error ? (
          <div className="alert alert-danger" style={{ maxWidth: '600px', margin: '24px auto' }}>
            {error}
          </div>
        ) : doctors.length === 0 ? (
          <EmptyState
            icon={UserCheck}
            title="No doctors available yet."
            description="We could not find registered doctors matching your search criteria. Try modifying your filters or check back shortly."
            actionText="Clear Filters"
            onAction={() => {
              setSearchQuery('');
              setLocationQuery('');
              setSelectedSpeciality('All');
              setSelectedLanguage('All');
              setConsultationMode('all');
            }}
          />
        ) : (
          <div className="grid-2">
            {doctors.map((doctor) => (
              <DoctorCard
                key={doctor._id}
                doctor={doctor}
                onBookClick={handleOpenBooking}
              />
            ))}
          </div>
        )}

        {/* Booking Modal */}
        {activeDoctorForBooking && (
          <BookingModal
            isOpen={bookingModalOpen}
            onClose={() => setBookingModalOpen(false)}
            doctor={activeDoctorForBooking}
            onBookedSuccess={() => {
              setBookingModalOpen(false);
            }}
          />
        )}
      </div>
    </div>
  );
};
