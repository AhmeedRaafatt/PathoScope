import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { faList, faUpload, faTimes, faMicroscope, faUserMd } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { getToken, getUsername } from '../../utls';

const PathologistDashboard = () => {
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showUpload, setShowUpload] = useState(false);
    const navigate = useNavigate();

    // Get the logged-in username for the header
    const username = getUsername() || 'Pathologist';

    // Sidebar Configuration
    const features = [
        { name: 'Dashboard', to: '/pathology', icon: faList },
    ];

    useEffect(() => {
        fetchCases();
    }, []);

    const fetchCases = async () => {
        try {
            const token = getToken();
            const response = await fetch('http://127.0.0.1:8000/api/pathology/list/', {
                headers: { 'Authorization': `Token ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setCases(data);
            } else {
                setError("Failed to load cases. Please check your connection.");
            }
        } catch (err) {
            setError("Network Error: Could not connect to backend.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f4f7fe' }}>
            {/* Sidebar */}
            <Sidebar title="Pathology Dept." features={features} />

            {/* Main Content Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

                {/* --- NEW DASHBOARD HEADER (Replaces Public NavBar) --- */}
                <div style={{
                    height: '70px',
                    backgroundColor: 'white',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    padding: '0 30px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ margin: 0, fontWeight: '600', color: '#2d3748', fontSize: '14px' }}>Dr. {username}</p>
                            <p style={{ margin: 0, color: '#718096', fontSize: '12px' }}>Pathologist</p>
                        </div>
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '50%',
                            backgroundColor: '#e2e8f0', color: '#122056',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '18px'
                        }}>
                            <FontAwesomeIcon icon={faUserMd} />
                        </div>
                    </div>
                </div>
                {/* ---------------------------------------------------- */}

                <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>

                    {/* Header Section */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                        <div>
                            <h1 style={{ color: '#122056', margin: 0, fontSize: '28px' }}>Microscopy Queue</h1>
                            <p style={{ color: '#718096', marginTop: '5px' }}>Manage and analyze digital biopsy slides</p>
                        </div>
                        <button
                            onClick={() => setShowUpload(true)}
                            style={{
                                backgroundColor: '#122056', color: 'white', padding: '12px 24px',
                                borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600',
                                display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px rgba(18, 32, 86, 0.1)'
                            }}
                        >
                            <FontAwesomeIcon icon={faUpload} /> Upload New Slide
                        </button>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div style={{ backgroundColor: '#fed7d7', color: '#c53030', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                            {error}
                        </div>
                    )}

                    {/* Loading State */}
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '50px', color: '#718096' }}>Loading cases...</div>
                    ) : (
                        <div style={{ display: 'grid', gap: '20px' }}>
                            {cases.length > 0 ? (
                                cases.map(item => (
                                    <div key={item.id} style={{
                                        backgroundColor: 'white', borderRadius: '12px', padding: '20px',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        boxShadow: '0 2px 5px rgba(0,0,0,0.05)', borderLeft: '4px solid #122056'
                                    }}>
                                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                            <div style={{ backgroundColor: '#eef2ff', padding: '15px', borderRadius: '50%', color: '#122056' }}>
                                                <FontAwesomeIcon icon={faMicroscope} size="lg" />
                                            </div>
                                            <div>
                                                <h3 style={{ margin: '0 0 5px 0', color: '#2d3748' }}>
                                                    {item.patient_name || `Patient ID: ${item.patient}`}
                                                </h3>
                                                <p style={{ margin: 0, color: '#718096', fontSize: '14px' }}>
                                                    Uploaded: {new Date(item.uploaded_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                            <span style={{
                                                padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold',
                                                backgroundColor: item.status === 'Complete' ? '#def7ec' : '#fffaf0',
                                                color: item.status === 'Complete' ? '#03543f' : '#c05621'
                                            }}>
                                                {item.status || 'Pending'}
                                            </span>
                                            <button
                                                onClick={() => navigate(`/pathology/viewer/${item.id}`, { state: { fileUrl: item.dicom_file } })}
                                                style={{
                                                    padding: '10px 20px', borderRadius: '6px', border: '1px solid #122056',
                                                    backgroundColor: 'transparent', color: '#122056', cursor: 'pointer', fontWeight: '600'
                                                }}
                                            >
                                                Open Viewer
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div style={{ textAlign: 'center', padding: '60px', backgroundColor: 'white', borderRadius: '12px' }}>
                                    <h3 style={{ color: '#2d3748' }}>No Cases Found</h3>
                                    <p style={{ color: '#718096' }}>The queue is empty. Click "Upload New Slide" to begin.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* --- THE UPLOAD MODAL --- */}
            {showUpload && (
                <UploadModal onClose={() => setShowUpload(false)} onUploadSuccess={fetchCases} />
            )}
        </div>
    );
};

// --- SUB-COMPONENT: The Upload Form ---
const UploadModal = ({ onClose, onUploadSuccess }) => {
    const [patientId, setPatientId] = useState('');
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const handleUpload = async (e) => {
        e.preventDefault();
        setUploading(true);
        const token = getToken();

        const formData = new FormData();
        formData.append('patient', patientId);
        formData.append('dicom_file', file);

        try {
            const response = await fetch('http://127.0.0.1:8000/api/pathology/upload/', {
                method: 'POST',
                headers: { 'Authorization': `Token ${token}` },
                body: formData
            });

            if (response.ok) {
                alert("Slide uploaded successfully!");
                onUploadSuccess(); // Refresh the list
                onClose(); // Close modal
            } else {
                alert("Upload failed. Ensure you entered a valid Patient ID.");
            }
        } catch (error) {
            console.error(error);
            alert("Network Error");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '400px', position: 'relative' }}>
                <button
                    onClick={onClose}
                    style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}
                >
                    <FontAwesomeIcon icon={faTimes} />
                </button>

                <h2 style={{ marginTop: 0, color: '#122056' }}>Upload Slide</h2>
                <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Patient ID</label>
                        <input
                            type="number"
                            required
                            placeholder="e.g., 2"
                            value={patientId}
                            onChange={e => setPatientId(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>DICOM File</label>
                        <input
                            type="file"
                            required
                            onChange={e => setFile(e.target.files[0])}
                            style={{ width: '100%' }}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={uploading}
                        style={{
                            marginTop: '10px', padding: '12px', backgroundColor: '#122056', color: 'white',
                            border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'
                        }}
                    >
                        {uploading ? 'Uploading...' : 'Submit Case'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PathologistDashboard;