import { useState, useMemo } from 'react'
import { useOutletContext, useActionData, useNavigation, Form, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
    faTachometerAlt, 
    faFlask, 
    faCheckCircle, 
    faClipboardList,
    faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons'
import '../../styles/hematology/SamplesDashboard.css'
import ResultsEntryModal from '../../components/hematology/ResultsEntryModal'
import { getToken } from '../../utls'

// Action to add sample to queue
export async function action({ request }) {
    const token = getToken()
    const formData = await request.formData()
    const sampleId = formData.get('sampleId')
    const accessionNumber = formData.get('accessionNumber')

    try {
        const response = await fetch('http://127.0.0.1:8000/api/hematology/queue/add/', {
            method: 'POST',
            headers: {
                'Authorization': `Token ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sample_id: parseInt(sampleId) })
        })

        const data = await response.json()

        if (!response.ok) {
            return {
                success: false,
                error: data.error || 'Failed to add to queue',
                sampleId
            }
        }

        return {
            success: true,
            message: `Sample ${accessionNumber} added to ${data.position === 'processing' ? 'processing' : 'waiting queue'}`,
            position: data.position,
            sampleId
        }
    } catch (error) {
        console.error('Queue error:', error)
        return {
            success: false,
            error: 'Network error. Please try again.',
            sampleId
        }
    }
}

export default function SamplesDashboard() {
    const context = useOutletContext()
    const actionData = useActionData()
    const navigation = useNavigation()
    
    const samples = context?.samples || []
    const isRefreshing = context?.isRefreshing || false
    const isSubmitting = navigation.state === 'submitting'
    const submittingFormData = navigation.formData
    const [filterStatus, setFilterStatus] = useState('all')
    const [entrySample, setEntrySample] = useState(null)
    const [modalAnalytes, setModalAnalytes] = useState(null)
    const [loadingAnalytes, setLoadingAnalytes] = useState(false)
    const [checkingResults, setCheckingResults] = useState({})
    const navigate = useNavigate()

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

    // Fetch analytes BEFORE opening modal
    const openResultsModal = async (sample) => {
        setLoadingAnalytes(true)
        setModalAnalytes(null)
        
        try {
            const token = getToken()
            const testName = encodeURIComponent(sample.test_name)
            const url = `http://127.0.0.1:8000/api/hematology/analytes/?test_name=${testName}`
            
            console.log('Fetching analytes from:', url)
            
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json'
                }
            })

            console.log('Response status:', response.status)

            if (!response.ok) {
                throw new Error(`Failed to fetch analytes: ${response.status}`)
            }

            const data = await response.json()
            console.log('Analytes received:', data)

            if (!Array.isArray(data) || data.length === 0) {
                alert(`No test parameters configured for "${sample.test_name}". Please contact administrator.`)
                return
            }

            // Set analytes data FIRST
            setModalAnalytes(data)
            // Then open modal
            setEntrySample(sample)

        } catch (error) {
            console.error('Error fetching analytes:', error)
            alert('Failed to load test parameters: ' + error.message)
        } finally {
            setLoadingAnalytes(false)
        }
    }

    // Close modal and clear data
    const closeModal = () => {
        setEntrySample(null)
        setModalAnalytes(null)
    }

    // Check if sample has results entered
    const checkSampleResults = async (sampleId) => {
        setCheckingResults(prev => ({ ...prev, [sampleId]: true }))
        try {
            const token = getToken()
            const response = await fetch(
                `http://127.0.0.1:8000/api/hematology/samples/${sampleId}/results/`,
                {
                    headers: {
                        'Authorization': `Token ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            )
            const data = await response.json()
            return Array.isArray(data) && data.length > 0
        } catch (err) {
            console.error('Error checking results:', err)
            return false
        } finally {
            setCheckingResults(prev => ({ ...prev, [sampleId]: false }))
        }
    }

    // Memoize filtered samples and counts
    const { filteredSamples, statusCounts } = useMemo(() => {
        const counts = {
            all: samples.length,
            received: samples.filter(s => s.status === 'received').length,
            in_analysis: samples.filter(s => s.status === 'in_analysis').length,
            awaiting_validation: samples.filter(s => s.status === 'awaiting_validation').length,
            validated: samples.filter(s => s.status === 'validated').length
        }

        const filtered = filterStatus === 'all' 
            ? samples 
            : samples.filter(s => s.status === filterStatus)

        return { filteredSamples: filtered, statusCounts: counts }
    }, [samples, filterStatus])

    const renderActionButton = (sample) => {
        // For received samples - add to queue
        if (sample.status === 'received') {
            const isThisSubmitting = isSubmitting && 
                submittingFormData?.get('sampleId') === sample.id.toString()

            return (
                <Form method="post" replace>
                    <input type="hidden" name="sampleId" value={sample.id} />
                    <input type="hidden" name="accessionNumber" value={sample.accession_number} />
                    <button 
                        type="submit"
                        className="btn-action"
                        disabled={isThisSubmitting}
                    >
                        <FontAwesomeIcon icon={faFlask} />
                        {isThisSubmitting ? 'Adding...' : 'Add to Queue'}
                    </button>
                </Form>
            )
        }

        // For in_analysis samples - enter results
        if (sample.status === 'in_analysis') {
            return (
                <button 
                    className="btn-action" 
                    onClick={() => openResultsModal(sample)}
                    disabled={loadingAnalytes}
                    style={{background: '#0284c7'}}
                >
                    <FontAwesomeIcon icon={faClipboardList} />
                    {loadingAnalytes ? 'Loading...' : 'Enter Results'}
                </button>
            )
        }

        // For awaiting_validation samples - check if results exist
        if (sample.status === 'awaiting_validation') {
            return (
                <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                    <button 
                        className="btn-action"
                        onClick={async () => {
                            const hasResults = await checkSampleResults(sample.id)
                            if (hasResults) {
                                navigate('/hematology/validation')
                            } else {
                                // Results not entered yet - open modal
                                openResultsModal(sample)
                            }
                        }}
                        disabled={checkingResults[sample.id] || loadingAnalytes}
                        style={{background: '#059669'}}
                    >
                        <FontAwesomeIcon icon={faCheckCircle} />
                        {checkingResults[sample.id] ? 'Checking...' : 'Validate Results'}
                    </button>
                    
                    <button 
                        className="btn-action-secondary"
                        onClick={() => openResultsModal(sample)}
                        disabled={loadingAnalytes}
                        style={{
                            background: 'white',
                            color: '#0284c7',
                            border: '1px solid #0284c7',
                            padding: '8px 12px',
                            fontSize: '13px'
                        }}
                    >
                        <FontAwesomeIcon icon={faClipboardList} />
                        {loadingAnalytes ? 'Loading...' : 'Enter/Edit Results'}
                    </button>
                </div>
            )
        }

        // For validated samples
        if (sample.status === 'validated') {
            return (
                <div style={{
                    padding: '12px',
                    background: '#d1fae5',
                    borderRadius: '8px',
                    textAlign: 'center',
                    color: '#065f46',
                    fontWeight: 600,
                    fontSize: '14px'
                }}>
                    ✓ Results Validated & Released
                </div>
            )
        }

        return null
    }

    return (
        <div className="samples-dashboard-container">
            <header className="page-header">
                <div>
                    <h1 className="page-title">
                        <FontAwesomeIcon icon={faTachometerAlt} className="title-icon" />
                        Samples Dashboard
                    </h1>
                    <p className="page-subtitle">View and manage all accessioned samples</p>
                </div>
                <button 
                    onClick={context?.refreshData} 
                    className="btn-refresh" 
                    disabled={isRefreshing}
                >
                    {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </button>
            </header>

            {/* Action Messages */}
            {actionData?.success && (
                <div className="alert alert-success" style={{marginBottom: '20px'}}>
                    <FontAwesomeIcon icon={faCheckCircle} />
                    <span>✓ {actionData.message}</span>
                </div>
            )}

            {actionData?.error && (
                <div className="alert alert-error" style={{marginBottom: '20px'}}>
                    <span>✗</span>
                    <span>{actionData.error}</span>
                </div>
            )}

            {/* Important Notice for Awaiting Validation */}
            {statusCounts.awaiting_validation > 0 && (
                <div className="alert" style={{
                    background: '#fef3c7',
                    border: '1px solid #fbbf24',
                    color: '#92400e',
                    marginBottom: '20px',
                    padding: '16px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'start',
                    gap: '12px'
                }}>
                    <FontAwesomeIcon icon={faExclamationTriangle} style={{marginTop: '2px'}} />
                    <div>
                        <strong style={{display: 'block', marginBottom: '4px'}}>
                            ⚠️ {statusCounts.awaiting_validation} sample(s) awaiting validation
                        </strong>
                        <span style={{fontSize: '14px'}}>
                            Before validating, ensure results have been entered. Click "Enter/Edit Results" if the sample has no data yet.
                        </span>
                    </div>
                </div>
            )}

            {/* Status Filter */}
            <div className="filter-section">
                <div className="filter-buttons">
                    <button 
                        className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
                        onClick={() => setFilterStatus('all')}
                    >
                        All ({statusCounts.all})
                    </button>
                    <button 
                        className={`filter-btn ${filterStatus === 'received' ? 'active' : ''}`}
                        onClick={() => setFilterStatus('received')}
                    >
                        Received ({statusCounts.received})
                    </button>
                    <button 
                        className={`filter-btn ${filterStatus === 'in_analysis' ? 'active' : ''}`}
                        onClick={() => setFilterStatus('in_analysis')}
                    >
                        In Analysis ({statusCounts.in_analysis})
                    </button>
                    <button 
                        className={`filter-btn ${filterStatus === 'awaiting_validation' ? 'active' : ''}`}
                        onClick={() => setFilterStatus('awaiting_validation')}
                    >
                        Awaiting Validation ({statusCounts.awaiting_validation})
                    </button>
                    <button 
                        className={`filter-btn ${filterStatus === 'validated' ? 'active' : ''}`}
                        onClick={() => setFilterStatus('validated')}
                    >
                        Validated ({statusCounts.validated})
                    </button>
                </div>
            </div>

            {/* Results Entry Modal - Only show when BOTH sample AND analytes are ready */}
            {entrySample && modalAnalytes && (
                <ResultsEntryModal
                    sample={entrySample}
                    analytes={modalAnalytes}
                    onClose={closeModal}
                    onSuccess={async () => {
                        if (context?.refreshData) {
                            await context.refreshData();
                        }
                        closeModal();
                    }}
                />
            )}

            {/* Samples List */}
            <div className="samples-list">
                {isRefreshing && samples.length === 0 ? (
                    <div className="loading-state">Loading samples...</div>
                ) : filteredSamples.length === 0 ? (
                    <div className="empty-state">
                        <FontAwesomeIcon icon={faClipboardList} className="empty-icon" />
                        <p>No samples found</p>
                        {filterStatus !== 'all' && (
                            <p style={{fontSize: '14px', color: '#9ca3af', marginTop: '8px'}}>
                                Try changing the filter above
                            </p>
                        )}
                    </div>
                ) : (
                    filteredSamples.map(sample => {
                        return (
                            <div key={sample.id} className="sample-card">
                                <div className="sample-header">
                                    <div className="sample-icon-wrapper">
                                        <FontAwesomeIcon icon={faFlask} />
                                    </div>
                                    <div className="sample-info">
                                        <h3 className="accession-number">{sample.accession_number}</h3>
                                        <p className="barcode">Barcode: {sample.barcode}</p>
                                    </div>
                                    <span className={`status-badge ${sample.status}`}>
                                        {sample.status.replace('_', ' ')}
                                    </span>
                                </div>

                                <div className="sample-body">
                                    <div className="info-grid">
                                        <div className="info-item">
                                            <span className="info-label">Patient</span>
                                            <span className="info-value">{sample.patient_name}</span>
                                        </div>
                                        <div className="info-item">
                                            <span className="info-label">Test</span>
                                            <span className="info-value">{sample.test_name}</span>
                                        </div>
                                        <div className="info-item">
                                            <span className="info-label">Accessioned</span>
                                            <span className="info-value">{formatDate(sample.accessioned_date)}</span>
                                        </div>
                                        {sample.processing_started && (
                                            <div className="info-item">
                                                <span className="info-label">Processing Started</span>
                                                <span className="info-value">{formatDate(sample.processing_started)}</span>
                                            </div>
                                        )}
                                        {sample.processing_completed && (
                                            <div className="info-item">
                                                <span className="info-label">Processing Completed</span>
                                                <span className="info-value">{formatDate(sample.processing_completed)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="sample-footer">
                                    {renderActionButton(sample)}
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}