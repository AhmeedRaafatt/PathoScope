import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { FileText, Download, Eye } from 'lucide-react';
import '../../styles/patient/Results.css';

const ResultsPathology = () => {
  const context = useOutletContext();
  const testOrders = Array.isArray(context?.testOrders) ? context.testOrders : [];
  const [selectedTest, setSelectedTest] = useState(null);
  
  // Only show ready pathology tests
  const pathologyTests = testOrders.filter(order => 
    order.test_type === 'pathology' &&
    (order.status === 'Report Ready' || order.status === 'Complete')
  );

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleSelectTest = (test) => {
    setSelectedTest(selectedTest?.id === test.id ? null : test);
  };

  return (
    <div className="validation-container">
      <header className="page-header" style={{marginBottom: '2rem'}}>
        <div>
          <h1 className="page-title" style={{fontSize: '1.5rem', fontWeight: 600, color: '#122056', marginBottom: '0.5rem'}}>
            Pathology Test Results
          </h1>
          <p className="page-subtitle" style={{fontSize: '0.875rem', color: '#6b7280'}}>
            View your tissue biopsy and pathology reports
          </p>
        </div>
      </header>

      <div className="validation-layout">
        {/* Tests Sidebar */}
        <div className="samples-sidebar">
          <h2 className="sidebar-title">Available Reports ({pathologyTests.length})</h2>
          
          {pathologyTests.length === 0 ? (
            <div className="empty-state" style={{padding: '2rem', textAlign: 'center'}}>
              <p style={{color: '#9ca3af', fontSize: '0.875rem'}}>No reports available yet</p>
            </div>
          ) : (
            <div className="samples-list">
              {pathologyTests.map(test => (
                <button
                  key={test.id}
                  onClick={() => handleSelectTest(test)}
                  className={`sample-item ${selectedTest?.id === test.id ? 'active' : ''}`}
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
              ))}
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
          ) : (
            <>
              {/* Test Info Header */}
              <div className="results-header">
                <div className="sample-info-card" style={{
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem'}}>
                    <div>
                      <h3 style={{fontSize: '1.25rem', fontWeight: 600, color: '#122056', marginBottom: '0.5rem'}}>
                        {selectedTest.test_name}
                      </h3>
                      <p style={{fontSize: '0.875rem', color: '#6b7280'}}>
                        Report Date: {formatDate(selectedTest.order_date)}
                      </p>
                    </div>
                    <span className="status-badge" style={{
                      padding: '0.5rem 1rem',
                      background: '#eeeffd',
                      color: '#5B65DC',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      fontWeight: 600
                    }}>
                      {selectedTest.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Report Actions */}
              <div style={{
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '1.5rem',
                marginBottom: '1.5rem'
              }}>
                <h4 style={{fontSize: '1rem', fontWeight: 600, color: '#122056', marginBottom: '1rem'}}>
                  Available Documents
                </h4>
                
                <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                  {/* PDF Report Section */}
                  <div style={{
                    padding: '1.25rem',
                    background: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                      <div>
                        <h5 style={{fontSize: '0.9rem', fontWeight: 600, color: '#122056', marginBottom: '0.25rem'}}>
                          📄 Pathology Report (PDF)
                        </h5>
                        <p style={{fontSize: '0.8rem', color: '#6b7280', margin: 0}}>
                          Detailed microscopic examination and diagnosis
                        </p>
                      </div>
                      <div style={{display: 'flex', gap: '0.5rem'}}>
                        {selectedTest.report_url ? (
                          <>
                            <button 
                              onClick={() => window.open(selectedTest.report_url, '_blank')}
                              style={{
                                padding: '0.5rem 1rem',
                                background: '#5B65DC',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                              }}
                            >
                              <Eye size={16} />
                              View
                            </button>
                            <button 
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = selectedTest.report_url;
                                link.download = `Pathology_Report_${selectedTest.test_name}_${formatDate(selectedTest.order_date)}.pdf`;
                                link.click();
                              }}
                              style={{
                                padding: '0.5rem 1rem',
                                background: 'white',
                                color: '#5B65DC',
                                border: '1px solid #5B65DC',
                                borderRadius: '6px',
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                              }}
                            >
                              <Download size={16} />
                              Download
                            </button>
                          </>
                        ) : (
                          <span style={{fontSize: '0.875rem', color: '#9ca3af', fontStyle: 'italic'}}>
                            Not available yet
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Digital Slides Section */}
                  {selectedTest.slide_url && (
                    <div style={{
                      padding: '1.25rem',
                      background: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <div>
                          <h5 style={{fontSize: '0.9rem', fontWeight: 600, color: '#122056', marginBottom: '0.25rem'}}>
                            🔬 Digital Microscopic Slides
                          </h5>
                          <p style={{fontSize: '0.8rem', color: '#6b7280', margin: 0}}>
                            High-resolution tissue samples with DICOM viewer
                          </p>
                        </div>
                        <button 
                          onClick={() => window.open(selectedTest.slide_url, '_blank')}
                          style={{
                            padding: '0.5rem 1rem',
                            background: '#5B65DC',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}
                        >
                          <Eye size={16} />
                          Open Viewer
                        </button>
                      </div>
                    </div>
                  )}

                  {/* No content available */}
                  {!selectedTest.report_url && !selectedTest.slide_url && (
                    <div style={{
                      padding: '2rem',
                      textAlign: 'center',
                      color: '#9ca3af'
                    }}>
                      <p>No documents available for this test yet.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Report Information */}
              <div style={{
                background: '#ebf4ff',
                border: '1px solid #bee3f8',
                borderRadius: '8px',
                padding: '1rem',
                display: 'flex',
                gap: '0.75rem'
              }}>
                <span style={{fontSize: '1.25rem'}}>ℹ️</span>
                <div>
                  <p style={{margin: 0, fontSize: '0.875rem', color: '#2c5282', fontWeight: 600, marginBottom: '0.25rem'}}>
                    About Your Pathology Report
                  </p>
                  <p style={{margin: 0, fontSize: '0.8rem', color: '#2c5282', lineHeight: 1.5}}>
                    Pathology reports contain detailed analysis by certified pathologists. 
                    If you have questions about your results, please consult with your healthcare provider.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultsPathology;