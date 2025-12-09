import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { FileText, Download, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import '../../styles/patient/Results.css';

const ResultsHematology = () => {
  const context = useOutletContext();
  const testOrders = Array.isArray(context?.testOrders) ? context.testOrders : [];
  const [expandedTest, setExpandedTest] = useState(null);
  
  const hematologyTests = testOrders.filter(order => 
    order.test_type === 'hematology'
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

  // Sample hematology values - Replace with actual backend data
  const sampleHematologyValues = {
    'CBC': [
      { parameter: 'White Blood Cell (WBC)', value: 7.2, unit: '10^3/µL', reference: '4.5-11.0', normal: true },
      { parameter: 'Red Blood Cell (RBC)', value: 4.8, unit: '10^6/µL', reference: '4.5-5.5', normal: true },
      { parameter: 'Hemoglobin', value: 14.2, unit: 'g/dL', reference: '13.5-17.5', normal: true },
      { parameter: 'Hematocrit', value: 42.5, unit: '%', reference: '41-53', normal: true },
      { parameter: 'Platelets', value: 250, unit: '10^3/µL', reference: '150-400', normal: true },
      { parameter: 'Mean Corpuscular Volume', value: 88, unit: 'fL', reference: '80-100', normal: true },
    ]
  };

  return (
    <div className="results-view">
      {hematologyTests.length === 0 ? (
        <div className="empty-state">
          <FileText size={48} className="empty-icon" />
          <h3>No hematology tests available</h3>
          <p>You don't have any blood test results yet.</p>
        </div>
      ) : (
        <div className="test-list">
          {hematologyTests.map(test => (
            <div key={test.id} className="test-card">
              <div 
                className="test-card-header"
                onClick={() => toggleExpand(test.id)}
              >
                <div className="test-info">
                  <div className="test-icon-wrapper hematology">
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
                    <>
                      <div className="results-table-wrapper">
                        <table className="results-table">
                          <thead>
                            <tr>
                              <th>Parameter</th>
                              <th>Value</th>
                              <th>Unit</th>
                              <th>Reference Range</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sampleHematologyValues[test.test_name]?.map((param, idx) => (
                              <tr key={idx} className={param.normal ? '' : 'abnormal'}>
                                <td className="param-name">{param.parameter}</td>
                                <td className="param-value">{param.value}</td>
                                <td className="param-unit">{param.unit}</td>
                                <td className="param-reference">{param.reference}</td>
                                <td className="param-status">
                                  {param.normal ? (
                                    <span className="status-normal">Normal</span>
                                  ) : (
                                    <span className="status-abnormal">
                                      <AlertCircle size={14} />
                                      Abnormal
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      {test.report_url && (
                        <div className="action-buttons">
                          <a 
                            href={test.report_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn-download"
                          >
                            <Download size={18} />
                            Download Full Report
                          </a>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="processing-state">
                      <p>This test is still being processed. Results will be available soon.</p>
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

export default ResultsHematology;