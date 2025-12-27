import { useOutletContext, useActionData, useNavigation, Form } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCalendarCheck, faUserCheck, faClipboardCheck, faClock } from '@fortawesome/free-solid-svg-icons'
import '../../styles/hematology/ScheduledPatients.css'
import { getToken } from '../../utls'

// Action to handle sample accession (Check In) - Supports both types
export async function action({ request }) {
    const token = getToken()
    const formData = await request.formData()
    const testOrderId = formData.get('testOrderId')
    const patientName = formData.get('patientName')
    const testName = formData.get('testName')
    const testType = formData.get('testType')

    try {
        // Use appropriate endpoint based on test type
        const endpoint = testType === 'pathology' 
            ? 'http://127.0.0.1:8000/api/pathology/accession/'
            : 'http://127.0.0.1:8000/api/hematology/accession/'

        const response = await fetch(endpoint, {
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

        // Return appropriate response based on type
        if (testType === 'pathology') {
            return {
                success: true,
                testType: 'pathology',
                message: `Successfully checked in ${patientName} for ${testName}`,
                caseId: data.id,
                accessionNumber: data.accession_number,
                barcode: data.barcode,
                testOrderId
            }
        } else {
            return {
                success: true,
                testType: 'hematology',
                message: `Successfully checked in ${patientName} for ${testName}`,
                accessionNumber: data.accession_number,
                barcode: data.barcode,
                testOrderId
            }
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
    
    // Combine hematology and pathology scheduled patients
    const hematologyPatients = Array.isArray(context?.scheduledPatients) ? context.scheduledPatients : []
    const pathologyPatients = Array.isArray(context?.pathologyScheduled) ? context.pathologyScheduled : []
    const allPatients = [...hematologyPatients, ...pathologyPatients]
    
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
    const groupedAppointments = allPatients.reduce((groups, patient) => {
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
                        {allPatients.length} confirmed appointment{allPatients.length !== 1 ? 's' : ''} ready for check-in
                        {' '}({hematologyPatients.length} Hematology, {pathologyPatients.length} Pathology)
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
                                Accession: <code style={{
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
                        {actionData.testType === 'pathology' && (
                            <div style={{marginTop: '8px', fontSize: '13px', color: '#2563eb'}}>
                                → Next: Upload DICOM slide at <a href="/hematology/upload" style={{fontWeight: 'bold'}}>Upload Slides</a>
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
            ) : isRefreshing && allPatients.length === 0 ? (
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
                                                <span className={`test-type-badge ${patient.test_type}`}>
                                                    {patient.test_type}
                                                </span>
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
                                                <input type="hidden" name="testType" value={patient.test_type} />
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