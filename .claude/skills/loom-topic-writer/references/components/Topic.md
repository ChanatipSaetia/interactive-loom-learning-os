## Focused component contracts

Manifest rules: topic.oui must contain exactly one root = Topic(...) statement. Topic lists SectionRef names in learning order; it is not a Page. A bare Topic(...) call is invalid source.

## Component Signatures

Topic(title: string, category: string, description: string, sections: SectionRef[], tags?: string[], difficulty?: string, updatedAt?: string, isNew?: boolean) — Topic manifest (root of topic.oui): catalog metadata and the ordered list of sections.
  - title: Topic title shown in the catalog and topic header.
  - category: Catalog group the topic is listed under.
  - description: One- or two-sentence summary shown on the catalog card.
  - sections: The sections in reading order, as SectionRef calls.
  - tags: Optional keyword tags for search and filtering.
  - difficulty: Optional level, e.g. "beginner", "intermediate", "advanced".
  - updatedAt: Optional last-updated date, e.g. "2026-05-01".
  - isNew: Optional: true shows a "new" badge in the catalog.
SectionRef(name: string) — Includes the section file sections/<name>.oui of this topic.
  - name: Section file name without .oui, e.g. "intro" for sections/intro.oui.

### Topic: teaching purpose

- Introduce: Organize authored learning content and its navigation or storage references.
- Explore: Identify the relevant topic or page and follow its declared order and identifiers.
- Evidence: Navigation or source presence is not learning evidence.
- Limits: These are document/navigation contracts, not standalone teaching activities. Follow the exact document role, paths and storage authorization; showing is not saving.
