export interface WordTerm {
  id: string;
  word: string;
  pronunciation: string;
  category: string;
  image?: string;
  shortDefinition: string;
  detailedDefinition: string;
  whyItMatters: string;
  dialogue?: {
    user: string;
    aiThoughts: string;
    aiQuestion: string;
  };
}
