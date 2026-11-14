import planSource from '../../../samples/token-economics.plan.json?raw'
import type { TopicPlan } from '../../../src/core/learning-engine/composition/oui/topic-plan'
import source from '../../../samples/token-economics.loom.oui?raw'
import { readTopicText } from '../../../src/core/supporting/authoring-editor/workspace/archive'
export const TOKEN_ECONOMICS_OUI = source
export const TOKEN_ECONOMICS_FILES = readTopicText(source)[0].files
export const TOKEN_ECONOMICS_PLAN = JSON.parse(planSource) as TopicPlan
