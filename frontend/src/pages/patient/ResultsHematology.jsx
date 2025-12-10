import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { FileText, Download, AlertCircle, CheckCircle } from 'lucide-react';
import '../../styles/patient/Results.css';

const ResultsHematology = () => {
  const context = useOutletContext();
  const testOrders = Array.isArray(context?.testOrders) ? context.testOrders : [];
  const [selectedTest, setSelectedTest] = useState(null);
  const [sampleResults, setSampleResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [error, setError] = useState(null);
  
  // Helper: normalize status for display
  const isReadyStatus = (status) => {
    if (!status) return false;
    const normalized = String(status).toUpperCase();
    return normalized === 'REPORT_READY' || normalized === 'COMPLETE' || normalized === 'REPORT READY';
  };

  const hematologyTests = testOrders.filter(order => 
    order.test_type === 'hematology' && isReadyStatus(order.status)
  );

  // Map test_order id -> sample
  const hematologySamples = Array.isArray(context?.hematology_samples) ? context.hematology_samples : [];
  const sampleByTestOrder = {};
  hematologySamples.forEach(s => {
    if (s.test_order_id) sampleByTestOrder[s.test_order_id] = s;
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const fetchTestResults = async (testId) => {
    setLoading(true);
    setError(null);
    setSampleResults([]);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const sample = sampleByTestOrder[testId];
      if (!sample) {
        throw new Error('Sample not found for this test');
      }

      const response = await fetch(
        `http://127.0.0.1:8000/api/hematology/samples/${sample.id}/results/`,
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
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format from server');
      }
      
      if (data.length === 0) {
        setError('No results available for this test yet.');
        setSelectedTest(hematologyTests.find(t => t.id === testId));
        return;
      }
      
      setSampleResults(data);
      setSelectedTest(hematologyTests.find(t => t.id === testId));
    } catch (err) {
      console.error('Error fetching results:', err);
      setError(err.message || 'Failed to load test results');
      setSampleResults([]);
      setSelectedTest(null);
    } finally {
      setLoading(false);
    }
  };

  const generatePDFReport = () => {
    if (!selectedTest || sampleResults.length === 0) return;
    
    setGeneratingPDF(true);
    
    try {
      const sample = sampleByTestOrder[selectedTest.id];
      const pdfContent = generateReportHTML(selectedTest, sample, sampleResults);
      
      const printWindow = window.open('', '_blank');
      printWindow.document.write(pdfContent);
      printWindow.document.close();
      
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

  const generateReportHTML = (test, sample, results) => {
    const flaggedCount = results.filter(r => r.is_flagged).length;
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
        <title>Laboratory Report - ${sample.accession_number}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 40px; color: #1a1a1a; }
          .header { text-align: center; border-bottom: 3px solid #5B65DC; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { color: #5B65DC; font-size: 28px; margin-bottom: 10px; }
          .header p { color: #666; font-size: 14px; }
          .info-section { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 30px; background: #f9fafb; padding: 20px; border-radius: 8px; }
          .info-item { display: flex; flex-direction: column; gap: 5px; }
          .info-label { font-size: 11px; color: #666; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; }
          .info-value { font-size: 14px; color: #1a1a1a; font-weight: 600; }
          .results-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .results-table th { background: #5B65DC; color: white; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
          .results-table td { padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
          .results-table tr:nth-child(even) { background: #f9fafb; }
          .results-table tr.flagged { background: #fef3c7 !important; }
          .flag-badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
          .flag-badge.normal { background: #d1fae5; color: #065f46; }
          .flag-badge.high { background: #fee2e2; color: #991b1b; }
          .flag-badge.low { background: #fef3c7; color: #92400e; }
          .summary { background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
          .summary h3 { color: #122056; margin-bottom: 10px; font-size: 16px; }
          .summary p { color: #666; line-height: 1.6; font-size: 13px; }
          .footer { text-align: center; color: #666; font-size: 11px; border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 40px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>LABORATORY TEST REPORT</h1>
          <p>Hematology Department</p>
        </div>
        <div class="info-section">
          <div class="info-item"><span class="info-label">Accession Number</span><span class="info-value">${sample.accession_number}</span></div>
          <div class="info-item"><span class="info-label">Barcode</span><span class="info-value">${sample.barcode}</span></div>
          <div class="info-item"><span class="info-label">Patient</span><span class="info-value">${sample.patient_name}</span></div>
          <div class="info-item"><span class="info-label">Test Name</span><span class="info-value">${test.test_name}</span></div>
          <div class="info-item"><span class="info-label">Collection Date</span><span class="info-value">${formatDate(test.order_date)}</span></div>
          <div class="info-item"><span class="info-label">Report Date</span><span class="info-value">${currentDate}</span></div>
        </div>
        ${flaggedCount > 0 ? `
          <div class="summary" style="background: #fef3c7; border-left: 4px solid #f59e0b;">
            <h3 style="color: #92400e;">⚠️ Clinical Alert</h3>
            <p style="color: #92400e;">This report contains ${flaggedCount} abnormal result${flaggedCount !== 1 ? 's' : ''}. Please consult with your healthcare provider.</p>
          </div>
        ` : ''}
        <table class="results-table">
          <thead><tr><th>Parameter</th><th>Result</th><th>Unit</th><th>Reference Range</th><th>Flag</th></tr></thead>
          <tbody>
            ${results.map(result => `
              <tr ${result.is_flagged ? 'class="flagged"' : ''}>
                <td><strong>${result.analyte_name}</strong></td>
                <td><strong>${result.value}</strong></td>
                <td>${result.unit}</td>
                <td>${result.normal_range_low} - ${result.normal_range_high}</td>
                <td><span class="flag-badge ${result.is_flagged ? result.flag_type.toLowerCase() : 'normal'}">${result.is_flagged ? result.flag_type : 'NORMAL'}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="summary">
          <h3>Report Summary</h3>
          <p>This laboratory report contains the results for ${test.test_name} performed on sample ${sample.accession_number}. 
          ${flaggedCount > 0 ? `Results indicate ${flaggedCount} parameter${flaggedCount !== 1 ? 's' : ''} outside the reference range. Clinical correlation is recommended.` : 'All test parameters are within normal reference ranges.'}</p>
        </div>
        <div class="footer">
          <p>This is a computer-generated report and does not require a signature.</p>
          <p>PathoScope Laboratory Information System | Generated: ${currentDate}</p>
          <p><strong>CONFIDENTIAL:</strong> This report is intended for the patient named above only.</p>
        </div>
      </body>
      </html>
    `;
  };

  return (
    <div className="validation-container">
      <header className="page-header" style={{marginBottom: '2rem'}}>
        <div>
          <h1 className="page-title" style={{fontSize: '1.5rem', fontWeight: 600, color: '#122056', marginBottom: '0.5rem'}}>
            Hematology Test Results
          </h1>
          <p className="page-subtitle" style={{fontSize: '0.875rem', color: '#6b7280'}}>
            View your blood test results and download reports
          </p>
        </div>
      </header>

      {error && (
        <div className="alert alert-error" style={{marginBottom: '1.5rem', padding: '1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
          <AlertCircle size={20} color="#dc2626" />
          <span style={{color: '#991b1b', fontSize: '0.875rem'}}>{error}</span>
        </div>
      )}

      <div className="validation-layout">
        {/* Tests Sidebar */}
        <div className="samples-sidebar">
          <h2 className="sidebar-title">Available Reports ({hematologyTests.length})</h2>
          
          {hematologyTests.length === 0 ? (
            <div className="empty-state" style={{padding: '2rem', textAlign: 'center'}}>
              <p style={{color: '#9ca3af', fontSize: '0.875rem'}}>No reports available yet</p>
            </div>
          ) : (
            <div className="samples-list">
              {hematologyTests.map(test => {
                const sample = sampleByTestOrder[test.id];
                return (
                  <button
                    key={test.id}
                    onClick={() => fetchTestResults(test.id)}
                    className={`sample-item ${selectedTest?.id === test.id ? 'active' : ''}`}
                    disabled={loading}
                  >
                    <div className="sample-icon">
                      <FileText size={18} />
                    </div>
                    <div className="sample-details">
                      <h4>{test.test_name}</h4>
                      <p>{formatDate(test.order_date)}</p>
                      <span className="test-badge" style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        background: '#eeeffd',
                        color: '#5B65DC',
                        marginTop: '4px'
                      }}>
                        {test.status}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Results Panel */}
        <div className="results-panel">
          {!selectedTest ? (
            <div className="empty-results">
              <FileText size={48} color="#d1d5db" />
              <p style={{marginTop: '1rem', color: '#9ca3af'}}>Select a test to view results</p>
            </div>
          ) : loading ? (
            <div className="loading-results" style={{textAlign: 'center', padding: '3rem'}}>
              <div style={{fontSize: '2rem', marginBottom: '1rem'}}>⏳</div>
              <p style={{color: '#6b7280'}}>Loading results...</p>
            </div>
          ) : sampleResults.length === 0 ? (
            <div className="empty-results">
              <AlertCircle size={48} color="#f59e0b" />
              <p style={{marginTop: '1rem', color: '#9ca3af'}}>No results available</p>
            </div>
          ) : (
            <>
    

              {/* Clinical Alert */}
              {sampleResults.some(r => r.is_flagged) && (
                <div style={{
                  padding: '1rem 1.25rem',
                  background: '#fef3c7',
                  border: '1px solid #fde68a',
                  borderRadius: '8px',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <AlertCircle size={20} color="#f59e0b" />
                  <div>
                    <p style={{margin: 0, fontSize: '0.875rem', color: '#92400e', fontWeight: 600}}>
                      Clinical Alert:
                    </p>
                    <p style={{margin: 0, fontSize: '0.875rem', color: '#92400e'}}>
                      This report contains {sampleResults.filter(r => r.is_flagged).length} abnormal result(s). Please consult with your healthcare provider.
                    </p>
                  </div>
                </div>
              )}

              {/* Download Button */}
              <div style={{display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem'}}>
                <button
                  onClick={generatePDFReport}
                  disabled={generatingPDF}
                  style={{
                    padding: '0.625rem 1.25rem',
                    background: generatingPDF ? '#cbd5e0' : '#5B65DC',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: generatingPDF ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Download size={16} />
                  {generatingPDF ? 'Generating Report...' : 'Download Report'}
                </button>
              </div>

              {/* Results Table */}
              <div className="results-table-container">
                <table className="results-table">
                  <thead>
                    <tr>
                      <th>PARAMETER</th>
                      <th>VALUE</th>
                      <th>UNIT</th>
                      <th>REFERENCE RANGE</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sampleResults.map(result => (
                      <tr 
                        key={result.id}
                        className={result.is_flagged ? 'flagged' : ''}
                        style={result.is_flagged ? {background: '#fef3c7'} : {}}
                      >
                        <td className="param-name" style={{fontWeight: 600, color: '#122056'}}>
                          {result.analyte_name}
                        </td>
                        <td className="param-value" style={{fontWeight: 700, fontSize: '1rem'}}>
                          {result.value}
                        </td>
                        <td className="param-unit" style={{color: '#6b7280'}}>
                          {result.unit}
                        </td>
                        <td className="param-range" style={{color: '#6b7280'}}>
                          {result.normal_range_low} - {result.normal_range_high}
                        </td>
                        <td className="param-flag">
                          {result.is_flagged ? (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              padding: '0.25rem 0.75rem',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              background: result.flag_type === 'HIGH' ? '#fee2e2' : '#fef3c7',
                              color: result.flag_type === 'HIGH' ? '#991b1b' : '#92400e'
                            }}>
                              <AlertCircle size={12} />
                              {result.flag_type}
                            </span>
                          ) : (
                            <span style={{
                              padding: '0.25rem 0.75rem',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              background: '#d1fae5',
                              color: '#065f46'
                            }}>
                              NORMAL
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultsHematology;