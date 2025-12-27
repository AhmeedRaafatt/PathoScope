import { useOutletContext, useActionData, useNavigation, Form } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUpload, faCheckCircle, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons'
import '../../styles/hematology/UploadSlides.css'

// Action to handle DICOM upload
export async function action({ request }) {
    const token = localStorage.getItem('token')
    const formData = await request.formData()
    const caseId = formData.get('caseId')
    const file = formData.get('dicomFile')
    const accessionNumber = formData.get('accessionNumber')

    if (!file || !caseId) {
        return {
            success: false,
            error: 'Missing file or case ID',
            caseId
        }
    }

    try {
        const uploadFormData = new FormData()
        uploadFormData.append('case_id', caseId)  // Backend expects 'case_id'
        uploadFormData.append('dicom_file', file)

        const response = await fetch('http://127.0.0.1:8000/api/pathology/upload/', {
            method: 'POST',
            headers: {
                'Authorization': `Token ${token}`
                // Don't set Content-Type - browser sets it with boundary for multipart
            },
            body: uploadFormData
        })

        if (!response.ok) {
            const data = await response.json().catch(() => ({}))
            return {
                success: false,
                error: data.error || 'Upload failed',
                caseId
            }
        }

        const data = await response.json()

        return {
            success: true,
            message: `Slide uploaded successfully for ${accessionNumber}`,
            caseId
        }
    } catch (error) {
        console.error('Upload error:', error)
        return {
            success: false,
            error: 'Network error. Please try again.',
            caseId
        }
    }
}

export default function UploadSlides() {
    const context = useOutletContext()
    const actionData = useActionData()
    const navigation = useNavigation()
    
    const isRefreshing = context?.isRefreshing || false
    const isSubmitting = navigation.state === 'submitting'
    
    const [pendingCases, setPendingCases] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedFiles, setSelectedFiles] = useState({})

    // Fetch pending cases (sample_received status)
    useEffect(() => {
        fetchPendingCases()
    }, [])

    const fetchPendingCases = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem('token')
            const response = await fetch('http://127.0.0.1:8000/api/pathology/list/', {
                headers: { 'Authorization': `Token ${token}` }
            })

            if (response.ok) {
                const allCases = await response.json()
                // Filter for cases awaiting upload (sample_received status, no DICOM file)
                const pending = allCases.filter(c => c.status === 'sample_received' && !c.dicom_file)
                setPendingCases(pending)
            }
        } catch (error) {
            console.error('Error fetching pending cases:', error)
        } finally {
            setLoading(false)
        }
    }

    // Refresh after successful upload
    useEffect(() => {
        if (actionData?.success) {
            fetchPendingCases()
            // Clear the file for this case
            setSelectedFiles(prev => {
                const updated = { ...prev }
                delete updated[actionData.caseId]
                return updated
            })
        }
    }, [actionData])

    const handleFileSelect = (caseId, file) => {
        setSelectedFiles(prev => ({
            ...prev,
            [caseId]: file
        }))
    }

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A'
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <div className="upload-slides-container">
            {/* Page Header */}
            <header className="page-header">
                <div>
                    <h1 className="page-title">
                        <FontAwesomeIcon icon={faUpload} className="title-icon" />
                        Upload Slides
                    </h1>
                    <p className="page-subtitle">
                        {pendingCases.length} case{pendingCases.length !== 1 ? 's' : ''} awaiting DICOM upload
                    </p>
                </div>
                <button 
                    onClick={fetchPendingCases} 
                    className="btn-refresh" 
                    disabled={loading}
                >
                    {loading ? 'Refreshing...' : 'Refresh'}
                </button>
            </header>

            {/* Success Message */}
            {actionData?.success && (
                <div className="alert alert-success">
                    <FontAwesomeIcon icon={faCheckCircle} />
                    <span>✓ {actionData.message}</span>
                </div>
            )}

            {/* Error Message */}
            {actionData?.error && (
                <div className="alert alert-error">
                    <FontAwesomeIcon icon={faExclamationTriangle} />
                    <span>✗ {actionData.error}</span>
                </div>
            )}

            {/* Pending Cases List */}
            {loading ? (
                <div className="loading-state">Loading cases...</div>
            ) : pendingCases.length === 0 ? (
                <div className="empty-state">
                    <FontAwesomeIcon icon={faUpload} className="empty-icon" />
                    <h3>No Pending Uploads</h3>
                    <p>All cases have been uploaded or no cases are ready for upload</p>
                </div>
            ) : (
                <div className="cases-grid">
                    {pendingCases.map(caseItem => {
                        const isThisSubmitting = isSubmitting && 
                            navigation.formData?.get('caseId') === caseItem.id.toString()
                        const hasFile = !!selectedFiles[caseItem.id]

                        return (
                            <div key={caseItem.id} className="upload-card">
                                <div className="card-header">
                                    <div className="case-icon">
                                        <FontAwesomeIcon icon={faUpload} />
                                    </div>
                                    <div className="case-info">
                                        <h3 className="accession-number">{caseItem.accession_number}</h3>
                                        <p className="patient-name">{caseItem.patient_name || 'Unknown Patient'}</p>
                                    </div>
                                    <span className="status-badge awaiting">
                                        Awaiting Upload
                                    </span>
                                </div>

                                <div className="card-body">
                                    <div className="info-grid">
                                        <div className="info-item">
                                            <span className="info-label">Accessioned</span>
                                            <span className="info-value">{formatDate(caseItem.uploaded_at)}</span>
                                        </div>
                                        <div className="info-item">
                                            <span className="info-label">Barcode</span>
                                            <span className="info-value barcode">{caseItem.barcode}</span>
                                        </div>
                                    </div>

                                    <Form method="post" encType="multipart/form-data">
                                        <input type="hidden" name="caseId" value={caseItem.id} />
                                        <input type="hidden" name="accessionNumber" value={caseItem.accession_number} />
                                        
                                        <div className="file-input-wrapper">
                                            <label htmlFor={`file-${caseItem.id}`} className="file-label">
                                                <FontAwesomeIcon icon={faUpload} />
                                                {hasFile ? selectedFiles[caseItem.id].name : 'Choose DICOM File'}
                                            </label>
                                            <input
                                                type="file"
                                                id={`file-${caseItem.id}`}
                                                name="dicomFile"
                                                accept=".dcm,.dicom"
                                                onChange={(e) => handleFileSelect(caseItem.id, e.target.files[0])}
                                                className="file-input"
                                                required
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={!hasFile || isThisSubmitting}
                                            className="btn-upload"
                                        >
                                            <FontAwesomeIcon icon={faUpload} />
                                            {isThisSubmitting ? 'Uploading...' : 'Upload Slide'}
                                        </button>
                                    </Form>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}