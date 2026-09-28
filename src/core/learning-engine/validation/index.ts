export {
  validateOKFSection,
  validateOKFSectionFile,
  validateSectionFiles,
  validateHexCampaign,
  formatValidationReport,
  formatValidationAsPrompt,
  KNOWN_SECTION_TYPES,
} from './gateway'

export type {
  ValidationContext,
  ValidationDiagnostic,
  ValidationResult,
  SectionFiles,
  SectionMeta,
  SectionLayout,
  ParsedSection,
  LoadedSection,
} from './gateway'

export {
  BRIEF_FILE,
  INTRO_SECTION,
  GROUNDED_SECTION_TYPES,
  TopicBriefSchema,
  validateTopicBrief,
  validateTopicAgainstBrief,
  briefSectionNames,
  findBriefSection,
  prerequisiteTeachIds,
} from './topic-brief'

export type { TopicBrief, BriefTrack, BriefSection, TopicOnDisk, TopicSectionOnDisk } from './topic-brief'
