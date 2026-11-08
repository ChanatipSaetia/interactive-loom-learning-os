export const USER_JOURNEY_EXAMPLE = `root = Page("Choosing a motorcycle", UserJourney("Choosing a motorcycle", "Maya", "Find a motorcycle for a daily commute", [compare, visit]))
compare = JourneyStage("Compare options", "Find a suitable shortlist", "Maya compares riding position, parking needs and costs.", "The website explains practical differences between models.")
visit = JourneyStage("Visit the dealer", "Check the fit in person", "With the dealer supporting a stationary motorcycle, Maya checks the riding position.", "The dealer explains the controls and alternatives.", "The first model feels uncomfortable.", "Compare another suitable model before deciding.", "Maya leaves with a clearer shortlist, without being pressured to buy.")
`
export const USER_JOURNEY_AUTHORING_GUIDE = `## User Journeys

Use UserJourney to describe a person's experience of physical products, software or services. Use Flowchart for underlying mechanisms or system interactions, and Scenario for branching choices. A journey is an ordered experience, not an Event Storming diagram.

- Write UserJourney(title, person, goal, stages) and JourneyStage(name, goal, action, response, friction?, recovery?, outcome?). Only the first four stage fields are required. Skip an optional field with null when setting a later one.
- Describe visible user actions and product or service responses. Friction and outcome are optional: do not manufacture problems, success, thoughts or emotions. Label proposed experiences as illustrative in the topic description or section Lead; distinguish them from research findings.
- Recovery requires friction. No custom HTML, layout, image generation, IDs or backend is needed.
- Read shows a selectable stage rail and all details of the chosen stage. Present opens with the overall goal and stage rail, then shows one moment per beat: goal, action, response, optional friction with recovery, optional outcome. Stages split into readable pages, grouping at most two moments with a target of 42 words. Moments on the current page reveal progressively; the next page replaces those details. Only the current moment gets focus and narration. The active stage appears once as the prominent heading, with a slider showing only the immediate previous and next stages. Read and Present support neighbor clicks, horizontal swipes and arrow keys on the slider. The stage title is not repeated inside the panel. Page boundaries do not change beat IDs. The overall goal and stage rail remain visible for orientation.
- Narration starts with title and overview, followed by stage1.goal, stage1.action, stage1.response, and stage1.friction / stage1.outcome only when authored. Repeat for each stage. Reordering stages changes their numbered beat IDs; update narration accordingly. Point effects at named stages or their fields, such as "visit.action" and "visit.recovery". A beat without authored narration reads its visible text.

Example (illustrative, not customer research):

\`\`\`
${USER_JOURNEY_EXAMPLE}\`\`\`
`
