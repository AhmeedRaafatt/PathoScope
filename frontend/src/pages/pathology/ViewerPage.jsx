import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DicomCanvas from '../../components/pathology/DicomCanvas';
import { commonICD10Codes } from '../../data/icd10_codes';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowLeft, faColumns, faSquare, faSave, faPen, faRuler,
    faHandPaper, faEraser, faRobot, faSearchPlus, faSearchMinus,
    faCompress, faFileMedical, faRedo, faSlidersH
} from '@fortawesome/free-solid-svg-icons';

const ViewerPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const canvasRef = useRef();

    // Data State
    const [caseData, setCaseData] = useState(null);
    const [notes, setNotes] = useState("");
    const [annotations, setAnnotations] = useState([]);
    const [icdCode, setIcdCode] = useState("");
    const [icdDesc, setIcdDesc] = useState("");

    // UI State
    const [activeTool, setActiveTool] = useState('pan');
    const [isSaving, setIsSaving] = useState(false);
    const [showAdjustments, setShowAdjustments] = useState(false);

    // Comparison State
    const [patientCases, setPatientCases] = useState([]);
    const [isCompareMode, setIsCompareMode] = useState(false);
    const [secondaryFile, setSecondaryFile] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch Data
    useEffect(() => {
        const fetchCaseDetails = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('http://127.0.0.1:8000/api/pathology/list/', {
                    headers: { 'Authorization': `Token ${token}` }
                });
                const allCases = await response.json();
                const currentCase = allCases.find(c => c.id === parseInt(id));

                if (currentCase) {
                    setCaseData(currentCase);
                    setNotes(currentCase.pathologist_notes || currentCase.doctor_notes || "");
                    const safeAnnotations = Array.isArray(currentCase.annotations) ? currentCase.annotations : [];
                    setAnnotations(safeAnnotations);
                    setIcdCode(currentCase.icd_code || "");
                    setIcdDesc(currentCase.icd_description || "");

                    const history = allCases.filter(c =>
                        c.patient === currentCase.patient && c.id !== currentCase.id
                    );
                    setPatientCases(history);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchCaseDetails();
    }, [id]);

    // Tool Handlers
    const handleToolChange = (tool) => {
        setActiveTool(tool);
        if (canvasRef.current) canvasRef.current.setToolMode(tool);
    };

    // Zoom Handlers
    const zoomIn = () => { if (canvasRef.current) canvasRef.current.zoomIn(); };
    const zoomOut = () => { if (canvasRef.current) canvasRef.current.zoomOut(); };
    const resetView = () => { if (canvasRef.current) canvasRef.current.resetView(); };

    // AI Handler
    const handleAI = async () => {
        setIsSaving(true);
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/pathology/case/${id}/ai-analyze/`, {
                method: 'POST',
                headers: { 'Authorization': `Token ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setAnnotations(data.annotations);
                setNotes(prev => prev + "\n\n" + data.report);
                alert(`🤖 AI Analysis Complete!\n${data.report}`);
            } else {
                alert("AI Analysis Failed.");
            }
        } catch (e) {
            console.error(e);
            alert("Network Error during AI Analysis");
        } finally {
            setIsSaving(false);
        }
    };

    const handleClear = () => { if (canvasRef.current) canvasRef.current.clearAll(); };

    // Comparison Logic
    const handleCompareSelect = (e) => {
        const selectedId = parseInt(e.target.value);
        if (!selectedId) {
            setIsCompareMode(false);
            setSecondaryFile(null);
            return;
        }
        const selectedCase = patientCases.find(c => c.id === selectedId);
        if (selectedCase) {
            setSecondaryFile(selectedCase.image_preview);
            setIsCompareMode(true);
        }
    };

    // 🔥 SINGLE SAVE & REVIEW BUTTON - Goes to report page
    const handleSaveAndReview = async () => {
        // If already finalized, just navigate
        if (caseData?.is_finalized) {
            navigate(`/pathology/report/${id}`);
            return;
        }

        setIsSaving(true);
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/pathology/case/${id}/update-report/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    pathologist_notes: notes,
                    icd_code: icdCode,
                    icd_description: icdDesc
                })
            });

            if (response.ok) {
                navigate(`/pathology/report/${id}`);
            } else {
                alert("❌ Failed to save report");
            }
        } catch (e) {
            console.error(e);
            alert("Network Error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleICDChange = (e) => {
        const code = e.target.value;
        setIcdCode(code);
        const match = commonICD10Codes.find(c => c.code === code);
        setIcdDesc(match ? match.desc : "");
    };

    return (
        <div style={{ backgroundColor: '#f4f7fe', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

            {/* TOP BAR - Improved Styling */}
            <div style={{
                backgroundColor: 'white',
                padding: '12px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #e5e7eb',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <button
                        onClick={() => navigate('/pathology')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 16px',
                            background: 'transparent',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            color: '#122056',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.background = '#f9fafb';
                            e.currentTarget.style.borderColor = '#122056';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.borderColor = '#e5e7eb';
                        }}
                    >
                        <FontAwesomeIcon icon={faArrowLeft} />
                        Back to Dashboard
                    </button>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#122056' }}>
                            Case #{id}
                        </h2>
                        {caseData?.accession_number && (
                            <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
                                {caseData.accession_number}
                            </p>
                        )}
                    </div>
                </div>

                {/* TOOLBAR */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {/* Zoom Controls */}
                    <div style={{ display: 'flex', gap: '4px', paddingRight: '12px', borderRight: '1px solid #e5e7eb' }}>
                        <ToolBtn icon={faSearchPlus} onClick={zoomIn} title="Zoom In" />
                        <ToolBtn icon={faSearchMinus} onClick={zoomOut} title="Zoom Out" />
                        <ToolBtn icon={faCompress} onClick={resetView} title="Reset View" />
                    </div>

                    {/* Image Adjustments */}
                    <div style={{ display: 'flex', gap: '4px', paddingRight: '12px', borderRight: '1px solid #e5e7eb' }}>
                        <ToolBtn icon={faRedo} onClick={() => canvasRef.current?.rotateRight()} title="Rotate 90°" />
                        <ToolBtn icon={faSlidersH} active={showAdjustments} onClick={() => setShowAdjustments(!showAdjustments)} title="Image Settings" />
                    </div>

                    {/* Annotation Tools */}
                    <div style={{ display: 'flex', gap: '4px', paddingRight: '12px', borderRight: '1px solid #e5e7eb' }}>
                        <ToolBtn icon={faHandPaper} active={activeTool === 'pan'} onClick={() => handleToolChange('pan')} title="Pan" />
                        <ToolBtn icon={faPen} active={activeTool === 'draw'} onClick={() => handleToolChange('draw')} title="Draw" />
                        <ToolBtn icon={faRuler} active={activeTool === 'ruler'} onClick={() => handleToolChange('ruler')} title="Measure" />
                        <ToolBtn icon={faEraser} onClick={handleClear} title="Clear" />
                    </div>

                    {/* AI Button - Purple/Violet */}
                    <button
                        onClick={handleAI}
                        disabled={isSaving}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: isSaving ? '#cbd5e0' : '#8b5cf6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: isSaving ? 'not-allowed' : 'pointer',
                            fontWeight: '600',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s ease',
                            opacity: isSaving ? 0.6 : 1
                        }}
                        onMouseOver={(e) => !isSaving && (e.currentTarget.style.backgroundColor = '#7c3aed')}
                        onMouseOut={(e) => !isSaving && (e.currentTarget.style.backgroundColor = '#8b5cf6')}
                    >
                        <FontAwesomeIcon icon={faRobot} />
                        AI Analysis
                    </button>
                </div>

                {/* Comparison Dropdown */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    backgroundColor: '#f9fafb',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                }}>
                    <FontAwesomeIcon icon={isCompareMode ? faColumns : faSquare} color="#6b7280" />
                    <select
                        onChange={handleCompareSelect}
                        style={{
                            backgroundColor: 'transparent',
                            color: '#2d3748',
                            border: 'none',
                            outline: 'none',
                            fontSize: '14px',
                            cursor: 'pointer',
                            fontWeight: '500',
                            minWidth: '150px'
                        }}
                    >
                        <option value="">Single View</option>
                        {patientCases.map(c => (
                            <option key={c.id} value={c.id}>Compare: Case #{c.id}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* ADJUSTMENTS PANEL */}
            {showAdjustments && (
                <div style={{
                    background: '#2d3436',
                    color: 'white',
                    padding: '12px 24px',
                    display: 'flex',
                    gap: '24px',
                    alignItems: 'center',
                    fontSize: '13px',
                    borderBottom: '1px solid #1a1d1f'
                }}>
                    <span style={{ fontWeight: '600' }}>Image Adjustments:</span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Brightness
                        <input type="range" min="50" max="150" defaultValue="100" onChange={(e) => canvasRef.current?.setBrightness(e.target.value)} style={{ width: '100px' }} />
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Contrast
                        <input type="range" min="50" max="200" defaultValue="100" onChange={(e) => canvasRef.current?.setContrast(e.target.value)} style={{ width: '100px' }} />
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Invert
                        <input type="range" min="0" max="100" step="100" defaultValue="0" onChange={(e) => canvasRef.current?.setInvert(e.target.value)} style={{ width: '100px' }} />
                    </label>
                    <div style={{ width: '1px', background: '#555', height: '20px' }} />
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Blur
                        <input type="range" min="0" max="5" step="0.5" defaultValue="0" onChange={(e) => canvasRef.current?.setBlur(e.target.value)} style={{ width: '100px' }} />
                    </label>
                </div>
            )}

            {/* MAIN AREA */}
            <div style={{ flex: 1, padding: '24px', display: 'flex', gap: '24px', flexDirection: 'column' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', marginTop: '50px', color: '#6b7280' }}>Loading case...</div>
                ) : (
                    <div style={{
                        flex: 1,
                        display: 'grid',
                        gridTemplateColumns: isCompareMode ? '1fr 1fr' : '1fr',
                        gap: '24px',
                        minHeight: '500px'
                    }}>
                        <div style={{
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            padding: '8px',
                            border: '1px solid #e5e7eb'
                        }}>
                            {caseData?.image_preview ? (
                                <DicomCanvas
                                    ref={canvasRef}
                                    fileUrl={caseData.image_preview}
                                    label={`Primary: Case #${id}`}
                                    initialAnnotations={annotations}
                                    onAnnotationsChange={setAnnotations}
                                />
                            ) : (
                                <div style={{ padding: '40px', color: '#ef4444', textAlign: 'center' }}>
                                    Error: Slide image not found
                                </div>
                            )}
                        </div>

                        {isCompareMode && secondaryFile && (
                            <div style={{
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                backgroundColor: 'white',
                                borderRadius: '12px',
                                padding: '8px',
                                border: '1px solid #e5e7eb'
                            }}>
                                <DicomCanvas fileUrl={secondaryFile} label="Comparison View" />
                            </div>
                        )}
                    </div>
                )}

                {/* DIAGNOSIS SECTION - Improved */}
                <div style={{
                    backgroundColor: 'white',
                    padding: '24px',
                    borderRadius: '12px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    border: '1px solid #e5e7eb'
                }}>
                    <div style={{ display: 'flex', gap: '24px' }}>
                        {/* ICD-10 Section */}
                        <div style={{
                            flex: 1,
                            background: '#f9fafb',
                            padding: '20px',
                            borderRadius: '8px',
                            border: '1px solid #e5e7eb'
                        }}>
                            <label style={{
                                fontSize: '13px',
                                fontWeight: '600',
                                display: 'block',
                                marginBottom: '8px',
                                color: '#122056',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}>
                                ICD-10 Diagnosis Code
                            </label>
                            <select
                                value={icdCode}
                                onChange={handleICDChange}
                                disabled={caseData?.is_finalized}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    borderRadius: '8px',
                                    border: '1px solid #cbd5e0',
                                    marginBottom: '12px',
                                    fontSize: '14px',
                                    backgroundColor: caseData?.is_finalized ? '#f3f4f6' : 'white',
                                    cursor: caseData?.is_finalized ? 'not-allowed' : 'pointer'
                                }}
                            >
                                <option value="">-- Select Diagnosis Code --</option>
                                {commonICD10Codes.map(c => (
                                    <option key={c.code} value={c.code}>
                                        {c.code} - {c.desc}
                                    </option>
                                ))}
                            </select>
                            <input
                                type="text"
                                placeholder="Diagnosis Description"
                                value={icdDesc}
                                onChange={(e) => setIcdDesc(e.target.value)}
                                disabled={caseData?.is_finalized}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    borderRadius: '8px',
                                    border: '1px solid #cbd5e0',
                                    fontSize: '14px',
                                    backgroundColor: caseData?.is_finalized ? '#f3f4f6' : 'white'
                                }}
                            />
                        </div>

                        {/* Notes Section */}
                        <div style={{ flex: 2, display: 'flex', flexDirection: 'column' }}>
                            <label style={{
                                fontSize: '13px',
                                fontWeight: '600',
                                marginBottom: '8px',
                                color: '#122056',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <FontAwesomeIcon icon={faSave} />
                                Pathologist Notes & Findings
                            </label>
                            <textarea
                                rows="4"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                disabled={caseData?.is_finalized}
                                placeholder="Enter detailed microscopic findings, diagnosis, and clinical observations..."
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    marginBottom: '16px',
                                    fontFamily: 'inherit',
                                    fontSize: '14px',
                                    resize: 'vertical',
                                    backgroundColor: caseData?.is_finalized ? '#f3f4f6' : 'white',
                                    minHeight: '120px'
                                }}
                            />

                            {caseData?.is_finalized ? (
                                <div style={{
                                    padding: '12px 16px',
                                    background: '#d1fae5',
                                    border: '1px solid #6ee7b7',
                                    borderRadius: '8px',
                                    color: '#065f46',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <FontAwesomeIcon icon={faFileMedical} />
                                    This report has been finalized. View the final report below.
                                </div>
                            ) : (
                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <button
                                        onClick={handleSaveAndReview}
                                        disabled={isSaving}
                                        style={{
                                            padding: '12px 32px',
                                            backgroundColor: isSaving ? '#cbd5e0' : '#5B65DC',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: isSaving ? 'not-allowed' : 'pointer',
                                            fontWeight: '600',
                                            fontSize: '15px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            transition: 'all 0.2s ease',
                                            boxShadow: '0 2px 4px rgba(91, 101, 220, 0.2)'
                                        }}
                                        onMouseOver={(e) => !isSaving && (e.currentTarget.style.backgroundColor = '#4c51bf')}
                                        onMouseOut={(e) => !isSaving && (e.currentTarget.style.backgroundColor = '#5B65DC')}
                                    >
                                        <FontAwesomeIcon icon={faFileMedical} />
                                        {isSaving ? 'Saving...' : 'Save & Review Report'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ToolBtn = ({ icon, onClick, active, title }) => (
    <button
        onClick={onClick}
        title={title}
        style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            border: active ? '2px solid #5B65DC' : '1px solid #e5e7eb',
            backgroundColor: active ? '#eeeffd' : 'white',
            cursor: 'pointer',
            color: active ? '#5B65DC' : '#6b7280',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}
        onMouseOver={(e) => {
            if (!active) {
                e.currentTarget.style.backgroundColor = '#f9fafb';
                e.currentTarget.style.borderColor = '#5B65DC';
            }
        }}
        onMouseOut={(e) => {
            if (!active) {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.borderColor = '#e5e7eb';
            }
        }}
    >
        <FontAwesomeIcon icon={icon} />
    </button>
);

export default ViewerPage;