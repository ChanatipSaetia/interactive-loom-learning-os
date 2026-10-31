# Topic and shared components

Arguments marked with ? are optional. Read core/syntax.md for positional argument rules.

Lead(what?: string, why?: string, next?: string) — Short lead-in shown above a section: what it shows, why it matters, and what comes next.
  - what: What this section shows, in one sentence.
  - why: Why it matters to the learner.
  - next: What the learner should do or look for next.
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
Catalog(topics: TopicRef[]) — Content catalog (root of index.oui): the ordered list of topics.
  - topics: The topics in catalog order, as TopicRef calls.
TopicRef(id: string) — Includes the topic folder <id>/topic.oui in the catalog.
  - id: Topic folder name under the content root.
Domain(title: string, description: string, topics: TopicRef[], goal?: string) — A learner's subject area (root of Loom/<domain-id>/domain.oui): its title, its topics in suggested learning order and the learner's goal.
  - title: Domain name shown to the learner (e.g. "Fight Animation"); topics in it use it as their category.
  - description: One or two sentences on what the domain covers.
  - topics: Its topics in suggested learning order, as TopicRef calls naming files in topics/ (TopicRef("punch-basics") for topics/punch-basics.loom.oui).
  - goal: Optional: what the learner wants to reach in this domain, in their words (e.g. "animate a 10-second fight scene in Blender").
DomainRef(id: string) — Includes the domain folder Loom/<id>/ (its domain.oui) in the library.
  - id: Domain ID: the folder name under Loom/, lowercase letters, digits, - and _ (e.g. "fight-animation").
Library(domains: DomainRef[]) — The learner's library (root of Loom/index.oui): the list of their domains.
  - domains: The domains, as DomainRef calls, most recently studied first.
