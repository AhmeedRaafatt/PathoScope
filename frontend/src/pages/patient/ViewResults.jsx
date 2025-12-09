import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { FileText, Download, Eye, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import '../../styles/patient/Results.css';

export default function ViewResults() {
  const context = useOutletContext();
  const testOrders = Array.isArray(context?.testOrders) ? context.testOrders : [];
  const [expandedTest, setExpandedTest] = useState(null);
  const [filterType, setFilterType] = useState('all'); // 'all', 'hematology', 'pathology'
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'ready', 'pending'

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

  // Filter tests
  const filteredTests = testOrders.filter(test => {
    const typeMatch = filterType === 'all' || test.test_type === filterType;
    const statusMatch = filterStatus === 'all' || 
      (filterStatus === 'ready' && (test.status === 'Report Ready' || test.status === 'Complete')) ||
      (filterStatus === 'pending' && test.status !== 'Report Ready' && test.status !== 'Complete');
    return typeMatch && statusMatch;
  });

  // Sort by date (most recent first)
  const sortedTests = [...filteredTests].sort((a, b) => 
    new Date(b.order_date) - new Date(a.order_date)
  );

  return (
    <div className="results-view">
      {/* Filter Section */}
      <div className="results-filters">
        <div className="filter-group">
          <label className="filter-label">
            <Filter size={16} />
            Test Type:
          </label>
          <div className="filter-buttons">
            <button 
              className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => setFilterType('all')}
            >
              All ({testOrders.length})
            </button>
            <button 
              className={`filter-btn ${filterType === 'hematology' ? 'active' : ''}`}
              onClick={() => setFilterType('hematology')}
            >
              Hematology ({testOrders.filter(t => t.test_type === 'hematology').length})
            </button>
            <button 
              className={`filter-btn ${filterType === 'pathology' ? 'active' : ''}`}
              onClick={() => setFilterType('pathology')}
            >
              Pathology ({testOrders.filter(t => t.test_type === 'pathology').length})
            </button>
          </div>
        </div>

        <div className="filter-group">
          <label className="filter-label">Status:</label>
          <div className="filter-buttons">
            <button 
              className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
              onClick={() => setFilterStatus('all')}
            >
              All
            </button>
            <button 
              className={`filter-btn ${filterStatus === 'ready' ? 'active' : ''}`}
              onClick={() => setFilterStatus('ready')}
            >
              Ready
            </button>
            <button 
              className={`filter-btn ${filterStatus === 'pending' ? 'active' : ''}`}
              onClick={() => setFilterStatus('pending')}
            >
              Pending
            </button>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="results-summary">
        <p className="results-count">
          Showing <strong>{sortedTests.length}</strong> {sortedTests.length === 1 ? 'result' : 'results'}
        </p>
      </div>

      {/* Test List */}
      {sortedTests.length === 0 ? (
        <div className="empty-state">
          <FileText size={48} className="empty-icon" />
          <h3>No results found</h3>
          <p>No test results match your current filters.</p>
        </div>
      ) : (
        <div className="test-list">
          {sortedTests.map(test => (
            <div key={test.id} className="test-card">
              <div 
                className="test-card-header"
                onClick={() => toggleExpand(test.id)}
              >
                <div className="test-info">
                  <div className={`test-icon-wrapper ${test.test_type}`}>
                    <FileText size={20} />
                  </div>
                  <div className="test-details">
                    <div className="test-name-row">
                      <h3 className="test-name">{test.test_name}</h3>
                      <span className="test-type-label">{test.test_type}</span>
                    </div>
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
                    <div className="all-results-content">
                      {/* Test Information */}
                      <div className="info-grid">
                        <div className="info-item">
                          <span className="info-label">Test Type</span>
                          <span className="info-value">{test.test_type}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Test Name</span>
                          <span className="info-value">{test.test_name}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Order Date</span>
                          <span className="info-value">{formatDate(test.order_date)}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Status</span>
                          <span className="info-value">{test.status}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="all-results-actions">
                        {test.report_url && (
                          <button 
                            className="btn-action primary"
                            onClick={() => window.open(test.report_url, '_blank')}
                          >
                            <Download size={18} />
                            Download Report PDF
                          </button>
                        )}
                        
                        {test.slide_url && (
                          <button 
                            className="btn-action secondary"
                            onClick={() => window.open(test.slide_url, '_blank')}
                          >
                            <Eye size={18} />
                            View Digital Slides
                          </button>
                        )}

                        {!test.report_url && !test.slide_url && (
                          <p className="no-actions">No downloadable files available</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="processing-state">
                      <p>This test is currently being processed. Results will be available soon.</p>
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
}