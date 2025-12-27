import { useOutletContext } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
    faCalendarCheck, 
    faMicroscope, 
    faCheckCircle, 
    faClipboardList,
    faUpload,
    faFlask
} from '@fortawesome/free-solid-svg-icons'
import '../../styles/pathology/Dashboard.css'

export default function PathologyDashboard() {
    const context = useOutletContext()
    
    // Safely extract data with defaults
    const scheduledPatients = Array.isArray(context?.scheduledPatients) ? context.scheduledPatients : []
    const queue = Array.isArray(context?.queue) ? context.queue : []

    const [displayedText, setDisplayedText] = useState('')
    const [displayedSubtext, setDisplayedSubtext] = useState('')
    const fullText = `Welcome to Pathology Lab 🔬`
    const fullSubtext = "Digital Microscopy & Diagnostics"

    // Typewriter effect for main text
    useEffect(() => {
        let index = 0
        const timer = setInterval(() => {
            if (index <= fullText.length) {
                setDisplayedText(fullText.slice(0, index))
                index++
            } else {
                clearInterval(timer)
            }
        }, 60)
        return () => clearInterval(timer)
    }, [fullText])

    // Typewriter effect for subtext
    useEffect(() => {
        const delay = fullText.length * 60 + 300
        const timeoutId = setTimeout(() => {
            let index = 0
            const timer = setInterval(() => {
                if (index <= fullSubtext.length) {
                    setDisplayedSubtext(fullSubtext.slice(0, index))
                    index++
                } else {
                    clearInterval(timer)
                }
            }, 50)
            return () => clearInterval(timer)
        }, delay)
        return () => clearTimeout(timeoutId)
    }, [fullText, fullSubtext])

    // Calculate statistics
    const todayScheduled = scheduledPatients.length
    const awaitingReview = queue.filter(c => c.status === 'awaiting_review').length
    const inReview = queue.filter(c => c.status === 'in_review').length
    const totalQueue = queue.length

    return (
        <div className="pathology-dashboard">
            {/* Header with Typewriter */}
            <header className="dashboard-header">
                <h1>{displayedText}</h1>
                <p>{displayedSubtext}</p>
            </header>

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon scheduled">
                        <FontAwesomeIcon icon={faCalendarCheck} />
                    </div>
                    <div className="stat-content">
                        <h3 className="stat-number">{todayScheduled}</h3>
                        <p className="stat-label">Scheduled Today</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon awaiting">
                        <FontAwesomeIcon icon={faUpload} />
                    </div>
                    <div className="stat-content">
                        <h3 className="stat-number">{awaitingReview}</h3>
                        <p className="stat-label">Awaiting Review</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon review">
                        <FontAwesomeIcon icon={faMicroscope} />
                    </div>
                    <div className="stat-content">
                        <h3 className="stat-number">{inReview}</h3>
                        <p className="stat-label">In Review</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon total">
                        <FontAwesomeIcon icon={faFlask} />
                    </div>
                    <div className="stat-content">
                        <h3 className="stat-number">{totalQueue}</h3>
                        <p className="stat-label">Total Queue</p>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
                <h2 className="section-title">Quick Actions</h2>
                <div className="actions-grid">
                    <a href="/pathology/scheduled" className="action-card">
                        <FontAwesomeIcon icon={faCalendarCheck} className="action-icon" />
                        <h3>View Scheduled Biopsies</h3>
                        <p>Check today's appointments and check-in patients</p>
                    </a>

                    <a href="/pathology/upload" className="action-card">
                        <FontAwesomeIcon icon={faUpload} className="action-icon" />
                        <h3>Upload Slides</h3>
                        <p>Upload DICOM files for pending cases</p>
                    </a>

                    <a href="/pathology/queue" className="action-card">
                        <FontAwesomeIcon icon={faMicroscope} className="action-icon" />
                        <h3>Review Queue</h3>
                        <p>{awaitingReview} cases awaiting review</p>
                    </a>

                    <a href="/pathology/cases" className="action-card">
                        <FontAwesomeIcon icon={faClipboardList} className="action-icon" />
                        <h3>All Cases</h3>
                        <p>View complete case history</p>
                    </a>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="recent-activity">
                <h2 className="section-title">Recent Cases in Queue</h2>
                {queue.length === 0 ? (
                    <div className="empty-state">
                        <p>No cases in queue</p>
                    </div>
                ) : (
                    <div className="cases-list">
                        {queue.slice(0, 5).map(caseItem => (
                            <div key={caseItem.id} className="case-item">
                                <div className="case-info">
                                    <h4>{caseItem.accession_number}</h4>
                                    <p>{caseItem.patient_name} • {caseItem.body_part_examined || 'Biopsy'}</p>
                                </div>
                                <span className={`status-badge ${caseItem.status}`}>
                                    {caseItem.status.replace('_', ' ')}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}