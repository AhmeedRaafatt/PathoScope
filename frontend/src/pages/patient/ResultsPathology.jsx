import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { FileText, ExternalLink } from 'lucide-react';
import '../../styles/patient/Results.css';

const ResultsPathology = () => {
  const context = useOutletContext();
  const testOrders = Array.isArray(context?.testOrders) ? context.testOrders : [];
  
  // Filter only pathology tests
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

  const handleOpenViewer = (slideUrl) => {
    if (slideUrl) {
      // Opens DICOM/WSI viewer in new tab
      // In production, you would integrate Cornerstone.js or similar
      window.open(slideUrl, '_blank');
    }
  };

  return (
    <div className="results-pathology">
      <div className="pathology-header">
        <h2>Pathology Results</h2>
        <p>Tissue samples, biopsies, and microscopic analysis</p>
      </div>

      {pathologyTests.length === 0 ? (
        <div className="no-results">
          <FileText size={48} />
          <h3>No pathology tests available</h3>
          <p>You don't have any pathology test results yet.</p>
        </div>
      ) : (
        <div className="pathology-tests">
          {pathologyTests.map(test => (
            <div key={test.id} className="pathology-test-card">
              <div className="test-card-header">
                <div className="test-info">
                  <h3>{test.test_name}</h3>
                  <span className={`status-badge ${test.status === 'Report Ready' ? 'ready' : 'pending'}`}>
                    {test.status}
                  </span>
                </div>
                <div className="test-date">
                  {formatDate(test.order_date)}
                </div>
              </div>

              {test.status === 'Report Ready' || test.status === 'Complete' ? (
                <div className="pathology-content">
                  <div className="pathology-report">
                    <h4>Pathology Report</h4>
                    {test.report_url ? (
                      <button 
                        className="btn-download"
                        onClick={() => window.open(test.report_url, '_blank')}
                      >
                        <FileText size={18} />
                        View PDF Report
                      </button>
                    ) : (
                      <p className="no-report">Report not available</p>
                    )}
                  </div>

                  {test.slide_url && (
                    <div className="pathology-slides">
                      <h4>Microscopic Slides</h4>
                      <button 
                        className="btn-viewer"
                        onClick={() => handleOpenViewer(test.slide_url)}
                      >
                        <ExternalLink size={18} />
                        Open DICOM/WSI Viewer
                      </button>
                      <p className="viewer-info">
                        View high-resolution tissue samples using the DICOM/WSI viewer
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="processing-message">
                  <p>This tissue sample is being analyzed by our pathologists. Results will be available shortly.</p>
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
