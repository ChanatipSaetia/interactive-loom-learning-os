import type { TradeoffStep } from '../../../../sections/tradeoff-sandbox'

export const pipelinePatternStep: TradeoffStep = {
  id: 'pipeline-pattern',
  title: 'Pipeline Pattern',
  description: 'Choose the execution model for your Haystack pipeline.',
  recommended: 'standard-pipeline',
  choices: [
    {
      id: 'standard-pipeline',
      label: 'Standard Pipeline',
      description: 'Sequential execution with optional branching for parallel paths.',
      metrics: { accuracy: 0, latency: 5, complexity: -20, cost: 10 },
      pros: [
        { title: 'Simplest model', description: 'Linear data flow, easy to debug and reason about' },
        { title: 'Type validation', description: 'Pipeline validates all connections before execution' },
        { title: 'Serialization', description: 'Save and load pipelines as YAML for deployment' },
      ],
      cons: [
        { title: 'Sequential bottleneck', description: 'Independent components still run one-by-one' },
        { title: 'No built-in loops', description: 'Requires Pipeline with loops for iterative patterns' },
      ],
      whyThisFits: 'Start with a Standard Pipeline for most use cases. It covers RAG, document search, and basic branching with minimal complexity. Upgrade to AsyncPipeline or loops only when you have a measured performance or control-flow need.',
    },
    {
      id: 'async-pipeline',
      label: 'Async Pipeline',
      description: 'Parallel execution of independent components and branches.',
      metrics: { accuracy: 0, latency: 20, complexity: 10, cost: -5 },
      pros: [
        { title: 'Parallel execution', description: 'Independent branches run concurrently' },
        { title: 'Reduced latency', description: 'Multiple retrievers or LLM calls run simultaneously' },
        { title: 'I/O optimization', description: 'Network-bound operations overlap efficiently' },
      ],
      cons: [
        { title: 'Async complexity', description: 'Requires understanding of async/await patterns' },
        { title: 'Debugging harder', description: 'Non-deterministic execution order complicates tracing' },
      ],
      whenToUse: 'Use when your pipeline has independent branches (e.g., multi-retriever fan-out) and latency is critical.',
    },
    {
      id: 'agent-loop',
      label: 'Agent with Loops',
      description: 'Self-correcting pipeline with iterative feedback and tool use.',
      metrics: { accuracy: 20, latency: -25, complexity: 25, cost: -15 },
      pros: [
        { title: 'Self-correction', description: 'Agent retries with refined approach on failure' },
        { title: 'Tool use', description: 'Agent dynamically calls tools during execution' },
        { title: 'Multi-step reasoning', description: 'Complex goals decomposed into tool-assisted steps' },
      ],
      cons: [
        { title: 'High latency', description: 'Multiple LLM calls per query, often 3-10 iterations' },
        { title: 'Unpredictable cost', description: 'Token usage scales with number of iterations' },
        { title: 'Loop safety', description: 'Must set max iterations to prevent infinite loops' },
      ],
      whenToUse: 'Use for complex tasks requiring reasoning, tool use, or multi-step problem solving where accuracy justifies the latency.',
    },
  ],
}
