import { useState } from 'react';
import * as Icons from 'lucide-react';
import { COLORS, BORDER_COLORS, ICONS, ICON_ANIMATIONS, NODE_W, NODE_H, wrapTooltipText } from '../types';
import type { UnifiedFlowchartSchema, FlowchartRelation, FlowchartViewNode, FlowchartViewGroup } from '../types';

export interface StandardViewProps {
  viewKey: string;
  viewInstanceId: string;
  schema: UnifiedFlowchartSchema;
  view: { nodes: FlowchartViewNode[]; groups?: FlowchartViewGroup[] };
  positioned: FlowchartViewNode[];
  nodeMap: Map<string, FlowchartViewNode>;
  routedRelations: (FlowchartRelation & { path: string, startX: number, startY: number, endX: number, endY: number, midX: number, midY: number })[];
  activeNodeIds: string[] | null;
  highlightedNodeId: string | null;
  spacing: { colSpacing: number; rowSpacing: number; offsetX: number; offsetY: number };
  setActiveNodePopup: (popup: any) => void;
  handleNodeClick: (nodeId: string, x?: number, y?: number) => void;
  prevHighlightedNodeId?: string | null;
  isFullscreen?: boolean;
}

export function StandardView({
  viewKey,
  viewInstanceId,
  schema,
  view,
  positioned,
  nodeMap,
  routedRelations,
  activeNodeIds,
  highlightedNodeId,
  spacing,
  handleNodeClick,
  isFullscreen
}: StandardViewProps) {
  const minX = positioned.length > 0 ? Math.min(...positioned.map(n => n.x || 0)) : 0;
  const maxX = positioned.length > 0 ? Math.max(...positioned.map(n => n.x || 0)) : 0;

  const [tooltip, setTooltip] = useState<{ description: string; x: number; y: number } | null>(null);

  return (
    <>
      {/* Groups */}
      {view.groups && view.groups.map(group => {
        const isFaded = activeNodeIds !== null;
        if (group.isLane) {
          let yVal = group.y ?? 100;
          let hVal = group.h ?? 180;
          if (typeof group.row === 'number') {
            const laneHeight = 160;
            const centerY = group.row * spacing.rowSpacing + spacing.offsetY;
            yVal = centerY - laneHeight / 2;
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

        if (!group.nodeIds || group.nodeIds.length === 0) return null;
        const gNodes = positioned.filter(n => group.nodeIds?.includes(n.id));
        if (gNodes.length === 0) return null;

        const gMinX = Math.min(...gNodes.map(n => (n.x || 0) - NODE_W / 2)) - 35;
        const gMaxX = Math.max(...gNodes.map(n => (n.x || 0) + NODE_W / 2)) + 35;
        const gMinY = Math.min(...gNodes.map(n => (n.y || 0) - NODE_H / 2)) - 30;
        const gMaxY = Math.max(...gNodes.map(n => (n.y || 0) + NODE_H / 2)) + 30;

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
      {routedRelations.map((relEntry, idx) => {
        const rel = relEntry as any;
        const fromNode = nodeMap.get(rel.from);
        const toNode = nodeMap.get(rel.to);
        if (!fromNode || !toNode) return null;

        const isHighlightedNode = highlightedNodeId === rel.from || highlightedNodeId === rel.to;
        const isFaded = activeNodeIds !== null && !activeNodeIds.includes(rel.from) && !activeNodeIds.includes(rel.to);
        const strokeColor = isHighlightedNode ? 'var(--ctp-blue)' : 'var(--ctp-surface2)';
        const strokeWidth = isHighlightedNode ? 2.5 : 1.5;
        const marker = isHighlightedNode
          ? `url(#flowchart-arrow-highlight-${viewInstanceId})`
          : `url(#flowchart-arrow-${viewInstanceId})`;

        let midX = 0, midY = 0;
        let isHandledBy = false;

        if (viewKey === 'STATE_MACHINE') {
          const fx = fromNode.x || 0;
          const fy = fromNode.y || 0;
          const tx = toNode.x || 0;
          const ty = toNode.y || 0;
          const dx = tx - fx;
          const dy = ty - fy;
          let cx1 = fx + dx * 0.25;
          let cy1 = fy + dy * 0.25;
          let cx2 = fx + dx * 0.75;
          let cy2 = fy + dy * 0.75;

          const curvature = 40;
          if (Math.abs(dx) > Math.abs(dy)) {
            cy1 -= curvature;
            cy2 -= curvature;
          } else {
            cx1 += curvature;
            cx2 += curvature;
          }

          midX = (fx + tx) / 2;
          midY = (fy + ty) / 2;
          if (Math.abs(dx) > Math.abs(dy)) {
            midY -= curvature * 0.75;
          } else {
            midX += curvature * 0.75;
          }
        } else {
          isHandledBy = !!rel.handledBy;
          if (isHandledBy) {
            midX = (fromNode.x || 0) + ((toNode.x || 0) - (fromNode.x || 0)) * 0.25;
            midY = (fromNode.y || 0) + ((toNode.y || 0) - (fromNode.y || 0)) * 0.25;
          } else {
            midX = ((fromNode.x || 0) + (toNode.x || 0)) / 2;
            midY = ((fromNode.y || 0) + (toNode.y || 0)) / 2;
          }
        }

        const edgeId = `edge-${rel.id}`;
        let labelText = rel.label;
        if (!labelText) {
          const fromType = schema.entities[rel.from]?.type || schema.entities[rel.from]?.viewTypes?.EVENT_STORMING || 'default';
          const toType = schema.entities[rel.to]?.type || schema.entities[rel.to]?.viewTypes?.EVENT_STORMING || 'default';
          if (fromType === 'COMMAND' && toType === 'EVENT') labelText = 'emits';
          if (fromType === 'EVENT' && toType === 'POLICY') labelText = 'triggers';
          if (fromType === 'POLICY' && toType === 'COMMAND') labelText = 'invokes';
        }

        return (
          <g key={edgeId} opacity={isFaded ? 0.1 : 0.8} style={{ transition: 'opacity 0.3s' }}>
            <path
              id={edgeId}
              d={rel.path}
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={rel.dashed ? '4 4' : 'none'}
              markerEnd={marker}
              className="flowchart-edge"
              data-testid={`flowchart-edge-${viewKey}-${idx}`}
            />
            {isHandledBy && viewKey !== 'SYS_ARCH' && (
              <g transform={`translate(${midX}, ${midY})`}>
                <rect x="-8" y="-8" width="16" height="16" rx="8" fill="var(--ctp-surface0)" stroke="var(--ctp-surface2)" />
                <text x="0" y="3" textAnchor="middle" fontSize="10" fill="var(--ctp-text)" fontFamily="var(--font-mono)">⚡</text>
              </g>
            )}
            {!isHandledBy && labelText && viewKey !== 'SYS_ARCH' && (
              <g transform={`translate(${midX}, ${midY})`}>
                <rect
                  x={-labelText.length * 3.5 - 6}
                  y="-10"
                  width={labelText.length * 7 + 12}
                  height="20"
                  rx="10"
                  fill="var(--ctp-base)"
                  stroke={isHighlightedNode ? 'var(--ctp-blue)' : 'var(--ctp-surface1)'}
                  strokeWidth="1"
                />
                <text
                  x="0"
                  y="3"
                  textAnchor="middle"
                  fill={isHighlightedNode ? 'var(--ctp-blue)' : 'var(--ctp-subtext0)'}
                  fontSize="10"
                  fontFamily="var(--font-mono)"
                  fontWeight={isHighlightedNode ? "600" : "500"}
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {labelText}
                </text>
              </g>
            )}
            {/* Animated particle dot */}
            <circle
              className="flowchart-edge-particle"
              r="4"
              fill={isHighlightedNode ? 'var(--ctp-blue)' : 'var(--ctp-yellow)'}
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
        const isHighlighted = isStepHighlighted || (highlightedNodeId === node.id);
        const isDimmed = activeNodeIds !== null && !isHighlighted;
        
        const nodeFill = entity.color || (COLORS as any)[viewType as keyof typeof COLORS] || COLORS.default;
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
            id={`node-${node.id}`}
            data-testid={`flowchart-node-${viewKey}-${node.id}`}
            className={`flowchart-node-group ${hasLinks ? 'has-links' : ''} ${isHighlighted ? 'active' : ''}`}
            transform={`translate(${x}, ${y})`}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              handleNodeClick(node.id, node.x, node.y);
            }}
            onMouseEnter={() => {
              if (entity.desc) {
                setTooltip({ description: entity.desc, x: node.x || 0, y: (node.y || 0) - nH / 2 });
              }
            }}
            onMouseLeave={() => setTooltip(null)}
            style={{
              opacity: isDimmed ? 0.25 : 1,
              transition: 'opacity 0.3s, filter 0.3s',
              cursor: (!isFullscreen || hasLinks) ? 'pointer' : 'default'
            }}
          >
            {isHighlighted && (
              <rect
                x="-20"
                y="-15"
                width={nW + 40}
                height={nH + 30}
                rx="14"
                fill="none"
                stroke="var(--ctp-blue)"
                strokeWidth="2"
                strokeDasharray="4 4"
                opacity="0.5"
                style={{ animation: 'flowchart-spin 10s linear infinite' }}
              />
            )}

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

            <foreignObject x={0} y={0} width={nW} height={nH}>
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
}
