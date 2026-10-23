import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { api } from '../services/api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import {
  ShieldCheck,
  Users,
  Stethoscope,
  Languages,
  Calendar,
  Video,
  CheckCircle,
  XCircle,
  AlertTriangle,
  LogOut,
  RefreshCw
} from 'lucide-react';

export const AdminDashboard = () => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('overview'); // overview, users, appointments, consultations
  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [appointmentsList, setAppointmentsList] = useState([]);
  const [consultationsList, setConsultationsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter users by role
  const [userRoleFilter, setUserRoleFilter] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, aptsRes, consultRes] = await Promise.all([
        api.admin.getStats(),
        api.admin.getUsers(userRoleFilter),
        api.admin.getAppointments(),
        api.admin.getConsultations()
      ]);

      if (statsRes.success) setStats(statsRes.stats);
      if (usersRes.success) setUsersList(usersRes.data || []);
      if (aptsRes.success) setAppointmentsList(aptsRes.data || []);
      if (consultRes.success) setConsultationsList(consultRes.data || []);
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
      showToast('Error loading administrative data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      navigate('/admin-login');
      return;
    }
    fetchDashboardData();
  }, [isAdmin, userRoleFilter]);

  const handleToggleUserStatus = async (userId, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      const res = await api.admin.updateUserStatus(userId, nextStatus);
      if (res.success) {
        showToast(`User status set to ${nextStatus}`, 'success');
        fetchDashboardData();
      }
    } catch (err) {
      showToast(err.message || 'Failed to update user status', 'error');
    }
  };

  const handleAdminLogout = () => {
    logout();
    navigate('/admin-login');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9', display: 'flex', flexDirection: 'column' }}>
      {/* Top Admin Header */}
      <header
        style={{
          backgroundColor: '#0f172a',
          color: '#ffffff',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={20} color="#fff" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.15rem', margin: 0, color: '#fff' }}>MEDIBRIDGE Administration Console</h2>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Secure Internal Management System</span>
          </div>
        </div>

        <button
          onClick={handleAdminLogout}
          className="btn btn-secondary btn-sm"
          style={{ backgroundColor: '#1e293b', color: '#e2e8f0', borderColor: '#334155' }}
        >
          <LogOut size={16} /> Logout Admin
        </button>
      </header>

      {/* Main Body */}
      <div className="container" style={{ padding: '32px 24px', flex: 1 }}>
        {/* Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '24px',
            borderBottom: '1px solid #cbd5e1',
            paddingBottom: '12px'
          }}
        >
          {['overview', 'users', 'appointments', 'consultations'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: activeTab === tab ? '#0284c7' : 'transparent',
                color: activeTab === tab ? '#ffffff' : '#475569',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {tab}
            </button>
          ))}

          <button
            onClick={fetchDashboardData}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              color: '#0284c7',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.88rem'
            }}
          >
            <RefreshCw size={15} /> Refresh Data
          </button>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading administrative metrics..." size="large" />
        ) : (
          <>
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '16px', color: '#0f172a' }}>
                  Platform Statistics & Health
                </h3>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px',
                    marginBottom: '32px'
                  }}
                >
                  <div className="card" style={{ padding: '20px', gap: '8px' }}>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Registered Patients</span>
                    <h2 style={{ fontSize: '2rem', margin: 0, color: '#0284c7' }}>{stats?.totalPatients ?? 0}</h2>
                  </div>

                  <div className="card" style={{ padding: '20px', gap: '8px' }}>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Registered Doctors</span>
                    <h2 style={{ fontSize: '2rem', margin: 0, color: '#0f766e' }}>{stats?.totalDoctors ?? 0}</h2>
                  </div>

                  <div className="card" style={{ padding: '20px', gap: '8px' }}>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Certified Interpreters</span>
                    <h2 style={{ fontSize: '2rem', margin: 0, color: '#7c3aed' }}>{stats?.totalInterpreters ?? 0}</h2>
                  </div>

                  <div className="card" style={{ padding: '20px', gap: '8px' }}>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Total Appointments</span>
                    <h2 style={{ fontSize: '2rem', margin: 0, color: '#0f172a' }}>{stats?.totalAppointments ?? 0}</h2>
                  </div>

                  <div className="card" style={{ padding: '20px', gap: '8px' }}>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Consultation Sessions</span>
                    <h2 style={{ fontSize: '2rem', margin: 0, color: '#10b981' }}>{stats?.totalConsultations ?? 0}</h2>
                  </div>
                </div>
              </div>
            )}

            {/* USERS TAB */}
            {activeTab === 'users' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '1.25rem', margin: 0, color: '#0f172a' }}>
                    Registered Users ({usersList.length})
                  </h3>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    {['', 'patient', 'doctor', 'interpreter'].map((r) => (
                      <button
                        key={r}
                        onClick={() => setUserRoleFilter(r)}
                        className={`btn btn-sm ${userRoleFilter === r ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ textTransform: 'capitalize' }}
                      >
                        {r === '' ? 'All Roles' : r}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                    <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <tr>
                        <th style={{ padding: '12px 16px' }}>Name</th>
                        <th style={{ padding: '12px 16px' }}>Email</th>
                        <th style={{ padding: '12px 16px' }}>Role</th>
                        <th style={{ padding: '12px 16px' }}>Location</th>
                        <th style={{ padding: '12px 16px' }}>Status</th>
                        <th style={{ padding: '12px 16px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersList.map((u) => (
                        <tr key={u._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 16px', fontWeight: 600 }}>{u.name}</td>
                          <td style={{ padding: '12px 16px', color: '#64748b' }}>{u.email}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <span className="badge badge-primary" style={{ textTransform: 'capitalize' }}>
                              {u.role}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', color: '#64748b' }}>{u.location || 'N/A'}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <span className={`badge ${u.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                              {u.status}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <button
                              onClick={() => handleToggleUserStatus(u._id, u.status)}
                              className={`btn btn-sm ${u.status === 'active' ? 'btn-danger' : 'btn-success'}`}
                              style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                            >
                              {u.status === 'active' ? 'Suspend' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* APPOINTMENTS TAB */}
            {activeTab === 'appointments' && (
              <div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '16px', color: '#0f172a' }}>
                  Platform Appointments ({appointmentsList.length})
                </h3>

                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                    <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <tr>
                        <th style={{ padding: '12px 16px' }}>Date</th>
                        <th style={{ padding: '12px 16px' }}>Patient</th>
                        <th style={{ padding: '12px 16px' }}>Doctor</th>
                        <th style={{ padding: '12px 16px' }}>Mode</th>
                        <th style={{ padding: '12px 16px' }}>Speciality</th>
                        <th style={{ padding: '12px 16px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointmentsList.map((a) => (
                        <tr key={a._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 16px' }}>{a.date} ({a.timeSlot?.start})</td>
                          <td style={{ padding: '12px 16px', fontWeight: 600 }}>{a.patient?.name}</td>
                          <td style={{ padding: '12px 16px' }}>Dr. {a.doctor?.name}</td>
                          <td style={{ padding: '12px 16px', textTransform: 'capitalize' }}>{a.type}</td>
                          <td style={{ padding: '12px 16px' }}>{a.speciality}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <span className="badge badge-primary" style={{ textTransform: 'capitalize' }}>
                              {a.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* CONSULTATIONS TAB */}
            {activeTab === 'consultations' && (
              <div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '16px', color: '#0f172a' }}>
                  Active & Completed Telemedicine Consultations ({consultationsList.length})
                </h3>

                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                    <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <tr>
                        <th style={{ padding: '12px 16px' }}>Room ID</th>
                        <th style={{ padding: '12px 16px' }}>Patient</th>
                        <th style={{ padding: '12px 16px' }}>Doctor</th>
                        <th style={{ padding: '12px 16px' }}>Languages</th>
                        <th style={{ padding: '12px 16px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {consultationsList.map((c) => (
                        <tr key={c._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 16px', fontFamily: 'monospace' }}>{c.roomId}</td>
                          <td style={{ padding: '12px 16px' }}>{c.patient?.name}</td>
                          <td style={{ padding: '12px 16px' }}>Dr. {c.doctor?.name}</td>
                          <td style={{ padding: '12px 16px' }}>{c.patientLanguage} ⇄ {c.doctorLanguage}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <span className="badge badge-neutral" style={{ textTransform: 'capitalize' }}>
                              {c.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
