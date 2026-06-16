import type { ComponentType } from 'react'
import { Registry } from '../registry/generic-registry'

export const TopicRegistry = new Registry<ComponentType>()
