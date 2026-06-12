import React from 'react';
import { X, Plus, Trash2, CheckSquare, Square } from 'lucide-react';
import { TYPES } from './types';
import type { UnifiedFlowchartSchema, FlowchartViewConfig } from './types';

interface FlowchartSidebarProps {
  isEditMode: boolean;
  selectedId: string | null;
  activeTab: string;
  localSchema: UnifiedFlowchartSchema;
  activeViewKey: string;
  activeView: FlowchartViewConfig;
  viewKeys: string[];
  setSelectedId: (id: string | null) => void;
  setActiveTab: (tab: string) => void;
  setLocalSchema: React.Dispatch<React.SetStateAction<UnifiedFlowchartSchema>>;
  addEntity: () => void;
  updateEntity: (id: string, field: string, value: string) => void;
  deleteEntity: (id: string) => void;
}

export function FlowchartSidebar({
  isEditMode,
  selectedId,
  activeTab,
  localSchema,
  activeViewKey,
  activeView,
  viewKeys,
  setSelectedId,
  setActiveTab,
  setLocalSchema,
  addEntity,
  updateEntity,
  deleteEntity
}: FlowchartSidebarProps) {
  if (!isEditMode) return null;

  return (
    <div className={`flowchart-sidebar ${selectedId ? 'active' : ''}`} style={{ display: selectedId ? 'flex' : 'none' }}>
      <div className="flowchart-sidebar-tabs">
        {[
          { id: 'entities', label: 'Entities' },
          { id: 'relations', label: 'Relations' },
          { id: 'groups', label: 'Groups' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => { setActiveTab(t.id); }}
            className={`flowchart-sidebar-tab-btn ${activeTab === t.id ? 'active' : ''}`}
          >
            {t.label}
          </button>
        ))}
        <button onClick={() => setSelectedId(null)} className="flowchart-sidebar-close" aria-label="Close sidebar"><X size={16} /></button>
      </div>

      <div className="flowchart-sidebar-content">
        {/* ENTITIES TAB */}
        {activeTab === 'entities' && selectedId && localSchema.entities[selectedId] && (
          <div className="flowchart-sidebar-form">
            <div className="flowchart-sidebar-section-header">
              <h2>Edit Entity</h2>
              <button onClick={addEntity} className="flowchart-sidebar-add-btn" title="Add Entity"><Plus size={14} /></button>
            </div>
            <div className="flowchart-form-group">
              <label>Title</label>
              <input
                type="text"
                value={localSchema.entities[selectedId]?.title || ''}
                onChange={e => updateEntity(selectedId, 'title', e.target.value)}
              />
            </div>
            <div className="flowchart-form-group">
              <label>Description (Tooltip)</label>
              <textarea
                value={localSchema.entities[selectedId]?.desc || ''}
                onChange={e => updateEntity(selectedId, 'desc', e.target.value)}
              />
            </div>
            <div className="flowchart-projections-box">
              <h3>View Stereotypes</h3>
              {viewKeys.map(vKey => (
                <div key={vKey} className="flowchart-projection-row">
                  <label>{localSchema.views[vKey]?.name}</label>
                  <select
                    value={localSchema.entities[selectedId]?.viewTypes[vKey] || ''}
                    onChange={e => updateEntity(selectedId, `viewTypes.${vKey}`, e.target.value)}
                  >
                    <option value="">-- Exclude --</option>
                    {Object.values(TYPES).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <button onClick={() => deleteEntity(selectedId)} className="flowchart-sidebar-danger-btn"><Trash2 size={14} /> Delete Entity</button>
          </div>
        )}

        {/* RELATIONS TAB */}
        {activeTab === 'relations' && (
          <div className="flowchart-sidebar-form">
            <h2>Connections</h2>
            <div className="flowchart-relation-builder">
              <h3>Create Connection</h3>
              <div className="flowchart-relation-inputs">
                <select id="relFrom" className="flowchart-relation-select">
                  <option value="">Source...</option>
                  {activeView.nodes.map(n => <option key={n.id} value={n.id}>{localSchema.entities[n.id]?.title}</option>)}
                </select>
                <span className="arrow-divider">&rarr;</span>
                <select id="relTo" className="flowchart-relation-select">
                  <option value="">Target...</option>
                  {activeView.nodes.map(n => <option key={n.id} value={n.id}>{localSchema.entities[n.id]?.title}</option>)}
                </select>
              </div>
              <button
                onClick={() => {
                  const fromEl = document.getElementById('relFrom') as HTMLSelectElement | null;
                  const toEl = document.getElementById('relTo') as HTMLSelectElement | null;
                  const f = fromEl?.value;
                  const t = toEl?.value;
                  if (f && t && f !== t) {
                    setLocalSchema(p => {
                      const n = JSON.parse(JSON.stringify(p)) as UnifiedFlowchartSchema;
                      n.relations.push({ id: `rel_${Date.now()}`, from: f, to: t, views: [activeViewKey] });
                      return n;
                    });
                  }
                }}
                className="flowchart-sidebar-primary-btn"
              >
                Add Connection
              </button>
            </div>

            <div className="flowchart-sidebar-list">
              {localSchema.relations.filter(r => r.views.includes(activeViewKey)).map(rel => (
                <div key={rel.id} className="flowchart-relation-item">
                  <div className="flowchart-relation-label">
                    <span>{localSchema.entities[rel.from]?.title || 'Unknown'}</span>
                    <span className="arrow-symbol">&rarr;</span>
                    <span>{localSchema.entities[rel.to]?.title || 'Unknown'}</span>
                  </div>
                  <button
                    onClick={() => setLocalSchema(p => {
                      const n = JSON.parse(JSON.stringify(p)) as UnifiedFlowchartSchema;
                      n.relations = n.relations.filter(r => r.id !== rel.id);
                      return n;
                    })}
                    className="flowchart-delete-link-btn"
                    aria-label="Delete connection"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* GROUPS TAB */}
        {activeTab === 'groups' && (
          <div className="flowchart-sidebar-form">
            <div className="flowchart-sidebar-section-header">
              <h2>Groups & Swimlanes</h2>
              <button
                onClick={() => {
                  const id = `g_${Date.now()}`;
                  setLocalSchema(p => {
                    const n = JSON.parse(JSON.stringify(p)) as UnifiedFlowchartSchema;
                    n.views[activeViewKey]?.groups.push({
                      id,
                      title: 'New Group',
                      desc: '',
                      nodeIds: [],
                      color: 'rgba(96, 165, 250, 0.08)',
                      borderColor: '#93c5fd',
                      textColor: '#1e40af',
                      isLane: false,
                      y: 100,
                      h: 200
                    });
                    return n;
                  });
                  setSelectedId(id);
                }}
                className="flowchart-sidebar-add-btn"
                title="Add Group"
              >
                <Plus size={14} />
              </button>
            </div>

            {selectedId && activeView.groups.find(g => g.id === selectedId) ? (() => {
              const group = activeView.groups.find(g => g.id === selectedId)!;
              return (
                <div className="flowchart-sidebar-form">
                  <button onClick={() => setSelectedId(null)} className="flowchart-sidebar-back">&larr; Back to list</button>
                  <div className="flowchart-form-group">
                    <label>Group Title</label>
                    <input
                      type="text"
                      value={group.title || ''}
                      onChange={e => {
                        setLocalSchema(p => {
                          const n = JSON.parse(JSON.stringify(p)) as UnifiedFlowchartSchema;
                          const target = n.views[activeViewKey]?.groups.find(g => g.id === selectedId);
                          if (target) target.title = e.target.value;
                          return n;
                        });
                      }}
                    />
                  </div>
                  <div className="flowchart-form-group">
                    <label>Description (Tooltip)</label>
                    <textarea
                      value={group.desc || ''}
                      onChange={e => {
                        setLocalSchema(p => {
                          const n = JSON.parse(JSON.stringify(p)) as UnifiedFlowchartSchema;
                          const target = n.views[activeViewKey]?.groups.find(g => g.id === selectedId);
                          if (target) target.desc = e.target.value;
                          return n;
                        });
                      }}
                    />
                  </div>
                  <label className="flowchart-checkbox-row">
                    <input
                      type="checkbox"
                      checked={group.isLane || false}
                      onChange={e => {
                        setLocalSchema(p => {
                          const n = JSON.parse(JSON.stringify(p)) as UnifiedFlowchartSchema;
                          const target = n.views[activeViewKey]?.groups.find(g => g.id === selectedId);
                          if (target) target.isLane = e.target.checked;
                          return n;
                        });
                      }}
                    />
                    <span>Render as Swimlane</span>
                  </label>

                  {!group.isLane && (
                    <div className="flowchart-node-assign-list">
                      <label>Assigned Nodes</label>
                      <div className="flowchart-checkbox-container">
                        {activeView.nodes.map(n => {
                          const isChecked = group.nodeIds?.includes(n.id) || false;
                          return (
                            <label key={n.id} className="flowchart-checkbox-item">
                              <span className={`checkbox-icon ${isChecked ? 'checked' : ''}`}>
                                {isChecked ? <CheckSquare size={14} /> : <Square size={14} />}
                              </span>
                              <span className="label-text">{localSchema.entities[n.id]?.title}</span>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={e => {
                                  setLocalSchema(p => {
                                    const nxt = JSON.parse(JSON.stringify(p)) as UnifiedFlowchartSchema;
                                    const g = nxt.views[activeViewKey]?.groups.find(gx => gx.id === selectedId);
                                    if (g) {
                                      if (!g.nodeIds) g.nodeIds = [];
                                      if (e.target.checked) g.nodeIds.push(n.id);
                                      else g.nodeIds = g.nodeIds.filter(id => id !== n.id);
                                    }
                                    return nxt;
                                  });
                                }}
                              />
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => {
                      setLocalSchema(p => {
                        const n = JSON.parse(JSON.stringify(p)) as UnifiedFlowchartSchema;
                        n.views[activeViewKey].groups = n.views[activeViewKey].groups.filter(g => g.id !== selectedId);
                        return n;
                      });
                      setSelectedId(null);
                    }}
                    className="flowchart-sidebar-danger-btn"
                  >
                    <Trash2 size={14} /> Delete Group
                  </button>
                </div>
              );
            })() : (
              <div className="flowchart-sidebar-list">
                {activeView.groups.map(g => (
                  <div key={g.id} onClick={() => setSelectedId(g.id)} className="flowchart-sidebar-item hoverable">
                    <div className="flowchart-group-meta">
                      <span className="flowchart-sidebar-item-title">{g.title}</span>
                      <span className="flowchart-sidebar-item-subtitle">{g.isLane ? 'Swimlane' : `${g.nodeIds?.length || 0} nodes`}</span>
                    </div>
                    <div className="flowchart-color-indicator" style={{ backgroundColor: g.borderColor || g.color }}></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
