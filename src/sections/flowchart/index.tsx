import React, { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import { animate } from 'animejs';
import { SectionRegistry } from '../../core/registry';
import * as Icons from 'lucide-react';

import { ZoomToolbar } from './zoom-toolbar';
import { PlaybackControls } from './playback-controls';
import { StepCarousel } from './step-carousel';
import { FlowchartSidebar } from './sidebar';

import {
  TYPES,
  COLORS,
  BORDER_COLORS,
  ICONS,
  ICON_ANIMATIONS,
  DYNAMIC_ICONS,
  NODE_W,
  NODE_H,
  SMALL_W,
  SMALL_H,
  wrapTooltipText,
  INITIAL_SCHEMA
} from './types';

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
  FlowchartProps,
  TransformState,
  PinchState
} from './types';

import './flowchart.css';

const Workflow = Icons.Workflow;
const Settings = Icons.Settings;

export { TYPES, COLORS, BORDER_COLORS, ICONS, ICON_ANIMATIONS, DYNAMIC_ICONS, NODE_W, NODE_H, SMALL_W, SMALL_H, INITIAL_SCHEMA };
export type { UnifiedFlowchartSchema, FlowchartRelation, FlowchartViewNode, FlowchartViewGroup, FlowchartStep, FlowchartStepData, FlowchartStepLinear, FlowchartStepBranchOption, FlowchartJourney, FlowchartViewConfig, FlowchartProps };


