import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { ShieldCheck, Lock, Mail } from 'lucide-react';

export const AdminLogin = () => {
  const navigate = useNavigate();
  const { adminLogin } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await adminLogin(email, password);
      showToast('Administrator session verified', 'success');
      navigate('/admin/dashboard');
    } catch (err) {
      const msg = err.message || 'Invalid administrator credentials';
      setErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0f172a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#1e293b',
          borderRadius: '16px',
          padding: '36px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
          border: '1px solid #334155'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '12px',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}
          >
            <ShieldCheck size={28} />
          </div>
          <h1 style={{ fontSize: '1.5rem', color: '#ffffff', margin: '0 0 6px' }}>
            System Administration
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0 }}>
            Restricted operations portal for MEDIBRIDGE platform administrators.
          </p>
        </div>

        {errorMsg && (
          <div
            style={{
              backgroundColor: '#450a0a',
              border: '1px solid #7f1d1d',
              color: '#fca5a5',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              marginBottom: '20px'
            }}
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label" style={{ color: '#cbd5e1' }}>Admin Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@medibridge.org"
                className="form-input"
                style={{
                  paddingLeft: '38px',
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  color: '#f8fafc'
                }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ color: '#cbd5e1' }}>Admin Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="form-input"
                style={{
                  paddingLeft: '38px',
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  color: '#f8fafc'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary btn-block btn-lg"
            style={{ marginTop: '8px' }}
          >
            {isSubmitting ? 'Authenticating...' : 'Access Administration Console'}
          </button>
        </form>
      </div>
    </div>
  );
};
