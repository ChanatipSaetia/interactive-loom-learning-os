import { useEffect, useMemo, useRef, useState } from 'react';
import { animate } from 'animejs';
import * as Icons from 'lucide-react';

import { ZoomToolbar } from './zoom-toolbar';
import { useCamera } from './useCamera';
import {
  COLORS,
  BORDER_COLORS,
  ICONS,
  ICON_ANIMATIONS,
  DYNAMIC_ICONS,
  NODE_W,
  NODE_H,
  wrapTooltipText
} from './types';
import type {
  UnifiedFlowchartSchema
} from './types';

const Workflow = Icons.Workflow;

const MIN_ROW_SPACING = 120;
const MAX_ROW_SPACING = 240;

function computeDynamicSpacing(
  info: { rowCount: number; colCount: number; nodeCount: number },
  base: { colSpacing: number; rowSpacing: number; offsetX: number; offsetY: number },
  viewKey: string
): { colSpacing: number; rowSpacing: number; offsetX: number; offsetY: number } {
  const { rowCount, colCount } = info;

  // SEQUENCE uses columns only, no dynamic row spacing needed
  if (viewKey === 'SEQUENCE') return base;

  // Dynamic row spacing: scale based on row count to prevent crowding
  let rowSpacing = base.rowSpacing;
  if (rowCount > 2) {
    const extraRows = rowCount - 2;
    const additionalSpacing = Math.min(extraRows * 12, 80);
    rowSpacing = Math.min(base.rowSpacing + additionalSpacing, MAX_ROW_SPACING);
  }
  rowSpacing = Math.max(rowSpacing, MIN_ROW_SPACING);

  // Dynamic offsets: adjust for wider views
  const offsetX = base.offsetX + Math.max(0, (colCount - 8)) * 20;
  const offsetY = base.offsetY + Math.max(0, (rowCount - 3)) * 10;

  return { ...base, rowSpacing, offsetX, offsetY };
}

export interface FlowchartViewProps {
  viewKey: string;
  schema: UnifiedFlowchartSchema;
  activeNodeIds: string[] | null;
  highlightedNodeId: string | null;
  prevHighlightedNodeId: string | null;
  currentStep: number;
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
  setActiveNodePopup: (popup: { nodeId: string; x: number; y: number; views: { key: string; name: string; type: string }[] } | null) => void;
  currentJourneyId?: string;
  onEnterFullscreen?: () => void;
  focusAfterViewSwitch?: string | null;
  onCameraFocused?: () => void;
  onCameraControls?: (controls: { handleZoomIn: () => void; handleZoomOut: () => void; handleFitToScreen: () => void } | null) => void;
}

