import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import * as Icons from 'lucide-react';

import { ZoomToolbar } from './zoom-toolbar';
import { PlaybackControls } from './playback-controls';
import { StepCarousel } from './step-carousel';
import { useCamera } from './useCamera';
import { usePlayback } from './usePlayback';

import {
  TYPES,
  COLORS,
  BORDER_COLORS,
  ICONS,
  ICON_ANIMATIONS,
  DYNAMIC_ICONS,
  NODE_W,
  NODE_H,
  wrapTooltipText
} from './types';
import { INITIAL_SCHEMA } from './initial-schema';

import type {
  UnifiedFlowchartSchema,
  FlowchartRelation,
  FlowchartViewNode,
  FlowchartViewGroup,
  FlowchartStep,
  FlowchartStepData,
  FlowchartStepLinear,
  FlowchartStepBranchOption,
  FlowchartJourney,
  FlowchartViewConfig,
  FlowchartProps
} from './types';

import './flowchart.css';

const Workflow = Icons.Workflow;

export { TYPES, COLORS, BORDER_COLORS, ICONS, ICON_ANIMATIONS, DYNAMIC_ICONS, NODE_W, NODE_H, INITIAL_SCHEMA };
export type { UnifiedFlowchartSchema, FlowchartRelation, FlowchartViewNode, FlowchartViewGroup, FlowchartStep, FlowchartStepData, FlowchartStepLinear, FlowchartStepBranchOption, FlowchartJourney, FlowchartViewConfig, FlowchartProps };

