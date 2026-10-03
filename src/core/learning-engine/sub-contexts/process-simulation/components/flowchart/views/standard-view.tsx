/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, memo } from 'react';
import * as Icons from 'lucide-react';
import { COLORS, BORDER_COLORS, ICONS, ICON_ANIMATIONS, NODE_W, NODE_H, wrapTooltipText, TYPES } from '../types';
import type { UnifiedFlowchartSchema, FlowchartRelation, FlowchartViewNode, FlowchartViewGroup } from '../types';
import type { ForkHighlights } from '../fork-highlights';
import type { StoryRoute } from '../story-route';

/** Longest hand-off label drawn on the canvas; the full text is in the caption. */
const ROUTE_LABEL_MAX = 34;

export interface StandardViewProps {
  viewKey: string;
  viewInstanceId: string;
  schema: UnifiedFlowchartSchema;
  view: { nodes: FlowchartViewNode[]; groups?: FlowchartViewGroup[] };
  positioned: FlowchartViewNode[];
  nodeMap: Map<string, FlowchartViewNode>;
  routedRelations: (FlowchartRelation & { path: string, startX: number, startY: number, endX: number, endY: number, midX: number, midY: number, incomingSide?: string })[];
  activeNodeIds: string[] | null;
  activeRelationIds: string[] | null;
  highlightedNodeId: string | null;
  spacing: { colSpacing: number; rowSpacing: number; offsetX: number; offsetY: number };
  setActiveNodePopup: (popup: any) => void;
  handleNodeClick: (nodeId: string, x?: number, y?: number) => void;
  prevHighlightedNodeId?: string | null;
  isFullscreen?: boolean;
  /** Edges and nodes of the fork the current step passes through. */
  forkHighlights?: ForkHighlights | null;
  /** Route views: numbered trail of hand-offs and the current one's label. */
  storyRoute?: StoryRoute | null;
}

