import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPrint, faArrowLeft, faFileMedical } from '@fortawesome/free-solid-svg-icons';
import logo from '../../assets/logo.png'; // Ensure you have your logo

const PathologyReport = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [caseData, setCaseData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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
        fetchCase();
    }, [id]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <div>Loading Report...</div>;
    if (!caseData) return <div>Report not found.</div>;

    return (
        <div style={{ backgroundColor: '#f0f2f5', minHeight: '100vh', padding: '40px', display: 'flex', justifyContent: 'center' }}>

            {/* --- CONTROLS (Hidden when printing) --- */}
            <div className="no-print" style={{ position: 'fixed', top: '20px', right: '20px', display: 'flex', gap: '10px' }}>
                <button
                    onClick={() => navigate(`/pathologist/viewer/${id}`)}
                    style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                >
                    <FontAwesomeIcon icon={faArrowLeft} /> Back to Viewer
                </button>
                <button
                    onClick={handlePrint}
                    style={{ padding: '10px 20px', backgroundColor: '#122056', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                >
                    <FontAwesomeIcon icon={faPrint} /> Print / Save as PDF
                </button>
            </div>

            {/* --- THE REPORT PAPER --- */}
            <div id="print-area" style={{
                width: '210mm', // A4 Width
                minHeight: '297mm', // A4 Height
                backgroundColor: 'white',
                padding: '40px',
                boxShadow: '0 0 15px rgba(0,0,0,0.1)',
                color: '#333',
                fontFamily: 'Arial, sans-serif'
            }}>
                {/* Header */}
                <div style={{ borderBottom: '3px solid #122056', paddingBottom: '20px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <img src={logo} alt="Logo" style={{ height: '60px' }} />
                        <h1 style={{ margin: '10px 0 0 0', color: '#122056', fontSize: '24px' }}>PATHOLOGY DEPT.</h1>
                        <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Histopathology Examination Report</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <h3 style={{ margin: 0, color: '#122056' }}>FINAL REPORT</h3>
                        <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>Report Date: {new Date().toLocaleDateString()}</p>
                    </div>
                </div>

                {/* Patient Info Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px', backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
                    <div>
                        <p style={{ margin: '5px 0', fontSize: '12px', color: '#888', textTransform: 'uppercase' }}>Patient Name</p>
                        <p style={{ margin: 0, fontWeight: 'bold', fontSize: '16px' }}>{caseData.patient_name || 'N/A'}</p>
                    </div>
                    <div>
                        <p style={{ margin: '5px 0', fontSize: '12px', color: '#888', textTransform: 'uppercase' }}>Case ID</p>
                        <p style={{ margin: 0, fontWeight: 'bold', fontSize: '16px' }}>PATH-{caseData.id}</p>
                    </div>
                    <div>
                        <p style={{ margin: '5px 0', fontSize: '12px', color: '#888', textTransform: 'uppercase' }}>Sample Collected</p>
                        <p style={{ margin: 0, fontWeight: 'bold' }}>{new Date(caseData.uploaded_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                        <p style={{ margin: '5px 0', fontSize: '12px', color: '#888', textTransform: 'uppercase' }}>Referring Physician</p>
                        <p style={{ margin: 0, fontWeight: 'bold' }}>Dr. Mounir (Internal)</p>
                    </div>
                </div>

                {/* The Slide Image */}
                <div style={{ marginBottom: '30px', border: '1px solid #ddd', padding: '5px' }}>
                    <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#122056' }}>Microscopic View:</p>
                    <img
                        src={caseData.image_preview}
                        alt="Biopsy Slide"
                        style={{ width: '100%', maxHeight: '400px', objectFit: 'contain', backgroundColor: 'black' }}
                    />
                </div>

                {/* Diagnostic Findings */}
                <div style={{ marginBottom: '40px' }}>
                    <h3 style={{ color: '#122056', borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>Diagnostic Findings</h3>
                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '15px' }}>
                        {caseData.doctor_notes || "No findings recorded."}
                    </div>
                </div>

                {/* Signature */}
                <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={{ textAlign: 'center', width: '200px' }}>
                        <div style={{ borderBottom: '1px solid #333', marginBottom: '10px', height: '40px' }}>
                            {/* Digital Signature Image could go here */}
                        </div>
                        <p style={{ margin: 0, fontWeight: 'bold' }}>Pathologist Signature</p>
                        <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>License #12345</p>
                    </div>
                </div>

                {/* Footer */}
                <div style={{ marginTop: 'auto', paddingTop: '30px', borderTop: '1px solid #eee', textAlign: 'center', fontSize: '10px', color: '#999' }}>
                    <p>This is a computer-generated report. Clinical correlation is recommended.</p>
                    <p>PathoScope Laboratory Systems | Generated on {new Date().toLocaleString()}</p>
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background-color: white; }
                    #print-area { box-shadow: none; padding: 0; width: 100%; }
                }
            `}</style>
        </div>
    );
};

export default PathologyReport;