import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPrint, faArrowLeft, faCheck, faSpinner } from '@fortawesome/free-solid-svg-icons';

const PathologyReport = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [caseData, setCaseData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [finalizing, setFinalizing] = useState(false);

    useEffect(() => {
        fetchCase();
    }, [id]);

    const fetchCase = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/pathology/list/`, {
                headers: { 'Authorization': `Token ${token}` }
            });
            const data = await res.json();
            const current = data.find(c => c.id === parseInt(id));
            setCaseData(current);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleFinalize = async () => {
        if (!window.confirm('Are you sure you want to finalize this report? This action cannot be undone and the report will be sent to the patient.')) {
            return;
        }

        setFinalizing(true);
        const token = localStorage.getItem('token');
        
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/pathology/case/${id}/finalize/`, {
                method: 'POST',
                headers: { 'Authorization': `Token ${token}` }
            });

            if (response.ok) {
                alert("✅ Report finalized successfully!\n\nThe report has been locked and made available to the patient.");
                navigate('/pathology');
            } else {
                const errorData = await response.json();
                alert(`❌ Error: ${errorData.error || 'Failed to finalize report'}`);
            }
        } catch (e) {
            console.error(e);
            alert("Network Error: Could not finalize report");
        } finally {
            setFinalizing(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
                <FontAwesomeIcon icon={faSpinner} spin size="3x" color="#5B65DC" />
                <p style={{ marginTop: '1rem', color: '#6b7280' }}>Loading report...</p>
            </div>
        );
    }

    if (!caseData) {
        return (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
                <p style={{ color: '#ef4444' }}>Report not found.</p>
            </div>
        );
    }

    return (
        <div style={{ backgroundColor: '#f0f2f5', minHeight: '100vh', padding: '40px', display: 'flex', justifyContent: 'center' }}>

            {/* CONTROLS (Hidden when printing) */}
            <div className="no-print" style={{
                position: 'fixed',
                top: '20px',
                right: '20px',
                display: 'flex',
                gap: '12px',
                zIndex: 1000
            }}>
                <button
                    onClick={() => navigate(`/pathology/viewer/${id}`)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 20px',
                        backgroundColor: 'white',
                        color: '#6b7280',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '14px',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#f9fafb';
                        e.currentTarget.style.borderColor = '#122056';
                        e.currentTarget.style.color = '#122056';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.color = '#6b7280';
                    }}
                >
                    <FontAwesomeIcon icon={faArrowLeft} />
                    Back to Viewer
                </button>

                <button
                    onClick={handlePrint}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 20px',
                        backgroundColor: '#122056',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '14px',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#1e293b';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(18, 32, 86, 0.3)';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = '#122056';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                    }}
                >
                    <FontAwesomeIcon icon={faPrint} />
                    Print / Save PDF
                </button>

                {!caseData.is_finalized ? (
                    <button
                        onClick={handleFinalize}
                        disabled={finalizing}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '12px 24px',
                            backgroundColor: finalizing ? '#cbd5e0' : '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: finalizing ? 'not-allowed' : 'pointer',
                            fontWeight: '600',
                            fontSize: '14px',
                            transition: 'all 0.2s ease',
                            boxShadow: finalizing ? 'none' : '0 1px 3px rgba(0,0,0,0.1)',
                            opacity: finalizing ? 0.7 : 1
                        }}
                        onMouseOver={(e) => {
                            if (!finalizing) {
                                e.currentTarget.style.backgroundColor = '#059669';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                            }
                        }}
                        onMouseOut={(e) => {
                            if (!finalizing) {
                                e.currentTarget.style.backgroundColor = '#10b981';
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                            }
                        }}
                    >
                        {finalizing ? (
                            <>
                                <FontAwesomeIcon icon={faSpinner} spin />
                                Finalizing...
                            </>
                        ) : (
                            <>
                                <FontAwesomeIcon icon={faCheck} />
                                Finalize & Send to Patient
                            </>
                        )}
                    </button>
                ) : (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 20px',
                        backgroundColor: '#d1fae5',
                        color: '#065f46',
                        border: '1px solid #6ee7b7',
                        borderRadius: '8px',
                        fontWeight: '600',
                        fontSize: '14px'
                    }}>
                        <FontAwesomeIcon icon={faCheck} />
                        Report Finalized
                    </div>
                )}
            </div>

            {/* THE REPORT PAPER */}
            <div id="print-area" style={{
                width: '210mm',
                minHeight: '297mm',
                backgroundColor: 'white',
                padding: '40px',
                boxShadow: '0 0 15px rgba(0,0,0,0.1)',
                color: '#333',
                fontFamily: 'Arial, sans-serif'
            }}>
                {/* Header */}
                <div style={{
                    borderBottom: '3px solid #122056',
                    paddingBottom: '20px',
                    marginBottom: '30px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div>
                        <h1 style={{ margin: '10px 0 0 0', color: '#122056', fontSize: '24px' }}>
                            PATHOLOGY DEPARTMENT
                        </h1>
                        <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                            Histopathology Examination Report
                        </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <h3 style={{ margin: 0, color: '#122056' }}>FINAL REPORT</h3>
                        <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>
                            Report Date: {new Date().toLocaleDateString()}
                        </p>
                        {caseData.is_finalized && (
                            <div style={{
                                marginTop: '8px',
                                padding: '4px 12px',
                                backgroundColor: '#d1fae5',
                                color: '#065f46',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: '600',
                                display: 'inline-block'
                            }}>
                                ✓ FINALIZED
                            </div>
                        )}
                    </div>
                </div>

                {/* Patient Info Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '20px',
                    marginBottom: '30px',
                    backgroundColor: '#f8f9fa',
                    padding: '20px',
                    borderRadius: '8px'
                }}>
                    <div>
                        <p style={{ margin: '5px 0', fontSize: '12px', color: '#888', textTransform: 'uppercase' }}>
                            Patient Name
                        </p>
                        <p style={{ margin: 0, fontWeight: 'bold', fontSize: '16px' }}>
                            {caseData.patient_name || 'N/A'}
                        </p>
                    </div>
                    <div>
                        <p style={{ margin: '5px 0', fontSize: '12px', color: '#888', textTransform: 'uppercase' }}>
                            Accession Number
                        </p>
                        <p style={{ margin: 0, fontWeight: 'bold', fontSize: '16px' }}>
                            {caseData.accession_number || `PATH-${caseData.id}`}
                        </p>
                    </div>
                    <div>
                        <p style={{ margin: '5px 0', fontSize: '12px', color: '#888', textTransform: 'uppercase' }}>
                            Sample Collected
                        </p>
                        <p style={{ margin: 0, fontWeight: 'bold' }}>
                            {new Date(caseData.uploaded_at).toLocaleDateString()}
                        </p>
                    </div>
                    <div>
                        <p style={{ margin: '5px 0', fontSize: '12px', color: '#888', textTransform: 'uppercase' }}>
                            Barcode
                        </p>
                        <p style={{ margin: 0, fontWeight: 'bold', fontFamily: 'monospace' }}>
                            {caseData.barcode || 'N/A'}
                        </p>
                    </div>
                </div>

                {/* ICD-10 DIAGNOSIS */}
                {caseData.icd_code && (
                    <div style={{
                        marginBottom: '30px',
                        padding: '20px',
                        backgroundColor: '#eef2ff',
                        border: '2px solid #c7d2fe',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '24px'
                    }}>
                        <div>
                            <span style={{
                                fontSize: '12px',
                                color: '#6b7280',
                                textTransform: 'uppercase',
                                display: 'block',
                                marginBottom: '4px',
                                fontWeight: '600',
                                letterSpacing: '0.5px'
                            }}>
                                ICD-10 Code
                            </span>
                            <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626' }}>
                                {caseData.icd_code}
                            </span>
                        </div>
                        <div style={{ borderLeft: '2px solid #c7d2fe', paddingLeft: '24px', flex: 1 }}>
                            <span style={{
                                fontSize: '12px',
                                color: '#6b7280',
                                textTransform: 'uppercase',
                                display: 'block',
                                marginBottom: '4px',
                                fontWeight: '600',
                                letterSpacing: '0.5px'
                            }}>
                                Diagnosis
                            </span>
                            <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#122056' }}>
                                {caseData.icd_description || "See findings below"}
                            </span>
                        </div>
                    </div>
                )}

                {/* The Slide Image */}
                {caseData.image_preview && (
                    <div style={{ marginBottom: '30px', border: '1px solid #ddd', padding: '8px', borderRadius: '4px' }}>
                        <p style={{ margin: '0 0 12px 0', fontWeight: 'bold', color: '#122056', fontSize: '14px' }}>
                            Microscopic View:
                        </p>
                        <img
                            src={`http://127.0.0.1:8000${caseData.image_preview}`}
                            alt="Biopsy Slide"
                            style={{
                                width: '100%',
                                maxHeight: '400px',
                                objectFit: 'contain',
                                backgroundColor: '#000',
                                borderRadius: '4px'
                            }}
                        />
                    </div>
                )}

                {/* Diagnostic Findings */}
                <div style={{ marginBottom: '40px' }}>
                    <h3 style={{
                        color: '#122056',
                        borderBottom: '2px solid #e5e7eb',
                        paddingBottom: '12px',
                        marginBottom: '16px',
                        fontSize: '18px'
                    }}>
                        Microscopic Examination & Findings
                    </h3>
                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', fontSize: '15px', color: '#1a1a1a' }}>
                        {caseData.pathologist_notes || caseData.doctor_notes || "No findings recorded."}
                    </div>
                </div>

                {/* Signature */}
                <div style={{ marginTop: '60px', display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={{ textAlign: 'center', width: '250px' }}>
                        <div style={{
                            borderBottom: '2px solid #333',
                            marginBottom: '12px',
                            height: '50px',
                            display: 'flex',
                            alignItems: 'flex-end',
                            justifyContent: 'center',
                            paddingBottom: '8px'
                        }}>
                            {caseData.finalized_by_name && (
                                <span style={{ fontStyle: 'italic', color: '#666', fontSize: '14px' }}>
                                    Electronically Signed
                                </span>
                            )}
                        </div>
                        <p style={{ margin: 0, fontWeight: 'bold', fontSize: '14px' }}>
                            {caseData.finalized_by_name ? `Dr. ${caseData.finalized_by_name}` : 'Pathologist Signature'}
                        </p>
                        <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#666' }}>
                            Licensed Pathologist
                        </p>
                        {caseData.finalized_date && (
                            <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#999' }}>
                                Signed: {new Date(caseData.finalized_date).toLocaleString()}
                            </p>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    marginTop: '50px',
                    paddingTop: '20px',
                    borderTop: '1px solid #e5e7eb',
                    textAlign: 'center',
                    fontSize: '11px',
                    color: '#999'
                }}>
                    <p style={{ margin: '0 0 8px 0' }}>
                        This is a{caseData.is_finalized ? ' finalized and legally binding' : 'n unfinalized'} pathology report.
                        {!caseData.is_finalized && ' This draft is not valid for clinical use.'}
                    </p>
                    <p style={{ margin: '0 0 8px 0' }}>
                        <strong>PathoScope</strong> Laboratory Information System | Generated: {new Date().toLocaleString()}
                    </p>
                    <p style={{ margin: 0, fontSize: '10px' }}>
                        <strong>CONFIDENTIAL:</strong> This report contains protected health information.
                    </p>
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background-color: white; margin: 0; }
                    #print-area { 
                        box-shadow: none; 
                        padding: 20mm; 
                        width: 100%; 
                        margin: 0; 
                        min-height: auto;
                    }
                    @page { 
                        margin: 0;
                        size: A4;
                    }
                }
            `}</style>
        </div>
    );
};

export default PathologyReport;