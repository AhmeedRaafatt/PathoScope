import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { FileText, Download, Eye, AlertTriangle, CheckCircle, Clock, ExternalLink } from 'lucide-react';
import '../../styles/patient/Results.css';

const ResultsPathology = () => {
  const context = useOutletContext();
  const navigate = useNavigate();
  const testOrders = Array.isArray(context?.testOrders) ? context.testOrders : [];
  const [selectedTest, setSelectedTest] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  
  // Only show pathology tests that are finalized (Report Ready)
  const pathologyTests = testOrders.filter(order => 
    order.test_type === 'pathology' &&
    (order.status === 'Report Ready' || order.status === 'report_ready')
  );

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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get urgency based on ICD code
  const getUrgencyLevel = (icdCode) => {
    if (!icdCode) return null;
    const code = icdCode.toUpperCase();
    if (code.startsWith('C')) return { level: 'critical', label: 'Urgent - Please consult your doctor', color: '#dc2626', bgColor: '#fef2f2' };
    if (code.startsWith('D0') || code.startsWith('D1') || code.startsWith('D2') || code.startsWith('D3')) {
      return { level: 'moderate', label: 'Follow-up recommended', color: '#f59e0b', bgColor: '#fffbeb' };
    }
    return { level: 'normal', label: 'Routine findings', color: '#10b981', bgColor: '#f0fdf4' };
  };

  const handleSelectTest = (test) => {
    setSelectedTest(selectedTest?.id === test.id ? null : test);
  };

  const urgency = selectedTest ? getUrgencyLevel(selectedTest.icd_code) : null;

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
              <FileText size={40} color="#d1d5db" style={{marginBottom: '1rem'}} />
              <p style={{color: '#9ca3af', fontSize: '0.875rem', margin: 0}}>No reports available yet</p>
              <p style={{color: '#d1d5db', fontSize: '0.75rem', margin: '0.5rem 0 0 0'}}>
                Reports will appear here once finalized by your pathologist
              </p>
            </div>
          ) : (
            <div className="samples-list">
              {pathologyTests.map(test => {
                const testUrgency = getUrgencyLevel(test.icd_code);
                return (
                <button
                  key={test.id}
                  onClick={() => handleSelectTest(test)}
                  className={`sample-item ${selectedTest?.id === test.id ? 'active' : ''}`}
                  style={{
                    borderLeft: testUrgency ? `4px solid ${testUrgency.color}` : undefined
                  }}
                >
                  <div className="sample-icon" style={{
                    background: testUrgency?.bgColor || '#eeeffd'
                  }}>
                    <FileText size={18} color={testUrgency?.color || '#5B65DC'} />
                  </div>
                  <div className="sample-details">
                    <h4>{test.test_name}</h4>
                    <p>{formatDate(test.finalized_date || test.order_date)}</p>
                    {test.icd_code && (
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 700,
                        background: testUrgency?.bgColor || '#f3f4f6',
                        color: testUrgency?.color || '#6b7280',
                        marginTop: '4px',
                        fontFamily: 'monospace'
                      }}>
                        {test.icd_code}
                      </span>
                    )}
                    <span className="test-badge" style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 600,
                      background: '#d1fae5',
                      color: '#065f46',
                      marginTop: '4px',
                      marginLeft: test.icd_code ? '6px' : '0'
                    }}>
                      ✓ Final
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
          ) : (
            <>
              {/* Urgency Alert */}
              {urgency && urgency.level !== 'normal' && (
                <div style={{
                  background: urgency.bgColor,
                  border: `1px solid ${urgency.color}`,
                  borderRadius: '12px',
                  padding: '1rem 1.25rem',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <AlertTriangle size={24} color={urgency.color} />
                  <div>
                    <p style={{margin: 0, fontWeight: 600, color: urgency.color, fontSize: '0.9rem'}}>
                      {urgency.label}
                    </p>
                    <p style={{margin: '4px 0 0 0', fontSize: '0.8rem', color: '#666'}}>
                      {urgency.level === 'critical' 
                        ? 'This result requires prompt medical attention. Please contact your healthcare provider.'
                        : 'Consider scheduling a follow-up appointment with your doctor.'}
                    </p>
                  </div>
                </div>
              )}

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
                      <p style={{fontSize: '0.875rem', color: '#6b7280', margin: 0}}>
                        Accession #: <span style={{fontFamily: 'monospace', fontWeight: 600}}>{selectedTest.accession_number || 'N/A'}</span>
                      </p>
                    </div>
                    <div style={{textAlign: 'right'}}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '0.5rem 1rem',
                        background: '#d1fae5',
                        color: '#065f46',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        fontWeight: 600
                      }}>
                        <CheckCircle size={16} />
                        Finalized
                      </span>
                    </div>
                  </div>
                  
                  {/* Report Details Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '1rem',
                    padding: '1rem',
                    background: '#f9fafb',
                    borderRadius: '8px'
                  }}>
                    <div>
                      <p style={{fontSize: '0.7rem', color: '#9ca3af', margin: '0 0 4px 0', textTransform: 'uppercase'}}>
                        Report Date
                      </p>
                      <p style={{fontSize: '0.875rem', color: '#374151', margin: 0, fontWeight: 500}}>
                        {formatDateTime(selectedTest.finalized_date)}
                      </p>
                    </div>
                    <div>
                      <p style={{fontSize: '0.7rem', color: '#9ca3af', margin: '0 0 4px 0', textTransform: 'uppercase'}}>
                        Pathologist
                      </p>
                      <p style={{fontSize: '0.875rem', color: '#374151', margin: 0, fontWeight: 500}}>
                        Dr. {selectedTest.pathologist_name || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p style={{fontSize: '0.7rem', color: '#9ca3af', margin: '0 0 4px 0', textTransform: 'uppercase'}}>
                        Ordered On
                      </p>
                      <p style={{fontSize: '0.875rem', color: '#374151', margin: 0, fontWeight: 500}}>
                        {formatDate(selectedTest.order_date)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Diagnosis Section */}
              {selectedTest.icd_code && (
                <div style={{
                  background: urgency?.bgColor || '#f9fafb',
                  border: `2px solid ${urgency?.color || '#e5e7eb'}`,
                  borderRadius: '12px',
                  padding: '1.5rem',
                  marginBottom: '1.5rem',
                  borderLeft: `6px solid ${urgency?.color || '#5B65DC'}`
                }}>
                  <h4 style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    margin: '0 0 1rem 0'
                  }}>
                    Diagnosis
                  </h4>
                  <div style={{display: 'flex', alignItems: 'flex-start', gap: '20px'}}>
                    <div style={{
                      background: 'white',
                      padding: '12px 20px',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      textAlign: 'center',
                      minWidth: '100px'
                    }}>
                      <p style={{fontSize: '0.65rem', color: '#9ca3af', margin: '0 0 4px 0'}}>ICD-10 Code</p>
                      <p style={{
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        color: urgency?.color || '#122056',
                        margin: 0,
                        fontFamily: 'monospace'
                      }}>
                        {selectedTest.icd_code}
                      </p>
                    </div>
                    <div style={{flex: 1}}>
                      <p style={{fontSize: '0.65rem', color: '#9ca3af', margin: '0 0 4px 0'}}>Clinical Diagnosis</p>
                      <p style={{
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        color: '#1e293b',
                        margin: 0,
                        lineHeight: 1.4
                      }}>
                        {selectedTest.icd_description || 'See detailed report'}
                      </p>
                      {urgency && (
                        <p style={{
                          fontSize: '0.8rem',
                          color: urgency.color,
                          margin: '8px 0 0 0',
                          fontWeight: 500
                        }}>
                          {urgency.label}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

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
                  {/* View Full Report Button - Primary Action */}
                  {selectedTest.pathology_case_id && (
                    <div style={{
                      padding: '1.25rem',
                      background: 'linear-gradient(135deg, #122056 0%, #1e3a8a 100%)',
                      borderRadius: '10px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <h5 style={{fontSize: '1rem', fontWeight: 600, color: 'white', marginBottom: '0.25rem'}}>
                          📋 View Full Pathology Report
                        </h5>
                        <p style={{fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)', margin: 0}}>
                          Complete report with images, diagnosis, and clinical findings
                        </p>
                      </div>
                      <button 
                        onClick={() => window.open(`/pathology/report/${selectedTest.pathology_case_id}`, '_blank')}
                        style={{
                          padding: '0.75rem 1.5rem',
                          background: 'white',
                          color: '#122056',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          transition: 'transform 0.2s ease'
                        }}
                        onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        <Eye size={18} />
                        View Report
                        <ExternalLink size={14} />
                      </button>
                    </div>
                  )}

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
                          Printable version for medical records
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
                              View PDF
                            </button>
                            <button 
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = selectedTest.report_url;
                                link.download = `Pathology_Report_${selectedTest.accession_number || selectedTest.test_name}.pdf`;
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

                  {/* Preview Image */}
                  {selectedTest.image_preview && (
                    <div style={{
                      padding: '1.25rem',
                      background: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}>
                      <h5 style={{fontSize: '0.9rem', fontWeight: 600, color: '#122056', marginBottom: '1rem'}}>
                        🔬 Microscopic Image Preview
                      </h5>
                      <div style={{
                        background: '#000',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        maxWidth: '400px'
                      }}>
                        <img 
                          src={`http://127.0.0.1:8000${selectedTest.image_preview}`}
                          alt="Microscopic preview"
                          style={{
                            width: '100%',
                            height: 'auto',
                            display: 'block'
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* No content available */}
                  {!selectedTest.report_url && !selectedTest.pathology_case_id && !selectedTest.slide_url && (
                    <div style={{
                      padding: '2rem',
                      textAlign: 'center',
                      color: '#9ca3af'
                    }}>
                      <Clock size={32} color="#d1d5db" style={{marginBottom: '0.5rem'}} />
                      <p style={{margin: 0}}>Report documents are being prepared.</p>
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
                    This report contains detailed analysis by certified pathologists. 
                    If you have questions about your results, please consult with your healthcare provider.
                    {urgency?.level === 'critical' && (
                      <strong> Given the nature of your results, we recommend scheduling an appointment with your doctor as soon as possible.</strong>
                    )}
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