import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { FileText, Download, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import '../../styles/patient/Results.css';

const ViewResults = () => {
  const context = useOutletContext();
  const testOrders = Array.isArray(context?.testOrders) ? context.testOrders : [];
  const [expandedId, setExpandedId] = useState(null);

  // Separate results by status
  const reportReadyResults = testOrders.filter(order => 
    order.status === 'Report Ready' || order.status === 'Complete'
  );
  
  const pendingResults = testOrders.filter(order => 
    order.status === 'Pending' || order.status === 'In Progress'
  );

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Report Ready':
      case 'Complete':
        return <CheckCircle className="status-icon ready" size={20} />;
      case 'In Progress':
        return <Clock className="status-icon progress" size={20} />;
      case 'Pending':
        return <AlertCircle className="status-icon pending" size={20} />;
      default:
        return <FileText className="status-icon" size={20} />;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Report Ready':
      case 'Complete':
        return 'ready';
      case 'In Progress':
        return 'progress';
      case 'Pending':
        return 'pending';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownloadReport = (reportUrl, testName) => {
    if (reportUrl) {
      window.open(reportUrl, '_blank');
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="view-results">
      {/* Report Ready Results */}
      {reportReadyResults.length > 0 && (
        <section className="results-section">
          <div className="section-header">
            <h2 className="section-title">
              <CheckCircle className="section-icon" size={24} />
              Reports Ready ({reportReadyResults.length})
            </h2>
          </div>
          <div className="results-list">
            {reportReadyResults.map(result => (
              <div 
                key={result.id} 
                className={`result-card ready ${expandedId === result.id ? 'expanded' : ''}`}
              >
                <div 
                  className="result-header"
                  onClick={() => toggleExpand(result.id)}
                >
                  <div className="result-info">
                    <div className="result-icon">
                      {getStatusIcon(result.status)}
                    </div>
                    <div className="result-details">
                      <h3 className="result-name">{result.test_name}</h3>
                      <div className="result-meta">
                        <span className="test-type">{result.test_type}</span>
                        <span className="order-date">{formatDate(result.order_date)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="result-status">
                    <span className={`status-badge ${getStatusColor(result.status)}`}>
                      {result.status}
                    </span>
                  </div>
                </div>

                {expandedId === result.id && (
                  <div className="result-content">
                    <div className="result-actions">
                      {result.report_url && (
                        <button 
                          className="action-btn download-btn"
                          onClick={() => handleDownloadReport(result.report_url, result.test_name)}
                        >
                          <Download size={18} />
                          View Report PDF
                        </button>
                      )}
                      {result.slide_url && (
                        <button 
                          className="action-btn viewer-btn"
                          onClick={() => window.open(result.slide_url, '_blank')}
                        >
                          <FileText size={18} />
                          Open DICOM/WSI Viewer
                        </button>
                      )}
                    </div>
                    <div className="result-details-full">
                      <p><strong>Test Type:</strong> {result.test_type}</p>
                      <p><strong>Ordered:</strong> {formatDate(result.order_date)}</p>
                      {result.report_url && <p><strong>Report:</strong> Available for download</p>}
                      {result.slide_url && <p><strong>Slide:</strong> Available in DICOM/WSI viewer</p>}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Pending/In Progress Results */}
      {pendingResults.length > 0 && (
        <section className="results-section">
          <div className="section-header">
            <h2 className="section-title">
              <Clock className="section-icon" size={24} />
              Processing ({pendingResults.length})
            </h2>
          </div>
          <div className="results-list">
            {pendingResults.map(result => (
              <div 
                key={result.id} 
                className={`result-card pending ${expandedId === result.id ? 'expanded' : ''}`}
              >
                <div 
                  className="result-header"
                  onClick={() => toggleExpand(result.id)}
                >
                  <div className="result-info">
                    <div className="result-icon">
                      {getStatusIcon(result.status)}
                    </div>
                    <div className="result-details">
                      <h3 className="result-name">{result.test_name}</h3>
                      <div className="result-meta">
                        <span className="test-type">{result.test_type}</span>
                        <span className="order-date">{formatDate(result.order_date)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="result-status">
                    <span className={`status-badge ${getStatusColor(result.status)}`}>
                      {result.status}
                    </span>
                  </div>
                </div>

                {expandedId === result.id && (
                  <div className="result-content">
                    <div className="result-details-full">
                      <p><strong>Test Type:</strong> {result.test_type}</p>
                      <p><strong>Ordered:</strong> {formatDate(result.order_date)}</p>
                      <p className="status-message">
                        Your report is being processed. Please check back soon.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* No Results */}
      {testOrders.length === 0 && (
        <section className="results-section">
          <div className="no-results">
            <FileText size={48} />
            <h3>No test results yet</h3>
            <p>Your test results will appear here once they are ready.</p>
          </div>
        </section>
      )}
    </div>
  );
};

export default ViewResults;
