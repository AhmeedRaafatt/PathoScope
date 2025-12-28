import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { FileText, Download, Eye, ChevronDown, ChevronUp, Filter, AlertCircle } from 'lucide-react';
import '../../styles/patient/Results.css';

export default function ViewResults() {
  const context = useOutletContext();
  const testOrders = Array.isArray(context?.testOrders) ? context.testOrders : [];
  const [expandedTest, setExpandedTest] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [generatingPDF, setGeneratingPDF] = useState(null);
  const [loadingResults, setLoadingResults] = useState({});
  const [testResults, setTestResults] = useState({});

  const hematologySamples = Array.isArray(context?.hematology_samples) ? context.hematology_samples : [];
  const sampleByTestOrder = {};
  hematologySamples.forEach(s => { if (s.test_order_id) sampleByTestOrder[s.test_order_id] = s; });

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  // Helper: normalize status for display
  const isReadyStatus = (status) => {
    if (!status) return false;
    const normalized = String(status).toUpperCase();
    return normalized === 'REPORT_READY' || normalized === 'COMPLETE' || normalized === 'REPORT READY';
  };

  // FIXED: Filter logic
  const filteredTests = testOrders.filter(test => {
    const typeMatch = filterType === 'all' || test.test_type === filterType;
    let statusMatch = true;
    if (filterStatus === 'ready') statusMatch = isReadyStatus(test.status);
    else if (filterStatus === 'pending') statusMatch = !isReadyStatus(test.status);
    return typeMatch && statusMatch;
  });

  const sortedTests = [...filteredTests].sort((a, b) => new Date(b.order_date) - new Date(a.order_date));
  const readyCount = testOrders.filter(t => isReadyStatus(t.status)).length;
  const pendingCount = testOrders.filter(t => !isReadyStatus(t.status)).length;

  

  const toggleExpand = (testId) => {
    const next = expandedTest === testId ? null : testId;
    setExpandedTest(next);
    if (next && !testResults[testId]) fetchTestResults(testId);
  };

  const generateHematologyPDF = (test, sample, results) => {
    if (!sample || !results || results.length === 0) return;
    setGeneratingPDF(test.id);
    try {
      const flaggedCount = results.filter(r => r.is_flagged).length;
      const currentDate = new Date().toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      const pdfContent = `<!DOCTYPE html><html><head><title>Laboratory Report</title><style>*{margin:0;padding:0}body{font-family:Arial;padding:40px;color:#1a1a1a}.header{text-align:center;border-bottom:3px solid #5B65DC;padding-bottom:20px;margin-bottom:30px}.header h1{color:#5B65DC;font-size:28px;margin-bottom:10px}.info-section{display:grid;grid-template-columns:repeat(2,1fr);gap:15px;margin-bottom:30px;background:#f9fafb;padding:20px;border-radius:8px}.info-label{font-size:11px;color:#666;text-transform:uppercase;font-weight:600}.info-value{font-size:14px;color:#1a1a1a;font-weight:600}.results-table{width:100%;border-collapse:collapse;margin-bottom:30px}.results-table th{background:#5B65DC;color:white;padding:12px;text-align:left}.results-table td{padding:12px;border-bottom:1px solid #e5e7eb}.results-table tr.flagged{background:#fef3c7}.flag-badge{padding:4px 8px;border-radius:4px;font-size:11px;font-weight:700;text-transform:uppercase}.flag-badge.normal{background:#d1fae5;color:#065f46}.flag-badge.high{background:#fee2e2;color:#991b1b}.flag-badge.low{background:#fef3c7;color:#92400e}.summary{background:#f9fafb;padding:20px;border-radius:8px;margin-bottom:30px}.footer{text-align:center;color:#666;font-size:11px;border-top:1px solid #e5e7eb;padding-top:20px;margin-top:40px}</style></head><body><div class="header"><h1>LABORATORY TEST REPORT</h1><p>Hematology Department</p></div><div class="info-section"><div><span class="info-label">Accession</span><p class="info-value">${sample.accession_number}</p></div><div><span class="info-label">Patient</span><p class="info-value">${sample.patient_name}</p></div><div><span class="info-label">Test</span><p class="info-value">${test.test_name}</p></div><div><span class="info-label">Date</span><p class="info-value">${formatDate(test.order_date)}</p></div></div>${flaggedCount > 0 ? `<div class="summary" style="background:#fef3c7;border-left:4px solid #f59e0b"><h3 style="color:#92400e">⚠️ Clinical Alert</h3><p style="color:#92400e">${flaggedCount} abnormal result(s) found.</p></div>` : ''}<table class="results-table"><thead><tr><th>Parameter</th><th>Value</th><th>Unit</th><th>Reference</th><th>Status</th></tr></thead><tbody>${results.map(r => `<tr ${r.is_flagged ? 'class="flagged"' : ''}><td><strong>${r.analyte_name}</strong></td><td><strong>${r.value}</strong></td><td>${r.unit}</td><td>${r.normal_range_low}-${r.normal_range_high}</td><td><span class="flag-badge ${r.is_flagged ? r.flag_type.toLowerCase() : 'normal'}">${r.is_flagged ? r.flag_type : 'NORMAL'}</span></td></tr>`).join('')}</tbody></table><div class="footer"><p>PathoScope LIS | ${currentDate}</p></div></body></html>`;
      const pw = window.open('', '_blank');
      pw.document.write(pdfContent);
      pw.document.close();
      setTimeout(() => pw.print(), 250);
    } finally { setGeneratingPDF(null); }
  };

  return (
    <div className="results-view">
      <div className="results-filters">
        <div className="filter-group">
          <label className="filter-label"><Filter size={16} /> Type:</label>
          <div className="filter-buttons">
            <button className={`filter-btn ${filterType === 'all' ? 'active' : ''}`} onClick={() => setFilterType('all')}>All ({testOrders.length})</button>
            <button className={`filter-btn ${filterType === 'hematology' ? 'active' : ''}`} onClick={() => setFilterType('hematology')}>Hematology ({testOrders.filter(t => t.test_type === 'hematology').length})</button>
            <button className={`filter-btn ${filterType === 'pathology' ? 'active' : ''}`} onClick={() => setFilterType('pathology')}>Pathology ({testOrders.filter(t => t.test_type === 'pathology').length})</button>
          </div>
        </div>
        <div className="filter-group">
          <label className="filter-label">Status:</label>
          <div className="filter-buttons">
            <button className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`} onClick={() => setFilterStatus('all')}>All ({testOrders.length})</button>
            <button className={`filter-btn ${filterStatus === 'ready' ? 'active' : ''}`} onClick={() => setFilterStatus('ready')}>Ready ({readyCount})</button>
            <button className={`filter-btn ${filterStatus === 'pending' ? 'active' : ''}`} onClick={() => setFilterStatus('pending')}>Pending ({pendingCount})</button>
          </div>
        </div>
      </div>

      <div className="results-summary"><p className="results-count">Showing <strong>{sortedTests.length}</strong> results</p></div>

      {sortedTests.length === 0 ? (
        <div className="empty-state"><FileText size={48} className="empty-icon" /><h3>No results</h3><p>No tests match your filters.</p></div>
      ) : (
        <div className="test-list">
          {sortedTests.map(test => {
            const isExpanded = expandedTest === test.id;
            const isReady = isReadyStatus(test.status);
            const sample = sampleByTestOrder[test.id];
            const results = testResults[test.id];
            const loading = loadingResults[test.id];
            const hasAbnormal = results?.some(r => r.is_flagged);

            return (
              <div key={test.id} className="test-card">
                <div className="test-card-header" onClick={() => toggleExpand(test.id)}>
                  <div className="test-info">
                    <div className={`test-icon-wrapper ${test.test_type}`}><FileText size={20} /></div>
                    <div className="test-details">
                      <div className="test-name-row"><h3 className="test-name">{test.test_name}</h3><span className="test-type-label">{test.test_type}</span></div>
                      <p className="test-date">{formatDate(test.order_date)}</p>
                    </div>
                  </div>
                  <div className="test-actions">
                    <span className={`status-badge ${isReady ? 'ready' : 'pending'}`}>{test.status}</span>
                    <button className="expand-btn">{isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="test-card-content">
                    {!isReady ? <div className="processing-state"><p>Processing...</p></div> : (
                      <>
                        {hasAbnormal && <div style={{padding:'1rem',background:'#fef3c7',border:'1px solid #fde68a',borderRadius:'8px',marginBottom:'1rem',display:'flex',gap:'0.75rem'}}><AlertCircle size={20} color="#f59e0b" /><p style={{margin:0,fontSize:'0.875rem',color:'#92400e'}}><strong>Alert:</strong> {results.filter(r => r.is_flagged).length} abnormal result(s).</p></div>}
                        
                        {test.test_type === 'hematology' && sample && (
                          loading ? <div style={{textAlign:'center',padding:'2rem',color:'#6b7280'}}>Loading...</div> : results?.length > 0 ? (
                            <>
                              <div style={{display:'flex',justifyContent:'flex-end',marginBottom:'1rem'}}>
                                <button onClick={() => generateHematologyPDF(test, sample, results)} disabled={generatingPDF === test.id} className="btn-download"><Download size={18} />{generatingPDF === test.id ? 'Generating...' : 'Download PDF'}</button>
                              </div>
                              <div className="results-table-wrapper">
                                <table className="results-table">
                                  <thead><tr><th>PARAMETER</th><th>VALUE</th><th>UNIT</th><th>REFERENCE</th><th>STATUS</th></tr></thead>
                                  <tbody>{results.map(r => <tr key={r.id} className={r.is_flagged ? 'abnormal' : ''}><td className="param-name">{r.analyte_name}</td><td className="param-value">{r.value}</td><td className="param-unit">{r.unit}</td><td className="param-reference">{r.normal_range_low}-{r.normal_range_high}</td><td className="param-status">{r.is_flagged ? <span className="status-abnormal"><AlertCircle size={14} /> {r.flag_type}</span> : <span className="status-normal">Normal</span>}</td></tr>)}</tbody>
                                </table>
                              </div>
                            </>
                          ) : <p style={{textAlign:'center',color:'#9ca3af',padding:'2rem'}}>No results</p>
                        )}

                        {test.test_type === 'pathology' && (
                          <div className="all-results-actions">
                            {test.report_url && <><button className="btn-action primary" onClick={() => window.open(test.report_url, '_blank')}><Eye size={18} /> View</button><button className="btn-action secondary" onClick={() => window.open(test.report_url, '_blank')}><Download size={18} /> Download</button></>}
                            {test.slide_url && <button className="btn-action secondary" onClick={() => window.open(test.slide_url, '_blank')}><Eye size={18} /> Slides</button>}
                            {!test.report_url && !test.slide_url && <p className="no-actions">Not available</p>}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
