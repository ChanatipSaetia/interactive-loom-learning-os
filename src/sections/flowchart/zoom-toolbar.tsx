import { ZoomIn, ZoomOut, Locate } from 'lucide-react';

interface ZoomToolbarProps {
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  handleFitToScreen: () => void;
}

export function ZoomToolbar({
  handleZoomIn,
  handleZoomOut,
  handleFitToScreen
}: ZoomToolbarProps) {
  return (
    <div className="flowchart-zoom-toolbar">
      <button onClick={handleZoomIn} title="Zoom In"><ZoomIn size={16}/></button>
      <button onClick={handleZoomOut} title="Zoom Out"><ZoomOut size={16}/></button>
      <button onClick={handleFitToScreen} title="Fit to Screen"><Locate size={16}/></button>
    </div>
  );
}
