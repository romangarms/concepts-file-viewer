interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onBack: () => void;
}

export function ZoomControls({ onZoomIn, onZoomOut, onReset, onBack }: Readonly<ZoomControlsProps>) {
  return (
    <div className="zoom-controls">
      <button onClick={onZoomIn} className="zoom-button" title="Zoom In">
        +
      </button>
      <button onClick={onZoomOut} className="zoom-button" title="Zoom Out">
        −
      </button>
      <button onClick={onReset} className="zoom-button" title="Reset View">
        ⟲
      </button>
      <button onClick={onBack} className="zoom-button" title="Back to File Selector">
        ←
      </button>
    </div>
  );
}
