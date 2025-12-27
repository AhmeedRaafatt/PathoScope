import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPrint, faArrowLeft, faCheck, faSpinner, faExclamationTriangle, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { getToken } from '../../utls';

const PathologyReport = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [caseData, setCaseData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [finalizing, setFinalizing] = useState(false);
    const [mprSlices, setMprSlices] = useState({ axial: null, sagittal: null, coronal: null });
    const [volumeInfo, setVolumeInfo] = useState(null);

    useEffect(() => {
        fetchCase();
    }, [id]);

    const fetchCase = async () => {
        const token = getToken();
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/pathology/list/`, {
                headers: { 'Authorization': `Token ${token}` }
            });
            const data = await res.json();
            const current = data.find(c => c.id === parseInt(id));
            setCaseData(current);

            // If it's a volume, fetch representative slices
            if (current?.is_volume) {
                fetchVolumeInfo(token);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchVolumeInfo = async (token) => {
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/pathology/case/${id}/mpr/info/`, {
                headers: { 'Authorization': `Token ${token}` }
            });
            if (response.ok) {
                const info = await response.json();
                setVolumeInfo(info);
                
                // Fetch middle slices for each plane
                if (info.status === 'ready') {
                    const middleAxial = Math.floor(info.dimensions.axial / 2);
                    const middleSagittal = Math.floor(info.dimensions.sagittal / 2);
                    const middleCoronal = Math.floor(info.dimensions.coronal / 2);
                    
                    // Fetch representative slices
                    fetchSlice('axial', middleAxial, token);
                    fetchSlice('sagittal', middleSagittal, token);
                    fetchSlice('coronal', middleCoronal, token);
                }
            }
        } catch (e) {
            console.error('Failed to fetch volume info:', e);
        }
    };

    const fetchSlice = async (plane, index, token) => {
        try {
            const url = `http://127.0.0.1:8000/api/pathology/case/${id}/mpr/slice/?plane=${plane}&index=${index}&wc=50&ww=400`;
            const response = await fetch(url, {
                headers: { 'Authorization': `Token ${token}` }
            });
            if (response.ok) {
                const blob = await response.blob();
                const imageUrl = URL.createObjectURL(blob);
                setMprSlices(prev => ({ ...prev, [plane]: imageUrl }));
            }
        } catch (e) {
            console.error(`Failed to fetch ${plane} slice:`, e);
        }
    };

    const handleFinalize = async () => {
        if (!window.confirm('Are you sure you want to finalize this report? This action cannot be undone and the report will be sent to the patient.')) {
            return;
        }

        setFinalizing(true);
        const token = getToken();
        
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
        
        // Try to extract structured sections if present
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
        
        // If no structured sections found, put everything in microscopic findings
        if (!sections.grossDescription && !sections.microscopicFindings && !sections.diagnosis) {
            sections.microscopicFindings = notes;
        }
        
        return sections;
    };

    // Get urgency based on ICD code
    const getUrgencyLevel = (icdCode) => {
        if (!icdCode) return null;
        const code = icdCode.toUpperCase();
        // Malignant neoplasms
        if (code.startsWith('C')) return { level: 'critical', label: 'MALIGNANT - URGENT', color: '#dc2626' };
        // Benign neoplasms
        if (code.startsWith('D0') || code.startsWith('D1') || code.startsWith('D2') || code.startsWith('D3')) {
            return { level: 'moderate', label: 'NEOPLASM - FOLLOW-UP RECOMMENDED', color: '#f59e0b' };
        }
        // In-situ neoplasms
        if (code.startsWith('D4') || code.startsWith('D5') || code.startsWith('D6') || code.startsWith('D7') || code.startsWith('D8') || code.startsWith('D9')) {
            return { level: 'moderate', label: 'IN-SITU / UNCERTAIN - MONITORING REQUIRED', color: '#f59e0b' };
        }
        return { level: 'normal', label: 'ROUTINE FINDINGS', color: '#10b981' };
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

    const findings = parseFindings(caseData.pathologist_notes || caseData.doctor_notes);
    const urgency = getUrgencyLevel(caseData.icd_code);

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
                            backgroundColor: caseData.is_finalized ? '#122056' : '#f59e0b',
                            color: 'white',
                            padding: '8px 16px',
                            borderRadius: '4px',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            letterSpacing: '1px',
                            marginBottom: '8px'
                        }}>
                            {caseData.is_finalized ? '✓ FINAL REPORT' : '⚠ PRELIMINARY'}
                        </div>
                        <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                            Report Date: <strong>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>
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
                                    ? 'Please consult with the attending physician immediately regarding treatment options.'
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
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>Patient ID</span>
                                    <p style={{ margin: 0, fontWeight: '500', fontSize: '13px', fontFamily: 'monospace' }}>
                                        {caseData.patient_id || caseData.patient || 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>DOB / Age</span>
                                    <p style={{ margin: 0, fontWeight: '500', fontSize: '13px' }}>
                                        {caseData.patient_dob || 'N/A'}
                                    </p>
                                </div>
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
                                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>Barcode</span>
                                    <p style={{ margin: 0, fontWeight: '500', fontSize: '13px', fontFamily: 'monospace' }}>
                                        {caseData.barcode || 'N/A'}
                                    </p>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>Collection Date</span>
                                    <p style={{ margin: 0, fontWeight: '500', fontSize: '13px' }}>
                                        {new Date(caseData.uploaded_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <div>
                                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>Body Site</span>
                                    <p style={{ margin: 0, fontWeight: '500', fontSize: '13px' }}>
                                        {caseData.body_part_examined || volumeInfo?.body_part || 'Not specified'}
                                    </p>
                                </div>
                            </div>
                            {caseData.is_volume && (
                                <div>
                                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>Study Type</span>
                                    <p style={{ margin: 0, fontWeight: '500', fontSize: '13px' }}>
                                        {caseData.modality || 'MR'} - {volumeInfo?.series_description || 'Volume Study'} ({caseData.num_slices || volumeInfo?.num_slices} slices)
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

                {/* Representative Images Section */}
                {(caseData.image_preview || (caseData.is_volume && (mprSlices.axial || mprSlices.sagittal || mprSlices.coronal))) && (
                    <div style={{ marginBottom: '24px' }}>
                        <h3 style={{ 
                            margin: '0 0 16px 0', 
                            fontSize: '14px', 
                            color: '#122056',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            borderBottom: '2px solid #e5e7eb',
                            paddingBottom: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            📸 Representative Images
                        </h3>
                        
                        {caseData.is_volume ? (
                            /* MPR Views for Volume Data */
                            <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: 'repeat(3, 1fr)', 
                                gap: '16px'
                            }}>
                                {/* Axial View */}
                                <div style={{ 
                                    border: '2px solid #22d3ee', 
                                    borderRadius: '8px', 
                                    overflow: 'hidden',
                                    backgroundColor: '#000'
                                }}>
                                    <div style={{
                                        backgroundColor: '#22d3ee',
                                        color: 'white',
                                        padding: '8px 12px',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>
                                        Axial View (Transverse)
                                    </div>
                                    {mprSlices.axial ? (
                                        <img 
                                            src={mprSlices.axial} 
                                            alt="Axial view"
                                            style={{ 
                                                width: '100%', 
                                                height: '180px', 
                                                objectFit: 'contain',
                                                backgroundColor: '#000'
                                            }}
                                        />
                                    ) : (
                                        <div style={{ 
                                            height: '180px', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            color: '#666',
                                            fontSize: '12px'
                                        }}>
                                            Loading...
                                        </div>
                                    )}
                                    <div style={{
                                        backgroundColor: '#f8fafc',
                                        padding: '6px 12px',
                                        fontSize: '10px',
                                        color: '#64748b',
                                        textAlign: 'center'
                                    }}>
                                        Slice {volumeInfo?.dimensions?.axial ? Math.floor(volumeInfo.dimensions.axial / 2) : '?'} of {volumeInfo?.dimensions?.axial || '?'}
                                    </div>
                                </div>

                                {/* Sagittal View */}
                                <div style={{ 
                                    border: '2px solid #f97316', 
                                    borderRadius: '8px', 
                                    overflow: 'hidden',
                                    backgroundColor: '#000'
                                }}>
                                    <div style={{
                                        backgroundColor: '#f97316',
                                        color: 'white',
                                        padding: '8px 12px',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>
                                        Sagittal View (Side)
                                    </div>
                                    {mprSlices.sagittal ? (
                                        <img 
                                            src={mprSlices.sagittal} 
                                            alt="Sagittal view"
                                            style={{ 
                                                width: '100%', 
                                                height: '180px', 
                                                objectFit: 'contain',
                                                backgroundColor: '#000'
                                            }}
                                        />
                                    ) : (
                                        <div style={{ 
                                            height: '180px', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            color: '#666',
                                            fontSize: '12px'
                                        }}>
                                            Loading...
                                        </div>
                                    )}
                                    <div style={{
                                        backgroundColor: '#f8fafc',
                                        padding: '6px 12px',
                                        fontSize: '10px',
                                        color: '#64748b',
                                        textAlign: 'center'
                                    }}>
                                        Slice {volumeInfo?.dimensions?.sagittal ? Math.floor(volumeInfo.dimensions.sagittal / 2) : '?'} of {volumeInfo?.dimensions?.sagittal || '?'}
                                    </div>
                                </div>

                                {/* Coronal View */}
                                <div style={{ 
                                    border: '2px solid #a855f7', 
                                    borderRadius: '8px', 
                                    overflow: 'hidden',
                                    backgroundColor: '#000'
                                }}>
                                    <div style={{
                                        backgroundColor: '#a855f7',
                                        color: 'white',
                                        padding: '8px 12px',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>
                                        Coronal View (Front)
                                    </div>
                                    {mprSlices.coronal ? (
                                        <img 
                                            src={mprSlices.coronal} 
                                            alt="Coronal view"
                                            style={{ 
                                                width: '100%', 
                                                height: '180px', 
                                                objectFit: 'contain',
                                                backgroundColor: '#000'
                                            }}
                                        />
                                    ) : (
                                        <div style={{ 
                                            height: '180px', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            color: '#666',
                                            fontSize: '12px'
                                        }}>
                                            Loading...
                                        </div>
                                    )}
                                    <div style={{
                                        backgroundColor: '#f8fafc',
                                        padding: '6px 12px',
                                        fontSize: '10px',
                                        color: '#64748b',
                                        textAlign: 'center'
                                    }}>
                                        Slice {volumeInfo?.dimensions?.coronal ? Math.floor(volumeInfo.dimensions.coronal / 2) : '?'} of {volumeInfo?.dimensions?.coronal || '?'}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Single Image for non-volume */
                            <div style={{ 
                                border: '1px solid #e5e7eb', 
                                borderRadius: '8px', 
                                overflow: 'hidden',
                                maxWidth: '500px',
                                margin: '0 auto'
                            }}>
                                <div style={{
                                    backgroundColor: '#122056',
                                    color: 'white',
                                    padding: '10px 16px',
                                    fontSize: '13px',
                                    fontWeight: 'bold'
                                }}>
                                    Microscopic Examination
                                </div>
                                <img
                                    src={`http://127.0.0.1:8000${caseData.image_preview}`}
                                    alt="Biopsy Slide"
                                    style={{
                                        width: '100%',
                                        maxHeight: '350px',
                                        objectFit: 'contain',
                                        backgroundColor: '#000'
                                    }}
                                />
                            </div>
                        )}

                        {/* Technical Parameters for Volumes */}
                        {caseData.is_volume && volumeInfo && (
                            <div style={{
                                marginTop: '12px',
                                backgroundColor: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: '6px',
                                padding: '12px 16px',
                                fontSize: '11px',
                                color: '#64748b',
                                display: 'flex',
                                gap: '24px',
                                justifyContent: 'center'
                            }}>
                                <span><strong>Modality:</strong> {volumeInfo.modality || 'MR'}</span>
                                <span><strong>Matrix:</strong> {volumeInfo.dimensions?.sagittal || '?'} × {volumeInfo.dimensions?.coronal || '?'} × {volumeInfo.dimensions?.axial || '?'}</span>
                                <span><strong>Slice Thickness:</strong> {volumeInfo.spacing?.z?.toFixed(2) || '?'} mm</span>
                                <span><strong>Pixel Spacing:</strong> {volumeInfo.spacing?.x?.toFixed(2) || '?'} × {volumeInfo.spacing?.y?.toFixed(2) || '?'} mm</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Findings Sections */}
                <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ 
                        margin: '0 0 16px 0', 
                        fontSize: '14px', 
                        color: '#122056',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        borderBottom: '2px solid #e5e7eb',
                        paddingBottom: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        🔬 Pathological Findings
                    </h3>

                    {/* Gross Description */}
                    {findings?.grossDescription && (
                        <div style={{ marginBottom: '16px' }}>
                            <h4 style={{ 
                                margin: '0 0 8px 0', 
                                fontSize: '13px', 
                                color: '#374151',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}>
                                <span style={{
                                    width: '6px',
                                    height: '6px',
                                    backgroundColor: '#122056',
                                    borderRadius: '50%',
                                    display: 'inline-block'
                                }}></span>
                                Gross Description
                            </h4>
                            <p style={{ 
                                margin: 0, 
                                padding: '12px 16px',
                                backgroundColor: '#f8fafc',
                                borderRadius: '6px',
                                borderLeft: '3px solid #122056',
                                lineHeight: '1.7',
                                fontSize: '13px',
                                whiteSpace: 'pre-wrap'
                            }}>
                                {findings.grossDescription}
                            </p>
                        </div>
                    )}

                    {/* Microscopic Findings */}
                    <div style={{ marginBottom: '16px' }}>
                        <h4 style={{ 
                            margin: '0 0 8px 0', 
                            fontSize: '13px', 
                            color: '#374151',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}>
                            <span style={{
                                width: '6px',
                                height: '6px',
                                backgroundColor: '#5B65DC',
                                borderRadius: '50%',
                                display: 'inline-block'
                            }}></span>
                            Microscopic Examination
                        </h4>
                        <div style={{ 
                            margin: 0, 
                            padding: '16px',
                            backgroundColor: '#f8fafc',
                            borderRadius: '6px',
                            borderLeft: '3px solid #5B65DC',
                            lineHeight: '1.8',
                            fontSize: '14px',
                            whiteSpace: 'pre-wrap'
                        }}>
                            {findings?.microscopicFindings || caseData.pathologist_notes || caseData.doctor_notes || "No microscopic findings recorded."}
                        </div>
                    </div>

                    {/* Comments */}
                    {findings?.comments && (
                        <div style={{ marginBottom: '16px' }}>
                            <h4 style={{ 
                                margin: '0 0 8px 0', 
                                fontSize: '13px', 
                                color: '#374151',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}>
                                <FontAwesomeIcon icon={faInfoCircle} style={{ color: '#f59e0b' }} />
                                Clinical Comment
                            </h4>
                            <p style={{ 
                                margin: 0, 
                                padding: '12px 16px',
                                backgroundColor: '#fffbeb',
                                borderRadius: '6px',
                                borderLeft: '3px solid #f59e0b',
                                lineHeight: '1.7',
                                fontSize: '13px',
                                whiteSpace: 'pre-wrap'
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
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}>
                                <span style={{
                                    width: '6px',
                                    height: '6px',
                                    backgroundColor: '#10b981',
                                    borderRadius: '50%',
                                    display: 'inline-block'
                                }}></span>
                                Recommendations
                            </h4>
                            <p style={{ 
                                margin: 0, 
                                padding: '12px 16px',
                                backgroundColor: '#f0fdf4',
                                borderRadius: '6px',
                                borderLeft: '3px solid #10b981',
                                lineHeight: '1.7',
                                fontSize: '13px',
                                whiteSpace: 'pre-wrap'
                            }}>
                                {findings.recommendations}
                            </p>
                        </div>
                    )}
                </div>

                {/* Signature Section */}
                <div style={{ 
                    marginTop: '40px', 
                    paddingTop: '24px',
                    borderTop: '2px solid #e5e7eb',
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'flex-end'
                }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                        <p style={{ margin: 0 }}>
                            Reviewed on: {new Date().toLocaleDateString()}
                        </p>
                    </div>
                    <div style={{ textAlign: 'center', width: '280px' }}>
                        <div style={{
                            borderBottom: '2px solid #1e293b',
                            marginBottom: '8px',
                            height: '50px',
                            display: 'flex',
                            alignItems: 'flex-end',
                            justifyContent: 'center',
                            paddingBottom: '8px'
                        }}>
                            {caseData.is_finalized && caseData.finalized_by_name && (
                                <span style={{ 
                                    fontFamily: 'Georgia, serif',
                                    fontStyle: 'italic', 
                                    color: '#1e293b', 
                                    fontSize: '18px'
                                }}>
                                    Dr. {caseData.finalized_by_name}
                                </span>
                            )}
                        </div>
                        <p style={{ margin: 0, fontWeight: 'bold', fontSize: '13px', color: '#1e293b' }}>
                            {caseData.finalized_by_name ? `Dr. ${caseData.finalized_by_name}` : 'Attending Pathologist'}
                        </p>
                        <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#64748b' }}>
                            Board Certified Pathologist
                        </p>
                        {caseData.is_finalized && caseData.finalized_date && (
                            <p style={{ 
                                margin: '8px 0 0 0', 
                                fontSize: '10px', 
                                color: '#059669',
                                backgroundColor: '#d1fae5',
                                padding: '4px 12px',
                                borderRadius: '4px',
                                display: 'inline-block'
                            }}>
                                ✓ Electronically signed: {new Date(caseData.finalized_date).toLocaleString()}
                            </p>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    marginTop: '40px',
                    paddingTop: '16px',
                    borderTop: '1px solid #e5e7eb',
                    textAlign: 'center',
                    fontSize: '10px',
                    color: '#94a3b8'
                }}>
                    <p style={{ margin: '0 0 4px 0' }}>
                        This is a{caseData.is_finalized ? ' <strong>FINALIZED</strong> and legally binding' : 'n <strong>UNFINALIZED DRAFT</strong>'} pathology report.
                        {!caseData.is_finalized && <span style={{ color: '#ef4444' }}> Not valid for clinical decisions.</span>}
                    </p>
                    <p style={{ margin: '0 0 4px 0' }}>
                        <strong>PathoScope</strong> Laboratory Information System | Report ID: {caseData.accession_number || `PATH-${String(caseData.id).padStart(6, '0')}`}
                    </p>
                    <p style={{ margin: 0, fontSize: '9px', color: '#cbd5e1' }}>
                        <strong>CONFIDENTIAL:</strong> This document contains protected health information (PHI) subject to HIPAA regulations.
                        Unauthorized disclosure is prohibited.
                    </p>
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { 
                        background-color: white !important; 
                        margin: 0; 
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    #print-area { 
                        box-shadow: none !important; 
                        padding: 15mm !important; 
                        width: 100% !important; 
                        margin: 0 !important; 
                        min-height: auto !important;
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
