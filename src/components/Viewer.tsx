import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useStrokeRenderer } from '../hooks/useStrokeRenderer.js';
import { ZoomControls } from './ZoomControls.js';
import { Toast } from './Toast.js';
import type { DrawingData } from '../types.js';

export function Viewer() {
  const location = useLocation();
  const navigate = useNavigate();
  const { canvasRef, render, zoomIn, zoomOut, resetView } = useStrokeRenderer();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; show: boolean }>({
    message: '',
    type: 'success',
    show: false,
  });

  useEffect(() => {
    const data = location.state?.data as DrawingData | undefined;

    if (!data) {
      setToast({
        message: 'No data found. Please select a file first.',
        type: 'error',
        show: true,
      });
      setTimeout(() => {
        navigate('/');
      }, 2000);
      return;
    }

    // Show success toast
    setToast({
      message: `Loaded ${data.strokes.length} strokes`,
      type: 'success',
      show: true,
    });

    // Render the drawing
    render(data);
  }, [location.state, navigate, render]);

  const handleBack = () => {
    navigate('/');
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, show: false }));
  };

  return (
    <>
      <canvas ref={canvasRef} id="canvas"></canvas>
      <ZoomControls
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onReset={resetView}
        onBack={handleBack}
      />
      <Toast
        message={toast.message}
        type={toast.type}
        show={toast.show}
        onHide={hideToast}
      />
    </>
  );
}
