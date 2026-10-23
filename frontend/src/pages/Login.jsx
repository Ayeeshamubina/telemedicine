import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { User, Stethoscope, Languages, Lock, Mail, ArrowRight, ArrowLeft } from 'lucide-react';

const ROLES = [
  {
    id: 'patient',
    title: 'Patient',
    desc: 'Book in-clinic visits, consult online, and view your digital prescriptions.',
    icon: User
  },
  {
    id: 'doctor',
    title: 'Doctor',
    desc: 'Conduct appointments, video consults, manage practice, and write prescriptions.',
    icon: Stethoscope
  },
  {
    id: 'interpreter',
    title: 'Interpreter',
    desc: 'Assist consultations live across language barriers on-demand.',
    icon: Languages
  }
];

export const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();

  const [step, setStep] = useState(1); // 1: Choose Role, 2: Credentials
  const [selectedRole, setSelectedRole] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSelectRole = (roleId) => {
    setSelectedRole(roleId);
    setStep(2);
    setErrorMsg(null);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password || !selectedRole) {
      showToast('Please enter your email, password, and select your role', 'warning');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await login(email, password, selectedRole);
      showToast(`Welcome back, ${res.user.name}!`, 'success');

      if (res.user.role === 'patient') navigate('/patient/dashboard');
      else if (res.user.role === 'doctor') navigate('/doctor/dashboard');
      else if (res.user.role === 'interpreter') navigate('/interpreter/dashboard');
      else navigate('/');
    } catch (err) {
      const msg = err.message || 'Login failed. Please check your credentials.';
      setErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="section" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center' }}>
      <div className="container" style={{ maxWidth: '580px' }}>
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
            <h1 style={{ fontSize: '1.75rem', marginBottom: '8px', color: '#0f172a' }}>
              Sign In to MEDIBRIDGE
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
              {step === 1 ? 'Step 1: Choose your account type' : `Step 2: Enter credentials for ${selectedRole}`}
            </p>
          </div>

          {errorMsg && (
            <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
              {errorMsg}
            </div>
          )}

          {/* STEP 1: CHOOSE ROLE (Patient, Doctor, Interpreter) */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {ROLES.map((role) => {
                const Icon = role.icon;
                return (
                  <div
                    key={role.id}
                    onClick={() => handleSelectRole(role.id)}
                    style={{
                      border: '1px solid #cbd5e1',
                      borderRadius: '12px',
                      padding: '18px 20px',
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
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '10px',
                        backgroundColor: '#e0f2fe',
                        color: '#0284c7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <Icon size={22} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '1.1rem', margin: '0 0 2px', color: '#0f172a' }}>
                        {role.title}
                      </h3>
                      <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                        {role.desc}
                      </p>
                    </div>
                    <ArrowRight size={18} color="#94a3b8" />
                  </div>
                );
              })}

              <div style={{ textAlign: 'center', marginTop: '16px', color: '#64748b', fontSize: '0.9rem' }}>
                Don't have an account?{' '}
                <Link to="/signup" style={{ color: '#0284c7', fontWeight: 600 }}>
                  Create one now
                </Link>
              </div>
            </div>
          )}

          {/* STEP 2: CREDENTIALS */}
          {step === 2 && (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <button
                type="button"
                onClick={() => setStep(1)}
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
                <ArrowLeft size={16} /> Back to role selection
              </button>

              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  fontSize: '0.85rem',
                  color: '#334155',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span>Logging in as:</span>
                <span className="badge badge-primary" style={{ textTransform: 'capitalize' }}>
                  {selectedRole}
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="form-input"
                    style={{ paddingLeft: '38px' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="form-input"
                    style={{ paddingLeft: '38px' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary btn-block btn-lg"
                style={{ marginTop: '8px' }}
              >
                {isSubmitting ? 'Verifying Account...' : 'Sign In'}
              </button>

              <div style={{ textAlign: 'center', marginTop: '12px', color: '#64748b', fontSize: '0.9rem' }}>
                Need an account?{' '}
                <Link to="/signup" style={{ color: '#0284c7', fontWeight: 600 }}>
                  Sign up here
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
