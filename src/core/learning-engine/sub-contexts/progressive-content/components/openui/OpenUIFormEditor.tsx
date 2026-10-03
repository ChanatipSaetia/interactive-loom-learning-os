import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Blocks, Code2, HelpCircle, Plus, Trash2 } from 'lucide-react'
import { OpenUIHelpModal } from './OpenUIHelpModal'
import type { OKFOpenUISectionData } from '../../../../composition/okf/types'
import type { OUICall, OUIValue } from '../../../openui-kernel'
import {
  parseStandardProgram,
  printStandardProgram,
  standardComponentSchema,
  standardParamOrder,
  type StandardJSONSchema,
} from '../../../../composition/oui/standard'
import { standardOpenUISpec } from '../../openui-standard'
import './openui-form.css'

interface OpenUIFormEditorProps {
  data: OKFOpenUISectionData
  onChange: (data: OKFOpenUISectionData) => void
}

// ============================================================================
// Schema → field kinds
// ============================================================================

type FieldKind =
  | { kind: 'string'; multiline: boolean }
  | { kind: 'enum'; values: string[] }
  | { kind: 'number' }
  | { kind: 'boolean' }
  | { kind: 'component'; choices: string[] }
  | { kind: 'blocks'; choices: string[] }
  | { kind: 'strings' }
  | { kind: 'numbers' }
  | { kind: 'object'; fields: Array<{ name: string; required: boolean }> }
  | { kind: 'json' }
  | { kind: 'code-only' }

const MULTILINE = /text|markdown|description|details|content|codeString|subtitle/i

/** Every component that can stand on its own (anything not only used inside a parent). */
const ALL_COMPONENTS = standardOpenUISpec.componentGroups.flatMap((g) => g.components)

function refName(ref: string): string {
  return ref.replace('#/$defs/', '')
}

function refsOf(schema: StandardJSONSchema | undefined): string[] | null {
  if (!schema) return null
  if (schema.$ref) return [refName(schema.$ref)]
  if (schema.anyOf?.length && schema.anyOf.every((s) => s.$ref)) return schema.anyOf.map((s) => refName(s.$ref!))
  return null
}

function fieldKind(name: string, schema: StandardJSONSchema | undefined): FieldKind {
  if (!schema || Object.keys(schema).length === 0) return { kind: 'json' }
  if (schema.enum) return { kind: 'enum', values: schema.enum.map(String) }
  const refs = refsOf(schema)
  if (refs) return { kind: 'component', choices: refs }
  if (schema.anyOf) return { kind: 'code-only' }
  if (schema.type === 'string') return { kind: 'string', multiline: MULTILINE.test(name) }
  if (schema.type === 'number' || schema.type === 'integer') return { kind: 'number' }
  if (schema.type === 'boolean') return { kind: 'boolean' }
  if (schema.type === 'array') {
    const items = schema.items
    if (!items || Object.keys(items).length === 0) return { kind: 'blocks', choices: ALL_COMPONENTS }
    const itemRefs = refsOf(items)
    if (itemRefs) return { kind: 'blocks', choices: itemRefs }
    if (items.type === 'string' && !items.enum) return { kind: 'strings' }
    if (items.type === 'number' || items.type === 'integer') return { kind: 'numbers' }
    return { kind: 'json' }
  }
  if (schema.type === 'object' && schema.properties) {
    const required = new Set(schema.required ?? [])
    const primitive = Object.values(schema.properties).every((p) => p.type === 'string' || p.type === 'number' || p.type === 'boolean')
    if (primitive) return { kind: 'object', fields: Object.keys(schema.properties).map((n) => ({ name: n, required: required.has(n) })) }
  }
  return { kind: 'json' }
}

interface Param {
  name: string
  required: boolean
  field: FieldKind
}

function paramsOf(component: string): Param[] {
  const schema = standardComponentSchema(component)
  const required = new Set(schema?.required ?? [])
  return standardParamOrder(component).map((name) => ({
    name,
    required: required.has(name),
    field: fieldKind(name, schema?.properties?.[name]),
  }))
}

/** A new component call with its required parameters filled with neutral defaults. */
export function defaultCall(component: string, depth = 0): OUICall {
  const props: Record<string, OUIValue> = {}
  for (const p of paramsOf(component)) {
    if (!p.required) continue
    const f = p.field
    if (f.kind === 'string') props[p.name] = ''
    else if (f.kind === 'enum') props[p.name] = f.values[0]
    else if (f.kind === 'number') props[p.name] = 0
    else if (f.kind === 'boolean') props[p.name] = false
    else if (f.kind === 'component' && depth < 3) props[p.name] = defaultCall(f.choices[0], depth + 1)
    else if (f.kind === 'object') props[p.name] = Object.fromEntries(f.fields.filter((x) => x.required).map((x) => [x.name, ''])) as unknown as OUIValue
    else props[p.name] = []
  }
  return { kind: 'call', component, props }
}

