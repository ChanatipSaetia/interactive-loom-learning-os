/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useRef } from 'react';
import { animate } from 'animejs';
import * as Icons from 'lucide-react';

import { ZoomToolbar } from '../zoom-toolbar';
import { useCamera } from '../useCamera';
import { NODE_W, NODE_H, ICONS, COLORS, TYPES } from '../types';
import type { UnifiedFlowchartSchema } from '../types';

// Views whose timeline reads left-to-right. In these, edges between flow nodes
// (Command/Event/Policy and their per-view equivalents) should leave the
// right side of the source and enter the left side of the target.
const HORIZONTAL_FLOW_VIEWS = new Set(['EVENT_STORMING', 'SWIMLANES', 'DATA_FLOW']);

// The per-view node types that participate in the horizontal timeline flow.
const FLOW_TYPES_BY_VIEW: Record<string, Set<string>> = {
  EVENT_STORMING: new Set([TYPES.COMMAND, TYPES.EVENT, TYPES.POLICY]),
  SWIMLANES: new Set([TYPES.PROCESS, TYPES.DECISION]),
  DATA_FLOW: new Set([TYPES.DATA_OBJECT, TYPES.DECISION]),
};
import { computeDynamicSpacing, routeManhattanPath } from './layout-utils';
import { SequenceView } from './sequence-view';
import { StandardView } from './standard-view';

const Workflow = Icons.Workflow;

export interface FlowchartViewProps {
  viewKey: string;
  schema: UnifiedFlowchartSchema;
  activeNodeIds: string[] | null;
  activeRelationIds: string[] | null;
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
  setActiveNodePopup: (popup: any) => void;
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
  activeRelationIds,
  highlightedNodeId,
  prevHighlightedNodeId,
  currentStep,
  handleNodeClick,
  instanceId: viewInstanceId,
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
  const view = schema.views![viewKey];
  const isSequenceView = viewKey === 'SEQUENCE';

  const spacing = useMemo(() => {
    if (!view) return { colSpacing: 140, rowSpacing: 150, offsetX: 100, offsetY: 100 };
    const defaults: Record<string, { colSpacing: number; rowSpacing: number; offsetX: number; offsetY: number }> = {
      EVENT_STORMING: { colSpacing: 140, rowSpacing: 160, offsetX: 60, offsetY: 50 },
      STATE_MACHINE: { colSpacing: 140, rowSpacing: 150, offsetX: 60, offsetY: 80 },
      SYS_ARCH: { colSpacing: 140, rowSpacing: 130, offsetX: 80, offsetY: 100 },
      DATA_FLOW: { colSpacing: 140, rowSpacing: 130, offsetX: 100, offsetY: 100 },
      SWIMLANES: { colSpacing: 140, rowSpacing: 130, offsetX: 160, offsetY: 75 },
      SEQUENCE: { colSpacing: 100, rowSpacing: 48, offsetX: 60, offsetY: 80 },
    };
    const base = defaults[viewKey] || { colSpacing: 140, rowSpacing: 150, offsetX: 100, offsetY: 100 };
    return view.layoutInfo
      ? computeDynamicSpacing(view.layoutInfo, base, viewKey)
      : base;
  }, [view, viewKey]);

  const positioned = useMemo(() => {
    if (!view || isSequenceView) return [];
    return view.nodes.map(n => ({
      ...n,
      x: n.grid ? n.grid[0] * spacing.colSpacing + spacing.offsetX : (n.x !== undefined ? n.x : 0),
      y: n.grid ? n.grid[1] * spacing.rowSpacing + spacing.offsetY : (n.y !== undefined ? n.y : 0)
    }));
  }, [view, spacing, isSequenceView]);

  const nodeMap = useMemo(() => {
    const map = new Map();
    positioned.forEach(n => map.set(n.id, n));
    return map;
  }, [positioned]);