export function FlowchartView({
  viewKey,
  schema,
  activeNodeIds,
  highlightedNodeId,
  prevHighlightedNodeId,
  currentStep,
  handleNodeClick,
  instanceId,
  isGridMode,
  isFullscreen,
  activeNodePopup,
  setActiveNodePopup,
  currentJourneyId,
  onEnterFullscreen,
  focusAfterViewSwitch,
  onCameraFocused,
  onCameraControls
}: FlowchartViewProps) {
  const view = schema.views[viewKey];
  const viewInstanceId = `${instanceId}-${viewKey}`;
  const isSequenceView = viewKey === 'SEQUENCE';

  // SEQUENCE view derived data
  const seqRelations = useMemo(
    () => schema.relations.filter(r => r.views?.includes('SEQUENCE')),
    [schema.relations]
  );

  const seqColumns = useMemo(() => {
    if (!view || !isSequenceView) return [];
    const cols = new Map<number, string>();
    for (const node of view.nodes) {
      if (node.grid && !cols.has(node.grid[0])) {
        cols.set(node.grid[0], node.id);
      }
    }
    return Array.from(cols.entries()).sort((a, b) => a[0] - b[0]);
  }, [view, isSequenceView]);

  // Memoized spacing configuration
  const spacing = useMemo(() => {
    if (!view) return { colSpacing: 140, rowSpacing: 150, offsetX: 100, offsetY: 100 };
    const defaults: Record<string, { colSpacing: number; rowSpacing: number; offsetX: number; offsetY: number }> = {
      EVENT_STORMING: { colSpacing: 140, rowSpacing: 160, offsetX: 60, offsetY: 50 },
      STATE_MACHINE: { colSpacing: 140, rowSpacing: 150, offsetX: 60, offsetY: 80 },
      SYS_ARCH: { colSpacing: 140, rowSpacing: 130, offsetX: 80, offsetY: 100 },
      DATA_FLOW: { colSpacing: 140, rowSpacing: 130, offsetX: 100, offsetY: 100 },
      SWIMLANES: { colSpacing: 140, rowSpacing: 190, offsetX: 160, offsetY: 75 },
      SEQUENCE: { colSpacing: 100, rowSpacing: 48, offsetX: 60, offsetY: 80 },
    };
    const base = defaults[viewKey] || { colSpacing: 140, rowSpacing: 150, offsetX: 100, offsetY: 100 };
    return view.layoutInfo
      ? computeDynamicSpacing(view.layoutInfo, base, viewKey)
      : base;
  }, [view, viewKey]);

  // Node positioning with dynamic spacing
  const positioned = useMemo(() => {
    if (!view) return [];
    return view.nodes.map(node => {
      if (typeof node.x === 'number' && typeof node.y === 'number') {
        return { ...node, x: node.x, y: node.y };
      }
      if (node.grid) {
        const [c, r] = node.grid;
        const x = c * spacing.colSpacing + spacing.offsetX;
        const y = r * spacing.rowSpacing + spacing.offsetY;
        return { ...node, x, y };
      }
      return { ...node, x: 0, y: 0 };
    });
  }, [view, spacing]);

  const positionedNodesRef = useRef(positioned);
  useEffect(() => { positionedNodesRef.current = positioned; }, [positioned]);

  const nodeMap = useMemo(() => {
    const m = Object.create(null);
    for (const n of positioned) {
      m[n.id] = n;
    }
    return m;
  }, [positioned]);

  const routedRelations = useMemo(() => {
    if (!view) return [];

    const activeRelations = schema.relations.filter(r => r.views?.includes(viewKey));

    // 1. Determine chosen sides for each relation
    const relSides = activeRelations.map(rel => {
      const fromNode = nodeMap[rel.from];
      const toNode = nodeMap[rel.to];
      if (!fromNode || !toNode) return null;

      const x1 = fromNode.x;
      const y1 = fromNode.y;
      const x2 = toNode.x;
      const y2 = toNode.y;

      const startPoints = [
        { side: 'T', x: x1, y: y1 - NODE_H / 2 },
        { side: 'R', x: x1 + NODE_W / 2, y: y1 },
        { side: 'B', x: x1, y: y1 + NODE_H / 2 },
        { side: 'L', x: x1 - NODE_W / 2, y: y1 }
      ];

      const endPoints = [
        { side: 'T', x: x2, y: y2 - NODE_H / 2 },
        { side: 'R', x: x2 + NODE_W / 2, y: y2 },
        { side: 'B', x: x2, y: y2 + NODE_H / 2 },
        { side: 'L', x: x2 - NODE_W / 2, y: y2 }
      ];

      const gridFrom = fromNode.grid || [0, 0];
      const gridTo = toNode.grid || [0, 0];
      const colA = gridFrom[0];
      const rowA = gridFrom[1];
      const colB = gridTo[0];
      const rowB = gridTo[1];

      let startPt = startPoints[1]; // R
      let endPt = endPoints[3];   // L

      let minDistance = Infinity;
      startPoints.forEach(sp => {
        endPoints.forEach(ep => {
          const dist = Math.hypot(ep.x - sp.x, ep.y - sp.y);
          if (dist < minDistance) {
            minDistance = dist;
            startPt = sp;
            endPt = ep;
          }
        });
      });

      return {
        rel,
        fromId: rel.from,
        toId: rel.to,
        sideFrom: startPt.side,
        sideTo: endPt.side,
        fromNode,
        toNode,
        colA, rowA, colB, rowB
      };
    }).filter(Boolean) as Array<{
      rel: typeof schema.relations[0];
      fromId: string;
      toId: string;
      sideFrom: string;
      sideTo: string;
      fromNode: any;
      toNode: any;
      colA: number; rowA: number; colB: number; rowB: number;
    }>;

    // 2. Group connections on each node side
    const nodeSideConns: Record<string, Record<string, Array<{ relId: string; role: 'from' | 'to'; otherNodeId: string; relIndex: number }>>> = {};
    
    positioned.forEach(n => {
      nodeSideConns[n.id] = {
        'T': [], 'R': [], 'B': [], 'L': []
      };
    });

    relSides.forEach((entry, index) => {
      if (nodeSideConns[entry.fromId]) {
        nodeSideConns[entry.fromId][entry.sideFrom].push({
          relId: entry.rel.id,
          role: 'from',
          otherNodeId: entry.toId,
          relIndex: index
        });
      }
      if (nodeSideConns[entry.toId]) {
        nodeSideConns[entry.toId][entry.sideTo].push({
          relId: entry.rel.id,
          role: 'to',
          otherNodeId: entry.fromId,
          relIndex: index
        });
      }
    });

    // 3. Sort connections and assign port coordinates
    const relPorts: Record<string, { startX: number; startY: number; endX: number; endY: number; sideFrom: string; sideTo: string }> = {};

    positioned.forEach(node => {
      const sides = ['T', 'R', 'B', 'L'];
      sides.forEach(side => {
        const conns = nodeSideConns[node.id][side];
        if (conns.length === 0) return;

        conns.sort((a, b) => {
          const nodeA = nodeMap[a.otherNodeId];
          const nodeB = nodeMap[b.otherNodeId];
          if (!nodeA || !nodeB) return 0;
          if (side === 'T' || side === 'B') {
            return nodeA.x - nodeB.x;
          } else {
            return nodeA.y - nodeB.y;
          }
        });

        const K = conns.length;
        conns.forEach((conn, i) => {
          let px = node.x;
          let py = node.y;

          if (side === 'L') {
            px = node.x - NODE_W / 2;
            py = node.y - NODE_H / 2 + (i + 1) * NODE_H / (K + 1);
          } else if (side === 'R') {
            px = node.x + NODE_W / 2;
            py = node.y - NODE_H / 2 + (i + 1) * NODE_H / (K + 1);
          } else if (side === 'T') {
            py = node.y - NODE_H / 2;
            px = node.x - NODE_W / 2 + (i + 1) * NODE_W / (K + 1);
          } else if (side === 'B') {
            py = node.y + NODE_H / 2;
            px = node.x - NODE_W / 2 + (i + 1) * NODE_W / (K + 1);
          }

          if (!relPorts[conn.relId]) {
            relPorts[conn.relId] = {} as any;
          }

          if (conn.role === 'from') {
            relPorts[conn.relId].startX = px;
            relPorts[conn.relId].startY = py;
            relPorts[conn.relId].sideFrom = side;
          } else {
            relPorts[conn.relId].endX = px;
            relPorts[conn.relId].endY = py;
            relPorts[conn.relId].sideTo = side;
          }
        });
      });
    });

    // 4. Route Manhattan paths
    return relSides.map(entry => {
      const ports = relPorts[entry.rel.id];
      if (!ports) return null;

      const { startX, startY, endX, endY, sideFrom, sideTo } = ports;
      const { pathD, midX, midY } = routeManhattanPath(
        startX, startY, endX, endY,
        sideFrom, sideTo,
        entry.fromNode, entry.toNode,
        positioned, spacing
      );

      return {
        rel: entry.rel,
        pathD,
        startX, startY, endX, endY,
        midX, midY
      };
    }).filter((x): x is { rel: any; pathD: string; startX: number; startY: number; endX: number; endY: number; midX: number; midY: number; } => x !== null);

  }, [view, schema.relations, positioned, viewKey, spacing, nodeMap]);


  const minX = positioned.length > 0 ? Math.min(...positioned.map(n => n.x)) : 0;
  const maxX = positioned.length > 0 ? Math.max(...positioned.map(n => n.x)) : 0;
  const minY = positioned.length > 0 ? Math.min(...positioned.map(n => n.y)) : 0;
  const maxY = positioned.length > 0 ? Math.max(...positioned.map(n => n.y)) : 0;

  // Camera
  const camera = useCamera({ positionedNodesRef });

  // Register camera controls with parent
  const onCameraControlsRef = useRef(onCameraControls);
  useEffect(() => {
    onCameraControlsRef.current = onCameraControls;
  }, [onCameraControls]);

  useEffect(() => {
    const cb = onCameraControlsRef.current;
    if (cb) {
      cb({
        handleZoomIn: camera.handleZoomIn,
        handleZoomOut: camera.handleZoomOut,
        handleFitToScreen: () => camera.fitToScreen(minX, maxX, minY, maxY),
      });
      return () => {
        cb(null);
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera.handleZoomIn, camera.handleZoomOut, camera.fitToScreen, minX, maxX, minY, maxY]);

  // Focus camera on active nodes
  useEffect(() => {
    if (viewKey === 'STATE_MACHINE') {
      if (highlightedNodeId) {
        camera.focusOnNodes([highlightedNodeId]);
      }
    } else {
      if (activeNodeIds && activeNodeIds.length > 0) {
        camera.focusOnNodes(activeNodeIds);
      }
    }
  }, [viewKey, activeNodeIds, highlightedNodeId, camera]);

  // Focus camera after view switch (triggered from Details tab related view click)
  const hasFocusedRef = useRef(false);
  useEffect(() => {
    if (focusAfterViewSwitch && !hasFocusedRef.current) {
      hasFocusedRef.current = true;
      camera.focusOnNodes([focusAfterViewSwitch]);
      onCameraFocused?.();
    }
  }, [focusAfterViewSwitch, camera, onCameraFocused]);

  // Particle animation
  const particleRef = useRef<SVGCircleElement | null>(null);
  const animeInstanceRef = useRef<ReturnType<typeof animate> | null>(null);

  useEffect(() => {
    if (currentStep <= 0 || !view) return;

    const journey = schema.journeys.find(j => j.id === currentJourneyId);
    if (!journey) return;

    const currentStepData = journey.steps[currentStep];
    const prevStepData = journey.steps[currentStep - 1];
    if (!currentStepData || !prevStepData) return;

    const prevNodeIds = prevStepData.nodeIds || (prevStepData.nodeId ? [prevStepData.nodeId] : []);
    const currentNodeIds = currentStepData.nodeIds || (currentStepData.nodeId ? [currentStepData.nodeId] : []);

    let fromNodeId = prevHighlightedNodeId;
    let toNodeId = highlightedNodeId;

    const connectingRelation = schema.relations.find(
      r => r.views?.includes(viewKey) &&
      ((prevNodeIds.includes(r.from) && currentNodeIds.includes(r.to)) ||
       (prevNodeIds.includes(r.to) && currentNodeIds.includes(r.from)))
    );

    if (connectingRelation) {
      if (prevNodeIds.includes(connectingRelation.from)) {
        fromNodeId = connectingRelation.from;
        toNodeId = connectingRelation.to;
      } else {
        fromNodeId = connectingRelation.to;
        toNodeId = connectingRelation.from;
      }
    }

    if (!fromNodeId || !toNodeId) return;

    const fromNode = nodeMap[fromNodeId];
    const toNode = nodeMap[toNodeId];
    if (!fromNode || !toNode) return;

    const hasRelation = schema.relations.some(
      r => r.views?.includes(viewKey) &&
      ((r.from === fromNodeId && r.to === toNodeId) ||
        (r.to === fromNodeId && r.from === toNodeId))
    );
    if (!hasRelation) return;

    if (animeInstanceRef.current) animeInstanceRef.current.pause();

    const startX = fromNode.x;
    const startY = fromNode.y;
    const endX = toNode.x;
    const endY = toNode.y;

    if (particleRef.current) {
      particleRef.current.setAttribute('cx', String(startX));
      particleRef.current.setAttribute('cy', String(startY));
      particleRef.current.setAttribute('opacity', '1');
      animeInstanceRef.current = animate(particleRef.current, {
        cx: [startX, endX],
        cy: [startY, endY],
        duration: 800,
        easing: 'easeInOutQuad',
        onComplete: () => {
          if (particleRef.current) particleRef.current.setAttribute('opacity', '0');
        }
      });
    }
  }, [currentStep, prevHighlightedNodeId, highlightedNodeId, viewKey, nodeMap, schema.relations, view, currentJourneyId, schema.journeys]);

  // Attach/detach native event listeners
  useEffect(() => {
    const svg = camera.svgRef.current;
    if (!svg) return;
    svg.addEventListener('wheel', camera.onWheelNative, { passive: false });
    svg.addEventListener('touchstart', camera.onSvgTouchStartNative, { passive: false });
    svg.addEventListener('touchmove', camera.onTouchMoveNative, { passive: false });
    return () => {
      svg.removeEventListener('wheel', camera.onWheelNative);
      svg.removeEventListener('touchstart', camera.onSvgTouchStartNative);
      svg.removeEventListener('touchmove', camera.onTouchMoveNative);
    };
  }, [camera]);

  // Hover tooltip
  const [tooltip, setTooltip] = useState<{ description: string; x: number; y: number } | null>(null);

  if (!view) return null;

  const transformStr = `translate(${camera.transform.translateX}, ${camera.transform.translateY}) scale(${camera.transform.scale})`;

  const Icon = (view.icon in DYNAMIC_ICONS)
    ? DYNAMIC_ICONS[view.icon as keyof typeof DYNAMIC_ICONS]
    : Workflow;

  const viewLabel = (
    <span className="flowchart-grid-view-label" data-testid={`flowchart-grid-label-${viewKey}`}>
      <Icon size={10} />
      <span>{view.name}</span>
    </span>
  );

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
            <filter id={`flowchart-glow-${viewInstanceId}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="var(--ctp-blue)" floodOpacity="0.6" />
            </filter>
            <marker id={`flowchart-arrow-${viewInstanceId}`} markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
              <path d="M 0 0 L 7 3 L 0 6 Z" fill="var(--ctp-surface2)" />
            </marker>
            <marker id={`flowchart-arrow-highlight-${viewInstanceId}`} markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
              <path d="M 0 0 L 7 3 L 0 6 Z" fill="var(--ctp-blue)" />
            </marker>
            {isSequenceView && (
              <>
                <marker id={`seq-arrow-fwd-${viewInstanceId}`} markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                  <path d="M 0 0 L 7 3 L 0 6 Z" fill="var(--ctp-blue)" />
                </marker>
                <marker id={`seq-arrow-ret-${viewInstanceId}`} markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                  <path d="M 0 0 L 7 3 L 0 6 Z" fill="var(--ctp-yellow)" />
                </marker>
              </>
            )}
            <pattern
              id={`dotGrid-${viewInstanceId}`}
              width={20 * camera.transform.scale}
              height={20 * camera.transform.scale}
              patternUnits="userSpaceOnUse"
              patternTransform={`translate(${camera.transform.translateX % (20 * camera.transform.scale)}, ${camera.transform.translateY % (20 * camera.transform.scale)})`}
            >
              <circle cx="2" cy="2" r={1 * camera.transform.scale} fill="var(--ctp-surface1)" opacity="0.6" />
            </pattern>
          </defs>

          <rect width="100%" height="100%" fill={`url(#dotGrid-${viewInstanceId})`} style={{ pointerEvents: 'none' }} />

          <g transform={transformStr} data-testid={`flowchart-canvas-${viewKey}`}>
             {isSequenceView ? (
               <>
                 {/* Sequence Groups / Condition Boundaries */}
                 {view.groups && view.groups.map(group => {
                   const isFaded = activeNodeIds !== null;
                   const gCols = seqColumns.filter(([, nodeId]) => group.nodeIds?.includes(nodeId));
                   if (gCols.length === 0) return null;

                   const minCol = Math.min(...gCols.map(([c]) => c));
                   const maxCol = Math.max(...gCols.map(([c]) => c));
                   const xStart = minCol * 100 + 60 - 25;
                   const xEnd = maxCol * 100 + 60 + 25;
                   
                   const yVal = group.y ?? 100;
                   const hVal = group.h ?? 150;
                   const labelW = Math.max(30, group.title.length * 5 + 10);

                   return (
                     <g 
                       key={group.id} 
                       className="flowchart-seq-group" 
                       opacity={isFaded ? 0.15 : 0.85} 
                       style={{ transition: 'opacity 0.3s' }}
                       data-testid={`flowchart-seq-group-${viewKey}-${group.id}`}
                     >
                       <rect
                         x={xStart}
                         y={yVal}
                         width={xEnd - xStart}
                         height={hVal}
                         rx="4"
                         fill={group.color || 'color-mix(in srgb, var(--ctp-yellow) 6%, transparent)'}
                         stroke={group.borderColor || 'var(--ctp-yellow)'}
                         strokeWidth="1.2"
                         strokeDasharray="4 4"
                       />
                       <polygon
                         points={`${xStart},${yVal} ${xStart + labelW},${yVal} ${xStart + labelW},${yVal + 12} ${xStart + labelW - 6},${yVal + 18} ${xStart},${yVal + 18}`}
                         fill={group.borderColor || 'var(--ctp-yellow)'}
                         opacity="0.2"
                       />
                       <text
                         x={xStart + 6}
                         y={yVal + 12}
                         fontSize="11"
                          fontWeight="bold"
                          fill={group.textColor || 'var(--ctp-text)'}
                          fontFamily="var(--font-mono)"
                       >
                         {group.title}
                       </text>
                     </g>
                   );
                 })}

                 {/* Sequence lifelines */}
                 {seqColumns.map(([colIdx, nodeId]) => {
                   const entity = schema.entities[nodeId];
                   if (!entity) return null;
                   const colX = colIdx * 100 + 60;
                   const topY = 12;
                   const boxH = 36;
                   const lifelineStart = topY + boxH + 8;
                   const msgSpacing = 48;
                   const msgStartY = 80;
                   const lifelineEnd = msgStartY + seqRelations.length * msgSpacing + 40;
                   return (
                     <g key={`lifeline-${colIdx}`} data-testid={`flowchart-lifeline-${viewKey}-${colIdx}`}>
                       <line
                         x1={colX}
                         y1={lifelineStart}
                         x2={colX}
                         y2={lifelineEnd}
                         stroke="var(--ctp-surface2)"
                         strokeWidth="1.5"
                         strokeDasharray="4 4"
                       />
                     </g>
                   );
                 })}

                 {/* Sequence top participant boxes */}
                 {seqColumns.map(([colIdx, nodeId]) => {
                   const entity = schema.entities[nodeId];
                   if (!entity) return null;
                   const colX = colIdx * 100 + 60;
                   const boxW = 80;
                   const boxX = colX - boxW / 2;
                   const boxY = 12;
                   const boxH = 36;
                   const viewTypes = entity.viewTypes || {};
                   const nodeFill = COLORS[viewTypes.SEQUENCE as keyof typeof COLORS] || COLORS.default;
                   const strokeColor = BORDER_COLORS[viewTypes.SEQUENCE as keyof typeof BORDER_COLORS] || BORDER_COLORS.default;
                   const isActive = activeNodeIds?.includes(nodeId);
                   return (
                     <g key={`seq-top-${nodeId}`} data-testid={`flowchart-seq-top-${viewKey}-${nodeId}`}>
                       <rect
                         x={boxX}
                         y={boxY}
                         width={boxW}
                         height={boxH}
                         rx="6"
                         fill={nodeFill}
                         stroke={isActive ? 'var(--ctp-blue)' : strokeColor}
                         strokeWidth={isActive ? '2' : '1.5'}
                         filter={isActive ? `url(#flowchart-glow-${viewInstanceId})` : undefined}
                       />
                       <text
                         x={colX}
                         y={boxY + 20}
                         textAnchor="middle"
                         fill="var(--ctp-text)"
                          fontSize="12"
                          fontWeight="600"
                        >
                          {(entity.viewTitles?.SEQUENCE ?? entity.title)}
                        </text>
                      </g>
                    );
                  })}

                  {/* Sequence bottom participant boxes */}
                 {seqColumns.map(([colIdx, nodeId]) => {
                   const entity = schema.entities[nodeId];
                   if (!entity) return null;
                   const colX = colIdx * 100 + 60;
                   const boxW = 80;
                   const boxX = colX - boxW / 2;
                   const msgSpacing = 48;
                   const msgStartY = 80;
                   const bottomY = msgStartY + seqRelations.length * msgSpacing + 40;
                   const boxH = 36;
                   const viewTypes = entity.viewTypes || {};
                   const nodeFill = COLORS[viewTypes.SEQUENCE as keyof typeof COLORS] || COLORS.default;
                   const strokeColor = BORDER_COLORS[viewTypes.SEQUENCE as keyof typeof BORDER_COLORS] || BORDER_COLORS.default;
                   const isActive = activeNodeIds?.includes(nodeId);
                   return (
                     <g key={`seq-bottom-${nodeId}`} data-testid={`flowchart-seq-bottom-${viewKey}-${nodeId}`}>
                       <rect
                         x={boxX}
                         y={bottomY}
                         width={boxW}
                         height={boxH}
                         rx="6"
                         fill={nodeFill}
                         stroke={isActive ? 'var(--ctp-blue)' : strokeColor}
                         strokeWidth={isActive ? '2' : '1.5'}
                       />
                       <text
                         x={colX}
                         y={bottomY + 20}
                         textAnchor="middle"
                         fill="var(--ctp-text)"
                          fontSize="12"
                          fontWeight="600"
                        >
                          {(entity.viewTitles?.SEQUENCE ?? entity.title)}
                        </text>
                      </g>
                    );
                  })}

                  {/* Sequence activation bars */}
                 {activeNodeIds && activeNodeIds.map(nodeId => {
                   const colEntry = seqColumns.find(([, id]) => id === nodeId);
                   if (!colEntry) return null;
                   const [colIdx] = colEntry;
                   const colX = colIdx * 100 + 60;
                   const topY = 12;
                   const boxH = 36;
                   const lifelineStart = topY + boxH + 8;
                   const msgSpacing = 48;
                   const msgStartY = 80;
                   const lifelineEnd = msgStartY + seqRelations.length * msgSpacing + 40;
                   return (
                     <rect
                       key={`seq-activation-${nodeId}`}
                       data-testid={`flowchart-seq-activation-${viewKey}-${nodeId}`}
                       x={colX - 5}
                       y={lifelineStart}
                       width={10}
                       height={lifelineEnd - lifelineStart}
                       rx="3"
                       fill="color-mix(in srgb, var(--ctp-blue) 12%, transparent)"
                       stroke="var(--ctp-blue)"
                       strokeWidth="1"
                     />
                   );
                 })}

                 {/* Sequence message arrows */}
                 {seqRelations.map((rel, idx) => {
                   const fromColEntry = seqColumns.find(([, id]) => id === rel.from);
                   const toColEntry = seqColumns.find(([, id]) => id === rel.to);
                   if (!fromColEntry || !toColEntry) return null;
                   const [fromCol] = fromColEntry;
                   const [toCol] = toColEntry;
                   const x1 = fromCol * 100 + 60;
                   const x2 = toCol * 100 + 60;
                   const msgSpacing = 48;
                   const msgStartY = 80;
                   const y = msgStartY + idx * msgSpacing;
                   const isReturn = x2 < x1;
                   const midX = (x1 + x2) / 2;
                   const isActiveMsg = activeNodeIds?.includes(rel.from) || activeNodeIds?.includes(rel.to);
                   return (
                     <g key={`seq-msg-${rel.id}`} data-testid={`flowchart-seq-msg-${viewKey}-${idx}`}>
                       <line
                         x1={x1}
                         y1={y}
                         x2={x2}
                         y2={y}
                         stroke={isActiveMsg ? 'var(--ctp-blue)' : (isReturn ? 'var(--ctp-yellow)' : 'var(--ctp-blue)')}
                         strokeWidth={isActiveMsg ? '2' : '1.5'}
                         strokeDasharray={isReturn ? '4 4' : 'none'}
                         strokeOpacity={isActiveMsg ? '0.95' : '0.65'}
                         markerEnd={isReturn
                           ? `url(#seq-arrow-ret-${viewInstanceId})`
                           : `url(#seq-arrow-fwd-${viewInstanceId})`
                         }
                       />
                       {rel.label && (
                         <text
                           x={midX}
                           y={y - 6}
                           textAnchor="middle"
                           fill={isActiveMsg ? 'var(--ctp-blue)' : 'var(--ctp-subtext0)'}
                            fontSize="11"
                            fontFamily="var(--font-mono)"
                            fontWeight="500"
                            opacity={isActiveMsg ? '0.95' : '0.75'}
                            style={{ pointerEvents: 'none', userSelect: 'none' }}
                            data-testid={`flowchart-seq-msg-label-${viewKey}-${idx}`}
                         >
                           {rel.label}
                         </text>
                       )}
                     </g>
                   );
                 })}
               </>
             ) : (
               <>
                 {/* Groups */}
                 {view.groups && view.groups.map(group => {
                   const isFaded = activeNodeIds !== null;
                 if (group.isLane) {
                      let yVal = group.y ?? 100;
                      let hVal = group.h ?? 180;
                      if (typeof group.row === 'number') {
                        const laneHeight = 160;
                        const laneGap = 30;
                        yVal = 30 + group.row * (laneHeight + laneGap);
                        hVal = laneHeight;
                      }
                     return (
                       <g key={group.id} className="flowchart-swimlane-group" opacity={isFaded ? 0.15 : 0.85} style={{ transition: 'opacity 0.3s' }}>
                         <rect
                           x={minX - 100}
                           y={yVal}
                           width={maxX - minX + 500}
                           height={hVal}
                           fill={group.color || 'color-mix(in srgb, var(--ctp-lavender) 12%, transparent)'}
                           stroke={group.borderColor || 'var(--ctp-surface2)'}
                           strokeWidth="1.5"
                         />
                         <text
                            x={minX - 80}
                            y={yVal + 25}
                            fontSize="16"
                            fontWeight="bold"
                            fill={group.textColor || '#b5bfe2'}
                         >
                           {group.title}
                         </text>
                       </g>
                     );
                   }

                   const gNodes = positioned.filter(n => group.nodeIds?.includes(n.id));
                   if (gNodes.length === 0) return null;

                   const gMinX = Math.min(...gNodes.map(n => n.x - NODE_W / 2)) - 35;
                   const gMaxX = Math.max(...gNodes.map(n => n.x + NODE_W / 2)) + 35;
                   const gMinY = Math.min(...gNodes.map(n => n.y - NODE_H / 2)) - 30;
                   const gMaxY = Math.max(...gNodes.map(n => n.y + NODE_H / 2)) + 30;

                   return (
                     <g key={group.id} className="flowchart-domain-group" opacity={isFaded ? 0.15 : 1} style={{ transition: 'opacity 0.3s' }}>
                       <rect
                         x={gMinX}
                         y={gMinY}
                         width={gMaxX - gMinX}
                         height={gMaxY - gMinY}
                         rx="12"
                         fill={group.color || 'color-mix(in srgb, var(--ctp-blue) 10%, transparent)'}
                         stroke={group.borderColor || 'var(--ctp-blue)'}
                         strokeWidth="1.5"
                         strokeDasharray="4 4"
                       />
                       <text
                          x={gMinX + 15}
                          y={gMinY + 22}
                          fontSize="13"
                          fontWeight="bold"
                          fill={group.textColor || 'var(--ctp-text)'}
                       >
                         {group.title}
                       </text>
                     </g>
                   );
                 })}

                  {/* Edges */}
                  {routedRelations.map((entry, idx) => {
                    const { rel, pathD, startX, endX, midX, midY } = entry;

                    let isHighlighted = activeNodeIds && activeNodeIds.includes(rel.from) && activeNodeIds.includes(rel.to);
                    if (viewKey === 'STATE_MACHINE') {
                      isHighlighted = prevHighlightedNodeId === rel.from && highlightedNodeId === rel.to;
                    }
                    const isFaded = activeNodeIds !== null && !isHighlighted;
                    const isHandledBy = rel.handledBy;
                    const fromNode = nodeMap[rel.from];
                    const toNode = nodeMap[rel.to];
                    const isVertical = fromNode && toNode ? fromNode.x === toNode.x : false;

                    // Truncate edge label to fit segment if too long
                    let labelText = rel.label || '';
                    const segmentLength = Math.abs(endX - startX);
                    if (labelText && labelText.length > 18 && segmentLength < 180) {
                      labelText = labelText.substring(0, 15) + '...';
                    }

                    return (
                      <g 
                        key={rel.id} 
                        data-testid={`flowchart-edge-${viewKey}-${idx}`} 
                        style={{ transition: 'opacity 0.3s', opacity: isFaded ? 0.1 : 0.8 }}
                        onMouseEnter={() => {
                          if (rel.label || isHandledBy) {
                            const desc = isHandledBy ? 'Handled by orchestrator runtime process flow.' : (rel.label || '');
                            setTooltip({ description: desc, x: midX, y: midY });
                          }
                        }}
                        onMouseLeave={() => setTooltip(null)}
                      >
                        {/* Invisible wider interactive hover trigger path */}
                        <path
                          d={pathD}
                          stroke="transparent"
                          strokeWidth="10"
                          fill="none"
                          style={{ cursor: 'pointer' }}
                        />
                        <path
                          d={pathD}
                          stroke="var(--ctp-surface2)"
                          strokeWidth="1.5"
                          fill="none"
                          strokeOpacity="0.3"
                          markerEnd={isHandledBy ? '' : `url(#flowchart-arrow-${viewInstanceId})`}
                        />
                        <path
                          d={pathD}
                          stroke={isHighlighted ? 'var(--ctp-blue)' : (isHandledBy ? 'var(--ctp-green)' : (rel.dashed ? 'var(--ctp-yellow)' : 'var(--ctp-blue)'))}
                          strokeWidth={isHighlighted ? '2.5' : (isHandledBy ? '2' : '1.5')}
                          fill="none"
                          strokeOpacity={isHighlighted ? '0.95' : (isHandledBy ? '0.8' : '0.55')}
                          strokeDasharray={isHandledBy ? 'none' : (rel.dashed ? '4 4' : '8 8')}
                          markerEnd={isHandledBy ? `url(#flowchart-arrow-${viewInstanceId})` : (isHighlighted ? `url(#flowchart-arrow-highlight-${viewInstanceId})` : `url(#flowchart-arrow-${viewInstanceId})`)}
                          className={rel.dashed ? '' : 'flowchart-edge-animated'}
                        />
                        {isHandledBy && (
                          <text
                            x={midX + (isVertical ? 12 : 0)}
                            y={midY - 6}
                            textAnchor={isVertical ? 'start' : 'middle'}
                            fill="var(--ctp-green)"
                            fontSize="11"
                            fontWeight="600"
                            opacity={isHighlighted ? '0.95' : '0.75'}
                            style={{ pointerEvents: 'none', userSelect: 'none' }}
                          >
                            handled by
                          </text>
                        )}
                        {!isHandledBy && labelText && (
                          <text
                            x={midX + (isVertical ? 8 : 0)}
                            y={midY - 4}
                            textAnchor={isVertical ? 'start' : 'middle'}
                            fill={isHighlighted ? 'var(--ctp-blue)' : 'var(--ctp-subtext0)'}
                            fontSize="11"
                            fontFamily="var(--font-mono)"
                            fontWeight="500"
                            opacity={isHighlighted ? '0.95' : '0.75'}
                            style={{ pointerEvents: 'none', userSelect: 'none' }}
                          >
                            {labelText}
                          </text>
                        )}
                      </g>
                    );
                  })}

                 {/* Particle */}
                 <circle
                   ref={particleRef}
                   r="6"
                   fill="var(--ctp-blue)"
                   opacity="0"
                   className="flowchart-particle"
                   data-testid={`flowchart-particle-${viewKey}`}
                 />

                 {/* Nodes */}
                 {positioned.map(node => {
                   const entity = schema.entities[node.id];
                   if (!entity) return null;

                   const viewType = entity.viewTypes?.[viewKey] || entity.type || 'default';
                   const nW = NODE_W;
                   const nH = NODE_H;
                   const x = node.x - nW / 2;
                   const y = node.y - nH / 2;
                   const isStepHighlighted = activeNodeIds && activeNodeIds.includes(node.id);
                   const isHighlighted = isStepHighlighted || (highlightedNodeId === node.id);
                   const isDimmed = activeNodeIds !== null && !isHighlighted;
                   const nodeFill = entity.color || COLORS[viewType as keyof typeof COLORS] || COLORS.default;
                   const strokeColor = entity.strokeColor || BORDER_COLORS[viewType as keyof typeof BORDER_COLORS] || BORDER_COLORS.default;
                   const iconName = ICONS[viewType as keyof typeof ICONS];
                   const animClass = ICON_ANIMATIONS[viewType as keyof typeof ICON_ANIMATIONS] || '';
                   const IconComponent = iconName && (iconName in Icons)
                     ? (Icons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string; color?: string }>>)[iconName]
                     : null;
                   const hasLinks = Object.keys(entity.viewTypes || {}).filter(vk => vk !== viewKey && schema.views[vk]).length > 0;

                   return (
                     <g
                       key={node.id}
                       data-testid={`flowchart-node-${viewKey}-${node.id}`}
                       className={`flowchart-node-group ${hasLinks ? 'has-links' : ''}`}
                       onMouseDown={(e) => e.stopPropagation()}
                       onTouchStart={(e) => e.stopPropagation()}
                       onClick={(e) => {
                         e.stopPropagation();
                         handleNodeClick(node.id, node.x, node.y);
                       }}
                       onMouseEnter={() => {
                         if (entity.desc) {
                           setTooltip({ description: entity.desc, x: node.x, y: node.y - nH / 2 });
                         }
                       }}
                       onMouseLeave={() => setTooltip(null)}
                       style={{
                            opacity: isDimmed ? 0.25 : 1,
                          transition: 'opacity 0.3s, filter 0.3s',
                          cursor: (!isFullscreen || hasLinks) ? 'pointer' : 'default'
                        }}
                     >
                           <rect
                             x={x} y={y}
                             width={nW} height={nH}
                             rx="8"
                             fill={nodeFill}
                             stroke={strokeColor}
                             strokeWidth="1.5"
                             filter={isHighlighted ? `url(#flowchart-glow-${viewInstanceId})` : undefined}
                             className={`flowchart-node-rect ${isHighlighted ? 'flowchart-node-highlighted' : ''}`}
                           />

                       <foreignObject
                         x={0}
                         y={0}
                         transform={`translate(${x}, ${y})`}
                         width={nW}
                         height={nH}
                       >
                         <div
                           className="flowchart-node-card"
                           style={{
                             width: '100%',
                             height: '100%',
                             padding: '10px',
                             boxSizing: 'border-box',
                             display: 'flex',
                             flexDirection: 'column',
                             overflow: 'hidden',
                             userSelect: 'none'
                           }}
                         >
                           <div
                             className="flowchart-node-meta"
                             style={{
                               display: 'flex',
                               alignItems: 'center',
                               gap: '6px',
                               borderBottom: '1px solid var(--border-light)',
                               paddingBottom: '4px',
                               marginBottom: '4px'
                             }}
                           >
                             {IconComponent && (
                               <span className={animClass} style={{ display: 'flex', alignItems: 'center' }}>
                                 <IconComponent size={14} color={strokeColor} />
                               </span>
                             )}
                             <span
                               style={{
                                  fontSize: '10px',
                                  fontWeight: 600,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                  opacity: 0.85,
                                  color: strokeColor
                                }}
                             >
                               {viewType}
                             </span>
                             {hasLinks && (
                               <span
                                 className="flowchart-node-link-icon"
                                 style={{
                                   marginLeft: 'auto',
                                   display: 'flex',
                                   alignItems: 'center',
                                   opacity: 0.5,
                                   transition: 'all 0.2s ease'
                                 }}
                                 title="Has links to other views"
                               >
                                 <Icons.Link size={10} color={strokeColor} />
                               </span>
                             )}
                           </div>
                           <div
                             style={{
                               flex: 1,
                               display: 'flex',
                               alignItems: 'center',
                               justifyContent: 'center',
                               overflow: 'hidden'
                             }}
                           >
                             <p
                               style={{
                                 margin: 0,
                                 textAlign: 'center',
                                 fontWeight: 'bold',
                                 lineHeight: 1.25,
                                 fontSize: '14px',
                                  color: 'var(--ctp-text)',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 3,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden'
                               }}
                             >
                               {entity.viewTitles?.[viewKey] ?? entity.title}
                             </p>
                           </div>
                         </div>
                       </foreignObject>

                       <text x={x} y={y} display="none">{entity.viewTitles?.[viewKey] ?? entity.title}</text>
                       <text x={x} y={y} display="none">&lt;&lt;{viewType}&gt;&gt;</text>
                     </g>
                   );
                 })}

                 {/* Tooltip */}
                 {tooltip && (() => {
                   const lines = wrapTooltipText(tooltip.description);
                    const ttW = 210;
                    const ttPadX = 12;
                    const ttPadY = 10;
                    const ttLineH = 19;
                   const ttH = ttPadY * 2 + lines.length * ttLineH;
                   const ttX = tooltip.x - ttW / 2;
                   const ttY = tooltip.y - ttH - 10;
                   return (
                     <g style={{ pointerEvents: 'none' }}>
                       <rect
                         x={ttX} y={ttY}
                         width={ttW} height={ttH}
                         rx="6"
                         fill="var(--ctp-crust)"
                         stroke="var(--ctp-surface1)"
                         strokeWidth="1"
                         filter={`url(#flowchart-tooltip-shadow-${viewInstanceId})`}
                       />
                       {lines.map((line, li) => (
                         <text
                            key={li}
                            x={ttX + ttPadX}
                            y={ttY + ttPadY + ttLineH * li + 14}
                            fontSize="14"
                            fill="var(--ctp-text)"
                          >
                            {line}
                          </text>
                       ))}
                     </g>
                   );
                 })()}
               </>
             )}

           </g>
         </svg>
       </div>

      {activeNodePopup && activeNodePopup.nodeId && !isFullscreen && (() => {
        const popupStyle: React.CSSProperties = {
          position: 'absolute',
          left: `${camera.transform.translateX + activeNodePopup.x * camera.transform.scale}px`,
          top: `${camera.transform.translateY + activeNodePopup.y * camera.transform.scale + 30}px`,
          transform: 'translateX(-50%)',
          zIndex: 40,
          background: 'var(--ctp-crust)',
          border: '1px solid var(--ctp-blue)',
          borderRadius: '8px',
          padding: '12px 14px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          minWidth: '220px',
          maxWidth: '320px',
          maxHeight: '400px',
          overflowY: 'auto',
          pointerEvents: 'auto',
          color: 'var(--ctp-text)',
        };

        return (
          <div
            data-testid="flowchart-node-popup"
            style={popupStyle}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-light)', paddingBottom: '6px' }}>
              <span style={{ fontSize: '11px', lineHeight: '1.4', color: 'var(--ctp-subtext1)', opacity: 0.9 }}>
                Open fullscreen to view details and interactive lifecycle
              </span>
              <button
                onClick={() => setActiveNodePopup(null)}
                data-testid="flowchart-node-popup-close"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--ctp-overlay1)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  flexShrink: 0,
                  marginLeft: '8px'
                }}
              >
                <Icons.X size={12} />
              </button>
            </div>
            <button
              onClick={() => {
                setActiveNodePopup(null);
                onEnterFullscreen?.();
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
        );
      })()}
      </div>
    );
  }

