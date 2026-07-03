An **AI agent** is a software system that perceives its environment, reasons about a goal, and takes autonomous actions — potentially across multiple steps — to achieve that goal.

Modern agents combine a large language model with a memory store, a tool registry, and a feedback loop. The LLM acts as the reasoning engine; tools extend what the agent can *do* in the real world.

The key design decision is the **orchestration strategy**: single-agent vs multi-agent, synchronous ReAct loop vs async event-driven pipeline.
