import { useState, useEffect, useCallback } from 'react'
import type { SectionConfig } from '../registry'
import { deriveSchema } from '../../sections/flowchart/abstract-flow/derive'
import { loadOKFBundle } from './reader'
import type { OKFBundled } from './types'

export function useOKFBundled(topicId: string) {
  const [bundle, setBundle] = useState<OKFBundled | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const data = await loadOKFBundle(topicId)
      setBundle(data)
      setError(null)
    } catch (e) {
      setError(e as Error)
    } finally {
      setLoading(false)
    }
  }, [topicId])

  useEffect(() => {
    load()
  }, [load])

  return { bundle, loading, error, reload: load }
}

function resolveContent(props: Record<string, unknown>, bundle: OKFBundled): void {
  const contentKey = props._contentKey as string | undefined
  if (!contentKey) return

  switch (contentKey) {
    case 'paragraphs':
      props.paragraphs = bundle.content.paragraphs
      break
    case 'lifecycleMarkdown':
      props.paragraphs = bundle.content.lifecycleMarkdown
      break
    case 'capabilityBullets':
      props.items = bundle.content.capabilityBullets
      break
  }
  delete props._contentKey
}

function mapSection(raw: import('./types').OKFSectionRaw, bundle: OKFBundled): SectionConfig {
  const props: Record<string, unknown> = {}

  if (raw.title) props.title = raw.title
  if (raw.heading) props.heading = raw.heading
  if (raw.ordered !== undefined) props.ordered = raw.ordered

  switch (raw.type) {
    case 'flowchart':
      props.schema = deriveSchema(bundle.flow)
      break
    case 'tradeoff-sandbox':
      props.scenarios = bundle.tradeoffs
      break
    case 'taxonomy-browser':
      props.categories = bundle.taxonomy
      break
    case 'flashcards':
      props.terms = bundle.glossary
      break
  }

  if (raw.contentKey) {
    props._contentKey = raw.contentKey
  }

  resolveContent(props, bundle)
  return { type: raw.type, props }
}

export function bundleToSections(bundle: OKFBundled): SectionConfig[] {
  if (bundle.meta.sections) {
    return bundle.meta.sections.map((raw) => mapSection(raw, bundle))
  }

  return [
    {
      type: 'text',
      props: {
        title: 'What is an AI Agent?',
        heading: 'Autonomous Goal-Directed Systems',
        paragraphs: bundle.content.paragraphs,
      },
    },
    {
      type: 'flowchart',
      props: {
        title: 'AI Agent Architecture',
        schema: deriveSchema(bundle.flow),
      },
    },
    {
      type: 'text',
      props: {
        title: 'Agent Lifecycle',
        paragraphs: bundle.content.lifecycleMarkdown,
      },
    },
    {
      type: 'bullets',
      props: {
        title: 'Key Agent Capabilities',
        ordered: false,
        items: bundle.content.capabilityBullets,
      },
    },
    {
      type: 'tradeoff-sandbox',
      props: {
        title: 'Architecture Trade-off Sandbox',
        scenarios: bundle.tradeoffs,
      },
    },
    {
      type: 'taxonomy-browser',
      props: {
        title: 'AI Agent Capability Taxonomy',
        categories: bundle.taxonomy,
      },
    },
    {
      type: 'flashcards',
      props: {
        terms: bundle.glossary,
      },
    },
  ]
}