function getPathMidpoint(points: Array<{ x: number; y: number }>): { x: number; y: number } {
  if (points.length === 0) return { x: 0, y: 0 };
  if (points.length === 1) return points[0];

  const lengths: number[] = [];
  let totalLength = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i+1].x - points[i].x;
    const dy = points[i+1].y - points[i].y;
    const len = Math.abs(dx) + Math.abs(dy);
    lengths.push(len);
    totalLength += len;
  }

  const targetDist = totalLength / 2;
  let currentDist = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const len = lengths[i];
    if (currentDist + len >= targetDist) {
      const remaining = targetDist - currentDist;
      const p1 = points[i];
      const p2 = points[i+1];
      if (len === 0) return p1;
      const ratio = remaining / len;
      return {
        x: p1.x + (p2.x - p1.x) * ratio,
        y: p1.y + (p2.y - p1.y) * ratio
      };
    }
    currentDist += len;
  }

  return points[points.length - 1];
}

function routeManhattanPath(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  sideFrom: string,
  sideTo: string,
  fromNode: any,
  toNode: any,
  positioned: any[],
  spacing: any
): { pathD: string; midX: number; midY: number } {
  const candidates: Array<{ type: string; points: Array<{ x: number; y: number }> }> = [];

  const candidateXs = new Set<number>();
  candidateXs.add((startX + endX) / 2);
  candidateXs.add(startX + 30);
  candidateXs.add(startX - 30);
  candidateXs.add(endX + 30);
  candidateXs.add(endX - 30);

  const maxCol = positioned.length > 0 ? Math.max(...positioned.map(n => n.grid?.[0] ?? 0)) : 0;
  for (let c = 0; c <= maxCol; c++) {
    candidateXs.add((c + 0.5) * spacing.colSpacing + spacing.offsetX);
  }

  const candidateYs = new Set<number>();
  candidateYs.add((startY + endY) / 2);
  candidateYs.add(startY + 30);
  candidateYs.add(startY - 30);
  candidateYs.add(endY + 30);
  candidateYs.add(endY - 30);

  const maxRow = positioned.length > 0 ? Math.max(...positioned.map(n => n.grid?.[1] ?? 0)) : 0;
  for (let r = 0; r <= maxRow; r++) {
    candidateYs.add((r + 0.5) * spacing.rowSpacing + spacing.offsetY);
  }

  // 1-bend H-V
  candidates.push({
    type: '1-bend H-V',
    points: [
      { x: startX, y: startY },
      { x: endX, y: startY },
      { x: endX, y: endY }
    ]
  });

  // 1-bend V-H
  candidates.push({
    type: '1-bend V-H',
    points: [
      { x: startX, y: startY },
      { x: startX, y: endY },
      { x: endX, y: endY }
    ]
  });

  // H-V-H
  candidateXs.forEach(midX => {
    candidates.push({
      type: 'H-V-H',
      points: [
        { x: startX, y: startY },
        { x: midX, y: startY },
        { x: midX, y: endY },
        { x: endX, y: endY }
      ]
    });
  });

  // V-H-V
  candidateYs.forEach(midY => {
    candidates.push({
      type: 'V-H-V',
      points: [
        { x: startX, y: startY },
        { x: startX, y: midY },
        { x: endX, y: midY },
        { x: endX, y: endY }
      ]
    });
  });

  let bestPath: Array<{ x: number; y: number }> | null = null;
  let minScore = Infinity;
  const PADDING = 12;

  candidates.forEach(cand => {
    const pts = cand.points;
    let collisions = 0;
    let length = 0;
    const bends = pts.length - 2;

    const p0 = pts[0];
    const p1 = pts[1];
    if (sideFrom === 'R' && p1.x < p0.x) return;
    if (sideFrom === 'L' && p1.x > p0.x) return;
    if (sideFrom === 'T' && p1.y > p0.y) return;
    if (sideFrom === 'B' && p1.y < p0.y) return;

    const pk = pts[pts.length - 1];
    const pk1 = pts[pts.length - 2];
    if (sideTo === 'R' && pk1.x < pk.x) return;
    if (sideTo === 'L' && pk1.x > pk.x) return;
    if (sideTo === 'T' && pk1.y > pk.y) return;
    if (sideTo === 'B' && pk1.y < pk.y) return;

    for (let i = 0; i < pts.length - 1; i++) {
      const segmentStart = pts[i];
      const segmentEnd = pts[i+1];
      const dx = segmentEnd.x - segmentStart.x;
      const dy = segmentEnd.y - segmentStart.y;
      length += Math.abs(dx) + Math.abs(dy);

      positioned.forEach(node => {
        const isFromNode = node.id === fromNode.id;
        const isToNode = node.id === toNode.id;

        if (i === 0 && isFromNode) return;
        if (i === pts.length - 2 && isToNode) return;

        const pad = (isFromNode || isToNode) ? 0 : PADDING;
        const left = node.x - NODE_W / 2 - pad;
        const right = node.x + NODE_W / 2 + pad;
        const top = node.y - NODE_H / 2 - pad;
        const bottom = node.y + NODE_H / 2 + pad;

        if (segmentStart.y === segmentEnd.y) {
          const y = segmentStart.y;
          const xMin = Math.min(segmentStart.x, segmentEnd.x);
          const xMax = Math.max(segmentStart.x, segmentEnd.x);
          if (y > top && y < bottom && xMax > left && xMin < right) {
            collisions++;
          }
        } else {
          const x = segmentStart.x;
          const yMin = Math.min(segmentStart.y, segmentEnd.y);
          const yMax = Math.max(segmentStart.y, segmentEnd.y);
          if (x > left && x < right && yMax > top && yMin < bottom) {
            collisions++;
          }
        }
      });
    }

    const score = collisions * 1000000 + bends * 5000 + length;
    if (score < minScore) {
      minScore = score;
      bestPath = pts;
    }
  });

  if (!bestPath) {
    bestPath = [
      { x: startX, y: startY },
      { x: (startX + endX) / 2, y: startY },
      { x: (startX + endX) / 2, y: endY },
      { x: endX, y: endY }
    ];
  }

  let pathD = `M ${bestPath[0].x} ${bestPath[0].y}`;
  for (let i = 1; i < bestPath.length; i++) {
    const prev = bestPath[i-1];
    const curr = bestPath[i];
    if (curr.x === prev.x) {
      pathD += ` V ${curr.y}`;
    } else if (curr.y === prev.y) {
      pathD += ` H ${curr.x}`;
    } else {
      pathD += ` L ${curr.x} ${curr.y}`;
    }
  }

  const mid = getPathMidpoint(bestPath);

  return {
    pathD,
    midX: mid.x,
    midY: mid.y
  };
}