function isCall(value: unknown): value is OUICall {
  return !!value && typeof value === 'object' && (value as OUICall).kind === 'call'
}

/** One-line summary of a block, for its card header. */
function summarize(call: OUICall): string {
  for (const value of Object.values(call.props)) {
    if (typeof value === 'string' && value.trim()) return value.replace(/\s+/g, ' ').slice(0, 70)
  }
  return ''
}

function describe(component: string): string {
  return standardOpenUISpec.components[component]?.description ?? ''
}

// ============================================================================
// Field editors
// ============================================================================

interface FieldProps {
  param: Param
  value: OUIValue
  onChange: (value: OUIValue) => void
  testId: string
  depth: number
}

function Field({ param, value, onChange, testId, depth }: FieldProps) {
  const { field, name, required } = param
  const label = (
    <span className="visual-form-key">
      {name}
      {!required && <span className="openui-form-optional"> (optional)</span>}
    </span>
  )

  switch (field.kind) {
    case 'string':
      return (
        <label className="visual-form-label">
          {label}
          {field.multiline ? (
            <textarea
              className="visual-form-textarea"
              value={typeof value === 'string' ? value : ''}
              rows={Math.max(2, Math.min(8, Math.ceil(String(value ?? '').length / 80) + 1))}
              onChange={(e) => onChange(e.target.value === '' && !required ? undefined : e.target.value)}
              data-testid={testId}
            />
          ) : (
            <input
              className="visual-form-input"
              value={typeof value === 'string' ? value : ''}
              onChange={(e) => onChange(e.target.value === '' && !required ? undefined : e.target.value)}
              data-testid={testId}
            />
          )}
        </label>
      )
    case 'enum':
      return (
        <label className="visual-form-label">
          {label}
          <select
            className="visual-form-select"
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(e.target.value === '' ? undefined : e.target.value)}
            data-testid={testId}
          >
            {!required && <option value="">(default)</option>}
            {field.values.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </label>
      )
    case 'number':
      return (
        <label className="visual-form-label">
          {label}
          <input
            className="visual-form-input"
            type="number"
            value={typeof value === 'number' ? value : ''}
            onChange={(e) => {
              const n = parseFloat(e.target.value)
              onChange(Number.isFinite(n) ? n : required ? 0 : undefined)
            }}
            data-testid={testId}
          />
        </label>
      )
    case 'boolean':
      return (
        <label className="visual-form-label openui-form-inline">
          <input type="checkbox" checked={value === true} onChange={(e) => onChange(e.target.checked ? true : required ? false : undefined)} data-testid={testId} />
          {label}
        </label>
      )
    case 'strings':
    case 'numbers': {
      const list = Array.isArray(value) ? (value as Array<string | number>) : []
      return (
        <label className="visual-form-label">
          {label}
          <textarea
            className="visual-form-textarea"
            value={list.join('\n')}
            rows={Math.max(2, Math.min(8, list.length + 1))}
            placeholder="One per line"
            onChange={(e) => {
              const lines = e.target.value.split('\n')
              onChange(field.kind === 'numbers' ? lines.filter((l) => l.trim() !== '').map((l) => parseFloat(l) || 0) : lines)
            }}
            data-testid={testId}
          />
        </label>
      )
    }
    case 'object': {
      const obj = value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, OUIValue>) : undefined
      return (
        <fieldset className="visual-form-nested">
          <legend>{label}</legend>
          {field.fields.map((f) => (
            <label className="visual-form-label" key={f.name}>
              <span className="visual-form-key">{f.name}</span>
              <input
                className="visual-form-input"
                value={typeof obj?.[f.name] === 'string' ? (obj[f.name] as string) : ''}
                onChange={(e) => {
                  const next = { ...(obj ?? {}), [f.name]: e.target.value }
                  const empty = Object.values(next).every((v) => v === '')
                  onChange(empty && !required ? undefined : (next as unknown as OUIValue))
                }}
                data-testid={`${testId}-${f.name}`}
              />
            </label>
          ))}
        </fieldset>
      )
    }
    case 'component':
      return (
        <div className="visual-form-label">
          {label}
          {isCall(value) ? (
            <BlockCard
              call={value}
              onChange={onChange}
              onRemove={required ? undefined : () => onChange(undefined)}
              testId={testId}
              depth={depth + 1}
            />
          ) : (
            <AddBlock choices={field.choices} onAdd={(c) => onChange(defaultCall(c))} testId={`${testId}-add`} />
          )}
        </div>
      )
    case 'blocks':
      return (
        <div className="visual-form-label">
          {label}
          <BlockList
            blocks={Array.isArray(value) ? (value as OUIValue[]) : []}
            choices={field.choices}
            onChange={(blocks) => onChange(blocks.length === 0 && !required ? undefined : blocks)}
            testId={testId}
            depth={depth + 1}
          />
        </div>
      )
    case 'json':
      return <JsonField label={label} value={value} required={required} onChange={onChange} testId={testId} />
    case 'code-only':
      return (
        <div className="visual-form-label">
          {label}
          <p className="openui-form-note">
            <Code2 size={12} /> {value === undefined ? 'Not set.' : 'Set in code.'} Edit this in the Code tab.
          </p>
        </div>
      )
  }
}

