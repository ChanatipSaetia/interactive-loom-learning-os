import { useState, useCallback } from 'react'
import { Sparkles, BookOpen, Target, Lightbulb, MapPin, Plus, Trash2, HelpCircle } from 'lucide-react'
import type { OKFIntroSectionData, OKFIntroRoadmapStep } from '../../../core/okf/types'
import { IntroHelpModal } from '../../../sections/intro/IntroHelpModal'

interface IntroFormEditorProps {
  data: OKFIntroSectionData
  onChange: (data: OKFIntroSectionData) => void
}

export function IntroFormEditor({ data, onChange }: IntroFormEditorProps) {
  const [isHelpOpen, setIsHelpOpen] = useState(false)

  const what = data.what || { summary: '' }
  const why = data.why || { summary: '' }
  const roadmap = data.roadmap || []

  // --- Handlers ---
  const handleHeroChange = useCallback(
    (field: keyof OKFIntroSectionData, value: unknown) => {
      onChange({
        ...data,
        [field]: value,
      })
    },
    [data, onChange]
  )

  const handleWhatChange = useCallback(
    (field: string, value: unknown) => {
      onChange({
        ...data,
        what: {
          ...what,
          [field]: value,
        },
      })
    },
    [data, what, onChange]
  )

  const handleWhyChange = useCallback(
    (field: string, value: unknown) => {
      onChange({
        ...data,
        why: {
          ...why,
          [field]: value,
        },
      })
    },
    [data, why, onChange]
  )

  // --- Bullets & Tags Handlers ---
  const handleAddBullet = useCallback(() => {
    const currentBullets = what.bullets || []
    handleWhatChange('bullets', [...currentBullets, 'New learning point'])
  }, [what.bullets, handleWhatChange])

  const handleRemoveBullet = useCallback(
    (idx: number) => {
      const currentBullets = (what.bullets || []).filter((_, i) => i !== idx)
      handleWhatChange('bullets', currentBullets)
    },
    [what.bullets, handleWhatChange]
  )

  const handleAddTag = useCallback(() => {
    const currentTags = what.tags || []
    handleWhatChange('tags', [...currentTags, 'new-tag'])
  }, [what.tags, handleWhatChange])

  const handleRemoveTag = useCallback(
    (idx: number) => {
      const currentTags = (what.tags || []).filter((_, i) => i !== idx)
      handleWhatChange('tags', currentTags)
    },
    [what.tags, handleWhatChange]
  )

  // --- Roadmap Handlers ---
  const handleAddRoadmapStep = useCallback(() => {
    const stepNum = roadmap.length + 1
    const newStep: OKFIntroRoadmapStep = {
      sectionId: `section-${stepNum}`,
      title: `Step ${stepNum} Title`,
      type: 'flowchart',
      description: 'Step overview description',
    }
    onChange({
      ...data,
      roadmap: [...roadmap, newStep],
    })
  }, [data, roadmap, onChange])

  const handleRemoveRoadmapStep = useCallback(
    (idx: number) => {
      const updated = roadmap.filter((_, i) => i !== idx)
      onChange({
        ...data,
        roadmap: updated,
      })
    },
    [data, roadmap, onChange]
  )

  const handleRoadmapStepChange = useCallback(
    (idx: number, updatedStep: OKFIntroRoadmapStep) => {
      const updated = [...roadmap]
      updated[idx] = updatedStep
      onChange({
        ...data,
        roadmap: updated,
      })
    },
    [data, roadmap, onChange]
  )

  return (
    <div className="visual-form intro-form-editor" data-testid="intro-form-editor">
      {/* Header & Guide Button */}
      <div className="visual-form-section-header" style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={16} className="text-primary" />
          <span className="visual-form-key" style={{ fontSize: '14px' }}>Intro Section Editor</span>
        </div>
        <button
          className="intro-help-btn"
          onClick={() => setIsHelpOpen(true)}
          data-testid="intro-editor-help-btn"
          type="button"
        >
          <HelpCircle size={13} />
          <span>Guide</span>
        </button>
      </div>

      <IntroHelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {/* Hero Metadata Card */}
      <div className="visual-form-card" data-testid="intro-hero-card">
        <div className="visual-form-card-header">
          <span className="card-header-title">
            <Sparkles size={14} /> Hero Header & Badges
          </span>
        </div>
        <div className="visual-form-card-body">
          <div className="visual-form-grid-2">
            <div className="visual-form-field">
              <label className="visual-form-label">
                <span className="visual-form-key">Module Title</span>
                <input
                  className="visual-form-input"
                  value={data.title || ''}
                  onChange={(e) => handleHeroChange('title', e.target.value || undefined)}
                  placeholder="Topic Title"
                  data-testid="intro-field-title"
                />
              </label>
            </div>
            <div className="visual-form-field">
              <label className="visual-form-label">
                <span className="visual-form-key">Subtitle</span>
                <input
                  className="visual-form-input"
                  value={data.subtitle || ''}
                  onChange={(e) => handleHeroChange('subtitle', e.target.value || undefined)}
                  placeholder="Topic Subtitle"
                  data-testid="intro-field-subtitle"
                />
              </label>
            </div>
          </div>
          <div className="visual-form-grid-2">
            <div className="visual-form-field">
              <label className="visual-form-label">
                <span className="visual-form-key">Estimated Time</span>
                <input
                  className="visual-form-input"
                  value={data.estimatedTime || ''}
                  onChange={(e) => handleHeroChange('estimatedTime', e.target.value || undefined)}
                  placeholder="e.g. 15 mins"
                  data-testid="intro-field-estimatedTime"
                />
              </label>
            </div>
            <div className="visual-form-field">
              <label className="visual-form-label">
                <span className="visual-form-key">Module Count</span>
                <input
                  type="number"
                  className="visual-form-input"
                  value={data.moduleCount ?? ''}
                  onChange={(e) =>
                    handleHeroChange(
                      'moduleCount',
                      e.target.value ? parseInt(e.target.value, 10) : undefined
                    )
                  }
                  placeholder="Number of modules"
                  data-testid="intro-field-moduleCount"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Concept Definition Card */}
      <div className="visual-form-card" data-testid="intro-definition-card">
        <div className="visual-form-card-header">
          <span className="card-header-title">
            <BookOpen size={14} /> Concept Definition
          </span>
        </div>
        <div className="visual-form-card-body">
          <div className="visual-form-field">
            <label className="visual-form-label">
              <span className="visual-form-key">Formal Definition (what.definition)</span>
              <textarea
                className="visual-form-textarea"
                value={what.definition || ''}
                onChange={(e) => handleWhatChange('definition', e.target.value || undefined)}
                rows={2}
                placeholder="Core definition statement"
                data-testid="intro-field-definition"
              />
            </label>
          </div>
        </div>
      </div>

      {/* What This Covers Card */}
      <div className="visual-form-card" data-testid="intro-what-card">
        <div className="visual-form-card-header">
          <span className="card-header-title">
            <Target size={14} /> What This Covers
          </span>
        </div>
        <div className="visual-form-card-body">
          <div className="visual-form-field">
            <label className="visual-form-label">
              <span className="visual-form-key">Summary (what.summary)</span>
              <textarea
                className="visual-form-textarea"
                value={what.summary || ''}
                onChange={(e) => handleWhatChange('summary', e.target.value)}
                rows={2}
                placeholder="High-level overview of covered concepts"
                data-testid="intro-field-what-summary"
              />
            </label>
          </div>

          {/* Bullets List */}
          <div className="visual-form-field">
            <div className="visual-form-section-header">
              <span className="visual-form-key">Bullet Points ({(what.bullets || []).length})</span>
              <button
                className="form-add-btn form-add-btn--sm"
                onClick={handleAddBullet}
                data-testid="intro-add-bullet"
                type="button"
              >
                <Plus size={12} /> Add Bullet
              </button>
            </div>
            <div className="visual-form-object-list">
              {(what.bullets || []).map((bullet, idx) => (
                <div key={idx} className="visual-form-grid-2" style={{ alignItems: 'center' }}>
                  <input
                    className="visual-form-input"
                    value={bullet}
                    onChange={(e) => {
                      const updated = [...(what.bullets || [])]
                      updated[idx] = e.target.value
                      handleWhatChange('bullets', updated)
                    }}
                    data-testid={`intro-bullet-${idx}`}
                  />
                  <button
                    className="form-remove-btn"
                    onClick={() => handleRemoveBullet(idx)}
                    data-testid={`intro-remove-bullet-${idx}`}
                    type="button"
                    title="Remove bullet"
                    style={{ width: '32px' }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Tags List */}
          <div className="visual-form-field">
            <div className="visual-form-section-header">
              <span className="visual-form-key">Topic Tags ({(what.tags || []).length})</span>
              <button
                className="form-add-btn form-add-btn--sm"
                onClick={handleAddTag}
                data-testid="intro-add-tag"
                type="button"
              >
                <Plus size={12} /> Add Tag
              </button>
            </div>
            <div className="visual-form-object-list">
              {(what.tags || []).map((tag, idx) => (
                <div key={idx} className="visual-form-grid-2" style={{ alignItems: 'center' }}>
                  <input
                    className="visual-form-input"
                    value={tag}
                    onChange={(e) => {
                      const updated = [...(what.tags || [])]
                      updated[idx] = e.target.value
                      handleWhatChange('tags', updated)
                    }}
                    data-testid={`intro-tag-${idx}`}
                  />
                  <button
                    className="form-remove-btn"
                    onClick={() => handleRemoveTag(idx)}
                    data-testid={`intro-remove-tag-${idx}`}
                    type="button"
                    title="Remove tag"
                    style={{ width: '32px' }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Why It Matters Card */}
      <div className="visual-form-card" data-testid="intro-why-card">
        <div className="visual-form-card-header">
          <span className="card-header-title">
            <Lightbulb size={14} /> Why It Matters
          </span>
        </div>
        <div className="visual-form-card-body">
          <div className="visual-form-field">
            <label className="visual-form-label">
              <span className="visual-form-key">Rationale (why.summary)</span>
              <textarea
                className="visual-form-textarea"
                value={why.summary || ''}
                onChange={(e) => handleWhyChange('summary', e.target.value)}
                rows={2}
                placeholder="Why this concept is important"
                data-testid="intro-field-why-summary"
              />
            </label>
          </div>
          <div className="visual-form-field">
            <label className="visual-form-label">
              <span className="visual-form-key">Key Takeaway (why.impact)</span>
              <input
                className="visual-form-input"
                value={why.impact || ''}
                onChange={(e) => handleWhyChange('impact', e.target.value || undefined)}
                placeholder="Single bold impact takeaway sentence"
                data-testid="intro-field-why-impact"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Learning Roadmap Card */}
      <div className="visual-form-card" data-testid="intro-roadmap-card">
        <div className="visual-form-card-header">
          <span className="card-header-title">
            <MapPin size={14} /> Learning Roadmap Pipeline ({roadmap.length})
          </span>
          <button
            className="form-add-btn"
            onClick={handleAddRoadmapStep}
            data-testid="intro-add-roadmap-step"
            type="button"
          >
            <Plus size={13} /> Add Roadmap Step
          </button>
        </div>
        <div className="visual-form-card-body">
          <div className="visual-form-object-list">
            {roadmap.map((step, idx) => (
              <div className="visual-form-card visual-form-card--sub" key={idx} data-testid={`intro-roadmap-step-${idx}`}>
                <div className="visual-form-card-header">
                  <span className="card-header-title">
                    Step #{idx + 1}: <code className="card-code-pill">{step.title}</code> ({step.type})
                  </span>
                  <button
                    className="form-remove-btn"
                    onClick={() => handleRemoveRoadmapStep(idx)}
                    data-testid={`intro-remove-roadmap-step-${idx}`}
                    type="button"
                    title="Remove step"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                <div className="visual-form-card-body">
                  <div className="visual-form-grid-3">
                    <div className="visual-form-field">
                      <label className="visual-form-label">
                        <span className="visual-form-key">Section ID</span>
                        <input
                          className="visual-form-input"
                          value={step.sectionId || ''}
                          onChange={(e) =>
                            handleRoadmapStepChange(idx, {
                              ...step,
                              sectionId: e.target.value || undefined,
                            })
                          }
                          placeholder="e.g. flowchart"
                          data-testid={`intro-roadmap-${idx}-sectionId`}
                        />
                      </label>
                    </div>
                    <div className="visual-form-field">
                      <label className="visual-form-label">
                        <span className="visual-form-key">Title</span>
                        <input
                          className="visual-form-input"
                          value={step.title}
                          onChange={(e) =>
                            handleRoadmapStepChange(idx, {
                              ...step,
                              title: e.target.value,
                            })
                          }
                          placeholder="Step title"
                          data-testid={`intro-roadmap-${idx}-title`}
                        />
                      </label>
                    </div>
                    <div className="visual-form-field">
                      <label className="visual-form-label">
                        <span className="visual-form-key">Type</span>
                        <input
                          className="visual-form-input"
                          value={step.type}
                          onChange={(e) =>
                            handleRoadmapStepChange(idx, {
                              ...step,
                              type: e.target.value,
                            })
                          }
                          placeholder="e.g. flowchart, quiz"
                          data-testid={`intro-roadmap-${idx}-type`}
                        />
                      </label>
                    </div>
                  </div>
                  <div className="visual-form-field">
                    <label className="visual-form-label">
                      <span className="visual-form-key">Description</span>
                      <input
                        className="visual-form-input"
                        value={step.description}
                        onChange={(e) =>
                          handleRoadmapStepChange(idx, {
                            ...step,
                            description: e.target.value,
                          })
                        }
                        placeholder="Overview of this step"
                        data-testid={`intro-roadmap-${idx}-desc`}
                      />
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
