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
      <button onClick={handleZoomIn} title="Zoom In" data-testid="flowchart-zoom-in"><ZoomIn size={16}/></button>
      <button onClick={handleZoomOut} title="Zoom Out" data-testid="flowchart-zoom-out"><ZoomOut size={16}/></button>
      <button onClick={handleFitToScreen} title="Fit to Screen" data-testid="flowchart-fit-screen"><Locate size={16}/></button>
    </div>
  );
}
