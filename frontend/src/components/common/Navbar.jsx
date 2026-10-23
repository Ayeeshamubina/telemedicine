import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { Logo } from './Logo';
import { Globe, User as UserIcon, LogOut, Menu, X, ChevronDown } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ta', label: 'Tamil' },
  { code: 'hi', label: 'Hindi' },
  { code: 'te', label: 'Telugu' },
  { code: 'ml', label: 'Malayalam' },
  { code: 'kn', label: 'Kannada' }
];

export const Navbar = () => {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    i18n.changeLanguage(newLang);
    localStorage.setItem('medibridge_language', newLang);
  };

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const getDashboardRoute = () => {
    if (!user) return '/login';
    if (user.role === 'patient') return '/patient/dashboard';
    if (user.role === 'doctor') return '/doctor/dashboard';
    if (user.role === 'interpreter') return '/interpreter/dashboard';
    if (user.role === 'admin') return '/admin/dashboard';
    return '/';
  };

  return (
    <header
      style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '76px'
        }}
      >
        {/* Left: MEDIBRIDGE Logo + Tagline */}
        <Logo />

        {/* Desktop Navigation Links */}
        <nav
          style={{
            display: 'none',
            alignItems: 'center',
            gap: '28px'
          }}
          className="desktop-nav"
        >
          <Link
            to="/"
            style={{
              color: '#334155',
              fontWeight: 500,
              fontSize: '0.95rem'
            }}
          >
            {t('nav.home')}
          </Link>
          <Link
            to="/find-doctors"
            style={{
              color: '#334155',
              fontWeight: 500,
              fontSize: '0.95rem'
            }}
          >
            {t('nav.findDoctors')}
          </Link>
          <Link
            to="/specialities"
            style={{
              color: '#334155',
              fontWeight: 500,
              fontSize: '0.95rem'
            }}
          >
            {t('nav.consultSpecialities')}
          </Link>

          {isAuthenticated && (
            <Link
              to={getDashboardRoute()}
              style={{
                color: '#334155',
                fontWeight: 500,
                fontSize: '0.95rem'
              }}
            >
              {t('nav.dashboard')}
            </Link>
          )}

          <Link
            to="/about"
            style={{
              color: '#334155',
              fontWeight: 500,
              fontSize: '0.95rem'
            }}
          >
            {t('nav.about')}
          </Link>

          {/* Language Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '6px' }}>
            <Globe size={16} color="#0284c7" />
            <select
              aria-label="Language selector"
              value={i18n.language}
              onChange={handleLanguageChange}
              style={{
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '5px 8px',
                fontSize: '0.88rem',
                color: '#0f172a',
                backgroundColor: '#ffffff',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          {/* Auth State */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '8px' }}>
            {!isAuthenticated ? (
              <>
                <Link to="/login" className="btn btn-secondary btn-sm">
                  {t('nav.login')}
                </Link>
                <Link to="/signup" className="btn btn-primary btn-sm">
                  {t('nav.signUp')}
                </Link>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Link
                  to={getDashboardRoute()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#0f172a',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    textDecoration: 'none'
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: '#e0f2fe',
                      color: '#0284c7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700
                    }}
                  >
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <span>{user?.name?.split(' ')[0]}</span>
                  <span className="badge badge-primary" style={{ fontSize: '0.72rem', textTransform: 'capitalize' }}>
                    {user?.role}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <LogOut size={15} />
                  <span>{t('nav.logout')}</span>
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'none',
            border: 'none',
            color: '#334155',
            cursor: 'pointer',
            padding: '6px'
          }}
          className="mobile-toggle"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
          className="mobile-nav"
        >
          <Link to="/" onClick={() => setMobileMenuOpen(false)} style={{ color: '#0f172a', fontWeight: 500 }}>
            {t('nav.home')}
          </Link>
          <Link to="/find-doctors" onClick={() => setMobileMenuOpen(false)} style={{ color: '#0f172a', fontWeight: 500 }}>
            {t('nav.findDoctors')}
          </Link>
          <Link to="/specialities" onClick={() => setMobileMenuOpen(false)} style={{ color: '#0f172a', fontWeight: 500 }}>
            {t('nav.consultSpecialities')}
          </Link>
          {isAuthenticated && (
            <Link to={getDashboardRoute()} onClick={() => setMobileMenuOpen(false)} style={{ color: '#0f172a', fontWeight: 500 }}>
              {t('nav.dashboard')}
            </Link>
          )}
          <Link to="/about" onClick={() => setMobileMenuOpen(false)} style={{ color: '#0f172a', fontWeight: 500 }}>
            {t('nav.about')}
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
            <Globe size={18} color="#0284c7" />
            <select
              aria-label="Language selector (mobile)"
              value={i18n.language}
              onChange={handleLanguageChange}
              style={{
                width: '100%',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '8px',
                fontSize: '0.9rem'
              }}
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {!isAuthenticated ? (
              <>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="btn btn-secondary btn-block">
                  {t('nav.login')}
                </Link>
                <Link to="/signup" onClick={() => setMobileMenuOpen(false)} className="btn btn-primary btn-block">
                  {t('nav.signUp')}
                </Link>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '6px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: '#e0f2fe',
                      color: '#0284c7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700
                    }}
                  >
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{user?.name}</div>
                    <span className="badge badge-primary" style={{ fontSize: '0.72rem', textTransform: 'capitalize' }}>
                      {user?.role}
                    </span>
                  </div>
                </div>
                <button onClick={handleLogout} className="btn btn-secondary btn-block">
                  <LogOut size={16} />
                  <span>{t('nav.logout')}</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @media (min-width: 868px) {
          .desktop-nav {
            display: flex !important;
          }
          .mobile-toggle {
            display: none !important;
          }
          .mobile-nav {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
};
