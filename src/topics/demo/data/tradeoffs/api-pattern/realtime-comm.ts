import type { TradeoffStep } from '../../../../../sections/tradeoff-sandbox'

export const realtimeCommStep: TradeoffStep = {
  id: 'realtime-comm',
  title: 'Real-time Communication',
  description: 'You need to build a chat application where messages must appear instantly for all connected users.',
  recommended: 'websocket',
  choices: [
    {
      id: 'rest',
      label: 'REST API',
      description: 'Use HTTP request-response pattern for each message.',
      metrics: { latency: -20, throughput: -10, complexity: -10, cost: 5 },
      pros: [
        { title: 'Simple to implement', description: 'Straightforward HTTP calls' },
        { title: 'Built-in caching', description: 'HTTP caching reduces server load' },
      ],
      cons: [
        { title: 'Higher latency', description: 'Each message requires a new HTTP round-trip' },
        { title: 'Requires polling', description: 'Client must poll for new messages' },
      ],
      whenToUse: 'Useful when message frequency is low and real-time delivery is not critical.',
    },
    {
      id: 'websocket',
      label: 'WebSocket',
      description: 'Use persistent full-duplex connection for instant message delivery.',
      metrics: { latency: 25, throughput: 20, complexity: 15, cost: -5 },
      pros: [
        { title: 'Real-time delivery', description: 'Messages arrive instantly without polling' },
        { title: 'Low latency', description: 'Persistent connection eliminates HTTP overhead' },
        { title: 'Efficient for frequent messages', description: 'Single connection handles bidirectional traffic' },
      ],
      cons: [
        { title: 'Complex server setup', description: 'Requires WebSocket server infrastructure' },
        { title: 'Connection management', description: 'Must handle reconnects and state' },
      ],
      whyThisFits: 'WebSocket provides full-duplex, persistent connections ideal for low-latency bidirectional messaging required in real-time chat.',
    },
  ],
}
