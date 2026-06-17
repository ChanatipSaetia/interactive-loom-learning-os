import { useMemo, useState } from 'react';
import { StateMachineWidget } from './state-machine-widget';
import { JsonPayloadViewer } from './json-payload-viewer';
import { ERDSchemaWidget } from './erd-schema-widget';
import { PROCESS_GROUP_STATE_MAP } from '../types';
import type {
  UnifiedFlowchartSchema,
  FlowchartStep,
  FlowchartEntity,
} from '../types';

export type InspectorTab = 'state-machine' | 'payload' | 'erd';

export interface InspectorSidebarProps {
  schema: UnifiedFlowchartSchema;
  currentStep: number;
  currentJourneyId: string;
  selectedNodeId: string | null;
  onClose: () => void;
}

export function InspectorSidebar({
  schema,
  currentStep,
  currentJourneyId,
  selectedNodeId,
  onClose,
}: InspectorSidebarProps) {
  const [activeTab, setActiveTab] = useState<InspectorTab>('state-machine');

  // Derive current step data for state machine and JSON payload
  const currentStepData = useMemo(() => {
    const journey = schema.journeys.find(j => j.id === currentJourneyId);
    if (!journey || currentStep < 0) return null;
    return journey.steps[currentStep] as FlowchartStep | undefined;
  }, [schema, currentJourneyId, currentStep]);

  // Determine active state from process group
  const activeStateId = useMemo(() => {
    if (!currentStepData) return null;
    if (!currentStepData.processGroup) return null;
    return PROCESS_GROUP_STATE_MAP[currentStepData.processGroup] ?? null;
  }, [currentStepData]);

  // Find entity with state machine definition (typically the orchestrator aggregate)
  const stateMachineEntity = useMemo(() => {
    for (const [, entity] of Object.entries(schema.entities)) {
      if (entity.stateMachine) return entity;
    }
    return null;
  }, [schema]);

  // Get the highlighted entity for JSON payload display
  const payloadEntity = useMemo((): FlowchartEntity | null => {
    if (!currentStepData) return null;
    const nodeId = currentStepData.nodeIds?.[0] || currentStepData.nodeId;
    if (!nodeId) return null;
    const entity = schema.entities[nodeId];
    if (entity?.jsonPayload) return entity;
    // Check all nodes in the step for a payload
    const ids = currentStepData.nodeIds || [];
    for (const id of ids) {
      const e = schema.entities[id];
      if (e?.jsonPayload) return e;
    }
    return null;
  }, [currentStepData, schema]);

  // Get the selected entity for ERD display
  const erdEntity = useMemo((): FlowchartEntity | null => {
    if (!selectedNodeId) return null;
    return schema.entities[selectedNodeId] ?? null;
  }, [selectedNodeId, schema]);

  const tabs: { id: InspectorTab; label: string }[] = [
    { id: 'state-machine', label: 'States' },
    { id: 'payload', label: 'Payload' },
    { id: 'erd', label: 'Schema' },
  ];

  return (
    <div className="flowchart-sidebar active inspector-sidebar" data-testid="inspector-sidebar">
      <div className="flowchart-sidebar-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flowchart-sidebar-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            data-testid={`inspector-tab-${tab.id}`}
          >
            {tab.label}
          </button>
        ))}
        <button
          onClick={onClose}
          className="flowchart-sidebar-close"
          data-testid="inspector-close"
          aria-label="Close inspector"
        >
          ×
        </button>
      </div>
      <div className="flowchart-sidebar-content">
        {activeTab === 'state-machine' && stateMachineEntity && (
          <div className="inspector-widget-container" data-testid="inspector-widget-state-machine">
            <div className="flowchart-sidebar-section-header">
              <h2>{stateMachineEntity.title} Lifecycle</h2>
            </div>
            <StateMachineWidget
              stateMachine={stateMachineEntity.stateMachine!}
              activeStateId={activeStateId}
            />
            {!currentStepData && (
              <div className="inspector-state-hint" data-testid="state-machine-hint">
                Advance playback to see state transitions
              </div>
            )}
          </div>
        )}

        {activeTab === 'payload' && (
          <div className="inspector-widget-container" data-testid="inspector-widget-payload">
            <div className="flowchart-sidebar-section-header">
              <h2>Data Flow Payload</h2>
            </div>
            <JsonPayloadViewer entity={payloadEntity} />
          </div>
        )}

        {activeTab === 'erd' && (
          <div className="inspector-widget-container" data-testid="inspector-widget-erd">
            <div className="flowchart-sidebar-section-header">
              <h2>
                {erdEntity ? `${erdEntity.title} Schema` : 'Entity Schema'}
              </h2>
            </div>
            <ERDSchemaWidget entity={erdEntity} />
            {!selectedNodeId && (
              <div className="inspector-erd-hint" data-testid="erd-schema-hint">
                Click a database or aggregate node to view its schema
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
