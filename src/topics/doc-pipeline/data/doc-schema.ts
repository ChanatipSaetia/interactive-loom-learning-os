import { TYPES } from '../../../sections/flowchart'
import type { UnifiedFlowchartSchema } from '../../../sections/flowchart'

export const docPipelineSchema: UnifiedFlowchartSchema = {
  entities: {
    // ── Actors ────────────────────────────────────────────────────────
    'user': {
      title: 'User',
      desc: 'Uploads documents into the ingestion pipeline.',
      type: TYPES.USER,
    },
    'auditor': {
      title: 'Auditor',
      desc: 'Human reviewer who audits low-confidence extractions and applies corrections.',
      type: TYPES.USER,
    },

    // ── Aggregates / Services ─────────────────────────────────────────
    'orchestrator': {
      title: 'Pipeline Orchestrator',
      desc: 'Coordinates the end-to-end document processing workflow and manages job lifecycle.',
      type: TYPES.AGGREGATE,
      stateMachine: {
        states: [
          { id: 'QUEUED', label: 'Queued', color: 'var(--ctp-overlay1)' },
          { id: 'EXTRACTING', label: 'Extracting', color: 'var(--ctp-blue)' },
          { id: 'VALIDATING', label: 'Validating', color: 'var(--ctp-yellow)' },
          { id: 'HIGH_CONFIDENCE', label: 'Approved', color: 'var(--ctp-green)' },
          { id: 'LOW_CONFIDENCE', label: 'Pending Audit', color: 'var(--ctp-maroon)' },
          { id: 'AUDITED', label: 'Audited', color: 'var(--ctp-mauve)' },
          { id: 'COMPLETED', label: 'Completed', color: 'var(--ctp-teal)' },
        ],
        initialState: 'QUEUED',
      },
    },

    // Split aggregates for Event Storming detail
    'orch_extract': {
      title: 'Pipeline Orchestrator',
      desc: 'Manages extraction phase: dispatches OCR, stores raw text.',
      type: TYPES.AGGREGATE,
      collapsedTo: 'orchestrator'
    },

    'orch_validate': {
      title: 'Pipeline Orchestrator',
      desc: 'Manages validation phase: evaluates confidence, routes to approval or audit.',
      type: TYPES.AGGREGATE,
      collapsedTo: 'orchestrator'
    },

    'field_validator': {
      title: 'Field Validator',
      viewTitles: { SEQUENCE: 'Validator' },
      desc: 'Runs LLM-based validation against extracted fields, computing per-field and aggregate confidence scores.',
      type: TYPES.AGGREGATE,
    },

    'confidence_router': {
      title: 'Route by Confidence',
      desc: 'Evaluates aggregate confidence score against threshold. Routes high-confidence documents to auto-approval and low-confidence documents to human audit queue.',
      type: TYPES.AGGREGATE,
    },

    // ── External Systems ──────────────────────────────────────────────
    'ocr_service': {
      title: 'OCR Service',
      desc: 'External OCR API that extracts text and field-level bounding boxes from document images or PDFs.',
      type: TYPES.EXTERNAL,
    },

    'llm_api': {
      title: 'LLM API',
      desc: 'External LLM endpoint for semantic field validation, entity recognition, and confidence scoring.',
      type: TYPES.EXTERNAL,
    },

    // ── Database ──────────────────────────────────────────────────────
    'db': {
      title: 'Pipeline Database',
      desc: 'Persistent storage for documents, extracted fields, and audit corrections.',
      type: TYPES.DATABASE,
    },

    // ── Events ────────────────────────────────────────────────────────
    'evt_uploaded': {
      title: 'Document Uploaded',
      viewTitles: { DATA_FLOW: 'Upload Payload' },
      desc: 'User submitted a document file for processing.',
      type: TYPES.EVENT,
      jsonPayload: {
        type: 'upload_payload',
        payload: {
          filename: 'invoice_2024_q4.pdf',
          mimeType: 'application/pdf',
          fileSize: 245760,
          userId: 'usr_001',
          timestamp: '2025-03-15T09:12:00Z'
        }
      }
    },

    'evt_extracted': {
      title: 'Fields Extracted',
      viewTitles: { DATA_FLOW: 'OCR Output' },
      desc: 'OCR service returned raw field key-value pairs with bounding boxes.',
      type: TYPES.EVENT,
      jsonPayload: {
        type: 'ocr_output',
        payload: {
          documentId: 'doc_001',
          fields: [
            { field: 'invoice_number', value: 'INV-2024-0892', confidence: 0.96 },
            { field: 'date', value: '2024-11-03', confidence: 0.91 },
            { field: 'vendor', value: 'Acme Suppl1es', confidence: 0.62 },
            { field: 'total', value: '1,247.50', confidence: 0.88 }
          ],
          totalPages: 3
        }
      }
    },

    'evt_validated': {
      title: 'Fields Validated',
      viewTitles: { DATA_FLOW: 'Validation Results' },
      desc: 'LLM validated each extracted field, returning confidence scores.',
      type: TYPES.EVENT,
      jsonPayload: {
        type: 'validation_results',
        payload: {
          documentId: 'doc_001',
          fields: [
            { field: 'invoice_number', value: 'INV-2024-0892', confidence: 0.96, status: 'pass' },
            { field: 'date', value: '2024-11-03', confidence: 0.91, status: 'pass' },
            { field: 'vendor', value: 'Acme Suppl1es', confidence: 0.62, status: 'flag', note: 'Possible OCR error: "1" instead of "l"' },
            { field: 'total', value: '1,247.50', confidence: 0.88, status: 'pass' }
          ],
          aggregateConfidence: 0.84,
          threshold: 0.85
        }
      }
    },

    'evt_approved': {
      title: 'Auto-Approved',
      desc: 'Aggregate confidence meets threshold. Document approved without human review.',
      type: TYPES.EVENT,
    },

    'evt_flagged': {
      title: 'Flagged for Audit',
      viewTitles: { DATA_FLOW: 'Audit Queue Entry' },
      desc: 'Aggregate confidence below threshold. Document queued for human review.',
      type: TYPES.EVENT,
      jsonPayload: {
        type: 'audit_queue_entry',
        payload: {
          documentId: 'doc_001',
          aggregateConfidence: 0.84,
          threshold: 0.85,
          flaggedFields: [
            { field: 'vendor', value: 'Acme Suppl1es', confidence: 0.62, reason: 'Below per-field threshold (0.70)' }
          ],
          queuedAt: '2025-03-15T09:14:30Z',
          priority: 'medium'
        }
      }
    },

    'evt_corrected': {
      title: 'Fields Corrected',
      viewTitles: { DATA_FLOW: 'Correction Record' },
      desc: 'Auditor reviewed and corrected flagged fields. Corrections stored for model retraining.',
      type: TYPES.EVENT,
      jsonPayload: {
        type: 'correction_record',
        payload: {
          documentId: 'doc_001',
          auditorId: 'aud_001',
          corrections: [
            { fieldId: 'fld_003', field: 'vendor', originalValue: 'Acme Suppl1es', correctedValue: 'Acme Supplies', reason: 'OCR misread "l" as "1"' }
          ],
          reviewedAt: '2025-03-15T10:05:00Z'
        }
      }
    },

    'evt_completed': {
      title: 'Document Completed',
      desc: 'All processing and audit steps finished. Document fully ingested.',
      type: TYPES.EVENT,
    },

    // ── Commands (Event Storming only) ────────────────────────────────
    'cmd_ocr': {
      title: 'Process Document',
      desc: 'Send document to OCR service for text and field extraction.',
      type: TYPES.COMMAND,
      collapsedTo: 'ocr_service'
    },

    'cmd_validate': {
      title: 'Validate Fields',
      desc: 'Send extracted fields to LLM for semantic validation and confidence scoring.',
      type: TYPES.COMMAND,
      collapsedTo: 'llm_api'
    },

    'cmd_audit': {
      title: 'Audit Fields',
      desc: 'Auditor reviews flagged fields and applies corrections.',
      type: TYPES.COMMAND,
      collapsedTo: 'auditor'
    },

    // ── Policies (Event Storming only) ────────────────────────────────
    'pol_process': {
      title: 'Process on Upload',
      desc: 'When Document Uploaded, initiate OCR extraction pipeline.',
      type: TYPES.POLICY,
    },

    'pol_validate': {
      title: 'Validate on Extraction',
      desc: 'When Fields Extracted, run LLM-based field validation.',
      type: TYPES.POLICY,
    },

    'pol_route': {
      title: 'Route by Confidence',
      desc: 'When Fields Validated, route based on aggregate confidence score: above threshold auto-approves, below threshold flags for audit.',
      type: TYPES.POLICY,
      collapsedTo: 'confidence_router',
    },

    'pol_audit': {
      title: 'Audit Low Confidence',
      desc: 'When Flagged for Audit, dispatch to human reviewer queue.',
      type: TYPES.POLICY,
    },

    'pol_finalize': {
      title: 'Finalize on Correction',
      desc: 'When Fields Corrected, mark document as completed.',
      type: TYPES.POLICY,
    },

    // ── Data Objects (non-Event views) ────────────────────────────────
    'approved_doc': {
      title: 'Approved Document',
      desc: 'Final validated document record ready for downstream consumption.',
      type: TYPES.DATA_OBJECT,
    },
  },

  relations: [
    // ── EVENT STORMING ────────────────────────────────────────────────
    // Phase 1: Ingestion
    { id: 'r_es_1',  from: 'user',          to: 'evt_uploaded',    views: ['EVENT_STORMING'] },
    { id: 'r_es_2',  from: 'evt_uploaded',  to: 'pol_process',     views: ['EVENT_STORMING'] },
    { id: 'r_es_3',  from: 'pol_process',   to: 'cmd_ocr',         views: ['EVENT_STORMING'] },
    { id: 'r_es_4',  from: 'cmd_ocr',       to: 'ocr_service',     views: ['EVENT_STORMING'], handledBy: true },
    { id: 'r_es_5',  from: 'ocr_service',   to: 'evt_extracted',   views: ['EVENT_STORMING'] },
    { id: 'r_es_6',  from: 'cmd_ocr',       to: 'orch_extract',    views: ['EVENT_STORMING'], handledBy: true },
    { id: 'r_es_7',  from: 'orch_extract',  to: 'db',              views: ['EVENT_STORMING'] },

    // Phase 2: Validation
    { id: 'r_es_8',  from: 'evt_extracted', to: 'pol_validate',    views: ['EVENT_STORMING'] },
    { id: 'r_es_9',  from: 'pol_validate',  to: 'cmd_validate',    views: ['EVENT_STORMING'] },
    { id: 'r_es_10', from: 'cmd_validate',  to: 'field_validator', views: ['EVENT_STORMING'], handledBy: true },
    { id: 'r_es_10_llm', from: 'field_validator', to: 'llm_api',   views: ['EVENT_STORMING'], handledBy: true },
    { id: 'r_es_11', from: 'llm_api',       to: 'evt_validated',   views: ['EVENT_STORMING'] },
    { id: 'r_es_12', from: 'cmd_validate',  to: 'orch_validate',   views: ['EVENT_STORMING'], handledBy: true },

    // Phase 3: Routing
    { id: 'r_es_13', from: 'evt_validated', to: 'pol_route',       views: ['EVENT_STORMING'] },

    // Happy path: Auto-approve
    { id: 'r_es_14', from: 'pol_route',     to: 'evt_approved',    views: ['EVENT_STORMING'] },
    { id: 'r_es_15', from: 'evt_approved',  to: 'evt_completed',   views: ['EVENT_STORMING'] },

    // Low confidence path: Audit
    { id: 'r_es_16', from: 'pol_route',     to: 'evt_flagged',     views: ['EVENT_STORMING'] },
    { id: 'r_es_17', from: 'evt_flagged',   to: 'pol_audit',       views: ['EVENT_STORMING'] },
    { id: 'r_es_18', from: 'pol_audit',     to: 'cmd_audit',       views: ['EVENT_STORMING'] },
    { id: 'r_es_19', from: 'cmd_audit',     to: 'auditor',         views: ['EVENT_STORMING'], handledBy: true },
    { id: 'r_es_20', from: 'auditor',       to: 'evt_corrected',   views: ['EVENT_STORMING'] },
    { id: 'r_es_21', from: 'evt_corrected', to: 'pol_finalize',    views: ['EVENT_STORMING'] },
    { id: 'r_es_22', from: 'pol_finalize',  to: 'evt_completed',   views: ['EVENT_STORMING'] },

    // Dynamic edge helpers
    { id: 'r_es_bs', from: 'confidence_router', to: 'db',          views: ['EVENT_STORMING'] },
    { id: 'r_es_sa', from: 'confidence_router', to: 'approved_doc',views: ['EVENT_STORMING'] },
    { id: 'r_es_sl', from: 'approved_doc',  to: 'user',            views: ['EVENT_STORMING'] },
  ],

  views: {
    EVENT_STORMING: {
      name: 'Event Storming',
      icon: 'Component',
      nodes: [
        { id: 'user', grid: [0, 2] },
        { id: 'evt_uploaded', grid: [1, 2] },
        { id: 'pol_process', grid: [2, 2] },
        { id: 'cmd_ocr', grid: [3, 2] },
        { id: 'evt_extracted', grid: [5, 2] },
        { id: 'pol_validate', grid: [6, 2] },
        { id: 'cmd_validate', grid: [7, 2] },
        { id: 'evt_validated', grid: [9, 2] },
        { id: 'pol_route', grid: [10, 2] },
        { id: 'confidence_router', grid: [10, 1] },
        { id: 'orch_extract', grid: [3, 1] },
        { id: 'ocr_service', grid: [4, 1] },
        { id: 'orch_validate', grid: [7, 1] },
        { id: 'field_validator', grid: [7, 1] },
        { id: 'llm_api', grid: [8, 1] },
        { id: 'db', grid: [3, 0] },
        { id: 'evt_approved', grid: [11, 2] },
        { id: 'evt_completed', grid: [12, 2] },
        { id: 'evt_flagged', grid: [11, 3] },
        { id: 'pol_audit', grid: [11, 4] },
        { id: 'cmd_audit', grid: [12, 4] },
        { id: 'auditor', grid: [13, 3] },
        { id: 'evt_corrected', grid: [13, 4] },
        { id: 'pol_finalize', grid: [14, 4] },
        { id: 'approved_doc', grid: [11, 0] },
      ],
      groups: [
        { id: 'es_g1', title: 'Upload & OCR Extraction', desc: 'Document upload triggers OCR extraction pipeline via external OCR service. Raw fields stored in database.', nodeIds: ['user','evt_uploaded','pol_process','cmd_ocr','ocr_service','orch_extract','db','evt_extracted'], color: 'rgba(140,170,238,0.12)', borderColor: 'var(--ctp-blue)', textColor: 'var(--ctp-text)' },
        { id: 'es_g2', title: 'LLM Validation', desc: 'Extracted fields sent to LLM API for semantic validation and confidence scoring.', nodeIds: ['pol_validate','cmd_validate','llm_api','orch_validate','field_validator','evt_validated'], color: 'rgba(244,184,228,0.12)', borderColor: 'var(--ctp-pink)', textColor: 'var(--ctp-text)' },
        { id: 'es_g3', title: 'Confidence Routing', desc: 'Policy routes documents by aggregate confidence: above threshold auto-approves, below flags for audit.', nodeIds: ['pol_route','confidence_router','evt_approved','evt_completed','evt_flagged','approved_doc'], color: 'rgba(229,200,144,0.12)', borderColor: 'var(--ctp-yellow)', textColor: 'var(--ctp-text)' },
        { id: 'es_g4', title: 'Human Audit Loop', desc: 'Low-confidence documents dispatched to auditor who corrects fields, then finalized.', nodeIds: ['pol_audit','cmd_audit','auditor','evt_corrected','pol_finalize'], color: 'rgba(231,130,132,0.12)', borderColor: 'var(--ctp-red)', textColor: 'var(--ctp-text)' },
      ]
    }
  },

  journeys: [
    {
      id: 'happy-path',
      label: 'Happy Path Extraction',
      description: 'Document is uploaded, OCR extracts fields, LLM validates with high confidence, and the document is auto-approved.',
      steps: [
        { nodeIds: ['user', 'evt_uploaded'], description: 'Document Uploaded — User uploads a PDF document (invoice_2024_q4.pdf) into the pipeline.' },
        { nodeIds: ['pol_process', 'cmd_ocr', 'ocr_service', 'orch_extract', 'db', 'evt_extracted'], description: 'OCR Extraction — Policy triggers "Process Document" command. OCR Service extracts field key-value pairs with bounding boxes. Orchestrator stores raw fields in database. Fields Extracted event published.', processGroup: 'execution' },
        { nodeIds: ['pol_validate', 'cmd_validate', 'llm_api', 'orch_validate', 'evt_validated'], description: 'LLM Validation — Extracted fields sent to LLM API for semantic validation. Confidence scores computed per-field and aggregated. Fields Validated event published.', processGroup: 'evaluation' },
        { nodeIds: ['pol_route', 'evt_approved', 'evt_completed'], description: 'Auto-Approval — Aggregate confidence (0.92) exceeds threshold (0.85). Document auto-approved and marked completed.', processGroup: 'evaluation' },
      ]
    },
    {
      id: 'low-confidence-audit',
      label: 'Low Confidence Auditing',
      description: 'Document extraction yields low confidence on critical fields, triggering the human audit and correction workflow.',
      steps: [
        { nodeIds: ['user', 'evt_uploaded'], description: 'Document Uploaded — User uploads a scanned document with degraded image quality.' },
        { nodeIds: ['pol_process', 'cmd_ocr', 'ocr_service', 'orch_extract', 'db', 'evt_extracted'], description: 'OCR Extraction — OCR extracts fields but some have low confidence due to poor scan quality.', processGroup: 'execution' },
        { nodeIds: ['pol_validate', 'cmd_validate', 'llm_api', 'orch_validate', 'evt_validated'], description: 'LLM Validation — LLM validates fields. Aggregate confidence (0.73) falls below threshold (0.85). Vendor field flagged: "Acme Suppl1es" (confidence 0.62).', processGroup: 'evaluation' },
        { nodeIds: ['pol_route', 'evt_flagged', 'pol_audit', 'cmd_audit', 'auditor'], description: '⚠️ Risk / Human Review — Confidence Router flags document for audit. Policy dispatches to Auditor queue. Auditor reviews flagged fields and applies corrections.', processGroup: 'escalation' },
        { nodeIds: ['auditor', 'evt_corrected', 'pol_finalize', 'evt_completed'], description: 'Correction Finalized — Auditor corrects vendor to "Acme Supplies". Correction stored for model retraining. Document finalized and completed.', processGroup: 'execution' },
      ]
    }
  ]
}
