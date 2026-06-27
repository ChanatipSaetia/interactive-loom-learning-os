import { useState, useMemo, memo } from 'react';
import * as Icons from 'lucide-react';
import { COLORS, BORDER_COLORS, ICONS, ICON_ANIMATIONS, NODE_W, NODE_H, wrapTooltipText } from '../types';
import type { UnifiedFlowchartSchema, FlowchartViewNode, FlowchartViewGroup } from '../types';

export interface SequenceViewProps {
  viewKey: string;
  viewInstanceId: string;
  schema: UnifiedFlowchartSchema;
  view: { nodes: FlowchartViewNode[]; groups?: FlowchartViewGroup[] };
  activeNodeIds: string[] | null;
  activeRelationIds: string[] | null;
  highlightedNodeId: string | null;
}

export const SequenceView = memo(function SequenceView({
  viewKey,
  viewInstanceId,
  schema,
  view,
  activeNodeIds,
  activeRelationIds,
  highlightedNodeId
}: SequenceViewProps) {
  const [tooltip, setTooltip] = useState<{ description: string; x: number; y: number } | null>(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  const [hoveredEdgeNodeIds, setHoveredEdgeNodeIds] = useState<string[] | null>(null);

  const seqRelations = useMemo(
    () => schema.relations.filter(r => r.views?.includes('SEQUENCE')),
    [schema.relations]
  );

  const seqColumns = useMemo(() => {
    if (!view) return [];
    const cols = new Map<number, string>();
    for (const node of view.nodes) {
      if (node.grid && !cols.has(node.grid[0])) {
        cols.set(node.grid[0], node.id);
      }
    }
    return Array.from(cols.entries()).sort((a, b) => a[0] - b[0]);
  }, [view]);

  const COL_W = 200;
  const START_X = 140;
  const TOP_Y = 12;
  const MSG_SPACING = 40;
  const MSG_START_Y = TOP_Y + NODE_H + 20;
  const BOTTOM_Y = MSG_START_Y + Math.max(0, seqRelations.length - 1) * MSG_SPACING + 60;

  return (
    <>
      {/* Sequence Groups / Condition Boundaries */}
      {view.groups && view.groups.map(group => {
        const isFaded = activeNodeIds !== null;
        const gCols = seqColumns.filter(([, nodeId]) => group.nodeIds?.includes(nodeId));
        if (gCols.length === 0) return null;

        const minCol = Math.min(...gCols.map(([c]) => c));
        const maxCol = Math.max(...gCols.map(([c]) => c));
        const xStart = minCol * COL_W + START_X - NODE_W / 2 - 20;
        const xEnd = maxCol * COL_W + START_X + NODE_W / 2 + 20;
        
        const yVal = group.y ?? (TOP_Y + NODE_H / 2);
        const hVal = group.h ?? (BOTTOM_Y - yVal + NODE_H / 2);

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
              rx="12"
              fill={group.color || 'color-mix(in srgb, var(--ctp-blue) 10%, transparent)'}
              stroke={group.borderColor || 'var(--ctp-blue)'}
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            <text
              x={xStart + 15}
              y={yVal + 22}
              fontSize="13"
              fontWeight="bold"
              fill={group.textColor || 'var(--ctp-text)'}
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
        const colX = colIdx * COL_W + START_X;
        const lifelineStart = TOP_Y + NODE_H;
        const lifelineEnd = BOTTOM_Y;
        return (
          <g key={`lifeline-${colIdx}`} data-testid={`flowchart-lifeline-${viewKey}-${colIdx}`}>
            <line
              x1={colX}
              y1={lifelineStart}
              x2={colX}
              y2={lifelineEnd}
              stroke="var(--ctp-surface2)"
              strokeWidth="1.5"
              strokeDasharray="6 6"
            />
          </g>
        );
      })}

      {/* Sequence message arrows */}
      {seqRelations.map((rel, idx) => {
        const fromColEntry = seqColumns.find(([, id]) => id === rel.from);
        const toColEntry = seqColumns.find(([, id]) => id === rel.to);
        if (!fromColEntry || !toColEntry) return null;
        const [fromCol] = fromColEntry;
        const [toCol] = toColEntry;
        const x1 = fromCol * COL_W + START_X;
        const x2 = toCol * COL_W + START_X;
        const y = MSG_START_Y + idx * MSG_SPACING;
        const midX = (x1 + x2) / 2;
        const isSelf = x1 === x2;
        const edgeId = `seq-edge-${rel.id}`;
        const isHoveredEdge = hoveredEdgeId === edgeId;
        const isHighlightedNode = highlightedNodeId === rel.from || highlightedNodeId === rel.to;
        const isRelationActive = activeRelationIds?.includes(rel.id) || false;
        const isEdgeActive = isHighlightedNode || isHoveredEdge || isRelationActive || !!(activeNodeIds?.includes(rel.from) || activeNodeIds?.includes(rel.to));

        const isEvent = rel.dashed;
        const strokeColor = isEvent ? 'var(--ctp-peach)' : 'var(--ctp-blue)';
        const strokeWidth = isEdgeActive ? 2.5 : 1.5;

        const marker = isEvent
          ? `url(#seq-arrow-evt-${viewInstanceId})`
          : `url(#seq-arrow-cmd-${viewInstanceId})`;

        let displayLabel = rel.label || '';
        const segmentLength = isSelf ? COL_W - 40 : Math.abs(x2 - x1);
        
        // Ensure the label pill doesn't exceed the segment length, with a large padding to keep it visually contained
        const maxAllowedChars = Math.max(5, Math.floor((segmentLength - 80) / 7));
        if (displayLabel && displayLabel.length > maxAllowedChars) {
          displayLabel = displayLabel.substring(0, maxAllowedChars - 3) + '...';
        }

        return (
          <g 
            key={edgeId} 
            opacity={(activeNodeIds !== null && !isEdgeActive) ? 0.2 : 0.9}
            style={{ transition: 'opacity 0.3s' }}
            onMouseEnter={() => {
              setHoveredEdgeId(edgeId);
              setHoveredEdgeNodeIds([rel.from, rel.to]);
              if (rel.label) {
                setTooltip({ description: rel.label, x: isSelf ? x1 + 40 : midX, y });
              }
            }}
            onMouseLeave={() => {
              setHoveredEdgeId(null);
              setHoveredEdgeNodeIds(null);
              setTooltip(null);
            }}
            data-testid={`flowchart-seq-msg-${viewKey}-${idx}`}
          >
            {isSelf ? (
              <>
                {/* Invisible wider hover path for self-loop */}
                <path
                  d={`M ${x1} ${y - 12} h 35 v 24 h -35`}
                  stroke="#000"
                  strokeOpacity="0"
                  strokeWidth="20"
                  fill="none"
                  style={{ cursor: 'pointer' }}
                />
                {/* Visible self-loop path */}
                <path
                  d={`M ${x1} ${y - 12} h 25 v 24 h -25`}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={isEvent ? '4 4' : '8 8'}
                  fill="none"
                  className="flowchart-edge flowchart-edge-animated"
                  style={{
                    pointerEvents: 'none',
                    filter: isEdgeActive ? `drop-shadow(0 0 6px ${strokeColor})` : undefined
                  }}
                  markerEnd={marker}
                />
              </>
            ) : (
              <>
                {/* Invisible wider hover path */}
                <line
                  x1={x1}
                  y1={y}
                  x2={x2}
                  y2={y}
                  stroke="#000"
                  strokeOpacity="0"
                  strokeWidth="25"
                  style={{ cursor: 'pointer' }}
                />
                {/* Visible animated dash line */}
                <line
                  x1={x1}
                  y1={y}
                  x2={x2}
                  y2={y}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={isEvent ? '4 4' : '8 8'}
                  className="flowchart-edge flowchart-edge-animated"
                  style={{
                    pointerEvents: 'none',
                    filter: isEdgeActive ? `drop-shadow(0 0 6px ${strokeColor})` : undefined
                  }}
                  markerEnd={marker}
                />
              </>
            )}
            {displayLabel && (
              <g transform={`translate(${isSelf ? x1 + 30 + (displayLabel.length * 3.5) : midX}, ${y})`} style={{ pointerEvents: 'none' }}>
                <rect
                  x={-displayLabel.length * 3.5 - 6}
                  y="-10"
                  width={displayLabel.length * 7 + 12}
                  height="20"
                  rx="10"
                  fill="var(--ctp-base)"
                  stroke={isEdgeActive ? 'var(--ctp-blue)' : 'var(--ctp-surface1)'}
                  strokeWidth="1"
                />
                <text
                  x="0"
                  y="3"
                  textAnchor="middle"
                  fill={isEdgeActive ? 'var(--ctp-blue)' : 'var(--ctp-subtext0)'}
                  fontSize="10"
                  fontFamily="var(--font-mono)"
                  fontWeight={isEdgeActive ? "600" : "500"}
                >
                  {displayLabel}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* Sequence activation bars */}
      {activeNodeIds && activeNodeIds.map(nodeId => {
        const colEntry = seqColumns.find(([, id]) => id === nodeId);
        if (!colEntry) return null;
        const [colIdx] = colEntry;
        const colX = colIdx * COL_W + START_X;
        const lifelineStart = TOP_Y + NODE_H + 8;
        return (
          <rect
            key={`seq-activation-${nodeId}`}
            data-testid={`flowchart-seq-activation-${viewKey}-${nodeId}`}
            x={colX - 5}
            y={lifelineStart}
            width={10}
            height={BOTTOM_Y - lifelineStart - 8}
            rx="3"
            fill="color-mix(in srgb, var(--ctp-blue) 12%, transparent)"
            stroke="var(--ctp-blue)"
            strokeWidth="1"
          />
        );
      })}

      {/* Sequence Participants (Rendered last so they are on top) */}
      {seqColumns.map(([colIdx, nodeId]) => {
        const entity = schema.entities[nodeId];
        if (!entity) return null;

        const viewType = entity.viewTypes?.[viewKey] || entity.type || 'default';
        const nodeFill = entity.color || (COLORS as any)[viewType as keyof typeof COLORS] || COLORS.default;
        const strokeColor = entity.strokeColor || BORDER_COLORS[viewType as keyof typeof BORDER_COLORS] || BORDER_COLORS.default;
        
        const iconName = ICONS[viewType as keyof typeof ICONS];
        const animClass = ICON_ANIMATIONS[viewType as keyof typeof ICON_ANIMATIONS] || '';
        const IconComponent = iconName && (iconName in Icons)
          ? (Icons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string; color?: string }>>)[iconName]
          : null;

        const isHoveredNode = hoveredEdgeNodeIds && hoveredEdgeNodeIds.includes(nodeId);
        const isHighlighted = (activeNodeIds && activeNodeIds.includes(nodeId)) || isHoveredNode || (highlightedNodeId === nodeId);
        const isDimmed = activeNodeIds !== null && !isHighlighted && hoveredEdgeId === null;

        const colX = colIdx * COL_W + START_X;
        const x = colX - NODE_W / 2;

        return (
          <g key={`seq-col-${nodeId}`} className="flowchart-seq-participant">
            {/* Top Node */}
            <g
              transform={`translate(${x}, ${TOP_Y})`}
              onMouseEnter={() => {
                if (entity.desc) {
                  setTooltip({ description: entity.desc, x: colX, y: TOP_Y - 10 });
                }
              }}
              onMouseLeave={() => setTooltip(null)}
              style={{
                opacity: isDimmed ? 0.25 : 1,
                transition: 'opacity 0.3s, filter 0.3s',
              }}
            >
              <rect
                x={0} y={0}
                width={NODE_W} height={NODE_H}
                rx="8"
                fill={nodeFill}
                stroke={isHighlighted ? 'var(--ctp-blue)' : strokeColor}
                strokeWidth={isHighlighted ? "2.5" : "1.5"}
                className={`flowchart-node-rect ${isHighlighted ? 'flowchart-node-highlighted' : ''}`}
              />
              <foreignObject x={0} y={0} width={NODE_W} height={NODE_H}>
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
                      {entity.viewTitles?.SEQUENCE ?? entity.title}
                    </p>
                  </div>
                </div>
              </foreignObject>
            </g>

            {/* Bottom Node */}
            <g
              transform={`translate(${x}, ${BOTTOM_Y})`}
              style={{
                opacity: isDimmed ? 0.25 : 1,
                transition: 'opacity 0.3s, filter 0.3s',
              }}
            >
              <rect
                x={0} y={0}
                width={NODE_W} height={NODE_H}
                rx="8"
                fill={nodeFill}
                stroke={isHighlighted ? 'var(--ctp-blue)' : strokeColor}
                strokeWidth={isHighlighted ? "2.5" : "1.5"}
                className={`flowchart-node-rect ${isHighlighted ? 'flowchart-node-highlighted' : ''}`}
              />
              <foreignObject x={0} y={0} width={NODE_W} height={NODE_H}>
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
                      {entity.viewTitles?.SEQUENCE ?? entity.title}
                    </p>
                  </div>
                </div>
              </foreignObject>
            </g>
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
