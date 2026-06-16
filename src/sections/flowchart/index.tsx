import { useCallback, useEffect, useMemo, useId, useRef, useState } from 'react';
import * as Icons from 'lucide-react';

import { FlowchartView } from './flowchart-view';
import { PlaybackControls } from './playback-controls';
import { StepCarousel } from './step-carousel';
import { usePlaybackState } from './usePlaybackState';

import {
  TYPES,
  COLORS,
  BORDER_COLORS,
  ICONS,
  ICON_ANIMATIONS,
  DYNAMIC_ICONS,
  NODE_W,
  NODE_H,
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
const LayoutGrid = Icons.LayoutGrid;
const Maximize = Icons.Maximize;

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

  // Layout mode state
  const [layoutMode, setLayoutMode] = useState<'single' | 'grid'>('single');

  // Viewport resize listener - fallback to single mode below 1024px
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024 && layoutMode === 'grid') {
        setLayoutMode('single');
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [layoutMode]);

  // Initialize as single if viewport is too small
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setLayoutMode('single');
    }
  }, []);

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

  // Pending focus node ID for view switching
  const pendingFocusNodeIdRef = useRef<string | null>(null);

  const handleNodeClick = useCallback((nodeId: string) => {
    if (layoutMode === 'grid') {
      return;
    }

    const entity = localSchema.entities[nodeId];
    if (!entity) return;

    const otherViews = Object.keys(entity.viewTypes).filter(vk => vk !== activeViewKey && localSchema.views[vk]);

    if (otherViews.length > 0) {
      pendingFocusNodeIdRef.current = nodeId;
      setActiveViewKey(otherViews[0]);
    }
  }, [activeViewKey, localSchema.entities, localSchema.views, layoutMode]);

  const handleStepClick = (step: FlowchartStepLinear | FlowchartStepBranchOption) => {
    if (activeStep?.id === step.id) {
      setActiveStep(null);
      playback.resetAll();
    } else {
      setActiveStep(step);
      const stepIdx = activeSteps.findIndex(s => s.id === step.id);
      if (stepIdx !== -1) {
        // Manual step navigation via carousel
      }
    }
  };

  // Grid view keys (first 4 views, or all if fewer)
  const gridKeys = useMemo(() => {
    return viewKeys.slice(0, 4);
  }, [viewKeys]);

  // For single view mode, we need to use the old usePlayback hook for camera/particles
  // In grid mode, each FlowchartView handles its own camera and particles
  const isGridMode = layoutMode === 'grid' && gridKeys.length >= 2;

  return (
    <div className="flowchart-section" data-testid="flowchart-section">
      <div className="flowchart-header-container">
        {title && <h3 className="flowchart-title" data-testid="flowchart-title">{title}</h3>}

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Layout toggle */}
          {viewKeys.length >= 2 && (
            <div className="flowchart-layout-toggle" data-testid="flowchart-layout-toggle">
              <button
                onClick={() => setLayoutMode('single')}
                className={`flowchart-layout-btn ${layoutMode === 'single' ? 'active' : ''}`}
                data-testid="flowchart-btn-single"
                aria-label="Single Focus View"
              >
                <Maximize size={14} />
                <span>Single</span>
              </button>
              <button
                onClick={() => {
                  if (window.innerWidth >= 1024) {
                    setLayoutMode('grid');
                  }
                }}
                className={`flowchart-layout-btn ${layoutMode === 'grid' ? 'active' : ''}`}
                data-testid="flowchart-btn-grid"
                aria-label="Split Grid View"
              >
                <LayoutGrid size={14} />
                <span>Grid</span>
              </button>
            </div>
          )}

          {/* View tabs (only in single mode) */}
          {!isGridMode && viewKeys.length > 1 && (
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

      {isGridMode ? (
        /* Grid View - 2x2 layout */
        <div className="flowchart-grid-container" data-testid="flowchart-grid-container">
          {gridKeys.map(vk => (
            <FlowchartView
              key={vk}
              viewKey={vk}
              schema={localSchema}
              activeNodeIds={playback.activeNodeIds}
              highlightedNodeId={playback.highlightedNodeId}
              prevHighlightedNodeId={playback.prevHighlightedNodeId}
              currentStep={playback.currentStep}
              handleNodeClick={handleNodeClick}
              instanceId={instanceId}
              isGridMode={true}
            />
          ))}
        </div>
      ) : (
        /* Single View - existing behavior */
        <div className="flowchart-canvas-wrapper" style={{ position: 'relative' }}>
          <FlowchartView
            viewKey={activeViewKey}
            schema={localSchema}
            activeNodeIds={playback.activeNodeIds}
            highlightedNodeId={playback.highlightedNodeId}
            prevHighlightedNodeId={playback.prevHighlightedNodeId}
            currentStep={playback.currentStep}
            handleNodeClick={handleNodeClick}
            instanceId={instanceId}
            isGridMode={false}
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
      )}
    </div>
  );
}

export default Flowchart;
