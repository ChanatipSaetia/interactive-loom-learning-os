/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo, memo } from 'react';
import React from 'react';
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
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
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
  const MSG_SPACING = 44;
  const MSG_START_Y = 160;
  const lastRelY = seqRelations.length > 0
    ? MSG_START_Y + (seqRelations.length - 1) * MSG_SPACING + (seqRelations[seqRelations.length - 1].yOffset ?? 0)
    : MSG_START_Y;
  const BOTTOM_Y = lastRelY + 60;

  return (
    <>
      {/* Sequence Groups / Condition Boundaries */}
      {view.groups && view.groups.map(group => {
        const isFaded = activeNodeIds !== null;
        const yVal = group.y ?? (TOP_Y + NODE_H / 2);
        const hVal = group.h ?? (BOTTOM_Y - yVal + NODE_H / 2);

        // Calculate horizontal bounds directly from the sequence message lines inside this group
        // Use exact seqIndex range if available; fall back to Y-range for non-sequence groups
        const groupRels = (group.seqIndexMin !== undefined && group.seqIndexMax !== undefined)
          ? seqRelations.filter(rel =>
              (rel.seqIndex ?? -1) >= group.seqIndexMin! &&
              (rel.seqIndex ?? -1) <= group.seqIndexMax!
            )
          : seqRelations.filter((rel, idx) => {
              const rY = MSG_START_Y + idx * MSG_SPACING + (rel.yOffset || 0);
              return rY >= yVal - 10 && rY <= yVal + hVal + 10;
            });

        let xMin = Infinity;
        let xMax = -Infinity;

        if (groupRels.length > 0) {
          groupRels.forEach(rel => {
            const fromColPair = seqColumns.find(([, id]) => id === rel.from);
            const toColPair = seqColumns.find(([, id]) => id === rel.to);
            const cFrom = fromColPair ? fromColPair[0] : 0;
            const cTo = toColPair ? toColPair[0] : 0;

            const xFrom = cFrom * COL_W + START_X;
            const xTo = cTo * COL_W + START_X;

            if (rel.from === rel.to) {
              xMin = Math.min(xMin, xFrom - 15);
              xMax = Math.max(xMax, xFrom + 85);
            } else {
              xMin = Math.min(xMin, Math.min(xFrom, xTo));
              xMax = Math.max(xMax, Math.max(xFrom, xTo));
            }
          });
        }

        if (!isFinite(xMin) || !isFinite(xMax)) {
          xMin = START_X;
          xMax = START_X + COL_W;
        }

        const xStart = xMin - 16;
        const xEnd = xMax + 16;

        return (
          <g 
            key={group.id} 
            className="flowchart-seq-group" 
            opacity={isFaded ? 0.55 : 0.85} 
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
        const y = MSG_START_Y + idx * MSG_SPACING + (rel.yOffset || 0);
        const midX = (x1 + x2) / 2;
        const isSelf = x1 === x2;
        const edgeId = `seq-edge-${rel.id}`;
        const isHoveredEdge = hoveredEdgeId === edgeId;
        const isSelectedEdge = selectedEdgeId === edgeId;
        const isExpanded = isHoveredEdge || isSelectedEdge || activeRelationIds?.includes(rel.id);
        const isHighlightedNode = highlightedNodeId === rel.from || highlightedNodeId === rel.to;
        const isRelationActive = activeRelationIds?.includes(rel.id) || false;
        const isEdgeActive = isHighlightedNode || isExpanded || isRelationActive;

        const isEvent = rel.dashed;
        const opacityVal = isExpanded ? 1.0 : ((activeNodeIds !== null && !isEdgeActive) ? 0.70 : 0.9);
        const strokeColor = isEvent ? 'var(--ctp-peach)' : 'var(--ctp-blue)';
        const strokeWidth = isEdgeActive ? 2.5 : 1.5;

        const marker = isEvent
          ? `url(#seq-arrow-evt-${viewInstanceId})`
          : `url(#seq-arrow-cmd-${viewInstanceId})`;

        let displayLabel = rel.label || '';
        const segmentLength = isSelf ? COL_W - 40 : Math.abs(x2 - x1);
        
        // Ensure the label pill doesn't exceed the segment length unless expanded
        if (!isExpanded && displayLabel) {
          const maxAllowedChars = Math.max(5, Math.floor((segmentLength - 80) / 7));
          if (displayLabel.length > maxAllowedChars) {
            displayLabel = displayLabel.substring(0, Math.max(2, maxAllowedChars - 3)) + '...';
          }
        }

        const toggleSeqEdge = (e: React.SyntheticEvent) => {
          e.stopPropagation();
          if (selectedEdgeId === edgeId) {
            setSelectedEdgeId(null);
            setHoveredEdgeNodeIds(null);
            setTooltip(null);
          } else {
            setSelectedEdgeId(edgeId);
            setHoveredEdgeNodeIds([rel.from, rel.to]);
            if (rel.label) {
              setTooltip({ description: rel.label, x: isSelf ? x1 + 40 : midX, y });
            }
          }
        };

        return (
          <g 
            key={edgeId} 
            className="flowchart-edge-group"
            opacity={opacityVal} 
            style={{ transition: 'opacity 0.3s' }}
            onMouseEnter={() => {
              setHoveredEdgeId(edgeId);
              setHoveredEdgeNodeIds([rel.from, rel.to]);
              if (!selectedEdgeId && rel.label) {
                setTooltip({ description: rel.label, x: isSelf ? x1 + 40 : midX, y });
              }
            }}
            onMouseLeave={() => {
              setHoveredEdgeId(null);
              if (!selectedEdgeId) {
                setHoveredEdgeNodeIds(null);
                setTooltip(null);
              }
            }}
            onClick={toggleSeqEdge}
            onTouchEnd={toggleSeqEdge}
            data-testid={`flowchart-seq-msg-${viewKey}-${idx}`}
          >
            {isSelf ? (
              <>
                {/* Invisible wider hit path for self-loop */}
                <path
                  d={`M ${x1} ${y - 12} h 35 v 24 h -35`}
                  stroke="transparent"
                  strokeWidth="20"
                  fill="none"
                  style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
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
                {/* Invisible wider hit path */}
                <line
                  x1={x1}
                  y1={y}
                  x2={x2}
                  y2={y}
                  stroke="transparent"
                  strokeWidth="25"
                  style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
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
              <g 
                transform={`translate(${isSelf ? x1 + 30 + (displayLabel.length * 3.5) : midX}, ${y})`} 
                style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                onClick={toggleSeqEdge}
                onTouchEnd={toggleSeqEdge}
              >
                <rect
                  x={-displayLabel.length * 3.5 - 6}
                  y="-10"
                  width={displayLabel.length * 7 + 12}
                  height="20"
                  rx="10"
                  fill="var(--ctp-base)"
                  stroke={isEdgeActive ? 'var(--secondary)' : 'var(--ctp-surface1)'}
                  strokeWidth="1"
                />
                <text
                  x="0"
                  y="3"
                  textAnchor="middle"
                  fill={isEdgeActive ? 'var(--secondary)' : 'var(--ctp-subtext0)'}
                  fontSize="10"
                  fontFamily="var(--font-mono)"
                  fontWeight={isEdgeActive ? "600" : "500"}
                  data-testid={`flowchart-seq-msg-label-${viewKey}-${idx}`}
                >
                  {displayLabel}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* Sequence Participants (Rendered on top) */}
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
        const isHighlighted = isHoveredNode || (highlightedNodeId === nodeId);

        const colX = colIdx * COL_W + START_X;
        const x = colX - NODE_W / 2;

        return (
          <g key={`seq-col-${nodeId}`} className="flowchart-seq-participant">
            {/* Top Node */}
            <g
              transform={`translate(${x}, ${TOP_Y})`}
              data-testid={`flowchart-seq-top-${viewKey}-${nodeId}`}
              onMouseEnter={() => {
                if (entity.desc) {
                  setTooltip({ description: entity.desc, x: colX, y: TOP_Y - 10 });
                }
              }}
              onMouseLeave={() => setTooltip(null)}
              style={{
                opacity: 1,
                transition: 'opacity 0.3s, filter 0.3s',
              }}
            >
              <rect
                x={0} y={0}
                width={NODE_W} height={NODE_H}
                rx="8"
                fill={nodeFill}
                stroke={isHighlighted ? 'var(--secondary)' : strokeColor}
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
              data-testid={`flowchart-seq-bottom-${viewKey}-${nodeId}`}
              style={{
                opacity: 1,
                transition: 'opacity 0.3s, filter 0.3s',
              }}
            >
              <rect
                x={0} y={0}
                width={NODE_W} height={NODE_H}
                rx="8"
                fill={nodeFill}
                stroke={isHighlighted ? 'var(--secondary)' : strokeColor}
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
