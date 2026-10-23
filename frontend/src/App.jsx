import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { useAuth } from './contexts/AuthContext';

// Pages
import { Home } from './pages/Home';
import { FindDoctors } from './pages/FindDoctors';
import { DoctorProfilePage } from './pages/DoctorProfilePage';
import { ConsultSpecialities } from './pages/ConsultSpecialities';
import { InClinicBooking } from './pages/InClinicBooking';
import { About } from './pages/About';
import { Login } from './pages/Login';
import { SignUp } from './pages/SignUp';
import { PatientDashboard } from './pages/PatientDashboard';
import { DoctorDashboard } from './pages/DoctorDashboard';
import { InterpreterDashboard } from './pages/InterpreterDashboard';
import { AdminLogin } from './pages/AdminLogin';
import { AdminDashboard } from './pages/AdminDashboard';
import { ConsultationRoom } from './pages/ConsultationRoom';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfService } from './pages/TermsOfService';

// Protected Route Guard
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <div style={{ padding: '60px', textAlign: 'center' }}>Loading session...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'patient') return <Navigate to="/patient/dashboard" replace />;
    if (user.role === 'doctor') return <Navigate to="/doctor/dashboard" replace />;
    if (user.role === 'interpreter') return <Navigate to="/interpreter/dashboard" replace />;
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
};

export const App = () => {
  const location = useLocation();

  // Hide public navbar and footer in consultation room and admin portal
  const isConsultation = location.pathname.startsWith('/consultation/');
  const isAdminView = location.pathname.startsWith('/admin');

  const hidePublicChrome = isConsultation || isAdminView;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {!hidePublicChrome && <Navbar />}

      <main style={{ flex: 1 }}>
        <Routes>
          {/* Public Patient & User Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/find-doctors" element={<FindDoctors />} />
          <Route path="/doctor/:id" element={<DoctorProfilePage />} />
          <Route path="/specialities" element={<ConsultSpecialities />} />
          <Route path="/book-appointment" element={<InClinicBooking />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />

          {/* Role Protected Dashboards */}
          <Route
            path="/patient/dashboard"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <PatientDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/dashboard"
            element={
              <ProtectedRoute allowedRoles={['doctor']}>
                <DoctorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interpreter/dashboard"
            element={
              <ProtectedRoute allowedRoles={['interpreter']}>
                <InterpreterDashboard />
              </ProtectedRoute>
            }
          />

          {/* Active WebRTC Video Consultation Room */}
          <Route
            path="/consultation/:roomId"
            element={
              <ProtectedRoute allowedRoles={['patient', 'doctor', 'interpreter', 'admin']}>
                <ConsultationRoom />
              </ProtectedRoute>
            }
          />

          {/* Independent Admin Portal (Section 12: Admin is NOT public) */}
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {!hidePublicChrome && <Footer />}
    </div>
  );
};

export default App;
