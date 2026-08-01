import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import type { ValidationDiagnostic } from '../../learning-engine/validation/gateway'

interface Props {
  sectionName?: string
  children: ReactNode
  onReset?: () => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class SectionErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo })
    console.error(`[SectionErrorBoundary] Render failure in section "${this.props.sectionName || 'unknown'}":`, error, errorInfo)
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    this.props.onReset?.()
  }

  public render() {
    if (this.state.hasError) {
      const payload: ValidationDiagnostic = {
        tier: 3,
        message: this.state.error?.message || 'An unexpected rendering error occurred inside this section.',
        fixHint: 'Inspect the React component props and underlying section data structure for null dereferences or type mismatches.',
      }

      return (
        <div
          data-testid="section-error-boundary"
          style={{
            margin: '1.5rem 0',
            padding: '1.25rem 1.5rem',
            borderRadius: '0.75rem',
            backgroundColor: '#302D41',
            border: '1px solid #E5C890',
            color: '#C6D0F5',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <AlertTriangle style={{ color: '#E5C890', width: '1.5rem', height: '1.5rem', flexShrink: 0 }} />
            <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#E5C890' }}>
              Section Render Failure ({this.props.sectionName || 'Unknown Section'})
            </h4>
          </div>

          <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.925rem', color: '#E5C890', lineHeight: 1.5 }}>
            {payload.message}
          </p>

          <div style={{ backgroundColor: '#232634', padding: '0.75rem 1rem', borderRadius: '0.5rem', fontSize: '0.85rem', marginBottom: '1rem', fontFamily: 'monospace' }}>
            <div><strong>Tier:</strong> RENDER</div>
            <div><strong>Fix Hint:</strong> {payload.fixHint}</div>
            {this.state.error?.stack && (
              <details style={{ marginTop: '0.5rem', color: '#A6ADC8' }}>
                <summary style={{ cursor: 'pointer' }}>Stack Trace</summary>
                <pre style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap', fontSize: '0.75rem', overflowX: 'auto' }}>
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>

          <button
            onClick={this.handleReset}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.4rem 0.85rem',
              borderRadius: '0.375rem',
              backgroundColor: '#CA9EE6',
              color: '#232634',
              border: 'none',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.85rem',
            }}
          >
            <RefreshCw style={{ width: '0.875rem', height: '0.875rem' }} /> Retry Render
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