  const routedRelations = useMemo(() => {
    if (!view || isSequenceView) return [];
    const activeRelations = schema.relations.filter(r => r.views?.includes(viewKey));

    // Map of occupied grid cells -> node id, so a port can avoid exiting or
    // entering through a side where an adjacent node sits (which would make the
    // edge cross through that neighbour). Cells are quantised to the nearest
    // half-row/half-col to catch the fractional offsets used by handlers/dbs.
    const cellKey = (col: number, row: number) => `${Math.round(col * 2)},${Math.round(row * 2)}`;
    const occupied = new Map<string, string>();
    positioned.forEach(n => {
      if (n.grid) occupied.set(cellKey(n.grid[0], n.grid[1]), n.id);
    });
    // Is the cell immediately on `side` of (col,row) taken by a node other than
    // `selfId` and `otherId` (the two endpoints of the edge being routed)?
    const sideBlocked = (
      col: number, row: number, side: string, selfId: string, otherId: string,
    ): boolean => {
      let dc = 0, dr = 0;
      if (side === 'R') dc = 1;
      else if (side === 'L') dc = -1;
      else if (side === 'T') dr = -1;
      else if (side === 'B') dr = 1;
      const occ = occupied.get(cellKey(col + dc, row + dr));
      return occ !== undefined && occ !== selfId && occ !== otherId;
    };

    const relSides = activeRelations.map(rel => {
      const fromNode = nodeMap.get(rel.from);
      const toNode = nodeMap.get(rel.to);
      if (!fromNode || !toNode) return null;

      const colA = fromNode.grid ? fromNode.grid[0] : Math.round(((fromNode.x || 0) - spacing.offsetX) / spacing.colSpacing);
      const rowA = fromNode.grid ? fromNode.grid[1] : Math.round(((fromNode.y || 0) - spacing.offsetY) / spacing.rowSpacing);
      const colB = toNode.grid ? toNode.grid[0] : Math.round(((toNode.x || 0) - spacing.offsetX) / spacing.colSpacing);
      const rowB = toNode.grid ? toNode.grid[1] : Math.round(((toNode.y || 0) - spacing.offsetY) / spacing.rowSpacing);

      const startPts = [
        { side: 'T', x: fromNode.x, y: fromNode.y - NODE_H / 2 },
        { side: 'R', x: fromNode.x + NODE_W / 2, y: fromNode.y },
        { side: 'B', x: fromNode.x, y: fromNode.y + NODE_H / 2 },
        { side: 'L', x: fromNode.x - NODE_W / 2, y: fromNode.y }
      ];

      const endPts = [
        { side: 'T', x: toNode.x, y: toNode.y - NODE_H / 2 },
        { side: 'R', x: toNode.x + NODE_W / 2, y: toNode.y },
        { side: 'B', x: toNode.x, y: toNode.y + NODE_H / 2 },
        { side: 'L', x: toNode.x - NODE_W / 2, y: toNode.y }
      ];

      let minPenalty = Infinity;
      let startPt = startPts[0];
      let endPt = endPts[0];

      startPts.forEach(sp => {
        endPts.forEach(ep => {
          const dx = ep.x - sp.x;
          const dy = ep.y - sp.y;
          const dist = Math.abs(dx) + Math.abs(dy);
          let penalty = dist;

          if (sp.side === 'R' && dx < 0) penalty += 500;
          if (sp.side === 'L' && dx > 0) penalty += 500;
          if (sp.side === 'T' && dy > 0) penalty += 500;
          if (sp.side === 'B' && dy < 0) penalty += 500;

          if (ep.side === 'R' && dx > 0) penalty += 500;
          if (ep.side === 'L' && dx < 0) penalty += 500;
          if (ep.side === 'T' && dy < 0) penalty += 500;
          if (ep.side === 'B' && dy > 0) penalty += 500;

          // Strongly discourage ports on a side that an adjacent in-grid node
          // occupies: tunnelling an edge straight through a neighbouring node is
          // worse than taking a slightly longer route, so this outweighs the
          // directional penalty above and pushes the port to a clear side.
          if (sideBlocked(colA, rowA, sp.side, rel.from, rel.to)) penalty += 800;
          if (sideBlocked(colB, rowB, ep.side, rel.to, rel.from)) penalty += 800;

          if (penalty < minPenalty) {
            minPenalty = penalty;
            startPt = sp;
            endPt = ep;
          }
        });
      });

      let sideFrom = startPt.side;
      let sideTo = endPt.side;

      // In the horizontal timeline views, force flow-node edges to exit the
      // right of the source and enter the left of the target so Command →
      // Event → Policy chains read cleanly left-to-right. Only applies when the
      // target sits to the right of the source (forward flow); backward edges
      // keep the distance-optimised sides to avoid crossing through nodes.
      if (HORIZONTAL_FLOW_VIEWS.has(viewKey)) {
        const flowTypes = FLOW_TYPES_BY_VIEW[viewKey];
        const typeOf = (id: string) => {
          const e = schema.entities[id];
          return e?.viewTypes?.[viewKey] || e?.type || 'default';
        };
        const bothFlow = flowTypes.has(typeOf(rel.from)) && flowTypes.has(typeOf(rel.to));
        if (bothFlow && colB > colA) {
          sideFrom = 'R';
          sideTo = 'L';
        }
      }

      return {
        rel,
        fromId: rel.from,
        toId: rel.to,
        sideFrom,
        sideTo,
        fromNode,
        toNode,
        colA, rowA, colB, rowB
      };
    }).filter(Boolean) as any[];

    const nodeSideConns: Record<string, Record<string, any[]>> = {};
    positioned.forEach(n => {
      nodeSideConns[n.id] = { 'T': [], 'R': [], 'B': [], 'L': [] };
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

    const relPorts: Record<string, any> = {};
    positioned.forEach(node => {
      ['T', 'R', 'B', 'L'].forEach(side => {
        const conns = nodeSideConns[node.id][side];
        if (conns.length === 0) return;

        conns.sort((a, b) => {
          const nodeA = nodeMap.get(a.otherNodeId);
          const nodeB = nodeMap.get(b.otherNodeId);
          if (!nodeA || !nodeB) return 0;
          if (side === 'T' || side === 'B') {
            return (nodeA.x || 0) - (nodeB.x || 0);
          } else {
            return (nodeA.y || 0) - (nodeB.y || 0);
          }
        });

        const K = conns.length;
        conns.forEach((conn, i) => {
          let px = node.x || 0;
          let py = node.y || 0;

          if (side === 'L') {
            px -= NODE_W / 2;
            py = py - NODE_H / 2 + (i + 1) * NODE_H / (K + 1);
          } else if (side === 'R') {
            px += NODE_W / 2;
            py = py - NODE_H / 2 + (i + 1) * NODE_H / (K + 1);
          } else if (side === 'T') {
            py -= NODE_H / 2;
            px = px - NODE_W / 2 + (i + 1) * NODE_W / (K + 1);
          } else if (side === 'B') {
            py += NODE_H / 2;
            px = px - NODE_W / 2 + (i + 1) * NODE_W / (K + 1);
          }

          if (!relPorts[conn.relId]) relPorts[conn.relId] = {};
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
        ...entry.rel,
        path: pathD,
        startX, startY, endX, endY,
        midX, midY
      };
    }).filter(Boolean) as (any & { path: string })[];

  }, [view, schema.relations, positioned, viewKey, spacing, nodeMap, isSequenceView]);

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

  useEffect(() => {
    if (viewKey === 'STATE_MACHINE') {
      if (highlightedNodeId) {
        focusOnNodes([highlightedNodeId]);
      }
    } else {
      if (activeNodeIds && activeNodeIds.length > 0) {
        focusOnNodes(activeNodeIds);
      }
    }
  }, [viewKey, activeNodeIds, highlightedNodeId, focusOnNodes]);

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

  const particlesRef = useRef<{ id: string, anim: any }[]>([]);

  useEffect(() => {
    particlesRef.current.forEach(p => p.anim.pause());
    particlesRef.current = [];

    if (!activeNodeIds || activeNodeIds.length === 0) return;
    if (currentStep === 0) return;
    if (isSequenceView) return;

    let targetEdgeIdxs: number[] = [];
    if (currentJourneyId && schema.journeys) {
      const journey = schema.journeys.find(j => j.id === currentJourneyId);
      if (journey && journey.steps[currentStep - 1]) {
        const step = journey.steps[currentStep - 1] as any;
        if (step.relIds) {
          targetEdgeIdxs = step.relIds.map((rid: string) => routedRelations.findIndex(r => r.id === rid)).filter((idx: number) => idx !== -1);
        } else {
          targetEdgeIdxs = routedRelations
            .map((r, i) => (r.from === prevHighlightedNodeId && r.to === highlightedNodeId) ? i : -1)
            .filter(i => i !== -1);
        }
      }
    }

    targetEdgeIdxs.forEach(idx => {
      const rel = routedRelations[idx];
      if (!rel) return;
      const edgeEl = document.querySelector(`[data-testid="flowchart-edge-${viewKey}-${idx}"]`) as SVGPathElement;
      if (!edgeEl) return;
      const edgeId = `edge-${rel.id}`;
      const particleEl = document.querySelector(`circle[data-edge-id="${edgeId}"]`) as SVGCircleElement;
      if (!particleEl) return;

      const pathLength = edgeEl.getTotalLength();
      if (!pathLength) return;

      const p0 = edgeEl.getPointAtLength(0);
      particleEl.setAttribute('cx', p0.x.toString());
      particleEl.setAttribute('cy', p0.y.toString());
      particleEl.setAttribute('opacity', '1');

      const p1 = edgeEl.getPointAtLength(pathLength);
      const anim = animate(particleEl, {
        cx: [p0.x, p1.x],
        cy: [p0.y, p1.y],
        easing: 'easeInOutSine',
        duration: 1000,
        onComplete: () => {
          particleEl.setAttribute('opacity', '0');
        }
      });
      particlesRef.current.push({ id: edgeId, anim });
    });
  }, [currentStep, prevHighlightedNodeId, highlightedNodeId, viewKey, nodeMap, schema.relations, view, currentJourneyId, schema.journeys, routedRelations, isSequenceView]);

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
            <marker id={`flowchart-arrow-${viewInstanceId}`} markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
              <path d="M 0 0 L 7 3 L 0 6 Z" fill="var(--ctp-overlay1)" />
            </marker>
            <marker id={`flowchart-arrow-highlight-${viewInstanceId}`} markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
              <path d="M 0 0 L 7 3 L 0 6 Z" fill="var(--secondary)" />
            </marker>
            {isSequenceView && (
              <>
                <marker id={`seq-arrow-cmd-${viewInstanceId}`} markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                  <path d="M 0 0 L 7 3 L 0 6 Z" fill="var(--secondary)" />
                </marker>
                <marker id={`seq-arrow-evt-${viewInstanceId}`} markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                  <path d="M 0 0 L 7 3 L 0 6 Z" fill="var(--ctp-peach)" />
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
               />
             )}
          </g>
        </svg>

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
