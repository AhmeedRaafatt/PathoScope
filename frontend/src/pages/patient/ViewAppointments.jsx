import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Calendar, Clock } from 'lucide-react';
import '../../styles/patient/Appoinments.css'

const ViewAppointments = () => {
  const context = useOutletContext();
  const [showModal, setShowModal] = useState(false);
  const [toCancelId, setToCancelId] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');
  // Extract appointments array from context
  // Handle both direct array and object with results property
  const appointmentsData = context?.appointments?.results || context?.appointments || [];
  const appointments = Array.isArray(appointmentsData) ? appointmentsData : [];

  // Separate upcoming and past appointments
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.date);
    aptDate.setHours(0, 0, 0, 0);
    return aptDate >= today && apt.status !== 'completed' && apt.status !== 'cancelled';
  });

  // Mock past appointments for visualization
  const pastAppointments = [
    { 
      id: 'mock-1', 
      date: '2025-11-28', 
      time: '10:00:00', 
      reason: 'Blood Test', 
      status: 'completed', 
      notes: '' 
    },
    { 
      id: 'mock-2', 
      date: '2025-11-15', 
      time: '11:30:00', 
      reason: 'Consultation', 
      status: 'completed', 
      notes: '' 
    }
  ];

  const handleCancelClick = (appointmentId) => {
    setCancelError('');
    setToCancelId(appointmentId);
    setShowModal(true);
  };

  const confirmCancel = async () => {
    if (!toCancelId) return;
    setIsCancelling(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/patient-portal/appointments/${toCancelId}/cancel/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        setCancelError(err?.error || err?.detail || 'Failed to cancel appointment');
        setIsCancelling(false);
        return;
      }

      // refresh parent data if available
      if (context?.refreshData) await context.refreshData();
      setShowModal(false);
      setToCancelId(null);
    } catch (e) {
      console.error('Cancel error', e);
      setCancelError('Network error while cancelling.');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="view-appointments">

      <section className="appointments-section">
        <div className="section-header">
          <Calendar className="section-icon" size={24} />
          <h2>Upcoming Appointments ({upcomingAppointments.length})</h2>
        </div>
        <div className="appointments-list">
          {upcomingAppointments.length === 0 ? (
            <div className="no-appointments">
              <p>No upcoming appointments</p>
            </div>
          ) : (
            upcomingAppointments.map(apt => (
              <div key={apt.id} className="appointment-card upcoming">
                <div className="appointment-content">
                  <div className="appointment-icon">
                    <Calendar size={20} />
                  </div>
                  <div className="appointment-details">
                    <h3>{apt.test_type ? apt.test_type.replace('_', ' ') : (apt.reason || 'Appointment')}</h3>
                    <p className="appointment-datetime">
                      <Clock size={14} />
                      {apt.date} at {apt.time?.slice(0, 5) || 'N/A'}
                    </p>
                    {apt.selected_tests && apt.selected_tests.length > 0 && (
                      <p className="appointment-notes"><strong>Tests:</strong> {apt.selected_tests.join(', ')}</p>
                    )}
                    {apt.notes && <p className="appointment-notes">Note: {apt.notes}</p>}
                  </div>
                </div>
                <div className="appointment-actions">
                  <span className={`status-badge ${apt.status}`}>
                    {apt.status}
                  </span>
                  <button 
                    type="button"
                    onClick={() => handleCancelClick(apt.id)}
                    className="cancel-btn"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Confirmation modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <h3>Cancel Appointment</h3>
            <p>Are you sure you want to cancel this appointment? This action cannot be undone.</p>
            {cancelError && <div className="error-message">{cancelError}</div>}
            <div className="modal-actions">
              <button className="btn" onClick={() => { setShowModal(false); setToCancelId(null); }}>Close</button>
              <button className="btn danger" onClick={confirmCancel} disabled={isCancelling}>{isCancelling ? 'Cancelling...' : 'Confirm Cancel'}</button>
            </div>
          </div>
        </div>
      )}

      <section className="appointments-section">
        <div className="section-header">
          <h2>Past Appointments</h2>
        </div>
        <div className="appointments-list">
          {pastAppointments.map(apt => (
            <div key={apt.id} className="appointment-card past">
              <div className="appointment-content">
                <div className="appointment-icon past">
                  <Calendar size={20} />
                </div>
                <div className="appointment-details">
                  <h3>{apt.reason}</h3>
                  <p className="appointment-datetime">
                    {apt.date} at {apt.time.slice(0, 5)}
                  </p>
                </div>
              </div>
              <span className="status-badge completed">Completed</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ViewAppointments;