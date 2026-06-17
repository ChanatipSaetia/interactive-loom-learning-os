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

export interface FlowchartViewProps {
  viewKey: string;
  schema: UnifiedFlowchartSchema;
  activeNodeIds: string[] | null;
  highlightedNodeId: string | null;
  prevHighlightedNodeId: string | null;
  currentStep: number;
  handleNodeClick: (nodeId: string) => void;
  instanceId: string;
  isGridMode: boolean;
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
  isGridMode
}: FlowchartViewProps) {
  const view = schema.views[viewKey];
  const viewInstanceId = `${instanceId}-${viewKey}`;
  const isSequenceView = viewKey === 'SEQUENCE';

  // SEQUENCE view derived data
  const seqRelations = useMemo(
    () => schema.relations.filter(r => r.views.includes('SEQUENCE')),
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

  // Node positioning
  const positioned = useMemo(() => {
    if (!view) return [];
    return view.nodes.map(node => {
      if (typeof node.x === 'number' && typeof node.y === 'number') {
        return { ...node, x: node.x, y: node.y };
      }
      if (node.grid) {
        const [c, r] = node.grid;
        let x = 0;
        let y = 0;
        if (viewKey === 'EVENT_STORMING') {
          x = c * 140 + 60;
          if (r === 0) y = 50;
          else if (r === 1) y = 150;
          else if (r === 2) y = 250;
          else if (r === 3) y = 450;
          else if (r === 4) y = 650;
          else y = 250 + (r - 2) * 200;
        } else if (viewKey === 'SYS_ARCH') {
          x = c * 140 + 80;
          y = r * 100 + 100;
        } else if (viewKey === 'DATA_FLOW') {
          x = c * 140 + 100;
          y = r * 100 + 100;
        } else if (viewKey === 'SWIMLANES') {
          x = c * 140 + 160;
          if (r === 0) y = 75;
          else if (r === 1) y = 270;
          else if (r === 2) y = 460;
          else if (r === 3) y = 650;
          else y = 75 + r * 190;
        } else if (viewKey === 'SEQUENCE') {
          x = c * 100 + 60;
          y = (r ?? 0) * 48 + 80;
        } else {
          x = c * 140 + 100;
          y = r * 100 + 100;
        }
        return { ...node, x, y };
      }
      return { ...node, x: 0, y: 0 };
    });
  }, [view, viewKey]);

  const positionedNodesRef = useRef(positioned);
  useEffect(() => { positionedNodesRef.current = positioned; }, [positioned]);

  const nodeMap = useMemo(() => {
    const m = Object.create(null);
    for (const n of positioned) {
      m[n.id] = n;
    }
    return m;
  }, [positioned]);

  const minX = positioned.length > 0 ? Math.min(...positioned.map(n => n.x)) : 0;
  const maxX = positioned.length > 0 ? Math.max(...positioned.map(n => n.x)) : 0;
  const minY = positioned.length > 0 ? Math.min(...positioned.map(n => n.y)) : 0;
  const maxY = positioned.length > 0 ? Math.max(...positioned.map(n => n.y)) : 0;

  // Camera
  const camera = useCamera({ positionedNodesRef });

  // Focus camera on active nodes
  useEffect(() => {
    if (activeNodeIds && activeNodeIds.length > 0) {
      camera.focusOnNodes(activeNodeIds);
    }
  }, [activeNodeIds, camera]);

  // Particle animation
  const particleRef = useRef<SVGCircleElement | null>(null);
  const animeInstanceRef = useRef<ReturnType<typeof animate> | null>(null);

  useEffect(() => {
    if (currentStep <= 0 || !prevHighlightedNodeId || !highlightedNodeId || !view) return;
    const fromNode = nodeMap[prevHighlightedNodeId];
    const toNode = nodeMap[highlightedNodeId];
    if (!fromNode || !toNode) return;

    const hasRelation = schema.relations.some(
      r => r.views.includes(viewKey) &&
      ((r.from === prevHighlightedNodeId && r.to === highlightedNodeId) ||
        (r.to === prevHighlightedNodeId && r.from === highlightedNodeId))
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
  }, [currentStep, prevHighlightedNodeId, highlightedNodeId, viewKey, nodeMap, schema.relations, view]);

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
    <div className="flowchart-canvas-wrapper" style={{ position: 'relative' }}>
      {isGridMode && (
        <div style={{
          position: 'absolute',
          top: '8px',
          left: '12px',
          zIndex: 15,
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '10px',
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
        <ZoomToolbar
          handleZoomIn={camera.handleZoomIn}
          handleZoomOut={camera.handleZoomOut}
          handleFitToScreen={() => camera.fitToScreen(minX, maxX, minY, maxY)}
        />

        <svg
          ref={camera.svgRef}
          className="flowchart-svg"
          data-testid={`flowchart-svg-${viewKey}`}
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
              <feDropShadow dx="0" dy="3" stdDeviation="6" floodColor="#ca9ee6" floodOpacity="0.25" />
            </filter>
            <filter id={`flowchart-tooltip-shadow-${viewInstanceId}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000000" floodOpacity="0.4" />
            </filter>
            <filter id={`flowchart-glow-${viewInstanceId}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#8caaee" floodOpacity="0.6" />
            </filter>
            <marker id={`flowchart-arrow-${viewInstanceId}`} markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
              <path d="M 0 0 L 7 3 L 0 6 Z" fill="#626880" />
            </marker>
            <marker id={`flowchart-arrow-highlight-${viewInstanceId}`} markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
              <path d="M 0 0 L 7 3 L 0 6 Z" fill="#8caaee" />
            </marker>
            {isSequenceView && (
              <>
                <marker id={`seq-arrow-fwd-${viewInstanceId}`} markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                  <path d="M 0 0 L 7 3 L 0 6 Z" fill="#8caaee" />
                </marker>
                <marker id={`seq-arrow-ret-${viewInstanceId}`} markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                  <path d="M 0 0 L 7 3 L 0 6 Z" fill="#e5c890" />
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
              <circle cx="2" cy="2" r={1 * camera.transform.scale} fill="#51576d" opacity="0.6" />
            </pattern>
          </defs>

          <rect width="100%" height="100%" fill={`url(#dotGrid-${viewInstanceId})`} style={{ pointerEvents: 'none' }} />

          <g transform={transformStr} data-testid={`flowchart-canvas-${viewKey}`}>
             {isSequenceView ? (
               <>
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
                         stroke="#626880"
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
                   const nodeFill = COLORS[entity.viewTypes.SEQUENCE as keyof typeof COLORS] || COLORS.default;
                   const strokeColor = BORDER_COLORS[entity.viewTypes.SEQUENCE as keyof typeof BORDER_COLORS] || BORDER_COLORS.default;
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
                         stroke={isActive ? '#8caaee' : strokeColor}
                         strokeWidth={isActive ? '2' : '1.5'}
                         filter={isActive ? `url(#flowchart-glow-${viewInstanceId})` : undefined}
                       />
                       <text
                         x={colX}
                         y={boxY + 20}
                         textAnchor="middle"
                         fill="#c6d0f5"
                         fontSize="9"
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
                   const nodeFill = COLORS[entity.viewTypes.SEQUENCE as keyof typeof COLORS] || COLORS.default;
                   const strokeColor = BORDER_COLORS[entity.viewTypes.SEQUENCE as keyof typeof BORDER_COLORS] || BORDER_COLORS.default;
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
                         stroke={isActive ? '#8caaee' : strokeColor}
                         strokeWidth={isActive ? '2' : '1.5'}
                       />
                       <text
                         x={colX}
                         y={bottomY + 20}
                         textAnchor="middle"
                         fill="#c6d0f5"
                         fontSize="9"
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
                       fill="rgba(140, 170, 238, 0.12)"
                       stroke="#8caaee"
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
                         stroke={isActiveMsg ? '#8caaee' : (isReturn ? '#e5c890' : '#8caaee')}
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
                           fill={isActiveMsg ? '#8caaee' : '#a5adce'}
                           fontSize="8"
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
                       if (group.row === 0) { yVal = 30; hVal = 110; }
                       else if (group.row === 1) { yVal = 200; hVal = 160; }
                       else if (group.row === 2) { yVal = 390; hVal = 160; }
                       else if (group.row === 3) { yVal = 590; hVal = 110; }
                       else { yVal = 590 + (group.row - 3) * 190; hVal = 160; }
                     }
                     return (
                       <g key={group.id} className="flowchart-swimlane-group" opacity={isFaded ? 0.15 : 0.85} style={{ transition: 'opacity 0.3s' }}>
                         <rect
                           x={minX - 100}
                           y={yVal}
                           width={maxX - minX + 500}
                           height={hVal}
                           fill={group.color || 'rgba(186, 187, 241, 0.10)'}
                           stroke={group.borderColor || '#626880'}
                           strokeWidth="1.5"
                         />
                         <text
                           x={minX - 80}
                           y={yVal + 25}
                           fontSize="13"
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
                         fill={group.color || 'rgba(140, 170, 238, 0.10)'}
                         stroke={group.borderColor || '#8caaee'}
                         strokeWidth="1.5"
                         strokeDasharray="4 4"
                       />
                       <text
                         x={gMinX + 15}
                         y={gMinY + 22}
                         fontSize="11"
                         fontWeight="bold"
                         fill={group.textColor || '#c6d0f5'}
                       >
                         {group.title}
                       </text>
                     </g>
                   );
                 })}

                 {/* Edges */}
                 {schema.relations
                   .filter(r => r.views.includes(viewKey))
                   .map((rel, idx) => {
                     const fromNode = nodeMap[rel.from];
                     const toNode = nodeMap[rel.to];
                     if (!fromNode || !toNode) return null;

                     const entityFrom = schema.entities[rel.from];
                     const entityTo = schema.entities[rel.to];
                     if (!entityFrom || !entityTo) return null;

                     const x1 = fromNode.x;
                     const y1 = fromNode.y;
                     const x2 = toNode.x;
                     const y2 = toNode.y;

                     const dx = x2 - x1;
                     const dy = y2 - y1;

                     let startX = x1;
                     let startY = y1;
                     let endX = x2;
                     let endY = y2;

                     if (Math.abs(dx) > Math.abs(dy)) {
                       startX = x1 + (dx > 0 ? NODE_W / 2 : -NODE_W / 2);
                       endX = x2 + (dx > 0 ? -NODE_W / 2 : NODE_W / 2);
                     } else {
                       startY = y1 + (dy > 0 ? NODE_H / 2 : -NODE_H / 2);
                       endY = y2 + (dy > 0 ? -NODE_H / 2 : NODE_H / 2);
                     }

                     const dist = Math.hypot(endX - startX, endY - startY);
                     const cp1x = startX + (dx > 0 ? Math.min(100, dist * 0.4) : -Math.min(100, dist * 0.4));
                     const cp1y = startY;
                     const cp2x = endX + (dx > 0 ? -Math.min(100, dist * 0.4) : Math.min(100, dist * 0.4));
                     const cp2y = endY;

                     const isHighlighted = activeNodeIds && activeNodeIds.includes(rel.from) && activeNodeIds.includes(rel.to);
                     const isFaded = activeNodeIds !== null && !isHighlighted;
                     const isHandledBy = rel.handledBy;
                     const midX = (startX + endX) / 2;
                     const midY = (startY + endY) / 2;
                     const isVertical = fromNode.x === toNode.x;

                     const pathD = isHandledBy && isVertical
                       ? `M ${startX} ${startY} L ${endX} ${endY}`
                       : `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;

                     return (
                       <g key={rel.id} data-testid={`flowchart-edge-${viewKey}-${idx}`} style={{ transition: 'opacity 0.3s', opacity: isFaded ? 0.1 : 0.8 }}>
                         <path
                           d={pathD}
                           stroke="#626880"
                           strokeWidth="1.5"
                           fill="none"
                           strokeOpacity="0.3"
                           markerEnd={isHandledBy ? '' : `url(#flowchart-arrow-${viewInstanceId})`}
                         />
                         <path
                           d={pathD}
                           stroke={isHighlighted ? '#8caaee' : (isHandledBy ? '#a6d189' : (rel.dashed ? '#e5c890' : '#8caaee'))}
                           strokeWidth={isHighlighted ? '2.5' : (isHandledBy ? '2' : '1.5')}
                           fill="none"
                           strokeOpacity={isHighlighted ? '0.95' : (isHandledBy ? '0.8' : '0.55')}
                           strokeDasharray={isHandledBy ? 'none' : (rel.dashed ? '4 4' : '6 7')}
                           markerEnd={isHandledBy ? `url(#flowchart-arrow-${viewInstanceId})` : (isHighlighted ? `url(#flowchart-arrow-highlight-${viewInstanceId})` : `url(#flowchart-arrow-${viewInstanceId})`)}
                           className={rel.dashed ? '' : 'flowchart-edge-animated'}
                         />
                         {isHandledBy && (
                           <text
                             x={midX + (isVertical ? 12 : 0)}
                             y={midY - 6}
                             textAnchor={isVertical ? 'start' : 'middle'}
                             fill="#a6d189"
                             fontSize="9"
                             fontWeight="600"
                             opacity={isHighlighted ? '0.95' : '0.75'}
                             style={{ pointerEvents: 'none', userSelect: 'none' }}
                           >
                             handled by
                           </text>
                         )}
                         {!isHandledBy && rel.label && (
                           <text
                             x={midX + (isVertical ? 8 : 0)}
                             y={midY - 4}
                             textAnchor={isVertical ? 'start' : 'middle'}
                             fill={isHighlighted ? '#8caaee' : '#a5adce'}
                             fontSize="9"
                             fontFamily="var(--font-mono)"
                             fontWeight="500"
                             opacity={isHighlighted ? '0.95' : '0.75'}
                             style={{ pointerEvents: 'none', userSelect: 'none' }}
                           >
                             {rel.label}
                           </text>
                         )}
                       </g>
                     );
                   })}

                 {/* Particle */}
                 {currentStep >= 0 && (
                   <circle
                     ref={particleRef}
                     r="6"
                     fill="#8caaee"
                     opacity="0"
                     className="flowchart-particle"
                     data-testid={`flowchart-particle-${viewKey}`}
                   />
                 )}

                 {/* Nodes */}
                 {positioned.map(node => {
                   const entity = schema.entities[node.id];
                   if (!entity) return null;

                   const viewType = entity.viewTypes[viewKey] || 'default';
                   const nW = NODE_W;
                   const nH = NODE_H;
                   const x = node.x - nW / 2;
                   const y = node.y - nH / 2;
                   const isStepHighlighted = activeNodeIds && activeNodeIds.includes(node.id);
                   const isDimmed = activeNodeIds !== null && !isStepHighlighted;
                   const isHighlighted = isStepHighlighted || (highlightedNodeId === node.id);
                   const nodeFill = COLORS[viewType as keyof typeof COLORS] || COLORS.default;
                   const strokeColor = BORDER_COLORS[viewType as keyof typeof BORDER_COLORS] || BORDER_COLORS.default;
                   const iconName = ICONS[viewType as keyof typeof ICONS];
                   const animClass = ICON_ANIMATIONS[viewType as keyof typeof ICON_ANIMATIONS] || '';
                   const IconComponent = iconName && (iconName in Icons)
                     ? (Icons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string; color?: string }>>)[iconName]
                     : null;
                   const hasLinks = Object.keys(entity.viewTypes).filter(vk => vk !== viewKey && schema.views[vk]).length > 0;

                   return (
                     <g
                       key={node.id}
                       data-testid={`flowchart-node-${viewKey}-${node.id}`}
                       className={`flowchart-node-group ${hasLinks ? 'has-links' : ''}`}
                       onMouseDown={(e) => e.stopPropagation()}
                       onTouchStart={(e) => e.stopPropagation()}
                       onClick={(e) => {
                         e.stopPropagation();
                         handleNodeClick(node.id);
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
                         cursor: hasLinks ? 'pointer' : 'default'
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
                               borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
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
                                 fontSize: '8px',
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
                                 fontSize: '11px',
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
                   const ttW = 190;
                   const ttPadX = 10;
                   const ttPadY = 8;
                   const ttLineH = 15;
                   const ttH = ttPadY * 2 + lines.length * ttLineH;
                   const ttX = tooltip.x - ttW / 2;
                   const ttY = tooltip.y - ttH - 10;
                   return (
                     <g style={{ pointerEvents: 'none' }}>
                       <rect
                         x={ttX} y={ttY}
                         width={ttW} height={ttH}
                         rx="6"
                         fill="#232634"
                         stroke="#51576d"
                         strokeWidth="1"
                         filter={`url(#flowchart-tooltip-shadow-${viewInstanceId})`}
                       />
                       {lines.map((line, li) => (
                         <text
                           key={li}
                           x={ttX + ttPadX}
                           y={ttY + ttPadY + ttLineH * li + 11}
                           fontSize="10"
                           fill="#c6d0f5"
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
    </div>
  );
}
