import { useCallback, useEffect, useMemo, useId, useRef, useState, type ComponentType } from 'react';
import * as Icons from 'lucide-react';
import { Button } from '../../components/motion/button';
import { Dropdown } from '../../components/motion/dropdown';
import { ExpandableActionBar } from '../../components/motion/expandable-action-bar';
import { ExpandableTabs, type ExpandableTabItem } from '../../components/motion/expandable-tabs';

import { FlowchartView } from './flowchart-view';
import { PlaybackControls } from './playback-controls';
import { StepCarousel } from './step-carousel';
import { usePlaybackState } from './usePlaybackState';
import { autoDeriveViews } from './derivations';
import { InspectorSidebar } from './inspector';
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
const X = Icons.X;
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

export function Flowchart({ title, schema = INITIAL_SCHEMA }: FlowchartProps) {
  const rawId = useId();
  const instanceId = useMemo(() => rawId.replace(/:/g, ''), [rawId]);

  const [localSchema, setLocalSchema] = useState<UnifiedFlowchartSchema>(() => autoDeriveViews(schema));

  useEffect(() => {
    setLocalSchema(autoDeriveViews(schema));
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
    const firstWithSM = Object.entries(localSchema.entities).find(([, entity]) => !!entity.stateMachine);
    return firstWithSM ? firstWithSM[0] : null;
  }, [localSchema.entities]);

  const highlightedNodeId = useMemo(() => {
    if (activeViewKey === 'STATE_MACHINE' && activeStateMachineAggregateId) {
      const activeState = activeStateId || localSchema.entities[activeStateMachineAggregateId]?.stateMachine?.initialState;
      if (activeState) {
        return `${activeStateMachineAggregateId}_state_${activeState}`;
      }
    }
    return playback.highlightedNodeId;
  }, [activeViewKey, activeStateMachineAggregateId, activeStateId, playback.highlightedNodeId, localSchema.entities]);

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

    // Canonical id is the collapsed-to id when present (the entity that owns
    // the state machine), otherwise the node id itself.
    const canonicalId = rawEntity.collapsedTo || nodeId;
    let entity = rawEntity;

    if (rawEntity.collapsedTo) {
      const canonical = localSchema.entities[rawEntity.collapsedTo];
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
      .filter(vk => vk !== activeViewKey && localSchema.views[vk])
      .map(vk => ({
        key: vk,
        name: localSchema.views[vk].name,
        type: entity.viewTypes?.[vk] || ''
      }));

    if (isFullscreen) {
      // Select node, open sidebar, switch to Details tab
      setSelectedNodeId(nodeId);
      // When the resolved entity has a state machine, select the canonical
      // aggregate id so the States tab can render its lifecycle.
      if (entity.stateMachine) {
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
  }, [activeViewKey, localSchema.entities, localSchema.views, isFullscreen, sidebarManuallyClosed]);

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

  const [activeDockTabId, setActiveDockTabId] = useState<string | null>(() => {
    return playback.currentJourney ? 'playback' : null;
  });
  const [cameraControls, setCameraControls] = useState<{
    handleZoomIn: () => void;
    handleZoomOut: () => void;
    handleFitToScreen: () => void;
  } | null>(null);

  // Auto-expand Playback tab when a journey is selected
  useEffect(() => {
    if (playback.currentJourneyId) {
      setActiveDockTabId('playback');
    }
  }, [playback.currentJourneyId]);


  const dockTabs = useMemo<ExpandableTabItem[]>(() => {
    const tabs: ExpandableTabItem[] = [];

    // Steps Tab
    if (activeSteps && activeSteps.length > 0) {
      tabs.push({
        id: 'steps',
        label: 'Steps',
        icon: <Icons.Footprints size={14} />,
        testId: 'dock-tab-steps',
        content: (
          <StepCarousel
            activeSteps={activeSteps}
            activeStep={activeStep}
            handleStepClick={handleStepClick}
            instanceId={instanceId}
            inline={true}
          />
        )
      });
    }

    // Playback Tab
    if (playback.currentJourney) {
      tabs.push({
        id: 'playback',
        label: 'Playback',
        icon: <Icons.Play size={14} />,
        testId: 'dock-tab-playback',
        content: (
          <div className="flowchart-dock-playback">
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
          </div>
        )
      });
    }

    // Zoom Tab
    tabs.push({
      id: 'zoom',
      label: 'Zoom',
      icon: <Icons.Search size={14} />,
      testId: 'dock-tab-zoom',
      content: (
        <div className="flowchart-dock-zoom">
          {cameraControls ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
              <Button
                size="sm"
                variant="ghost"
                onClick={cameraControls.handleZoomIn}
                title="Zoom In"
                data-testid="flowchart-zoom-in"
                className="flowchart-btn flex items-center justify-center"
              >
                <Icons.ZoomIn size={14} style={{ marginRight: '6px' }} />
                Zoom In
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={cameraControls.handleZoomOut}
                title="Zoom Out"
                data-testid="flowchart-zoom-out"
                className="flowchart-btn flex items-center justify-center"
              >
                <Icons.ZoomOut size={14} style={{ marginRight: '6px' }} />
                Zoom Out
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={cameraControls.handleFitToScreen}
                title="Fit Screen"
                data-testid="flowchart-fit-screen"
                className="flowchart-btn flex items-center justify-center"
              >
                <Icons.Locate size={14} style={{ marginRight: '6px' }} />
                Fit Screen
              </Button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--ctp-subtext0)', padding: '8px' }}>
              Camera controls not loaded
            </div>
          )}
        </div>
      )
    });

    return tabs;
  }, [activeSteps, activeStep, handleStepClick, instanceId, playback, cameraControls]);

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
      const view = localSchema.views[vk];
      const name = view?.name || vk;
      
      let IconComponent: ComponentType<any> = Workflow;
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
  }, [visibleViewKeys, localSchema.views, activeViewKey]);

  return (
    <div className={`flowchart-section${isFullscreen ? ' fullscreen' : ''}`} data-testid="flowchart-section">
      <div className="flowchart-header-container">
        {title && <h3 className="flowchart-title" data-testid="flowchart-title">{title}</h3>}

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Fullscreen toggle */}
            <Button
              size="sm"
              variant="ghost"
              className="flowchart-fullscreen-toggle"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              data-testid="flowchart-fullscreen-toggle"
            >
              {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
            </Button>

            {/* Inspector sidebar toggle */}
            {isFullscreen && (
              <Button
                size="sm"
                variant="ghost"
                className="flowchart-fullscreen-toggle"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                title={isSidebarOpen ? 'Close inspector' : 'Open inspector'}
                data-testid="flowchart-sidebar-toggle"
              >
                <PanelRight size={14} />
              </Button>
            )}

         </div>
      </div>

      {localSchema.journeys.length > 0 && (
        <div className="flowchart-journey-bar" data-testid="flowchart-journey-bar">
          <div className="flowchart-journey-selector">
            <span className="flowchart-journey-label">Story / Journey:</span>
            <Dropdown
              value={playback.currentJourneyId}
              onChange={(val) => {
                playback.setCurrentJourneyId(val);
                setActiveStep(null);
              }}
              options={localSchema.journeys.map(j => ({ value: j.id, label: j.label }))}
              data-testid="flowchart-journey-select"
              native={true}
              showChevron={false}
              triggerClassName="flowchart-journey-select"
              className="flowchart-journey-dropdown"
              optionsClassName="flowchart-journey-options"
              optionClassName="flowchart-journey-option"
            />
          </div>
          {playback.currentJourney?.description && (
            <div className="flowchart-journey-description" data-testid="flowchart-journey-description">
              {playback.currentJourney.description}
            </div>
          )}
        </div>
      )}

      <div className="flowchart-controls-row">
        {visibleViewKeys.length > 1 && (
          <div className="flowchart-view-selector-wrapper">
            <span className="flowchart-view-selector-label">Select View:</span>
            <ExpandableActionBar
              items={actionBarItems}
              activeId={activeViewKey}
              onAction={(item) => setActiveViewKey(item.id)}
              size="sm"
              className="flowchart-view-action-bar"
              classNames={{
                activeItem: "text-primary font-semibold flowchart-view-tab-active"
              }}
              data-testid="flowchart-view-tabs"
            />
          </div>
        )}
      </div>

      {/* Canvas View */}
      <div className="flowchart-canvas-wrapper" style={{ position: 'relative' }}>
        <FlowchartView
          viewKey={activeViewKey}
          schema={localSchema}
          activeNodeIds={playback.activeNodeIds}
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
          <ExpandableTabs
            tabs={dockTabs}
            activeTabId={activeDockTabId}
            onTabChange={setActiveDockTabId}
            className="flowchart-controls-dock"
            contentClassName="flowchart-controls-dock-content"
          />
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

      {isFullscreen && (
        <Button
          variant="ghost"
          size="sm"
          className="flowchart-fullscreen-exit"
          onClick={() => setIsFullscreen(false)}
          title="Exit fullscreen (Escape)"
          data-testid="flowchart-fullscreen-exit"
        >
          <X size={14} />
          Exit
        </Button>
      )}
    </div>
  );
}

export default Flowchart;
