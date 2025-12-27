import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DicomCanvas from '../../components/pathology/DicomCanvas';
import { commonICD10Codes } from '../../data/icd10_codes';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowLeft, faColumns, faSquare, faSave, faPen, faRuler,
    faHandPaper, faEraser, faRobot, faSearchPlus, faSearchMinus,
    faCompress, faFileMedical, faRedo, faSlidersH, faCube, faLayerGroup
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

    // MPR (Multiplanar Reconstruction) State
    const [isVolume, setIsVolume] = useState(false);
    const [volumeInfo, setVolumeInfo] = useState(null);
    const [viewMode, setViewMode] = useState('standard'); // 'standard', 'mpr', 'volume3d'
    const [mprSlices, setMprSlices] = useState({ axial: 0, sagittal: 0, coronal: 0 });
    const [mprImages, setMprImages] = useState({ axial: null, sagittal: null, coronal: null });
    const [windowSettings, setWindowSettings] = useState({ center: 50, width: 400 });
    const [loadingSlice, setLoadingSlice] = useState(false);
    
    // MPR Image Adjustments (client-side)
    const [mprAdjustments, setMprAdjustments] = useState({
        brightness: 100,
        contrast: 100,
        zoom: 1,
        invert: false
    });

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

                    // Check if this is a 3D volume
                    if (currentCase.is_volume) {
                        setIsVolume(true);
                        fetchVolumeInfo();
                    }
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchCaseDetails();
    }, [id]);

    // Fetch Volume Information for MPR
    const fetchVolumeInfo = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://127.0.0.1:8000/api/pathology/case/${id}/mpr/info/`, {
                headers: { 'Authorization': `Token ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                if (data.status === 'ready') {
                    setVolumeInfo(data);
                    setWindowSettings({
                        center: data.window?.center || 50,
                        width: data.window?.width || 400
                    });
                    // Initialize slice positions to middle
                    setMprSlices({
                        axial: Math.floor(data.dimensions.axial / 2),
                        sagittal: Math.floor(data.dimensions.sagittal / 2),
                        coronal: Math.floor(data.dimensions.coronal / 2)
                    });
                }
            }
        } catch (err) {
            console.error('Failed to fetch volume info:', err);
        }
    };

    // Fetch MPR slice image
    const fetchMPRSlice = useCallback(async (plane, index) => {
        if (!volumeInfo) return;
        setLoadingSlice(true);
        try {
            const token = localStorage.getItem('token');
            const url = `http://127.0.0.1:8000/api/pathology/case/${id}/mpr/slice/?plane=${plane}&index=${index}&wc=${windowSettings.center}&ww=${windowSettings.width}`;
            const response = await fetch(url, {
                headers: { 'Authorization': `Token ${token}` }
            });
            if (response.ok) {
                const blob = await response.blob();
                const imageUrl = URL.createObjectURL(blob);
                setMprImages(prev => ({ ...prev, [plane]: imageUrl }));
            }
        } catch (err) {
            console.error(`Failed to fetch ${plane} slice:`, err);
        } finally {
            setLoadingSlice(false);
        }
    }, [id, volumeInfo, windowSettings]);

    // Update slices when MPR mode is activated or slices change
    useEffect(() => {
        if (viewMode === 'mpr' && volumeInfo) {
            fetchMPRSlice('axial', mprSlices.axial);
            fetchMPRSlice('sagittal', mprSlices.sagittal);
            fetchMPRSlice('coronal', mprSlices.coronal);
        }
    }, [viewMode, mprSlices, fetchMPRSlice, volumeInfo]);

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
                    {/* Zoom Controls - Only in 2D mode */}
                    {viewMode === 'standard' && (
                        <div style={{ display: 'flex', gap: '4px', paddingRight: '12px', borderRight: '1px solid #e5e7eb' }}>
                            <ToolBtn icon={faSearchPlus} onClick={zoomIn} title="Zoom In" />
                            <ToolBtn icon={faSearchMinus} onClick={zoomOut} title="Zoom Out" />
                            <ToolBtn icon={faCompress} onClick={resetView} title="Reset View" />
                        </div>
                    )}

                    {/* Image Adjustments - Only in 2D mode */}
                    {viewMode === 'standard' && (
                        <div style={{ display: 'flex', gap: '4px', paddingRight: '12px', borderRight: '1px solid #e5e7eb' }}>
                            <ToolBtn icon={faRedo} onClick={() => canvasRef.current?.rotateRight()} title="Rotate 90°" />
                            <ToolBtn icon={faSlidersH} active={showAdjustments} onClick={() => setShowAdjustments(!showAdjustments)} title="Image Settings" />
                        </div>
                    )}

                    {/* Annotation Tools - Only in 2D mode */}
                    {viewMode === 'standard' && (
                        <div style={{ display: 'flex', gap: '4px', paddingRight: '12px', borderRight: '1px solid #e5e7eb' }}>
                            <ToolBtn icon={faHandPaper} active={activeTool === 'pan'} onClick={() => handleToolChange('pan')} title="Pan" />
                            <ToolBtn icon={faPen} active={activeTool === 'draw'} onClick={() => handleToolChange('draw')} title="Draw" />
                            <ToolBtn icon={faRuler} active={activeTool === 'ruler'} onClick={() => handleToolChange('ruler')} title="Measure" />
                            <ToolBtn icon={faEraser} onClick={handleClear} title="Clear" />
                        </div>
                    )}

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

                    {/* MPR / 3D View Toggle - Only show for volume data */}
                    {isVolume && (
                        <div style={{ display: 'flex', gap: '4px', paddingLeft: '12px', borderLeft: '1px solid #e5e7eb' }}>
                            <button
                                onClick={() => setViewMode('standard')}
                                title="Standard 2D View"
                                style={{
                                    padding: '8px 12px',
                                    backgroundColor: viewMode === 'standard' ? '#5B65DC' : 'white',
                                    color: viewMode === 'standard' ? 'white' : '#6b7280',
                                    border: viewMode === 'standard' ? 'none' : '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '500',
                                    fontSize: '13px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                <FontAwesomeIcon icon={faSquare} />
                                2D
                            </button>
                            <button
                                onClick={() => setViewMode('mpr')}
                                title="MPR - Multiplanar Reconstruction"
                                style={{
                                    padding: '8px 12px',
                                    backgroundColor: viewMode === 'mpr' ? '#059669' : 'white',
                                    color: viewMode === 'mpr' ? 'white' : '#6b7280',
                                    border: viewMode === 'mpr' ? 'none' : '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '500',
                                    fontSize: '13px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                <FontAwesomeIcon icon={faLayerGroup} />
                                MPR
                            </button>
                            <button
                                onClick={() => setViewMode('volume3d')}
                                title="3D Volume Rendering"
                                style={{
                                    padding: '8px 12px',
                                    backgroundColor: viewMode === 'volume3d' ? '#dc2626' : 'white',
                                    color: viewMode === 'volume3d' ? 'white' : '#6b7280',
                                    border: viewMode === 'volume3d' ? 'none' : '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '500',
                                    fontSize: '13px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                <FontAwesomeIcon icon={faCube} />
                                3D
                            </button>
                        </div>
                    )}
                </div>

                {/* Comparison Dropdown - Only in 2D mode */}
                {viewMode === 'standard' && (
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
                )}
            </div>

            {/* ADJUSTMENTS PANEL - Only show in 2D/Standard mode */}
            {showAdjustments && viewMode === 'standard' && (
                <div style={{
                    background: 'linear-gradient(135deg, #1e3a5f 0%, #2d4a6f 100%)',
                    color: 'white',
                    padding: '14px 24px',
                    display: 'flex',
                    gap: '28px',
                    alignItems: 'center',
                    fontSize: '13px',
                    borderBottom: '2px solid #3b82f6',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }}>
                    <span style={{ 
                        fontWeight: '700', 
                        color: '#60a5fa',
                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>
                        🎨 Image Adjustments
                    </span>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#e2e8f0' }}>
                        <span style={{ fontWeight: '500' }}>Brightness</span>
                        <input type="range" min="50" max="150" defaultValue="100" onChange={(e) => canvasRef.current?.setBrightness(e.target.value)} style={{ width: '100px', accentColor: '#3b82f6' }} />
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#e2e8f0' }}>
                        <span style={{ fontWeight: '500' }}>Contrast</span>
                        <input type="range" min="50" max="200" defaultValue="100" onChange={(e) => canvasRef.current?.setContrast(e.target.value)} style={{ width: '100px', accentColor: '#3b82f6' }} />
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#e2e8f0' }}>
                        <span style={{ fontWeight: '500' }}>Invert</span>
                        <input type="range" min="0" max="100" step="100" defaultValue="0" onChange={(e) => canvasRef.current?.setInvert(e.target.value)} style={{ width: '100px', accentColor: '#3b82f6' }} />
                    </label>
                    <div style={{ width: '2px', background: 'rgba(255,255,255,0.3)', height: '24px', borderRadius: '1px' }} />
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#e2e8f0' }}>
                        <span style={{ fontWeight: '500' }}>Blur</span>
                        <input type="range" min="0" max="5" step="0.5" defaultValue="0" onChange={(e) => canvasRef.current?.setBlur(e.target.value)} style={{ width: '100px', accentColor: '#3b82f6' }} />
                    </label>
                </div>
            )}

            {/* MAIN AREA */}
            <div style={{ flex: 1, padding: '24px', display: 'flex', gap: '24px', flexDirection: 'column' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', marginTop: '50px', color: '#6b7280' }}>Loading case...</div>
                ) : viewMode === 'mpr' && volumeInfo ? (
                    /* ===== MPR VIEW MODE ===== */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {/* Window/Level Controls */}
                        <div style={{
                            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                            color: 'white',
                            padding: '16px 24px',
                            borderRadius: '12px',
                            display: 'flex',
                            gap: '28px',
                            alignItems: 'center',
                            fontSize: '13px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                            border: '1px solid rgba(34, 211, 238, 0.3)'
                        }}>
                            <span style={{ 
                                fontWeight: '700', 
                                color: '#22d3ee',
                                backgroundColor: 'rgba(34, 211, 238, 0.15)',
                                padding: '8px 14px',
                                borderRadius: '8px',
                                fontSize: '13px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <FontAwesomeIcon icon={faLayerGroup} /> MPR Controls
                            </span>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#e2e8f0' }}>
                                <span style={{ fontWeight: '500', color: '#cbd5e1' }}>Window Center</span>
                                <input 
                                    type="range" 
                                    min="-1000" 
                                    max="3000" 
                                    value={windowSettings.center}
                                    onChange={(e) => setWindowSettings(prev => ({ ...prev, center: parseInt(e.target.value) }))}
                                    style={{ width: '120px', accentColor: '#22d3ee' }} 
                                />
                                <span style={{ minWidth: '55px', backgroundColor: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600', color: '#fff' }}>{windowSettings.center}</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#e2e8f0' }}>
                                <span style={{ fontWeight: '500', color: '#cbd5e1' }}>Window Width</span>
                                <input 
                                    type="range" 
                                    min="1" 
                                    max="4000" 
                                    value={windowSettings.width}
                                    onChange={(e) => setWindowSettings(prev => ({ ...prev, width: parseInt(e.target.value) }))}
                                    style={{ width: '120px', accentColor: '#22d3ee' }} 
                                />
                                <span style={{ minWidth: '55px', backgroundColor: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600', color: '#fff' }}>{windowSettings.width}</span>
                            </label>
                            <span style={{ 
                                marginLeft: 'auto', 
                                color: '#e2e8f0', 
                                fontSize: '12px',
                                backgroundColor: 'rgba(148, 163, 184, 0.15)',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontWeight: '500'
                            }}>
                                {volumeInfo.modality} | {volumeInfo.num_slices} slices | {volumeInfo.body_part || 'Unknown'}
                            </span>
                        </div>

                        {/* MPR Image Adjustments Panel */}
                        <div style={{
                            background: 'linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%)',
                            borderRadius: '12px',
                            padding: '16px 24px',
                            display: 'flex',
                            gap: '24px',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            border: '1px solid rgba(139, 92, 246, 0.3)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                        }}>
                            <span style={{ 
                                fontWeight: '700', 
                                color: '#a855f7',
                                backgroundColor: 'rgba(168, 85, 247, 0.15)',
                                padding: '8px 14px',
                                borderRadius: '8px',
                                fontSize: '13px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                🎨 Image Adjustments
                            </span>
                            
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#e2e8f0', fontSize: '13px' }}>
                                <span style={{ fontWeight: '500', color: '#fbbf24' }}>☀️ Brightness</span>
                                <input 
                                    type="range" 
                                    min="20" 
                                    max="200" 
                                    value={mprAdjustments.brightness}
                                    onChange={(e) => setMprAdjustments(prev => ({ ...prev, brightness: parseInt(e.target.value) }))}
                                    style={{ width: '100px', accentColor: '#fbbf24' }} 
                                />
                                <span style={{ 
                                    minWidth: '45px', 
                                    backgroundColor: 'rgba(251, 191, 36, 0.2)', 
                                    padding: '4px 8px', 
                                    borderRadius: '4px', 
                                    fontSize: '11px', 
                                    fontWeight: '600',
                                    color: '#fbbf24'
                                }}>{mprAdjustments.brightness}%</span>
                            </label>
                            
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#e2e8f0', fontSize: '13px' }}>
                                <span style={{ fontWeight: '500', color: '#60a5fa' }}>⚡ Contrast</span>
                                <input 
                                    type="range" 
                                    min="20" 
                                    max="300" 
                                    value={mprAdjustments.contrast}
                                    onChange={(e) => setMprAdjustments(prev => ({ ...prev, contrast: parseInt(e.target.value) }))}
                                    style={{ width: '100px', accentColor: '#60a5fa' }} 
                                />
                                <span style={{ 
                                    minWidth: '45px', 
                                    backgroundColor: 'rgba(96, 165, 250, 0.2)', 
                                    padding: '4px 8px', 
                                    borderRadius: '4px', 
                                    fontSize: '11px', 
                                    fontWeight: '600',
                                    color: '#60a5fa'
                                }}>{mprAdjustments.contrast}%</span>
                            </label>
                            
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#e2e8f0', fontSize: '13px' }}>
                                <span style={{ fontWeight: '500', color: '#34d399' }}>🔍 Zoom</span>
                                <input 
                                    type="range" 
                                    min="0.5" 
                                    max="3" 
                                    step="0.1"
                                    value={mprAdjustments.zoom}
                                    onChange={(e) => setMprAdjustments(prev => ({ ...prev, zoom: parseFloat(e.target.value) }))}
                                    style={{ width: '100px', accentColor: '#34d399' }} 
                                />
                                <span style={{ 
                                    minWidth: '45px', 
                                    backgroundColor: 'rgba(52, 211, 153, 0.2)', 
                                    padding: '4px 8px', 
                                    borderRadius: '4px', 
                                    fontSize: '11px', 
                                    fontWeight: '600',
                                    color: '#34d399'
                                }}>{mprAdjustments.zoom.toFixed(1)}x</span>
                            </label>
                            
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#e2e8f0', fontSize: '13px' }}>
                                <span style={{ fontWeight: '500', color: '#f472b6' }}>🔄 Invert</span>
                                <button
                                    onClick={() => setMprAdjustments(prev => ({ ...prev, invert: !prev.invert }))}
                                    style={{
                                        padding: '6px 14px',
                                        backgroundColor: mprAdjustments.invert ? '#f472b6' : 'rgba(244, 114, 182, 0.2)',
                                        color: mprAdjustments.invert ? 'white' : '#f472b6',
                                        border: '1px solid #f472b6',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '11px',
                                        fontWeight: '600',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {mprAdjustments.invert ? 'ON' : 'OFF'}
                                </button>
                            </label>
                            
                            <button
                                onClick={() => setMprAdjustments({ brightness: 100, contrast: 100, zoom: 1, invert: false })}
                                style={{
                                    marginLeft: 'auto',
                                    padding: '8px 16px',
                                    backgroundColor: 'rgba(100, 116, 139, 0.3)',
                                    color: '#94a3b8',
                                    border: '1px solid #475569',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    transition: 'all 0.2s'
                                }}
                            >
                                ↺ Reset All
                            </button>
                        </div>

                        {/* MPR Panels - 3 View Layout */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gridTemplateRows: '1fr 1fr',
                            gap: '16px',
                            minHeight: '600px'
                        }}>
                            {/* Axial View */}
                            <MPRViewPanel
                                title="Axial View"
                                plane="axial"
                                color="#22d3ee"
                                imageUrl={mprImages.axial}
                                sliceIndex={mprSlices.axial}
                                maxSlices={volumeInfo.dimensions.axial}
                                loading={loadingSlice}
                                onSliceChange={(val) => setMprSlices(prev => ({ ...prev, axial: val }))}
                                adjustments={mprAdjustments}
                            />

                            {/* Sagittal View */}
                            <MPRViewPanel
                                title="Sagittal View"
                                plane="sagittal"
                                color="#f97316"
                                imageUrl={mprImages.sagittal}
                                sliceIndex={mprSlices.sagittal}
                                maxSlices={volumeInfo.dimensions.sagittal}
                                loading={loadingSlice}
                                onSliceChange={(val) => setMprSlices(prev => ({ ...prev, sagittal: val }))}
                                adjustments={mprAdjustments}
                            />

                            {/* Coronal View */}
                            <MPRViewPanel
                                title="Coronal View"
                                plane="coronal"
                                color="#a855f7"
                                imageUrl={mprImages.coronal}
                                sliceIndex={mprSlices.coronal}
                                maxSlices={volumeInfo.dimensions.coronal}
                                loading={loadingSlice}
                                onSliceChange={(val) => setMprSlices(prev => ({ ...prev, coronal: val }))}
                                adjustments={mprAdjustments}
                            />

                            {/* Volume Info Panel */}
                            <div style={{
                                background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
                                borderRadius: '12px',
                                border: '2px solid #10b981',
                                padding: '20px',
                                color: 'white',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '14px',
                                boxShadow: '0 4px 20px rgba(16, 185, 129, 0.15)'
                            }}>
                                <h3 style={{ 
                                    margin: 0, 
                                    fontSize: '16px', 
                                    color: '#10b981',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    paddingBottom: '12px',
                                    borderBottom: '1px solid #334155'
                                }}>
                                    <span style={{
                                        backgroundColor: '#10b981',
                                        padding: '6px 10px',
                                        borderRadius: '6px'
                                    }}>
                                        <FontAwesomeIcon icon={faCube} style={{ color: 'white' }} />
                                    </span>
                                    <span style={{ color: '#f1f5f9', fontWeight: '700' }}>Volume Information</span>
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                                    <InfoRow label="Modality" value={volumeInfo.modality || 'N/A'} />
                                    <InfoRow label="Series" value={volumeInfo.series_description || 'N/A'} />
                                    <InfoRow label="Body Part" value={volumeInfo.body_part || 'N/A'} />
                                    <InfoRow label="Total Slices" value={volumeInfo.num_slices} />
                                    <InfoRow label="Dimensions" value={`${volumeInfo.dimensions.sagittal} × ${volumeInfo.dimensions.coronal} × ${volumeInfo.dimensions.axial}`} />
                                    <InfoRow label="Slice Thickness" value={`${volumeInfo.spacing?.z?.toFixed(2) || '?'} mm`} />
                                    <InfoRow label="Pixel Spacing" value={`${volumeInfo.spacing?.x?.toFixed(2) || '?'} × ${volumeInfo.spacing?.y?.toFixed(2) || '?'} mm`} />
                                </div>
                                <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #334155' }}>
                                    <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
                                        Use the sliders to navigate through slices. Adjust Window/Level for optimal contrast.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : viewMode === 'volume3d' && volumeInfo ? (
                    /* ===== 3D VOLUME RENDERING MODE ===== */
                    <div style={{
                        flex: 1,
                        backgroundColor: '#0f172a',
                        borderRadius: '12px',
                        padding: '20px',
                        minHeight: '600px',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ margin: 0, color: '#f87171', fontSize: '18px' }}>
                                <FontAwesomeIcon icon={faCube} /> 3D Volume Rendering
                            </h3>
                            <span style={{ color: '#94a3b8', fontSize: '13px' }}>
                                {volumeInfo.modality} | {volumeInfo.num_slices} slices
                            </span>
                        </div>
                        <VolumeRenderer3D caseId={id} volumeInfo={volumeInfo} />
                    </div>
                ) : (
                    /* ===== STANDARD 2D VIEW MODE ===== */
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

// ============================================================================
// MPR View Panel Component (with image adjustments)
// ============================================================================
const MPRViewPanel = ({ title, plane, color, imageUrl, sliceIndex, maxSlices, loading, onSliceChange, adjustments }) => {
    const [localZoom, setLocalZoom] = useState(1);
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [lastPanPos, setLastPanPos] = useState({ x: 0, y: 0 });
    const containerRef = useRef(null);

    // Build CSS filter string from adjustments
    const getImageFilter = () => {
        if (!adjustments) return 'none';
        const filters = [];
        filters.push(`brightness(${adjustments.brightness / 100})`);
        filters.push(`contrast(${adjustments.contrast / 100})`);
        if (adjustments.invert) filters.push('invert(1)');
        return filters.join(' ');
    };

    // Handle mouse wheel zoom on individual panel
    const handleWheel = (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setLocalZoom(prev => Math.max(0.5, Math.min(5, prev + delta)));
    };

    // Handle panning
    const handleMouseDown = (e) => {
        if (e.button === 0) { // Left click
            setIsPanning(true);
            setLastPanPos({ x: e.clientX, y: e.clientY });
        }
    };

    const handleMouseMove = (e) => {
        if (!isPanning) return;
        const dx = e.clientX - lastPanPos.x;
        const dy = e.clientY - lastPanPos.y;
        setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
        setLastPanPos({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => setIsPanning(false);

    // Double click to reset
    const handleDoubleClick = () => {
        setLocalZoom(1);
        setPanOffset({ x: 0, y: 0 });
    };

    // Combined zoom (global + local)
    const effectiveZoom = (adjustments?.zoom || 1) * localZoom;

    return (
        <div style={{
            backgroundColor: '#1a1a2e',
            borderRadius: '12px',
            border: `3px solid ${color}`,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: `0 4px 20px ${color}33`
        }}>
            {/* Header */}
            <div style={{
                background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
                color: 'white',
                padding: '12px 18px',
                fontSize: '14px',
                fontWeight: '700',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                textShadow: '0 1px 2px rgba(0,0,0,0.3)'
            }}>
                <span style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    fontSize: '13px'
                }}>
                    <span style={{
                        width: '8px',
                        height: '8px',
                        backgroundColor: '#fff',
                        borderRadius: '50%',
                        boxShadow: '0 0 8px rgba(255,255,255,0.5)'
                    }} />
                    {title}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ 
                        fontSize: '11px', 
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        padding: '3px 8px',
                        borderRadius: '8px'
                    }}>
                        {effectiveZoom.toFixed(1)}x
                    </span>
                    <span style={{ 
                        fontSize: '12px', 
                        backgroundColor: 'rgba(0,0,0,0.25)',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontWeight: '600'
                    }}>
                        {sliceIndex + 1} / {maxSlices}
                    </span>
                </div>
            </div>
            
            {/* Image Area */}
            <div 
                ref={containerRef}
                style={{
                    flex: 1,
                    backgroundColor: '#0a0a0f',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    minHeight: '220px',
                    overflow: 'hidden',
                    cursor: isPanning ? 'grabbing' : 'grab'
                }}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onDoubleClick={handleDoubleClick}
            >
                {loading && (
                    <div style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        backgroundColor: color,
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '600',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        zIndex: 10
                    }}>
                        ⏳ Loading...
                    </div>
                )}
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={`${plane} view`}
                        draggable={false}
                        style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain',
                            transform: `scale(${effectiveZoom}) translate(${panOffset.x / effectiveZoom}px, ${panOffset.y / effectiveZoom}px)`,
                            filter: getImageFilter(),
                            transition: isPanning ? 'none' : 'transform 0.1s ease-out',
                            userSelect: 'none'
                        }}
                    />
                ) : (
                    <div style={{ 
                        color: '#64748b', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        gap: '8px' 
                    }}>
                        <div style={{ fontSize: '24px' }}>🔄</div>
                        <span>Loading slice...</span>
                    </div>
                )}
                {/* Zoom indicator overlay */}
                {effectiveZoom !== 1 && (
                    <div style={{
                        position: 'absolute',
                        bottom: '8px',
                        left: '8px',
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        color: '#22d3ee',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: '600'
                    }}>
                        🔍 {effectiveZoom.toFixed(1)}x | Double-click to reset
                    </div>
                )}
            </div>
            
            {/* Slider */}
            <div style={{
                padding: '14px 18px',
                background: 'linear-gradient(180deg, #1e1e2e 0%, #16161d 100%)',
                borderTop: `2px solid ${color}44`
            }}>
                <input
                    type="range"
                    min="0"
                    max={maxSlices - 1}
                    value={sliceIndex}
                    onChange={(e) => onSliceChange(parseInt(e.target.value))}
                    style={{
                        width: '100%',
                        accentColor: color,
                        cursor: 'pointer',
                        height: '6px'
                    }}
                />
            </div>
        </div>
    );
};

// ============================================================================
// Info Row Component for Volume Info Panel
// ============================================================================
const InfoRow = ({ label, value }) => (
    <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        backgroundColor: 'rgba(30, 41, 59, 0.5)',
        padding: '8px 12px',
        borderRadius: '6px',
        border: '1px solid #334155'
    }}>
        <span style={{ color: '#94a3b8', fontWeight: '500' }}>{label}:</span>
        <span style={{ color: '#22d3ee', fontWeight: '600' }}>{value}</span>
    </div>
);

// ============================================================================
// Advanced 3D Volume Renderer Component with enhanced techniques
// ============================================================================
const VolumeRenderer3D = ({ caseId, volumeInfo }) => {
    const canvasRef = useRef(null);
    const animationRef = useRef(null);
    const [rotation, setRotation] = useState({ x: -0.3, y: 0.5 });
    const [zoom, setZoom] = useState(1.2);
    const [isDragging, setIsDragging] = useState(false);
    const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
    const [volumeData, setVolumeData] = useState(null);
    const [loadingVolume, setLoadingVolume] = useState(true);
    const [renderMode, setRenderMode] = useState('composite'); // Start with best mode
    const [threshold, setThreshold] = useState(60); // Higher for better surface detection
    const [brightness, setBrightness] = useState(120);
    const [colorMap, setColorMap] = useState('bone'); // Bone colormap for medical images
    const [opacity, setOpacity] = useState(0.7);
    const [sampleRate, setSampleRate] = useState(1.5);
    const [autoRotate, setAutoRotate] = useState(false);
    const [lightPosition, setLightPosition] = useState({ x: 1, y: 1, z: 1 });
    const [minIntensity, setMinIntensity] = useState(40); // Higher default to cut more background
    const [gradientThreshold, setGradientThreshold] = useState(15); // For surface edge detection

    // Color transfer functions
    const colorMaps = {
        grayscale: (v) => ({ r: v, g: v, b: v }),
        hot: (v) => ({
            r: Math.min(255, v * 3),
            g: Math.min(255, Math.max(0, (v - 85) * 3)),
            b: Math.min(255, Math.max(0, (v - 170) * 3))
        }),
        cool: (v) => ({
            r: Math.min(255, Math.max(0, (v - 128) * 2)),
            g: Math.min(255, v * 1.5),
            b: Math.min(255, 255 - v * 0.5)
        }),
        bone: (v) => ({
            r: Math.min(255, v * 0.99 + (v > 170 ? (v - 170) * 0.3 : 0)),
            g: Math.min(255, v * 0.99 + (v > 85 && v < 200 ? 20 : 0)),
            b: Math.min(255, v * 1.1)
        }),
        rainbow: (v) => {
            const h = (1 - v / 255) * 240;
            const s = 1, l = 0.5;
            const c = (1 - Math.abs(2 * l - 1)) * s;
            const x = c * (1 - Math.abs((h / 60) % 2 - 1));
            const m = l - c / 2;
            let r = 0, g = 0, b = 0;
            if (h < 60) { r = c; g = x; }
            else if (h < 120) { r = x; g = c; }
            else if (h < 180) { g = c; b = x; }
            else if (h < 240) { g = x; b = c; }
            else { r = x; b = c; }
            return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
        }
    };

    // Fetch volume data for 3D rendering
    useEffect(() => {
        const fetchVolumeData = async () => {
            setLoadingVolume(true);
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(
                    `http://127.0.0.1:8000/api/pathology/case/${caseId}/mpr/volume-data/?downsample=2`,
                    { headers: { 'Authorization': `Token ${token}` } }
                );
                if (response.ok) {
                    const data = await response.json();
                    setVolumeData(data);
                }
            } catch (err) {
                console.error('Failed to fetch volume data:', err);
            } finally {
                setLoadingVolume(false);
            }
        };
        fetchVolumeData();
    }, [caseId]);

    // Auto-rotation animation
    useEffect(() => {
        if (autoRotate && !isDragging) {
            const animate = () => {
                setRotation(prev => ({ ...prev, y: prev.y + 0.01 }));
                animationRef.current = requestAnimationFrame(animate);
            };
            animationRef.current = requestAnimationFrame(animate);
        }
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [autoRotate, isDragging]);

    // Render volume when data changes or parameters change
    useEffect(() => {
        if (!canvasRef.current || !volumeData) return;
        renderVolume();
    }, [volumeData, rotation, zoom, renderMode, threshold, brightness, colorMap, opacity, sampleRate, minIntensity, gradientThreshold]);

    const renderVolume = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas with gradient background
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#0a0a1a');
        gradient.addColorStop(1, '#1a1a2e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        if (!volumeData || !volumeData.data) {
            ctx.fillStyle = '#64748b';
            ctx.font = '16px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('No volume data available', width / 2, height / 2);
            return;
        }

        const { data, dimensions, spacing } = volumeData;
        const [depth, rows, cols] = dimensions;
        
        // Get spacing (use actual values from DICOM, default to proportional if not available)
        const spZ = spacing?.[0] || 1;
        const spY = spacing?.[1] || 1;
        const spX = spacing?.[2] || 1;
        
        // Calculate real-world dimensions for proper aspect ratio
        const realZ = depth * spZ;
        const realY = rows * spY;
        const realX = cols * spX;
        
        // Normalize to unit cube with correct aspect ratio
        const maxDim = Math.max(realZ, realY, realX);
        const normZ = realZ / maxDim;
        const normY = realY / maxDim;
        const normX = realX / maxDim;

        const imageData = ctx.createImageData(width, height);
        const pixels = imageData.data;

        // Rotation matrices
        const cosRx = Math.cos(rotation.x);
        const sinRx = Math.sin(rotation.x);
        const cosRy = Math.cos(rotation.y);
        const sinRy = Math.sin(rotation.y);

        const centerX = width / 2;
        const centerY = height / 2;
        
        // Scale factor for display
        const displayScale = zoom * Math.min(width, height) * 0.45;

        const colorFn = colorMaps[colorMap] || colorMaps.grayscale;
        const brightnessMultiplier = brightness / 100;
        
        // Ray step size - smaller = better quality but slower
        const numSteps = Math.floor(150 * sampleRate);
        
        // Light direction (normalized)
        const lightLen = Math.sqrt(lightPosition.x ** 2 + lightPosition.y ** 2 + lightPosition.z ** 2);
        const lightDir = { 
            x: lightPosition.x / lightLen, 
            y: lightPosition.y / lightLen, 
            z: lightPosition.z / lightLen 
        };

        // Helper: Get voxel value with trilinear interpolation
        const getVoxel = (vx, vy, vz) => {
            if (vx < 0 || vx >= cols - 1 || vy < 0 || vy >= rows - 1 || vz < 0 || vz >= depth - 1) return 0;
            
            const x0 = Math.floor(vx), y0 = Math.floor(vy), z0 = Math.floor(vz);
            const xd = vx - x0, yd = vy - y0, zd = vz - z0;
            
            const idx = (z, y, x) => z * rows * cols + y * cols + x;
            
            const c000 = data[idx(z0, y0, x0)] || 0;
            const c001 = data[idx(z0, y0, x0 + 1)] || 0;
            const c010 = data[idx(z0, y0 + 1, x0)] || 0;
            const c011 = data[idx(z0, y0 + 1, x0 + 1)] || 0;
            const c100 = data[idx(z0 + 1, y0, x0)] || 0;
            const c101 = data[idx(z0 + 1, y0, x0 + 1)] || 0;
            const c110 = data[idx(z0 + 1, y0 + 1, x0)] || 0;
            const c111 = data[idx(z0 + 1, y0 + 1, x0 + 1)] || 0;
            
            const c00 = c000 * (1 - xd) + c001 * xd;
            const c01 = c010 * (1 - xd) + c011 * xd;
            const c10 = c100 * (1 - xd) + c101 * xd;
            const c11 = c110 * (1 - xd) + c111 * xd;
            const c0 = c00 * (1 - yd) + c01 * yd;
            const c1 = c10 * (1 - yd) + c11 * yd;
            return c0 * (1 - zd) + c1 * zd;
        };

        // Helper: Calculate gradient at position
        const getGradient = (vx, vy, vz) => {
            const d = 1;
            const gx = getVoxel(vx + d, vy, vz) - getVoxel(vx - d, vy, vz);
            const gy = getVoxel(vx, vy + d, vz) - getVoxel(vx, vy - d, vz);
            const gz = getVoxel(vx, vy, vz + d) - getVoxel(vx, vy, vz - d);
            const mag = Math.sqrt(gx * gx + gy * gy + gz * gz) || 1;
            return { x: gx / mag, y: gy / mag, z: gz / mag, magnitude: mag };
        };

        // RAY CASTING - For each pixel on screen
        for (let py = 0; py < height; py++) {
            for (let px = 0; px < width; px++) {
                // Screen coordinates -> normalized device coordinates
                const ndcX = (px - centerX) / displayScale;
                const ndcY = (py - centerY) / displayScale;

                // Ray origin (camera position) and direction
                // We use orthographic projection for medical imaging
                // Ray starts from far away and goes into the volume
                
                // Create ray direction pointing into screen (Z direction)
                // then rotate by view angles
                let rayDirX = 0;
                let rayDirY = 0;
                let rayDirZ = -1; // Pointing into screen
                
                // Apply rotation to ray direction
                // Rotate around X axis
                let tempY = rayDirY * cosRx - rayDirZ * sinRx;
                let tempZ = rayDirY * sinRx + rayDirZ * cosRx;
                rayDirY = tempY;
                rayDirZ = tempZ;
                
                // Rotate around Y axis
                let tempX = rayDirX * cosRy + rayDirZ * sinRy;
                tempZ = -rayDirX * sinRy + rayDirZ * cosRy;
                rayDirX = tempX;
                rayDirZ = tempZ;

                // Ray origin in world space (start from screen plane)
                // Rotate screen position to get ray start point
                let rayOriginX = ndcX;
                let rayOriginY = ndcY;
                let rayOriginZ = 1.5; // Start in front of volume
                
                // Rotate ray origin
                tempY = rayOriginY * cosRx - rayOriginZ * sinRx;
                tempZ = rayOriginY * sinRx + rayOriginZ * cosRx;
                rayOriginY = tempY;
                rayOriginZ = tempZ;
                
                tempX = rayOriginX * cosRy + rayOriginZ * sinRy;
                tempZ = -rayOriginX * sinRy + rayOriginZ * cosRy;
                rayOriginX = tempX;
                rayOriginZ = tempZ;

                // Accumulate color along ray
                let accR = 0, accG = 0, accB = 0;
                let accAlpha = 0;
                let maxVal = 0;
                let sumVal = 0;
                let sampleCount = 0;
                let hitSurface = false;

                // March along ray
                const stepSize = 3.0 / numSteps;
                for (let i = 0; i < numSteps && accAlpha < 0.98; i++) {
                    const t = i * stepSize;
                    
                    // Current position along ray
                    const worldX = rayOriginX + rayDirX * t;
                    const worldY = rayOriginY + rayDirY * t;
                    const worldZ = rayOriginZ + rayDirZ * t;
                    
                    // Convert world coords to volume coords
                    // World is centered at 0, volume goes from 0 to dimensions
                    const vx = (worldX / normX + 0.5) * cols;
                    const vy = (worldY / normY + 0.5) * rows;
                    const vz = (worldZ / normZ + 0.5) * depth;
                    
                    // Check bounds
                    if (vx < 0 || vx >= cols || vy < 0 || vy >= rows || vz < 0 || vz >= depth) {
                        continue;
                    }
                    
                    // Sample volume
                    const val = getVoxel(vx, vy, vz);
                    
                    // Skip low intensity (background)
                    if (val < minIntensity) continue;
                    
                    // Different rendering modes
                    if (renderMode === 'mip') {
                        maxVal = Math.max(maxVal, val);
                    } 
                    else if (renderMode === 'xray') {
                        sumVal += val - minIntensity;
                        sampleCount++;
                    }
                    else if (renderMode === 'surface') {
                        if (val > threshold && !hitSurface) {
                            // Check gradient for surface detection
                            const grad = getGradient(vx, vy, vz);
                            
                            if (grad.magnitude > gradientThreshold) {
                                hitSurface = true;
                                
                                // Transform gradient normal to view space
                                let nx = grad.x, ny = grad.y, nz = grad.z;
                                
                                // Rotate normal (same as ray but inverse)
                                tempY = ny * cosRx + nz * sinRx;
                                tempZ = -ny * sinRx + nz * cosRx;
                                ny = tempY; nz = tempZ;
                                
                                tempX = nx * cosRy - nz * sinRy;
                                tempZ = nx * sinRy + nz * cosRy;
                                nx = tempX; nz = tempZ;
                                
                                // Phong shading
                                const NdotL = Math.max(0, nx * lightDir.x + ny * lightDir.y + nz * lightDir.z);
                                const ambient = 0.3;
                                const diffuse = 0.6 * NdotL;
                                const specular = 0.3 * Math.pow(NdotL, 32);
                                const shade = ambient + diffuse + specular;
                                
                                const color = colorFn(val);
                                accR = color.r * shade;
                                accG = color.g * shade;
                                accB = color.b * shade;
                                accAlpha = 1;
                            }
                        }
                    }
                    else if (renderMode === 'composite') {
                        // Direct volume rendering with transfer function
                        const normalized = (val - minIntensity) / (255 - minIntensity);
                        
                        // Opacity transfer function
                        let alpha = 0;
                        if (normalized > 0.1) {
                            alpha = Math.pow(normalized, 2) * opacity * 0.08;
                        }
                        
                        if (alpha > 0.001) {
                            const color = colorFn(val);
                            
                            // Front-to-back compositing
                            accR += (1 - accAlpha) * alpha * color.r;
                            accG += (1 - accAlpha) * alpha * color.g;
                            accB += (1 - accAlpha) * alpha * color.b;
                            accAlpha += (1 - accAlpha) * alpha;
                        }
                    }
                }

                // Final color for this pixel
                let finalR = 0, finalG = 0, finalB = 0;
                
                if (renderMode === 'mip') {
                    if (maxVal > minIntensity) {
                        const normalized = (maxVal - minIntensity) / (255 - minIntensity);
                        const enhanced = Math.pow(normalized, 0.6) * 255;
                        const color = colorFn(Math.min(255, enhanced * brightnessMultiplier));
                        finalR = color.r;
                        finalG = color.g;
                        finalB = color.b;
                    }
                }
                else if (renderMode === 'xray') {
                    if (sampleCount > 0) {
                        const avg = sumVal / sampleCount;
                        const color = colorFn(Math.min(255, avg * brightnessMultiplier * 2));
                        finalR = color.r;
                        finalG = color.g;
                        finalB = color.b;
                    }
                }
                else if (renderMode === 'surface' || renderMode === 'composite') {
                    finalR = Math.min(255, accR * brightnessMultiplier);
                    finalG = Math.min(255, accG * brightnessMultiplier);
                    finalB = Math.min(255, accB * brightnessMultiplier);
                }

                const idx = (py * width + px) * 4;
                pixels[idx] = finalR;
                pixels[idx + 1] = finalG;
                pixels[idx + 2] = finalB;
                pixels[idx + 3] = 255;
            }
        }

        ctx.putImageData(imageData, 0, 0);

        // Draw 3D axis indicator in corner
        const axisOrigin = { x: 60, y: height - 60 };
        const axisLen = 40;
        
        // Transform axis directions
        const axes = [
            { dir: [1, 0, 0], color: '#ef4444', label: 'X' },
            { dir: [0, 1, 0], color: '#22c55e', label: 'Y' },
            { dir: [0, 0, 1], color: '#3b82f6', label: 'Z' }
        ];
        
        axes.forEach(axis => {
            let [ax, ay, az] = axis.dir;
            
            // Rotate axis
            let tempY = ay * cosRx - az * sinRx;
            let tempZ = ay * sinRx + az * cosRx;
            ay = tempY; az = tempZ;
            
            let tempX = ax * cosRy + az * sinRy;
            tempZ = -ax * sinRy + az * cosRy;
            ax = tempX; az = tempZ;
            
            // Project to 2D (ignore Z for axis indicator)
            const endX = axisOrigin.x + ax * axisLen;
            const endY = axisOrigin.y - ay * axisLen;
            
            ctx.strokeStyle = axis.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(axisOrigin.x, axisOrigin.y);
            ctx.lineTo(endX, endY);
            ctx.stroke();
            
            ctx.fillStyle = axis.color;
            ctx.font = 'bold 12px sans-serif';
            ctx.fillText(axis.label, endX + 5, endY);
        });
        
        // Display volume info
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '11px monospace';
        ctx.fillText(`Vol: ${cols}×${rows}×${depth}`, width - 100, 20);
        ctx.fillText(`Spacing: ${spX.toFixed(1)}×${spY.toFixed(1)}×${spZ.toFixed(1)}`, width - 100, 35);
    };

    // Mouse interaction handlers
    const handleMouseDown = (e) => {
        setIsDragging(true);
        setLastPos({ x: e.clientX, y: e.clientY });
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        const dx = e.clientX - lastPos.x;
        const dy = e.clientY - lastPos.y;
        setRotation(prev => ({
            x: Math.max(-Math.PI / 2, Math.min(Math.PI / 2, prev.x + dy * 0.01)),
            y: prev.y + dx * 0.01
        }));
        setLastPos({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => setIsDragging(false);

    const handleWheel = (e) => {
        e.preventDefault();
        setZoom(prev => Math.max(0.3, Math.min(4, prev - e.deltaY * 0.001)));
    };

    // Preset views with anatomical labels
    const presetViews = {
        // Standard orthogonal views
        anterior: { x: 0, y: 0, label: 'Anterior', icon: '👤', shortLabel: 'A' },
        posterior: { x: 0, y: Math.PI, label: 'Posterior', icon: '🔙', shortLabel: 'P' },
        left: { x: 0, y: -Math.PI / 2, label: 'Left Lateral', icon: '◀️', shortLabel: 'L' },
        right: { x: 0, y: Math.PI / 2, label: 'Right Lateral', icon: '▶️', shortLabel: 'R' },
        superior: { x: -Math.PI / 2, y: 0, label: 'Superior', icon: '⬆️', shortLabel: 'S' },
        inferior: { x: Math.PI / 2, y: 0, label: 'Inferior', icon: '⬇️', shortLabel: 'I' },
        // Oblique/diagonal views
        anteriorRight: { x: -0.3, y: Math.PI / 4, label: 'Ant-Right', icon: '↗️', shortLabel: 'AR' },
        anteriorLeft: { x: -0.3, y: -Math.PI / 4, label: 'Ant-Left', icon: '↖️', shortLabel: 'AL' },
        posteriorRight: { x: -0.3, y: Math.PI * 3/4, label: 'Post-Right', icon: '↘️', shortLabel: 'PR' },
        posteriorLeft: { x: -0.3, y: -Math.PI * 3/4, label: 'Post-Left', icon: '↙️', shortLabel: 'PL' },
    };

    const setPresetView = (preset) => {
        const view = presetViews[preset];
        if (view) {
            setRotation({ x: view.x, y: view.y });
        }
    };

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Main Controls Row */}
            <div style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
                flexWrap: 'wrap',
                backgroundColor: 'rgba(30, 41, 59, 0.8)',
                padding: '12px 16px',
                borderRadius: '10px',
                border: '1px solid rgba(100, 116, 139, 0.3)'
            }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', fontSize: '12px' }}>
                    <span style={{ color: '#22d3ee', fontWeight: '600' }}>🎬 Mode:</span>
                    <select
                        value={renderMode}
                        onChange={(e) => setRenderMode(e.target.value)}
                        style={{
                            padding: '5px 10px',
                            borderRadius: '6px',
                            border: '1px solid #475569',
                            backgroundColor: '#0f172a',
                            color: 'white',
                            fontSize: '12px'
                        }}
                    >
                        <option value="mip">MIP (Max Intensity)</option>
                        <option value="composite">Composite DVR</option>
                        <option value="surface">Surface (Phong)</option>
                        <option value="xray">X-Ray</option>
                    </select>
                </label>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', fontSize: '12px' }}>
                    <span style={{ color: '#a855f7', fontWeight: '600' }}>🎨 Color:</span>
                    <select
                        value={colorMap}
                        onChange={(e) => setColorMap(e.target.value)}
                        style={{
                            padding: '5px 10px',
                            borderRadius: '6px',
                            border: '1px solid #475569',
                            backgroundColor: '#0f172a',
                            color: 'white',
                            fontSize: '12px'
                        }}
                    >
                        <option value="grayscale">Grayscale</option>
                        <option value="bone">Bone</option>
                        <option value="hot">Hot</option>
                        <option value="cool">Cool</option>
                        <option value="rainbow">Rainbow</option>
                    </select>
                </label>

                <button
                    onClick={() => setAutoRotate(!autoRotate)}
                    style={{
                        padding: '5px 12px',
                        backgroundColor: autoRotate ? '#22c55e' : 'rgba(34, 197, 94, 0.2)',
                        color: autoRotate ? 'white' : '#22c55e',
                        border: '1px solid #22c55e',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: '600'
                    }}
                >
                    🔄 Auto-Rotate {autoRotate ? 'ON' : 'OFF'}
                </button>
            </div>

            {/* Adjustment Sliders */}
            <div style={{
                display: 'flex',
                gap: '20px',
                alignItems: 'center',
                flexWrap: 'wrap',
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                padding: '12px 16px',
                borderRadius: '10px',
                border: '1px solid rgba(100, 116, 139, 0.2)'
            }}>
                {/* Min Intensity - Filter dark background */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e2e8f0', fontSize: '12px' }}>
                    <span style={{ color: '#ef4444', fontWeight: '500' }}>Min Cut:</span>
                    <input type="range" min="0" max="100" value={minIntensity}
                        onChange={(e) => setMinIntensity(parseInt(e.target.value))}
                        style={{ width: '80px', accentColor: '#ef4444' }} />
                    <span style={{ color: '#ef4444', minWidth: '30px' }}>{minIntensity}</span>
                </label>

                {(renderMode === 'surface' || renderMode === 'composite') && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e2e8f0', fontSize: '12px' }}>
                        <span style={{ color: '#f97316', fontWeight: '500' }}>Threshold:</span>
                        <input type="range" min="10" max="200" value={threshold}
                            onChange={(e) => setThreshold(parseInt(e.target.value))}
                            style={{ width: '80px', accentColor: '#f97316' }} />
                        <span style={{ color: '#f97316', minWidth: '30px' }}>{threshold}</span>
                    </label>
                )}

                {renderMode === 'surface' && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e2e8f0', fontSize: '12px' }}>
                        <span style={{ color: '#ec4899', fontWeight: '500' }}>Edge:</span>
                        <input type="range" min="5" max="50" value={gradientThreshold}
                            onChange={(e) => setGradientThreshold(parseInt(e.target.value))}
                            style={{ width: '80px', accentColor: '#ec4899' }} />
                        <span style={{ color: '#ec4899', minWidth: '30px' }}>{gradientThreshold}</span>
                    </label>
                )}

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e2e8f0', fontSize: '12px' }}>
                    <span style={{ color: '#fbbf24', fontWeight: '500' }}>Brightness:</span>
                    <input type="range" min="50" max="200" value={brightness}
                        onChange={(e) => setBrightness(parseInt(e.target.value))}
                        style={{ width: '80px', accentColor: '#fbbf24' }} />
                    <span style={{ color: '#fbbf24', minWidth: '35px' }}>{brightness}%</span>
                </label>

                {renderMode === 'composite' && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e2e8f0', fontSize: '12px' }}>
                        <span style={{ color: '#60a5fa', fontWeight: '500' }}>Opacity:</span>
                        <input type="range" min="0.1" max="1" step="0.1" value={opacity}
                            onChange={(e) => setOpacity(parseFloat(e.target.value))}
                            style={{ width: '80px', accentColor: '#60a5fa' }} />
                        <span style={{ color: '#60a5fa', minWidth: '30px' }}>{opacity.toFixed(1)}</span>
                    </label>
                )}

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e2e8f0', fontSize: '12px' }}>
                    <span style={{ color: '#34d399', fontWeight: '500' }}>Zoom:</span>
                    <input type="range" min="0.3" max="4" step="0.1" value={zoom}
                        onChange={(e) => setZoom(parseFloat(e.target.value))}
                        style={{ width: '80px', accentColor: '#34d399' }} />
                    <span style={{ color: '#34d399', minWidth: '35px' }}>{zoom.toFixed(1)}x</span>
                </label>
            </div>

            {/* Preset Views - Standard Anatomical Views */}
            <div style={{ 
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                padding: '12px 16px',
                borderRadius: '10px',
                border: '1px solid rgba(100, 116, 139, 0.3)'
            }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ 
                        color: '#22d3ee', 
                        fontSize: '12px', 
                        fontWeight: '600',
                        display: 'flex', 
                        alignItems: 'center', 
                        marginRight: '8px' 
                    }}>
                        📐 Standard Views:
                    </span>
                    {['anterior', 'posterior', 'left', 'right', 'superior', 'inferior'].map(view => (
                        <button
                            key={view}
                            onClick={() => setPresetView(view)}
                            title={presetViews[view].label}
                            style={{
                                padding: '6px 12px',
                                backgroundColor: 'rgba(34, 211, 238, 0.1)',
                                color: '#22d3ee',
                                border: '1px solid rgba(34, 211, 238, 0.4)',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '11px',
                                fontWeight: '500',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}
                            onMouseOver={(e) => { 
                                e.currentTarget.style.backgroundColor = 'rgba(34, 211, 238, 0.3)';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseOut={(e) => { 
                                e.currentTarget.style.backgroundColor = 'rgba(34, 211, 238, 0.1)';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            <span>{presetViews[view].icon}</span>
                            <span>{presetViews[view].shortLabel}</span>
                        </button>
                    ))}
                </div>
                
                {/* Oblique Views */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginTop: '10px' }}>
                    <span style={{ 
                        color: '#a855f7', 
                        fontSize: '12px', 
                        fontWeight: '600',
                        display: 'flex', 
                        alignItems: 'center', 
                        marginRight: '8px' 
                    }}>
                        🔄 Oblique Views:
                    </span>
                    {['anteriorRight', 'anteriorLeft', 'posteriorRight', 'posteriorLeft'].map(view => (
                        <button
                            key={view}
                            onClick={() => setPresetView(view)}
                            title={presetViews[view].label}
                            style={{
                                padding: '6px 12px',
                                backgroundColor: 'rgba(168, 85, 247, 0.1)',
                                color: '#a855f7',
                                border: '1px solid rgba(168, 85, 247, 0.4)',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '11px',
                                fontWeight: '500',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}
                            onMouseOver={(e) => { 
                                e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.3)';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseOut={(e) => { 
                                e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.1)';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            <span>{presetViews[view].icon}</span>
                            <span>{presetViews[view].shortLabel}</span>
                        </button>
                    ))}
                    
                    {/* Reset Button */}
                    <button
                        onClick={() => { setRotation({ x: -0.3, y: 0.5 }); setZoom(1.2); }}
                        title="Reset to default view"
                        style={{
                            padding: '6px 14px',
                            backgroundColor: '#475569',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: '600',
                            marginLeft: 'auto',
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => { 
                            e.currentTarget.style.backgroundColor = '#64748b';
                        }}
                        onMouseOut={(e) => { 
                            e.currentTarget.style.backgroundColor = '#475569';
                        }}
                    >
                        ↺ Reset View
                    </button>
                </div>
            </div>

            {/* Canvas */}
            <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#0a0a14',
                borderRadius: '12px',
                position: 'relative',
                border: '2px solid #1e293b',
                minHeight: '400px'
            }}>
                {loadingVolume ? (
                    <div style={{ 
                        color: '#64748b', 
                        fontSize: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <div style={{ fontSize: '32px' }}>⏳</div>
                        Loading volume data...
                    </div>
                ) : (
                    <canvas
                        ref={canvasRef}
                        width={512}
                        height={512}
                        style={{
                            cursor: isDragging ? 'grabbing' : 'grab',
                            borderRadius: '8px',
                            boxShadow: '0 0 40px rgba(34, 211, 238, 0.1)'
                        }}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onWheel={handleWheel}
                    />
                )}
                
                {/* Rotation info overlay */}
                <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    color: '#94a3b8'
                }}>
                    Rotation: {(rotation.x * 180 / Math.PI).toFixed(0)}° × {(rotation.y * 180 / Math.PI).toFixed(0)}°
                </div>
            </div>

            {/* Instructions */}
            <div style={{ 
                color: '#64748b', 
                fontSize: '11px', 
                textAlign: 'center',
                backgroundColor: 'rgba(15, 23, 42, 0.5)',
                padding: '8px',
                borderRadius: '6px'
            }}>
                🖱️ Drag to rotate • Scroll to zoom • Use preset views for standard orientations • Try different render modes and color maps
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