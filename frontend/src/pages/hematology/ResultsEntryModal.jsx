// ResultsEntryModal.jsx - Receives analytes as props (pre-fetched)
import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faTimes, 
    faSave, 
    faExclamationTriangle,
    faFlask,
    faSpinner
} from '@fortawesome/free-solid-svg-icons';
import { getToken } from '../../utls';

export default function ResultsEntryModal({ sample, analytes, onClose, onSuccess }) {
    const [results, setResults] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // Initialize results when analytes are provided
    useEffect(() => {
        if (analytes && Array.isArray(analytes)) {
            const initialResults = {};
            analytes.forEach(analyte => {
                initialResults[analyte.id] = '';
            });
            setResults(initialResults);
        }
    }, [analytes]);

    const handleChange = (analyteId, value) => {
        setResults(prev => ({
            ...prev,
            [analyteId]: value
        }));
    };

    const getFlag = (analyteId, value) => {
        if (!value) return null;
        const analyte = analytes.find(a => a.id === analyteId);
        if (!analyte) return null;

        const num = parseFloat(value);
        const low = parseFloat(analyte.normal_range_low);
        const high = parseFloat(analyte.normal_range_high);

        if (isNaN(num)) return null;
        if (num < low) return 'LOW';
        if (num > high) return 'HIGH';
        return 'NORMAL';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        setSubmitting(true);
        setError(null);

        try {
            // Check all fields are filled
            const emptyFields = Object.entries(results).filter(([_, v]) => v === '' || v === null);
            if (emptyFields.length > 0) {
                throw new Error('Please fill in all fields');
            }

            const token = getToken();
            const formattedResults = Object.entries(results)
                .map(([analyteId, value]) => ({
                    analyte_id: parseInt(analyteId),
                    value: parseFloat(value)
                }));

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

            if (onSuccess) onSuccess();

        } catch (err) {
            setError(err.message);
            setSubmitting(false);
        }
    };

    if (!sample || !analytes) return null;

    return (
        <div 
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: '20px'
            }}
            onClick={onClose}
        >
            <div 
                style={{
                    background: 'white',
                    borderRadius: '16px',
                    maxWidth: '800px',
                    width: '100%',
                    maxHeight: '90vh',
                    overflow: 'auto',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{
                    padding: '24px',
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div>
                        <h2 style={{
                            margin: 0,
                            fontSize: '20px',
                            fontWeight: 600,
                            color: '#122056',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                        }}>
                            <FontAwesomeIcon icon={faFlask} style={{color: '#5B65DC'}} />
                            Enter Results
                        </h2>
                        <p style={{margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280'}}>
                            {sample.accession_number} • {sample.patient_name}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={submitting}
                        style={{
                            width: '36px',
                            height: '36px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            background: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#6b7280'
                        }}
                    >
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>

                {/* Body */}
                <div style={{padding: '24px'}}>
                    <form onSubmit={handleSubmit}>
                        {/* Info Bar */}
                        <div style={{
                            display: 'flex',
                            gap: '24px',
                            padding: '16px 20px',
                            background: '#f9fafb',
                            borderRadius: '8px',
                            marginBottom: '24px',
                            border: '1px solid #e5e7eb'
                        }}>
                            <div>
                                <span style={{fontSize: '13px', color: '#6b7280'}}>Test: </span>
                                <span style={{fontSize: '14px', color: '#122056', fontWeight: 600}}>
                                    {sample.test_name}
                                </span>
                            </div>
                            <div>
                                <span style={{fontSize: '13px', color: '#6b7280'}}>Barcode: </span>
                                <span style={{fontSize: '14px', color: '#122056', fontWeight: 600, fontFamily: 'monospace'}}>
                                    {sample.barcode}
                                </span>
                            </div>
                        </div>

                        {error && (
                            <div style={{
                                padding: '12px 16px',
                                background: '#fee2e2',
                                border: '1px solid #fecaca',
                                borderRadius: '8px',
                                color: '#991b1b',
                                marginBottom: '16px',
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <FontAwesomeIcon icon={faExclamationTriangle} />
                                {error}
                            </div>
                        )}

                        {/* Input Fields */}
                        <div style={{display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px'}}>
                            {analytes.map(analyte => {
                                const value = results[analyte.id] || '';
                                const flag = getFlag(analyte.id, value);

                                return (
                                    <div
                                        key={analyte.id}
                                        style={{
                                            padding: '16px',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '8px',
                                            background: flag && flag !== 'NORMAL' ? '#fef3c7' : 'white'
                                        }}
                                    >
                                        <div style={{marginBottom: '8px'}}>
                                            <label
                                                htmlFor={`input-${analyte.id}`}
                                                style={{
                                                    display: 'block',
                                                    fontSize: '14px',
                                                    fontWeight: 600,
                                                    color: '#122056',
                                                    marginBottom: '4px'
                                                }}
                                            >
                                                {analyte.analyte_name}
                                            </label>
                                            <span style={{fontSize: '12px', color: '#6b7280'}}>
                                                Reference: {analyte.normal_range_low} - {analyte.normal_range_high} {analyte.unit}
                                            </span>
                                        </div>
                                        
                                        <div style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
                                            <div style={{flex: 1, position: 'relative'}}>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    id={`input-${analyte.id}`}
                                                    value={value}
                                                    onChange={e => handleChange(analyte.id, e.target.value)}
                                                    placeholder="Enter value"
                                                    required
                                                    disabled={submitting}
                                                    style={{
                                                        width: '100%',
                                                        padding: '10px 60px 10px 12px',
                                                        border: '1px solid #e5e7eb',
                                                        borderRadius: '6px',
                                                        fontSize: '14px',
                                                        fontFamily: 'monospace',
                                                        fontWeight: 600
                                                    }}
                                                />
                                                <span style={{
                                                    position: 'absolute',
                                                    right: '12px',
                                                    top: '50%',
                                                    transform: 'translateY(-50%)',
                                                    fontSize: '12px',
                                                    color: '#6b7280',
                                                    pointerEvents: 'none'
                                                }}>
                                                    {analyte.unit}
                                                </span>
                                            </div>

                                            {flag && (
                                                <span style={{
                                                    padding: '6px 12px',
                                                    borderRadius: '6px',
                                                    fontSize: '11px',
                                                    fontWeight: 700,
                                                    background: flag === 'NORMAL' ? '#d1fae5' : flag === 'HIGH' ? '#fee2e2' : '#fef3c7',
                                                    color: flag === 'NORMAL' ? '#065f46' : flag === 'HIGH' ? '#991b1b' : '#92400e'
                                                }}>
                                                    {flag}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Actions */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '12px',
                            paddingTop: '20px',
                            borderTop: '1px solid #e5e7eb'
                        }}>
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={submitting}
                                style={{
                                    padding: '12px 24px',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    background: 'white',
                                    color: '#6b7280',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                style={{
                                    padding: '12px 24px',
                                    border: 'none',
                                    borderRadius: '8px',
                                    background: submitting ? '#cbd5e0' : '#5B65DC',
                                    color: 'white',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                <FontAwesomeIcon icon={submitting ? faSpinner : faSave} spin={submitting} />
                                {submitting ? 'Submitting...' : 'Submit Results'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}