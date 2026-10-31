export const BREAKDOWN_TREE_EXAMPLE = `root = BreakdownTree("Where does the meal budget go?", [meal, main, side, protein, vegetables, rice, other], "quantity", "USD", "Illustrative cost of one meal. All values use the same currency.", "Protein costs 8 USD: 66.7% of the main dish, but 40% of the whole meal.")
meal = BreakdownNode("meal", "Whole meal", 20, null, "The total budget for the main dish and side dish.", "blue")
main = BreakdownNode("main", "Main dish", 12, "meal", "The main dish accounts for 60% of the meal cost.", "teal")
side = BreakdownNode("side", "Side dish", 8, "meal", "The side dish accounts for 40% of the meal cost.", "peach")
protein = BreakdownNode("protein", "Protein", 8, "main", "8 of the main dish's 12 dollars, and 8 of the meal's 20 dollars.")
vegetables = BreakdownNode("vegetables", "Vegetables", 4, "main", "The rest of the main dish costs 4 dollars.")
rice = BreakdownNode("rice", "Rice", 3, "side", "Rice accounts for 15% of the whole meal cost.")
other = BreakdownNode("other", "Other ingredients", 5, "side", "The remaining side-dish ingredients account for 25% of the whole meal cost.")
`
export const BREAKDOWN_TREE_NARRATION = `root = Narration([
  NarrationStep("title", "A meal budget can be divided into dishes, then ingredients. These costs are illustrative."),
  NarrationStep("overview", "Start with the whole twenty-dollar meal. Branch percentages refer to the parent; card percentages refer to the entire meal."),
  NarrationStep("split1", "Twelve dollars goes to the main dish and eight to the side: sixty and forty percent of the total.", [Highlight("main"), Highlight("side")]),
  NarrationStep("split2", "The main dish's twelve dollars divides into eight for protein and four for vegetables.", [Highlight("protein"), Highlight("vegetables")]),
  NarrationStep("split2", "Protein is two thirds of the main dish, but forty percent of the whole meal. The denominator changes the percentage.", [Highlight("protein")]),
  NarrationStep("split3", "The side's eight dollars divides into three for rice and five for other ingredients.", [Highlight("rice"), Highlight("other")]),
  NarrationStep("summary", "Always name the whole you are comparing with: eight dollars can be sixty-six point seven percent of a dish and forty percent of a meal.")
])
`
export const PROBABILITY_TREE_EXAMPLE = `root = BreakdownTree("Request outcome probabilities", [requests, cached, uncached, cachedSuccess, cachedFailure, uncachedSuccess, uncachedFailure], "probability", null, "Illustrative conditional probabilities; cached and uncached requests form a complete partition.", "A cached failure has probability 60% × 1% = 0.6% of all requests.")
requests = BreakdownNode("requests", "All requests", 1)
cached = BreakdownNode("cached", "Cached", 0.6, "requests", "60% of requests use the cache.", "teal")
uncached = BreakdownNode("uncached", "Uncached", 0.4, "requests", "40% of requests do not use the cache.", "mauve")
cachedSuccess = BreakdownNode("cachedSuccess", "Success", 0.99, "cached", "99% conditional on cached; 59.4% of all requests.")
cachedFailure = BreakdownNode("cachedFailure", "Failure", 0.01, "cached", "1% conditional on cached; 0.6% of all requests.")
uncachedSuccess = BreakdownNode("uncachedSuccess", "Success", 0.95, "uncached", "95% conditional on uncached; 38% of all requests.")
uncachedFailure = BreakdownNode("uncachedFailure", "Failure", 0.05, "uncached", "5% conditional on uncached; 2% of all requests.")
`
export const PROBABILITY_TREE_NARRATION = `root = Narration([
  NarrationStep("title", "A probability tree separates conditional chances from overall outcomes. These figures are illustrative."),
  NarrationStep("overview", "Branch labels show conditional probabilities; cards show the probability of reaching each node from the root."),
  NarrationStep("split1", "Sixty percent of requests are cached, and forty percent are uncached.", [Highlight("cached"), Highlight("uncached")]),
  NarrationStep("split2", "Within cached requests, one percent fail. Multiplying sixty percent by one percent gives zero point six percent of all requests.", [Highlight("cachedFailure")]),
  NarrationStep("split3", "Within uncached requests, five percent fail. Forty percent times five percent is two percent overall.", [Highlight("uncachedFailure")]),
  NarrationStep("summary", "Path probabilities multiply conditional chances. A branch percentage alone does not describe its share of all requests.")
])
`
export const BREAKDOWN_TREE_AUTHORING_GUIDE = `## Breakdown Trees

Use \`BreakdownTree\` to divide a measurable whole into a hierarchy: meal cost → dishes → ingredients, calories → meals → foods, spending → categories → expenses, populations → subgroups, or conditional outcomes. Choose Taxonomy for classification without quantities, DecisionTree for recommendations, Timeline for execution duration and overlap, and BreakdownTree for parts of a whole. Time allocation can be a breakdown when the parts sum to a budget; overlapping execution durations do not form such a partition.

- \`BreakdownTree(title, nodes, mode?, unit?, description?, takeaway?, heading?, lead?)\` takes \`BreakdownNode(id, title, value, parent?, description?, color?)\` entries. Exactly one node omits parent; every other node names a parent ID. IDs must be unique, all nodes must connect to the root, and cycles are invalid.
- Default \`quantity\` mode uses one unit for all nodes (USD, grams, requests, minutes, …). Every non-leaf node's children must sum to its value. Children must be mutually exclusive and exhaustive; do not double count categories or mix units. Author an Other category explicitly if the source has a remainder. Cards show absolute quantities and share of the total; branches show share of their parent. Zero totals display an undefined share rather than dividing by zero.
- \`probability\` mode uses conditional fractions from 0 to 1, leaves unit empty, and sets root value to 1. Each complete sibling set sums to 1. Branches show conditional probability; cards show overall probability, computed by multiplying along the path. This is the conditional-probability chain rule; do not claim the stages are independent. Use quantity mode for actual observed counts and their derived shares.
- Use short names, meaningful inherited branch colors, source-backed figures and one clear takeaway. Label deliberately constructed teaching examples as illustrative data. Descriptions explain denominators and assumptions; do not copy long paragraphs into node titles.
- Present beats: \`title\`, \`overview\`, \`split1\`, \`split2\`, …, \`summary\`. Split beats visit non-leaf nodes in depth-first authored child order. Overview and summary show the complete tree; each split enlarges its parent and immediate children, with an ancestry breadcrumb and the whole's value retained. The overall denominator always stays the original root, even in a focused subtree. Multiple narration steps can explain one split. Highlight named nodes; narrate the difference between share of parent and share of the whole.
- In Read, learners can select a node by click or keyboard to inspect its ancestry, description, percentages and probability calculation. Changing the hierarchy changes split beats, so update the narration too.

Cooking-cost section:

\`\`\`
${BREAKDOWN_TREE_EXAMPLE}\`\`\`

Matching narration:

\`\`\`
${BREAKDOWN_TREE_NARRATION}\`\`\`

Conditional-probability section:

\`\`\`
${PROBABILITY_TREE_EXAMPLE}\`\`\`

Matching narration:

\`\`\`
${PROBABILITY_TREE_NARRATION}\`\`\``