function JsonField({ label, value, required, onChange, testId }: { label: JSX.Element; value: OUIValue; required: boolean; onChange: (v: OUIValue) => void; testId: string }) {
  const [draft, setDraft] = useState(() => (value === undefined ? '' : JSON.stringify(value)))
  const [error, setError] = useState<string | null>(null)
  return (
    <label className="visual-form-label">
      {label}
      <textarea
        className="visual-form-textarea openui-form-mono"
        value={draft}
        rows={2}
        placeholder='JSON, e.g. ["a", "b"]'
        onChange={(e) => {
          setDraft(e.target.value)
          if (e.target.value.trim() === '' && !required) {
            setError(null)
            onChange(undefined)
            return
          }
          try {
            onChange(JSON.parse(e.target.value) as OUIValue)
            setError(null)
          } catch {
            setError('Not valid JSON yet; the last valid value is kept.')
          }
        }}
        data-testid={testId}
      />
      {error && <span className="openui-form-error">{error}</span>}
    </label>
  )
}

// ============================================================================
// Blocks
// ============================================================================

function AddBlock({ choices, onAdd, testId }: { choices: string[]; onAdd: (component: string) => void; testId: string }) {
  const groups = standardOpenUISpec.componentGroups
    .map((g) => ({ name: g.name, components: g.components.filter((c) => choices.includes(c)) }))
    .filter((g) => g.components.length > 0)
  const grouped = new Set(groups.flatMap((g) => g.components))
  const other = choices.filter((c) => !grouped.has(c))
  return (
    <div className="openui-form-add">
      <Plus size={13} />
      <select
        className="visual-form-select"
        value=""
        aria-label="Add a block"
        onChange={(e) => {
          if (e.target.value) onAdd(e.target.value)
        }}
        data-testid={testId}
      >
        <option value="">Add a block…</option>
        {groups.map((g) => (
          <optgroup key={g.name} label={g.name}>
            {g.components.map((c) => <option key={c} value={c}>{c}</option>)}
          </optgroup>
        ))}
        {other.length > 0 && (
          <optgroup label="Other">
            {other.map((c) => <option key={c} value={c}>{c}</option>)}
          </optgroup>
        )}
      </select>
    </div>
  )
}

function BlockList({ blocks, choices, onChange, testId, depth }: { blocks: OUIValue[]; choices: string[]; onChange: (blocks: OUIValue[]) => void; testId: string; depth: number }) {
  const move = (from: number, to: number) => {
    if (to < 0 || to >= blocks.length) return
    const next = [...blocks]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    onChange(next)
  }
  return (
    <div className="visual-form-object-list" data-testid={`${testId}-list`}>
      {blocks.map((block, i) =>
        isCall(block) ? (
          <BlockCard
            key={i}
            call={block}
            index={i}
            count={blocks.length}
            onChange={(next) => onChange(blocks.map((b, j) => (j === i ? next : b)))}
            onRemove={() => onChange(blocks.filter((_, j) => j !== i))}
            onMove={(to) => move(i, to)}
            testId={`${testId}-${i}`}
            depth={depth}
          />
        ) : (
          <p key={i} className="openui-form-note">Item #{i + 1} is not a component; edit it in the Code tab.</p>
        ),
      )}
      {blocks.length === 0 && <p className="visual-form-empty">No blocks yet.</p>}
      <AddBlock choices={choices} onAdd={(c) => onChange([...blocks, defaultCall(c)])} testId={`${testId}-add`} />
    </div>
  )
}

interface BlockCardProps {
  call: OUICall
  onChange: (call: OUIValue) => void
  onRemove?: () => void
  onMove?: (to: number) => void
  index?: number
  count?: number
  testId: string
  depth: number
}

