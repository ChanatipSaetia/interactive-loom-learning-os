import { useState, useEffect, useCallback } from 'react'
import type { SectionConfig } from '../../registry'
import { deriveSchema } from '../../sub-contexts/process-simulation/components/flowchart/abstract-flow/derive'
import { loadOKFBundle, getCachedOKFBundle } from './reader'
import type { OKFBundled } from './types'

export function useOKFBundled(topicId: string | null) {
  const [bundle, setBundle] = useState<OKFBundled | null>(() => (topicId ? getCachedOKFBundle(topicId) ?? null : null))
  const [loading, setLoading] = useState(!!topicId && !getCachedOKFBundle(topicId))
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    if (!topicId) return
    try {
      if (!getCachedOKFBundle(topicId)) {
        setLoading(true)
      }
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
    if (!topicId) return
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
    if (meta.intro) props.intro = meta.intro

    switch (data.type) {
      case 'intro':
        props.title = data.title ?? meta.title
        props.subtitle = data.subtitle
        props.estimatedTime = data.estimatedTime
        props.moduleCount = data.moduleCount
        props.what = data.what
        props.why = data.why
        props.roadmap = data.roadmap
        break
      case 'text':
        props.paragraphs = data.paragraphs
        break
      case 'bullets':
        props.items = data.items
        break
      case 'flowchart':
        props.schema = data.flow ? deriveSchema(data.flow as any) : data.views ? data : undefined
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
      case 'pillar-layer':
        props.section = data
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
