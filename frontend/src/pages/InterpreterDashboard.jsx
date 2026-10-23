import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useToast } from '../contexts/ToastContext';
import { api } from '../services/api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import {
  Languages,
  Video,
  CheckCircle,
  XCircle,
  Clock,
  Radio,
  Award,
  Globe,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export const InterpreterDashboard = () => {
  const { user, profile, refreshProfile } = useAuth();
  const socket = useSocket();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [isAvailable, setIsAvailable] = useState(profile?.isAvailable ?? false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [activeConsultation, setActiveConsultation] = useState(null);
  const [completedSessions, setCompletedSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const res = await api.interpreters.getPendingRequests();
      if (res.success) {
        setPendingRequests(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load pending requests:', err);
    }
  };

  const fetchProfileAndHistory = async () => {
    setLoading(true);
    try {
      const [profRes, histRes] = await Promise.all([
        api.interpreters.getProfile(),
        api.consultations.getHistory()
      ]);
      if (profRes.success && profRes.data) {
        setIsAvailable(profRes.data.isAvailable);
      }
      if (histRes.success) {
        setCompletedSessions(histRes.data || []);
      }
      await fetchRequests();
    } catch (err) {
      console.error('Failed to load interpreter details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndHistory();
  }, []);

  // Listen for real-time interpreter requests via socket
  useEffect(() => {
    if (!socket) return;

    const handleNewRequest = (requestData) => {
      // Refresh requests list
      showToast(`New interpretation request received for ${requestData.patientLanguage} ⇄ ${requestData.doctorLanguage}!`, 'info');
      fetchRequests();
    };

    socket.on('new_interpreter_request', handleNewRequest);

    return () => {
      socket.off('new_interpreter_request', handleNewRequest);
    };
  }, [socket]);

  // Section 15: Actions: Go Available, Go Offline
  const handleToggleAvailability = async () => {
    const nextVal = !isAvailable;
    try {
      const res = await api.interpreters.toggleAvailability(nextVal);
      if (res.success) {
        setIsAvailable(nextVal);
        showToast(`You are now ${nextVal ? 'Available for requests' : 'Offline'}`, 'success');
        refreshProfile();
        if (nextVal) {
          fetchRequests();
        } else {
          setPendingRequests([]);
        }
      }
    } catch (err) {
      showToast(err.message || 'Failed to update availability status', 'error');
    }
  };

  // Section 15: Accept Request
  const handleAcceptRequest = async (requestId) => {
    try {
      const res = await api.interpreters.respondToRequest(requestId, 'accept');
      if (res.success && res.data) {
        showToast('Request accepted! Joining consultation room...', 'success');
        // Notify consultation room that interpreter accepted
        if (socket) {
          socket.emit('interpreter_accepted_call', {
            roomId: res.data.roomId,
            interpreter: {
              id: user._id,
              name: user.name,
              role: 'interpreter'
            }
          });
        }
        navigate(`/consultation/${res.data.roomId}`);
      }
    } catch (err) {
      showToast(err.message || 'Unable to accept request', 'error');
    }
  };

  // Section 15: Reject Request
  const handleRejectRequest = async (requestId) => {
    try {
      const res = await api.interpreters.respondToRequest(requestId, 'reject');
      if (res.success) {
        showToast('Request declined', 'info');
        setPendingRequests(pendingRequests.filter((r) => r._id !== requestId));
      }
    } catch (err) {
      showToast(err.message || 'Unable to reject request', 'error');
    }
  };

  return (
    <div className="section" style={{ minHeight: '80vh', backgroundColor: '#f8fafc' }}>
      <div className="container">
        {/* Welcome Header (Section 15) */}
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
            <span style={{ fontSize: '0.85rem', color: '#0f766e', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Certified Interpreter Portal
            </span>
            <h1 style={{ fontSize: '1.85rem', color: '#0f172a', margin: '4px 0 6px' }}>
              Welcome, {user?.name}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#64748b', fontSize: '0.9rem', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Languages size={16} color="#0f766e" />
                Supported Languages: <strong>{profile?.supportedLanguages?.join(', ') || 'English, Tamil'}</strong>
              </span>
              <span>•</span>
              <span>{profile?.experience || 3} Years Clinical Experience</span>
            </div>
          </div>

          {/* Go Available / Go Offline Button (Section 15) */}
          <button
            onClick={handleToggleAvailability}
            className={`btn ${isAvailable ? 'btn-success' : 'btn-secondary'}`}
            style={{ gap: '8px' }}
          >
            <Radio size={18} />
            <span>{isAvailable ? 'Go Offline' : 'Go Available'}</span>
          </button>
        </div>

        {/* Status Callout */}
        <div
          style={{
            backgroundColor: isAvailable ? '#ecfdf5' : '#f8fafc',
            border: `1px solid ${isAvailable ? '#a7f3d0' : '#e2e8f0'}`,
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '32px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <span
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: isAvailable ? '#10b981' : '#94a3b8'
            }}
          />
          <div style={{ fontSize: '0.92rem', color: isAvailable ? '#065f46' : '#64748b' }}>
            {isAvailable ? (
              <strong>
                You are Available online. You will receive live notification requests when doctors or patients request interpretation in {profile?.supportedLanguages?.join(' & ')}.
              </strong>
            ) : (
              <span>
                You are currently <strong>Offline</strong>. Click "Go Available" to start receiving real-time interpretation requests.
              </span>
            )}
          </div>
        </div>

        {/* Pending Requests Section (Section 15: Accept / Reject) */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.35rem', color: '#0f172a', margin: 0 }}>
              Incoming Interpreter Requests ({pendingRequests.length})
            </h2>
            <button
              onClick={fetchRequests}
              className="btn btn-secondary btn-sm"
              disabled={!isAvailable}
            >
              Refresh Requests
            </button>
          </div>

          {loading ? (
            <LoadingSpinner message="Checking interpreter requests..." />
          ) : !isAvailable ? (
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px dashed #cbd5e1',
                borderRadius: '12px',
                padding: '32px',
                textAlign: 'center',
                color: '#64748b'
              }}
            >
              Please toggle your availability to "Go Available" to view and accept pending requests.
            </div>
          ) : pendingRequests.length === 0 ? (
            <EmptyState
              icon={Languages}
              title="No pending requests currently."
              description="When a patient or physician in an active consultation requests an interpreter in your supported languages, it will instantly appear here."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {pendingRequests.map((reqItem) => (
                <div
                  key={reqItem._id}
                  className="card"
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    padding: '20px 24px',
                    borderColor: '#a7f3d0',
                    backgroundColor: '#ffffff',
                    gap: '16px'
                  }}
                >
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        backgroundColor: '#ccfbf1',
                        color: '#0f766e',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <Video size={24} />
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>
                          Live Consultation Request
                        </h4>
                        <span className="badge badge-warning" style={{ fontSize: '0.72rem' }}>
                          Urgent
                        </span>
                      </div>
                      <div style={{ fontSize: '0.88rem', color: '#475569' }}>
                        Patient: <strong>{reqItem.patient?.name}</strong> ({reqItem.patientLanguage}) ⇄ Doctor: <strong>Dr. {reqItem.doctor?.name}</strong> ({reqItem.doctorLanguage})
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#0369a1', marginTop: '4px' }}>
                        Room: {reqItem.roomId} • Requested by {reqItem.requestedBy?.role}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      onClick={() => handleRejectRequest(reqItem._id)}
                      className="btn btn-secondary btn-sm"
                      style={{ color: '#dc2626' }}
                    >
                      <XCircle size={16} /> Reject
                    </button>
                    <button
                      onClick={() => handleAcceptRequest(reqItem._id)}
                      className="btn btn-primary btn-sm"
                      style={{ backgroundColor: '#0f766e' }}
                    >
                      <CheckCircle size={16} /> Accept & Join
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completed Consultations History (Section 15) */}
        <div>
          <h2 style={{ fontSize: '1.35rem', color: '#0f172a', marginBottom: '16px' }}>
            Completed Interpretation Sessions
          </h2>

          {completedSessions.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No completed sessions yet."
              description="Consultations you facilitate will be recorded here."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {completedSessions.map((session) => (
                <div
                  key={session._id}
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
                    <h4 style={{ margin: '0 0 2px', fontSize: '1rem', color: '#0f172a' }}>
                      Patient: {session.patient?.name} ⇄ Dr. {session.doctor?.name}
                    </h4>
                    <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                      {new Date(session.createdAt).toLocaleDateString()} • Languages: {session.patientLanguage} / {session.doctorLanguage}
                    </span>
                  </div>
                  <span className="badge badge-success">Completed</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