export function Flowchart({ title, schema = INITIAL_SCHEMA }: FlowchartProps) {
  const rawId = useId();
  const instanceId = useMemo(() => rawId.replace(/:/g, ''), [rawId]);

  const [localSchema, setLocalSchema] = useState<UnifiedFlowchartSchema>(schema);

  useEffect(() => {
    setLocalSchema(schema);
  }, [schema]);

  const viewKeys = useMemo(() => Object.keys(localSchema.views), [localSchema]);
  const [activeViewKey, setActiveViewKey] = useState<string>(viewKeys[0] || 'EVENT_STORMING');

  useEffect(() => {
    if (viewKeys.length > 0 && !viewKeys.includes(activeViewKey)) {
      setActiveViewKey(viewKeys[0]);
    }
  }, [viewKeys, activeViewKey]);

  const activeView = useMemo(() => {
    return localSchema.views[activeViewKey] || { name: 'Empty', icon: 'Workflow', nodes: [], groups: [] };
  }, [localSchema.views, activeViewKey]);

  const [activeStep, setActiveStep] = useState<FlowchartStepData | FlowchartStepBranchOption | null>(null);

  // Node mappings with runtime grid resolution
  const positioned = useMemo(() => {
    return activeView.nodes.map(node => {
      if (typeof node.x === 'number' && typeof node.y === 'number') {
        return { ...node, x: node.x, y: node.y };
      }
      if (node.grid) {
        const [c, r] = node.grid;
        let x = 0;
        let y = 0;
        if (activeViewKey === 'EVENT_STORMING') {
          x = c * 140 + 60;
          if (r === 0) y = 50;
          else if (r === 1) y = 150;
          else if (r === 2) y = 250;
          else if (r === 3) y = 450;
          else if (r === 4) y = 650;
          else y = 250 + (r - 2) * 200;
        } else if (activeViewKey === 'SYS_ARCH') {
          x = c * 140 + 80;
          y = r * 100 + 100;
        } else if (activeViewKey === 'DATA_FLOW') {
          x = c * 140 + 100;
          y = r * 100 + 100;
        } else if (activeViewKey === 'SWIMLANES') {
          x = c * 140 + 160;
          if (r === 0) y = 75;
          else if (r === 1) y = 270;
          else if (r === 2) y = 460;
          else if (r === 3) y = 650;
          else y = 75 + r * 190;
        } else {
          x = c * 140 + 100;
          y = r * 100 + 100;
        }
        return { ...node, x, y };
      }
      return { ...node, x: 0, y: 0 };
    });
  }, [activeView.nodes, activeViewKey]);

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

  // Camera hook
  const camera = useCamera({ positionedNodesRef });

  // Playback hook
  const playback = usePlayback({
    schema: localSchema,
    activeViewKey,
    nodeMap,
    onNodeFocus: camera.focusOnNodes
  });

  // Sync active step with current playback step
  const activeSteps = useMemo(() => {
    if (activeView.steps && activeView.steps.length > 0) {
      return activeView.steps;
    }
    if (playback.currentJourney && playback.currentJourney.steps.length > 0) {
      return playback.currentJourney.steps.map((step, idx) => {
        const ids = step.nodeIds || (step.nodeId ? [step.nodeId] : []);
        const primaryNode = ids[0] || step.nodeId || '';
        return {
          id: `journey-step-${idx}`,
          type: 'linear' as const,
          nodeIds: ids,
          title: localSchema.entities[primaryNode]?.title || `Step ${idx + 1}`,
          reason: step.description
        };
      });
    }
    return [];
  }, [activeView.steps, playback.currentJourney, localSchema.entities]);

  useEffect(() => {
    if (playback.currentStep === -1) {
      setActiveStep(null);
    } else {
      setActiveStep(activeSteps[playback.currentStep] ?? null);
    }
  }, [playback.currentStep, activeSteps]);

  // Scroll carousel to keep active step visible
  useEffect(() => {
    if (activeStep) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`step-card-${instanceId}-${activeStep.id}`);
        if (el && typeof el.scrollIntoView === 'function') {
          el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [activeStep, instanceId]);

  // Attach/detach native event listeners on the SVG element
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
  }, [camera.onWheelNative, camera.onSvgTouchStartNative, camera.onTouchMoveNative, camera.svgRef]);

  const pendingFocusNodeIdRef = useRef<string | null>(null);

  // View reset on switch
  useEffect(() => {
    playback.resetAll();
    setActiveStep(null);

    const raf = requestAnimationFrame(() => {
      if (!camera.svgRef.current) return;
      const nodes = positionedNodesRef.current;
      if (nodes.length === 0) return;

      const pendingNodeId = pendingFocusNodeIdRef.current;
      if (pendingNodeId) {
        pendingFocusNodeIdRef.current = null;
        const targetNode = nodes.find(n => n.id === pendingNodeId);
        if (targetNode) {
          const W = camera.svgRef.current!.clientWidth || 800;
          const H = camera.svgRef.current!.clientHeight || 500;
          const targetScale = 0.8;
          camera.animateTo(
            W / 2 - targetNode.x * targetScale,
            (H / 2 - 50) - targetNode.y * targetScale,
            targetScale
          );
          return;
        }
      }

      const xs = nodes.map(n => n.x);
      const ys = nodes.map(n => n.y);
      const nx = (Math.min(...xs) + Math.max(...xs)) / 2;
      const ny = (Math.min(...ys) + Math.max(...ys)) / 2;
      const W = camera.svgRef.current!.clientWidth || 800;
      const H = camera.svgRef.current!.clientHeight || 500;
      camera.animateTo(W / 2 - nx * 0.45, H / 2 - ny * 0.45, 0.45);
    });

    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally fires only on view switch; camera/playback methods are stable via useCallback
  }, [activeViewKey]);

  // Dropdown close events
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

  // Hover Tooltip state
  const [tooltip, setTooltip] = useState<{ description: string; x: number; y: number } | null>(null);

  // Click Popover state
  const [activeNodePopup, setActiveNodePopup] = useState<{
    nodeId: string;
    x: number;
    y: number;
    views: { key: string; name: string; type: string }[];
  } | null>(null);

  const handleNodeClick = useCallback((nodeId: string) => {
    if (activeNodePopup?.nodeId === nodeId) {
      setActiveNodePopup(null);
      return;
    }

    const entity = localSchema.entities[nodeId];
    if (!entity) return;

    const otherViews = Object.keys(entity.viewTypes).filter(vk => vk !== activeViewKey && localSchema.views[vk]);

    if (otherViews.length > 0) {
      const node = nodeMap[nodeId];
      if (node) {
        setActiveNodePopup({
          nodeId,
          x: node.x,
          y: node.y,
          views: otherViews.map(vk => ({
            key: vk,
            name: localSchema.views[vk]?.name || vk,
            type: entity.viewTypes[vk] || 'default'
          }))
        });
      }
    } else {
      setActiveNodePopup(null);
    }
  }, [activeViewKey, localSchema.entities, localSchema.views, nodeMap, activeNodePopup]);

  const handleStepClick = (step: FlowchartStepLinear | FlowchartStepBranchOption) => {
    if (activeStep?.id === step.id) {
      setActiveStep(null);
      playback.resetAll();
      camera.resetTransform();
    } else {
      setActiveStep(step);
      camera.focusOnNodes(step.nodeIds || []);
      const stepIdx = activeSteps.findIndex(s => s.id === step.id);
      if (stepIdx !== -1) {
        // Manual step navigation via carousel
      }
    }
  };

  const transformStr = `translate(${camera.transform.translateX}, ${camera.transform.translateY}) scale(${camera.transform.scale})`;

  return (
    <div className="flowchart-section" data-testid="flowchart-section">
      <div className="flowchart-header-container">
        {title && <h3 className="flowchart-title" data-testid="flowchart-title">{title}</h3>}

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {viewKeys.length > 1 && (
            <div className="flowchart-view-tabs" data-testid="flowchart-view-tabs">
              {viewKeys.map(vk => {
                const view = localSchema.views[vk];
                const Icon = (view.icon in DYNAMIC_ICONS) ? DYNAMIC_ICONS[view.icon as keyof typeof DYNAMIC_ICONS] : Workflow;
                return (
                  <button
                    key={vk}
                    onClick={() => setActiveViewKey(vk)}
                    className={`flowchart-view-tab-btn ${activeViewKey === vk ? 'active' : ''}`}
                  >
                    <Icon size={14} />
                    <span>{view.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {localSchema.journeys.length > 0 && (
        <div className="flowchart-journey-bar" data-testid="flowchart-journey-bar">
          <div className="flowchart-journey-selector">
            <span className="flowchart-journey-label">Story / Journey:</span>
            <select
              id="flowchart-journey-select"
              className="flowchart-journey-select"
              value={playback.currentJourneyId}
              onChange={(e) => {
                playback.setCurrentJourneyId(e.target.value);
                setActiveStep(null);
              }}
              data-testid="flowchart-journey-select"
            >
              {localSchema.journeys.map(j => (
                <option key={j.id} value={j.id}>
                  {j.label}
                </option>
              ))}
            </select>
          </div>
          {playback.currentJourney?.description && (
            <div className="flowchart-journey-description" data-testid="flowchart-journey-description">
              {playback.currentJourney.description}
            </div>
          )}
        </div>
      )}

      {playback.currentJourney && (
        <PlaybackControls
          currentJourney={playback.currentJourney}
          currentStep={playback.currentStep}
          isPlaying={playback.isPlaying}
          handlePlay={playback.handlePlay}
          handlePause={playback.handlePause}
          handleNext={playback.handleNext}
          handlePrev={playback.handlePrev}
          handleReset={playback.handleReset}
        />
      )}

      <div className="flowchart-canvas-wrapper" style={{ position: 'relative' }}>
        <div className="flowchart-body">
          <ZoomToolbar
            handleZoomIn={camera.handleZoomIn}
            handleZoomOut={camera.handleZoomOut}
            handleFitToScreen={() => camera.fitToScreen(minX, maxX, minY, maxY)}
          />

          {activeStep && (
            <button
              onClick={() => {
                setActiveStep(null);
                playback.resetAll();
                camera.resetTransform();
              }}
              className="flowchart-btn animate-fade-in"
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                zIndex: 10,
                padding: '6px 16px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 'bold',
                backgroundColor: 'var(--ctp-crust)',
                color: 'var(--ctp-text)',
                border: '1px solid var(--border-light)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              Clear Focus &times;
            </button>
          )}

          <svg
            ref={camera.svgRef}
            className="flowchart-svg"
            data-testid="flowchart-svg"
            width="100%"
            height="100%"
            onMouseMove={(e) => camera.handlePointerMove(e.clientX, e.clientY)}
            onMouseUp={camera.handlePointerUp}
            onMouseLeave={camera.handlePointerUp}
            onMouseDown={camera.onSvgMouseDown}
            onTouchEnd={camera.handlePointerUp}
          >
            <defs>
              <filter id={`flowchart-desc-shadow-${instanceId}`} x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="3" stdDeviation="6" floodColor="#ca9ee6" floodOpacity="0.25" />
              </filter>
              <filter id={`flowchart-tooltip-shadow-${instanceId}`} x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000000" floodOpacity="0.4" />
              </filter>
              <filter id={`flowchart-glow-${instanceId}`} x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#8caaee" floodOpacity="0.6" />
              </filter>
              <marker id={`flowchart-arrow-${instanceId}`} markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                <path d="M 0 0 L 7 3 L 0 6 Z" fill="#626880" />
              </marker>
              <marker id={`flowchart-arrow-highlight-${instanceId}`} markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                <path d="M 0 0 L 7 3 L 0 6 Z" fill="#8caaee" />
              </marker>
              <pattern
                id={`dotGrid-${instanceId}`}
                width={20 * camera.transform.scale}
                height={20 * camera.transform.scale}
                patternUnits="userSpaceOnUse"
                patternTransform={`translate(${camera.transform.translateX % (20 * camera.transform.scale)}, ${camera.transform.translateY % (20 * camera.transform.scale)})`}
              >
                <circle cx="2" cy="2" r={1 * camera.transform.scale} fill="#51576d" opacity="0.6" />
              </pattern>
            </defs>

            <rect width="100%" height="100%" fill={`url(#dotGrid-${instanceId})`} style={{ pointerEvents: 'none' }} />

            <g transform={transformStr} data-testid="flowchart-canvas">

              {activeView.groups && activeView.groups.map(group => {
                const isFaded = playback.activeNodeIds !== null;
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

              {localSchema.relations
                .filter(r => r.views.includes(activeViewKey))
                .map((rel, idx) => {
                  const fromNode = nodeMap[rel.from];
                  const toNode = nodeMap[rel.to];
                  if (!fromNode || !toNode) return null;

                  const entityFrom = localSchema.entities[rel.from];
                  const entityTo = localSchema.entities[rel.to];
                  if (!entityFrom || !entityTo) return null;

                  const fromW = NODE_W;
                  const fromH = NODE_H;
                  const toW = NODE_W;
                  const toH = NODE_H;

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
                    startX = x1 + (dx > 0 ? fromW / 2 : -fromW / 2);
                    endX = x2 + (dx > 0 ? -toW / 2 : toW / 2);
                  } else {
                    startY = y1 + (dy > 0 ? fromH / 2 : -fromH / 2);
                    endY = y2 + (dy > 0 ? -toH / 2 : toH / 2);
                  }

                  const dist = Math.hypot(endX - startX, endY - startY);
                  const cp1x = startX + (dx > 0 ? Math.min(100, dist * 0.4) : -Math.min(100, dist * 0.4));
                  const cp1y = startY;
                  const cp2x = endX + (dx > 0 ? -Math.min(100, dist * 0.4) : Math.min(100, dist * 0.4));
                  const cp2y = endY;

                  const isHighlighted = playback.activeNodeIds && playback.activeNodeIds.includes(rel.from) && playback.activeNodeIds.includes(rel.to);
                  const isFaded = playback.activeNodeIds !== null && !isHighlighted;
                  const isHandledBy = rel.handledBy;
                  const midX = (startX + endX) / 2;
                  const midY = (startY + endY) / 2;
                  const isVertical = fromNode.x === toNode.x;

                  const pathD = isHandledBy && isVertical
                    ? `M ${startX} ${startY} L ${endX} ${endY}`
                    : `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;

                  return (
                    <g key={rel.id} data-testid={`flowchart-edge-${idx}`} style={{ transition: 'opacity 0.3s', opacity: isFaded ? 0.1 : 0.8 }}>
                      <path
                        d={pathD}
                        stroke="#626880"
                        strokeWidth="1.5"
                        fill="none"
                        strokeOpacity="0.3"
                        markerEnd={isHandledBy ? '' : `url(#flowchart-arrow-${instanceId})`}
                      />
                      <path
                        d={pathD}
                        stroke={isHighlighted ? '#8caaee' : (isHandledBy ? '#a6d189' : (rel.dashed ? '#e5c890' : '#8caaee'))}
                        strokeWidth={isHighlighted ? '2.5' : (isHandledBy ? '2' : '1.5')}
                        fill="none"
                        strokeOpacity={isHighlighted ? '0.95' : (isHandledBy ? '0.8' : '0.55')}
                        strokeDasharray={isHandledBy ? 'none' : (rel.dashed ? '4 4' : '6 7')}
                        markerEnd={isHandledBy ? `url(#flowchart-arrow-${instanceId})` : (isHighlighted ? `url(#flowchart-arrow-highlight-${instanceId})` : `url(#flowchart-arrow-${instanceId})`)}
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

              {playback.currentJourney && playback.particleRef && (
                <circle
                  ref={playback.particleRef}
                  r="6"
                  fill="#8caaee"
                  opacity="0"
                  className="flowchart-particle"
                  data-testid="flowchart-particle"
                />
              )}

              {positioned.map(node => {
                const entity = localSchema.entities[node.id];
                if (!entity) return null;

                const viewType = entity.viewTypes[activeViewKey] || 'default';
                const nW = NODE_W;
                const nH = NODE_H;
                const x = node.x - nW / 2;
                const y = node.y - nH / 2;
                const isStepHighlighted = playback.activeNodeIds && playback.activeNodeIds.includes(node.id);
                const isDimmed = playback.activeNodeIds !== null && !isStepHighlighted;
                const isHighlighted = isStepHighlighted || (playback.highlightedNodeId === node.id);
                const nodeFill = COLORS[viewType as keyof typeof COLORS] || COLORS.default;
                const strokeColor = BORDER_COLORS[viewType as keyof typeof BORDER_COLORS] || BORDER_COLORS.default;
                const iconName = ICONS[viewType as keyof typeof ICONS];
                const animClass = ICON_ANIMATIONS[viewType as keyof typeof ICON_ANIMATIONS] || '';
                const IconComponent = iconName && (iconName in Icons) ? (Icons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string; color?: string }>>)[iconName] : null;
                const hasLinks = entity && Object.keys(entity.viewTypes).filter(vk => vk !== activeViewKey && localSchema.views[vk]).length > 0;

                return (
                  <g
                    key={node.id}
                    data-testid={`flowchart-node-${node.id}`}
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
                      filter={isHighlighted ? `url(#flowchart-glow-${instanceId})` : undefined}
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
                            {entity.viewTitles?.[activeViewKey] ?? entity.title}
                          </p>
                        </div>
                      </div>
                    </foreignObject>

                    <text x={x} y={y} display="none">{entity.viewTitles?.[activeViewKey] ?? entity.title}</text>
                    <text x={x} y={y} display="none">&lt;&lt;{viewType}&gt;&gt;</text>
                  </g>
                );
              })}

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
                      filter={`url(#flowchart-tooltip-shadow-${instanceId})`}
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

            </g>
          </svg>

          <StepCarousel
            activeSteps={activeSteps}
            activeStep={activeStep}
            handleStepClick={handleStepClick}
            instanceId={instanceId}
          />

          {activeNodePopup && (
            <div
              style={{
                position: 'absolute',
                left: `${camera.transform.translateX + activeNodePopup.x * camera.transform.scale}px`,
                top: `${camera.transform.translateY + activeNodePopup.y * camera.transform.scale + 30}px`,
                transform: 'translateX(-50%)',
                zIndex: 40,
                background: 'var(--ctp-crust)',
                border: '1px solid var(--ctp-blue)',
                borderRadius: '8px',
                padding: '8px 12px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                minWidth: '150px',
                pointerEvents: 'auto'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                <span style={{ fontSize: '9px', fontWeight: 'bold', color: 'var(--ctp-overlay1)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Related Views
                </span>
                <button
                  onClick={() => setActiveNodePopup(null)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--ctp-overlay1)',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <Icons.X size={10} />
                </button>
              </div>
              {activeNodePopup.views.map(v => (
                <button
                  key={v.key}
                  onClick={() => {
                    pendingFocusNodeIdRef.current = activeNodePopup.nodeId;
                    setActiveViewKey(v.key);
                    setActiveNodePopup(null);
                  }}
                  style={{
                    background: 'var(--ctp-surface0)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '4px',
                    color: 'var(--ctp-text)',
                    padding: '6px 10px',
                    fontSize: '11px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                  className="flowchart-popup-btn"
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontWeight: '500' }}>{v.name}</span>
                    <span style={{ fontSize: '9px', color: 'var(--ctp-overlay1)' }}>as {v.type}</span>
                  </div>
                  <span style={{ color: 'var(--ctp-blue)', fontSize: '12px' }}>&rarr;</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Flowchart;
