# 0003 — Logical Grid Coordinate System

We decided to replace absolute coordinates in flowchart views with a logical grid coordinate system where node positions are defined by integer index tuples (`[col, row]`). Spacing, group boundary containers, and swimlane dimensions are calculated automatically at runtime by the layout compiler, matching grid cells to node sizes. This eliminates coordinate calculations and node-size planning for AI generation agents, allowing them to construct flowcharts by reading only the schema documentation.
