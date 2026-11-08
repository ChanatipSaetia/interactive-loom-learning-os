import type { TopicPlan } from '../../../src/core/learning-engine/composition/oui/topic-plan'

// User-supplied request; the bad plan below is an authored reproduction, not a captured model trace.
export const THREE_SPLINE_REQUEST = 'I want you to research about the three js or spline capabilities to create the web app with 3D. Also, research the cutting edge use case samples and how it works. Please create the full topic lesson on Loom.'
export const TEXT_HEAVY_REPRO_PLAN: TopicPlan = {
  schemaVersion: 1, topicId: 'three-spline', goal: THREE_SPLINE_REQUEST,
  objectives: [
    { id: 'compare', description: 'Compare Three.js and Spline capabilities', evidenceOfLearning: 'Explain their different authoring approaches' },
    { id: 'trace', description: 'Trace the rendering workflow and component interactions', evidenceOfLearning: 'Explain how a rendering request moves between participants' },
  ],
  sections: [
    { id: 'capabilities', title: 'Capabilities', objectiveRefs: ['compare'], representation: 'text', activity: 'Read the capability comparison', rationale: 'Text explains complex concepts clearly.', presentation: { target: 'both', strategy: 'Read paragraphs and narrate them in Present' } },
    { id: 'rendering', title: 'How it works', objectiveRefs: ['trace'], representation: 'text', activity: 'Read how the rendering workflow works', rationale: 'Text is the simplest format for a detailed explanation.', presentation: { target: 'both', strategy: 'Present each paragraph in order' } },
  ],
}
export const TEXT_HEAVY_REPRO_OUI = "// @loom-topic three-spline\n// === topic.oui ===\nroot = Topic(\"Three.js and Spline\", \"3D web\", \"Compare and trace\", [SectionRef(\"capabilities\"), SectionRef(\"rendering\")])\n// === sections/capabilities.oui ===\nroot = Page(\"Capabilities\", LessonText(\"Capabilities\", [\"Three.js uses application code; Spline offers visual authoring.\"]))\n// === sections/rendering.oui ===\nroot = Page(\"Rendering\", LessonText(\"Rendering\", [\"The application sends the scene and camera to a renderer.\"]))\n"
