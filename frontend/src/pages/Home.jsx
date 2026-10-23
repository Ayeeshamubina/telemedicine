import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { api } from '../services/api';
import { BookingModal } from '../components/appointment/BookingModal';
import {
  Search,
  MapPin,
  Video,
  Calendar,
  Languages,
  CheckCircle2,
  Stethoscope,
  Heart,
  Thermometer,
  Activity,
  Smile,
  ShieldCheck,
  ArrowRight,
  Crosshair
} from 'lucide-react';

const HEALTH_CONCERNS = [
  { id: 'skin', title: 'Skin Problems', desc: 'Rashes, itching and common skin concerns.', speciality: 'Dermatology', icon: Activity },
  { id: 'cold', title: 'Cold & Cough', desc: 'Sore throat, persistent cough and congestion.', speciality: 'General Physician', icon: Thermometer },
  { id: 'fever', title: 'Fever', desc: 'High body temperature, chills and weakness.', speciality: 'General Physician', icon: Thermometer },
  { id: 'headache', title: 'Headache', desc: 'Migraines, tension headaches and dizziness.', speciality: 'Neurology', icon: Activity },
  { id: 'stomach', title: 'Stomach Pain', desc: 'Acidity, indigestion and abdominal cramps.', speciality: 'General Physician', icon: Activity },
  { id: 'allergies', title: 'Allergies', desc: 'Food allergies, respiratory sensitivity and hives.', speciality: 'Dermatology', icon: Heart }
];

const SPECIALITIES_LIST = [
  { name: 'Cardiology', icon: Heart },
  { name: 'Dermatology', icon: Activity },
  { name: 'Dentistry', icon: Smile },
  { name: 'Gynecology', icon: Stethoscope },
  { name: 'Neurology', icon: Activity },
  { name: 'Orthopedics', icon: Activity },
  { name: 'Pediatrics', icon: Smile },
  { name: 'General Physician', icon: Stethoscope },
  { name: 'Nutrition', icon: Heart }
];

