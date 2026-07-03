export interface SectionProgress {
  viewed: boolean;
  completed: boolean;
  data: Record<string, unknown>;
}

export interface TopicProgress {
  [sectionId: string]: SectionProgress;
}

export interface ProgressStore {
  [topicId: string]: TopicProgress;
}

export const defaultSectionProgress = (): SectionProgress => ({
  viewed: false,
  completed: false,
  data: {},
});
