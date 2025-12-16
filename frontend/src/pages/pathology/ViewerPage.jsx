import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DicomCanvas from '../../components/pathology/DicomCanvas';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowLeft, faColumns, faSquare, faSave, faPen, faRuler,
    faHandPaper, faEraser, faRobot, faSearchPlus, faSearchMinus,
    faCompress, faFileMedical
} from '@fortawesome/free-solid-svg-icons';

const ViewerPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const canvasRef = useRef();

    // Data State
    const [caseData, setCaseData] = useState(null);
    const [notes, setNotes] = useState("");
    const [annotations, setAnnotations] = useState([]);

    // UI State
    const [activeTool, setActiveTool] = useState('pan');
    const [isSaving, setIsSaving] = useState(false);

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
                    setNotes(currentCase.doctor_notes || "");
                    setAnnotations(currentCase.annotations || []);
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

    const handleToolChange = (tool) => {
        setActiveTool(tool);
        if (canvasRef.current) canvasRef.current.setToolMode(tool);
    };

   const handleAI = async () => {
        setIsSaving(true); // Reuse saving spinner
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/pathology/case/${id}/ai-analyze/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();

                // Update State immediately to show results
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

    // Zoom Handlers
    const zoomIn = () => { if (canvasRef.current) canvasRef.current.zoomIn(); };
    const zoomOut = () => { if (canvasRef.current) canvasRef.current.zoomOut(); };
    const resetView = () => { if (canvasRef.current) canvasRef.current.resetView(); };

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

    const handleSave = async () => {
        setIsSaving(true);
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`http://127.0.0.1:8000/api/pathology/case/${id}/save/`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    doctor_notes: notes,
                    annotations: annotations
                })
            });
            if (response.ok) alert("✅ Saved Successfully!");
            else alert("❌ Save Failed");
        } catch (e) {
            console.error(e);
            alert("Network Error");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div style={{ backgroundColor: '#f4f7fe', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

            {/* TOP BAR */}
            <div style={{ backgroundColor: 'white', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button onClick={() => navigate('/pathologist/dashboard')} style={{ background: 'none', border: 'none', color: '#122056', cursor: 'pointer', fontSize: '16px' }}>
                        <FontAwesomeIcon icon={faArrowLeft} /> Back
                    </button>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '18px', color: '#122056' }}>Case #{id}</h2>
                    </div>
                </div>

                {/* TOOLBAR */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {/* Zoom Group */}
                    <div style={{display: 'flex', gap: '2px', marginRight: '10px', borderRight: '1px solid #ddd', paddingRight: '10px'}}>
                        <ToolBtn icon={faSearchPlus} onClick={zoomIn} title="Zoom In" />
                        <ToolBtn icon={faSearchMinus} onClick={zoomOut} title="Zoom Out" />
                        <ToolBtn icon={faCompress} onClick={resetView} title="Fit to Screen" />
                    </div>

                    {/* Tools Group */}
                    <ToolBtn icon={faHandPaper} active={activeTool === 'pan'} onClick={() => handleToolChange('pan')} title="Pan Tool" />
                    <ToolBtn icon={faPen} active={activeTool === 'draw'} onClick={() => handleToolChange('draw')} title="Draw Tool" />
                    <ToolBtn icon={faRuler} active={activeTool === 'ruler'} onClick={() => handleToolChange('ruler')} title="Measure Tool" />
                    <ToolBtn icon={faEraser} onClick={handleClear} title="Clear All" />

                    {/* AI Button */}
                    <button onClick={handleAI} style={{ padding: '8px 12px', backgroundColor: '#6c5ce7', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginLeft: '5px' }}>
                        <FontAwesomeIcon icon={faRobot} /> AI
                    </button>

                    {/* NEW: Report Button */}
                    <button
                        onClick={() => navigate(`/pathologist/report/${id}`)}
                        style={{
                            padding: '8px 12px', backgroundColor: '#e2e8f0', color: '#122056',
                            border: '1px solid #cbd5e0', borderRadius: '5px', cursor: 'pointer', marginLeft: '5px',
                            display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold'
                        }}
                        title="View Final Report"
                    >
                        <FontAwesomeIcon icon={faFileMedical} /> Report
                    </button>
                </div>

                {/* Comparison Dropdown */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#f7fafc', padding: '5px 10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <FontAwesomeIcon icon={isCompareMode ? faColumns : faSquare} color="#122056" />
                    <select onChange={handleCompareSelect} style={{ backgroundColor: 'transparent', color: '#2d3748', border: 'none', outline: 'none', fontSize: '13px', cursor: 'pointer', minWidth: '150px' }}>
                        <option value="">-- Single View --</option>
                        {patientCases.map(c => <option key={c.id} value={c.id}>Case #{c.id}</option>)}
                    </select>
                </div>
            </div>

            {/* MAIN AREA */}
            <div style={{ flex: 1, padding: '20px', display: 'flex', gap: '20px', flexDirection: 'column' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</div>
                ) : (
                    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: isCompareMode ? '1fr 1fr' : '1fr', gap: '20px', minHeight: '500px' }}>
                        <div style={{ boxShadow: '0 4px 6px rgba(0,0,0,0.1)', backgroundColor: 'white', borderRadius: '8px', padding: '5px' }}>
                            {caseData?.image_preview ? (
                                <DicomCanvas
                                    ref={canvasRef}
                                    fileUrl={caseData.image_preview}
                                    label={`Primary: Case #${id}`}
                                    initialAnnotations={annotations}
                                    onAnnotationsChange={setAnnotations}
                                />
                            ) : (
                                <div style={{ padding: '20px', color: 'red' }}>Error: File not found.</div>
                            )}
                        </div>

                        {isCompareMode && (
                            <div style={{ boxShadow: '0 4px 6px rgba(0,0,0,0.1)', backgroundColor: 'white', borderRadius: '8px', padding: '5px' }}>
                                <DicomCanvas fileUrl={secondaryFile} label={`Comparison: Reference`} />
                            </div>
                        )}
                    </div>
                )}

                {/* SAVE BOX */}
                <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#122056' }}> <FontAwesomeIcon icon={faSave} /> Report </h3>
                    <textarea
                        rows="3"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Diagnosis notes..."
                        style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '10px' }}
                    ></textarea>
                    <div style={{textAlign: 'right'}}>
                        <button onClick={handleSave} disabled={isSaving} style={{ padding: '10px 25px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                            {isSaving ? "Saving..." : "Save Report"}
                        </button>
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
            width: '36px', height: '36px', borderRadius: '5px',
            border: active ? '2px solid #122056' : '1px solid #ddd',
            backgroundColor: active ? '#eef2ff' : 'white',
            cursor: 'pointer', color: '#122056'
        }}
    >
        <FontAwesomeIcon icon={icon} />
    </button>
);

export default ViewerPage;