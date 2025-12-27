import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
    faClipboardList, 
    faSearch,
    faFilter,
    faEye,
    faFilePdf,
    faDownload,
    faMicroscope
} from '@fortawesome/free-solid-svg-icons'
import '../../styles/pathology/AllCases.css'
import { getToken } from '../../utls'

export default function AllCases() {
    const navigate = useNavigate()
    
    const [cases, setCases] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [sortBy, setSortBy] = useState('date') // 'date', 'patient', 'status'

    useEffect(() => {
        fetchAllCases()
    }, [])

    const fetchAllCases = async () => {
        setLoading(true)
        try {
            const token = getToken()
            const response = await fetch('http://127.0.0.1:8000/api/pathology/list/', {
                headers: { 'Authorization': `Token ${token}` }
            })

            if (response.ok) {
                const data = await response.json()
                setCases(data)
            }
        } catch (error) {
            console.error('Error fetching cases:', error)
        } finally {
            setLoading(false)
        }
    }

    // Filter and sort cases
    const filteredCases = useMemo(() => {
        let filtered = cases

        // Apply status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(c => c.status === statusFilter)
        }

        // Apply search
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase()
            filtered = filtered.filter(c =>
                c.accession_number?.toLowerCase().includes(searchLower) ||
                c.patient_name?.toLowerCase().includes(searchLower) ||
                c.body_part_examined?.toLowerCase().includes(searchLower)
            )
        }

        // Sort
        filtered.sort((a, b) => {
            if (sortBy === 'date') {
                return new Date(b.uploaded_at) - new Date(a.uploaded_at)
            } else if (sortBy === 'patient') {
                return (a.patient_name || '').localeCompare(b.patient_name || '')
            } else if (sortBy === 'status') {
                return (a.status || '').localeCompare(b.status || '')
            }
            return 0
        })

        return filtered
    }, [cases, searchTerm, statusFilter, sortBy])

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

    const getStatusColor = (status) => {
        switch (status) {
            case 'sample_received': return 'yellow'
            case 'awaiting_review': return 'blue'
            case 'in_review': return 'purple'
            case 'report_ready': return 'green'
            default: return 'gray'
        }
    }

    const handleViewCase = (caseItem) => {
        if (caseItem.status === 'report_ready' && caseItem.is_finalized) {
            // If finalized, go to report
            navigate(`/pathology/report/${caseItem.id}`)
        } else {
            // Otherwise, go to viewer
            navigate(`/pathology/viewer/${caseItem.id}`)
        }
    }

    // Calculate stats
    const stats = {
        total: cases.length,
        sampleReceived: cases.filter(c => c.status === 'sample_received').length,
        awaitingReview: cases.filter(c => c.status === 'awaiting_review').length,
        inReview: cases.filter(c => c.status === 'in_review').length,
        reportReady: cases.filter(c => c.status === 'report_ready').length
    }

    return (
        <div className="all-cases-container">
            {/* Page Header */}
            <header className="page-header">
                <div>
                    <h1 className="page-title">
                        <FontAwesomeIcon icon={faClipboardList} className="title-icon" />
                        All Cases
                    </h1>
                    <p className="page-subtitle">
                        Complete pathology case history and records
                    </p>
                </div>
                <button 
                    onClick={fetchAllCases} 
                    className="btn-refresh" 
                    disabled={loading}
                >
                    {loading ? 'Refreshing...' : 'Refresh'}
                </button>
            </header>

            {/* Stats Overview */}
            <div className="stats-overview">
                <div className="stat-item">
                    <span className="stat-number">{stats.total}</span>
                    <span className="stat-label">Total Cases</span>
                </div>
                <div className="stat-item yellow">
                    <span className="stat-number">{stats.sampleReceived}</span>
                    <span className="stat-label">Sample Received</span>
                </div>
                <div className="stat-item blue">
                    <span className="stat-number">{stats.awaitingReview}</span>
                    <span className="stat-label">Awaiting Review</span>
                </div>
                <div className="stat-item purple">
                    <span className="stat-number">{stats.inReview}</span>
                    <span className="stat-label">In Review</span>
                </div>
                <div className="stat-item green">
                    <span className="stat-number">{stats.reportReady}</span>
                    <span className="stat-label">Report Ready</span>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="filters-section">
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

                <div className="filter-controls">
                    <div className="filter-group">
                        <FontAwesomeIcon icon={faFilter} />
                        <select 
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="filter-select"
                        >
                            <option value="all">All Status</option>
                            <option value="sample_received">Sample Received</option>
                            <option value="awaiting_review">Awaiting Review</option>
                            <option value="in_review">In Review</option>
                            <option value="report_ready">Report Ready</option>
                        </select>
                    </div>

                    <select 
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="sort-select"
                    >
                        <option value="date">Sort by Date</option>
                        <option value="patient">Sort by Patient</option>
                        <option value="status">Sort by Status</option>
                    </select>
                </div>
            </div>

            {/* Cases List */}
            {loading ? (
                <div className="loading-state">Loading cases...</div>
            ) : filteredCases.length === 0 ? (
                <div className="empty-state">
                    <FontAwesomeIcon icon={faClipboardList} className="empty-icon" />
                    {searchTerm || statusFilter !== 'all' ? (
                        <>
                            <h3>No Results Found</h3>
                            <p>Try adjusting your filters or search term</p>
                        </>
                    ) : (
                        <>
                            <h3>No Cases Yet</h3>
                            <p>Cases will appear here once they are accessioned</p>
                        </>
                    )}
                </div>
            ) : (
                <div className="cases-table-wrapper">
                    <table className="cases-table">
                        <thead>
                            <tr>
                                <th>Accession Number</th>
                                <th>Patient</th>
                                <th>Body Part</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCases.map(caseItem => (
                                <tr key={caseItem.id}>
                                    <td className="accession-cell">
                                        <div className="accession-wrapper">
                                            <FontAwesomeIcon icon={faMicroscope} className="case-icon" />
                                            <span>{caseItem.accession_number}</span>
                                        </div>
                                    </td>
                                    <td>{caseItem.patient_name || 'Unknown'}</td>
                                    <td>{caseItem.body_part_examined || '—'}</td>
                                    <td className="date-cell">{formatDate(caseItem.uploaded_at)}</td>
                                    <td>
                                        <span className={`status-badge ${getStatusColor(caseItem.status)}`}>
                                            {caseItem.status?.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="actions-cell">
                                        {caseItem.status === 'sample_received' ? (
                                            <span className="action-text">Awaiting Upload</span>
                                        ) : caseItem.is_finalized ? (
                                            <div className="action-buttons">
                                                <button
                                                    onClick={() => navigate(`/pathology/report/${caseItem.id}`)}
                                                    className="btn-action view"
                                                >
                                                    <FontAwesomeIcon icon={faFilePdf} />
                                                    View Report
                                                </button>
                                                {caseItem.report_pdf && (
                                                    <a
                                                        href={`http://127.0.0.1:8000${caseItem.report_pdf}`}
                                                        download
                                                        className="btn-action download"
                                                    >
                                                        <FontAwesomeIcon icon={faDownload} />
                                                    </a>
                                                )}
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleViewCase(caseItem)}
                                                className="btn-action open"
                                            >
                                                <FontAwesomeIcon icon={faEye} />
                                                Open Viewer
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}