export function Flowchart({ title, schema = INITIAL_SCHEMA }: FlowchartProps) {
  // Local editable schema state
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

  // Journeys & Stepper Controls
  const [currentJourneyId, setCurrentJourneyId] = useState<string>('');
  useEffect(() => {
    if (localSchema.journeys.length > 0) {
      setCurrentJourneyId(localSchema.journeys[0].id);
    } else {
      setCurrentJourneyId('');
    }
    setCurrentStep(0);
    setIsPlaying(false);
  }, [localSchema]);

  const currentJourney = localSchema.journeys.find(j => j.id === currentJourneyId);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Viewport / Camera Engine
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [transform, setTransform] = useState<TransformState>({ scale: 0.9, translateX: 50, translateY: 100 });
  const transformRef = useRef(transform);
  useEffect(() => { transformRef.current = transform; }, [transform]);

  const panAnimRef = useRef<ReturnType<typeof animate> | null>(null);
  const cameraAnimating = useRef(false);

  // Interaction / Editor State
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, baseTranslateX: 0, baseTranslateY: 0 });
  const pinchRef = useRef<PinchState>({ active: false, initialDist: 0, initialScale: 1 });

  // Sidebar Editor state
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('entities'); 
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<FlowchartStepData | FlowchartStepBranchOption | null>(null);

  const dragRef = useRef<{ 
    active: boolean; 
    nodeId: string | null; 
    offsetX: number;
    offsetY: number;
    svgEl: SVGSVGElement | null;
  }>({
    active: false,
    nodeId: null,
    offsetX: 0,
    offsetY: 0,
    svgEl: null
  });

  // Playback timers & particles
  const playTimerRef = useRef<number | null>(null);
  const particleRef = useRef<SVGCircleElement | null>(null);
  const animeInstanceRef = useRef<ReturnType<typeof animate> | null>(null);

  // Hover Tooltip state
  const [tooltip, setTooltip] = useState<{ description: string; x: number; y: number } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Journey step focus — currentStep is 0-indexed step number (0 to length - 1)
  const currentStepData = currentJourney?.steps[currentStep];
  const highlightedNodeId = currentStepData?.nodeId || currentStepData?.nodeIds?.[0];
  const prevStepData = currentStep > 0 ? currentJourney?.steps[currentStep - 1] : undefined;
  const prevHighlightedNodeId = prevStepData?.nodeId || prevStepData?.nodeIds?.[0] || null;

  // Get view steps or generate from currentJourney
  const activeSteps = useMemo(() => {
    if (activeView.steps && activeView.steps.length > 0) {
      return activeView.steps;
    }
   if (currentJourney && currentJourney.steps.length > 0) {
       return currentJourney.steps.map((step, idx) => {
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
  }, [activeView.steps, currentJourney, localSchema.entities]);

  // Sync selected step with currentStep.
  useEffect(() => {
    if (activeView.steps && activeView.steps.length > 0) {
      // In view phases mode, currentStep = 0 is overview, > 0 is 1-indexed step
      if (currentStep === 0) {
        setActiveStep(null);
      } else {
        setActiveStep(activeSteps[currentStep - 1] ?? null);
      }
    } else if (currentJourney) {
      // In journey playback mode, currentStep is 0-indexed step (0 to length - 1)
      if (currentStep === -1) {
        setActiveStep(null);
      } else {
        setActiveStep(activeSteps[currentStep] ?? null);
      }
    } else {
      setActiveStep(null);
    }
  }, [currentStep, currentJourney, activeSteps, activeView.steps]);

  const activeNodeIds = useMemo(() => {
    if (!activeStep) return null;
    return ('nodeIds' in activeStep) ? activeStep.nodeIds ?? null : null;
  }, [activeStep]);

  // Node mappings
  const positioned = useMemo(() => {
    return activeView.nodes;
  }, [activeView.nodes]);

  // Keep a ref to the current view's nodes so the fit effect can read them
  // without listing them as reactive deps (prevents drag from resetting the viewport)
  const activeViewNodesRef = useRef(activeView.nodes);
  useEffect(() => { activeViewNodesRef.current = activeView.nodes; }, [activeView.nodes]);

  const nodeMap = useMemo(() => {
    const m = Object.create(null);
    for (const n of positioned) {
      m[n.id] = n;
    }
    return m;
  }, [positioned]);

  // Compute view boundaries
  const minX = positioned.length > 0 ? Math.min(...positioned.map(n => n.x)) : 0;
  const maxX = positioned.length > 0 ? Math.max(...positioned.map(n => n.x)) : 0;
  const minY = positioned.length > 0 ? Math.min(...positioned.map(n => n.y)) : 0;
  const maxY = positioned.length > 0 ? Math.max(...positioned.map(n => n.y)) : 0;

  // View reset on switch — fires ONLY on view key change (not on node drag).
  // Node positions are read from a ref at rAF time so they don't become deps.
  useEffect(() => {
    setIsPlaying(false);
    setCurrentStep(0);
    setActiveStep(null);

    const raf = requestAnimationFrame(() => {
      if (!svgRef.current) return;
      const nodes = activeViewNodesRef.current;
      if (nodes.length === 0) return;
      const xs = nodes.map(n => n.x);
      const ys = nodes.map(n => n.y);
      const nx = (Math.min(...xs) + Math.max(...xs)) / 2;
      const ny = (Math.min(...ys) + Math.max(...ys)) / 2;
      const W = svgRef.current.clientWidth || 800;
      const H = svgRef.current.clientHeight || 500;
      setTransform({
        scale: 0.45,
        translateX: W / 2 - nx * 0.45,
        translateY: H / 2 - ny * 0.45,
      });
    });

    return () => cancelAnimationFrame(raf);
  }, [activeViewKey]); // ← only fires on view switch, never on node drag

  // Playback timer loops
  useEffect(() => {
    if (isPlaying && currentJourney && currentStep < currentJourney.steps.length) {
      playTimerRef.current = window.setTimeout(() => {
        setCurrentStep(s => s + 1);
      }, 2500);
    } else {
      setIsPlaying(false);
    }
    return () => {
      if (playTimerRef.current) {
        clearTimeout(playTimerRef.current);
        playTimerRef.current = null;
      }
    };
  }, [isPlaying, currentStep, currentJourney]);

  // CAMERA ENGINE
  const animateTo = useCallback((targetX: number, targetY: number, targetScale: number) => {
    if (panAnimRef.current) panAnimRef.current.pause();
    cameraAnimating.current = true;
    const start = transformRef.current;
    const proxy = { tx: start.translateX, ty: start.translateY, sc: start.scale };
    
    panAnimRef.current = animate(proxy, {
      tx: targetX,
      ty: targetY,
      sc: targetScale,
      duration: 600,
      easing: 'easeInOutQuad',
      onUpdate: () => {
        setTransform({ scale: proxy.sc, translateX: proxy.tx, translateY: proxy.ty });
      },
      onComplete: () => {
        cameraAnimating.current = false;
      }
    });
  }, []);

  const focusOnNodes = useCallback((nodeIds: string[]) => {
    if (!containerRef.current || !nodeIds || nodeIds.length === 0 || !svgRef.current) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nodeIds.forEach(id => {
      const node = activeView.nodes.find(n => n.id === id);
      if (!node) return;
      const type = localSchema.entities[id]?.viewTypes[activeViewKey] || 'default';
      const isSmall = ([TYPES.USER, TYPES.EXTERNAL, TYPES.HOTSPOT, TYPES.DECISION] as readonly string[]).includes(type);
      minX = Math.min(minX, node.x - (isSmall ? SMALL_W : NODE_W) / 2);
      minY = Math.min(minY, node.y - (isSmall ? SMALL_H : NODE_H) / 2);
      maxX = Math.max(maxX, node.x + (isSmall ? SMALL_W : NODE_W) / 2);
      maxY = Math.max(maxY, node.y + (isSmall ? SMALL_H : NODE_H) / 2);
    });
    if (minX === Infinity) return;
    
    const viewportW = svgRef.current.clientWidth; 
    const viewportH = svgRef.current.clientHeight; 
    const padding = Math.min(viewportW * 0.1, 80); 
    
    const bboxW = Math.max(maxX - minX, 1);
    const bboxH = Math.max(maxY - minY, 1);
    const targetScale = Math.min(
      (viewportW - padding * 2) / bboxW,
      (viewportH - padding * 2) / bboxH,
      0.8
    );
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const targetX = viewportW / 2 - centerX * targetScale;
    const targetY = (viewportH / 2 - 100) - centerY * targetScale;
    animateTo(targetX, targetY, targetScale);
  }, [animateTo, activeView, activeViewKey, localSchema.entities]);

  // Timed camera adjustments
  useEffect(() => {
    if (activeNodeIds && activeNodeIds.length > 0 && !isPanning && !dragRef.current.active) {
      focusOnNodes(activeNodeIds);
    }
  }, [currentStep, activeNodeIds, focusOnNodes, isPanning]);

  // Scroll carousel to keep active step visible
  useEffect(() => {
    if (activeStep) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`step-card-${activeStep.id}`);
        if (el && typeof el.scrollIntoView === 'function') {
          el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [activeStep]);

  // In-flight flow particles
  useEffect(() => {
    if (currentStep === 0 || !prevHighlightedNodeId || !highlightedNodeId) return;
    const fromNode = nodeMap[prevHighlightedNodeId];
    const toNode = nodeMap[highlightedNodeId];
    if (!fromNode || !toNode) return;
    
    const hasRelation = localSchema.relations.some(
      r => r.views.includes(activeViewKey) &&
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
  }, [currentStep, prevHighlightedNodeId, highlightedNodeId, activeViewKey, nodeMap, localSchema.relations]);


  // Dropdown close events
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

  // Interaction handlers
  const getSvgPoint = useCallback((clientX: number, clientY: number, svgEl: SVGSVGElement) => {
    const pt = svgEl.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svgEl.getScreenCTM();
    if (!ctm) return { x: clientX, y: clientY };
    const svgP = pt.matrixTransform(ctm.inverse());
    return { x: svgP.x, y: svgP.y };
  }, []);

  const onNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const svgEl = e.currentTarget.closest('svg') as SVGSVGElement;
    if (!svgEl) return;
    
    // Select node in edit mode
    if (isEditMode) {
      setSelectedId(nodeId);
      setActiveTab('entities');
    }
    
    const node = nodeMap[nodeId];
    if (!node) return;
    
    const pt = getSvgPoint(e.clientX, e.clientY, svgEl);
    dragRef.current = { 
      active: true, 
      nodeId, 
      offsetX: pt.x - node.x,
      offsetY: pt.y - node.y,
      svgEl 
    };
    setTooltip(null);
  }, [getSvgPoint, isEditMode, nodeMap]);

  const onNodeTouchStart = useCallback((e: React.TouchEvent, nodeId: string) => {
    if (e.touches.length !== 1) return;
    e.stopPropagation();
    const svgEl = (e.currentTarget as Element).closest('svg') as SVGSVGElement;
    if (!svgEl) return;
    
    if (isEditMode) {
      setSelectedId(nodeId);
      setActiveTab('entities');
    }
    
    const node = nodeMap[nodeId];
    if (!node) return;
    
    const touch = e.touches[0];
    const pt = getSvgPoint(touch.clientX, touch.clientY, svgEl);
    dragRef.current = { 
      active: true, 
      nodeId, 
      offsetX: pt.x - node.x,
      offsetY: pt.y - node.y,
      svgEl 
    };
    setTooltip(null);
  }, [getSvgPoint, isEditMode, nodeMap]);

  const handlePointerMove = useCallback((clientX: number, clientY: number) => {
    if (dragRef.current.active && dragRef.current.nodeId) {
      const svgEl = dragRef.current.svgEl;
      if (!svgEl) return;
      const pt = getSvgPoint(clientX, clientY, svgEl);
      const nodeId = dragRef.current.nodeId;
      
      const newX = pt.x - dragRef.current.offsetX;
      const newY = pt.y - dragRef.current.offsetY;

      // Snap to grid (10px) in edit mode
      const finalX = isEditMode ? Math.round(newX / 10) * 10 : newX;
      const finalY = isEditMode ? Math.round(newY / 10) * 10 : newY;

      setLocalSchema(prev => {
        const next = JSON.parse(JSON.stringify(prev)) as UnifiedFlowchartSchema;
        const node = next.views[activeViewKey]?.nodes.find(n => n.id === nodeId);
        if (node) {
          node.x = finalX;
          node.y = finalY;
        }
        return next;
      });
      return;
    }
    if (isPanning) {
      const dx = clientX - panStartRef.current.x;
      const dy = clientY - panStartRef.current.y;
      setTransform(() => ({
        scale: transformRef.current.scale,
        translateX: panStartRef.current.baseTranslateX + dx,
        translateY: panStartRef.current.baseTranslateY + dy
      }));
    }
  }, [getSvgPoint, isPanning, activeViewKey, isEditMode]);

  const handlePointerUp = useCallback(() => {
    dragRef.current = { active: false, nodeId: null, offsetX: 0, offsetY: 0, svgEl: null };
    setIsPanning(false);
    pinchRef.current = { active: false, initialDist: 0, initialScale: 1 };
  }, []);

  const onWheelNative = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.0015;
    const currentScale = transformRef.current.scale;
    const newScale = Math.min(3, Math.max(0.15, currentScale * (1 + delta)));
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const rect = svgEl.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - rect.width / 2;
    const mouseY = e.clientY - rect.top - rect.height / 2;
    const svgMouseX = mouseX / currentScale;
    const svgMouseY = mouseY / currentScale;
    const scaleFactor = newScale / currentScale;
    setTransform(prev => ({
      scale: newScale,
      translateX: prev.translateX + svgMouseX * (1 - scaleFactor),
      translateY: prev.translateY + svgMouseY * (1 - scaleFactor)
    }));
  }, []);

  const onSvgTouchStartNative = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      pinchRef.current = { active: true, initialDist: dist, initialScale: transformRef.current.scale };
      setIsPanning(false);
      return;
    }
    if (e.touches.length === 1) {
      const target = e.target as Element;
      if (!target.closest('.flowchart-node-group') && !target.closest('foreignObject')) {
        e.preventDefault();
        setIsPanning(true);
        const touch = e.touches[0];
        panStartRef.current = {
          x: touch.clientX,
          y: touch.clientY,
          baseTranslateX: transformRef.current.translateX,
          baseTranslateY: transformRef.current.translateY
        };
      }
    }
  }, []);

  const onTouchMoveNative = useCallback((e: TouchEvent) => {
    if (pinchRef.current.active && e.touches.length === 2) {
      e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const scaleRatio = dist / pinchRef.current.initialDist;
      const currentScale = transformRef.current.scale;
      const newScale = Math.min(3, Math.max(0.15, pinchRef.current.initialScale * scaleRatio));
      const svgEl = svgRef.current;
      if (!svgEl) return;
      const rect = svgEl.getBoundingClientRect();
      const centerX = (t1.clientX + t2.clientX) / 2 - rect.left;
      const centerY = (t1.clientY + t2.clientY) / 2 - rect.top;
      const svgCenterX = (centerX - rect.width / 2) / currentScale;
      const svgCenterY = (centerY - rect.height / 2) / currentScale;
      const scaleFactor = newScale / currentScale;
      setTransform(prev => ({
        scale: newScale,
        translateX: prev.translateX + svgCenterX * (1 - scaleFactor),
        translateY: prev.translateY + svgCenterY * (1 - scaleFactor)
      }));
      return;
    }
    if (e.touches.length === 1 && (isPanning || dragRef.current.active)) {
      e.preventDefault();
      const touch = e.touches[0];
      handlePointerMove(touch.clientX, touch.clientY);
    }
  }, [handlePointerMove, isPanning]);

  // Attach wheel + touch as non-passive listeners so preventDefault() works
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    svg.addEventListener('wheel', onWheelNative, { passive: false });
    svg.addEventListener('touchstart', onSvgTouchStartNative, { passive: false });
    svg.addEventListener('touchmove', onTouchMoveNative, { passive: false });
    return () => {
      svg.removeEventListener('wheel', onWheelNative);
      svg.removeEventListener('touchstart', onSvgTouchStartNative);
      svg.removeEventListener('touchmove', onTouchMoveNative);
    };
  }, [onWheelNative, onSvgTouchStartNative, onTouchMoveNative]);

  const onSvgMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as Element).closest('.flowchart-node-group') || (e.target as Element).closest('foreignObject')) return;
    setIsPanning(true);
    panStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      baseTranslateX: transform.translateX,
      baseTranslateY: transform.translateY
    };
  }, [transform]);

  // Stepper Handlers — currentStep=0 is the overview (no highlight)
  const handlePlay = useCallback(() => {
    if (currentJourney && currentStep < currentJourney.steps.length) {
      setIsPlaying(true);
    }
  }, [currentJourney, currentStep]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleNext = useCallback(() => {
    if (currentJourney && currentStep < currentJourney.steps.length) {
      setCurrentStep(s => s + 1);
    }
  }, [currentJourney, currentStep]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(s => s - 1);
    }
  }, [currentStep]);

  const handleReset = useCallback(() => {
    setCurrentStep(0);
    setIsPlaying(false);
    setActiveStep(null);
  }, []);

  // Step carousel handler — activeStep is the single source for selection, dim, and camera.
  const handleStepClick = (step: FlowchartStepLinear | FlowchartStepBranchOption) => {
    if (activeStep?.id === step.id) {
      // Deselect → back to overview/unfocused
      setActiveStep(null);
      if (currentJourney && !activeView.steps) {
        setCurrentStep(-1);
      } else {
        setCurrentStep(0);
      }
      setIsPlaying(false);
    } else {
      setActiveStep(step);
      focusOnNodes(step.nodeIds || []);

      // Sync currentStep when using journey steps (0-indexed)
      if (!activeView.steps && currentJourney) {
        const stepIdx = activeSteps.findIndex(s => s.id === step.id);
        if (stepIdx !== -1) setCurrentStep(stepIdx);
      }
    }
  };

  // Zoom Toolbar controls
  const handleZoomIn = useCallback(() => {
    setTransform(prev => ({ ...prev, scale: Math.min(3, prev.scale + 0.1) }));
  }, []);

  const handleZoomOut = useCallback(() => {
    setTransform(prev => ({ ...prev, scale: Math.max(0.15, prev.scale - 0.1) }));
  }, []);

  const handleFitToScreen = useCallback(() => {
    if (positioned.length === 0 || !svgRef.current) return;
    const W = svgRef.current.clientWidth || 800;
    const H = svgRef.current.clientHeight || 500;
    const nx = minX + (maxX - minX) / 2;
    const ny = minY + (maxY - minY) / 2;
    animateTo(W / 2 - nx * 0.45, H / 2 - ny * 0.45, 0.45);
  }, [positioned, minX, maxX, minY, maxY, animateTo]);

  // Mutation helper functions for the Editor
  const updateEntity = (id: string, field: string, value: string) => {
    setLocalSchema(prev => {
      const next = JSON.parse(JSON.stringify(prev)) as UnifiedFlowchartSchema;
      if (!next.entities[id]) return prev;
      if (field.startsWith('viewTypes.')) {
        const vKey = field.split('.')[1];
        next.entities[id].viewTypes[vKey] = value;
        
        // Add or remove node in view configuration
        const viewNodes = next.views[vKey]?.nodes;
        if (viewNodes) {
          const exists = viewNodes.some(n => n.id === id);
          if (value && !exists) {
            viewNodes.push({ id, x: 150, y: 150 });
          } else if (!value && exists) {
            next.views[vKey].nodes = viewNodes.filter(n => n.id !== id);
          }
        }
      } else if (field === 'title' || field === 'desc') {
        next.entities[id][field] = value;
      }
      return next;
    });
  };

  const addEntity = () => {
    const id = `ent_${Date.now()}`;
    setLocalSchema(prev => {
      const next = JSON.parse(JSON.stringify(prev)) as UnifiedFlowchartSchema;
      next.entities[id] = { title: 'New Entity', desc: '', viewTypes: { [activeViewKey]: TYPES.EVENT } };
      next.views[activeViewKey]?.nodes.push({ id, x: 200, y: 200 });
      return next;
    });
    setSelectedId(id);
    setActiveTab('entities');
  };

  const deleteEntity = (id: string) => {
    setLocalSchema(prev => {
      const next = JSON.parse(JSON.stringify(prev)) as UnifiedFlowchartSchema;
      delete next.entities[id];
      Object.keys(next.views).forEach(vKey => {
        next.views[vKey].nodes = next.views[vKey].nodes.filter(n => n.id !== id);
        next.views[vKey].groups.forEach(g => g.nodeIds = g.nodeIds ? g.nodeIds.filter(nid => nid !== id) : []);
      });
      next.relations = next.relations.filter(r => r.from !== id && r.to !== id);
      next.journeys.forEach(j => {
        j.steps = j.steps.filter(s => s.nodeId !== id);
      });
      return next;
    });
    setSelectedId(null);
  };

  const exportSchema = () => {
    const jsonStr = JSON.stringify(localSchema, null, 2);
    navigator.clipboard.writeText(jsonStr);
    alert('Schema JSON copied to clipboard!');
    console.log(jsonStr);
  };

  const transformStr = `translate(${transform.translateX}, ${transform.translateY}) scale(${transform.scale})`;

  return (
    <div ref={containerRef} className="flowchart-section" data-testid="flowchart-section">
      <div className="flowchart-header-container">
        {title && <h3 className="flowchart-title" data-testid="flowchart-title">{title}</h3>}
        
        {/* Switch Projections / Views */}
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

          {/* Toggle Edit Mode button */}
          <button
            onClick={() => {
              setIsEditMode(!isEditMode);
              setSelectedId(null);
              setActiveStep(null);
            }}
            className={`flowchart-view-tab-btn ${isEditMode ? 'active' : ''}`}
            title="Toggle Edit Mode"
            style={{ padding: '6px 10px', height: '31px' }}
          >
            <Settings size={14} />
            <span>{isEditMode ? 'Exit Edit' : 'Edit Diagram'}</span>
          </button>
        </div>
      </div>

      {/* Journeys selector bar */}
      {localSchema.journeys.length > 0 && (
        <div className="flowchart-journey-bar" data-testid="flowchart-journey-bar">
          <div className="flowchart-journey-selector">
            <span className="flowchart-journey-label">Story / Journey:</span>
            <select
              id="flowchart-journey-select"
              className="flowchart-journey-select"
              value={currentJourneyId}
              onChange={(e) => {
                setCurrentJourneyId(e.target.value);
                setCurrentStep(0);
                setIsPlaying(false);
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
          {currentJourney?.description && (
            <div className="flowchart-journey-description" data-testid="flowchart-journey-description">
              {currentJourney.description}
            </div>
          )}
        </div>
      )}

      {/* Guided checklist playback controls */}
      {currentJourney && (
        <PlaybackControls
          currentJourney={currentJourney}
          currentStep={currentStep}
          isPlaying={isPlaying}
          handlePlay={handlePlay}
          handlePause={handlePause}
          handleNext={handleNext}
          handlePrev={handlePrev}
          handleReset={handleReset}
        />
      )}

      <div className="flowchart-canvas-wrapper" style={{ position: 'relative' }}>
        <div className="flowchart-body">
          {/* Zoom toolbar overlay */}
          <ZoomToolbar
            handleZoomIn={handleZoomIn}
            handleZoomOut={handleZoomOut}
            handleFitToScreen={handleFitToScreen}
            exportSchema={exportSchema}
            isEditMode={isEditMode}
          />

          {/* Clear Focus overlay */}
          {activeStep && (
            <button
              onClick={() => {
                setActiveStep(null);
                if (currentJourney && !activeView.steps) {
                  setCurrentStep(-1);
                } else {
                  setCurrentStep(0);
                }
                animateTo(50, 100, 0.45);
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
            ref={svgRef}
            className="flowchart-svg"
            data-testid="flowchart-svg"
            width="100%"
            height="100%"
            onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onMouseDown={onSvgMouseDown}
            onTouchEnd={handlePointerUp}
          >
            <defs>
              <filter id="flowchart-desc-shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="3" stdDeviation="6" floodColor="#ca9ee6" floodOpacity="0.25" />
              </filter>
              <filter id="flowchart-tooltip-shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000000" floodOpacity="0.4" />
              </filter>
              <filter id="flowchart-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#8caaee" floodOpacity="0.6" />
              </filter>
              <marker id="flowchart-arrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                <path d="M 0 0 L 7 3 L 0 6 Z" fill="#626880" />
              </marker>
              <marker id="flowchart-arrow-highlight" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                <path d="M 0 0 L 7 3 L 0 6 Z" fill="#8caaee" />
              </marker>
              <pattern
                id="dotGrid"
                width={20 * transform.scale}
                height={20 * transform.scale}
                patternUnits="userSpaceOnUse"
                patternTransform={`translate(${transform.translateX % (20 * transform.scale)}, ${transform.translateY % (20 * transform.scale)})`}
              >
                <circle cx="2" cy="2" r={1 * transform.scale} fill="#51576d" opacity="0.6" />
              </pattern>
            </defs>

            <rect width="100%" height="100%" fill="url(#dotGrid)" style={{ pointerEvents: 'none' }} />

            <g transform={transformStr} data-testid="flowchart-canvas">
              
              {/* Draw groups / domains / swimlanes */}
              {activeView.groups && activeView.groups.map(group => {
                const isFaded = activeNodeIds !== null;
                if (group.isLane) {
                  return (
                    <g key={group.id} className="flowchart-swimlane-group" opacity={isFaded ? 0.15 : 0.85} style={{ transition: 'opacity 0.3s' }}>
                      <rect
                        x={minX - 100}
                        y={group.y ?? 100}
                        width={maxX - minX + 500}
                        height={group.h ?? 180}
                        fill={group.color || 'rgba(186, 187, 241, 0.10)'}
                        stroke={group.borderColor || '#626880'}
                        strokeWidth="1.5"
                      />
                      <text
                        x={minX - 80}
                        y={(group.y ?? 100) + 25}
                        fontSize="13"
                        fontWeight="bold"
                        fill={group.textColor || '#b5bfe2'}
                      >
                        {group.title}
                      </text>
                    </g>
                  );
                }
                
                // Standard visual domain group
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

              {/* Draw relations / connections / edges as Bezier curves */}
              {localSchema.relations
                .filter(r => r.views.includes(activeViewKey))
                .map((rel, idx) => {
                  const fromNode = nodeMap[rel.from];
                  const toNode = nodeMap[rel.to];
                  if (!fromNode || !toNode) return null;

                  const entityFrom = localSchema.entities[rel.from];
                  const entityTo = localSchema.entities[rel.to];
                  if (!entityFrom || !entityTo) return null;

                  const fromType = entityFrom.viewTypes[activeViewKey] || 'default';
                  const toType = entityTo.viewTypes[activeViewKey] || 'default';

                  const fromIsSmall = ([TYPES.USER, TYPES.EXTERNAL, TYPES.HOTSPOT, TYPES.DECISION] as string[]).includes(fromType);
                  const toIsSmall = ([TYPES.USER, TYPES.EXTERNAL, TYPES.HOTSPOT, TYPES.DECISION] as string[]).includes(toType);

                  const fromW = fromIsSmall ? SMALL_W : NODE_W;
                  const fromH = fromIsSmall ? SMALL_H : NODE_H;
                  const toW = toIsSmall ? SMALL_W : NODE_W;
                  const toH = toIsSmall ? SMALL_H : NODE_H;

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
                     <g key={rel.id} data-testid={`flowchart-edge-${idx}`} style={{ transition: 'opacity 0.3s', opacity: isFaded ? 0.1 : 0.8 }}>
                       <path
                         d={pathD}
                         stroke="#626880"
                         strokeWidth="1.5"
                         fill="none"
                         strokeOpacity="0.3"
                         markerEnd={isHandledBy ? '' : 'url(#flowchart-arrow)'}
                       />
                       <path
                         d={pathD}
                         stroke={isHighlighted ? '#8caaee' : (isHandledBy ? '#a6d189' : (rel.dashed ? '#e5c890' : '#8caaee'))}
                         strokeWidth={isHighlighted ? '2.5' : (isHandledBy ? '2' : '1.5')}
                         fill="none"
                         strokeOpacity={isHighlighted ? '0.95' : (isHandledBy ? '0.8' : '0.55')}
                         strokeDasharray={isHandledBy ? 'none' : (rel.dashed ? '4 4' : '6 7')}
                         markerEnd={isHandledBy ? 'url(#flowchart-arrow)' : (isHighlighted ? 'url(#flowchart-arrow-highlight)' : 'url(#flowchart-arrow)')}
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
                     </g>
                   );
                })}

              {/* In-flight flow particles */}
              {currentJourney && particleRef && (
                <circle
                  ref={particleRef}
                  r="6"
                  fill="#8caaee"
                  opacity="0"
                  className="flowchart-particle"
                  data-testid="flowchart-particle"
                />
              )}


              {/* Render Nodes as foreignObjects for auto-wrapping and premium cards */}
              {positioned.map(node => {
                const entity = localSchema.entities[node.id];
                if (!entity) return null;
                
                const viewType = entity.viewTypes[activeViewKey] || 'default';
                const isSmall = ( [TYPES.USER, TYPES.EXTERNAL, TYPES.HOTSPOT, TYPES.DECISION] as string[] ).includes(viewType);
                const nW = isSmall ? SMALL_W : NODE_W;
                const nH = isSmall ? SMALL_H : NODE_H;

                const x = node.x - nW / 2;
                const y = node.y - nH / 2;

                const isStepHighlighted = activeNodeIds && activeNodeIds.includes(node.id);
                const isDimmed = activeNodeIds !== null && !isStepHighlighted;
                const isSelected = selectedId === node.id && activeTab === 'entities';

                const isHighlighted = isStepHighlighted || (highlightedNodeId === node.id);
                
                const nodeFill = COLORS[viewType as keyof typeof COLORS] || COLORS.default;
                const strokeColor = BORDER_COLORS[viewType as keyof typeof BORDER_COLORS] || BORDER_COLORS.default;
                
                const iconName = ICONS[viewType as keyof typeof ICONS];
                const animClass = ICON_ANIMATIONS[viewType as keyof typeof ICON_ANIMATIONS] || '';
                const IconComponent = iconName && (iconName in Icons) ? (Icons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string; color?: string }>>)[iconName] : null;

                return (
                  <g
                    key={node.id}
                    data-testid={`flowchart-node-${node.id}`}
                    className="flowchart-node-group"
                    onMouseDown={(e) => onNodeMouseDown(e, node.id)}
                    onTouchStart={(e) => onNodeTouchStart(e, node.id)}
                    onMouseEnter={() => {
                      if (!dragRef.current.active && entity.desc) {
                        setTooltip({ description: entity.desc, x: node.x, y: node.y - nH/2 });
                      }
                    }}
                    onMouseLeave={() => setTooltip(null)}
                    style={{
                      opacity: isDimmed ? 0.25 : 1,
                      transition: 'opacity 0.3s, filter 0.3s'
                    }}
                  >
                    <rect
                      x={x} y={y}
                      width={nW} height={nH}
                      rx="8"
                      fill={nodeFill}
                      stroke={strokeColor}
                      strokeWidth="1.5"
                      filter={isHighlighted || isSelected ? 'url(#flowchart-glow)' : undefined}
                      className={`flowchart-node-rect ${isHighlighted ? 'flowchart-node-highlighted' : ''}`}
                    />
                    
                    <foreignObject x={x} y={y} width={nW} height={nH} style={{ pointerEvents: 'none' }}>
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
                              fontSize: isSmall ? '10px' : '11px',
                              color: 'var(--ctp-text)',
                              display: '-webkit-box',
                              WebkitLineClamp: isSmall ? 2 : 3,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}
                          >
                            {entity.viewTitles?.[activeViewKey] ?? entity.title}
                          </p>
                        </div>
                      </div>
                    </foreignObject>
                    
                    {/* Hide fallback render, keep SVG elements for screen readers / tests query */}
                    <text x={x} y={y} display="none">{entity.viewTitles?.[activeViewKey] ?? entity.title}</text>
                    <text x={x} y={y} display="none">&lt;&lt;{viewType}&gt;&gt;</text>
                  </g>
                );
              })}

              {/* Static hover/touch Tooltip */}
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
                      filter="url(#flowchart-tooltip-shadow)"
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

          {/* Stepper carousel at bottom of canvas (renders if view or journey steps exist) */}
          <StepCarousel
            activeSteps={activeSteps}
            activeStep={activeStep}
            handleStepClick={handleStepClick}
          />
        </div>

        <FlowchartSidebar
          isEditMode={isEditMode}
          selectedId={selectedId}
          activeTab={activeTab}
          localSchema={localSchema}
          activeViewKey={activeViewKey}
          activeView={activeView}
          viewKeys={viewKeys}
          setSelectedId={setSelectedId}
          setActiveTab={setActiveTab}
          setLocalSchema={setLocalSchema}
          addEntity={addEntity}
          updateEntity={updateEntity}
          deleteEntity={deleteEntity}
        />
      </div>


    </div>
  );
}

SectionRegistry.register('flowchart', Flowchart as ComponentType<unknown>);

export default Flowchart;
