import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faTimes, 
    faSave, 
    faExclamationTriangle,
    faFlask 
} from '@fortawesome/free-solid-svg-icons';
import '../../styles/hematology/ResultsModal.css';
import { getToken } from '../../utls';

export default function ResultsEntryModal({ sample, onClose, onSuccess }) {
    const [analytes, setAnalytes] = useState([]);
    const [results, setResults] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [existingLoaded, setExistingLoaded] = useState(false);

    useEffect(() => {
        if (sample) {
            fetchAnalytes();
        }
    }, [sample]);

    const fetchAnalytes = async () => {
        try {
            const token = getToken();
            if (!token) throw new Error('Authentication token missing');
            const url = `http://127.0.0.1:8000/api/hematology/analytes/?test_name=${encodeURIComponent(sample.test_name)}`;
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to fetch analytes');
            }

            const data = await response.json();
            setAnalytes(data);

            // Initialize results object
            const initialResults = {};
            data.forEach(analyte => {
                initialResults[analyte.id] = '';
            });
            setResults(initialResults);

            // Try to fetch any existing results for this sample and prefill
            try {
                const resultsUrl = `http://127.0.0.1:8000/api/hematology/samples/${sample.id}/results/`;
                const resResp = await fetch(resultsUrl, {
                    headers: {
                        'Authorization': `Token ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (resResp.ok) {
                    const existing = await resResp.json();
                    if (Array.isArray(existing) && existing.length > 0) {
                        // map existing results to our results object by analyte id
                        const merged = { ...initialResults };
                        existing.forEach(r => {
                            if (r.analyte) merged[r.analyte] = String(r.value ?? r.value === 0 ? r.value : '');
                        });
                        setResults(merged);
                        setExistingLoaded(true);
                    }
                }
            } catch (err) {
                // Non-fatal: if fetching existing results fails, we still allow entering new ones
                console.warn('Could not load existing sample results:', err);
            }

            setLoading(false);
        } catch (err) {
            console.error('Error fetching analytes:', err);
            setError(err.message || 'Failed to load test parameters');
            setLoading(false);
        }
    };

    const handleResultChange = (analyteId, value) => {
        setResults(prev => ({
            ...prev,
            [analyteId]: value
        }));
    };

    const checkIfAbnormal = (analyteId, value) => {
        const analyte = analytes.find(a => a.id === analyteId);
        if (!analyte || !value) return null;

        const numValue = parseFloat(value);
        const low = parseFloat(analyte.normal_range_low);
        const high = parseFloat(analyte.normal_range_high);

        if (isNaN(numValue)) return null;
        if (numValue < low) return 'LOW';
        if (numValue > high) return 'HIGH';
        return 'NORMAL';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            // Validate all fields are filled
            const allFilled = Object.values(results).every(val => val !== '');
            if (!allFilled) {
                setError('Please fill in all result fields');
                setSubmitting(false);
                return;
            }

            // Format results for API
            const formattedResults = Object.entries(results).map(([analyteId, value]) => ({
                analyte_id: parseInt(analyteId),
                value: parseFloat(value)
            }));

            const token = getToken();
            if (!token) throw new Error('Authentication token missing');

            const response = await fetch(
                `http://127.0.0.1:8000/api/hematology/samples/${sample.id}/results/enter/`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Token ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ results: formattedResults })
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to submit results');
            }

            // Success!
            if (onSuccess) {
                await onSuccess();
            }
        } catch (err) {
            console.error('Error submitting results:', err);
            setError(err.message || 'Failed to submit results');
            setSubmitting(false);
        }
    };

    if (!sample) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container results-modal" onClick={(e) => e.stopPropagation()}>
                {/* Modal Header */}
                <div className="modal-header">
                    <div>
                        <h2 className="modal-title">
                            <FontAwesomeIcon icon={faFlask} />
                            Enter Results
                        </h2>
                        <p className="modal-subtitle">
                            {sample.accession_number} • {sample.patient_name}
                        </p>
                    </div>
                    <button 
                        className="modal-close-btn"
                        onClick={onClose}
                        disabled={submitting}
                    >
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="modal-body">
                    {loading ? (
                        <div className="modal-loading">
                            <p>Loading test parameters...</p>
                        </div>
                    ) : error ? (
                        <div className="modal-error">
                            <p>{error}</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="results-form">
                            <div className="sample-info-bar">
                                <div className="info-item">
                                    <span className="label">Test:</span>
                                    <span className="value">{sample.test_name}</span>
                                </div>
                                <div className="info-item">
                                    <span className="label">Barcode:</span>
                                    <span className="value barcode">{sample.barcode}</span>
                                </div>
                            </div>

                            {existingLoaded && (
                                <div className="existing-results-notice" style={{marginTop:12, marginBottom:12, padding:'10px 12px', background:'#fffbeb', border:'1px solid #fef3c7', borderRadius:8}}>
                                    <FontAwesomeIcon icon={faExclamationTriangle} style={{marginRight:8}} />
                                    Existing results were loaded for this sample — submitting will overwrite them.
                                </div>
                            )}

                            <div className="results-inputs">
                                {analytes.map(analyte => {
                                    const value = results[analyte.id];
                                    const flag = value ? checkIfAbnormal(analyte.id, value) : null;

                                    return (
                                        <div 
                                            key={analyte.id}
                                            className={`result-input-row ${flag && flag !== 'NORMAL' ? 'flagged' : ''}`}
                                        >
                                            <div className="input-label-section">
                                                <label htmlFor={`analyte-${analyte.id}`}>
                                                    {analyte.analyte_name}
                                                </label>
                                                <span className="reference-range">
                                                    {analyte.normal_range_low} - {analyte.normal_range_high} {analyte.unit}
                                                </span>
                                            </div>

                                            <div className="input-control-section">
                                                <div className="input-wrapper">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        id={`analyte-${analyte.id}`}
                                                        value={value}
                                                        onChange={(e) => handleResultChange(analyte.id, e.target.value)}
                                                        placeholder="0.00"
                                                        required
                                                        disabled={submitting}
                                                        className="result-input"
                                                    />
                                                    <span className="input-unit">{analyte.unit}</span>
                                                </div>

                                                {flag && (
                                                    <span className={`flag-indicator ${flag.toLowerCase()}`}>
                                                        {flag !== 'NORMAL' && (
                                                            <FontAwesomeIcon icon={faExclamationTriangle} />
                                                        )}
                                                        {flag}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Form Actions */}
                            <div className="modal-actions">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={submitting}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="btn-primary"
                                >
                                    <FontAwesomeIcon icon={faSave} />
                                    {submitting ? 'Submitting...' : 'Submit Results'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
