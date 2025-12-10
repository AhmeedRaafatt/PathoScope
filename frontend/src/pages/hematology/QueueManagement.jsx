// QueueManagement.jsx
import { useState, useEffect } from 'react';
import { useOutletContext, Form, useActionData, useNavigation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faFlask, 
    faCheckCircle, 
    faClock,
    faPlay,
    faStop
} from '@fortawesome/free-solid-svg-icons';
import '../../styles/hematology/Queue.css';

// Action to complete processing
export async function action({ request }) {
    const token = localStorage.getItem('token');
    const formData = await request.formData();
    const sampleId = formData.get('sampleId');
    const accessionNumber = formData.get('accessionNumber');

    try {
        const response = await fetch(
            `http://127.0.0.1:8000/api/hematology/samples/${sampleId}/complete/`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            return {
                success: false,
                error: data.error || 'Failed to complete processing',
                sampleId
            };
        }

        return {
            success: true,
            message: `Processing completed for sample ${accessionNumber}`,
            sampleId
        };
    } catch (error) {
        console.error('Complete processing error:', error);
        return {
            success: false,
            error: 'Network error. Please try again.',
            sampleId
        };
    }
}

export default function QueueManagement() {
    const context = useOutletContext();
    const actionData = useActionData();
    const navigation = useNavigation();
    
    const queue = context?.queue || [];
    const isRefreshing = context?.isRefreshing || false;
    const isSubmitting = navigation.state === 'submitting';
    const submittingFormData = navigation.formData;

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const calculateDuration = (startDate, endDate) => {
        if (!startDate) return 'N/A';
        const start = new Date(startDate);
        const end = endDate ? new Date(endDate) : new Date();
        const diffMs = end - start;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 60) {
            return `${diffMins} min${diffMins !== 1 ? 's' : ''}`;
        }
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        return `${hours}h ${mins}m`;
    };

    // Separate processing and waiting queues
    const processingQueue = queue.filter(q => q.status === 'processing');
    const waitingQueue = queue.filter(q => q.status === 'waiting');

    return (
        <div className="queue-container">
            <header className="page-header">
                <div>
                    <h1 className="page-title">
                        <FontAwesomeIcon icon={faFlask} className="title-icon" />
                        Instrument Queue
                    </h1>
                    <p className="page-subtitle">Monitor and manage sample processing</p>
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
                <div className="alert alert-success">
                    <FontAwesomeIcon icon={faCheckCircle} />
                    <span>✓ {actionData.message}</span>
                </div>
            )}

            {actionData?.error && (
                <div className="alert alert-error">
                    <span>✗</span>
                    <span>{actionData.error}</span>
                </div>
            )}

            {/* Queue Stats */}
            <div className="queue-stats">
                <div className="stat-card processing">
                    <div className="stat-icon">
                        <FontAwesomeIcon icon={faPlay} />
                    </div>
                    <div className="stat-content">
                        <h3>{processingQueue.length}</h3>
                        <p>Currently Processing</p>
                    </div>
                </div>
                <div className="stat-card waiting">
                    <div className="stat-icon">
                        <FontAwesomeIcon icon={faClock} />
                    </div>
                    <div className="stat-content">
                        <h3>{waitingQueue.length}</h3>
                        <p>Waiting in Queue</p>
                    </div>
                </div>
                <div className="stat-card total">
                    <div className="stat-icon">
                        <FontAwesomeIcon icon={faFlask} />
                    </div>
                    <div className="stat-content">
                        <h3>{queue.length}</h3>
                        <p>Total in Queue</p>
                    </div>
                </div>
            </div>

            {/* Processing Section */}
            <section className="queue-section">
                <div className="section-header">
                    <h2>
                        <FontAwesomeIcon icon={faPlay} className="section-icon" />
                        Currently Processing
                    </h2>
                    {processingQueue.length > 0 && (
                        <span className="count-badge processing">{processingQueue.length}</span>
                    )}
                </div>

                {processingQueue.length === 0 ? (
                    <div className="empty-state">
                        <FontAwesomeIcon icon={faFlask} className="empty-icon" />
                        <p>No samples currently processing</p>
                    </div>
                ) : (
                    <div className="queue-list">
                        {processingQueue.map(item => {
                            const sample = item.sample_info;
                            const isThisSubmitting = isSubmitting && 
                                submittingFormData?.get('sampleId') === sample.id.toString();

                            return (
                                <div key={item.id} className="queue-item processing">
                                    <div className="queue-item-header">
                                        <div className="sample-icon-wrapper processing">
                                            <FontAwesomeIcon icon={faFlask} />
                                        </div>
                                        <div className="sample-info">
                                            <h3>{sample.accession_number}</h3>
                                            <p>{sample.patient_name} • {sample.test_name}</p>
                                        </div>
                                        <span className="status-badge processing">
                                            <FontAwesomeIcon icon={faPlay} />
                                            Processing
                                        </span>
                                    </div>

                                    <div className="queue-item-body">
                                        <div className="info-grid">
                                            <div className="info-item">
                                                <span className="info-label">Started</span>
                                                <span className="info-value">{formatDate(item.started_date)}</span>
                                            </div>
                                            <div className="info-item">
                                                <span className="info-label">Duration</span>
                                                <span className="info-value">{calculateDuration(item.started_date)}</span>
                                            </div>
                                            <div className="info-item">
                                                <span className="info-label">Barcode</span>
                                                <span className="info-value barcode">{sample.barcode}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="queue-item-footer">
                                        <Form method="post" replace>
                                            <input type="hidden" name="sampleId" value={sample.id} />
                                            <input type="hidden" name="accessionNumber" value={sample.accession_number} />
                                            <button 
                                                type="submit"
                                                className="btn-action complete"
                                                disabled={isThisSubmitting}
                                            >
                                                <FontAwesomeIcon icon={faCheckCircle} />
                                                {isThisSubmitting ? 'Completing...' : 'Complete Processing'}
                                            </button>
                                        </Form>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* Waiting Queue Section */}
            <section className="queue-section">
                <div className="section-header">
                    <h2>
                        <FontAwesomeIcon icon={faClock} className="section-icon" />
                        Waiting Queue
                    </h2>
                    {waitingQueue.length > 0 && (
                        <span className="count-badge waiting">{waitingQueue.length}</span>
                    )}
                </div>

                {waitingQueue.length === 0 ? (
                    <div className="empty-state">
                        <FontAwesomeIcon icon={faClock} className="empty-icon" />
                        <p>No samples waiting</p>
                    </div>
                ) : (
                    <div className="queue-list">
                        {waitingQueue.map((item, index) => {
                            const sample = item.sample_info;

                            return (
                                <div key={item.id} className="queue-item waiting">
                                    <div className="queue-position">#{index + 1}</div>
                                    <div className="queue-item-header">
                                        <div className="sample-icon-wrapper waiting">
                                            <FontAwesomeIcon icon={faClock} />
                                        </div>
                                        <div className="sample-info">
                                            <h3>{sample.accession_number}</h3>
                                            <p>{sample.patient_name} • {sample.test_name}</p>
                                        </div>
                                        <span className="status-badge waiting">
                                            <FontAwesomeIcon icon={faClock} />
                                            Waiting
                                        </span>
                                    </div>

                                    <div className="queue-item-body">
                                        <div className="info-grid">
                                            <div className="info-item">
                                                <span className="info-label">Added to Queue</span>
                                                <span className="info-value">{formatDate(item.added_date)}</span>
                                            </div>
                                            <div className="info-item">
                                                <span className="info-label">Wait Time</span>
                                                <span className="info-value">{calculateDuration(item.added_date)}</span>
                                            </div>
                                            <div className="info-item">
                                                <span className="info-label">Barcode</span>
                                                <span className="info-value barcode">{sample.barcode}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="queue-item-footer">
                                        <div style={{
                                            padding: '12px',
                                            background: '#fef3c7',
                                            borderRadius: '8px',
                                            textAlign: 'center',
                                            color: '#92400e',
                                            fontSize: '14px',
                                            fontWeight: 500
                                        }}>
                                            <FontAwesomeIcon icon={faClock} style={{ marginRight: '8px' }} />
                                            Will start when instrument is available
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}