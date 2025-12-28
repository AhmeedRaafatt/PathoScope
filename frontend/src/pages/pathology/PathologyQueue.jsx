import { useOutletContext, useNavigate } from 'react-router-dom'
import { useState, useMemo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
    faMicroscope, 
    faSearch,
    faCalendar,
    faUser,
    faEye
} from '@fortawesome/free-solid-svg-icons'
import '../../styles/pathology/PathologyQueue.css'

export default function PathologyQueue() {
    const context = useOutletContext()
    const navigate = useNavigate()
    
    const queue = context?.queue || []
    const isRefreshing = context?.isRefreshing || false
    
    const [searchTerm, setSearchTerm] = useState('')
    const [sortBy, setSortBy] = useState('date') // 'date', 'patient', 'status'

    // Filter and sort queue
    const filteredQueue = useMemo(() => {
        let filtered = queue.filter(caseItem => {
            const searchLower = searchTerm.toLowerCase()
            return (
                caseItem.accession_number?.toLowerCase().includes(searchLower) ||
                caseItem.patient_name?.toLowerCase().includes(searchLower) ||
                caseItem.body_part_examined?.toLowerCase().includes(searchLower)
            )
        })

        // Sort
        filtered.sort((a, b) => {
            if (sortBy === 'date') {
                return new Date(b.uploaded_at) - new Date(a.uploaded_at)
            } else if (sortBy === 'patient') {
                return (a.patient_name || '').localeCompare(b.patient_name || '')
            }
            return 0
        })

        return filtered
    }, [queue, searchTerm, sortBy])

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

    const getTimeAgo = (dateString) => {
        if (!dateString) return 'Unknown'
        const now = new Date()
        const uploaded = new Date(dateString)
        const diffMs = now - uploaded
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
        const diffDays = Math.floor(diffHours / 24)
        
        if (diffDays > 0) return `${diffDays}d ago`
        if (diffHours > 0) return `${diffHours}h ago`
        return 'Just now'
    }

    const handleOpenViewer = (caseId) => {
        navigate(`/pathology/viewer/${caseId}`)
    }

    // Calculate stats
    const awaitingReview = queue.filter(c => c.status === 'awaiting_review').length
    const inReview = queue.filter(c => c.status === 'in_review').length
    const oldestCase = queue.length > 0 
        ? Math.max(...queue.map(c => new Date() - new Date(c.uploaded_at))) / (1000 * 60 * 60 * 24)
        : 0

    return (
        <div className="pathology-queue-container">
            {/* Page Header */}
            <header className="page-header">
                <div>
                    <h1 className="page-title">
                        <FontAwesomeIcon icon={faMicroscope} className="title-icon" />
                        Review Queue
                    </h1>
                    <p className="page-subtitle">
                        {queue.length} case{queue.length !== 1 ? 's' : ''} awaiting pathologist review
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

            {/* Queue Stats */}
            <div className="queue-stats">
                <div className="stat-card awaiting">
                    <div className="stat-icon">
                        <FontAwesomeIcon icon={faMicroscope} />
                    </div>
                    <div className="stat-content">
                        <h3>{awaitingReview}</h3>
                        <p>Awaiting Review</p>
                    </div>
                </div>
                <div className="stat-card review">
                    <div className="stat-icon">
                        <FontAwesomeIcon icon={faEye} />
                    </div>
                    <div className="stat-content">
                        <h3>{inReview}</h3>
                        <p>In Review</p>
                    </div>
                </div>
                <div className="stat-card oldest">
                    <div className="stat-icon">
                        <FontAwesomeIcon icon={faCalendar} />
                    </div>
                    <div className="stat-content">
                        <h3>{oldestCase.toFixed(1)}d</h3>
                        <p>Oldest Case</p>
                    </div>
                </div>
            </div>

            {/* Search and Sort Controls */}
            <div className="queue-controls">
                <div className="search-box">
                    <FontAwesomeIcon icon={faSearch} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search by accession, patient, or body part..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>
                <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                    className="sort-select"
                >
                    <option value="date">Sort by Date</option>
                    <option value="patient">Sort by Patient</option>
                </select>
            </div>

            {/* Queue List */}
            <div className="queue-list">
                {isRefreshing && queue.length === 0 ? (
                    <div className="loading-state">Loading queue...</div>
                ) : filteredQueue.length === 0 ? (
                    <div className="empty-state">
                        <FontAwesomeIcon icon={faMicroscope} className="empty-icon" />
                        {searchTerm ? (
                            <>
                                <h3>No Results Found</h3>
                                <p>Try adjusting your search term</p>
                            </>
                        ) : (
                            <>
                                <h3>Queue is Empty</h3>
                                <p>No cases awaiting review at this time</p>
                            </>
                        )}
                    </div>
                ) : (
                    filteredQueue.map(caseItem => (
                        <div key={caseItem.id} className="queue-item">
                            <div className="queue-item-header">
                                <div className="case-icon-wrapper">
                                    <FontAwesomeIcon icon={faMicroscope} />
                                </div>
                                <div className="case-info">
                                    <div className="accession-row">
                                        <h3 className="accession-number">{caseItem.accession_number}</h3>
                                        <span className={`status-badge ${caseItem.status}`}>
                                            {caseItem.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <div className="case-metadata">
                                        <span className="meta-item">
                                            <FontAwesomeIcon icon={faUser} />
                                            {caseItem.patient_name || 'Unknown Patient'}
                                        </span>
                                        {caseItem.body_part_examined && (
                                            <span className="meta-item">
                                                • {caseItem.body_part_examined}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="queue-item-body">
                                <div className="info-grid">
                                    <div className="info-item">
                                        <span className="info-label">Uploaded</span>
                                        <span className="info-value">{formatDate(caseItem.uploaded_at)}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Time in Queue</span>
                                        <span className="info-value">{getTimeAgo(caseItem.uploaded_at)}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Barcode</span>
                                        <span className="info-value barcode">{caseItem.barcode}</span>
                                    </div>
                                </div>

                                {/* Preview Image if available */}
                                {caseItem.image_preview && (
                                    <div className="preview-container">
                                        <img 
                                            src={`http://127.0.0.1:8000${caseItem.image_preview}`}
                                            alt="Slide Preview"
                                            className="preview-image"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="queue-item-footer">
                                <button
                                    onClick={() => handleOpenViewer(caseItem.id)}
                                    className="btn-open-viewer"
                                >
                                    <FontAwesomeIcon icon={faEye} />
                                    Open Viewer
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}