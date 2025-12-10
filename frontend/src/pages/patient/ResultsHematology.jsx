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

  // Map test_order id -> sample (if a sample exists for that order)
  const hematologySamples = Array.isArray(context?.hematology_samples) ? context.hematology_samples : [];
  const sampleByTestOrder = {};
  hematologySamples.forEach(s => {
    if (s.test_order_id) sampleByTestOrder[s.test_order_id] = s;
  });

  const [resultsBySample, setResultsBySample] = useState({});

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const toggleExpand = (testId) => {
    const next = expandedTest === testId ? null : testId;
    setExpandedTest(next);

    // If expanding and sample exists, fetch results for that sample if not loaded
    if (next) {
      const testOrder = hematologyTests.find(t => t.id === testId);
      const sample = sampleByTestOrder[testId] || null;
      if (sample && !resultsBySample[sample.id]) {
        // fetch results with better error handling
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No auth token for fetching results');
          setResultsBySample(prev => ({ ...prev, [sample.id]: { __error: 'No auth token' } }));
          return
        }

        fetch(`http://127.0.0.1:8000/api/hematology/samples/${sample.id}/results/`, {
          headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${token}` }
        })
          .then(async (res) => {
            if (!res.ok) {
              const err = await res.json().catch(() => ({}));
              throw new Error(err.error || 'Failed to fetch sample results');
            }
            return res.json();
          })
          .then(json => setResultsBySample(prev => ({ ...prev, [sample.id]: json })))
          .catch(err => {
            console.error('Error loading sample results', err);
            setResultsBySample(prev => ({ ...prev, [sample.id]: { __error: err.message } }));
          });
      }
    }
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
                  {(() => {
                    const sample = sampleByTestOrder[test.id];
                    if (!sample) {
                      return <div className="processing-state"><p>No sample has been accessioned for this test yet.</p></div>;
                    }

                    const results = resultsBySample[sample.id];
                    if (!results) {
                      // not loaded yet - show loading or processing state depending on sample status
                      return <div className="processing-state"><p>Loading results or test is still processing...</p></div>;
                    }

                    if (results && results.__error) {
                      return <div className="processing-state"><p>Error loading results: {results.__error}</p></div>;
                    }

                    if (Array.isArray(results) && results.length === 0) {
                      return <div className="processing-state"><p>No analyte results recorded for this sample.</p></div>;
                    }

                    return (
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
                              {results.map((r) => (
                                <tr key={r.id} className={r.is_flagged ? 'abnormal' : ''}>
                                  <td className="param-name">{r.analyte_name}</td>
                                  <td className="param-value">{r.value}</td>
                                  <td className="param-unit">{r.unit}</td>
                                  <td className="param-reference">{r.normal_range_low} - {r.normal_range_high}</td>
                                  <td className="param-status">
                                    {r.is_flagged ? (
                                      <span className="status-abnormal"><AlertCircle size={14} /> {r.flag_type || 'Abnormal'}</span>
                                    ) : (
                                      <span className="status-normal">Normal</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    );
                  })()}
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