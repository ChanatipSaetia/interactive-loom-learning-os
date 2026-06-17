import { useMemo } from 'react';
import type { FlowchartEntity } from '../types';

export interface JsonPayloadViewerProps {
  entity: FlowchartEntity | null;
}

export function JsonPayloadViewer({ entity }: JsonPayloadViewerProps) {
  const payloadStr = useMemo(() => {
    if (!entity?.jsonPayload) return null;
    return JSON.stringify(entity.jsonPayload, null, 2);
  }, [entity?.jsonPayload]);

  if (!payloadStr) {
    return (
      <div className="inspector-payload-empty" data-testid="json-payload-empty">
        <span className="inspector-payload-placeholder">No payload for this step</span>
      </div>
    );
  }

  const payloadType = entity?.jsonPayload?.type ?? '';

  return (
    <div className="inspector-payload-viewer" data-testid="json-payload-viewer">
      <div className="inspector-payload-header">
        <span className="inspector-payload-type" data-testid="json-payload-type">
          {String(payloadType)}
        </span>
      </div>
      <pre className="inspector-payload-code" data-testid="json-payload-code">
        <code>{payloadStr}</code>
      </pre>
    </div>
  );
}