export const Home = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Location search state
  const [locationInput, setLocationInput] = useState('');
  const [locatingUser, setLocatingUser] = useState(false);

  // In-clinic booking section state
  const [specialities, setSpecialities] = useState([]);
  const [selectedSpeciality, setSelectedSpeciality] = useState('');
  const [doctorsInSpeciality, setDoctorsInSpeciality] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  // Load specialities and counts on mount
  useEffect(() => {
    const fetchSpecialities = async () => {
      try {
        const res = await api.doctors.getSpecialities();
        if (res.success) {
          setSpecialities(res.data);
          if (res.data.length > 0) {
            setSelectedSpeciality(res.data[0].name);
          }
        }
      } catch (err) {
        console.error('Failed to load specialities:', err);
      }
    };
    fetchSpecialities();
  }, []);

  // When selectedSpeciality changes in In-Clinic section, load real doctors for that speciality
  useEffect(() => {
    if (!selectedSpeciality) return;
    const fetchDoctors = async () => {
      setLoadingDoctors(true);
      try {
        const res = await api.doctors.getAll({ speciality: selectedSpeciality, mode: 'in-clinic' });
        if (res.success) {
          setDoctorsInSpeciality(res.data || []);
          if (res.data && res.data.length > 0) {
            setSelectedDoctor(res.data[0]);
          } else {
            setSelectedDoctor(null);
          }
        }
      } catch (err) {
        console.error('Failed to load doctors:', err);
        setDoctorsInSpeciality([]);
        setSelectedDoctor(null);
      } finally {
        setLoadingDoctors(false);
      }
    };
    fetchDoctors();
  }, [selectedSpeciality]);

  // Section 18: Location Search (Use My Location or Search by Location)
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser', 'warning');
      return;
    }
    setLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setLocatingUser(false);
        showToast('Location identified. Searching doctors near you...', 'success');
        navigate('/find-doctors?location=NearMe');
      },
      (error) => {
        setLocatingUser(false);
        let msg = 'Location permission was denied. Please enter your location manually.';
        if (error.code === error.TIMEOUT) msg = 'Location request timed out. Please enter location manually.';
        showToast(msg, 'warning');
      },
      { timeout: 10000 }
    );
  };

  const handleManualLocationSearch = (e) => {
    e.preventDefault();
    if (locationInput.trim()) {
      navigate(`/find-doctors?location=${encodeURIComponent(locationInput.trim())}`);
    } else {
      navigate('/find-doctors');
    }
  };

  const handleHealthConcernClick = (speciality) => {
    navigate(`/find-doctors?speciality=${encodeURIComponent(speciality)}`);
  };

  return (
    <div>
      {/* 2. HERO SECTION (Section 16 & 40) */}
      <section
        style={{
          background: 'linear-gradient(180deg, #f0f9ff 0%, #ffffff 100%)',
          paddingTop: '64px',
          paddingBottom: '64px',
          borderBottom: '1px solid #e2e8f0'
        }}
      >
        <div className="container" style={{ textAlign: 'center', maxWidth: '860px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '9999px',
              backgroundColor: '#e0f2fe',
              color: '#0369a1',
              fontSize: '0.85rem',
              fontWeight: 600,
              marginBottom: '20px'
            }}
          >
            <Languages size={16} />
            <span>Multilingual Medical Consultations & Live Interpretation</span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(2.1rem, 4vw, 3rem)',
              color: '#0f172a',
              marginBottom: '16px',
              fontWeight: 800,
              lineHeight: 1.2
            }}
          >
            {t('hero.heading')}
          </h1>

          <p
            style={{
              fontSize: 'clamp(1.05rem, 2vw, 1.2rem)',
              color: '#475569',
              marginBottom: '32px',
              lineHeight: 1.6
            }}
          >
            {t('hero.description')}
          </p>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              flexWrap: 'wrap'
            }}
          >
            <Link to="/find-doctors" className="btn btn-primary btn-lg">
              <Search size={20} />
              <span>{t('hero.findDoctorBtn')}</span>
            </Link>
            <Link to="/find-doctors?mode=online" className="btn btn-secondary btn-lg">
              <Video size={20} color="#0284c7" />
              <span>{t('hero.consultNowBtn')}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 3. QUICK ACTIONS & LOCATION SEARCH (Section 17, 18 & 40) */}
      <section className="section" style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #f1f5f9' }}>
        <div className="container">
          <div className="grid-2" style={{ marginBottom: '40px' }}>
            {/* Quick Card 1: Find Doctors Near You */}
            <div className="card" style={{ borderColor: '#e2e8f0', backgroundColor: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MapPin size={22} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{t('quickActions.nearYouTitle')}</h3>
              </div>
              <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
                {t('quickActions.nearYouDesc')}
              </p>
              <div style={{ marginTop: 'auto' }}>
                <Link to="/find-doctors" className="btn btn-outline btn-sm">
                  {t('quickActions.nearYouBtn')} <ArrowRight size={15} />
                </Link>
              </div>
            </div>

            {/* Quick Card 2: Instant Video Consultation */}
            <div className="card" style={{ borderColor: '#e2e8f0', backgroundColor: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: '#ccfbf1', color: '#0f766e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Video size={22} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{t('quickActions.instantTitle')}</h3>
              </div>
              <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
                {t('quickActions.instantDesc')}
              </p>
              <div style={{ marginTop: 'auto' }}>
                <Link to="/find-doctors?mode=online" className="btn btn-primary btn-sm">
                  {t('quickActions.instantBtn')} <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </div>

          {/* Section 18: Find Doctors Near You - Location Search Bar */}
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
            }}
          >
            <h3 style={{ fontSize: '1.15rem', marginBottom: '16px', color: '#0f172a' }}>
              Search Doctors, Clinics & Hospitals by Location
            </h3>
            <form onSubmit={handleManualLocationSearch} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
                <MapPin size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Enter city, district, or clinic location..."
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '38px' }}
                />
              </div>

              <button
                type="button"
                onClick={handleUseMyLocation}
                disabled={locatingUser}
                className="btn btn-secondary"
                style={{ gap: '8px' }}
              >
                <Crosshair size={18} color="#0284c7" />
                <span>{locatingUser ? 'Locating...' : 'Use My Location'}</span>
              </button>

              <button type="submit" className="btn btn-primary">
                <Search size={18} />
                <span>Search</span>
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* 5. CONSULT A DOCTOR ONLINE (Section 19 & 40) */}
      <section className="section" style={{ backgroundColor: '#f8fafc' }}>
        <div className="container">
          <div className="section-title-wrap">
            <h2 className="section-title">{t('concerns.title')}</h2>
            <p className="section-subtitle">{t('concerns.subtitle')}</p>
          </div>

          <div className="grid-3">
            {HEALTH_CONCERNS.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.id} className="card" style={{ gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '10px',
                        backgroundColor: '#f0f9ff',
                        color: '#0284c7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <Icon size={22} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{item.title}</h4>
                      <span style={{ fontSize: '0.8rem', color: '#0284c7', fontWeight: 600 }}>
                        {item.speciality}
                      </span>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.9rem', color: '#64748b', margin: 0 }}>
                    {item.desc}
                  </p>
                  <div style={{ marginTop: 'auto', paddingTop: '8px' }}>
                    <button
                      onClick={() => handleHealthConcernClick(item.speciality)}
                      className="btn btn-outline btn-sm btn-block"
                    >
                      Consult Now <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. SPECIALITIES (Section 20 & 40) */}
      <section className="section" style={{ backgroundColor: '#ffffff', borderTop: '1px solid #f1f5f9' }}>
        <div className="container">
          <div className="section-title-wrap">
            <h2 className="section-title">{t('specialities.title')}</h2>
            <p className="section-subtitle">{t('specialities.subtitle')}</p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '20px'
            }}
          >
            {SPECIALITIES_LIST.map((spec) => {
              const found = specialities.find((s) => s.name.toLowerCase() === spec.name.toLowerCase());
              const count = found ? found.doctorCount : 0;
              const Icon = spec.icon;

              return (
                <div
                  key={spec.name}
                  onClick={() => navigate(`/find-doctors?speciality=${encodeURIComponent(spec.name)}`)}
                  className="card"
                  style={{
                    cursor: 'pointer',
                    alignItems: 'center',
                    textAlign: 'center',
                    padding: '24px 16px',
                    gap: '12px'
                  }}
                >
                  <div
                    style={{
                      width: '54px',
                      height: '54px',
                      borderRadius: '50%',
                      backgroundColor: '#f0f9ff',
                      color: '#0284c7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Icon size={26} />
                  </div>
                  <h4 style={{ margin: 0, fontSize: '1.05rem' }}>{spec.name}</h4>
                  <span style={{ fontSize: '0.85rem', color: count > 0 ? '#059669' : '#94a3b8', fontWeight: 500 }}>
                    {count > 0 ? `${count} Doctors available` : 'No registered doctors yet'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. IN-CLINIC APPOINTMENT (Section 21 & 40) */}
      <section className="section" style={{ backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
        <div className="container">
          <div className="section-title-wrap">
            <h2 className="section-title">{t('inClinic.title')}</h2>
            <p className="section-subtitle">{t('inClinic.subtitle')}</p>
          </div>

          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '820px',
              margin: '0 auto',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
              {/* Select Speciality */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">{t('inClinic.selectSpeciality')}</label>
                <select
                  className="form-select"
                  value={selectedSpeciality}
                  onChange={(e) => setSelectedSpeciality(e.target.value)}
                >
                  {SPECIALITIES_LIST.map((spec) => (
                    <option key={spec.name} value={spec.name}>
                      {spec.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Registered Doctor */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">{t('inClinic.selectDoctor')}</label>
                <select
                  className="form-select"
                  disabled={loadingDoctors || doctorsInSpeciality.length === 0}
                  value={selectedDoctor?._id || ''}
                  onChange={(e) => {
                    const doc = doctorsInSpeciality.find((d) => d._id === e.target.value);
                    setSelectedDoctor(doc || null);
                  }}
                >
                  {doctorsInSpeciality.length === 0 ? (
                    <option value="">No doctors available in this speciality yet</option>
                  ) : (
                    doctorsInSpeciality.map((doc) => (
                      <option key={doc._id} value={doc._id}>
                        Dr. {doc.user?.name} ({doc.location || 'Clinic'})
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {selectedDoctor ? (
              <div
                style={{
                  backgroundColor: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: '10px',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  marginBottom: '24px'
                }}
              >
                <div>
                  <h4 style={{ margin: 0, color: '#0369a1', fontSize: '1rem' }}>
                    Dr. {selectedDoctor.user?.name}
                  </h4>
                  <span style={{ fontSize: '0.85rem', color: '#075985' }}>
                    {selectedDoctor.clinicHospitalInfo || selectedDoctor.location} • ₹{selectedDoctor.consultationFee} Consultation Fee
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setBookingModalOpen(true)}
                  className="btn btn-primary"
                >
                  <Calendar size={18} />
                  <span>Proceed to Book Slot</span>
                </button>
              </div>
            ) : (
              <div
                style={{
                  border: '1px dashed #cbd5e1',
                  borderRadius: '8px',
                  padding: '24px',
                  textAlign: 'center',
                  color: '#64748b',
                  fontSize: '0.92rem',
                  marginBottom: '16px'
                }}
              >
                No registered in-clinic doctors found for {selectedSpeciality} yet.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 8. ABOUT MEDIBRIDGE (Section 41 & 40) */}
      <section className="section" style={{ backgroundColor: '#ffffff', borderTop: '1px solid #f1f5f9' }}>
        <div className="container" style={{ maxWidth: '960px' }}>
          <div className="section-title-wrap">
            <h2 className="section-title">{t('about.title')}</h2>
            <p className="section-subtitle">{t('about.desc')}</p>
          </div>

          <div style={{ marginTop: '32px' }}>
            <h3 style={{ textAlign: 'center', marginBottom: '32px', color: '#0f172a' }}>
              {t('about.howItWorks')}
            </h3>

            <div className="grid-2" style={{ gap: '24px' }}>
              <div className="card" style={{ gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#0284c7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>1</span>
                  <h4 style={{ margin: 0 }}>{t('about.step1Title')}</h4>
                </div>
                <p style={{ margin: 0, fontSize: '0.92rem', color: '#64748b' }}>
                  {t('about.step1Desc')}
                </p>
              </div>

              <div className="card" style={{ gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#0284c7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>2</span>
                  <h4 style={{ margin: 0 }}>{t('about.step2Title')}</h4>
                </div>
                <p style={{ margin: 0, fontSize: '0.92rem', color: '#64748b' }}>
                  {t('about.step2Desc')}
                </p>
              </div>

              <div className="card" style={{ gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#0284c7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>3</span>
                  <h4 style={{ margin: 0 }}>{t('about.step3Title')}</h4>
                </div>
                <p style={{ margin: 0, fontSize: '0.92rem', color: '#64748b' }}>
                  {t('about.step3Desc')}
                </p>
              </div>

              <div className="card" style={{ gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#0284c7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>4</span>
                  <h4 style={{ margin: 0 }}>{t('about.step4Title')}</h4>
                </div>
                <p style={{ margin: 0, fontSize: '0.92rem', color: '#64748b' }}>
                  {t('about.step4Desc')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Booking Modal */}
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
  );
};
