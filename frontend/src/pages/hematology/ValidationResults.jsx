// ValidationResults.jsx - FIXED VERSION
import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faCheckCircle, 
    faExclamationTriangle,
    faFlask,
    faTimes,
    faDownload,
    faSpinner
} from '@fortawesome/free-solid-svg-icons';
import '../../styles/hematology/Validation.css';

export default function ValidationResults() {
    const context = useOutletContext();
    const navigate = useNavigate();
    
    const [samples, setSamples] = useState([]);
    const [selectedSample, setSelectedSample] = useState(null);
    const [sampleResults, setSampleResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [validating, setValidating] = useState(false);
    const [generatingPDF, setGeneratingPDF] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        // Get samples awaiting validation from context
        const awaitingValidation = (context?.samples || []).filter(
            s => s.status === 'awaiting_validation'
        );
        setSamples(awaitingValidation);
    }, [context]);

    const fetchSampleResults = async (sampleId) => {
        setLoading(true);
        setError(null);
        setSampleResults([]); // Clear previous results
        
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Authentication required');
            }

            const response = await fetch(
                `http://127.0.0.1:8000/api/hematology/samples/${sampleId}/results/`,
                {
                    headers: {
                        'Authorization': `Token ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to fetch results');
            }
            
            const data = await response.json();
            console.log('Fetched results:', data); // Debug log
            
            // Handle empty results more gracefully
            if (!Array.isArray(data)) {
                throw new Error('Invalid response format from server');
            }
            
            if (data.length === 0) {
                // Set sample as selected but show informative message
                setSelectedSample(samples.find(s => s.id === sampleId));
                setSampleResults([]);
                setError('No results have been entered for this sample yet. Please enter results first in the "Enter Results" step.');
                return;
            }
            
            setSampleResults(data);
            setSelectedSample(samples.find(s => s.id === sampleId));
        } catch (err) {
            console.error('Error fetching results:', err);
            setError(err.message || 'Failed to load sample results');
            setSampleResults([]);
            setSelectedSample(null);
        } finally {
            setLoading(false);
        }
    };

    const handleValidate = async () => {
        if (!selectedSample) return;
        
        setValidating(true);
        setError(null);
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(
                `http://127.0.0.1:8000/api/hematology/samples/${selectedSample.id}/validate/`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Token ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to validate results');
            }

            setSuccess(`Results for ${selectedSample.accession_number} validated successfully!`);
            
            // Refresh parent data
            if (context?.refreshData) {
                await context.refreshData();
            }

            // Clear selection after short delay
            setTimeout(() => {
                setSelectedSample(null);
                setSampleResults([]);
                setSuccess(null);
            }, 2000);

        } catch (err) {
            console.error('Error validating results:', err);
            setError(err.message);
        } finally {
            setValidating(false);
        }
    };

    const generatePDFReport = async () => {
        if (!selectedSample || sampleResults.length === 0) return;
        
        setGeneratingPDF(true);
        
        try {
            // Create PDF content
            const pdfContent = generateReportHTML();
            
            // Create a new window for printing
            const printWindow = window.open('', '_blank');
            printWindow.document.write(pdfContent);
            printWindow.document.close();
            
            // Wait for content to load then print
            setTimeout(() => {
                printWindow.print();
            }, 250);
            
        } catch (err) {
            console.error('Error generating PDF:', err);
            setError('Failed to generate PDF report');
        } finally {
            setGeneratingPDF(false);
        }
    };

    const generateReportHTML = () => {
        const flaggedCount = sampleResults.filter(r => r.is_flagged).length;
        const currentDate = new Date().toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Laboratory Report - ${selectedSample.accession_number}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { 
                        font-family: Arial, sans-serif; 
                        padding: 40px;
                        color: #1a1a1a;
                    }
                    .header {
                        text-align: center;
                        border-bottom: 3px solid #5B65DC;
                        padding-bottom: 20px;
                        margin-bottom: 30px;
                    }
                    .header h1 {
                        color: #5B65DC;
                        font-size: 28px;
                        margin-bottom: 10px;
                    }
                    .header p {
                        color: #666;
                        font-size: 14px;
                    }
                    .info-section {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 15px;
                        margin-bottom: 30px;
                        background: #f9fafb;
                        padding: 20px;
                        border-radius: 8px;
                    }
                    .info-item {
                        display: flex;
                        flex-direction: column;
                        gap: 5px;
                    }
                    .info-label {
                        font-size: 11px;
                        color: #666;
                        text-transform: uppercase;
                        font-weight: 600;
                        letter-spacing: 0.5px;
                    }
                    .info-value {
                        font-size: 14px;
                        color: #1a1a1a;
                        font-weight: 600;
                    }
                    .results-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 30px;
                    }
                    .results-table th {
                        background: #5B65DC;
                        color: white;
                        padding: 12px;
                        text-align: left;
                        font-size: 12px;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    .results-table td {
                        padding: 12px;
                        border-bottom: 1px solid #e5e7eb;
                        font-size: 13px;
                    }
                    .results-table tr:nth-child(even) {
                        background: #f9fafb;
                    }
                    .results-table tr.flagged {
                        background: #fef3c7 !important;
                    }
                    .flag-badge {
                        display: inline-block;
                        padding: 4px 8px;
                        border-radius: 4px;
                        font-size: 11px;
                        font-weight: 700;
                        text-transform: uppercase;
                    }
                    .flag-badge.normal {
                        background: #d1fae5;
                        color: #065f46;
                    }
                    .flag-badge.high {
                        background: #fee2e2;
                        color: #991b1b;
                    }
                    .flag-badge.low {
                        background: #fef3c7;
                        color: #92400e;
                    }
                    .summary {
                        background: #f9fafb;
                        padding: 20px;
                        border-radius: 8px;
                        margin-bottom: 30px;
                    }
                    .summary h3 {
                        color: #122056;
                        margin-bottom: 10px;
                        font-size: 16px;
                    }
                    .summary p {
                        color: #666;
                        line-height: 1.6;
                        font-size: 13px;
                    }
                    .footer {
                        text-align: center;
                        color: #666;
                        font-size: 11px;
                        border-top: 1px solid #e5e7eb;
                        padding-top: 20px;
                        margin-top: 40px;
                    }
                    @media print {
                        body { padding: 20px; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>LABORATORY TEST REPORT</h1>
                    <p>Hematology Department</p>
                </div>

                <div class="info-section">
                    <div class="info-item">
                        <span class="info-label">Accession Number</span>
                        <span class="info-value">${selectedSample.accession_number}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Barcode</span>
                        <span class="info-value">${selectedSample.barcode}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Patient</span>
                        <span class="info-value">${selectedSample.patient_name}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Test Name</span>
                        <span class="info-value">${selectedSample.test_name}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Collection Date</span>
                        <span class="info-value">${formatDate(selectedSample.accessioned_date)}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Report Date</span>
                        <span class="info-value">${currentDate}</span>
                    </div>
                </div>

                ${flaggedCount > 0 ? `
                    <div class="summary" style="background: #fef3c7; border-left: 4px solid #f59e0b;">
                        <h3 style="color: #92400e;">⚠️ Clinical Alert</h3>
                        <p style="color: #92400e;">
                            This report contains ${flaggedCount} abnormal result${flaggedCount !== 1 ? 's' : ''} 
                            that require clinical attention.
                        </p>
                    </div>
                ` : ''}

                <table class="results-table">
                    <thead>
                        <tr>
                            <th>Parameter</th>
                            <th>Result</th>
                            <th>Unit</th>
                            <th>Reference Range</th>
                            <th>Flag</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sampleResults.map(result => `
                            <tr ${result.is_flagged ? 'class="flagged"' : ''}>
                                <td><strong>${result.analyte_name}</strong></td>
                                <td><strong>${result.value}</strong></td>
                                <td>${result.unit}</td>
                                <td>${result.normal_range_low} - ${result.normal_range_high}</td>
                                <td>
                                    <span class="flag-badge ${result.is_flagged ? result.flag_type.toLowerCase() : 'normal'}">
                                        ${result.is_flagged ? result.flag_type : 'NORMAL'}
                                    </span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="summary">
                    <h3>Report Summary</h3>
                    <p>
                        This laboratory report contains the results for ${selectedSample.test_name} 
                        performed on sample ${selectedSample.accession_number}. 
                        ${flaggedCount > 0 
                            ? `Results indicate ${flaggedCount} parameter${flaggedCount !== 1 ? 's' : ''} outside the reference range. Clinical correlation is recommended.`
                            : 'All test parameters are within normal reference ranges.'
                        }
                    </p>
                </div>

                <div class="footer">
                    <p>This is a computer-generated report and does not require a signature.</p>
                    <p>Laboratory Information System | Generated: ${currentDate}</p>
                </div>
            </body>
            </html>
        `;
    };

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

    return (
        <div className="validation-container">
            <header className="page-header">
                <div>
                    <h1 className="page-title">
                        <FontAwesomeIcon icon={faCheckCircle} className="title-icon" />
                        Results Validation
                    </h1>
                    <p className="page-subtitle">Review and approve test results before releasing to patients</p>
                </div>
                {context?.refreshData && (
                    <button 
                        onClick={context.refreshData} 
                        className="btn-refresh"
                        disabled={context.isRefreshing}
                    >
                        {context.isRefreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                )}
            </header>

            {/* Success Alert */}
            {success && (
                <div className="alert alert-success">
                    <FontAwesomeIcon icon={faCheckCircle} />
                    <span>{success}</span>
                </div>
            )}

            {/* Error Alert */}
            {error && (
                <div className="alert alert-error">
                    <FontAwesomeIcon icon={faTimes} />
                    <span>{error}</span>
                </div>
            )}

            <div className="validation-layout">
                {/* Samples List */}
                <div className="samples-sidebar">
                    <h2 className="sidebar-title">Samples Awaiting Validation ({samples.length})</h2>
                    
                    {samples.length === 0 ? (
                        <div className="empty-state">
                            <p>No samples awaiting validation</p>
                        </div>
                    ) : (
                        <div className="samples-list">
                            {samples.map(sample => (
                                <button
                                    key={sample.id}
                                    onClick={() => fetchSampleResults(sample.id)}
                                    className={`sample-item ${selectedSample?.id === sample.id ? 'active' : ''}`}
                                    disabled={loading}
                                >
                                    <div className="sample-icon">
                                        <FontAwesomeIcon icon={faFlask} />
                                    </div>
                                    <div className="sample-details">
                                        <h4>{sample.accession_number}</h4>
                                        <p>{sample.patient_name}</p>
                                        <span className="test-badge">{sample.test_name}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Results Panel */}
                <div className="results-panel">
                    {!selectedSample ? (
                        <div className="empty-results">
                            <FontAwesomeIcon icon={faFlask} size="3x" color="#d1d5db" />
                            <p>Select a sample to view results</p>
                        </div>
                    ) : loading ? (
                        <div className="loading-results">
                            <FontAwesomeIcon icon={faSpinner} spin size="2x" color="#5B65DC" />
                            <p>Loading results...</p>
                        </div>
                    ) : sampleResults.length === 0 ? (
                        <div className="empty-results">
                            <FontAwesomeIcon icon={faExclamationTriangle} size="2x" color="#f59e0b" />
                            <p>No results available for this sample</p>
                            <p style={{fontSize: '14px', color: '#9ca3af', marginTop: '8px'}}>
                                Results may not have been entered yet
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Sample Info */}
                            <div className="results-header">
                                <div className="sample-info-card">
                                    <div className="info-row">
                                        <div className="info-item">
                                            <span className="info-label">Accession Number</span>
                                            <span className="info-value">{selectedSample.accession_number}</span>
                                        </div>
                                        <div className="info-item">
                                            <span className="info-label">Barcode</span>
                                            <span className="info-value barcode">{selectedSample.barcode}</span>
                                        </div>
                                    </div>
                                    <div className="info-row">
                                        <div className="info-item">
                                            <span className="info-label">Patient</span>
                                            <span className="info-value">{selectedSample.patient_name}</span>
                                        </div>
                                        <div className="info-item">
                                            <span className="info-label">Test</span>
                                            <span className="info-value">{selectedSample.test_name}</span>
                                        </div>
                                    </div>
                                    <div className="info-row">
                                        <div className="info-item">
                                            <span className="info-label">Accessioned</span>
                                            <span className="info-value">{formatDate(selectedSample.accessioned_date)}</span>
                                        </div>
                                        <div className="info-item">
                                            <span className="info-label">Completed</span>
                                            <span className="info-value">{formatDate(selectedSample.processing_completed)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Results Table */}
                            <div className="results-table-container">
                                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
                                    <h3 className="table-title">Test Results</h3>
                                    <button
                                        onClick={generatePDFReport}
                                        disabled={generatingPDF}
                                        style={{
                                            padding: '8px 16px',
                                            background: 'white',
                                            color: '#5B65DC',
                                            border: '1px solid #5B65DC',
                                            borderRadius: '6px',
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        <FontAwesomeIcon icon={generatingPDF ? faSpinner : faDownload} spin={generatingPDF} />
                                        {generatingPDF ? 'Generating...' : 'Download Report'}
                                    </button>
                                </div>
                                <table className="results-table">
                                    <thead>
                                        <tr>
                                            <th>Parameter</th>
                                            <th>Value</th>
                                            <th>Unit</th>
                                            <th>Reference Range</th>
                                            <th>Flag</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sampleResults.map(result => (
                                            <tr 
                                                key={result.id}
                                                className={result.is_flagged ? 'flagged' : ''}
                                            >
                                                <td className="param-name">{result.analyte_name}</td>
                                                <td className="param-value">{result.value}</td>
                                                <td className="param-unit">{result.unit}</td>
                                                <td className="param-range">
                                                    {result.normal_range_low} - {result.normal_range_high}
                                                </td>
                                                <td className="param-flag">
                                                    {result.is_flagged ? (
                                                        <span className={`flag-badge ${result.flag_type.toLowerCase()}`}>
                                                            <FontAwesomeIcon icon={faExclamationTriangle} />
                                                            {result.flag_type}
                                                        </span>
                                                    ) : (
                                                        <span className="flag-badge normal">NORMAL</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Validation Actions */}
                            <div className="validation-actions">
                                <div className="flagged-summary">
                                    {sampleResults.some(r => r.is_flagged) && (
                                        <div className="warning-notice">
                                            <FontAwesomeIcon icon={faExclamationTriangle} />
                                            <span>
                                                {sampleResults.filter(r => r.is_flagged).length} parameter(s) flagged as abnormal
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className="action-buttons">
                                    <button
                                        onClick={() => {
                                            setSelectedSample(null);
                                            setSampleResults([]);
                                            setError(null);
                                        }}
                                        className="btn-cancel"
                                        disabled={validating}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleValidate}
                                        className="btn-validate"
                                        disabled={validating}
                                    >
                                        <FontAwesomeIcon icon={validating ? faSpinner : faCheckCircle} spin={validating} />
                                        {validating ? 'Validating...' : 'Validate & Approve'}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}