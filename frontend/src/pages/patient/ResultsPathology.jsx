import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { FileText, Download, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import '../../styles/patient/Results.css';

const ResultsPathology = () => {
  const context = useOutletContext();
  const testOrders = Array.isArray(context?.testOrders) ? context.testOrders : [];
  const [expandedTest, setExpandedTest] = useState(null);
  
  const pathologyTests = testOrders.filter(order => 
    order.test_type === 'pathology'
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const toggleExpand = (testId) => {
    setExpandedTest(expandedTest === testId ? null : testId);
  };

  const handleOpenViewer = (slideUrl) => {
    if (slideUrl) {
      window.open(slideUrl, '_blank');
    }
  };

  return (
    <div className="results-view">
      {pathologyTests.length === 0 ? (
        <div className="empty-state">
          <FileText size={48} className="empty-icon" />
          <h3>No pathology tests available</h3>
          <p>You don't have any tissue biopsy or pathology results yet.</p>
        </div>
      ) : (
        <div className="test-list">
          {pathologyTests.map(test => (
            <div key={test.id} className="test-card">
              <div 
                className="test-card-header"
                onClick={() => toggleExpand(test.id)}
              >
                <div className="test-info">
                  <div className="test-icon-wrapper pathology">
                    <FileText size={20} />
                  </div>
                  <div className="test-details">
                    <h3 className="test-name">{test.test_name}</h3>
                    <p className="test-date">{formatDate(test.order_date)}</p>
                  </div>
                </div>
                <div className="test-actions">
                  <span className={`status-badge ${test.status === 'Report Ready' || test.status === 'Complete' ? 'ready' : 'pending'}`}>
                    {test.status}
                  </span>
                  <button className="expand-btn">
                    {expandedTest === test.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                </div>
              </div>

              {expandedTest === test.id && (
                <div className="test-card-content">
                  {test.status === 'Report Ready' || test.status === 'Complete' ? (
                    <div className="pathology-content">
                      <div className="content-section">
                        <h4 className="section-title">Pathology Report</h4>
                        <p className="section-description">
                          Detailed microscopic examination and diagnosis by certified pathologist
                        </p>
                        {test.report_url ? (
                          <button 
                            className="btn-action primary"
                            onClick={() => window.open(test.report_url, '_blank')}
                          >
                            <Download size={18} />
                            Download PDF Report
                          </button>
                        ) : (
                          <p className="no-data">Report not available</p>
                        )}
                      </div>

                      {test.slide_url && (
                        <div className="content-section">
                          <h4 className="section-title">Digital Microscopic Slides</h4>
                          <p className="section-description">
                            View high-resolution tissue samples using our advanced DICOM viewer
                          </p>
                          <button 
                            className="btn-action secondary"
                            onClick={() => handleOpenViewer(test.slide_url)}
                          >
                            <Eye size={18} />
                            Open Slide Viewer
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="processing-state">
                      <p>This tissue sample is being analyzed by our pathologists. Results will be available shortly.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResultsPathology;