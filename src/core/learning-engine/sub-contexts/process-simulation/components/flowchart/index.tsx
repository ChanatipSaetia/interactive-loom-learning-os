import { useCallback, useEffect, useMemo, useId, useRef, useState, type ComponentType } from 'react';
import * as Icons from 'lucide-react';
import { Button } from '../../../../../ui-system/motion/button';
import { Dropdown } from '../../../../../ui-system/motion/dropdown';
import { motion, AnimatePresence } from 'motion/react';
import { SPRING_PANEL } from '../../../../../ui-system/motion/ease';
import { Tabs, TabsList, TabsTrigger } from '../../../../../ui-system/motion/tabs';
import { SectionTitleBar } from '../../../../../delivery/web-app-shell/SectionTitleBar';

import { FlowchartView } from './views';
import { PlaybackControls } from './playback-controls';
import { MiniPlayer } from './mini-player';
import { StepCarousel } from './step-carousel';
import { usePlaybackState } from './usePlaybackState';
import { autoDeriveViews } from './derivations';
import { buildCanonicalIdMapper, deriveSchema } from '../../model/derive';
import { InspectorSidebar } from './inspector';
import { FlowchartHelpModal } from './FlowchartHelpModal';
import {
  EventStormingIcon,
  SystemArchitectureIcon,
  DataFlowIcon,
  SwimlanesIcon,
  SequenceIcon,
  StateMachineIcon,
} from './view-icons';

const Maximize = Icons.Maximize2;
const Minimize = Icons.Minimize2;
const PanelRight = Icons.PanelRight;

import {
  TYPES,
  COLORS,
  BORDER_COLORS,
  ICONS,
  ICON_ANIMATIONS,
  DYNAMIC_ICONS,
  NODE_W,
  NODE_H,
  PROCESS_GROUP_STATE_MAP,
  STEP_EVENT_TO_STATE_MAP,
} from './types';
import { INITIAL_SCHEMA } from './initial-schema';

import type {
  UnifiedFlowchartSchema,
  FlowchartEntity,
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
  ProcessGroup,
  FlowchartStateMachineState,
  FlowchartStateMachine,
} from './types';

import './flowchart.css';

const Workflow = Icons.Workflow;

export { TYPES, COLORS, BORDER_COLORS, ICONS, ICON_ANIMATIONS, DYNAMIC_ICONS, NODE_W, NODE_H, INITIAL_SCHEMA, PROCESS_GROUP_STATE_MAP, STEP_EVENT_TO_STATE_MAP };
export type { UnifiedFlowchartSchema, FlowchartEntity, FlowchartRelation, FlowchartViewNode, FlowchartViewGroup, FlowchartStep, FlowchartStepData, FlowchartStepLinear, FlowchartStepBranchOption, FlowchartJourney, FlowchartViewConfig, FlowchartProps, ProcessGroup, FlowchartStateMachineState, FlowchartStateMachine };