export const StandardView = memo(function StandardView({
  viewKey,
  viewInstanceId,
  schema,
  view,
  positioned,
  nodeMap,
  routedRelations,
  activeNodeIds,
  activeRelationIds,
  highlightedNodeId,
  spacing,
  handleNodeClick,
  isFullscreen,
  forkHighlights,
  storyRoute
}: StandardViewProps) {
  const minX = positioned.length > 0 ? Math.min(...positioned.map(n => n.x || 0)) : 0;
  const maxX = positioned.length > 0 ? Math.max(...positioned.map(n => n.x || 0)) : 0;

  const [tooltip, setTooltip] = useState<{ description: string; x: number; y: number } | null>(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [hoveredEdgeNodeIds, setHoveredEdgeNodeIds] = useState<string[] | null>(null);

  // Route views: an edge is the step's main line, another current line, part of the
  // trail, or off the story. Paint in that order so the main line sits on top.
  const routeRoleOf = (relId: string): 'primary' | 'current' | 'trail' | 'off' | undefined => {
    if (!storyRoute) return undefined;
    if (relId === storyRoute.labelEdgeId) return 'primary';
    if (storyRoute.currentEdgeIds.includes(relId)) return 'current';
    return storyRoute.trail[relId] ? 'trail' : 'off';
  };
  const ROUTE_PAINT_ORDER = { off: 0, trail: 1, current: 2, primary: 3 } as const;
  const edgeOrder = routedRelations.map((_, idx) => idx);
  if (storyRoute) {
    edgeOrder.sort((a, b) =>
      ROUTE_PAINT_ORDER[routeRoleOf(routedRelations[a].id)!] - ROUTE_PAINT_ORDER[routeRoleOf(routedRelations[b].id)!]
    );
  }

  return (
    <>
      {/* Groups */}
      {view.groups && view.groups.map(group => {
        const isFaded = activeNodeIds !== null;
        if (group.isLane) {
          let yVal = group.y ?? 100;
          let hVal = group.h ?? 180;
          if (typeof group.row === 'number') {
            const span = group.rowSpan ?? 1;
            const laneHeight = spacing.rowSpacing * span;
            const firstRowCenterY = group.row * spacing.rowSpacing + spacing.offsetY;
            yVal = firstRowCenterY - spacing.rowSpacing / 2;
            hVal = laneHeight;
          }
          return (
            <g key={group.id} className="flowchart-swimlane-group" opacity={isFaded ? 0.55 : 0.85} style={{ transition: 'opacity 0.3s' }}>
              <rect
                x={minX - 100}
                y={yVal}
                width={maxX - minX + 500}
                height={hVal}
                fill={group.color || 'color-mix(in srgb, var(--ctp-lavender) 12%, transparent)'}
                stroke={group.borderColor || 'var(--ctp-overlay1)'}
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

        if (!group.nodeIds || group.nodeIds.length === 0) return null;
        const gNodes = positioned.filter(n => group.nodeIds?.includes(n.id));
        if (gNodes.length === 0) return null;

        const gMinX = Math.min(...gNodes.map(n => (n.x || 0) - NODE_W / 2)) - 35;
        const gMaxX = Math.max(...gNodes.map(n => (n.x || 0) + NODE_W / 2)) + 35;
        const gMinY = Math.min(...gNodes.map(n => (n.y || 0) - NODE_H / 2)) - 30;
        const gMaxY = Math.max(...gNodes.map(n => (n.y || 0) + NODE_H / 2)) + 30;

        return (
          <g key={group.id} className="flowchart-domain-group" opacity={isFaded ? 0.55 : 1} style={{ transition: 'opacity 0.3s' }}>
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
      {edgeOrder.map(idx => {
        const relEntry = routedRelations[idx];
        const rel = relEntry as any;
        const fromNode = nodeMap.get(rel.from);
        const toNode = nodeMap.get(rel.to);
        if (!fromNode || !toNode) return null;

        const edgeId = `edge-${rel.id}`;
        const isHoveredEdge = hoveredEdgeId === edgeId;
        const isSelectedEdge = selectedEdgeId === edgeId;
        const forkRole = forkHighlights?.takenRelationIds.includes(rel.id)
          ? 'taken'
          : forkHighlights?.altRelationIds.includes(rel.id) ? 'alt' : undefined;
        const routeRole = routeRoleOf(rel.id);
        const isRouteCurrent = routeRole === 'primary' || routeRole === 'current';
        const trailSteps = storyRoute?.trail[rel.id];
        // Fork edges always show their full condition label
        const isExpanded = isHoveredEdge || isSelectedEdge || activeRelationIds?.includes(rel.id) || !!forkRole;
        const isHighlightedNode = highlightedNodeId === rel.from || highlightedNodeId === rel.to;
        const isRelationActive = activeRelationIds?.includes(rel.id) || false;
        const isEdgeActive = isHighlightedNode || isExpanded || isRelationActive;

        const isFaded = activeNodeIds !== null && !activeNodeIds.includes(rel.from) && !activeNodeIds.includes(rel.to) && !isRelationActive && !isExpanded;
        const opacityVal = isExpanded ? 1.0 : (isFaded ? 0.70 : 0.90);
        const strokeColor = isEdgeActive ? 'var(--secondary)' : 'var(--ctp-overlay1)';
        const strokeWidth = isEdgeActive ? 2.5 : 1.5;
        // Pick the arrow marker pre-oriented for this edge's incoming side so
        // the tip points into the target port (e.g. sideTo 'L' => arrow
        // points right into the left port). Fall back to 'L' (the legacy
        // right-pointing marker) when side info is missing.
        const incomingSide = relEntry.incomingSide;
        const markerSide = incomingSide === 'T' || incomingSide === 'R' || incomingSide === 'B' || incomingSide === 'L'
          ? incomingSide
          : 'L';
        const marker = isEdgeActive
          ? `url(#flowchart-arrow-highlight-${markerSide}-${viewInstanceId})`
          : `url(#flowchart-arrow-${markerSide}-${viewInstanceId})`;

        const sideFrom = (relEntry as any).sideFrom || 'R';
        const startMarkerSide = ({ T: 'B', B: 'T', L: 'R', R: 'L' } as Record<string, string>)[sideFrom] || 'R';
        const markerStart = rel.bidirectional
          ? (isEdgeActive
              ? `url(#flowchart-arrow-highlight-${startMarkerSide}-${viewInstanceId})`
              : `url(#flowchart-arrow-${startMarkerSide}-${viewInstanceId})`)
          : undefined;

        const midX = relEntry.midX || 0;
        const midY = relEntry.midY || 0;
        const isHandledBy = !!rel.handledBy;

        // If it is handledBy, we can shift it slightly if we want, but using layout midX is standard.

        let labelText = rel.label;
        if (!labelText) {
          const fromType = schema.entities[rel.from]?.type || schema.entities[rel.from]?.viewTypes?.EVENT_STORMING || 'default';
          const toType = schema.entities[rel.to]?.type || schema.entities[rel.to]?.viewTypes?.EVENT_STORMING || 'default';
          if (fromType === 'COMMAND' && toType === 'EVENT') labelText = 'emits';
          if (fromType === 'EVENT' && toType === 'POLICY') labelText = 'triggers';
          if (fromType === 'POLICY' && toType === 'COMMAND') labelText = 'invokes';
        }

        const segmentLength = Math.abs((relEntry.endX || 0) - (relEntry.startX || 0));
        let displayLabel = labelText;
        if (!isExpanded && displayLabel) {
          if (displayLabel.length > 18 && segmentLength < 180) {
            displayLabel = displayLabel.substring(0, 15) + '...';
          }
          if (displayLabel.length * 7 + 12 > 70) {
            displayLabel = displayLabel.substring(0, 7) + '...';
          }
        }

        const toggleEdge = (e: React.SyntheticEvent) => {
          e.stopPropagation();
          if (selectedEdgeId === edgeId) {
            setSelectedEdgeId(null);
            setHoveredEdgeNodeIds(null);
            setTooltip(null);
          } else {
            setSelectedEdgeId(edgeId);
            setHoveredEdgeNodeIds([rel.from, rel.to]);
            if (labelText || isHandledBy) {
              const desc = isHandledBy ? 'Handled by orchestrator runtime process flow.' : labelText;
              if (desc) setTooltip({ description: desc, x: midX || 0, y: midY || 0 });
            }
          }
        };

        return (
          <g 
            key={edgeId} 
            className="flowchart-edge-group"
            opacity={opacityVal} 
            style={{ transition: 'opacity 0.3s' }}
            data-fork={forkRole}
            data-route={routeRole}
            onMouseEnter={() => {
              setHoveredEdgeId(edgeId);
              setHoveredEdgeNodeIds([rel.from, rel.to]);
              if (!selectedEdgeId && (labelText || isHandledBy)) {
                const desc = isHandledBy ? 'Handled by orchestrator runtime process flow.' : labelText;
                if (desc) setTooltip({ description: desc, x: midX || 0, y: midY || 0 });
              }
            }}
            onMouseLeave={() => {
              setHoveredEdgeId(null);
              if (!selectedEdgeId) {
                setHoveredEdgeNodeIds(null);
                setTooltip(null);
              }
            }}
            onClick={toggleEdge}
            onTouchEnd={toggleEdge}
          >
            {/* Invisible wider interactive hit path for mouse & touch events */}
            <path
              d={rel.path}
              stroke="transparent"
              strokeWidth="30"
              fill="none"
              style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
            />
            <path
              id={edgeId}
              d={rel.path}
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={rel.dashed ? '4 4' : '8 8'}
              markerStart={routeRole === 'off' ? undefined : markerStart}
              markerEnd={routeRole === 'off' ? undefined : marker}
              className="flowchart-edge flowchart-edge-animated"
              data-testid={`flowchart-edge-${viewKey}-${idx}`}
              style={{ 
                pointerEvents: 'none',
                filter: isEdgeActive ? 'drop-shadow(0 0 6px var(--secondary))' : undefined 
              }}
            />
            {isHandledBy && viewKey !== 'SYS_ARCH' && (
              <g transform={`translate(${midX}, ${midY})`} style={{ pointerEvents: 'none' }}>
                <rect x="-8" y="-8" width="16" height="16" rx="8" fill="var(--ctp-surface0)" stroke="var(--ctp-surface2)" />
                <text x="0" y="3" textAnchor="middle" fontSize="10" fill="var(--ctp-text)" fontFamily="var(--font-mono)">⚡</text>
              </g>
            )}
            {!isHandledBy && displayLabel && viewKey !== 'SYS_ARCH' && (() => {
                const rawWidth = displayLabel.length * 7 + 14;
                const clampedWidth = isExpanded ? rawWidth : Math.min(rawWidth, 70);
                return (
                  <g 
                    transform={`translate(${midX}, ${midY})`} 
                    style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                    onClick={toggleEdge}
                    onTouchEnd={toggleEdge}
                  >
                    <rect
                      className="flowchart-edge-label-pill"
                      x={-clampedWidth / 2}
                      y="-10"
                      width={clampedWidth}
                      height="20"
                      rx="10"
                      fill="var(--ctp-base)"
                      stroke={isEdgeActive ? 'var(--secondary)' : 'var(--ctp-surface1)'}
                      strokeWidth="1"
                    />
                    <text
                      className="flowchart-edge-label-text"
                      x="0"
                      y="3"
                      textAnchor="middle"
                      fill={isEdgeActive ? 'var(--secondary)' : 'var(--ctp-subtext0)'}
                      fontSize="10"
                      fontFamily="var(--font-mono)"
                      fontWeight={isEdgeActive ? "600" : "500"}
                    >
                      {displayLabel}
                    </text>
                  </g>
                );
              })()}
            {storyRoute && (isRouteCurrent || trailSteps) && (() => {
              // Numbered hand-off: "② Check the facts…" on the current edge, bare numbers on the trail
              const numbers = isRouteCurrent ? [storyRoute.currentNumber] : trailSteps!;
              const badge = numbers.join('·');
              const text = isRouteCurrent && rel.id === storyRoute.labelEdgeId
                ? (storyRoute.currentLabel.length > ROUTE_LABEL_MAX
                    ? `${storyRoute.currentLabel.slice(0, ROUTE_LABEL_MAX - 1)}…`
                    : storyRoute.currentLabel)
                : '';
              const badgeW = Math.max(18, badge.length * 7 + 10);
              const textW = text ? text.length * 6.2 + 12 : 0;
              const totalW = badgeW + textW;
              return (
                <g
                  className="flowchart-route-label"
                  data-testid={isRouteCurrent ? 'flowchart-route-current' : 'flowchart-route-trail'}
                  data-route-role={routeRole}
                  transform={`translate(${midX - totalW / 2}, ${midY})`}
                  style={{ pointerEvents: 'none' }}
                >
                  {text && (
                    <rect className="flowchart-route-label-pill" x={0} y={-11} width={totalW} height={22} rx={11} />
                  )}
                  <rect className="flowchart-route-badge" x={0} y={-9} width={badgeW} height={18} rx={9} />
                  <text className="flowchart-route-badge-text" x={badgeW / 2} y={3.5} textAnchor="middle">{badge}</text>
                  {text && (
                    <text className="flowchart-route-label-text" x={badgeW + 6} y={3.5}>{text}</text>
                  )}
                </g>
              );
            })()}
            {/* Animated particle dot */}
            <circle
              className="flowchart-edge-particle"
              r="4"
              fill={isHighlightedNode ? 'var(--secondary)' : 'var(--ctp-yellow)'}
              opacity="0"
              data-edge-id={edgeId}
              data-testid={`flowchart-particle-${viewKey}`}
            />
          </g>
        );
      })}

      {/* Nodes */}
      {positioned.map(node => {
        const entity = schema.entities[node.id];
        if (!entity) return null;

        const viewType = entity.viewTypes?.[viewKey] || entity.type || 'default';
        const nW = NODE_W;
        const nH = NODE_H;
        const x = (node.x || 0) - nW / 2;
        const y = (node.y || 0) - nH / 2;
        const isStepHighlighted = activeNodeIds && activeNodeIds.includes(node.id);
        const isHoveredNode = hoveredEdgeNodeIds && hoveredEdgeNodeIds.includes(node.id);
        const isHighlighted = isStepHighlighted || isHoveredNode || (highlightedNodeId === node.id);
        const isDimmed = activeNodeIds !== null && !isHighlighted && hoveredEdgeId === null && selectedEdgeId === null;
        
        const nodeFill = entity.color || (COLORS as any)[viewType as keyof typeof COLORS] || COLORS.default;
        const strokeColor = entity.strokeColor || BORDER_COLORS[viewType as keyof typeof BORDER_COLORS] || BORDER_COLORS.default;
        
        const iconName = ICONS[viewType as keyof typeof ICONS];
        const animClass = ICON_ANIMATIONS[viewType as keyof typeof ICON_ANIMATIONS] || '';
        const IconComponent = iconName && (iconName in Icons)
          ? (Icons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string; color?: string }>>)[iconName]
          : null;
        
        const hasLinks = Object.keys(entity.viewTypes || {}).filter(vk => vk !== viewKey && schema.views![vk]).length > 0;

        return (
          <g
            key={node.id}
            id={`node-${node.id}`}
            data-testid={`flowchart-node-${viewKey}-${node.id}`}
            data-fork={forkHighlights?.altNodeIds.includes(node.id) ? 'alt' : undefined}
            className={`flowchart-node-group ${(isFullscreen && hasLinks) ? 'has-links' : ''} ${isHighlighted ? 'active' : ''}`}
            transform={`translate(${x}, ${y})`}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={isFullscreen ? (e) => {
              e.stopPropagation();
              handleNodeClick(node.id, node.x, node.y);
            } : undefined}
            onMouseEnter={() => {
              if (entity.desc) {
                setTooltip({ description: entity.desc, x: node.x || 0, y: (node.y || 0) - nH / 2 });
              }
            }}
            onMouseLeave={() => setTooltip(null)}
            style={{
              opacity: isDimmed ? 0.6 : 1,
              transition: 'opacity 0.3s, filter 0.3s',
              cursor: isFullscreen ? 'pointer' : 'default'
            }}
          >
            {viewType === TYPES.DECISION ? (
              <polygon
                points={`${nW/2},0 ${nW},${nH/2} ${nW/2},${nH} 0,${nH/2}`}
                fill={nodeFill}
                stroke={strokeColor}
                strokeWidth="1.5"
                filter={isHighlighted ? `url(#flowchart-glow-${viewInstanceId})` : undefined}
                className={`flowchart-node-rect ${isHighlighted ? 'flowchart-node-highlighted' : ''}`}
              />
            ) : (
              <rect
                x={0} y={0}
                width={nW} height={nH}
                rx="8"
                fill={nodeFill}
                stroke={strokeColor}
                strokeWidth="1.5"
                filter={isHighlighted ? `url(#flowchart-glow-${viewInstanceId})` : undefined}
                className={`flowchart-node-rect ${isHighlighted ? 'flowchart-node-highlighted' : ''}`}
              />
            )}

            <foreignObject x={0} y={0} width={nW} height={nH}>
              <div
                className="flowchart-node-card"
                style={{
                  width: '100%',
                  height: '100%',
                  padding: viewType === TYPES.DECISION ? '16px' : '10px',
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  userSelect: 'none',
                  justifyContent: viewType === TYPES.DECISION ? 'center' : 'flex-start'
                }}
              >
                {viewType !== TYPES.DECISION && (
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
                )}
                
                <div
                  style={{
                    flex: viewType === TYPES.DECISION ? 'none' : 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    gap: viewType === TYPES.DECISION ? '4px' : '0'
                  }}
                >
                  {viewType === TYPES.DECISION && IconComponent && (
                    <span className={animClass} style={{ display: 'flex', alignItems: 'center' }}>
                      <IconComponent size={16} color={strokeColor} />
                    </span>
                  )}
                  <p
                    style={{
                      margin: 0,
                      textAlign: 'center',
                      fontWeight: 'bold',
                      lineHeight: 1.25,
                      fontSize: viewType === TYPES.DECISION ? '12px' : '14px',
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

            <text x={0} y={0} display="none">{entity.viewTitles?.[viewKey] ?? entity.title}</text>
            <text x={0} y={0} display="none">&lt;&lt;{viewType}&gt;&gt;</text>
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
  );
});
