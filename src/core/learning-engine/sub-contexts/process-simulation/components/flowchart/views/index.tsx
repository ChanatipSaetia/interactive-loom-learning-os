/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useRef, useState } from 'react';
import * as Icons from 'lucide-react';

import { ZoomToolbar } from '../zoom-toolbar';
import { useCamera, getNodesBBox, type CaptionPlacement } from '../useCamera';
import { StepCaption, type StepCaptionData } from '../step-caption';
import type { ForkHighlights } from '../fork-highlights';
import type { StoryRoute } from '../story-route';
import { ICONS, COLORS } from '../types';
import type { UnifiedFlowchartSchema } from '../types';

import { getViewSpacing, positionViewNodes, routeViewRelations } from './geometry';
import { SequenceView } from './sequence-view';
import { StandardView } from './standard-view';

const Workflow = Icons.Workflow;

/** Screen gap between the focused nodes and the caption under them. */
const CAPTION_GAP = 14;
const CAPTION_MAX_W = 360;
/** Keeps the caption off the canvas edges. */
const CAPTION_EDGE = 12;

/**
 * Screen pixels of the SVG covered by the section's floating view switcher
 * (top) and journey dock (bottom), so the camera frames the free area between.
 */
function measureOverlayInsets(svg: SVGSVGElement | null) {
  const wrapper = svg?.closest('.flowchart-canvas-wrapper');
  if (!svg || !wrapper) return undefined;
  const svgRect = svg.getBoundingClientRect();
  const menu = wrapper.querySelector('.flowchart-view-menu')?.getBoundingClientRect();
  const dock = wrapper.querySelector('.flowchart-controls-dock')?.getBoundingClientRect();
  return {
    top: menu && menu.height > 0 ? Math.max(0, menu.bottom - svgRect.top) : 0,
    bottom: dock && dock.height > 0 ? Math.max(0, svgRect.bottom - dock.top) : 0,
  };
}

export interface FlowchartViewProps {
  viewKey: string;
  schema: UnifiedFlowchartSchema;
  activeNodeIds: string[] | null;
  activeRelationIds: string[] | null;
  highlightedNodeId: string | null;
  handleNodeClick: (nodeId: string, x?: number, y?: number) => void;
  instanceId: string;
  isGridMode: boolean;
  isFullscreen?: boolean;
  activeNodePopup?: {
    nodeId: string;
    x: number;
    y: number;
    views: { key: string; name: string; type: string }[];
  } | null;
  setActiveNodePopup: (popup: any) => void;
  onEnterFullscreen?: () => void;
  focusAfterViewSwitch?: string | null;
  onCameraFocused?: () => void;
  onCameraControls?: (controls: { handleZoomIn: () => void; handleZoomOut: () => void; handleFitToScreen: () => void } | null) => void;
  /** Narration for the current journey step, shown next to the focused nodes. */
  stepCaption?: StepCaptionData | null;
  /** The fork the current step passes through, resolved for this view. */
  forkHighlights?: ForkHighlights | null;
  /** Route views: the journey as hand-offs between systems. */
  storyRoute?: StoryRoute | null;
  onSwitchPath?: (journeyId: string, stepIndex: number) => void;
}

