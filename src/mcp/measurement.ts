/** Content-free measurements. No arguments, source, learner IDs or credentials escape. */
export type AuthoringStage = 'discovery' | 'planning' | 'context' | 'validation' | 'repair' | 'delivery' | 'learning' | 'persistence'
export interface ToolMeasurement {
  schemaVersion: 1
  tool: string
  stage: AuthoringStage
  requestBytes: number
  responseBytes: number
  requestEstimatedTokens: number
  responseEstimatedTokens: number
  latencyMs: number
  succeeded: boolean
  tokenBasis: 'characters/4-estimate'
}
export async function measureTool<T>(tool: string, stage: AuthoringStage, input: unknown, operation: () => Promise<T>, observe?: (measurement: ToolMeasurement) => void): Promise<T> {
  if (!observe) return operation()
  const started = performance.now()
  const request = JSON.stringify(input) ?? ''
  let response = '', succeeded = false
  try {
    const result = await operation()
    response = JSON.stringify(result) ?? ''
    succeeded = !(result && typeof result === 'object' && 'isError' in result && result.isError)
    return result
  } finally {
    const measurement: ToolMeasurement = {
      schemaVersion: 1, tool, stage,
      requestBytes: new TextEncoder().encode(request).length, responseBytes: new TextEncoder().encode(response).length,
      requestEstimatedTokens: Math.ceil(request.length / 4), responseEstimatedTokens: Math.ceil(response.length / 4),
      latencyMs: performance.now() - started, succeeded, tokenBasis: 'characters/4-estimate',
    }
    // Instrumentation must never change a successful tool call into a failure.
    try { observe?.(measurement) } catch { /* observer unavailable */ }
  }
}
