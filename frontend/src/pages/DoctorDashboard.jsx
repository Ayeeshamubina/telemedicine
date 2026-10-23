import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useSocket } from '../contexts/SocketContext';
import { api } from '../services/api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';
import { PrescriptionModal } from '../components/doctor/PrescriptionModal';
import {
  Calendar,
  Video,
  Clock,
  User,
  Building2,
  CheckCircle,
  XCircle,
  FilePlus,
  Settings,
  Languages,
  Award,
  ToggleLeft,
  ToggleRight,
  Copy,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const DoctorDashboard = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const socket = useSocket();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'today', 'upcoming', 'completed'

  // Availability Manager State
  const [availabilityModalOpen, setAvailabilityModalOpen] = useState(false);
  const [availabilityList, setAvailabilityList] = useState([]);
  const [isAvailableNow, setIsAvailableNow] = useState(profile?.isAvailableNow ?? true);

  // Prescription Modal State
  const [prescriptionModalOpen, setPrescriptionModalOpen] = useState(false);
  const [prescriptionTarget, setPrescriptionTarget] = useState(null); // { patientId, patientName, consultationId, appointmentId }

  const fetchData = async (showLoadingState = true) => {
    if (showLoadingState) setLoading(true);
    setIsRefreshing(true);
    try {
      const [aptRes, consultRes] = await Promise.all([
        api.appointments.getMy(),
        api.consultations.getHistory()
      ]);
      if (aptRes.success) setAppointments(aptRes.data || []);
      if (consultRes.success) setConsultations(consultRes.data || []);
    } catch (err) {
      console.error('Failed to load doctor dashboard:', err);
      if (showLoadingState) showToast('Unable to load appointments', 'error');
    } finally {
      if (showLoadingState) setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial load and availability config
  useEffect(() => {
    fetchData(true);
    if (profile?.availability) {
      setAvailabilityList(profile.availability);
    } else {
      // Default template
      setAvailabilityList(
        DAYS_OF_WEEK.map((day) => ({
          day,
          enabled: day !== 'Sunday',
          slots: [
            { start: '09:00', end: '10:00', mode: 'both' },
            { start: '10:00', end: '11:00', mode: 'both' },
            { start: '14:00', end: '15:00', mode: 'both' },
            { start: '15:00', end: '16:00', mode: 'both' },
            { start: '16:00', end: '17:00', mode: 'both' },
            { start: '17:00', end: '18:00', mode: 'both' },
            { start: '18:00', end: '19:00', mode: 'both' }
          ]
        }))
      );
    }
  }, [profile]);

  // Real-time socket events for live appointment additions and status updates
  useEffect(() => {
    if (!socket) return;

    const handleNewAppointment = (newApt) => {
      if (!newApt) return;
      const aptDoctorId = (newApt.doctor?._id || newApt.doctor)?.toString();
      const aptDoctorUserId = (newApt.doctorProfile?.user?._id || newApt.doctorProfile?.user)?.toString();
      const myId = user?._id?.toString();
      const myProfileDoctorId = profile?._id?.toString();

      // Verify if this appointment belongs to this doctor
      const isMyAppointment = !myId ||
        aptDoctorId === myId ||
        aptDoctorUserId === myId ||
        aptDoctorId === myProfileDoctorId;

      if (isMyAppointment) {
        showToast(`🔔 New booking from ${newApt.patient?.name || 'patient'} for ${newApt.date} (${newApt.timeSlot?.start || ''})!`, 'success');
        // Immediately prepend to appointments state for 0ms zero-latency rendering!
        setAppointments((prev) => [newApt, ...prev.filter((a) => a._id !== newApt._id)]);
        fetchData(false);
      }
    };

    const handleAptUpdated = (data) => {
      if (data?.appointment) {
        const updated = data.appointment;
        setAppointments((prev) => [updated, ...prev.filter((a) => a._id !== updated._id)]);
      }
      fetchData(false);
    };

    socket.on('new_appointment', handleNewAppointment);
    socket.on('appointment_updated', handleAptUpdated);
    socket.on('appointment_list_changed', handleAptUpdated);

    return () => {
      socket.off('new_appointment', handleNewAppointment);
      socket.off('appointment_updated', handleAptUpdated);
      socket.off('appointment_list_changed', handleAptUpdated);
    };
  }, [socket, user, profile]);

  // Background silent auto-refresh every 5 seconds to guarantee 100% up-to-date schedule
  useEffect(() => {
    const timer = setInterval(() => {
      fetchData(false);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await api.appointments.updateStatus(id, { status });
      if (res.success) {
        showToast(`Appointment ${status}`, 'success');
        fetchData(false);
      }
    } catch (err) {
      showToast(err.message || 'Failed to update appointment', 'error');
    }
  };

  const handleSaveAvailability = async () => {
    try {
      const res = await api.doctors.updateAvailability({
        availability: availabilityList,
        isAvailableNow
      });
      if (res.success) {
        showToast('Availability schedule saved successfully', 'success');
        setAvailabilityModalOpen(false);
        refreshProfile();
      }
    } catch (err) {
      showToast(err.message || 'Failed to save availability', 'error');
    }
  };

  const toggleDayEnabled = (dayIndex) => {
    const updated = [...availabilityList];
    updated[dayIndex].enabled = !updated[dayIndex].enabled;
    setAvailabilityList(updated);
  };

  const handleCopyRoomLink = (roomId) => {
    if (!roomId) return;
    const url = `${window.location.origin}/consultation/${roomId}`;
    navigator.clipboard.writeText(url);
    showToast(`Room link copied! (${roomId})`, 'success');
  };

  const localTodayStr = new Date().toLocaleDateString('en-CA');
  const utcTodayStr = new Date().toISOString().split('T')[0];

  const todayAppointments = appointments.filter(
    (a) => (a.date === localTodayStr || a.date === utcTodayStr) && a.status !== 'cancelled'
  );
  const upcomingAppointments = appointments.filter(
    (a) => a.status === 'confirmed' || a.status === 'pending'
  );
  const completedAppointments = appointments.filter(
    (a) => a.status === 'completed'
  );

  let displayedAppointments = appointments;
  if (activeTab === 'today') displayedAppointments = todayAppointments;
  else if (activeTab === 'upcoming') displayedAppointments = upcomingAppointments;
  else if (activeTab === 'completed') displayedAppointments = completedAppointments;

  return (
    <div className="section" style={{ minHeight: '80vh', backgroundColor: '#f8fafc' }}>
      <div className="container">
        {/* Welcome Header (Section 14) */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '28px',
            marginBottom: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '20px'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.85rem', color: '#0284c7', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Doctor Practice Dashboard
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', color: '#059669', backgroundColor: '#ecfdf5', padding: '3px 8px', borderRadius: '9999px', fontWeight: 600 }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} /> Live Synced
              </span>
            </div>
            <h1 style={{ fontSize: '1.85rem', color: '#0f172a', margin: '4px 0 6px' }}>
              Welcome, Dr. {user?.name}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#64748b', fontSize: '0.9rem', flexWrap: 'wrap' }}>
              <span style={{ color: '#0284c7', fontWeight: 600 }}>{profile?.speciality || 'General Medicine'}</span>
              <span>•</span>
              <span>{profile?.clinicHospitalInfo || user?.location || 'Clinic'}</span>
              <span>•</span>
              <span>Languages: {profile?.languages?.join(', ') || 'English'}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Manual Refresh Button */}
            <button
              onClick={() => {
                fetchData(true);
                showToast('Schedule refreshed', 'success');
              }}
              disabled={isRefreshing}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Refresh schedule"
            >
              <RefreshCw size={15} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
              <span>Refresh Schedule</span>
            </button>

            {/* Quick Instant Availability Toggle */}
            <button
              onClick={async () => {
                const nextState = !isAvailableNow;
                setIsAvailableNow(nextState);
                try {
                  await api.doctors.updateAvailability({ isAvailableNow: nextState });
                  showToast(`Live consultation availability set to: ${nextState ? 'Available' : 'Busy'}`, 'info');
                  refreshProfile();
                } catch (err) {
                  showToast('Failed to toggle status', 'error');
                }
              }}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {isAvailableNow ? (
                <ToggleRight size={20} color="#10b981" />
              ) : (
                <ToggleLeft size={20} color="#94a3b8" />
              )}
              <span>Instant Call: {isAvailableNow ? 'Available' : 'Busy'}</span>
            </button>

            <button
              onClick={() => setAvailabilityModalOpen(true)}
              className="btn btn-outline btn-sm"
            >
              <Clock size={16} /> Manage Availability
            </button>
          </div>
        </div>

        {/* Appointments Section with Tabs */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <h2 style={{ fontSize: '1.35rem', color: '#0f172a', margin: 0 }}>
              Appointments & Consultations ({displayedAppointments.length})
            </h2>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setActiveTab('all')}
                className={`btn btn-sm ${activeTab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              >
                All Bookings ({appointments.length})
              </button>
              <button
                onClick={() => setActiveTab('today')}
                className={`btn btn-sm ${activeTab === 'today' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Today ({todayAppointments.length})
              </button>
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`btn btn-sm ${activeTab === 'upcoming' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Upcoming ({upcomingAppointments.length})
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`btn btn-sm ${activeTab === 'completed' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Completed ({completedAppointments.length})
              </button>
            </div>
          </div>

          {loading ? (
            <LoadingSpinner message="Loading appointment schedule..." />
          ) : displayedAppointments.length === 0 ? (
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px dashed #cbd5e1',
                borderRadius: '12px',
                padding: '36px',
                textAlign: 'center',
                color: '#64748b'
              }}
            >
              <Calendar size={36} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
              <h4 style={{ margin: '0 0 6px', color: '#1e293b' }}>
                {activeTab === 'today' ? "No appointments scheduled for today." : "No appointments found."}
              </h4>
              <p style={{ margin: 0, fontSize: '0.88rem' }}>
                When patients book an in-clinic or online consultation with you, they will appear here in real time.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {displayedAppointments.map((apt) => (
                <div
                  key={apt._id}
                  className="card"
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    padding: '20px',
                    gap: '16px',
                    borderLeft: `4px solid ${
                      apt.status === 'confirmed' ? '#10b981' :
                      apt.status === 'completed' ? '#0284c7' :
                      apt.status === 'pending' ? '#f59e0b' : '#94a3b8'
                    }`
                  }}
                >
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '10px',
                        backgroundColor: apt.type === 'online' ? '#e0f2fe' : '#f1f5f9',
                        color: apt.type === 'online' ? '#0284c7' : '#475569',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      {apt.type === 'online' ? <Video size={24} /> : <Building2 size={24} />}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '3px' }}>
                        <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>
                          Patient: {apt.patient?.name || 'Patient'}
                        </h4>
                        <span
                          className={`badge ${
                            apt.status === 'confirmed' ? 'badge-success' :
                            apt.status === 'completed' ? 'badge-primary' :
                            apt.status === 'pending' ? 'badge-warning' : 'badge-neutral'
                          }`}
                          style={{ textTransform: 'capitalize', fontSize: '0.72rem' }}
                        >
                          {apt.status}
                        </span>
                        <span className="badge badge-neutral" style={{ fontSize: '0.72rem', textTransform: 'capitalize' }}>
                          {apt.type}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                        Language: <strong>{apt.patientLanguage || apt.patient?.preferredLanguage || 'English'}</strong>
                        {apt.patient?.phone && ` • Phone: ${apt.patient.phone}`}
                        {apt.patient?.email && ` • Email: ${apt.patient.email}`}
                      </div>

                      <div style={{ fontSize: '0.85rem', color: '#0369a1', fontWeight: 600, marginTop: '3px' }}>
                        📅 {apt.date} • ⏰ {apt.timeSlot?.start} - {apt.timeSlot?.end} • Reason: {apt.reason}
                      </div>

                      {apt.type === 'online' && apt.consultationRoomId && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                          <span style={{ fontSize: '0.76rem', backgroundColor: '#f1f5f9', color: '#334155', padding: '2px 8px', borderRadius: '4px', fontFamily: 'monospace', fontWeight: 600 }}>
                            Room: {apt.consultationRoomId}
                          </span>
                          <button
                            onClick={() => handleCopyRoomLink(apt.consultationRoomId)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '2px 8px', fontSize: '0.72rem', height: '22px' }}
                            title="Copy room link to open on phone or another tab"
                          >
                            <Copy size={12} /> Copy Room Link
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    {apt.type === 'online' && apt.consultationRoomId && (
                      <Link
                        to={`/consultation/${apt.consultationRoomId}`}
                        className="btn btn-primary btn-sm"
                      >
                        <Video size={16} /> {apt.status === 'completed' ? 'Re-enter Room' : 'Start Consultation'}
                      </Link>
                    )}

                    <button
                      onClick={() => {
                        setPrescriptionTarget({
                          patientId: apt.patient?._id,
                          patientName: apt.patient?.name,
                          appointmentId: apt._id
                        });
                        setPrescriptionModalOpen(true);
                      }}
                      className="btn btn-outline btn-sm"
                    >
                      <FilePlus size={16} /> Prescription
                    </button>

                    {apt.status !== 'completed' && apt.status !== 'cancelled' && (
                      <button
                        onClick={() => handleUpdateStatus(apt._id, 'completed')}
                        className="btn btn-secondary btn-sm"
                        style={{ color: '#059669' }}
                      >
                        <CheckCircle size={16} /> Mark Complete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Patients & Consultation History */}
        <div>
          <h2 style={{ fontSize: '1.35rem', color: '#0f172a', marginBottom: '16px' }}>
            Completed Consultation History ({consultations.length})
          </h2>

          {consultations.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No consultation history yet."
              description="Completed patient consults will be listed here."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {consultations.map((c) => (
                <div
                  key={c._id}
                  className="card"
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    gap: '12px'
                  }}
                >
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1rem' }}>Patient: {c.patient?.name}</h4>
                    <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                      {new Date(c.createdAt).toLocaleDateString()} • Room: {c.roomId}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Link
                      to={`/consultation/${c.roomId}`}
                      className="btn btn-secondary btn-sm"
                    >
                      <Video size={14} /> Open Room
                    </Link>
                    <button
                      onClick={() => {
                        setPrescriptionTarget({
                          patientId: c.patient?._id,
                          patientName: c.patient?.name,
                          consultationId: c._id
                        });
                        setPrescriptionModalOpen(true);
                      }}
                      className="btn btn-outline btn-sm"
                    >
                      <FilePlus size={15} /> Issue Prescription
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Availability Manager Modal (Section 14 & 32) */}
      <Modal
        isOpen={availabilityModalOpen}
        onClose={() => setAvailabilityModalOpen(false)}
        title="Manage Doctor Availability Schedule"
        maxWidth="640px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '0.88rem', color: '#64748b', margin: 0 }}>
            Toggle the days you are available for patient appointments and online consultations.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {availabilityList.map((dayConfig, index) => (
              <div
                key={dayConfig.day}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  backgroundColor: dayConfig.enabled ? '#f0f9ff' : '#f8fafc',
                  border: `1px solid ${dayConfig.enabled ? '#bae6fd' : '#e2e8f0'}`
                }}
              >
                <div>
                  <strong style={{ color: dayConfig.enabled ? '#0369a1' : '#64748b' }}>
                    {dayConfig.day}
                  </strong>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '3px' }}>
                    {dayConfig.enabled ? (
                      <div>
                        <span style={{ fontWeight: 600 }}>{dayConfig.slots?.length || 0} slots:</span>{' '}
                        <span>{dayConfig.slots?.map((s) => `${s.start}-${s.end}`).join(', ')}</span>
                      </div>
                    ) : (
                      'Closed'
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleDayEnabled(index)}
                  className={`btn btn-sm ${dayConfig.enabled ? 'btn-primary' : 'btn-secondary'}`}
                >
                  {dayConfig.enabled ? 'Active' : 'Enable Day'}
                </button>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <button type="button" onClick={() => setAvailabilityModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="button" onClick={handleSaveAvailability} className="btn btn-primary">
              Save Schedule
            </button>
          </div>
        </div>
      </Modal>

      {/* Prescription Creation Modal (Section 33) */}
      {prescriptionTarget && (
        <PrescriptionModal
          isOpen={prescriptionModalOpen}
          onClose={() => {
            setPrescriptionModalOpen(false);
            setPrescriptionTarget(null);
          }}
          patientId={prescriptionTarget.patientId}
          patientName={prescriptionTarget.patientName}
          appointmentId={prescriptionTarget.appointmentId}
          consultationId={prescriptionTarget.consultationId}
          onSuccess={() => {
            fetchData(false);
          }}
        />
      )}
    </div>
  );
};
