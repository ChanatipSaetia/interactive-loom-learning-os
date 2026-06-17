import type { FlowchartEntity } from '../types';

export interface ERDSchemaWidgetProps {
  entity: FlowchartEntity | null;
}

export function ERDSchemaWidget({ entity }: ERDSchemaWidgetProps) {
  if (!entity?.erdSchema || entity.erdSchema.length === 0) {
    return (
      <div className="inspector-erd-empty" data-testid="erd-schema-empty">
        <span className="inspector-erd-placeholder">No schema for this entity</span>
      </div>
    );
  }

  return (
    <div className="inspector-erd-schema" data-testid="erd-schema-widget">
      {entity.erdSchema.map((table) => (
        <div key={table.name} className="inspector-erd-table" data-testid={`erd-table-${table.name}`}>
          <div className="inspector-erd-table-header">
            <span className="inspector-erd-table-name">{table.name}</span>
          </div>
          <div className="inspector-erd-columns">
            {table.columns.map((col) => (
              <div
                key={col.name}
                className="inspector-erd-column"
                data-testid={`erd-column-${table.name}-${col.name}`}
              >
                <span className="inspector-erd-col-key">
                  {col.primaryKey ? 'PK' : col.notNull ? 'NN' : ''}
                </span>
                <span className="inspector-erd-col-name">{col.name}</span>
                <span className="inspector-erd-col-type">{col.type}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
