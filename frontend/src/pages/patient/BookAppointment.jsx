import React, { useState, useEffect } from 'react';
import { Form, redirect, useOutletContext, useNavigation, useActionData } from 'react-router-dom';
import '../../styles/patient/Appoinments.css'

export async function action({ request }) {
  const formData = await request.formData();
  const token = localStorage.getItem('token');
  
  const appointmentData = {
    date: formData.get('date'),
    time: formData.get('time'),
    reason: formData.get('reason'),
    notes: formData.get('notes') || '',
  };

  try {
    const response = await fetch(
      'http://127.0.0.1:8000/api/patient-portal/appointments/',
      {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return { 
        error: true, 
        message: errorData.detail || 'Failed to book appointment',
        errors: errorData 
      };
    }

    const data = await response.json();
    // Return success with the created appointment data
    // Then redirect after a brief delay to allow UI to process
    return {
      success: true,
      appointment: data,
      message: 'Appointment booked successfully!'
    };
  } catch (error) {
    console.error('Error booking appointment:', error);
    return { 
      error: true, 
      message: 'Network error. Please try again.' 
    };
  }
}

const BookAppointment = () => {
  const context = useOutletContext();
  const navigation = useNavigation();
  const actionData = useActionData();
  const isSubmitting = navigation.state === 'submitting';

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  // Redirect on successful booking and refresh parent data
  useEffect(() => {
    if (actionData?.success) {
      // Call refreshData from context to update appointments list in parent
      if (context?.refreshData) {
        context.refreshData().then(() => {
          setTimeout(() => {
            window.location.href = '/patient/appointments';
          }, 1000);
        });
      } else {
        setTimeout(() => {
          window.location.href = '/patient/appointments';
        }, 1500);
      }
    }
  }, [actionData, context]);

  // Extract available slots from context
  // Handle different possible data structures
  const availableSlots = context?.availableSlots || {};
  
  // Extract available dates and times from availableSlots
  const availableDates = availableSlots?.dates || availableSlots?.available_dates || [
    '2025-12-10', '2025-12-11', '2025-12-12', '2025-12-13', '2025-12-14',
    '2025-12-15', '2025-12-16', '2025-12-17', '2025-12-18', '2025-12-19'
  ];

  const availableTimes = availableSlots?.times || availableSlots?.available_times || [
    '09:00:00', '09:30:00', '10:00:00', '10:30:00', '11:00:00', '11:30:00',
    '14:00:00', '14:30:00', '15:00:00', '15:30:00', '16:00:00'
  ];

  const reasonOptions = [
    'Sample Collection',
    'Biopsy',
    'Follow-up Consultation',
    'Test Result Discussion',
    'General Checkup'
  ];

  return (
    <div className="book-appointment">
      <div className="booking-form-container">
        {actionData?.success && (
          <div className="success-message">
            <h3>✓ {actionData.message}</h3>
            <p>Redirecting to your appointments...</p>
          </div>
        )}

        {actionData?.error && (
          <div className="error-message">
            <h3>✗ {actionData.message}</h3>
            {actionData.errors && <pre>{JSON.stringify(actionData.errors, null, 2)}</pre>}
          </div>
        )}

        <Form method="post" className="booking-form">
          <div className="form-group">
            <label>
              1. Select Date <span className="required">*</span>
            </label>
            <select
              name="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              required
              className="form-select"
              disabled={isSubmitting}
            >
              <option value="">Choose an available date...</option>
              {availableDates.map(date => (
                <option key={date} value={date}>{date}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>
              2. Select Time Slot <span className="required">*</span>
            </label>
            <input type="hidden" name="time" value={selectedTime} />
            <div className="time-slots-grid">
              {availableTimes.map(time => (
                <button
                  key={time}
                  type="button"
                  onClick={() => setSelectedTime(time)}
                  className={`time-slot ${selectedTime === time ? 'selected' : ''}`}
                  disabled={isSubmitting}
                >
                  {time.slice(0, 5)}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>
              3. Reason for Visit <span className="required">*</span>
            </label>
            <select
              name="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              className="form-select"
              disabled={isSubmitting}
            >
              <option value="">Select reason...</option>
              {reasonOptions.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>4. Additional Notes (Optional)</label>
            <textarea
              name="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special instructions..."
              rows={4}
              className="form-textarea"
              disabled={isSubmitting}
            />
          </div>

          {selectedDate && selectedTime && reason && (
            <div className="appointment-summary">
              <h3>📅 Appointment Summary:</h3>
              <div className="summary-details">
                <p><strong>Date:</strong> {selectedDate}</p>
                <p><strong>Time:</strong> {selectedTime}</p>
                <p><strong>Reason:</strong> {reason}</p>
                {notes && <p><strong>Notes:</strong> {notes}</p>}
              </div>
            </div>
          )}

          <div className="form-actions">
            <button
              type="submit"
              disabled={!selectedDate || !selectedTime || !reason || isSubmitting}
              className="submit-btn"
            >
              {isSubmitting ? 'Booking...' : 'Book Appointment'}
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default BookAppointment;