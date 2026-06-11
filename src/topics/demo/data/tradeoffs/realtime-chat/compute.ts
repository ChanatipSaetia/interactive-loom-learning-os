import type { TradeoffStep } from '../../../../../sections/tradeoff-sandbox'

export const computeStep: TradeoffStep = {
  id: 'compute',
  title: 'Compute Layer',
  description: 'Where does the real-time computation happen?',
  recommended: 'node-central',
  choices: [
    {
      id: 'wasm-edge',
      label: 'WebAssembly at Edge',
      description: 'Run compute-intensive logic close to users via WASM edge workers.',
      metrics: { latency: 20, consistency: -10, devex: 5, 'ops-cost': -10 },
      pros: [
        { title: 'Ultra-low latency', description: 'Code runs at network edge' },
        { title: 'Language flexibility', description: 'Rust, C++, Go compiled to WASM' },
        { title: 'Secure sandboxing', description: 'WASM sandbox isolates untrusted code' },
      ],
      cons: [
        { title: 'Debugging difficulty', description: 'WASM stack traces are less readable' },
        { title: 'State management', description: 'Edge workers are typically stateless' },
        { title: 'Tooling maturity', description: 'WASM ecosystem still evolving' },
      ],
      whenToUse: 'Suitable when ultra-low latency is the primary concern and the compute logic is stateless and lightweight.',
    },
    {
      id: 'node-central',
      label: 'Node.js Centralized',
      description: 'Centralized Node.js cluster handling WebSocket connections.',
      metrics: { latency: 5, consistency: 15, devex: 15, 'ops-cost': 15 },
      pros: [
        { title: 'Mature ecosystem', description: 'npm has everything needed' },
        { title: 'Shared language', description: 'Same JS/TS as frontend' },
        { title: 'Simple debugging', description: 'Familiar stack traces and tools' },
      ],
      cons: [
        { title: 'Single region latency', description: 'All traffic routes to one datacenter' },
        { title: 'Memory limits', description: 'V8 heap can bottleneck under load' },
      ],
      whyThisFits: 'For collaborative systems, keeping state centralized simplifies consistency guarantees and makes debugging real-time interactions straightforward. Shared language with the frontend accelerates development.',
    },
  ],
}
