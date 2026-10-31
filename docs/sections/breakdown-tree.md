# Section type: `breakdown-tree`

A measurable whole divided into a hierarchy of parts. Use it for meal cost, calories, budgets, populations, study-time allocation and conditional outcome probabilities. Taxonomy classifies concepts without requiring numeric totals; Decision Tree guides choices toward recommendations; Breakdown Tree teaches how quantities or probability mass divide.

## Authoring

```
root = BreakdownTree("Meal cost", [meal, main, side], "quantity", "USD", "Illustrative cost of one meal.")
meal = BreakdownNode("meal", "Whole meal", 20)
main = BreakdownNode("main", "Main dish", 12, "meal", "60% of the whole meal.", "teal")
side = BreakdownNode("side", "Side dish", 8, "meal", "40% of the whole meal.", "peach")
```

- `BreakdownTree(title, nodes, mode?, unit?, description?, takeaway?, heading?, lead?)`
- `BreakdownNode(id, title, value, parent?, description?, color?)`

Exactly one node omits `parent` and becomes the root. Every other node has one declared parent ID and connects to that root. IDs are unique; self-parenting, cycles and missing parents are invalid. Keep node names short. Descriptions carry explanations and assumptions. Use source-backed numbers for factual claims and label constructed examples as illustrative.

## Quantities and conditional probability

In default `quantity` mode, all values use the same unit. Each parent's direct children must sum to its value. Categories must be mutually exclusive and exhaustive; explicitly author a remainder category when needed. Never mix dollars, grams and calories in one tree. Cards display the quantity and its share of the original root. Branches show the child divided by its immediate parent. A zero denominator displays an undefined share (`—`); it never produces NaN or Infinity.

In `probability` mode, leave `unit` empty, set root value to 1, and enter every other node's value as a conditional fraction from 0 to 1. Each set of siblings sums to 1. Branch labels show these conditional probabilities; cards show the product along the root-to-node path. For example, 60% cached × 1% failure given cached = 0.6% failure via cache overall. This uses the conditional-probability chain rule and does not assume independence. For observed counts, use quantity mode and let the tree derive shares.

Floating-point rounding is tolerated; incomplete or inconsistent totals are reported through Tier 3 diagnostics with repair hints. Negative and non-finite values fail structural validation. All calculations use the full source tree, even while viewing a focused subtree.

## Read and Present

Read shows the complete tree. Cards have equal size; the labeled share bars encode the quantitative difference. Descendants inherit their parent's theme accent unless overridden. The supported accents are blue, teal, green, mauve, peach, sky, yellow, pink and lavender. Wide trees scroll horizontally, initially centered on the root. Click a node or use Enter/Space to inspect its path, explanation, share of parent, share of total and (in probability mode) path multiplication. Selection emits `BreakdownNodeSelected`.

Present uses `title`, `overview`, `split1`, `split2`, …, `summary`. Each non-leaf node contributes one split in depth-first authored child order. Overview and summary show the whole tree. A split enlarges its parent and immediate children, retains the ancestry breadcrumb, and keeps the original whole and value visible. Focusing on Main dish never renormalizes Protein's 40% share of the meal into its 66.7% share of Main dish. Branch labels show that local share separately. Several narration steps can explain one split; highlight named node statements using `Highlight`.

Studio provides a Breakdown Tree starter using meal costs and a form for mode, unit, nodes, parents, amounts, descriptions and colors. Add child copies a leaf's whole value into its first child (or conditional probability 1), and starts later children at zero so existing totals are preserved. Changing mode requires entering valid values for the new mode. Removing a branch removes descendants too; remaining totals must be reconciled explicitly by the author.

## Delivery

Domain data has `type: breakdown-tree`, `nodes`, `mode`, `unit`, `description` and `takeaway`. Each node has `id`, `title`, `value`, optional `parent`, `description` and `color`. The composition layer passes this as the renderer/presenter's `section` prop. OUI printing preserves it. The legacy OKF reader accepts an equivalent YAML data resource. The validation gateway and last-valid preview behavior apply as for other section types.
