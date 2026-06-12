import { ZoomIn, ZoomOut, Locate, FileDown } from 'lucide-react';

interface ZoomToolbarProps {
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  handleFitToScreen: () => void;
  exportSchema?: () => void;
  isEditMode: boolean;
}

export function ZoomToolbar({
  handleZoomIn,
  handleZoomOut,
  handleFitToScreen,
  exportSchema,
  isEditMode
}: ZoomToolbarProps) {
  return (
    <div className="flowchart-zoom-toolbar">
      <button onClick={handleZoomIn} title="Zoom In"><ZoomIn size={16}/></button>
      <button onClick={handleZoomOut} title="Zoom Out"><ZoomOut size={16}/></button>
      <button onClick={handleFitToScreen} title="Fit to Screen"><Locate size={16}/></button>
      {isEditMode && exportSchema && (
        <button onClick={exportSchema} title="Export Schema to Clipboard"><FileDown size={16}/></button>
      )}
    </div>
  );
}