function BlockCard({ call, onChange, onRemove, onMove, index, count, testId, depth }: BlockCardProps) {
  const [open, setOpen] = useState(depth < 3)
  const summary = summarize(call)
  return (
    <div className={`visual-form-card openui-form-block${depth > 1 ? ' visual-form-card--sub' : ''}`} data-testid={testId}>
      <div className="visual-form-card-header">
        <button type="button" className="openui-form-toggle" onClick={() => setOpen(!open)} aria-expanded={open} title={describe(call.component)}>
          <span className="openui-form-component">{call.component}</span>
          {summary && <span className="openui-form-summary">{summary}</span>}
        </button>
        <div className="form-action-group">
          {onMove && index !== undefined && count !== undefined && (
            <>
              <button type="button" className="form-reorder-btn" onClick={() => onMove(index - 1)} disabled={index === 0} title="Move up" data-testid={`${testId}-up`}>
                <ArrowUp size={12} />
              </button>
              <button type="button" className="form-reorder-btn" onClick={() => onMove(index + 1)} disabled={index === count - 1} title="Move down" data-testid={`${testId}-down`}>
                <ArrowDown size={12} />
              </button>
            </>
          )}
          {onRemove && (
            <button type="button" className="form-remove-btn" onClick={onRemove} title="Remove" data-testid={`${testId}-remove`}>
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
      {open && (
        <div className="visual-form-card-body">
          <CallFields call={call} onChange={onChange} testId={testId} depth={depth} />
        </div>
      )}
    </div>
  )
}

function CallFields({ call, onChange, testId, depth }: { call: OUICall; onChange: (call: OUICall) => void; testId: string; depth: number }) {
  const params = paramsOf(call.component)
  if (params.length === 0) return <p className="visual-form-empty">No settings.</p>
  return (
    <>
      {params.map((param) => (
        <div className="visual-form-field" key={param.name}>
          <Field
            param={param}
            value={call.props[param.name]}
            onChange={(value) => {
              const props = { ...call.props }
              if (value === undefined) delete props[param.name]
              else props[param.name] = value
              onChange({ ...call, props })
            }}
            testId={`${testId}-${param.name}`}
            depth={depth}
          />
        </div>
      ))}
    </>
  )
}

// ============================================================================
// Editor
// ============================================================================

export function OpenUIFormEditor({ data, onChange }: OpenUIFormEditorProps) {
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const source = data.source ?? ''
  const tree = useMemo(() => parseStandardProgram(source), [source])

  const setRoot = (root: OUIValue) => {
    if (isCall(root)) onChange({ ...data, source: printStandardProgram(root) })
  }

  return (
    <div className="visual-form" data-testid="openui-form-editor">
      <div className="visual-form-section-header" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Blocks size={16} className="text-primary" />
          <span className="visual-form-key" style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            OpenUI Blocks
          </span>
        </div>
        <button className="fc-help-btn" onClick={() => setIsHelpOpen(true)} data-testid="openui-editor-help-btn" type="button">
          <HelpCircle size={13} />
          <span>Guide</span>
        </button>
      </div>

      <OpenUIHelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {tree.root && tree.editable ? (
        <div data-testid="openui-form-tree">
          <div className="openui-form-root">
            <span className="visual-form-key">Root</span>
            {ROOT_CHOICES.includes(tree.root.component) ? (
              <select
                className="visual-form-select"
                value={tree.root.component}
                aria-label="Root component"
                onChange={(e) => setRoot(convertRoot(tree.root!, e.target.value))}
                data-testid="openui-form-root"
              >
                {ROOT_CHOICES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            ) : (
              <span className="openui-form-component" data-testid="openui-form-root">{tree.root.component}</span>
            )}
            <span className="openui-form-summary">{describe(tree.root.component).split('.')[0]}</span>
          </div>
          <CallFields call={tree.root} onChange={setRoot} testId="openui-form-root" depth={0} />
        </div>
      ) : (
        <div data-testid="openui-form-source">
          <p className="openui-form-note" role="note" data-testid="openui-form-not-editable">
            <Code2 size={12} /> This program can't be edited as blocks because {tree.reason ?? 'it could not be read'}. Edit it below or in the Code tab.
          </p>
          <textarea
            className="visual-form-textarea openui-form-mono"
            value={source}
            onChange={(e) => onChange({ ...data, source: e.target.value })}
            rows={16}
            spellCheck={false}
            data-testid="openui-source-input"
          />
        </div>
      )}
    </div>
  )
}

/** Root containers that can be swapped for each other without losing content (both hold `children`). */
const ROOT_CHOICES = ['Stack', 'Card']

/** Switch the root container, carrying its children and shared settings over. */
function convertRoot(root: OUICall, component: string): OUICall {
  if (root.component === component) return root
  const keep = new Set(standardParamOrder(component))
  const props = Object.fromEntries(Object.entries(root.props).filter(([key]) => keep.has(key)))
  return { kind: 'call', component, props: { ...defaultCall(component).props, ...props } }
}
