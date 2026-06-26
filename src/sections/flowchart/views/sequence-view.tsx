import { useMemo } from 'react';
import { COLORS, BORDER_COLORS } from '../types';
import type { UnifiedFlowchartSchema, FlowchartViewNode, FlowchartViewGroup } from '../types';

export interface SequenceViewProps {
  viewKey: string;
  viewInstanceId: string;
  schema: UnifiedFlowchartSchema;
  view: { nodes: FlowchartViewNode[]; groups?: FlowchartViewGroup[] };
  activeNodeIds: string[] | null;
}

export function SequenceView({
  viewKey,
  viewInstanceId,
  schema,
  view,
  activeNodeIds
}: SequenceViewProps) {
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

  return (
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
  );
}
