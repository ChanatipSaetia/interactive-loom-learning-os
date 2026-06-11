import type { TradeoffStep } from '../../../../../sections/tradeoff-sandbox'

export const batchProcessingStep: TradeoffStep = {
  id: 'batch-processing',
  title: 'Batch Data Processing',
  description: 'You need to process large datasets periodically, such as generating daily reports from database exports.',
  recommended: 'rest',
  choices: [
    {
      id: 'rest',
      label: 'REST API',
      description: 'Use batch endpoints to submit and poll for processing results.',
      metrics: { latency: -5, throughput: 15, complexity: -15, cost: 15 },
      pros: [
        { title: 'Simple to implement', description: 'Standard HTTP methods' },
        { title: 'Built-in caching', description: 'HTTP caching reduces server load' },
        { title: 'Easy to monitor', description: 'Standard HTTP tools for debugging' },
      ],
      cons: [
        { title: 'Requires polling', description: 'Must poll endpoint for completion status' },
        { title: 'Not ideal for streaming', description: 'Batch results, not incremental updates' },
      ],
      whyThisFits: 'REST with batch endpoints is simpler to implement and debug for periodic, non-real-time data processing where low latency is not required.',
      whenToUse: 'Best for periodic batch jobs where results are needed within minutes, not milliseconds.',
    },
    {
      id: 'websocket',
      label: 'WebSocket',
      description: 'Use persistent connection to receive real-time processing updates.',
      metrics: { latency: 15, throughput: 5, complexity: 15, cost: -10 },
      pros: [
        { title: 'Real-time progress', description: 'Live updates as processing advances' },
        { title: 'Lower polling overhead', description: 'Push model eliminates repeated requests' },
        { title: 'Immediate results', description: 'Results delivered as soon as available' },
      ],
      cons: [
        { title: 'Complex server setup', description: 'Requires WebSocket server infrastructure' },
        { title: 'Connection management', description: 'Must handle reconnects and state' },
        { title: 'Overkill for periodic jobs', description: 'Adds complexity for infrequent tasks' },
      ],
    },
  ],
}
