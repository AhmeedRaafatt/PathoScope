import { useOutletContext, useActionData, useNavigation, Form } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUpload, faCheckCircle, faExclamationTriangle, faSpinner, faFolder, faFile, faFileArchive } from '@fortawesome/free-solid-svg-icons'
import '../../styles/hematology/UploadSlides.css'
import { getToken } from '../../utls'

// Action to handle DICOM upload (single file, multiple files, folder, or ZIP)
export async function action({ request }) {
    const token = getToken()
    const formData = await request.formData()
    const caseId = formData.get('caseId')
    const accessionNumber = formData.get('accessionNumber')
    const uploadType = formData.get('uploadType') // 'single', 'folder', or 'zip'
    
    // Get files based on upload type
    const files = formData.getAll('dicomFiles')
    const zipFile = formData.get('zipFile')

    if ((!files || files.length === 0 || (files.length === 1 && files[0].size === 0)) && !zipFile) {
        return {
            success: false,
            error: 'Please select file(s) to upload',
            caseId
        }
    }

    try {
        const uploadFormData = new FormData()
        uploadFormData.append('case_id', caseId)

        if (uploadType === 'zip' && zipFile) {
            uploadFormData.append('zip_file', zipFile)
        } else if (files.length === 1 && files[0].size > 0) {
            // Single file upload
            uploadFormData.append('dicom_file', files[0])
        } else if (files.length > 1) {
            // Multiple files (folder upload)
            files.forEach(file => {
                if (file.size > 0) {
                    uploadFormData.append('dicom_files', file)
                }
            })
        }

        const response = await fetch('http://127.0.0.1:8000/api/pathology/upload/', {
            method: 'POST',
            headers: {
                'Authorization': `Token ${token}`
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

        // Check if it's a volume being processed in background
        if (data.status === 'processing') {
            return {
                success: true,
                message: `${data.num_slices} DICOM slices uploaded for ${accessionNumber}. Volume processing in background.`,
                isVolume: true,
                caseId
            }
        }

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
    const [selectedFiles, setSelectedFiles] = useState({}) // { caseId: { files: [], type: 'single'|'folder'|'zip' } }
    const [uploadModes, setUploadModes] = useState({}) // { caseId: 'single'|'folder'|'zip' }

    // Fetch pending cases (sample_received status)
    useEffect(() => {
        fetchPendingCases()
    }, [])

    const fetchPendingCases = async () => {
        setLoading(true)
        try {
            const token = getToken()
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
            setUploadModes(prev => {
                const updated = { ...prev }
                delete updated[actionData.caseId]
                return updated
            })
        }
    }, [actionData])

    const handleUploadModeChange = (caseId, mode) => {
        setUploadModes(prev => ({ ...prev, [caseId]: mode }))
        setSelectedFiles(prev => {
            const updated = { ...prev }
            delete updated[caseId]
            return updated
        })
    }

    const handleFileSelect = (caseId, files, type) => {
        // Filter DICOM files for folder upload
        let filteredFiles = Array.from(files)
        if (type === 'folder') {
            filteredFiles = filteredFiles.filter(f => 
                f.name.toLowerCase().endsWith('.dcm') || f.name.toLowerCase().endsWith('.dicom')
            )
        }
        
        setSelectedFiles(prev => ({
            ...prev,
            [caseId]: { files: filteredFiles, type }
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

    const getUploadMode = (caseId) => uploadModes[caseId] || 'single'
    const getSelectedFileInfo = (caseId) => selectedFiles[caseId] || { files: [], type: 'single' }

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
                        const fileInfo = getSelectedFileInfo(caseItem.id)
                        const hasFiles = fileInfo.files.length > 0
                        const uploadMode = getUploadMode(caseItem.id)

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

                                    {/* Upload Mode Selection */}
                                    <div className="upload-mode-selector" style={{ marginBottom: '16px' }}>
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                                            Upload Type:
                                        </label>
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            <button
                                                type="button"
                                                onClick={() => handleUploadModeChange(caseItem.id, 'single')}
                                                style={{
                                                    padding: '6px 12px',
                                                    fontSize: '12px',
                                                    borderRadius: '6px',
                                                    border: uploadMode === 'single' ? '2px solid #5B65DC' : '1px solid #d1d5db',
                                                    backgroundColor: uploadMode === 'single' ? '#eff6ff' : 'white',
                                                    color: uploadMode === 'single' ? '#5B65DC' : '#6b7280',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px'
                                                }}
                                            >
                                                <FontAwesomeIcon icon={faFile} />
                                                Single File
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleUploadModeChange(caseItem.id, 'folder')}
                                                style={{
                                                    padding: '6px 12px',
                                                    fontSize: '12px',
                                                    borderRadius: '6px',
                                                    border: uploadMode === 'folder' ? '2px solid #059669' : '1px solid #d1d5db',
                                                    backgroundColor: uploadMode === 'folder' ? '#ecfdf5' : 'white',
                                                    color: uploadMode === 'folder' ? '#059669' : '#6b7280',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px'
                                                }}
                                            >
                                                <FontAwesomeIcon icon={faFolder} />
                                                MRI/CT Folder
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleUploadModeChange(caseItem.id, 'zip')}
                                                style={{
                                                    padding: '6px 12px',
                                                    fontSize: '12px',
                                                    borderRadius: '6px',
                                                    border: uploadMode === 'zip' ? '2px solid #f59e0b' : '1px solid #d1d5db',
                                                    backgroundColor: uploadMode === 'zip' ? '#fffbeb' : 'white',
                                                    color: uploadMode === 'zip' ? '#f59e0b' : '#6b7280',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px'
                                                }}
                                            >
                                                <FontAwesomeIcon icon={faFileArchive} />
                                                ZIP Archive
                                            </button>
                                        </div>
                                    </div>

                                    <Form method="post" encType="multipart/form-data">
                                        <input type="hidden" name="caseId" value={caseItem.id} />
                                        <input type="hidden" name="accessionNumber" value={caseItem.accession_number} />
                                        <input type="hidden" name="uploadType" value={uploadMode} />
                                        
                                        <div className="file-input-wrapper">
                                            {uploadMode === 'single' && (
                                                <>
                                                    <label htmlFor={`file-${caseItem.id}`} className="file-label">
                                                        <FontAwesomeIcon icon={faFile} />
                                                        {hasFiles ? fileInfo.files[0].name : 'Choose DICOM File'}
                                                    </label>
                                                    <input
                                                        type="file"
                                                        id={`file-${caseItem.id}`}
                                                        name="dicomFiles"
                                                        accept=".dcm,.dicom"
                                                        onChange={(e) => handleFileSelect(caseItem.id, e.target.files, 'single')}
                                                        className="file-input"
                                                        required
                                                    />
                                                </>
                                            )}

                                            {uploadMode === 'folder' && (
                                                <>
                                                    <label htmlFor={`folder-${caseItem.id}`} className="file-label" style={{ borderColor: '#059669', color: hasFiles ? '#059669' : undefined }}>
                                                        <FontAwesomeIcon icon={faFolder} />
                                                        {hasFiles ? `${fileInfo.files.length} DICOM files selected` : 'Select DICOM Folder'}
                                                    </label>
                                                    <input
                                                        type="file"
                                                        id={`folder-${caseItem.id}`}
                                                        name="dicomFiles"
                                                        webkitdirectory=""
                                                        directory=""
                                                        multiple
                                                        onChange={(e) => handleFileSelect(caseItem.id, e.target.files, 'folder')}
                                                        className="file-input"
                                                        required
                                                    />
                                                    <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '6px' }}>
                                                        For MRI/CT series with multiple slices
                                                    </p>
                                                </>
                                            )}

                                            {uploadMode === 'zip' && (
                                                <>
                                                    <label htmlFor={`zip-${caseItem.id}`} className="file-label" style={{ borderColor: '#f59e0b', color: hasFiles ? '#f59e0b' : undefined }}>
                                                        <FontAwesomeIcon icon={faFileArchive} />
                                                        {hasFiles ? fileInfo.files[0].name : 'Choose ZIP Archive'}
                                                    </label>
                                                    <input
                                                        type="file"
                                                        id={`zip-${caseItem.id}`}
                                                        name="zipFile"
                                                        accept=".zip"
                                                        onChange={(e) => handleFileSelect(caseItem.id, e.target.files, 'zip')}
                                                        className="file-input"
                                                        required
                                                    />
                                                </>
                                            )}
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={!hasFiles || isThisSubmitting}
                                            className="btn-upload"
                                            style={{
                                                backgroundColor: uploadMode === 'folder' ? '#059669' : 
                                                                 uploadMode === 'zip' ? '#f59e0b' : undefined
                                            }}
                                        >
                                            {isThisSubmitting ? (
                                                <>
                                                    <FontAwesomeIcon icon={faSpinner} spin />
                                                    Uploading...
                                                </>
                                            ) : (
                                                <>
                                                    <FontAwesomeIcon icon={faUpload} />
                                                    {uploadMode === 'folder' 
                                                        ? `Upload ${fileInfo.files.length || ''} Slices` 
                                                        : 'Upload Slide'}
                                                </>
                                            )}
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