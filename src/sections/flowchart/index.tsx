import { useCallback, useEffect, useMemo, useId, useRef, useState } from 'react';
import * as Icons from 'lucide-react';

import { FlowchartView } from './flowchart-view';
import { PlaybackControls } from './playback-controls';
import { StepCarousel } from './step-carousel';
import { usePlaybackState } from './usePlaybackState';
import { autoDeriveViews } from './derivations';

const Maximize = Icons.Maximize2;
const Minimize = Icons.Minimize2;
const X = Icons.X;

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

export { TYPES, COLORS, BORDER_COLORS, ICONS, ICON_ANIMATIONS, DYNAMIC_ICONS, NODE_W, NODE_H, INITIAL_SCHEMA, PROCESS_GROUP_STATE_MAP };
export type { UnifiedFlowchartSchema, FlowchartEntity, FlowchartRelation, FlowchartViewNode, FlowchartViewGroup, FlowchartStep, FlowchartStepData, FlowchartStepLinear, FlowchartStepBranchOption, FlowchartJourney, FlowchartViewConfig, FlowchartProps, ProcessGroup, FlowchartStateMachineState, FlowchartStateMachine };

const STEP_EVENT_TO_STATE_MAP: Record<string, string> = {
  evt_order_placed: 'PENDING',
  evt_inventory_locked: 'INVENTORY_LOCKED',
  evt_payment_authorized: 'PAYMENT_AUTHORIZED',
  evt_fraud_evaluated: 'FRAUD_CLEARED',
  evt_fraud_flagged: 'FRAUD_REVIEW',
  evt_review_decision: 'FRAUD_REVIEW',
  evt_order_confirmed: 'CONFIRMED',
  evt_order_approved: 'CONFIRMED',
  evt_order_cancelled: 'CANCELLED',

  evt_uploaded: 'QUEUED',
  evt_extracted: 'EXTRACTING',
  evt_validated: 'VALIDATING',
  evt_approved: 'HIGH_CONFIDENCE',
  evt_flagged: 'LOW_CONFIDENCE',
  evt_audited: 'AUDITED',
  evt_completed: 'COMPLETED',

  evt_goal: 'IDLE',
  evt_plan: 'PLANNING',
  evt_exec: 'EXECUTING',
  evt_eval: 'EVALUATING',
  evt_escalate: 'ESCALATED',

  evt_started: 'IDLE',
  evt_reasoned: 'THINKING',
  evt_tool_executed: 'EXECUTING_TOOL',
  evt_done: 'COMPLETED'
};

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
    let entity = localSchema.entities[nodeId];
    if (!entity) return;

    if (entity.collapsedTo) {
      const canonical = localSchema.entities[entity.collapsedTo];
      if (canonical) {
        entity = {
          ...canonical,
          ...entity,
          stateMachine: entity.stateMachine || canonical.stateMachine,
            viewTypes: {
             ...canonical.viewTypes,
             ...entity.viewTypes
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

    const hasSM = !!entity.stateMachine;

    if (typeof x === 'number' && typeof y === 'number') {
      if (isFullscreen) {
        if (otherViews.length > 0 || hasSM) {
          setActiveNodePopup({
            nodeId,
            x,
            y,
            views: otherViews
          });
        }
      } else {
        setActiveNodePopup({
          nodeId,
          x,
          y,
          views: otherViews
        });
      }
    }
  }, [activeViewKey, localSchema.entities, localSchema.views, isFullscreen]);

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

  // Filter visible view tabs to show EVENT_STORMING, SWIMLANES, SYS_ARCH, DATA_FLOW, SEQUENCE
  // unless STATE_MACHINE is active, in which case it is rendered temporarily.
  const visibleViewKeys = useMemo(() => {
    return viewKeys.filter(vk => {
      if (vk === activeViewKey) return true;
      return vk === 'EVENT_STORMING' || vk === 'SWIMLANES' || vk === 'SYS_ARCH' || vk === 'DATA_FLOW' || vk === 'SEQUENCE';
    });
  }, [viewKeys, activeViewKey]);

  return (
    <div className={`flowchart-section${isFullscreen ? ' fullscreen' : ''}`} data-testid="flowchart-section">
      <div className="flowchart-header-container">
        {title && <h3 className="flowchart-title" data-testid="flowchart-title">{title}</h3>}

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Fullscreen toggle */}
          <button
            className="flowchart-fullscreen-toggle"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            data-testid="flowchart-fullscreen-toggle"
          >
            {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
          </button>

          {/* View tabs */}
          {visibleViewKeys.length > 1 && (
            <div className="flowchart-view-tabs" data-testid="flowchart-view-tabs">
              {visibleViewKeys.map(vk => {
                const view = localSchema.views[vk];
                if (!view) return null;
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
          setActiveViewKey={setActiveViewKey}
          activeStateId={activeStateId}
          currentJourneyId={playback.currentJourneyId}
          onEnterFullscreen={() => setIsFullscreen(true)}
        />

        {activeStep && (
          <button
            onClick={() => {
              setActiveStep(null);
              playback.resetAll();
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

        <StepCarousel
          activeSteps={activeSteps}
          activeStep={activeStep}
          handleStepClick={handleStepClick}
          instanceId={instanceId}
        />
      </div>

      {isFullscreen && (
        <button
          className="flowchart-fullscreen-exit"
          onClick={() => setIsFullscreen(false)}
          title="Exit fullscreen (Escape)"
          data-testid="flowchart-fullscreen-exit"
        >
          <X size={14} />
          Exit
        </button>
      )}
    </div>
  );
}

export default Flowchart;
