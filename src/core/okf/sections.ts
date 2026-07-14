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

export function bundleToSections(bundle: OKFBundled): SectionConfig[] {
  return bundle.map(({ meta, data }) => {
    const props: Record<string, unknown> = {}

    if (meta.title) props.title = meta.title
    if (meta.heading) props.heading = meta.heading
    if (meta.ordered !== undefined) props.ordered = meta.ordered

    switch (data.type) {
      case 'text':
        props.paragraphs = data.paragraphs
        break
      case 'bullets':
        props.items = data.items
        break
      case 'flowchart':
        props.schema = deriveSchema(data.flow)
        break
      case 'tradeoff-sandbox':
        props.scenarios = data.scenarios
        break
      case 'taxonomy-browser':
        props.categories = data.categories
        break
      case 'flashcards':
        props.terms = data.terms
        break
      case 'quiz':
        props.questions = data.questions
        break
      case 'concept-map':
        props.nodes = data.nodes
        props.edges = data.edges
        break
      case 'scenario':
        props.id = data.id
        props.title = data.title
        props.intro = data.intro
        props.nodes = data.nodes
        props.startNode = data.startNode
        break
      case 'decision-tree':
        props.id = data.id
        props.title = data.title
        props.root = data.root
        props.nodes = data.nodes
        break
      case 'image-gallery':
        props.items = data.items
        break
      case 'formula-sandbox':
        props.variables = data.variables
        props.metrics = data.metrics
        break
      case 'reflection-sequence':
        props.challenges = data.challenges
        break
      case 'reflection-template':
        props.challenges = data.challenges
        break
    }

    return { type: meta.type, props }
  })
}
