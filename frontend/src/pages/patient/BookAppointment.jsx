import React, { useState, useEffect } from 'react';
import { Form, redirect, useOutletContext, useNavigation, useActionData } from 'react-router-dom';
import '../../styles/patient/Appoinments.css'
import { getToken } from '../../utls';

export async function action({ request }) {
  const formData = await request.formData();
  const token = getToken();
  
  const appointmentData = {
    date: formData.get('date'),
    time: formData.get('time'),
    test_type: formData.get('test_type'),
    selected_tests: formData.getAll('tests') || [],
    notes: formData.get('notes') || ''
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
      const errorData = await response.json().catch(() => null);
      // Extract a single friendly message from various possible error shapes
      let message = 'Failed to book appointment.';
      if (errorData) {
        if (Array.isArray(errorData)) {
          message = errorData.join(' ');
        } else if (errorData.non_field_errors && Array.isArray(errorData.non_field_errors)) {
          message = errorData.non_field_errors.join(' ');
        } else if (errorData.detail) {
          message = errorData.detail;
        } else if (errorData.tests && Array.isArray(errorData.tests)) {
          message = errorData.tests.join(' ');
        } else if (typeof errorData === 'object') {
          // try to pick the first message string found
          const firstVal = Object.values(errorData).find(v => Array.isArray(v) ? v.length > 0 : typeof v === 'string');
          if (Array.isArray(firstVal)) message = firstVal.join(' ');
          else if (typeof firstVal === 'string') message = firstVal;
        }
      }

      // If backend returned an "Invalid test: <Name>" message, try to fetch allowed tests
      const invalidMatch = String(message).match(/Invalid test:\s*(.+)/i);
      if (invalidMatch && invalidMatch[1]) {
        const invalidTestName = invalidMatch[1].trim();
        try {
          const base = 'http://127.0.0.1:8000/api/patient-portal';
          const testsRes = await fetch(`${base}/available-tests/`, { headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` } });
          if (testsRes.ok) {
            const testsJson = await testsRes.json();
            const allowed = Object.keys(testsJson?.[appointmentData.test_type] || {});
            if (allowed.length) {
              message = `${invalidTestName} is not available for ${appointmentData.test_type}. Available: ${allowed.join(', ')}`;
            } else {
              message = `${invalidTestName} is not a valid test for the selected test type.`;
            }
          }
        } catch (e) {
          // ignore, keep original message
        }
      }

      return { error: true, message };
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
  const [testType, setTestType] = useState('hematology');
  const [notes, setNotes] = useState('');
  const [selectedTests, setSelectedTests] = useState([]);

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
  // Tests list may be provided by backend via context.available_tests
  // expected shape: [{ id, name, type }]
  const availableTests = context.available_tests

  const availableTestsFiltered = availableTests.filter(t => t.type === testType);
  
  // Extract available dates and times from availableSlots
  const availableDates = availableSlots?.dates || availableSlots?.available_dates || [
    '2025-12-10', '2025-12-11', '2025-12-12', '2025-12-13', '2025-12-14',
    '2025-12-15', '2025-12-16', '2025-12-17', '2025-12-18', '2025-12-19'
  ];

  const availableTimes = availableSlots?.times || availableSlots?.available_times || [
    '09:00:00', '09:30:00', '10:00:00', '10:30:00', '11:00:00', '11:30:00',
    '14:00:00', '14:30:00', '15:00:00', '15:30:00', '16:00:00'
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
              3. Test Type <span className="required">*</span>
            </label>
            <select
              name="test_type"
              value={testType}
              onChange={(e) => setTestType(e.target.value)}
              required
              className="form-select"
              disabled={isSubmitting}
            >
              <option value="hematology">Hematology</option>
              <option value="pathology">Pathology</option>
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

          <div className="form-group">
            <label>5. Select Tests <span className="required">*</span></label>
            <div className="tests-checkboxes">
              {availableTestsFiltered.map(test => (
                <label key={test.id} className="test-checkbox">
                  <input
                    type="checkbox"
                    name="tests"
                    value={test.name}
                    checked={selectedTests.includes(test.name)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setSelectedTests(prev => checked ? [...prev, test.name] : prev.filter(x => x !== test.name));
                    }}
                    disabled={isSubmitting}
                  />
                  {test.name}
                </label>
              ))}
            </div>
          </div>

          {selectedDate && selectedTime && selectedTests.length > 0 && (
            <div className="appointment-summary">
              <h3>📅 Appointment Summary:</h3>
              <div className="summary-details">
                <p><strong>Date:</strong> {selectedDate}</p>
                <p><strong>Time:</strong> {selectedTime}</p>
                <p><strong>Test Type:</strong> {testType}</p>
                <p><strong>Selected Tests:</strong> {selectedTests.join(', ')}</p>
                {notes && <p><strong>Notes:</strong> {notes}</p>}
              </div>
            </div>
          )}

          <div className="form-actions">
            <button
              type="submit"
              disabled={!selectedDate || !selectedTime || selectedTests.length === 0 || isSubmitting}
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