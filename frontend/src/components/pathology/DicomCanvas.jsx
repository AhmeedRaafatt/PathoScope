import React, { useRef, useState, useEffect, useImperativeHandle, forwardRef } from 'react';

// 1. "label" IS DEFINED HERE IN THE PROPS
const DicomCanvas = forwardRef(({ fileUrl, label, initialAnnotations, onAnnotationsChange }, ref) => {
    // --- State ---
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 }); // Pan position
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // --- Image Adjustments State ---
    const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
    const [brightness, setBrightness] = useState(100);
    const [contrast, setContrast] = useState(100);
    const [saturate, setSaturate] = useState(100);
    const [invert, setInvert] = useState(0);
    const [blur, setBlur] = useState(0);

    // Tools
    const [tool, setTool] = useState('pan'); // 'pan', 'draw', 'ruler'

    // Safety: Ensure annotations is always an array
    const [drawings, setDrawings] = useState(Array.isArray(initialAnnotations) ? initialAnnotations : []);

    const [currentPath, setCurrentPath] = useState([]);
    const [isDrawing, setIsDrawing] = useState(false);

    // Refs
    const containerRef = useRef(null);
    const imgRef = useRef(null);
    const canvasRef = useRef(null);

    // --- Controls Exposed to Parent ---
    useImperativeHandle(ref, () => ({
        setToolMode: (mode) => setTool(mode),
        clearAll: () => {
            setDrawings([]);
            if (onAnnotationsChange) onAnnotationsChange([]);
        },
        // AI Simulation (Kept for compatibility)
        simulateAI: () => {
             const cx = imgRef.current ? imgRef.current.naturalWidth / 2 : 100;
             const cy = imgRef.current ? imgRef.current.naturalHeight / 2 : 100;
             const aiBox = { type: 'rect', x: cx - 50, y: cy - 50, w: 100, h: 100, color: '#00FF00', label: 'AI Tumor' };
             const updated = [...drawings, aiBox];
             setDrawings(updated);
             if(onAnnotationsChange) onAnnotationsChange(updated);
        },
        // Zoom Controls
        zoomIn: () => handleManualZoom(1.2),
        zoomOut: () => handleManualZoom(0.8),
        resetView: () => resetAll(),

        // Adjustment Controls
        rotateRight: () => setRotation(p => (p + 90) % 360),
        setBrightness: (v) => setBrightness(v),
        setContrast: (v) => setContrast(v),
        setSaturate: (v) => setSaturate(v),
        setInvert: (v) => setInvert(v),
        setBlur: (v) => setBlur(v)
    }));

    const validUrl = fileUrl ? (fileUrl.startsWith('http') ? fileUrl : `http://127.0.0.1:8000${fileUrl}`) : null;

    // Reset Function
    const resetAll = () => {
        setRotation(0); setBrightness(100); setContrast(100);
        setSaturate(100); setInvert(0); setBlur(0);
        fitImageToScreen();
    };

    // --- Auto-Fit Logic ---
    const fitImageToScreen = () => {
        const img = imgRef.current;
        const container = containerRef.current;
        if (!img || !container) return;

        const natW = img.naturalWidth || 1000;
        const natH = img.naturalHeight || 1000;

        // Sync Canvas Resolution
        if (canvasRef.current) {
            canvasRef.current.width = natW;
            canvasRef.current.height = natH;
        }

        // Calculate Scale to fit
        const contW = container.clientWidth;
        const contH = container.clientHeight;
        const scaleX = contW / natW;
        const scaleY = contH / natH;
        const fitScale = Math.min(scaleX, scaleY) * 0.95;

        // Center it
        const startX = (contW - (natW * fitScale)) / 2;
        const startY = (contH - (natH * fitScale)) / 2;

        setScale(fitScale);
        setPosition({ x: startX, y: startY });

        setTimeout(redraw, 50);
    };

    useEffect(() => {
        if (imgRef.current && validUrl) {
            imgRef.current.onload = fitImageToScreen;
        }
    }, [validUrl]);

    // Redraw Loop
    useEffect(() => {
        redraw();
    }, [drawings, currentPath, scale, position, rotation]);

    // --- Zoom Logic ---
    const handleManualZoom = (factor) => {
        const newScale = Math.min(Math.max(0.1, scale * factor), 10);
        setScale(newScale);
    };

    // --- Coordinate System (Handles Rotation) ---
    const getCoords = (e) => {
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // 1. Remove Pan & Scale
        let x = (mouseX - position.x) / scale;
        let y = (mouseY - position.y) / scale;

        // 2. Remove Rotation (Inverse)
        const img = imgRef.current;
        if (!img) return { x, y };

        const w = img.naturalWidth;
        const h = img.naturalHeight;
        const cx = w / 2;
        const cy = h / 2;

        let dx = x - cx;
        let dy = y - cy;
        let rad = -rotation * (Math.PI / 180);

        let rx = dx * Math.cos(rad) - dy * Math.sin(rad);
        let ry = dx * Math.sin(rad) + dy * Math.cos(rad);

        return { x: rx + cx, y: ry + cy };
    };

    // --- Drawing Engine ---
    const redraw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Apply Rotation Context
        ctx.save();
        ctx.translate(canvas.width/2, canvas.height/2);
        ctx.rotate(rotation * Math.PI / 180);
        ctx.translate(-canvas.width/2, -canvas.height/2);

        const drawShape = (shape) => {
            ctx.lineWidth = 3 / scale;
            ctx.font = `${20 / scale}px Arial`;

            if (shape.type === 'path') {
                ctx.strokeStyle = shape.color || 'red';
                ctx.beginPath();
                shape.points.forEach((p, i) => {
                    if (i === 0) ctx.moveTo(p.x, p.y);
                    else ctx.lineTo(p.x, p.y);
                });
                ctx.stroke();
            } else if (shape.type === 'line') {
                ctx.strokeStyle = '#FFFF00';
                ctx.beginPath();
                ctx.moveTo(shape.start.x, shape.start.y);
                ctx.lineTo(shape.end.x, shape.end.y);
                ctx.stroke();

                const r = 4 / scale;
                ctx.fillStyle = 'red';
                ctx.beginPath(); ctx.arc(shape.start.x, shape.start.y, r, 0, 2*Math.PI); ctx.fill();
                ctx.beginPath(); ctx.arc(shape.end.x, shape.end.y, r, 0, 2*Math.PI); ctx.fill();

                const dist = Math.sqrt(
                    Math.pow(shape.end.x - shape.start.x, 2) +
                    Math.pow(shape.end.y - shape.start.y, 2)
                ).toFixed(0);

                ctx.fillStyle = 'white';
                ctx.fillText(`${dist} px`, shape.end.x + (10/scale), shape.end.y);
            } else if (shape.type === 'rect') {
                ctx.strokeStyle = shape.color;
                ctx.strokeRect(shape.x, shape.y, shape.w, shape.h);
                ctx.fillStyle = shape.color;
                ctx.fillText(shape.label, shape.x, shape.y - (5/scale));
            }
        };

        if (Array.isArray(drawings)) drawings.forEach(drawShape);

        if (currentPath.length > 0) {
            if (tool === 'draw') {
                drawShape({ type: 'path', points: currentPath, color: 'red' });
            } else if (tool === 'ruler') {
                drawShape({ type: 'line', start: currentPath[0], end: currentPath[currentPath.length-1] });
            }
        }
        ctx.restore();
    };

    // --- Mouse Handlers ---
    const handleMouseDown = (e) => {
        if (tool === 'pan') {
            e.preventDefault();
            setIsDragging(true);
            setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
            return;
        }
        e.preventDefault();
        setIsDrawing(true);
        const coords = getCoords(e);
        setCurrentPath([coords]);
    };

    const handleMouseMove = (e) => {
        if (tool === 'pan') {
            if (!isDragging) return;
            setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
            return;
        }
        if (!isDrawing) return;
        const coords = getCoords(e);
        if (tool === 'draw') setCurrentPath(prev => [...prev, coords]);
        else if (tool === 'ruler') setCurrentPath(prev => [...prev, coords]);
    };

    const handleMouseUp = (e) => {
        if (tool === 'pan') { setIsDragging(false); return; }
        if (!isDrawing) return;

        setIsDrawing(false);
        const coords = getCoords(e);

        let newShape = null;
        if (tool === 'draw') newShape = { type: 'path', points: currentPath, color: 'red' };
        else if (tool === 'ruler' && currentPath.length > 1) newShape = { type: 'line', start: currentPath[0], end: coords, color: 'blue' };

        if (newShape) {
            const updated = [...drawings, newShape];
            setDrawings(updated);
            if(onAnnotationsChange) onAnnotationsChange(updated);
        }
        setCurrentPath([]);
    };

    const handleWheel = (e) => {
        e.preventDefault();
        const factor = 1 + (-e.deltaY * 0.001);
        handleManualZoom(factor);
    };

    return (
        <div
            ref={containerRef}
            style={{
                height: '100%', width: '100%',
                display: 'flex', flexDirection: 'column',
                border: '1px solid #ccc', borderRadius: '8px',
                overflow: 'hidden', backgroundColor: '#000',
                position: 'relative'
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            {/* --- HEADER BAR --- */}
            <div style={{ padding: '8px 12px', background: '#122056', display: 'flex', justifyContent: 'space-between', zIndex: 10 }}>
                {/* LEFT LABEL: Enforce White Box with Dark Text */}
                <span style={{
                    fontWeight: 'bold',
                    background: 'white',
                    color: '#122056',
                    padding: '2px 8px',
                    borderRadius: '4px'
                }}>
                    {label || "Viewer"} {tool !== 'pan' && `[${tool.toUpperCase()}]`}
                </span>

                {/* RIGHT INFO: Enforce White Box with Dark Text */}
                <span style={{
                    fontSize: '12px',
                    alignSelf: 'center',
                    background: 'white',
                    color: '#122056',
                    padding: '2px 8px',
                    borderRadius: '4px'
                }}>
                    Zoom: {(scale * 100).toFixed(0)}% | Rot: {rotation}°
                </span>
            </div>

            {/* --- VIEWPORT --- */}
            <div
                style={{ flex: 1, overflow: 'hidden', cursor: tool === 'pan' ? (isDragging ? 'grabbing' : 'grab') : 'crosshair', position: 'relative' }}
                onWheel={handleWheel}
            >
                {validUrl ? (
                    <div
                        style={{
                            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                            transformOrigin: '0 0',
                            transition: isDragging || isDrawing ? 'none' : 'transform 0.1s ease-out',
                            position: 'absolute', top: 0, left: 0
                        }}
                    >
                        <img
                            ref={imgRef}
                            src={validUrl}
                            alt="Pathology Slide"
                            draggable={false}
                            style={{
                                display: 'block', pointerEvents: 'none',
                                transform: `rotate(${rotation}deg)`,
                                filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%) invert(${invert}%) blur(${blur}px)`
                            }}
                        />
                        <canvas
                            ref={canvasRef}
                            style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
                        />
                    </div>
                ) : (
                    <div style={{color: '#666', textAlign: 'center', marginTop: '50px'}}>No Image Available</div>
                )}
            </div>
        </div>
    );
});
export default DicomCanvas;