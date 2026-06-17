import { TYPES } from '../../../sections/flowchart'
import type { UnifiedFlowchartSchema } from '../../../sections/flowchart'

export const docPipelineSchema: UnifiedFlowchartSchema = {
  entities: {
    // ── Actors ────────────────────────────────────────────────────────
    'user': {
      title: 'User',
      desc: 'Uploads documents into the ingestion pipeline.',
      viewTypes: {
        EVENT_STORMING: TYPES.USER,
        SYS_ARCH: TYPES.USER,
        SWIMLANES: TYPES.USER,
        SEQUENCE: TYPES.USER,
        DATA_FLOW: TYPES.USER,
      }
    },
    'auditor': {
      title: 'Auditor',
      desc: 'Human reviewer who audits low-confidence extractions and applies corrections.',
      viewTypes: {
        EVENT_STORMING: TYPES.USER,
        SYS_ARCH: TYPES.USER,
        SWIMLANES: TYPES.USER,
        SEQUENCE: TYPES.USER,
        DATA_FLOW: TYPES.USER,
      }
    },

    // ── Aggregates / Services ─────────────────────────────────────────
    'orchestrator': {
      title: 'Pipeline Orchestrator',
      desc: 'Coordinates the end-to-end document processing workflow and manages job lifecycle.',
      viewTypes: {
        SYS_ARCH: TYPES.AGGREGATE,
        SWIMLANES: TYPES.AGGREGATE,
        SEQUENCE: TYPES.AGGREGATE,
      },
      stateMachine: {
        states: [
          { id: 'QUEUED', label: 'Queued', color: '#838ba7' },
          { id: 'EXTRACTING', label: 'Extracting', color: '#8caaee' },
          { id: 'VALIDATING', label: 'Validating', color: '#e5c890' },
          { id: 'HIGH_CONFIDENCE', label: 'Approved', color: '#a6d189' },
          { id: 'LOW_CONFIDENCE', label: 'Pending Audit', color: '#ed879e' },
          { id: 'AUDITED', label: 'Audited', color: '#ca9ee6' },
          { id: 'COMPLETED', label: 'Completed', color: '#81c8be' },
        ],
        initialState: 'QUEUED',
      },
      erdSchema: [
        {
          name: 'documents',
          columns: [
            { name: 'id', type: 'UUID', primaryKey: true, notNull: true },
            { name: 'filename', type: 'VARCHAR(255)', notNull: true },
            { name: 'mime_type', type: 'VARCHAR(100)', notNull: true },
            { name: 'status', type: 'VARCHAR(20)', notNull: true },
            { name: 'confidence_score', type: 'FLOAT' },
            { name: 'uploaded_by', type: 'UUID', notNull: true },
            { name: 'created_at', type: 'TIMESTAMPTZ', notNull: true },
            { name: 'updated_at', type: 'TIMESTAMPTZ', notNull: true },
          ],
        },
      ],
    },

    // Split aggregates for Event Storming detail
    'orch_extract': {
      title: 'Pipeline Orchestrator',
      desc: 'Manages extraction phase: dispatches OCR, stores raw text.',
      viewTypes: {
        EVENT_STORMING: TYPES.AGGREGATE,
      },
      collapsedTo: 'orchestrator'
    },

    'orch_validate': {
      title: 'Pipeline Orchestrator',
      desc: 'Manages validation phase: evaluates confidence, routes to approval or audit.',
      viewTypes: {
        EVENT_STORMING: TYPES.AGGREGATE,
      },
      collapsedTo: 'orchestrator'
    },

    'field_validator': {
      title: 'Field Validator',
      viewTitles: { SYS_ARCH: 'Field Validator', SWIMLANES: 'Field Validator', SEQUENCE: 'Validator' },
      desc: 'Runs LLM-based validation against extracted fields, computing per-field and aggregate confidence scores.',
      viewTypes: {
        EVENT_STORMING: TYPES.COMMAND,
        SYS_ARCH: TYPES.SERVICE,
        SWIMLANES: TYPES.PROCESS,
        SEQUENCE: TYPES.SERVICE,
      }
    },

    'confidence_router': {
      title: 'Route by Confidence',
      viewTitles: { SYS_ARCH: 'Confidence Router', SWIMLANES: 'Confidence Router' },
      desc: 'Evaluates aggregate confidence score against threshold. Routes high-confidence documents to auto-approval and low-confidence documents to human audit queue.',
      viewTypes: {
        EVENT_STORMING: TYPES.POLICY,
        SYS_ARCH: TYPES.SERVICE,
        SWIMLANES: TYPES.DECISION,
      }
    },

    // ── External Systems ──────────────────────────────────────────────
    'ocr_service': {
      title: 'OCR Service',
      desc: 'External OCR API that extracts text and field-level bounding boxes from document images or PDFs.',
      viewTypes: {
        EVENT_STORMING: TYPES.EXTERNAL,
        SYS_ARCH: TYPES.EXTERNAL,
        SWIMLANES: TYPES.EXTERNAL,
        SEQUENCE: TYPES.EXTERNAL,
      }
    },

    'llm_api': {
      title: 'LLM API',
      desc: 'External LLM endpoint for semantic field validation, entity recognition, and confidence scoring.',
      viewTypes: {
        EVENT_STORMING: TYPES.EXTERNAL,
        SYS_ARCH: TYPES.EXTERNAL,
        SWIMLANES: TYPES.EXTERNAL,
        SEQUENCE: TYPES.EXTERNAL,
      }
    },

    // ── Database ──────────────────────────────────────────────────────
    'db': {
      title: 'Pipeline Database',
      desc: 'Persistent storage for documents, extracted fields, and audit corrections.',
      viewTypes: {
        EVENT_STORMING: TYPES.DATABASE,
        SYS_ARCH: TYPES.DATABASE,
        SWIMLANES: TYPES.DATABASE,
      },
      erdSchema: [
        {
          name: 'documents',
          columns: [
            { name: 'id', type: 'UUID', primaryKey: true, notNull: true },
            { name: 'filename', type: 'VARCHAR(255)', notNull: true },
            { name: 'mime_type', type: 'VARCHAR(100)', notNull: true },
            { name: 'status', type: 'VARCHAR(20)', notNull: true },
            { name: 'confidence_score', type: 'FLOAT' },
            { name: 'uploaded_by', type: 'UUID', notNull: true },
            { name: 'created_at', type: 'TIMESTAMPTZ', notNull: true },
            { name: 'updated_at', type: 'TIMESTAMPTZ', notNull: true },
          ],
        },
        {
          name: 'extracted_fields',
          columns: [
            { name: 'id', type: 'UUID', primaryKey: true, notNull: true },
            { name: 'document_id', type: 'UUID', notNull: true },
            { name: 'field_name', type: 'VARCHAR(100)', notNull: true },
            { name: 'field_value', type: 'TEXT', notNull: true },
            { name: 'confidence', type: 'FLOAT', notNull: true },
            { name: 'validated', type: 'BOOLEAN', notNull: true },
            { name: 'validated_by', type: 'VARCHAR(20)' },
            { name: 'created_at', type: 'TIMESTAMPTZ', notNull: true },
          ],
        },
        {
          name: 'audit_corrections',
          columns: [
            { name: 'id', type: 'UUID', primaryKey: true, notNull: true },
            { name: 'document_id', type: 'UUID', notNull: true },
            { name: 'field_id', type: 'UUID', notNull: true },
            { name: 'original_value', type: 'TEXT', notNull: true },
            { name: 'corrected_value', type: 'TEXT', notNull: true },
            { name: 'corrected_by', type: 'UUID', notNull: true },
            { name: 'reason', type: 'TEXT' },
            { name: 'created_at', type: 'TIMESTAMPTZ', notNull: true },
          ],
        },
      ],
    },

    // ── Events ────────────────────────────────────────────────────────
    'evt_uploaded': {
      title: 'Document Uploaded',
      viewTitles: { DATA_FLOW: 'Upload Payload' },
      desc: 'User submitted a document file for processing.',
      viewTypes: {
        EVENT_STORMING: TYPES.EVENT,
        DATA_FLOW: TYPES.DATA_OBJECT,
      },
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
      viewTypes: {
        EVENT_STORMING: TYPES.EVENT,
        DATA_FLOW: TYPES.DATA_OBJECT,
      },
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
      viewTypes: {
        EVENT_STORMING: TYPES.EVENT,
        DATA_FLOW: TYPES.DATA_OBJECT,
      },
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
      viewTypes: { EVENT_STORMING: TYPES.EVENT }
    },

    'evt_flagged': {
      title: 'Flagged for Audit',
      viewTitles: { DATA_FLOW: 'Audit Queue Entry' },
      desc: 'Aggregate confidence below threshold. Document queued for human review.',
      viewTypes: {
        EVENT_STORMING: TYPES.EVENT,
        DATA_FLOW: TYPES.DATA_OBJECT,
      },
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
      viewTypes: {
        EVENT_STORMING: TYPES.EVENT,
        DATA_FLOW: TYPES.DATA_OBJECT,
      },
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
      viewTypes: { EVENT_STORMING: TYPES.EVENT }
    },

    // ── Commands (Event Storming only) ────────────────────────────────
    'cmd_ocr': {
      title: 'Process Document',
      desc: 'Send document to OCR service for text and field extraction.',
      viewTypes: { EVENT_STORMING: TYPES.COMMAND },
      collapsedTo: 'ocr_service'
    },

    'cmd_validate': {
      title: 'Validate Fields',
      desc: 'Send extracted fields to LLM for semantic validation and confidence scoring.',
      viewTypes: { EVENT_STORMING: TYPES.COMMAND },
      collapsedTo: 'llm_api'
    },

    'cmd_audit': {
      title: 'Audit Fields',
      desc: 'Auditor reviews flagged fields and applies corrections.',
      viewTypes: { EVENT_STORMING: TYPES.COMMAND },
      collapsedTo: 'auditor'
    },

    // ── Policies (Event Storming only) ────────────────────────────────
    'pol_process': {
      title: 'Process on Upload',
      desc: 'When Document Uploaded, initiate OCR extraction pipeline.',
      viewTypes: { EVENT_STORMING: TYPES.POLICY }
    },

    'pol_validate': {
      title: 'Validate on Extraction',
      desc: 'When Fields Extracted, run LLM-based field validation.',
      viewTypes: { EVENT_STORMING: TYPES.POLICY }
    },

    'pol_route': {
      title: 'Route by Confidence',
      desc: 'When Fields Validated, route based on aggregate confidence score: above threshold auto-approves, below threshold flags for audit.',
      viewTypes: { EVENT_STORMING: TYPES.POLICY }
    },

    'pol_audit': {
      title: 'Audit Low Confidence',
      desc: 'When Flagged for Audit, dispatch to human reviewer queue.',
      viewTypes: {
        EVENT_STORMING: TYPES.POLICY,
        SYS_ARCH: TYPES.HOTSPOT,
        SWIMLANES: TYPES.DECISION,
      }
    },

    'pol_finalize': {
      title: 'Finalize on Correction',
      desc: 'When Fields Corrected, mark document as completed.',
      viewTypes: { EVENT_STORMING: TYPES.POLICY }
    },

    // ── Data Objects (non-Event views) ────────────────────────────────
    'approved_doc': {
      title: 'Approved Document',
      desc: 'Final validated document record ready for downstream consumption.',
      viewTypes: {
        DATA_FLOW: TYPES.DATA_OBJECT,
        SWIMLANES: TYPES.DATA_OBJECT,
      }
    },
  },

  relations: [
    // ── EVENT STORMING ────────────────────────────────────────────────
    // Phase 1: Upload & OCR Extraction
    { id: 'r_es_1',  from: 'user',          to: 'evt_uploaded',    views: ['EVENT_STORMING'] },
    { id: 'r_es_2',  from: 'evt_uploaded',  to: 'pol_process',     views: ['EVENT_STORMING'] },
    { id: 'r_es_3',  from: 'pol_process',   to: 'cmd_ocr',         views: ['EVENT_STORMING'] },
    { id: 'r_es_4',  from: 'cmd_ocr',       to: 'ocr_service',     views: ['EVENT_STORMING'], handledBy: true },
    { id: 'r_es_5',  from: 'ocr_service',   to: 'evt_extracted',   views: ['EVENT_STORMING'] },
    { id: 'r_es_6',  from: 'cmd_ocr',       to: 'orch_extract',    views: ['EVENT_STORMING'], handledBy: true },
    { id: 'r_es_7',  from: 'orch_extract',  to: 'db',              views: ['EVENT_STORMING'] },

    // Phase 2: LLM Validation
    { id: 'r_es_8',  from: 'evt_extracted', to: 'pol_validate',    views: ['EVENT_STORMING'] },
    { id: 'r_es_9',  from: 'pol_validate',  to: 'cmd_validate',    views: ['EVENT_STORMING'] },
    { id: 'r_es_10', from: 'cmd_validate',  to: 'llm_api',         views: ['EVENT_STORMING'], handledBy: true },
    { id: 'r_es_11', from: 'llm_api',       to: 'evt_validated',   views: ['EVENT_STORMING'] },
    { id: 'r_es_12', from: 'cmd_validate',  to: 'orch_validate',   views: ['EVENT_STORMING'], handledBy: true },

    // Phase 3: Confidence Routing
    { id: 'r_es_13', from: 'evt_validated', to: 'pol_route',       views: ['EVENT_STORMING'] },

    // Happy path: High confidence → auto-approve
    { id: 'r_es_14', from: 'pol_route',     to: 'evt_approved',    views: ['EVENT_STORMING'] },
    { id: 'r_es_15', from: 'evt_approved',  to: 'evt_completed',   views: ['EVENT_STORMING'] },

    // Low confidence path: Flag → audit → correct → complete
    { id: 'r_es_16', from: 'pol_route',     to: 'evt_flagged',     views: ['EVENT_STORMING'] },
    { id: 'r_es_17', from: 'evt_flagged',   to: 'pol_audit',       views: ['EVENT_STORMING'] },
    { id: 'r_es_18', from: 'pol_audit',     to: 'cmd_audit',       views: ['EVENT_STORMING'] },
    { id: 'r_es_19', from: 'cmd_audit',     to: 'auditor',         views: ['EVENT_STORMING'], handledBy: true },
    { id: 'r_es_20', from: 'auditor',       to: 'evt_corrected',   views: ['EVENT_STORMING'] },
    { id: 'r_es_21', from: 'evt_corrected', to: 'pol_finalize',    views: ['EVENT_STORMING'] },
    { id: 'r_es_22', from: 'pol_finalize',  to: 'evt_completed',   views: ['EVENT_STORMING'] },

    // ── SYSTEM ARCHITECTURE ───────────────────────────────────────────
    { id: 'r_sa_1',  from: 'user',          to: 'orchestrator',    views: ['SYS_ARCH'] },
    { id: 'r_sa_2',  from: 'orchestrator',  to: 'db',              views: ['SYS_ARCH'] },
    { id: 'r_sa_3',  from: 'orchestrator',  to: 'ocr_service',     views: ['SYS_ARCH'] },
    { id: 'r_sa_4',  from: 'ocr_service',   to: 'orchestrator',    views: ['SYS_ARCH'] },
    { id: 'r_sa_5',  from: 'orchestrator',  to: 'field_validator', views: ['SYS_ARCH'] },
    { id: 'r_sa_6',  from: 'field_validator', to: 'llm_api',       views: ['SYS_ARCH'] },
    { id: 'r_sa_7',  from: 'field_validator', to: 'confidence_router', views: ['SYS_ARCH'] },
    { id: 'r_sa_8',  from: 'confidence_router', to: 'db',          views: ['SYS_ARCH'] },
    { id: 'r_sa_9',  from: 'confidence_router', to: 'pol_audit',   views: ['SYS_ARCH'] },
    { id: 'r_sa_10', from: 'pol_audit',     to: 'auditor',         views: ['SYS_ARCH'] },
    { id: 'r_sa_11', from: 'auditor',       to: 'orchestrator',    views: ['SYS_ARCH'], dashed: true },

    // ── DATA FLOW ─────────────────────────────────────────────────────
    { id: 'r_df_1',  from: 'user',          to: 'evt_uploaded',    views: ['DATA_FLOW'] },
    { id: 'r_df_2',  from: 'evt_uploaded',  to: 'evt_extracted',   views: ['DATA_FLOW'] },
    { id: 'r_df_3',  from: 'evt_extracted', to: 'evt_validated',   views: ['DATA_FLOW'] },
    // High confidence branch
    { id: 'r_df_4',  from: 'evt_validated', to: 'approved_doc',    views: ['DATA_FLOW'] },
    { id: 'r_df_5',  from: 'approved_doc',  to: 'user',            views: ['DATA_FLOW'] },
    // Low confidence branch
    { id: 'r_df_6',  from: 'evt_validated', to: 'evt_flagged',     views: ['DATA_FLOW'] },
    { id: 'r_df_7',  from: 'evt_flagged',   to: 'evt_corrected',   views: ['DATA_FLOW'] },
    { id: 'r_df_8',  from: 'evt_corrected', to: 'approved_doc',    views: ['DATA_FLOW'], dashed: true },

    // ── SWIMLANES ─────────────────────────────────────────────────────
    { id: 'r_sl_1',  from: 'user',          to: 'orchestrator',    views: ['SWIMLANES'] },
    { id: 'r_sl_2',  from: 'orchestrator',  to: 'ocr_service',     views: ['SWIMLANES'] },
    { id: 'r_sl_3',  from: 'ocr_service',   to: 'orchestrator',    views: ['SWIMLANES'] },
    { id: 'r_sl_4',  from: 'orchestrator',  to: 'field_validator', views: ['SWIMLANES'] },
    { id: 'r_sl_5',  from: 'field_validator', to: 'llm_api',       views: ['SWIMLANES'] },
    { id: 'r_sl_6',  from: 'llm_api',       to: 'field_validator', views: ['SWIMLANES'] },
    { id: 'r_sl_7',  from: 'field_validator', to: 'confidence_router', views: ['SWIMLANES'] },
    { id: 'r_sl_8',  from: 'confidence_router', to: 'db',          views: ['SWIMLANES'] },
    { id: 'r_sl_9',  from: 'confidence_router', to: 'approved_doc', views: ['SWIMLANES'] },
    { id: 'r_sl_10', from: 'approved_doc',  to: 'user',            views: ['SWIMLANES'] },
    // Audit path
    { id: 'r_sl_11', from: 'confidence_router', to: 'pol_audit',   views: ['SWIMLANES'] },
    { id: 'r_sl_12', from: 'pol_audit',     to: 'auditor',         views: ['SWIMLANES'] },
    { id: 'r_sl_13', from: 'auditor',       to: 'orchestrator',    views: ['SWIMLANES'], dashed: true },

    // ── SEQUENCE ──────────────────────────────────────────────────────
    { id: 'r_sq_1', from: 'user',          to: 'orchestrator',    views: ['SEQUENCE'], label: 'upload document' },
    { id: 'r_sq_2', from: 'orchestrator',  to: 'ocr_service',     views: ['SEQUENCE'], label: 'extract fields' },
    { id: 'r_sq_3', from: 'ocr_service',   to: 'orchestrator',    views: ['SEQUENCE'], label: 'OCR result' },
    { id: 'r_sq_4', from: 'orchestrator',  to: 'field_validator', views: ['SEQUENCE'], label: 'validate fields' },
    { id: 'r_sq_5', from: 'field_validator', to: 'llm_api',       views: ['SEQUENCE'], label: 'LLM validation' },
    { id: 'r_sq_6', from: 'llm_api',       to: 'field_validator', views: ['SEQUENCE'], label: 'confidence scores' },
    { id: 'r_sq_7', from: 'field_validator', to: 'confidence_router', views: ['SEQUENCE'], label: 'route decision' },
    { id: 'r_sq_8', from: 'confidence_router', to: 'orchestrator', views: ['SEQUENCE'], label: 'route result' },
    // High confidence
    { id: 'r_sq_9', from: 'orchestrator',  to: 'user',            views: ['SEQUENCE'], label: 'approved document' },
    // Low confidence audit
    { id: 'r_sq_10', from: 'confidence_router', to: 'auditor',    views: ['SEQUENCE'], label: 'flag for audit' },
    { id: 'r_sq_11', from: 'auditor',       to: 'orchestrator',   views: ['SEQUENCE'], label: 'corrections' },
    { id: 'r_sq_12', from: 'orchestrator',  to: 'user',           views: ['SEQUENCE'], label: 'completed document' },
  ],

  views: {
    EVENT_STORMING: {
      name: 'Event Storming',
      icon: 'Component',
      nodes: [
        // Row 2: Main flow left → right
        { id: 'user', grid: [0, 2] },
        { id: 'evt_uploaded', grid: [1, 2] },
        { id: 'pol_process', grid: [2, 2] },
        { id: 'cmd_ocr', grid: [3, 2] },
        { id: 'evt_extracted', grid: [5, 2] },
        { id: 'pol_validate', grid: [6, 2] },
        { id: 'cmd_validate', grid: [7, 2] },
        { id: 'evt_validated', grid: [9, 2] },
        { id: 'pol_route', grid: [10, 2] },
        // Stacked above: handlers and external services
        { id: 'orch_extract', grid: [3, 1] },
        { id: 'ocr_service', grid: [4, 1] },
        { id: 'orch_validate', grid: [7, 1] },
        { id: 'llm_api', grid: [8, 1] },
        { id: 'db', grid: [3, 0] },
        // Happy path (row 2, cols 11-12)
        { id: 'evt_approved', grid: [11, 2] },
        { id: 'evt_completed', grid: [12, 2] },
        // Low confidence path (row 3-4, cols 11-14)
        { id: 'evt_flagged', grid: [11, 3] },
        { id: 'pol_audit', grid: [11, 4] },
        { id: 'cmd_audit', grid: [12, 4] },
        { id: 'auditor', grid: [13, 3] },
        { id: 'evt_corrected', grid: [13, 4] },
        { id: 'pol_finalize', grid: [14, 4] },
      ],
      groups: [
        { id: 'es_g1', title: 'Upload & OCR Extraction', desc: 'Document upload triggers OCR extraction pipeline via external OCR service. Raw fields stored in database.', nodeIds: ['user','evt_uploaded','pol_process','cmd_ocr','ocr_service','orch_extract','db','evt_extracted'], color: 'rgba(140,170,238,0.12)', borderColor: '#8caaee', textColor: '#c6d0f5' },
        { id: 'es_g2', title: 'LLM Validation', desc: 'Extracted fields sent to LLM API for semantic validation and confidence scoring.', nodeIds: ['pol_validate','cmd_validate','llm_api','orch_validate','evt_validated'], color: 'rgba(244,184,228,0.12)', borderColor: '#f4b8e4', textColor: '#c6d0f5' },
        { id: 'es_g3', title: 'Confidence Routing', desc: 'Policy routes documents by aggregate confidence: above threshold auto-approves, below flags for audit.', nodeIds: ['pol_route','evt_approved','evt_completed','evt_flagged'], color: 'rgba(229,200,144,0.12)', borderColor: '#e5c890', textColor: '#c6d0f5' },
        { id: 'es_g4', title: 'Human Audit Loop', desc: 'Low-confidence documents dispatched to auditor who corrects fields, then finalized.', nodeIds: ['pol_audit','cmd_audit','auditor','evt_corrected','pol_finalize'], color: 'rgba(231,130,132,0.12)', borderColor: '#e78284', textColor: '#c6d0f5' },
      ]
    },
    SYS_ARCH: {
      name: 'System Architecture',
      icon: 'Server',
      nodes: [
        { id: 'user', grid: [1, 2] },
        { id: 'orchestrator', grid: [3, 2] },
        { id: 'db', grid: [2, 3] },
        { id: 'ocr_service', grid: [2, 0] },
        { id: 'field_validator', grid: [4, 1] },
        { id: 'llm_api', grid: [5, 0] },
        { id: 'confidence_router', grid: [5, 2] },
        { id: 'pol_audit', grid: [5, 3] },
        { id: 'auditor', grid: [4, 4] },
      ],
      groups: [
        {
          id: 'sa_boundary',
          title: 'Pipeline System',
          desc: 'Internal pipeline components — orchestrator, validator, router, database, and audit policy.',
          nodeIds: ['orchestrator', 'db', 'field_validator', 'confidence_router', 'pol_audit'],
          color: 'rgba(129,200,190,0.06)',
          borderColor: '#81c8be',
          textColor: '#c6d0f5',
        }
      ]
    },
    DATA_FLOW: {
      name: 'Data Flow (DFD)',
      icon: 'Share2',
      nodes: [
        // Row 1 (main pipeline): left-to-right data transformation
        { id: 'user', grid: [0, 1] },
        { id: 'evt_uploaded', grid: [2, 1] },
        { id: 'evt_extracted', grid: [4, 1] },
        { id: 'evt_validated', grid: [6, 1] },
        { id: 'approved_doc', grid: [8, 1] },
        // Row 2 (low-confidence branch): data diverts down then loops back
        { id: 'evt_flagged', grid: [6, 2] },
        { id: 'evt_corrected', grid: [8, 2] },
      ],
      groups: []
    },
    SWIMLANES: {
      name: 'Activity Swimlanes',
      icon: 'Layers',
      nodes: [
        // Lane 0 — Human Actors (row 0)
        { id: 'user', grid: [0, 0] },
        { id: 'auditor', grid: [8, 0] },
        { id: 'approved_doc', grid: [10, 0] },
        // Lane 1 — Internal System (rows 1-2)
        { id: 'orchestrator', grid: [2, 1] },
        { id: 'field_validator', grid: [4, 1] },
        { id: 'confidence_router', grid: [6, 1] },
        { id: 'db', grid: [3, 2] },
        // Lane 2 — External Services (row 3)
        { id: 'ocr_service', grid: [3, 3] },
        { id: 'llm_api', grid: [5, 3] },
        // Audit risk indicator in system lane
        { id: 'pol_audit', grid: [8, 2] },
      ],
      groups: [
        { id: 'sl_l1', isLane: true, title: 'Human Actors', desc: 'Users uploading documents and auditors correcting low-confidence fields.', row: 0, color: 'rgba(239,159,118,0.10)' },
        { id: 'sl_l2', isLane: true, title: 'Pipeline System', desc: 'Internal orchestrator, validator, router, and database.', y: 200, h: 280, color: 'rgba(153,209,219,0.10)' },
        { id: 'sl_l3', isLane: true, title: 'External Services', desc: 'Third-party OCR and LLM APIs.', row: 3, color: 'rgba(186,187,241,0.10)' },
      ]
    },
    SEQUENCE: {
      name: 'Sequence Diagram',
      icon: 'List',
      nodes: [
        { id: 'user', grid: [0, 0] },
        { id: 'orchestrator', grid: [1, 0] },
        { id: 'ocr_service', grid: [2, 0] },
        { id: 'field_validator', grid: [3, 0] },
        { id: 'llm_api', grid: [4, 0] },
        { id: 'confidence_router', grid: [5, 0] },
        { id: 'auditor', grid: [6, 0] },
      ],
      groups: []
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
