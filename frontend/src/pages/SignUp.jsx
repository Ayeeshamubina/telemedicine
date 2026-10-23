import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { User, Stethoscope, Languages, ArrowLeft, CheckCircle2 } from 'lucide-react';

const SPECIALITIES = [
  'General Physician',
  'Cardiology',
  'Dermatology',
  'Dentistry',
  'Gynecology',
  'Neurology',
  'Orthopedics',
  'Pediatrics',
  'Nutrition'
];

const AVAILABLE_LANGUAGES = ['English', 'Tamil', 'Hindi', 'Telugu', 'Malayalam', 'Kannada'];

export const SignUp = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { showToast } = useToast();

  const [selectedRole, setSelectedRole] = useState(null); // 'patient', 'doctor', 'interpreter'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Common Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');

  // Patient Fields
  const [preferredLanguage, setPreferredLanguage] = useState('English');

  // Doctor Fields
  const [speciality, setSpeciality] = useState('General Physician');
  const [experience, setExperience] = useState(5);
  const [doctorLanguages, setDoctorLanguages] = useState(['English']);
  const [clinicHospitalInfo, setClinicHospitalInfo] = useState('');
  const [professionalBio, setProfessionalBio] = useState('');
  const [consultationFee, setConsultationFee] = useState(500);

  // Interpreter Fields
  const [interpreterLanguages, setInterpreterLanguages] = useState(['English', 'Tamil']);

  const handleDoctorLangToggle = (lang) => {
    if (doctorLanguages.includes(lang)) {
      if (doctorLanguages.length > 1) {
        setDoctorLanguages(doctorLanguages.filter((l) => l !== lang));
      }
    } else {
      setDoctorLanguages([...doctorLanguages, lang]);
    }
  };

  const handleInterpreterLangToggle = (lang) => {
    if (interpreterLanguages.includes(lang)) {
      if (interpreterLanguages.length > 2) {
        setInterpreterLanguages(interpreterLanguages.filter((l) => l !== lang));
      } else {
        showToast('Interpreters must support at least two languages', 'warning');
      }
    } else {
      setInterpreterLanguages([...interpreterLanguages, lang]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      showToast('Passwords do not match', 'error');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long');
      showToast('Password must be at least 6 characters long', 'error');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      role: selectedRole,
      name,
      email,
      password,
      confirmPassword,
      phone,
      location
    };

    if (selectedRole === 'patient') {
      payload.preferredLanguage = preferredLanguage;
    } else if (selectedRole === 'doctor') {
      payload.speciality = speciality;
      payload.experience = Number(experience);
      payload.languages = doctorLanguages;
      payload.clinicHospitalInfo = clinicHospitalInfo;
      payload.professionalBio = professionalBio;
      payload.consultationFee = Number(consultationFee);
    } else if (selectedRole === 'interpreter') {
      payload.supportedLanguages = interpreterLanguages;
      payload.experience = Number(experience);
      payload.professionalBio = professionalBio;
    }

    try {
      const res = await register(payload);
      showToast(`Account created! Welcome, ${res.user.name}.`, 'success');

      if (res.user.role === 'patient') navigate('/patient/dashboard');
      else if (res.user.role === 'doctor') navigate('/doctor/dashboard');
      else if (res.user.role === 'interpreter') navigate('/interpreter/dashboard');
      else navigate('/');
    } catch (err) {
      const msg = err.message || 'Registration failed';
      setErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="section" style={{ minHeight: '80vh' }}>
      <div className="container" style={{ maxWidth: '680px' }}>
        <div
          className="card"
          style={{
            padding: '36px',
            backgroundColor: '#ffffff',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.06)'
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <h1 style={{ fontSize: '1.85rem', marginBottom: '8px', color: '#0f172a' }}>
              Create Your MEDIBRIDGE Account
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
              {!selectedRole
                ? 'Choose your account type:'
                : `Complete ${selectedRole} registration`}
            </p>
          </div>

          {errorMsg && (
            <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
              {errorMsg}
            </div>
          )}

          {/* ROLE SELECTION CARDS (Section 9: Patient, Doctor, Interpreter) */}
          {!selectedRole ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                onClick={() => setSelectedRole('patient')}
                style={{
                  border: '1px solid #cbd5e1',
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  backgroundColor: '#ffffff'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#0284c7';
                  e.currentTarget.style.backgroundColor = '#f0f9ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#cbd5e1';
                  e.currentTarget.style.backgroundColor = '#ffffff';
                }}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <User size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', margin: '0 0 4px', color: '#0f172a' }}>Patient</h3>
                  <p style={{ fontSize: '0.88rem', color: '#64748b', margin: 0 }}>
                    Search doctors, book in-clinic and video consultations, and receive digital prescriptions in your language.
                  </p>
                </div>
              </div>

              <div
                onClick={() => setSelectedRole('doctor')}
                style={{
                  border: '1px solid #cbd5e1',
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  backgroundColor: '#ffffff'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#0284c7';
                  e.currentTarget.style.backgroundColor = '#f0f9ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#cbd5e1';
                  e.currentTarget.style.backgroundColor = '#ffffff';
                }}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Stethoscope size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', margin: '0 0 4px', color: '#0f172a' }}>Doctor</h3>
                  <p style={{ fontSize: '0.88rem', color: '#64748b', margin: 0 }}>
                    Manage clinic availability, conduct video consults with live interpreter support, and write prescriptions.
                  </p>
                </div>
              </div>

              <div
                onClick={() => setSelectedRole('interpreter')}
                style={{
                  border: '1px solid #cbd5e1',
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  backgroundColor: '#ffffff'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#0284c7';
                  e.currentTarget.style.backgroundColor = '#f0f9ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#cbd5e1';
                  e.currentTarget.style.backgroundColor = '#ffffff';
                }}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#ccfbf1', color: '#0f766e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Languages size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', margin: '0 0 4px', color: '#0f172a' }}>Interpreter</h3>
                  <p style={{ fontSize: '0.88rem', color: '#64748b', margin: 0 }}>
                    Provide live verbal interpretation between doctors and patients during active telemedicine sessions.
                  </p>
                </div>
              </div>

              <div style={{ textAlign: 'center', marginTop: '16px', color: '#64748b', fontSize: '0.9rem' }}>
                Already registered?{' '}
                <Link to="/login" style={{ color: '#0284c7', fontWeight: 600 }}>
                  Sign in to your account
                </Link>
              </div>
            </div>
          ) : (
            /* REGISTRATION FORMS */
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <button
                type="button"
                onClick={() => setSelectedRole(null)}
                style={{
                  alignSelf: 'flex-start',
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.88rem',
                  padding: 0,
                  marginBottom: '8px'
                }}
              >
                <ArrowLeft size={16} /> Change account type
              </button>

              <div
                style={{
                  backgroundColor: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  fontSize: '0.88rem',
                  color: '#0369a1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span>Selected Account Type:</span>
                <strong style={{ textTransform: 'capitalize' }}>{selectedRole}</strong>
              </div>

              {/* Full Name */}
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder={selectedRole === 'doctor' ? 'e.g. Ramesh Kumar' : 'e.g. Priya Sharma'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input"
                />
              </div>

              {/* Email */}
              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                />
              </div>

              {/* Phone Number */}
              <div className="form-group">
                <label className="form-label">Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="form-input"
                />
              </div>

              {/* Location */}
              <div className="form-group">
                <label className="form-label">Location (City / Area) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chennai, Bangalore, Hyderabad"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="form-input"
                />
              </div>

              {/* Role-Specific Fields: Patient */}
              {selectedRole === 'patient' && (
                <div className="form-group">
                  <label className="form-label">Preferred Consultation Language</label>
                  <select
                    className="form-select"
                    value={preferredLanguage}
                    onChange={(e) => setPreferredLanguage(e.target.value)}
                  >
                    {AVAILABLE_LANGUAGES.map((lang) => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Role-Specific Fields: Doctor */}
              {selectedRole === 'doctor' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Medical Speciality *</label>
                    <select
                      className="form-select"
                      value={speciality}
                      onChange={(e) => setSpeciality(e.target.value)}
                    >
                      {SPECIALITIES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Years of Clinical Experience *</label>
                    <input
                      type="number"
                      min="0"
                      max="60"
                      required
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Consultation Fee (₹ INR) *</label>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      required
                      value={consultationFee}
                      onChange={(e) => setConsultationFee(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Languages Spoken *</label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {AVAILABLE_LANGUAGES.map((lang) => {
                        const isSelected = doctorLanguages.includes(lang);
                        return (
                          <button
                            key={lang}
                            type="button"
                            onClick={() => handleDoctorLangToggle(lang)}
                            style={{
                              padding: '6px 14px',
                              borderRadius: '9999px',
                              border: `1px solid ${isSelected ? '#0284c7' : '#cbd5e1'}`,
                              backgroundColor: isSelected ? '#e0f2fe' : '#ffffff',
                              color: isSelected ? '#0369a1' : '#475569',
                              fontWeight: 600,
                              fontSize: '0.85rem',
                              cursor: 'pointer'
                            }}
                          >
                            {isSelected ? '✓ ' : ''}{lang}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Clinic or Hospital Affiliation *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Apollo Medical Center, Anna Nagar"
                      value={clinicHospitalInfo}
                      onChange={(e) => setClinicHospitalInfo(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Professional Background & Registration Bio</label>
                    <textarea
                      placeholder="Degrees, medical council registration details, clinical focus..."
                      value={professionalBio}
                      onChange={(e) => setProfessionalBio(e.target.value)}
                      className="form-textarea"
                    />
                  </div>
                </>
              )}

              {/* Role-Specific Fields: Interpreter */}
              {selectedRole === 'interpreter' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Supported Languages (Select at least 2) *</label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {AVAILABLE_LANGUAGES.map((lang) => {
                        const isSelected = interpreterLanguages.includes(lang);
                        return (
                          <button
                            key={lang}
                            type="button"
                            onClick={() => handleInterpreterLangToggle(lang)}
                            style={{
                              padding: '6px 14px',
                              borderRadius: '9999px',
                              border: `1px solid ${isSelected ? '#0f766e' : '#cbd5e1'}`,
                              backgroundColor: isSelected ? '#ccfbf1' : '#ffffff',
                              color: isSelected ? '#115e59' : '#475569',
                              fontWeight: 600,
                              fontSize: '0.85rem',
                              cursor: 'pointer'
                            }}
                          >
                            {isSelected ? '✓ ' : ''}{lang}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Years of Professional Medical Interpretation *</label>
                    <input
                      type="number"
                      min="0"
                      max="40"
                      required
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Certification & Background Bio</label>
                    <textarea
                      placeholder="Medical interpretation certifications, hospital experience..."
                      value={professionalBio}
                      onChange={(e) => setProfessionalBio(e.target.value)}
                      className="form-textarea"
                    />
                  </div>
                </>
              )}

              {/* Password & Confirm Password */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary btn-block btn-lg"
                style={{ marginTop: '12px' }}
              >
                {isSubmitting
                  ? 'Creating Account...'
                  : selectedRole === 'doctor'
                  ? 'Create Doctor Account'
                  : selectedRole === 'interpreter'
                  ? 'Create Interpreter Account'
                  : 'Create Account'}
              </button>

              <div style={{ textAlign: 'center', marginTop: '8px', color: '#64748b', fontSize: '0.88rem' }}>
                Already registered?{' '}
                <Link to="/login" style={{ color: '#0284c7', fontWeight: 600 }}>
                  Sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
