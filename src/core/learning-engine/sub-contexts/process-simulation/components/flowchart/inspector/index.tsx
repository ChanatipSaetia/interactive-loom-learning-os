import { useMemo, useState } from 'react';
import { StateMachineWidget } from './state-machine-widget';
import { JsonPayloadViewer } from './json-payload-viewer';
import { Dropdown } from '../../../../../../ui-system/motion/dropdown';
import { stateAtStep } from '../state-at-step';
import { buildCanonicalIdMapper } from '../abstract-flow/derive';
import type {
  UnifiedFlowchartSchema,
  FlowchartStep,
  FlowchartEntity,
  FlowchartStateMachine,
} from '../types';

export type InspectorTab = 'details' | 'state-machine' | 'payload';

export interface InspectorSidebarProps {
  schema: UnifiedFlowchartSchema;
  currentStep: number;
  currentJourneyId: string;
  selectedNodeId?: string | null;
  selectedAggregateId?: string | null;
  onAggregateChange?: (id: string) => void;
  onSwitchView?: (viewKey: string, nodeId: string) => void;
  onClose: () => void;
}

export function InspectorSidebar({
  schema,
  currentStep,
  currentJourneyId,
  selectedNodeId,
  selectedAggregateId: controlledAggregateId,
  onAggregateChange,
  onSwitchView,
  onClose,
}: InspectorSidebarProps) {
  const [activeTab, setActiveTab] = useState<InspectorTab>('details');

  const smEntities = useMemo(() => {
    const smView = schema.views?.STATE_MACHINE;
    if (smView) {
      // Find the aggregate node (non state-node)
      const aggNode = smView.nodes.find(n => !n.id.includes('_state_'));
      if (aggNode) {
        const entity = schema.entities[aggNode.id];
        if (entity) {
          // Construct the FlowchartStateMachine configuration dynamically from state nodes
          const stateNodes = smView.nodes.filter(n => n.id.includes('_state_'));
          const states = stateNodes.map(node => {
            const stateId = node.id.replace(`${aggNode.id}_state_`, '');
            const stateEntity = schema.entities[node.id];
            return {
              id: stateId,
              label: stateEntity?.title || stateId,
              color: stateEntity?.strokeColor || 'var(--ctp-blue)'
            };
          });

          const stateMachine: FlowchartStateMachine = {
            states,
            initialState: states[0]?.id || 'IDLE'
          };

          return [{
            id: aggNode.id,
            title: entity.title,
            stateMachine
          }];
        }
      }
    }

    // Fallback: check static entities
    const result: { id: string; title: string; stateMachine: FlowchartStateMachine }[] = [];
    for (const [id, entity] of Object.entries(schema.entities)) {
      if (entity.stateMachine) {
        result.push({ id, title: entity.title, stateMachine: entity.stateMachine });
      }
    }
    return result;
  }, [schema.entities, schema.views!]);

  const [internalAggregateId, setInternalAggregateId] = useState<string | null>(null);
  const resolvedAggregateId = controlledAggregateId !== undefined
    ? controlledAggregateId
    : internalAggregateId;

  // Auto-select first aggregate on mount if none selected
  if (!internalAggregateId && smEntities.length > 0 && !controlledAggregateId) {
    setInternalAggregateId(smEntities[0].id);
  }

  const selectedEntity = useMemo(() => {
    if (!resolvedAggregateId) return null;
    const smEnt = smEntities.find(e => e.id === resolvedAggregateId);
    return smEnt ? { ...schema.entities[resolvedAggregateId], stateMachine: smEnt.stateMachine } : null;
  }, [resolvedAggregateId, schema.entities, smEntities]);

  const currentStepData = useMemo(() => {
    const journey = schema.journeys.find(j => j.id === currentJourneyId);
    if (!journey || currentStep < 0) return null;
    return journey.steps[currentStep] as FlowchartStep | undefined;
  }, [schema, currentJourneyId, currentStep]);

  const activeStateId = useMemo(() => {
    if (!currentStepData) return null;
    const journey = schema.journeys.find(j => j.id === currentJourneyId);
    return stateAtStep(schema, journey?.steps as FlowchartStep[] | undefined, currentStep, selectedEntity?.stateMachine);
  }, [currentStepData, schema, currentJourneyId, currentStep, selectedEntity]);

  const payloadEntity = useMemo((): FlowchartEntity | null => {
    if (!currentStepData) return null;
    const nodeId = currentStepData.nodeIds?.[0];
    if (!nodeId) return null;
    const entity = schema.entities[nodeId];
    if (entity?.jsonPayload) return entity;
    const ids = currentStepData.nodeIds || [];
    for (const id of ids) {
      const e = schema.entities[id];
      if (e?.jsonPayload) return e;
    }
    return null;
  }, [currentStepData, schema]);

  const handleAggregateChange = (id: string) => {
    if (controlledAggregateId === undefined) {
      setInternalAggregateId(id);
    }
    onAggregateChange?.(id);
  };

  // Resolve the entity to show in Details tab
  const detailsEntity = useMemo((): FlowchartEntity | null => {
    if (selectedNodeId) {
      let entity = schema.entities[selectedNodeId];
      if (!entity) return null;
      const getCanonicalId = buildCanonicalIdMapper(schema.entities);
      const canonicalId = getCanonicalId(selectedNodeId);
      if (canonicalId !== selectedNodeId) {
        const canonical = schema.entities[canonicalId];
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
      return entity;
    }
    // Fall back to current playback step's node
    if (currentStepData) {
      const nodeId = currentStepData.nodeIds?.[0];
      if (nodeId) {
        return schema.entities[nodeId] || null;
      }
    }
    return null;
  }, [selectedNodeId, schema.entities, currentStepData]);

  // Derive related views for the selected entity
  const relatedViews = useMemo(() => {
    if (!detailsEntity || !onSwitchView) return [];
    const viewTypes = detailsEntity.viewTypes || {};
    return Object.keys(viewTypes)
      .filter(vk => {
        if (!schema.views![vk]) return false;
        if (vk === 'STATE_MACHINE') return false;
        return true;
      })
      .map(vk => ({
        key: vk,
        name: schema.views![vk].name,
        titleInView: detailsEntity.viewTitles?.[vk] || detailsEntity.title,
        typeInView: viewTypes[vk]
      }));
  }, [detailsEntity, schema.views!, onSwitchView]);

  const tabs: { id: InspectorTab; label: string }[] = [
    { id: 'details', label: 'Details' },
    { id: 'state-machine', label: 'States' },
    { id: 'payload', label: 'Payload' },
  ];

  const handleRelatedViewClick = (viewKey: string) => {
    if (onSwitchView && detailsEntity) {
      onSwitchView(viewKey, selectedNodeId || '');
    }
  };

  // A state can link to the STATE_MACHINE view when that view exists and a
  // state-machine aggregate is selected.
  const canLinkToStateMachine = !!onSwitchView && !!schema.views!['STATE_MACHINE'] && !!resolvedAggregateId;

  const handleStateClick = (stateId: string) => {
    if (!onSwitchView || !resolvedAggregateId) return;
    onSwitchView('STATE_MACHINE', `${resolvedAggregateId}_state_${stateId}`);
  };

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
        {activeTab === 'details' && (
          <div className="inspector-widget-container" data-testid="inspector-widget-details">
            {detailsEntity ? (
              <>
                <div className="flowchart-sidebar-section-header">
                  <h2>{detailsEntity.title}</h2>
                </div>
                {detailsEntity.desc && (
                  <div data-testid="details-description">
                    <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.5', color: 'var(--ctp-subtext1)' }}>
                      {detailsEntity.desc}
                    </p>
                  </div>
                )}
                {relatedViews.length > 0 && (
                  <div style={{ marginTop: '12px', borderTop: '1px solid var(--border-light)', paddingTop: '8px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--ctp-overlay1)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                      Related Views
                    </div>
                    <div data-testid="details-related-views" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {relatedViews.map(v => (
                        <button
                          key={v.key}
                          onClick={() => handleRelatedViewClick(v.key)}
                          data-testid={`details-related-view-${v.key}`}
                          style={{
                            background: 'var(--ctp-surface0)',
                            border: '1px solid var(--border-light)',
                            borderRadius: '4px',
                            color: 'var(--ctp-text)',
                            padding: '6px 10px',
                            fontSize: '13px',
                            textAlign: 'left',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px'
                          }}
                          onMouseEnter={(e) => {
                            const btn = e.currentTarget;
                            if (btn) btn.style.borderColor = 'var(--primary)';
                          }}
                          onMouseLeave={(e) => {
                            const btn = e.currentTarget;
                            if (btn) btn.style.borderColor = 'var(--border-light)';
                          }}
                        >
                          <span style={{ fontWeight: '600', color: 'var(--primary)' }}>{v.name}</span>
                          <span style={{ fontSize: '11px', color: 'var(--ctp-subtext0)' }}>
                            {v.titleInView} {v.typeInView && <span style={{ opacity: 0.7, fontSize: '10px', fontFamily: 'var(--font-mono)' }}>({v.typeInView})</span>}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div data-testid="details-empty">
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--ctp-subtext1)' }}>
                  Select a node to view details
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'state-machine' && (
          <div className="inspector-widget-container" data-testid="inspector-widget-state-machine">
            {smEntities.length > 1 && (
              <div className="flowchart-sidebar-section-header">
                <h2>Aggregate</h2>
              </div>
            )}
            {smEntities.length > 0 && (
              <div className="inspector-aggregate-selector" data-testid="inspector-aggregate-selector">
                <Dropdown
                  value={resolvedAggregateId || smEntities[0]?.id || ''}
                  onChange={handleAggregateChange}
                  options={smEntities.map(opt => ({ value: opt.id, label: opt.title }))}
                  data-testid="inspector-aggregate-select"
                  native={true}
                  showChevron={false}
                  triggerClassName="flowchart-journey-select"
                  className="flowchart-journey-dropdown"
                  optionsClassName="flowchart-journey-options"
                  optionClassName="flowchart-journey-option"
                />
              </div>
            )}
            {selectedEntity && selectedEntity.stateMachine && (
              <>
                <div className="flowchart-sidebar-section-header">
                  <h2>{selectedEntity.title} Lifecycle</h2>
                </div>
                <StateMachineWidget
                  stateMachine={selectedEntity.stateMachine}
                  activeStateId={activeStateId}
                  onStateClick={canLinkToStateMachine ? handleStateClick : undefined}
                />
                {!currentStepData && (
                  <div className="inspector-state-hint" data-testid="state-machine-hint">
                    Advance playback to see state transitions
                  </div>
                )}
              </>
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
      </div>
    </div>
  );
}
