import React, { useRef, useState, useEffect, useImperativeHandle, forwardRef } from 'react';

const DicomCanvas = forwardRef(({ fileUrl, label, initialAnnotations, onAnnotationsChange }, ref) => {
    // --- State ---
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 }); // Pan position (x,y)
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // Tools
    const [tool, setTool] = useState('pan'); // 'pan', 'draw', 'ruler'

    // Data (Safety check: Ensure array)
    const [drawings, setDrawings] = useState(Array.isArray(initialAnnotations) ? initialAnnotations : []);

    const [currentPath, setCurrentPath] = useState([]);
    const [isDrawing, setIsDrawing] = useState(false);

    // Refs
    const containerRef = useRef(null); // The fixed window
    const imgRef = useRef(null);       // The actual image
    const canvasRef = useRef(null);    // The drawing layer

    // --- 1. Expose Functions to Parent (ViewerPage) ---
    useImperativeHandle(ref, () => ({
        setToolMode: (mode) => setTool(mode),
        clearAll: () => {
            setDrawings([]);
            if (onAnnotationsChange) onAnnotationsChange([]);
        },
        simulateAI: () => {
            // Place AI Box in center of image
            const cx = imgRef.current ? imgRef.current.naturalWidth / 2 : 100;
            const cy = imgRef.current ? imgRef.current.naturalHeight / 2 : 100;
            const aiBox = {
                type: 'rect',
                x: cx - 50, y: cy - 50, w: 100, h: 100,
                color: '#00FF00', label: 'AI Tumor'
            };
            const updated = [...drawings, aiBox];
            setDrawings(updated);
            if(onAnnotationsChange) onAnnotationsChange(updated);
        },
        // --- NEW: External Zoom Controls ---
        zoomIn: () => handleManualZoom(1.2),
        zoomOut: () => handleManualZoom(0.8),
        resetView: () => fitImageToScreen()
    }));

    // URL Logic
    const validUrl = fileUrl
        ? (fileUrl.startsWith('http') ? fileUrl : `http://127.0.0.1:8000${fileUrl}`)
        : null;

    // --- 2. Auto-Fit Logic (Runs on Load) ---
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
        const fitScale = Math.min(scaleX, scaleY) * 0.95; // 95% fit

        // Center it
        const startX = (contW - (natW * fitScale)) / 2;
        const startY = (contH - (natH * fitScale)) / 2;

        setScale(fitScale);
        setPosition({ x: startX, y: startY });

        // Force redraw shortly after
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
    }, [drawings, currentPath, scale, position]);

    // --- 3. Zoom Logic (Center-Based) ---
    const handleManualZoom = (factor) => {
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        // 1. Calculate the point on the image currently at the center of the screen
        const imagePointX = (centerX - position.x) / scale;
        const imagePointY = (centerY - position.y) / scale;

        // 2. Apply new scale
        const newScale = Math.min(Math.max(0.1, scale * factor), 10);

        // 3. Calculate new Pan position to keep that point in the center
        const newX = centerX - (imagePointX * newScale);
        const newY = centerY - (imagePointY * newScale);

        setScale(newScale);
        setPosition({ x: newX, y: newY });
    };

    // --- 4. Coordinate System (The Offset Fix) ---
    const getCoords = (e) => {
        const container = containerRef.current;
        const rect = container.getBoundingClientRect();

        // Mouse relative to the Container (the black window)
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Transform to Image Coordinates:
        // (ScreenPos - PanOffset) / Scale
        const trueX = (mouseX - position.x) / scale;
        const trueY = (mouseY - position.y) / scale;

        return { x: trueX, y: trueY };
    };

    // --- 5. Drawing Engine ---
    const redraw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const drawShape = (shape) => {
            // Keep line thickness constant visually (inverse scale)
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
                // Ruler
                ctx.strokeStyle = '#FFFF00';
                ctx.beginPath();
                ctx.moveTo(shape.start.x, shape.start.y);
                ctx.lineTo(shape.end.x, shape.end.y);
                ctx.stroke();

                // Endpoints
                ctx.fillStyle = 'red';
                const r = 4 / scale;
                ctx.beginPath(); ctx.arc(shape.start.x, shape.start.y, r, 0, 2*Math.PI); ctx.fill();
                ctx.beginPath(); ctx.arc(shape.end.x, shape.end.y, r, 0, 2*Math.PI); ctx.fill();

                // Distance Label
                const dist = Math.sqrt(
                    Math.pow(shape.end.x - shape.start.x, 2) +
                    Math.pow(shape.end.y - shape.start.y, 2)
                ).toFixed(0);

                ctx.fillStyle = 'white';
                // Draw text slightly offset
                ctx.fillText(`${dist} px`, shape.end.x + (10/scale), shape.end.y);
            } else if (shape.type === 'rect') {
                ctx.strokeStyle = shape.color;
                ctx.strokeRect(shape.x, shape.y, shape.w, shape.h);
                ctx.fillStyle = shape.color;
                ctx.fillText(shape.label, shape.x, shape.y - (5/scale));
            }
        };

        if (Array.isArray(drawings)) drawings.forEach(drawShape);

        // Current Active Path
        if (currentPath.length > 0) {
            if (tool === 'draw') {
                drawShape({ type: 'path', points: currentPath, color: 'red' });
            } else if (tool === 'ruler') {
                drawShape({ type: 'line', start: currentPath[0], end: currentPath[currentPath.length-1] });
            }
        }
    };

    // --- 6. Mouse Handlers ---
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
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
            return;
        }
        if (!isDrawing) return;
        const coords = getCoords(e);
        if (tool === 'draw') {
            setCurrentPath(prev => [...prev, coords]);
        } else if (tool === 'ruler') {
            setCurrentPath(prev => [...prev, coords]);
        }
    };

    const handleMouseUp = (e) => {
        if (tool === 'pan') {
            setIsDragging(false);
            return;
        }
        if (!isDrawing) return;
        setIsDrawing(false);
        const coords = getCoords(e);

        let newShape = null;
        if (tool === 'draw') {
             newShape = { type: 'path', points: currentPath, color: 'red' };
        } else if (tool === 'ruler' && currentPath.length > 1) {
             newShape = { type: 'line', start: currentPath[0], end: coords, color: 'blue' };
        }

        if (newShape) {
            const updated = [...drawings, newShape];
            setDrawings(updated);
            if(onAnnotationsChange) onAnnotationsChange(updated);
        }
        setCurrentPath([]);
    };

    // Wheel Zoom (User friendly alternative to buttons)
    const handleWheel = (e) => {
        e.preventDefault(); // Stop page scroll
        const scaleAdjustment = -e.deltaY * 0.001;
        const factor = 1 + scaleAdjustment;
        handleManualZoom(factor); // Reuse logic
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
        >
            <div style={{ padding: '8px 12px', background: '#122056', color: 'white', display: 'flex', justifyContent: 'space-between', zIndex: 10 }}>
                <span style={{ fontWeight: 'bold' }}>{label || "Viewer"} {tool !== 'pan' && `[${tool.toUpperCase()}]`}</span>
                <span style={{fontSize: '12px', alignSelf: 'center'}}>Zoom: {(scale * 100).toFixed(0)}%</span>
            </div>

            <div
                style={{ flex: 1, overflow: 'hidden', cursor: tool === 'pan' ? (isDragging ? 'grabbing' : 'grab') : 'crosshair', position: 'relative' }}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                {validUrl ? (
                    <div
                        style={{
                            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                            transformOrigin: '0 0', // CRITICAL: Fixes the drawing offset bugs
                            transition: isDragging || isDrawing ? 'none' : 'transform 0.1s ease-out',
                            position: 'absolute',
                            top: 0,
                            left: 0
                        }}
                    >
                        <img
                            ref={imgRef}
                            src={validUrl}
                            alt="Pathology Slide"
                            style={{ display: 'block', pointerEvents: 'none' }}
                            draggable={false}
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