export function FlowchartView({
  viewKey,
  schema,
  activeNodeIds,
  activeRelationIds,
  highlightedNodeId,
  handleNodeClick,
  instanceId: viewInstanceId,
  isGridMode,
  isFullscreen,
  activeNodePopup,
  setActiveNodePopup,
  onEnterFullscreen,
  focusAfterViewSwitch,
  onCameraFocused,
  onCameraControls,
  stepCaption,
  forkHighlights,
  storyRoute,
  onSwitchPath
}: FlowchartViewProps) {
  const view = schema.views![viewKey];
  const isSequenceView = viewKey === 'SEQUENCE';

  const spacing = useMemo(() => getViewSpacing(view, viewKey), [view, viewKey]);

  const positioned = useMemo(() => positionViewNodes(view, spacing, isSequenceView), [view, spacing, isSequenceView]);

  const nodeMap = useMemo(() => {
    const map = new Map();
    positioned.forEach(n => map.set(n.id, n));
    return map;
  }, [positioned]);

  const routedRelations = useMemo(
    () => routeViewRelations(view, viewKey, schema, positioned, spacing, isSequenceView),
    [view, viewKey, schema, positioned, spacing, isSequenceView]
  );

  const minX = isSequenceView ? 0 : Math.min(...positioned.map(n => n.x || 0));
  const maxX = isSequenceView ? 800 : Math.max(...positioned.map(n => n.x || 0));
  const minY = isSequenceView ? 0 : Math.min(...positioned.map(n => n.y || 0));
  const maxY = isSequenceView ? 600 : Math.max(...positioned.map(n => n.y || 0));



  const positionedNodesRef = useRef(positioned);
  useEffect(() => {
    positionedNodesRef.current = positioned;
  }, [positioned]);

  const camera = useCamera({
    positionedNodesRef
  });

  const { focusOnNodes, handleZoomIn, handleZoomOut, fitToScreen } = camera;

  // Nodes the camera frames for the current step, with the caption beside them
  const focusNodeIds = useMemo(() => {
    if (viewKey === 'STATE_MACHINE') return highlightedNodeId ? [highlightedNodeId] : null;
    if (!activeNodeIds || activeNodeIds.length === 0) return null;
    return activeNodeIds;
  }, [viewKey, activeNodeIds, highlightedNodeId]);

  const focusBBox = useMemo(
    () => (focusNodeIds ? getNodesBBox(positioned, focusNodeIds) : null),
    [focusNodeIds, positioned]
  );

  // The caption is already laid out at its final size when this runs, so the
  // camera can leave room for it and pick the side where it fits best.
  const captionRef = useRef<HTMLDivElement | null>(null);

  // Re-frame when the canvas changes size (fullscreen, window resize)
  const [viewportSize, setViewportSize] = useState('');
  useEffect(() => {
    const el = camera.svgRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      setViewportSize(`${Math.round(entry.contentRect.width)}x${Math.round(entry.contentRect.height)}`);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [camera.svgRef]);
  const [captionPlacement, setCaptionPlacement] = useState<CaptionPlacement>('below');
  useEffect(() => {
    if (!focusNodeIds) return;
    const captionEl = stepCaption ? captionRef.current : null;
    const captionH = captionEl?.offsetHeight ?? 0;
    const placement = focusOnNodes(focusNodeIds, {
      insets: measureOverlayInsets(camera.svgRef.current),
      caption: captionEl && captionH > 0
        ? {
            width: captionEl.offsetWidth,
            height: captionH,
            gap: CAPTION_GAP,
          }
        : undefined,
    });
    if (placement) setCaptionPlacement(placement);
  }, [focusNodeIds, focusOnNodes, stepCaption, camera.svgRef, viewportSize]);

  const hasFocusedRef = useRef(false);
  useEffect(() => {
    if (focusAfterViewSwitch && !hasFocusedRef.current) {
      hasFocusedRef.current = true;
      focusOnNodes([focusAfterViewSwitch]);
      onCameraFocused?.();
    }
  }, [focusAfterViewSwitch, focusOnNodes, onCameraFocused]);

  useEffect(() => {
    if (onCameraControls) {
      onCameraControls({
        handleZoomIn,
        handleZoomOut,
        handleFitToScreen: () => fitToScreen(minX, maxX, minY, maxY)
      });
    }
  }, [handleZoomIn, handleZoomOut, fitToScreen, onCameraControls, minX, maxX, minY, maxY]);

  if (!view) {
    return (
      <div className="flowchart-empty">
        <Workflow size={48} strokeWidth={1} opacity={0.2} />
        <p>No content for {viewKey} view.</p>
      </div>
    );
  }

  const transformStr = `translate(${camera.transform.translateX}, ${camera.transform.translateY}) scale(${camera.transform.scale})`;

  const viewLabel = {
    'EVENT_STORMING': 'Event Storming',
    'STATE_MACHINE': 'State Machine',
    'SYS_ARCH': 'System Architecture',
    'DATA_FLOW': 'Data Flow',
    'SWIMLANES': 'Activity Lanes',
    'SEQUENCE': 'Sequence'
  }[viewKey] || viewKey;

  return (
    <div className="flowchart-canvas-inner" style={{ position: 'relative' }}>
      {isGridMode && (
        <div style={{
          position: 'absolute',
          top: '8px',
          left: '12px',
          zIndex: 15,
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '12px',
           fontWeight: 600,
           color: 'var(--ctp-overlay1)',
           pointerEvents: 'none',
           textTransform: 'uppercase',
           letterSpacing: '0.5px'
        }}>
          {viewLabel}
        </div>
      )}

      <div className="flowchart-body">
        {isGridMode && (
          <ZoomToolbar
            handleZoomIn={camera.handleZoomIn}
            handleZoomOut={camera.handleZoomOut}
            handleFitToScreen={() => camera.fitToScreen(minX, maxX, minY, maxY)}
          />
        )}

        <svg
          ref={camera.svgRef}
          className="flowchart-svg"
          data-testid={`flowchart-svg-${viewKey}`}
          data-fullscreen={isFullscreen || false}
          width="100%"
          height="100%"
          onMouseMove={(e) => camera.handlePointerMove(e.clientX, e.clientY)}
          onMouseUp={camera.handlePointerUp}
          onMouseLeave={camera.handlePointerUp}
          onMouseDown={camera.onSvgMouseDown}
          onTouchEnd={camera.handlePointerUp}
        >
          <defs>
            <filter id={`flowchart-desc-shadow-${viewInstanceId}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="3" stdDeviation="6" floodColor="var(--ctp-mauve)" floodOpacity="0.25" />
            </filter>
            <filter id={`flowchart-tooltip-shadow-${viewInstanceId}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000000" floodOpacity="0.4" />
            </filter>
            <filter id={`flowchart-glow-${viewInstanceId}`} x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="var(--secondary)" floodOpacity="0.8" />
              <feDropShadow dx="0" dy="0" stdDeviation="10" floodColor="var(--secondary)" floodOpacity="0.5" />
            </filter>
            {/* Directional arrow markers, one per target port side (sideTo).
                Each triangle is pre-oriented to point INTO the target node
                along the edge's final (incoming) segment, with its tip
                anchored (refX/refY) exactly on the path endpoint so it lands
                on the port:
                  sideTo 'T' -> port on top edge,    edge arrives moving down   -> points down
                  sideTo 'R' -> port on right edge,  edge arrives moving left   -> points left
                  sideTo 'B' -> port on bottom edge, edge arrives moving up     -> points up
                  sideTo 'L' -> port on left edge,   edge arrives moving right  -> points right */}
            {(['T', 'R', 'B', 'L'] as const).flatMap(side => {
              const tri = {
                T: { d: 'M 0 0 L 6 0 L 3 7 Z', refX: 3, refY: 7 }, // tip at bottom, points down
                R: { d: 'M 7 0 L 0 3 L 7 6 Z', refX: 0, refY: 3 }, // tip at left,   points left
                B: { d: 'M 0 7 L 6 7 L 3 0 Z', refX: 3, refY: 0 }, // tip at top,    points up
                L: { d: 'M 0 0 L 7 3 L 0 6 Z', refX: 7, refY: 3 }  // tip at right,  points right
              }[side];
              return [
                <marker key={`arrow-${side}`} id={`flowchart-arrow-${side}-${viewInstanceId}`} markerWidth="8" markerHeight="8" refX={tri.refX} refY={tri.refY}>
                  <path d={tri.d} fill="var(--ctp-overlay1)" />
                </marker>,
                <marker key={`arrow-highlight-${side}`} id={`flowchart-arrow-highlight-${side}-${viewInstanceId}`} markerWidth="8" markerHeight="8" refX={tri.refX} refY={tri.refY}>
                  <path d={tri.d} fill="var(--secondary)" />
                </marker>
              ];
            })}
            {isSequenceView && (
              <>
                <marker id={`seq-arrow-cmd-${viewInstanceId}`} markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                  <path d="M 0 0 L 7 3 L 0 6 Z" fill="var(--secondary)" />
                </marker>
                <marker id={`seq-arrow-evt-${viewInstanceId}`} markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                  <path d="M 0 0 L 7 3 L 0 6 Z" fill="var(--ctp-peach)" />
                </marker>
                <marker id={`seq-arrow-async-${viewInstanceId}`} markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto">
                  <path d="M 0 0 L 7 3 L 0 6" fill="none" stroke="var(--secondary)" strokeWidth="1.2" />
                </marker>
              </>
            )}
            <pattern
              id={`dotGrid-${viewInstanceId}`}
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="2" cy="2" r="1" fill="var(--ctp-surface1)" opacity="0.6" />
            </pattern>
          </defs>

          <g transform={transformStr} data-testid={`flowchart-canvas-${viewKey}`}>
            <rect
              x="-50000"
              y="-50000"
              width="100000"
              height="100000"
              fill={`url(#dotGrid-${viewInstanceId})`}
              style={{ pointerEvents: 'none' }}
            />
            {isSequenceView ? (
                <SequenceView 
                  viewKey={viewKey}
                  viewInstanceId={viewInstanceId}
                  schema={schema}
                  view={view}
                  activeNodeIds={activeNodeIds}
                  activeRelationIds={activeRelationIds}
                  highlightedNodeId={highlightedNodeId}
                  forkHighlights={forkHighlights}
                />
              ) : (
                <StandardView 
                  viewKey={viewKey}
                  viewInstanceId={viewInstanceId}
                  schema={schema}
                  view={view}
                  positioned={positioned}
                  nodeMap={nodeMap}
                  routedRelations={routedRelations}
                  activeNodeIds={activeNodeIds}
                  activeRelationIds={activeRelationIds}
                  highlightedNodeId={highlightedNodeId}
                 spacing={spacing}
                 setActiveNodePopup={setActiveNodePopup}
                 handleNodeClick={handleNodeClick}
                 isFullscreen={isFullscreen}
                 forkHighlights={forkHighlights}
                 storyRoute={storyRoute}
               />
             )}
          </g>
        </svg>

        {stepCaption && (() => {
          const viewportW = camera.svgRef.current?.clientWidth ?? 0;
          const width = viewportW > 0 ? Math.min(CAPTION_MAX_W, viewportW - CAPTION_EDGE * 2) : CAPTION_MAX_W;
          if (!focusBBox) {
            return (
              <StepCaption
                key={stepCaption.id}
                ref={captionRef}
                caption={stepCaption}
                placement="pinned"
                onSwitchPath={onSwitchPath}
                style={{ width }}
              />
            );
          }
          // Project the focus box into screen space; the caption rides along
          // with the camera while it animates or the user pans.
          const { scale, translateX, translateY } = camera.transform;
          const box = {
            left: focusBBox.minX * scale + translateX,
            right: focusBBox.maxX * scale + translateX,
            top: focusBBox.minY * scale + translateY,
            bottom: focusBBox.maxY * scale + translateY,
          };
          const clampLeft = (x: number) => viewportW > 0
            ? Math.min(Math.max(x, CAPTION_EDGE), viewportW - width - CAPTION_EDGE)
            : x;
          const style = captionPlacement === 'right'
            ? {
                width,
                left: clampLeft(box.right + CAPTION_GAP),
                top: (box.top + box.bottom) / 2,
                transform: 'translateY(-50%)',
              }
            : {
                width,
                left: clampLeft((box.left + box.right) / 2 - width / 2),
                top: box.bottom + CAPTION_GAP,
              };
          return (
            <StepCaption
              key={stepCaption.id}
              ref={captionRef}
              caption={stepCaption}
              placement={captionPlacement}
              onSwitchPath={onSwitchPath}
              style={style}
            />
          );
        })()}

        {isGridMode && onEnterFullscreen && !isFullscreen && (() => {
          const Maximize2 = Icons.Maximize2;
          return (
            <div style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <button
                onClick={onEnterFullscreen}
                title="Enter Fullscreen"
                className="flowchart-fullscreen-btn"
                data-testid="flowchart-fullscreen-btn"
                style={{
                  background: 'var(--ctp-surface0)',
                  border: '1px solid var(--ctp-surface2)',
                  borderRadius: '6px',
                  color: 'var(--ctp-text)',
                  padding: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                <Maximize2 size={16} />
              </button>
            </div>
          );
        })()}

      {activeNodePopup && (
        <div
          className="flowchart-node-popup"
          data-testid="flowchart-node-popup"
          style={{
            position: 'absolute',
            left: activeNodePopup.x,
            top: activeNodePopup.y - 12,
            transform: 'translate(-50%, -100%)',
            background: 'var(--ctp-base)',
            border: '1px solid var(--ctp-surface1)',
            borderRadius: '8px',
            padding: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            minWidth: '160px'
          }}
          onMouseLeave={() => setActiveNodePopup(null)}
        >
          <div style={{
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--ctp-subtext0)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            padding: '2px 6px',
            marginBottom: '4px',
            borderBottom: '1px solid var(--ctp-surface0)'
          }}>
            Available Views
          </div>
          {activeNodePopup.views.map((v) => {
            const VIcon = (ICONS as any)[v.type as keyof typeof ICONS] || Icons.Square;
            return (
              <div
                key={v.key}
                data-testid={`flowchart-node-popup-view-${v.key}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveNodePopup(null);
                  handleNodeClick(activeNodePopup.nodeId);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  background: 'var(--ctp-surface0)',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'var(--ctp-surface1)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'var(--ctp-surface0)';
                }}
              >
                <VIcon size={14} color={COLORS[v.type as keyof typeof COLORS] || COLORS.default} />
                <span style={{
                  fontSize: '12px',
                  color: 'var(--ctp-text)',
                  fontWeight: 500
                }}>{v.name}</span>
              </div>
            );
          })}
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onEnterFullscreen) onEnterFullscreen();
              setActiveNodePopup(null);
            }}
            data-testid="flowchart-node-popup-enter-fullscreen"
            style={{
              background: 'var(--ctp-blue)',
              border: 'none',
              borderRadius: '4px',
              color: 'var(--ctp-mantle)',
              padding: '6px 12px',
              fontSize: '11px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              textAlign: 'center'
            }}
          >
            Enter Fullscreen
          </button>
        </div>
      )}
      </div>
    </div>
  );
}
