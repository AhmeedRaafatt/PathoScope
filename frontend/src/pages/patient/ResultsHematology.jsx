import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { FileText } from 'lucide-react';
import '../../styles/patient/Results.css';

const ResultsHematology = () => {
  const context = useOutletContext();
  const testOrders = Array.isArray(context?.testOrders) ? context.testOrders : [];
  
  // Filter only hematology tests
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

  // Placeholder data structure for hematology values
  // In a real scenario, this would come from the backend as structured data
  const sampleHematologyValues = {
    'CBC': [
      { parameter: 'White Blood Cell (WBC)', value: 7.2, unit: '10^3/µL', reference: '4.5-11.0' },
      { parameter: 'Red Blood Cell (RBC)', value: 4.8, unit: '10^6/µL', reference: '4.5-5.5' },
      { parameter: 'Hemoglobin', value: 14.2, unit: 'g/dL', reference: '13.5-17.5' },
      { parameter: 'Hematocrit', value: 42.5, unit: '%', reference: '41-53' },
      { parameter: 'Platelets', value: 250, unit: '10^3/µL', reference: '150-400' },
      { parameter: 'Mean Corpuscular Volume', value: 88, unit: 'fL', reference: '80-100' },
    ]
  };

  return (
    <div className="results-hematology">
      <div className="hematology-header">
        <h2>Hematology Results</h2>
        <p>Blood test parameters and values</p>
      </div>

      {hematologyTests.length === 0 ? (
        <div className="no-results">
          <FileText size={48} />
          <h3>No hematology tests available</h3>
          <p>You don't have any hematology test results yet.</p>
        </div>
      ) : (
        <div className="hematology-tests">
          {hematologyTests.map(test => (
            <div key={test.id} className="hematology-test-card">
              <div className="test-header">
                <h3>{test.test_name}</h3>
                <span className={`status-badge ${test.status === 'Report Ready' ? 'ready' : 'pending'}`}>
                  {test.status}
                </span>
              </div>

              <div className="test-date">
                <strong>Test Date:</strong> {formatDate(test.order_date)}
              </div>

              {test.status === 'Report Ready' || test.status === 'Complete' ? (
                <div className="hematology-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Parameter</th>
                        <th>Value</th>
                        <th>Unit</th>
                        <th>Reference Range</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sampleHematologyValues[test.test_name]?.map((value, idx) => (
                        <tr key={idx} className={
                          parseFloat(value.value) < parseFloat(value.reference.split('-')[0]) ||
                          parseFloat(value.value) > parseFloat(value.reference.split('-')[1]) 
                            ? 'out-of-range' 
                            : ''
                        }>
                          <td className="param-name">{value.parameter}</td>
                          <td className="param-value">{value.value}</td>
                          <td className="param-unit">{value.unit}</td>
                          <td className="param-ref">{value.reference}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {test.report_url && (
                    <div className="report-link">
                      <a href={test.report_url} target="_blank" rel="noopener noreferrer">
                        📄 Download Full Report PDF
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="processing-message">
                  <p>This test is still being processed. Check back soon for results.</p>
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