export function Flowchart({ title, flow, schema = INITIAL_SCHEMA, sectionIndex = 0 }: FlowchartProps) {
  const rawId = useId();
  const instanceId = useMemo(() => rawId.replace(/:/g, ''), [rawId]);

  const baseSchema = useMemo(() => (flow ? deriveSchema(flow) : schema), [flow, schema]);
  const [localSchema, setLocalSchema] = useState<UnifiedFlowchartSchema>(() => autoDeriveViews(baseSchema));

  useEffect(() => {
    setLocalSchema(autoDeriveViews(baseSchema));
  }, [baseSchema]);

  const viewKeys = useMemo(() => Object.keys(localSchema.views!), [localSchema]);
  const [activeViewKey, setActiveViewKey] = useState<string>(viewKeys[0] || 'EVENT_STORMING');

  useEffect(() => {
    if (viewKeys.length > 0 && !viewKeys.includes(activeViewKey)) {
      setActiveViewKey(viewKeys[0]);
    }
  }, [viewKeys, activeViewKey]);

  const activeView = useMemo(() => {
    const views = localSchema.views!;
    return (views as Record<string, typeof views[keyof typeof views]>)[activeViewKey] || { name: 'Empty', icon: 'Workflow', nodes: [], groups: [] };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSchema.views!, activeViewKey]);

  // Popup state for node related views
  const [activeNodePopup, setActiveNodePopup] = useState<{
    nodeId: string;
    x: number;
    y: number;
    views: { key: string; name: string; type: string }[];
  } | null>(null);

  // Close popup when active view key changes
  useEffect(() => {
    setActiveNodePopup(null);
  }, [activeViewKey]);

  // Playback state (shared across all views in grid mode)
  const playback = usePlaybackState({ schema: localSchema });

  // Resolve active node/relation IDs across all views from journey step data
  const resolvedHighlights = useMemo(() => {
    if (!playback.activeNodeIds || playback.activeNodeIds.length === 0) {
      return { activeNodeIds: null as string[] | null, activeRelationIds: null as string[] | null };
    }
    // Nodes that are actually part of the active step. Used for relation
    // matching: a collapsed ref (e.g. orch_qa_ref) keeps its own identity here
    // so the canonical target's unrelated edges are not dragged in.
    const activeForRelations = new Set(playback.activeNodeIds);

    // Node highlight set is additionally expanded to each active node's
    // collapsedTo target, so the shared canonical node lights up in collapsed
    // views (SYS_ARCH, SWIMLANES) where the ref is drawn as that single node.
    // In EVENT_STORMING, duplicates are rendered separately and should NOT
    // also highlight the canonical entity.
    const entityIds = new Set(playback.activeNodeIds);
    if (activeViewKey !== 'EVENT_STORMING') {
      const getCanonicalId = buildCanonicalIdMapper(localSchema.entities);
      playback.activeNodeIds.forEach(id => {
        const canonicalId = getCanonicalId(id);
        if (canonicalId) {
          entityIds.add(canonicalId);
        }
      });
    }

    // Find relations whose intermediate path includes any active node
    const relIds = new Set<string>();
    
    if (activeViewKey === 'SEQUENCE') {
      localSchema.relations.forEach(rel => {
        if (rel.views?.includes('SEQUENCE')) {
          if (rel.stepNodeIds && rel.stepNodeIds.some(nid => activeForRelations.has(nid))) {
            relIds.add(rel.id);
          }
        }
      });
    } else if (activeViewKey === 'SYS_ARCH' || activeViewKey === 'SWIMLANES') {
      const getCanonicalId = buildCanonicalIdMapper(localSchema.entities);
      const activeCanonicalSet = new Set<string>();
      playback.activeNodeIds.forEach(id => {
        const cid = getCanonicalId(id);
        if (cid) activeCanonicalSet.add(cid);
      });

      localSchema.relations.forEach(rel => {
        if (rel.views?.includes(activeViewKey)) {
          if (activeCanonicalSet.has(rel.from) && activeCanonicalSet.has(rel.to)) {
            relIds.add(rel.id);
          }
        }
      });
    } else {
      // Return the intermediate nodes lying on a path from `from` to `to` in the
      // EVENT_STORMING graph, or null when no path exists. Only nodes on the
      // successful path are returned — dead-end DFS branches are excluded so a
      // sibling branch (e.g. tool route) cannot falsely contribute its nodes.
      const findPathIntermediates = (
        from: string,
        to: string,
        visited: Set<string>
      ): string[] | null => {
        const outgoing = localSchema.relations.filter(r =>
          (!r.views || r.views.includes('EVENT_STORMING')) && r.from === from
        );
        for (const r of outgoing) {
          if (r.to === to) return [];
          if (visited.has(r.to)) continue;
          visited.add(r.to);
          const rest = findPathIntermediates(r.to, to, visited);
          if (rest) return [r.to, ...rest];
        }
        return null;
      };

      localSchema.relations.forEach(rel => {
        if (activeForRelations.has(rel.from)) {
          relIds.add(rel.id);
          return;
        }
        const path = findPathIntermediates(rel.from, rel.to, new Set<string>([rel.from]));
        if (path && path.some(mid => activeForRelations.has(mid))) {
          relIds.add(rel.id);
        }
      });
    }

    return {
      activeNodeIds: Array.from(entityIds),
      activeRelationIds: relIds.size > 0 ? Array.from(relIds) : null
    };
  }, [playback.activeNodeIds, localSchema.entities, localSchema.relations, activeViewKey]);

  // Sync active step with current playback step
  const activeSteps = useMemo(() => {
    if (activeView.steps && activeView.steps.length > 0) {
      return activeView.steps;
    }
    if (playback.currentJourney && playback.currentJourney.steps.length > 0) {
      return playback.currentJourney.steps.map((step, idx) => ({
        id: `journey-step-${idx}`,
        type: 'linear' as const,
        nodeIds: step.nodeIds,
        title: step.title,
        reason: step.reason,
      }));
    }
    return [];
  }, [activeView.steps, playback.currentJourney, localSchema.entities]);

  const [activeStep, setActiveStep] = useState<FlowchartStepData | FlowchartStepBranchOption | null>(null);

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

  // Dropdown close events
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Derive activeStateId from current playback step
  const activeStateId = useMemo(() => {
    const journey = localSchema.journeys.find(j => j.id === playback.currentJourneyId);
    if (!journey || playback.currentStep < 0) return null;
    const currentStepData = journey.steps[playback.currentStep] as FlowchartStep | undefined;
    if (!currentStepData) return null;

    // Find any node in nodeIds that maps to a state machine state
    const matchedNodeId = currentStepData.nodeIds?.find(id => !!STEP_EVENT_TO_STATE_MAP[id]);
    if (matchedNodeId) {
      return STEP_EVENT_TO_STATE_MAP[matchedNodeId];
    }

    if (currentStepData.processGroup) {
      return PROCESS_GROUP_STATE_MAP[currentStepData.processGroup] ?? null;
    }
    return null;
  }, [localSchema, playback.currentJourneyId, playback.currentStep]);

  const activeStateMachineAggregateId = useMemo(() => {
    const smView = localSchema.views!.STATE_MACHINE;
    if (smView) {
      // Find the node ID in the STATE_MACHINE view that does NOT contain "_state_" (which is the subject Aggregate node itself)
      const aggNode = smView.nodes.find(n => !n.id.includes('_state_'));
      if (aggNode) return aggNode.id;
    }
    // Fallback: check static entities
    const firstWithSM = Object.entries(localSchema.entities).find(([, entity]) => !!entity.stateMachine);
    return firstWithSM ? firstWithSM[0] : null;
  }, [localSchema.views!, localSchema.entities]);

  const highlightedNodeId = useMemo(() => {
    if (activeViewKey === 'STATE_MACHINE' && activeStateMachineAggregateId) {
      // Find all state nodes in the view. We want to fall back to the initial one if activeStateId is not set.
      const smView = localSchema.views!.STATE_MACHINE;
      if (smView) {
        const stateNodes = smView.nodes.filter(n => n.id.includes('_state_')) || [];
        const activeState = activeStateId || (stateNodes[0] ? stateNodes[0].id.replace(`${activeStateMachineAggregateId}_state_`, '') : 'IDLE');
        if (activeState) {
          return `${activeStateMachineAggregateId}_state_${activeState}`;
        }
      } else {
        // Static fallback
        const activeState = activeStateId || localSchema.entities[activeStateMachineAggregateId]?.stateMachine?.initialState;
        if (activeState) {
          return `${activeStateMachineAggregateId}_state_${activeState}`;
        }
      }
    }
    return playback.highlightedNodeId;
  }, [activeViewKey, activeStateMachineAggregateId, activeStateId, playback.highlightedNodeId, localSchema.views!, localSchema.entities]);

  const [prevHighlightedNodeId, setPrevHighlightedNodeId] = useState<string | null>(null);
  const lastHighlightedId = useRef<string | null>(null);

  useEffect(() => {
    if (highlightedNodeId !== lastHighlightedId.current) {
      setPrevHighlightedNodeId(lastHighlightedId.current);
      lastHighlightedId.current = highlightedNodeId;
    }
  }, [highlightedNodeId]);

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

  // Fullscreen mode state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Inspector sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedAggregateId, setSelectedAggregateId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [sidebarManuallyClosed, setSidebarManuallyClosed] = useState(false);
  const [focusAfterViewSwitch, setFocusAfterViewSwitch] = useState<string | null>(null);

  useEffect(() => {
    if (!isFullscreen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFullscreen(false);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isFullscreen]);

 const handleNodeClick = useCallback((nodeId: string, x?: number, y?: number) => {
    const rawEntity = localSchema.entities[nodeId];
    if (!rawEntity) return;

    const getCanonicalId = buildCanonicalIdMapper(localSchema.entities);
    const canonicalId = getCanonicalId(nodeId);
    let entity = rawEntity;

    if (canonicalId !== nodeId) {
      const canonical = localSchema.entities[canonicalId];
      if (canonical) {
        entity = {
          ...canonical,
          ...rawEntity,
          stateMachine: rawEntity.stateMachine || canonical.stateMachine,
          viewTypes: {
            ...canonical.viewTypes,
            ...rawEntity.viewTypes
          }
        };
      }
    }

    const otherViews = Object.keys(entity.viewTypes || {})
      .filter(vk => vk !== activeViewKey && localSchema.views![vk])
      .map(vk => ({
        key: vk,
        name: localSchema.views![vk].name,
        type: entity.viewTypes?.[vk] || ''
      }));

    const smView = localSchema.views!.STATE_MACHINE;
    const aggNode = smView?.nodes.find(n => !n.id.includes('_state_'));
    const isSmSubject = (aggNode && aggNode.id === canonicalId) || !!entity.stateMachine;

    if (isFullscreen) {
      // Select node, open sidebar, switch to Details tab
      setSelectedNodeId(nodeId);
      // When the resolved entity has a state machine, select the canonical
      // aggregate id so the States tab can render its lifecycle.
      if (isSmSubject) {
        setSelectedAggregateId(canonicalId);
      }
      if (!sidebarManuallyClosed) {
        setIsSidebarOpen(true);
      }
      // No popup in fullscreen
      setActiveNodePopup(null);
    } else {
      if (typeof x === 'number' && typeof y === 'number') {
        setActiveNodePopup({
          nodeId,
          x,
          y,
          views: otherViews
        });
      }
    }
  }, [activeViewKey, localSchema.entities, localSchema.views!, isFullscreen, sidebarManuallyClosed]);

  const handleStepClick = (step: FlowchartStepLinear | FlowchartStepBranchOption) => {
    if (activeStep?.id === step.id) {
      playback.resetAll();
    } else {
      const stepIdx = activeSteps.findIndex(s => s.id === step.id);
      if (stepIdx !== -1) {
        playback.setCurrentStep(stepIdx);
        playback.handlePause();
      }
    }
  };

  const [isDockCollapsed, setIsDockCollapsed] = useState(false);
  const [cameraControls, setCameraControls] = useState<{
    handleZoomIn: () => void;
    handleZoomOut: () => void;
    handleFitToScreen: () => void;
  } | null>(null);


  // Filter visible view tabs to show EVENT_STORMING, SWIMLANES, SYS_ARCH, DATA_FLOW, SEQUENCE
  // unless STATE_MACHINE is active, in which case it is rendered temporarily.
  const visibleViewKeys = useMemo(() => {
    return viewKeys.filter(vk => {
      if (vk === activeViewKey) return true;
      return vk === 'EVENT_STORMING' || vk === 'SWIMLANES' || vk === 'SYS_ARCH' || vk === 'DATA_FLOW' || vk === 'SEQUENCE';
    });
  }, [viewKeys, activeViewKey]);

  const actionBarItems = useMemo(() => {
    return visibleViewKeys.map(vk => {
      const view = localSchema.views![vk];
      const name = view?.name || vk;
      
      let IconComponent: ComponentType<{ size?: number | string; className?: string }> = Workflow;
      if (vk === 'EVENT_STORMING') IconComponent = EventStormingIcon;
      else if (vk === 'SYS_ARCH') IconComponent = SystemArchitectureIcon;
      else if (vk === 'DATA_FLOW') IconComponent = DataFlowIcon;
      else if (vk === 'SWIMLANES') IconComponent = SwimlanesIcon;
      else if (vk === 'SEQUENCE') IconComponent = SequenceIcon;
      else if (vk === 'STATE_MACHINE') IconComponent = StateMachineIcon;
      else {
        IconComponent = (view && view.icon in DYNAMIC_ICONS) 
          ? DYNAMIC_ICONS[view.icon as keyof typeof DYNAMIC_ICONS] 
          : Workflow;
      }
      
      return {
        id: vk,
        label: name,
        icon: <IconComponent size={14} />,
        active: activeViewKey === vk,
        onClick: () => setActiveViewKey(vk)
      };
    });
  }, [visibleViewKeys, localSchema.views!, activeViewKey]);

  const journeys = localSchema.journeys;
  const currentJourney = playback.currentJourney;
  const hasDock = activeSteps.length > 0;

  const selectJourneyStep = (stepIndex: number) => {
    playback.setCurrentStep(stepIndex);
    playback.handlePause();
  };

  const journeyPanel = (
    <div className="flowchart-dock-steps" data-testid="flowchart-journey-bar">
      {currentJourney && (
        <div className="flowchart-dock-journey-header">
          <div className="flowchart-dock-steps-controls">
            <div className="flowchart-dock-journey-title-wrapper">
              {journeys.length > 1 ? (
                <Dropdown
                  value={playback.currentJourneyId}
                  onChange={(val) => {
                    playback.setCurrentJourneyId(val);
                    setActiveStep(null);
                  }}
                  options={journeys.map(j => ({ value: j.id, label: j.label }))}
                  data-testid="flowchart-journey-select"
                  triggerTestId="flowchart-journey-trigger"
                  native={true}
                  className="flowchart-journey-dropdown"
                  triggerClassName="flowchart-journey-select"
                  optionsClassName="flowchart-journey-options"
                  optionClassName="flowchart-journey-option"
                  optionActiveClassName="flowchart-journey-option-active"
                />
              ) : (
                <div
                  className="flowchart-dock-journey-title"
                  data-testid="flowchart-dock-journey-title"
                  title={currentJourney.label}
                >
                  {currentJourney.label}
                </div>
              )}
            </div>
            <div className="flowchart-dock-playback">
              <PlaybackControls
                currentJourney={currentJourney}
                currentStep={playback.currentStep}
                isPlaying={playback.isPlaying}
                handlePlay={playback.handlePlay}
                handlePause={playback.handlePause}
                handleNext={playback.handleNext}
                handlePrev={playback.handlePrev}
                handleReset={playback.handleReset}
              />
              <Button
                size="icon"
                variant="ghost"
                className="flowchart-btn flowchart-dock-collapse"
                onClick={() => setIsDockCollapsed(true)}
                data-testid="flowchart-dock-collapse"
                aria-label="Collapse journey panel"
                title="Collapse journey panel"
                aria-expanded={true}
              >
                <Icons.ChevronDown size={16} />
              </Button>
            </div>
          </div>
          {currentJourney.description && (
            <div
              className="flowchart-journey-description"
              data-testid="flowchart-journey-description"
              title={currentJourney.description}
            >
              {currentJourney.description}
            </div>
          )}
        </div>
      )}
      <StepCarousel
        activeSteps={activeSteps}
        activeStep={activeStep}
        handleStepClick={handleStepClick}
        instanceId={instanceId}
        inline={true}
      />
    </div>
  );

  return (
    <div className={`flowchart-section${isFullscreen ? ' fullscreen' : ''}`} data-testid="flowchart-section">
      <SectionTitleBar title={title} sectionIndex={sectionIndex} HelpModal={FlowchartHelpModal} titleTestId="flowchart-title" />

      {/* Canvas View */}
      <div className="flowchart-canvas-wrapper" style={{ position: 'relative' }}>
        <FlowchartView
          viewKey={activeViewKey}
          schema={localSchema}
          activeNodeIds={resolvedHighlights.activeNodeIds}
          activeRelationIds={resolvedHighlights.activeRelationIds}
          highlightedNodeId={highlightedNodeId}
          prevHighlightedNodeId={prevHighlightedNodeId}
          currentStep={playback.currentStep}
          handleNodeClick={handleNodeClick}
          instanceId={instanceId}
          isGridMode={false}
          isFullscreen={isFullscreen}
          activeNodePopup={activeNodePopup}
          setActiveNodePopup={setActiveNodePopup}
          currentJourneyId={playback.currentJourneyId}
          onEnterFullscreen={() => setIsFullscreen(true)}
          focusAfterViewSwitch={focusAfterViewSwitch}
          onCameraFocused={() => setFocusAfterViewSwitch(null)}
          onCameraControls={setCameraControls}
        />

        {/* Canvas tools - fullscreen + zoom, stacked vertically top-left */}
        <div className="flowchart-canvas-tools" data-testid="flowchart-canvas-tools">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="flowchart-canvas-tool-btn"
            data-testid={isFullscreen ? 'flowchart-fullscreen-exit' : 'flowchart-fullscreen-toggle'}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            aria-label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>
          {cameraControls && (
            <div className="flowchart-canvas-tool-group" role="group" aria-label="Zoom">
              <button
                onClick={cameraControls.handleZoomIn}
                className="flowchart-canvas-tool-btn"
                data-testid="flowchart-zoom-in"
                title="Zoom In"
                aria-label="Zoom In"
              >
                <Icons.ZoomIn size={16} />
              </button>
              <button
                onClick={cameraControls.handleZoomOut}
                className="flowchart-canvas-tool-btn"
                data-testid="flowchart-zoom-out"
                title="Zoom Out"
                aria-label="Zoom Out"
              >
                <Icons.ZoomOut size={16} />
              </button>
              <button
                onClick={cameraControls.handleFitToScreen}
                className="flowchart-canvas-tool-btn"
                data-testid="flowchart-fit-screen"
                title="Fit to Screen"
                aria-label="Fit to Screen"
              >
                <Icons.Locate size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Floating view switcher - top-center */}
        {visibleViewKeys.length > 1 && (
          <div className="flowchart-view-menu" data-testid="flowchart-view-tabs">
            <Tabs
              value={activeViewKey}
              onValueChange={setActiveViewKey}
              variant="pill"
              className="flowchart-view-tabs"
            >
              <TabsList className="flowchart-view-tab-list">
                {actionBarItems.map((item) => (
                  <TabsTrigger
                    key={item.id}
                    value={item.id}
                    className="flowchart-view-tab-trigger"
                    title={item.label}
                  >
                    {item.icon}
                    <span className="ml-1.5 flowchart-view-tab-label">{item.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        )}

        {/* Inspector Toggle Button - Fixed top-right */}
        {isFullscreen && (
          <button
            onClick={() => {
              if (isSidebarOpen) {
                setIsSidebarOpen(false);
                setSidebarManuallyClosed(true);
              } else {
                setIsSidebarOpen(true);
              }
            }}
            className="flowchart-inspector-toggle"
            data-testid="flowchart-sidebar-toggle"
            title={isSidebarOpen ? 'Close Inspector' : 'Open Inspector'}
            aria-label={isSidebarOpen ? 'Close Inspector' : 'Open Inspector'}
            style={isSidebarOpen ? { display: 'none' } : undefined}
          >
            <PanelRight size={16} />
          </button>
        )}

        {/* Inspector Sidebar */}
        {isFullscreen && isSidebarOpen && (
          <InspectorSidebar
            schema={localSchema}
            currentStep={playback.currentStep}
            currentJourneyId={playback.currentJourneyId}
            selectedNodeId={selectedNodeId ?? undefined}
            selectedAggregateId={selectedAggregateId ?? undefined}
            onAggregateChange={setSelectedAggregateId}
            onSwitchView={(viewKey, nodeId) => {
              setActiveViewKey(viewKey);
              setFocusAfterViewSwitch(nodeId);
            }}
            onClose={() => {
              setIsSidebarOpen(false);
              setSidebarManuallyClosed(true);
            }}
          />
        )}

        {/* Floating unified controls dock overlay at bottom-center */}
        <div className="flowchart-controls-dock-container" data-testid="flowchart-controls-dock">
          <AnimatePresence mode="wait" initial={false}>
            {/* The mini player needs a journey to drive; without one the panel stays open */}
            {hasDock && (isDockCollapsed && currentJourney ? (
              <motion.div
                key="mini"
                className="flowchart-controls-dock flowchart-dock-mini"
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={SPRING_PANEL}
              >
                <MiniPlayer
                  currentJourney={currentJourney}
                  currentStep={playback.currentStep}
                  isPlaying={playback.isPlaying}
                  handlePlay={playback.handlePlay}
                  handlePause={playback.handlePause}
                  handleNext={playback.handleNext}
                  handlePrev={playback.handlePrev}
                  handleReset={playback.handleReset}
                  onSelectStep={selectJourneyStep}
                  onExpand={() => setIsDockCollapsed(false)}
                />
              </motion.div>
            ) : (
              <motion.div
                key="panel"
                className="flowchart-controls-dock flowchart-dock-panel"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={SPRING_PANEL}
              >
                {journeyPanel}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {activeStep && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setActiveStep(null);
              playback.resetAll();
            }}
            className="flowchart-btn animate-fade-in"
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              zIndex: 10,
            }}
          >
            Clear Focus &times;
          </Button>
        )}
      </div>


    </div>
  );
}

export default Flowchart;
