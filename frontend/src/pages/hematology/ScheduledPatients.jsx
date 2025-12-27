import { useOutletContext, useActionData, useNavigation, Form } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCalendarCheck, faUserCheck, faClipboardCheck, faClock, faVial } from '@fortawesome/free-solid-svg-icons'
import '../../styles/hematology/ScheduledPatients.css'

// Action to handle sample accession (Check In)
export async function action({ request }) {
    const token = localStorage.getItem('token')
    const formData = await request.formData()
    const testOrderId = formData.get('testOrderId')
    const patientName = formData.get('patientName')
    const testName = formData.get('testName')

    try {
        const response = await fetch('http://127.0.0.1:8000/api/hematology/accession/', {
            method: 'POST',
            headers: {
                'Authorization': `Token ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ test_order_id: parseInt(testOrderId) })
        })

        const data = await response.json()

        if (!response.ok) {
            return {
                success: false,
                error: data.error || 'Failed to check in patient',
                testOrderId
            }
        }

        return {
            success: true,
            message: `Successfully checked in ${patientName} for ${testName}`,
            accessionNumber: data.accession_number,
            barcode: data.barcode,
            testOrderId
        }
    } catch (error) {
        console.error('Check-in error:', error)
        return {
            success: false,
            error: 'Network error. Please check your connection.',
            testOrderId
        }
    }
}

export default function ScheduledPatients() {
    const context = useOutletContext()
    const actionData = useActionData()
    const navigation = useNavigation()
    
    const scheduledPatients = context?.scheduledPatients || []
    const isRefreshing = context?.isRefreshing || false
    const isSubmitting = navigation.state === 'submitting'
    const submittingFormData = navigation.formData

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    const formatTime = (timeString) => {
        if (!timeString) return 'N/A'
        return timeString.slice(0, 5)
    }

    // Group appointments by date
    const groupedAppointments = scheduledPatients.reduce((groups, patient) => {
        const date = patient.appointment_date
        if (!groups[date]) {
            groups[date] = []
        }
        groups[date].push(patient)
        return groups
    }, {})

    // Sort dates
    const sortedDates = Object.keys(groupedAppointments).sort()

    return (
        <div className="scheduled-patients-container">
            <header className="page-header">
                <div>
                    <h1 className="page-title">
                        <FontAwesomeIcon icon={faCalendarCheck} className="title-icon" />
                        Scheduled Patients
                    </h1>
                    <p className="page-subtitle">
                        {scheduledPatients.length} confirmed appointment{scheduledPatients.length !== 1 ? 's' : ''} ready for check-in
                    </p>
                </div>
                <button 
                    onClick={context?.refreshData} 
                    className="btn-refresh" 
                    disabled={isRefreshing}
                >
                    {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </button>
            </header>

            {/* Success Message */}
            {actionData?.success && (
                <div className="alert alert-success">
                    <FontAwesomeIcon icon={faUserCheck} />
                    <div>
                        <strong>✓ {actionData.message}</strong>
                        {actionData.accessionNumber && (
                            <div style={{marginTop: '4px', fontSize: '13px'}}>
                                Accession Number: <code style={{
                                    background: 'rgba(0,0,0,0.1)', 
                                    padding: '2px 6px', 
                                    borderRadius: '4px',
                                    fontWeight: 600
                                }}>{actionData.accessionNumber}</code>
                                {' • '}
                                Barcode: <code style={{
                                    background: 'rgba(0,0,0,0.1)', 
                                    padding: '2px 6px', 
                                    borderRadius: '4px',
                                    fontWeight: 600
                                }}>{actionData.barcode}</code>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Error Message */}
            {actionData?.error && (
                <div className="alert alert-error">
                    <span>✗</span>
                    <span>{actionData.error}</span>
                </div>
            )}

            {/* Appointments Grouped by Date */}
            {sortedDates.length === 0 && !isRefreshing ? (
                <div className="empty-state" style={{padding: '80px 20px'}}>
                    <FontAwesomeIcon icon={faCalendarCheck} className="empty-icon" style={{fontSize: '64px', marginBottom: '20px'}} />
                    <h3 style={{color: '#122056', marginBottom: '8px', fontSize: '20px'}}>No Scheduled Appointments</h3>
                    <p style={{color: '#6b7280'}}>There are no confirmed appointments at this time.</p>
                </div>
            ) : isRefreshing && scheduledPatients.length === 0 ? (
                <div className="loading-state" style={{padding: '60px 20px', textAlign: 'center'}}>
                    <div style={{fontSize: '40px', marginBottom: '16px'}}>⏳</div>
                    <p>Loading appointments...</p>
                </div>
            ) : (
                sortedDates.map(date => (
                    <section key={date} className="appointments-section">
                        <div className="section-header">
                            <h2>{formatDate(date)}</h2>
                            <span className="date-badge">
                                {groupedAppointments[date].length} appointment{groupedAppointments[date].length !== 1 ? 's' : ''}
                            </span>
                        </div>

                        <div className="patients-grid">
                            {groupedAppointments[date].map(patient => {
                                const isThisSubmitting = isSubmitting && 
                                    submittingFormData?.get('testOrderId') === patient.test_order_id.toString()

                                return (
                                    <div key={patient.test_order_id} className="patient-card">
                                        <div className="card-header">
                                            <div className="patient-icon">
                                                <FontAwesomeIcon icon={faUserCheck} />
                                            </div>
                                            <div className="patient-info">
                                                <h3 className="patient-name">{patient.patient_name}</h3>
                                                <span className="appointment-time">
                                                    <FontAwesomeIcon icon={faClock} className="time-icon" />
                                                    {formatTime(patient.appointment_time)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="card-body">
                                            <div className="info-row">
                                                <span className="info-label">Test:</span>
                                                <span className="info-value">{patient.test_name}</span>
                                            </div>
                                            <div className="info-row">
                                                <span className="info-label">Type:</span>
                                                <span className="test-type-badge">{patient.test_type}</span>
                                            </div>
                                            <div className="info-row">
                                                <span className="info-label">Status:</span>
                                                <span className={`status-badge ${patient.appointment_status}`}>
                                                    {patient.appointment_status}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="card-footer">
                                            <Form method="post" replace>
                                                <input type="hidden" name="testOrderId" value={patient.test_order_id} />
                                                <input type="hidden" name="patientName" value={patient.patient_name} />
                                                <input type="hidden" name="testName" value={patient.test_name} />
                                                <button
                                                    type="submit"
                                                    disabled={isThisSubmitting}
                                                    className="btn-accession"
                                                >
                                                    <FontAwesomeIcon icon={faClipboardCheck} />
                                                    {isThisSubmitting ? 'Checking In...' : 'Check In Patient'}
                                                </button>
                                            </Form>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </section>
                ))
            )}
        </div>
    )
}