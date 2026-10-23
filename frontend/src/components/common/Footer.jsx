import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Logo } from './Logo';
import { AlertCircle, ShieldCheck, HeartHandshake } from 'lucide-react';

export const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer
      style={{
        backgroundColor: '#ffffff',
        borderTop: '1px solid #e2e8f0',
        marginTop: 'auto',
        paddingTop: '48px',
        paddingBottom: '32px'
      }}
    >
      <div className="container">
        {/* Top Disclaimer Box (Section 50 Legal & Safety) */}
        <div
          style={{
            backgroundColor: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '10px',
            padding: '16px 20px',
            marginBottom: '40px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px'
          }}
        >
          <AlertCircle size={22} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontWeight: 700, color: '#92400e', marginBottom: '4px', fontSize: '0.95rem' }}>
              Important Medical Safety Notice
            </div>
            <p style={{ color: '#78350f', fontSize: '0.88rem', margin: 0, lineHeight: 1.5 }}>
              MEDIBRIDGE is not intended for medical emergencies. If you or someone you know is experiencing a life-threatening condition or acute medical trauma, please contact your local emergency medical service immediately.
            </p>
          </div>
        </div>

        {/* Main Footer Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '32px',
            marginBottom: '40px'
          }}
        >
          {/* Brand info */}
          <div>
            <div style={{ marginBottom: '16px' }}>
              <Logo />
            </div>
            <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.6 }}>
              A real multilingual telemedicine ecosystem empowering patients and physicians to consult securely across languages with on-demand medical interpretation.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f766e', fontSize: '0.85rem', fontWeight: 600 }}>
              <ShieldCheck size={18} />
              <span>HIPAA-aligned Patient Privacy & Data Protection</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ fontSize: '1rem', color: '#0f172a', marginBottom: '16px' }}>
              Platform
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li>
                <Link to="/" style={{ color: '#475569', fontSize: '0.9rem' }}>
                  {t('nav.home')}
                </Link>
              </li>
              <li>
                <Link to="/find-doctors" style={{ color: '#475569', fontSize: '0.9rem' }}>
                  {t('nav.findDoctors')}
                </Link>
              </li>
              <li>
                <Link to="/specialities" style={{ color: '#475569', fontSize: '0.9rem' }}>
                  {t('nav.consultSpecialities')}
                </Link>
              </li>
              <li>
                <Link to="/book-appointment" style={{ color: '#475569', fontSize: '0.9rem' }}>
                  In-Clinic Appointments
                </Link>
              </li>
              <li>
                <Link to="/about" style={{ color: '#475569', fontSize: '0.9rem' }}>
                  {t('nav.about')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Accounts */}
          <div>
            <h4 style={{ fontSize: '1rem', color: '#0f172a', marginBottom: '16px' }}>
              User Accounts
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li>
                <Link to="/signup" style={{ color: '#475569', fontSize: '0.9rem' }}>
                  Patient Registration
                </Link>
              </li>
              <li>
                <Link to="/signup" style={{ color: '#475569', fontSize: '0.9rem' }}>
                  Doctor Practice Enrollment
                </Link>
              </li>
              <li>
                <Link to="/signup" style={{ color: '#475569', fontSize: '0.9rem' }}>
                  Interpreter Network Registration
                </Link>
              </li>
              <li>
                <Link to="/login" style={{ color: '#475569', fontSize: '0.9rem' }}>
                  Account Sign In
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Policies */}
          <div>
            <h4 style={{ fontSize: '1rem', color: '#0f172a', marginBottom: '16px' }}>
              Legal & Compliance
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li>
                <Link to="/privacy-policy" style={{ color: '#475569', fontSize: '0.9rem' }}>
                  {t('footer.privacy')}
                </Link>
              </li>
              <li>
                <Link to="/terms-of-service" style={{ color: '#475569', fontSize: '0.9rem' }}>
                  {t('footer.terms')}
                </Link>
              </li>
              <li>
                <span style={{ color: '#64748b', fontSize: '0.88rem' }}>
                  Doctor Verification Standards
                </span>
              </li>
              <li>
                <span style={{ color: '#64748b', fontSize: '0.88rem' }}>
                  Multilingual Accuracy Policy
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div
          style={{
            borderTop: '1px solid #f1f5f9',
            paddingTop: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ color: '#64748b', fontSize: '0.85rem' }}>
            {t('footer.copyright')}
          </div>
          <div style={{ color: '#94a3b8', fontSize: '0.82rem' }}>
            Production Telemedicine System
          </div>
        </div>
      </div>
    </footer>
  );
};
