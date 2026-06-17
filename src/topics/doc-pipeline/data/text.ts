export const docPipelineParagraphs: string[] = [
  'Modern document processing pipelines combine <code>OCR</code> extraction with <code>LLM</code>-based validation to automate the ingestion of invoices, contracts, receipts, and forms. The pipeline must handle both high-quality digital documents and degraded scans with varying confidence levels.',
  'When extracted fields meet a confidence threshold, the document is auto-approved and routed downstream. When confidence falls below threshold, the document enters a <code>human-in-the-loop</code> audit queue where subject-matter experts correct flagged fields before finalization.',
  'Audit corrections are stored alongside original extractions, creating a feedback loop that improves OCR models and LLM validation prompts over time.',
]

export const docPipelineLifecycleMarkdown: string = `
The pipeline follows a strict state machine: **QUEUED** → **EXTRACTING** → **VALIDATING** → **HIGH_CONFIDENCE** or **LOW_CONFIDENCE** → **AUDITED** → **COMPLETED**. Each transition is guarded by confidence thresholds and policy rules.
`

export const docPipelineCapabilityBullets: { text: string; checked?: boolean; children?: { text: string; checked?: boolean }[] }[] = [
  { text: 'Multi-format OCR extraction (PDF, TIFF, JPEG, PNG)', checked: true },
  { text: 'Field-level confidence scoring', checked: true },
  { text: 'LLM semantic validation', children: [
    { text: 'Entity recognition and normalization' },
    { text: 'Cross-field consistency checks' },
    { text: 'Domain-specific validation rules' },
  ]},
  { text: 'Configurable confidence thresholds', checked: true },
  { text: 'Human audit queue with priority routing' },
  { text: 'Correction tracking for model retraining' },
  { text: 'State machine lifecycle management' },
]
