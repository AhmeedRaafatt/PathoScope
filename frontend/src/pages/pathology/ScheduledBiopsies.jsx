import { useOutletContext, useNavigate, useActionData, useNavigation, Form } from 'react-router-dom'
import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCalendarCheck, faUserCheck, faClipboardCheck, faClock } from '@fortawesome/free-solid-svg-icons'
import '../../styles/pathology/ScheduledBiopsies.css'

// Action to handle sample accession (Check In)
export async function action({ request }) {
    const token = localStorage.getItem('token')
    const formData = await request.formData()
    const testOrderId = formData.get('testOrderId')
    const patientName = formData.get('patientName')

    try {
        const response = await fetch('http://127.0.0.1:8000/api/pathology/accession/', {
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
            message: `Successfully checked in ${patientName}`,
            caseId: data.id,
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

export default function ScheduledBiopsies() {
    const context = useOutletContext()
    const navigate = useNavigate()
    const actionData = useActionData()
    const navigation = useNavigation()
    
    const scheduledPatients = context?.scheduledPatients || []
    const isRefreshing = context?.isRefreshing || false
    const isSubmitting = navigation.state === 'submitting'
    const submittingFormData = navigation.formData
    const [uploadModalCaseId, setUploadModalCaseId] = useState(null)

    // Auto-redirect to upload after successful check-in
    if (actionData?.success && actionData?.caseId && !uploadModalCaseId) {
        setUploadModalCaseId(actionData.caseId)
    }

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

    const sortedDates = Object.keys(groupedAppointments).sort()

    return (
        <div className="scheduled-biopsies-container">
            <header className="page-header">
                <div>
                    <h1 className="page-title">
                        <FontAwesomeIcon icon={faCalendarCheck} className="title-icon" />
                        Scheduled Biopsies
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
                                Accession: <code>{actionData.accessionNumber}</code>
                                {' • '}
                                Barcode: <code>{actionData.barcode}</code>
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
                    <p style={{color: '#6b7280'}}>There are no confirmed biopsy appointments at this time.</p>
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

            {/* Upload Modal - Shows automatically after check-in */}
            {uploadModalCaseId && (
                <UploadModal 
                    caseId={uploadModalCaseId}
                    accessionNumber={actionData?.accessionNumber}
                    onClose={() => {
                        setUploadModalCaseId(null)
                        if (context?.refreshData) context.refreshData()
                    }}
                />
            )}
        </div>
    )
}

// Upload Modal Component
function UploadModal({ caseId, accessionNumber, onClose }) {
    const [file, setFile] = useState(null)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState(null)

    const handleUpload = async (e) => {
        e.preventDefault()
        if (!file) {
            setError('Please select a file')
            return
        }

        setUploading(true)
        setError(null)

        const token = localStorage.getItem('token')
        const formData = new FormData()
        formData.append('case_id', caseId)
        formData.append('dicom_file', file)

        try {
            const response = await fetch('http://127.0.0.1:8000/api/pathology/upload/', {
                method: 'POST',
                headers: { 'Authorization': `Token ${token}` },
                body: formData
            })

            if (response.ok) {
                alert('✓ Slide uploaded successfully!')
                onClose()
            } else {
                const data = await response.json()
                setError(data.error || 'Upload failed')
            }
        } catch (error) {
            console.error(error)
            setError('Network error. Please try again.')
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Upload DICOM Slide</h2>
                    <button onClick={onClose} className="modal-close-btn">×</button>
                </div>
                <div className="modal-body">
                    <p style={{marginBottom: '16px', color: '#6b7280'}}>
                        Upload slide for: <strong>{accessionNumber}</strong>
                    </p>
                    
                    {error && (
                        <div className="alert alert-error" style={{marginBottom: '16px'}}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleUpload}>
                        <div style={{marginBottom: '20px'}}>
                            <label style={{display: 'block', marginBottom: '8px', fontWeight: '500'}}>
                                DICOM File (.dcm)
                            </label>
                            <input
                                type="file"
                                accept=".dcm,.dicom"
                                onChange={(e) => setFile(e.target.files[0])}
                                required
                                style={{width: '100%'}}
                            />
                        </div>
                        <div style={{display: 'flex', gap: '12px', justifyContent: 'flex-end'}}>
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={uploading}
                                className="btn-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={uploading}
                                className="btn-primary"
                            >
                                {uploading ? 'Uploading...' : 'Upload Slide'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}