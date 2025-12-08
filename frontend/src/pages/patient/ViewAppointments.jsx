import React from 'react';
import { useOutletContext, Form } from 'react-router-dom';
import { Calendar, Clock } from 'lucide-react';
import '../../styles/patient/Appoinments.css'

export async function action({ request }) {
  const formData = await request.formData();
  const appointmentId = formData.get('appointmentId');
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch(
      `http://127.0.0.1:8000/api/patient-portal/appointments/${appointmentId}/`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to cancel appointment');
    }

    return { success: true };
  } catch (error) {
    console.error('Error canceling appointment:', error);
    return { error: 'Failed to cancel appointment' };
  }
}

const ViewAppointments = () => {
  const context = useOutletContext();
  
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

  const handleCancel = (appointmentId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
      return false;
    }
    return true;
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
                    <h3>{apt.reason}</h3>
                    <p className="appointment-datetime">
                      <Clock size={14} />
                      {apt.date} at {apt.time?.slice(0, 5) || 'N/A'}
                    </p>
                    {apt.notes && <p className="appointment-notes">Note: {apt.notes}</p>}
                  </div>
                </div>
                <div className="appointment-actions">
                  <span className={`status-badge ${apt.status}`}>
                    {apt.status}
                  </span>
                  <Form method="delete" onSubmit={() => handleCancel(apt.id)}>
                    <input type="hidden" name="appointmentId" value={apt.id} />
                    <button 
                      type="submit"
                      className="cancel-btn"
                    >
                      Cancel
                    </button>
                  </Form>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

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