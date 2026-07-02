Core Concepts

1. **Components** — Every building block in Haystack is a component: embedders, retrievers, converters, rankers, LLMs, routers. Each component declares typed inputs and outputs. Components can be used standalone or wired into pipelines. Custom components require only a `@component` decorator and a `run()` method.

2. **Pipelines** — A Pipeline is a directed multigraph of components. You add components with `add_component()`, wire them with `connect()`, and execute with `run()`. Pipelines validate type compatibility at connect time. Haystack supports branching (concurrent paths), loops (iterative self-correction), and AsyncPipeline (parallel execution of independent branches).

3. **Document Store** — The central persistence layer. Think of it as a database that stores `Document` objects and serves them to Retrievers. Haystack supports multiple backends: InMemoryDocumentStore for prototyping, and integrations for OpenSearch, Elasticsearch, Weaviate, Chroma, PostgreSQL, and more. The Document Store is not a pipeline component — it is accessed by components that reference it.

4. **Documents** — The canonical data class. A `Document` carries content (text), embedding (vector), metadata (arbitrary key-value pairs), and a unique ID. All components that process text convert to/from Documents.

5. **Retrievers** — Specialized components that query a Document Store. BM25Retriever for keyword search, EmbeddingRetriever for semantic (vector) search, and hybrid retrievers that combine both. Each Document Store backend typically ships with a matching Retriever.

6. **Metadata Filtering** — Haystack provides a structured query language to filter documents by metadata fields before or during retrieval. This enables exact matching on attributes like category, date, author, or stock status.

7. **Custom Components** — Build any logic with the `@component` decorator. Define inputs via method arguments and outputs with `@component.output_types`. The framework handles serialization, type validation, and pipeline wiring automatically.

8. **SuperComponents** — Wrap an entire sub-pipeline into a single reusable component. This simplifies complex graphs by hiding internal wiring behind a clean interface.
