### Drawings

When a picture explains it better than words or boxes and arrows, draw it with `Svg` in a standard OpenUI section: the parts of an object (an engine, a cell, a leaf), where things sit (a floor plan, a network, a board), a shape or geometry (an angle, a curve, a wave), or a mechanism at one moment (a piston stroke, a cache hit). Prefer a Loom section when one fits: a process with actors is a Flowchart, figures are a chart, categories are a TaxonomyBrowser.

Plan the picture before the prose: what should the learner be able to picture or explain afterward? Include a labelled concept drawing whenever it makes the idea clearer, without waiting for a request for a picture. For an abstract idea, use a concrete visual analogy and explicitly label where the analogy or schematic simplifies reality. A drawing should explain a relationship, structure or change, not decorate the page. Pair it with a short explanation of what to notice and why it matters, and use narration to connect its parts to the idea one at a time.

Svg(markup: string, caption?: string) — A drawing: one <svg> element with a viewBox, and a caption under it.

How to draw:

- Write the markup as a single-quoted string, `Svg('<svg …>…</svg>', "caption")`, so its attributes keep their double quotes; it may span several lines. One `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 W H">` root; it scales to the width of the section, keeping its proportions.
- Use shapes, paths, text, groups, markers and gradients. Scripts, event handlers, links, external images and `foreignObject` are removed. Use a SMIL `<animate>` only for a loop (`repeatCount="indefinite"`) that shows motion.
- Colors: write a Loom palette name, `fill="green"`, `stroke="overlay1"` (rosewater, flamingo, pink, mauve, red, maroon, peach, yellow, green, teal, sky, sapphire, blue, lavender, text, subtext1, subtext0, overlay2, overlay1, overlay0, surface2, surface1, surface0, base, mantle, crust), so the drawing follows the theme; shapes and text without a fill draw in the text color. Keep it to a few colors with a meaning each.
- Label the parts with `<text>` (font-size about 12–16 in a viewBox a few hundred units wide) and leader lines, as in a textbook figure. Keep it simple and schematic: the few parts the lesson is about, not a detailed illustration.
- Check readability at phone width: a few large shapes, short non-overlapping labels and theme-aware contrast. Split a dense figure into simpler views instead of shrinking the text. Prefer static shapes with narration highlights; animate only a change that teaches something, and avoid expensive filters, blur and decorative loops. Label a schematic as not to scale when proportions could mislead.
- Give every shape narration will point at an `id` (`<path id="bud" …>`), unique within the drawing; make the Svg a named child of a Card or Stack root (`shoot = Svg(…)`), then point at `"shoot.bud"`. Several steps on the drawing's beat can walk it part by part.

Example section file, and its narration walking the drawing shape by shape:

```
// @openui "Two Leaves and a Bud" "What a fine pluck takes"
root = Card([header, shoot, why])
header = CardHeader("The fine pluck", "Only the tip of each tea shoot is picked")
shoot = Svg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 250">
  <path id="stem" d="M180 246 V40" stroke="overlay1" stroke-width="4" fill="none"/>
  <path id="older" d="M180 200 C140 176 96 184 72 210 C108 228 152 224 180 200 Z" fill="surface2"/>
  <path id="leaf2" d="M180 150 C224 120 272 128 296 156 C262 178 214 176 180 150 Z" fill="green"/>
  <path id="leaf1" d="M180 96 C140 68 100 76 80 102 C112 122 152 120 180 96 Z" fill="green"/>
  <path id="bud" d="M180 44 C168 26 172 12 180 4 C188 12 192 26 180 44 Z" fill="teal"/>
  <path d="M190 24 H240" stroke="subtext0" stroke-dasharray="3 3"/>
  <text x="246" y="29" font-size="14">Bud</text>
  <text x="74" y="107" font-size="14" text-anchor="end">1st leaf</text>
  <text x="302" y="161" font-size="14">2nd leaf</text>
  <text x="24" y="244" font-size="12" fill="subtext0">Older leaf: left on the bush</text>
</svg>', "A tea shoot: the bud, then the first and second leaf")
why = Callout("info", "Why only the tip?", "The youngest leaves hold the most amino acids and catechins, so they make the sweetest, fullest cup.")
```

```
root = Narration([title, head, bud, leaves, older, why])
title = NarrationStep("title", "Every fine green tea starts with the same pluck.")
head = NarrationStep("part1", "Pickers take only the very tip of each shoot.", [Highlight("header")])
bud = NarrationStep("part2", "At the top sits the bud, still rolled up.", [Highlight("shoot.bud")])
leaves = NarrationStep("part2", "Then the two youngest leaves below it.", [Spotlight(["shoot.leaf1", "shoot.leaf2"])])
older = NarrationStep("part2", null, [Callout("shoot.older", "Older leaves are tougher and flatter in taste; they stay on the bush.")])
why = NarrationStep("part3", "So two leaves and a bud is a recipe for flavour.", [Highlight("why")])
```
