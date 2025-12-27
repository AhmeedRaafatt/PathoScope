import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPrint, faArrowLeft, faSpinner, faExclamationTriangle, faDownload, faCheck } from '@fortawesome/free-solid-svg-icons';
import { getToken } from '../../utls';

const PatientPathologyReport = () => {
    const { caseId } = useParams();
    const navigate = useNavigate();
    const [caseData, setCaseData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchCase();
    }, [caseId]);

    const fetchCase = async () => {
        const token = getToken();
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const res = await fetch(`http://127.0.0.1:8000/api/patient-portal/pathology-case/${caseId}/`, {
                headers: { 'Authorization': `Token ${token}` }
            });
            
            if (res.ok) {
                const data = await res.json();
                setCaseData(data);
            } else {
                const errData = await res.json();
                setError(errData.error || 'Failed to load report');
            }
        } catch (e) {
            console.error(e);
            setError('Network error: Could not load report');
        } finally {
            setLoading(false);
        }
    };

    // Parse structured findings from notes
    const parseFindings = (notes) => {
        if (!notes) return null;
        
        const sections = {
            grossDescription: '',
            microscopicFindings: '',
            diagnosis: '',
            comments: '',
            recommendations: ''
        };
        
        const grossMatch = notes.match(/(?:GROSS|Gross Description|SPECIMEN)[\s:]*([^]*?)(?=MICROSCOPIC|Microscopic|DIAGNOSIS|$)/i);
        const microMatch = notes.match(/(?:MICROSCOPIC|Microscopic Findings?)[\s:]*([^]*?)(?=DIAGNOSIS|COMMENT|RECOMMENDATION|$)/i);
        const diagMatch = notes.match(/(?:DIAGNOSIS|IMPRESSION)[\s:]*([^]*?)(?=COMMENT|RECOMMENDATION|Note:|$)/i);
        const commentMatch = notes.match(/(?:COMMENT|Note)[\s:]*([^]*?)(?=RECOMMENDATION|$)/i);
        const recoMatch = notes.match(/(?:RECOMMENDATION)[\s:]*([^]*?)$/i);
        
        if (grossMatch) sections.grossDescription = grossMatch[1].trim();
        if (microMatch) sections.microscopicFindings = microMatch[1].trim();
        if (diagMatch) sections.diagnosis = diagMatch[1].trim();
        if (commentMatch) sections.comments = commentMatch[1].trim();
        if (recoMatch) sections.recommendations = recoMatch[1].trim();
        
        if (!sections.grossDescription && !sections.microscopicFindings && !sections.diagnosis) {
            sections.microscopicFindings = notes;
        }
        
        return sections;
    };

    // Get urgency based on ICD code
    const getUrgencyLevel = (icdCode) => {
        if (!icdCode) return null;
        const code = icdCode.toUpperCase();
        if (code.startsWith('C')) return { level: 'critical', label: 'MALIGNANT - URGENT', color: '#dc2626' };
        if (code.startsWith('D0') || code.startsWith('D1') || code.startsWith('D2') || code.startsWith('D3')) {
            return { level: 'moderate', label: 'NEOPLASM - FOLLOW-UP RECOMMENDED', color: '#f59e0b' };
        }
        if (code.startsWith('D4') || code.startsWith('D5') || code.startsWith('D6') || code.startsWith('D7') || code.startsWith('D8') || code.startsWith('D9')) {
            return { level: 'moderate', label: 'IN-SITU / UNCERTAIN - MONITORING REQUIRED', color: '#f59e0b' };
        }
        return { level: 'normal', label: 'ROUTINE FINDINGS', color: '#10b981' };
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div style={{ 
                padding: '3rem', 
                textAlign: 'center',
                minHeight: '60vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f9fafb'
            }}>
                <FontAwesomeIcon icon={faSpinner} spin size="3x" color="#5B65DC" />
                <p style={{ marginTop: '1rem', color: '#6b7280' }}>Loading your report...</p>
            </div>
        );
    }

    if (error || !caseData) {
        return (
            <div style={{ 
                padding: '3rem', 
                textAlign: 'center',
                minHeight: '60vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f9fafb'
            }}>
                <FontAwesomeIcon icon={faExclamationTriangle} size="3x" color="#ef4444" />
                <p style={{ marginTop: '1rem', color: '#ef4444', fontWeight: 600 }}>
                    {error || 'Report not found or not yet finalized'}
                </p>
                <button 
                    onClick={() => navigate('/patient/results/pathology')}
                    style={{
                        marginTop: '1rem',
                        padding: '0.75rem 1.5rem',
                        background: '#122056',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 500
                    }}
                >
                    Back to Results
                </button>
            </div>
        );
    }

    const findings = parseFindings(caseData.pathologist_notes);
    const urgency = getUrgencyLevel(caseData.icd_code);

    return (
        <div style={{ backgroundColor: '#f0f2f5', minHeight: '100vh', padding: '40px', display: 'flex', justifyContent: 'center' }}>

            {/* CONTROLS (Hidden when printing) */}
            <div className="no-print" style={{
                position: 'fixed',
                top: '100px',
                right: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                zIndex: 1000
            }}>
                <button
                    onClick={() => navigate('/patient/results/pathology')}
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
                    Back to Results
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
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = '#122056';
                        e.currentTarget.style.transform = 'translateY(0)';
                    }}
                >
                    <FontAwesomeIcon icon={faPrint} />
                    Print / Save PDF
                </button>

                {caseData.report_pdf_url && (
                    <a
                        href={caseData.report_pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '12px 20px',
                            backgroundColor: '#5B65DC',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '14px',
                            textDecoration: 'none',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}
                    >
                        <FontAwesomeIcon icon={faDownload} />
                        Download PDF
                    </a>
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
                {/* Header with Logo Area */}
                <div style={{
                    borderBottom: '4px solid #122056',
                    paddingBottom: '20px',
                    marginBottom: '24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start'
                }}>
                    <div>
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '12px',
                            marginBottom: '8px'
                        }}>
                            <div style={{
                                width: '50px',
                                height: '50px',
                                backgroundColor: '#122056',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '20px'
                            }}>
                                PS
                            </div>
                            <div>
                                <h1 style={{ margin: 0, color: '#122056', fontSize: '22px', letterSpacing: '1px' }}>
                                    PATHOSCOPE LABORATORY
                                </h1>
                                <p style={{ margin: 0, color: '#666', fontSize: '12px' }}>
                                    Department of Anatomic Pathology & Clinical Diagnostics
                                </p>
                            </div>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{
                            backgroundColor: '#122056',
                            color: 'white',
                            padding: '8px 16px',
                            borderRadius: '4px',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            letterSpacing: '1px',
                            marginBottom: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}>
                            <FontAwesomeIcon icon={faCheck} />
                            FINAL REPORT
                        </div>
                        <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                            Report Date: <strong>{caseData.finalized_date ? new Date(caseData.finalized_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</strong>
                        </p>
                        <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#999' }}>
                            Case ID: {caseData.accession_number || `PATH-${String(caseData.id).padStart(6, '0')}`}
                        </p>
                    </div>
                </div>

                {/* Urgency Alert Banner */}
                {urgency && urgency.level !== 'normal' && (
                    <div style={{
                        backgroundColor: urgency.level === 'critical' ? '#fef2f2' : '#fffbeb',
                        border: `2px solid ${urgency.color}`,
                        borderRadius: '8px',
                        padding: '12px 20px',
                        marginBottom: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <FontAwesomeIcon 
                            icon={faExclamationTriangle} 
                            style={{ color: urgency.color, fontSize: '20px' }}
                        />
                        <div>
                            <p style={{ margin: 0, fontWeight: 'bold', color: urgency.color, fontSize: '14px' }}>
                                {urgency.label}
                            </p>
                            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#666' }}>
                                {urgency.level === 'critical' 
                                    ? 'Please consult with your physician immediately regarding treatment options.'
                                    : 'Follow-up examination and monitoring is recommended.'}
                            </p>
                        </div>
                    </div>
                )}

                {/* Patient & Clinical Information */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '24px',
                    marginBottom: '24px'
                }}>
                    {/* Patient Info Box */}
                    <div style={{
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '16px'
                    }}>
                        <h3 style={{ 
                            margin: '0 0 12px 0', 
                            fontSize: '12px', 
                            color: '#64748b', 
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            borderBottom: '1px solid #e2e8f0',
                            paddingBottom: '8px'
                        }}>
                            Patient Information
                        </h3>
                        <div style={{ display: 'grid', gap: '8px' }}>
                            <div>
                                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Full Name</span>
                                <p style={{ margin: 0, fontWeight: 'bold', fontSize: '15px', color: '#1e293b' }}>
                                    {caseData.patient_name || 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Specimen Info Box */}
                    <div style={{
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '16px'
                    }}>
                        <h3 style={{ 
                            margin: '0 0 12px 0', 
                            fontSize: '12px', 
                            color: '#64748b', 
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            borderBottom: '1px solid #e2e8f0',
                            paddingBottom: '8px'
                        }}>
                            Specimen Information
                        </h3>
                        <div style={{ display: 'grid', gap: '8px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>Accession #</span>
                                    <p style={{ margin: 0, fontWeight: 'bold', fontSize: '14px', color: '#122056', fontFamily: 'monospace' }}>
                                        {caseData.accession_number || `PATH-${String(caseData.id).padStart(6, '0')}`}
                                    </p>
                                </div>
                                <div>
                                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>Collection Date</span>
                                    <p style={{ margin: 0, fontWeight: '500', fontSize: '13px' }}>
                                        {caseData.uploaded_at ? new Date(caseData.uploaded_at).toLocaleDateString() : 'N/A'}
                                    </p>
                                </div>
                            </div>
                            <div>
                                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Body Site</span>
                                <p style={{ margin: 0, fontWeight: '500', fontSize: '13px' }}>
                                    {caseData.body_part_examined || 'Not specified'}
                                </p>
                            </div>
                            {caseData.is_volume && (
                                <div>
                                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>Study Type</span>
                                    <p style={{ margin: 0, fontWeight: '500', fontSize: '13px' }}>
                                        {caseData.modality || 'MR'} - {caseData.series_description || 'Volume Study'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* DIAGNOSIS BOX - Most Important */}
                {caseData.icd_code && (
                    <div style={{
                        marginBottom: '24px',
                        padding: '20px',
                        backgroundColor: urgency?.level === 'critical' ? '#fef2f2' : urgency?.level === 'moderate' ? '#fffbeb' : '#f0fdf4',
                        border: `2px solid ${urgency?.color || '#10b981'}`,
                        borderRadius: '8px',
                        borderLeft: `6px solid ${urgency?.color || '#10b981'}`
                    }}>
                        <h3 style={{ 
                            margin: '0 0 16px 0', 
                            fontSize: '14px', 
                            color: '#122056',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <span style={{
                                backgroundColor: '#122056',
                                color: 'white',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '11px'
                            }}>
                                DIAGNOSIS
                            </span>
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px' }}>
                            <div style={{
                                backgroundColor: 'white',
                                padding: '12px 20px',
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb',
                                textAlign: 'center',
                                minWidth: '120px'
                            }}>
                                <span style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                                    ICD-10 Code
                                </span>
                                <span style={{ 
                                    fontSize: '28px', 
                                    fontWeight: 'bold', 
                                    color: urgency?.color || '#122056',
                                    fontFamily: 'monospace'
                                }}>
                                    {caseData.icd_code}
                                </span>
                            </div>
                            <div style={{ flex: 1 }}>
                                <span style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                                    Clinical Diagnosis
                                </span>
                                <p style={{ 
                                    margin: 0, 
                                    fontSize: '18px', 
                                    fontWeight: 'bold', 
                                    color: '#1e293b',
                                    lineHeight: '1.4'
                                }}>
                                    {caseData.icd_description || findings?.diagnosis || "See microscopic findings"}
                                </p>
                                {urgency && (
                                    <p style={{ 
                                        margin: '8px 0 0 0', 
                                        fontSize: '12px', 
                                        color: urgency.color,
                                        fontWeight: '600'
                                    }}>
                                        Clinical Priority: {urgency.label}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Representative Image */}
                {caseData.image_preview_url && (
                    <div style={{ marginBottom: '24px' }}>
                        <h3 style={{ 
                            margin: '0 0 16px 0', 
                            fontSize: '14px', 
                            color: '#122056',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            borderBottom: '2px solid #e5e7eb',
                            paddingBottom: '8px'
                        }}>
                            📸 Representative Image
                        </h3>
                        <div style={{ 
                            border: '1px solid #e5e7eb', 
                            borderRadius: '8px', 
                            overflow: 'hidden',
                            maxWidth: '400px'
                        }}>
                            <img 
                                src={caseData.image_preview_url} 
                                alt="Pathology specimen"
                                style={{ 
                                    width: '100%', 
                                    height: 'auto',
                                    display: 'block'
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Clinical Findings */}
                <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ 
                        margin: '0 0 16px 0', 
                        fontSize: '14px', 
                        color: '#122056',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        borderBottom: '2px solid #e5e7eb',
                        paddingBottom: '8px'
                    }}>
                        📋 Clinical Findings
                    </h3>

                    {/* Gross Description */}
                    {findings?.grossDescription && (
                        <div style={{ marginBottom: '16px' }}>
                            <h4 style={{ 
                                margin: '0 0 8px 0', 
                                fontSize: '13px', 
                                color: '#374151',
                                fontWeight: '600'
                            }}>
                                Gross Description
                            </h4>
                            <p style={{ 
                                margin: 0, 
                                fontSize: '14px', 
                                color: '#4b5563',
                                lineHeight: '1.6',
                                backgroundColor: '#f9fafb',
                                padding: '12px',
                                borderRadius: '6px',
                                border: '1px solid #e5e7eb'
                            }}>
                                {findings.grossDescription}
                            </p>
                        </div>
                    )}

                    {/* Microscopic Findings */}
                    {findings?.microscopicFindings && (
                        <div style={{ marginBottom: '16px' }}>
                            <h4 style={{ 
                                margin: '0 0 8px 0', 
                                fontSize: '13px', 
                                color: '#374151',
                                fontWeight: '600'
                            }}>
                                Microscopic Findings
                            </h4>
                            <p style={{ 
                                margin: 0, 
                                fontSize: '14px', 
                                color: '#4b5563',
                                lineHeight: '1.6',
                                backgroundColor: '#f9fafb',
                                padding: '12px',
                                borderRadius: '6px',
                                border: '1px solid #e5e7eb',
                                whiteSpace: 'pre-wrap'
                            }}>
                                {findings.microscopicFindings}
                            </p>
                        </div>
                    )}

                    {/* Comments */}
                    {findings?.comments && (
                        <div style={{ marginBottom: '16px' }}>
                            <h4 style={{ 
                                margin: '0 0 8px 0', 
                                fontSize: '13px', 
                                color: '#374151',
                                fontWeight: '600'
                            }}>
                                Comments
                            </h4>
                            <p style={{ 
                                margin: 0, 
                                fontSize: '14px', 
                                color: '#4b5563',
                                lineHeight: '1.6',
                                backgroundColor: '#fef3c7',
                                padding: '12px',
                                borderRadius: '6px',
                                border: '1px solid #fcd34d'
                            }}>
                                {findings.comments}
                            </p>
                        </div>
                    )}

                    {/* Recommendations */}
                    {findings?.recommendations && (
                        <div style={{ marginBottom: '16px' }}>
                            <h4 style={{ 
                                margin: '0 0 8px 0', 
                                fontSize: '13px', 
                                color: '#374151',
                                fontWeight: '600'
                            }}>
                                Recommendations
                            </h4>
                            <p style={{ 
                                margin: 0, 
                                fontSize: '14px', 
                                color: '#4b5563',
                                lineHeight: '1.6',
                                backgroundColor: '#dbeafe',
                                padding: '12px',
                                borderRadius: '6px',
                                border: '1px solid #93c5fd'
                            }}>
                                {findings.recommendations}
                            </p>
                        </div>
                    )}

                    {/* If no structured findings, show raw notes */}
                    {!findings?.grossDescription && !findings?.microscopicFindings && !findings?.diagnosis && caseData.pathologist_notes && (
                        <div style={{ marginBottom: '16px' }}>
                            <p style={{ 
                                margin: 0, 
                                fontSize: '14px', 
                                color: '#4b5563',
                                lineHeight: '1.6',
                                backgroundColor: '#f9fafb',
                                padding: '12px',
                                borderRadius: '6px',
                                border: '1px solid #e5e7eb',
                                whiteSpace: 'pre-wrap'
                            }}>
                                {caseData.pathologist_notes}
                            </p>
                        </div>
                    )}
                </div>

                {/* Signature Section */}
                <div style={{
                    borderTop: '2px solid #e5e7eb',
                    paddingTop: '24px',
                    marginTop: '24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end'
                }}>
                    <div>
                        <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b' }}>Reviewed and Signed by:</p>
                        <p style={{ 
                            margin: 0, 
                            fontSize: '16px', 
                            fontWeight: 'bold', 
                            color: '#122056',
                            borderBottom: '2px solid #122056',
                            paddingBottom: '4px'
                        }}>
                            Dr. {caseData.finalized_by_name || 'Attending Pathologist'}
                        </p>
                        <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>
                            Board Certified Pathologist
                        </p>
                    </div>
                    
                    <div style={{ textAlign: 'right' }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            backgroundColor: '#d1fae5',
                            color: '#065f46',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600'
                        }}>
                            <FontAwesomeIcon icon={faCheck} />
                            Electronically signed: {caseData.finalized_date ? new Date(caseData.finalized_date).toLocaleString() : 'N/A'}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    marginTop: '40px',
                    paddingTop: '16px',
                    borderTop: '1px solid #e5e7eb',
                    textAlign: 'center',
                    fontSize: '10px',
                    color: '#9ca3af'
                }}>
                    <p style={{ margin: 0 }}>
                        This is a <strong>FINALIZED</strong> and legally binding pathology report.
                    </p>
                    <p style={{ margin: '4px 0 0 0' }}>
                        PathOScope Laboratory • Confidential Medical Document • Generated on {new Date().toLocaleString()}
                    </p>
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    .no-print {
                        display: none !important;
                    }
                    body {
                        background: white !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    #print-area {
                        box-shadow: none !important;
                        margin: 0 !important;
                        padding: 20mm !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default PatientPathologyReport;
