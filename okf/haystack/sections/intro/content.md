**Haystack 2.x** is an open-source framework by deepset for building modern search applications with LLMs. It replaces monolithic pipelines with composable, strongly-typed **Components** wired together in directed multigraph **Pipelines**.

Haystack decouples ingestion (indexing pipeline) from retrieval (query pipeline). The **Indexing Pipeline** converts raw files into embeddable `Document` objects and writes them to a **Document Store**. The **Query Pipeline** retrieves relevant documents at inference time, optionally enriching them with LLM-generated answers.

The framework supports branching, loops, async execution, and custom components — enabling everything from simple semantic search to complex agentic RAG systems with self-correction loops and multi-agent routing.
