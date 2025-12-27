import { useOutletContext } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCalendarCheck, faFlask, faCheckCircle, faClipboardList } from '@fortawesome/free-solid-svg-icons'
import '../../styles/hematology/Dashboard.css'

export default function HematologyDashboard() {
    const context = useOutletContext()
    
    // Safely extract data with defaults
    const scheduledPatients = Array.isArray(context?.scheduledPatients) ? context.scheduledPatients : []
    const samples = Array.isArray(context?.samples) ? context.samples : []
    const queue = Array.isArray(context?.queue) ? context.queue : []

    const [displayedText, setDisplayedText] = useState('')
    const [displayedSubtext, setDisplayedSubtext] = useState('')
    const fullText = `Welcome to Hematology Lab 🔬`
    const fullSubtext = "Your workflow dashboard"

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
    const samplesReceived = samples.filter(s => s.status === 'received').length
    const samplesInAnalysis = samples.filter(s => s.status === 'in_analysis').length
    const samplesAwaitingValidation = samples.filter(s => s.status === 'awaiting_validation').length
    const queueProcessing = queue.filter(q => q.status === 'processing').length
    const queueWaiting = queue.filter(q => q.status === 'waiting').length

    return (
        <div className="hematology-dashboard">
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
                    <div className="stat-icon received">
                        <FontAwesomeIcon icon={faClipboardList} />
                    </div>
                    <div className="stat-content">
                        <h3 className="stat-number">{samplesReceived}</h3>
                        <p className="stat-label">Samples Received</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon analysis">
                        <FontAwesomeIcon icon={faFlask} />
                    </div>
                    <div className="stat-content">
                        <h3 className="stat-number">{samplesInAnalysis}</h3>
                        <p className="stat-label">In Analysis</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon validation">
                        <FontAwesomeIcon icon={faCheckCircle} />
                    </div>
                    <div className="stat-content">
                        <h3 className="stat-number">{samplesAwaitingValidation}</h3>
                        <p className="stat-label">Awaiting Validation</p>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
                <h2 className="section-title">Quick Actions</h2>
                <div className="actions-grid">
                    <a href="/hematology/scheduled" className="action-card">
                        <FontAwesomeIcon icon={faCalendarCheck} className="action-icon" />
                        <h3>View Scheduled Patients</h3>
                        <p>Check today's appointments and accession patients</p>
                    </a>

                    <a href="/hematology/accession" className="action-card">
                        <FontAwesomeIcon icon={faClipboardList} className="action-icon" />
                        <h3>Accession Sample</h3>
                        <p>Check in new patient samples</p>
                    </a>

                    <a href="/hematology/queue" className="action-card">
                        <FontAwesomeIcon icon={faFlask} className="action-icon" />
                        <h3>Manage Queue</h3>
                        <p>{queueProcessing} processing, {queueWaiting} waiting</p>
                    </a>

                    <a href="/hematology/validation" className="action-card">
                        <FontAwesomeIcon icon={faCheckCircle} className="action-icon" />
                        <h3>Validate Results</h3>
                        <p>Review and approve test results</p>
                    </a>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="recent-activity">
                <h2 className="section-title">Recent Samples</h2>
                {samples.length === 0 ? (
                    <div className="empty-state">
                        <p>No samples to display</p>
                    </div>
                ) : (
                    <div className="samples-list">
                        {samples.slice(0, 5).map(sample => (
                            <div key={sample.id} className="sample-item">
                                <div className="sample-info">
                                    <h4>{sample.accession_number}</h4>
                                    <p>{sample.patient_name} • {sample.test_name}</p>
                                </div>
                                <span className={`status-badge ${sample.status}`}>
                                    {sample.status.replace('_', ' ')}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}