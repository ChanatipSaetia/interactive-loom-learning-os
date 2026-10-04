import { createElement, type ComponentType } from 'react'
import type { ComponentRenderer, Library } from '@openuidev/react-lang'
import { openuiLibrary } from '@openuidev/react-ui/genui-lib'
import {
  AreaChartCondensed,
  BarChartCondensed,
  HorizontalBarChart,
  LineChartCondensed,
  PieChart,
  RadarChart,
  RadialChart,
  ScatterChart,
  SingleStackedBar,
} from '@openuidev/react-ui/Charts'
import { paletteForSeries, useLoomChartColors } from './chart-palette'

/**
 * The standard OpenUI library with its charts drawn in the Loom theme colors.
 *
 * Upstream charts take their colors from react-ui's theme context, but the
 * `genui-lib` bundle carries its own copy of that context, which Loom can't
 * provide (see theme.ts), so they always fall back to the built-in blue
 * "ocean" ramp. Each chart component is swapped for one with the same name and
 * props that renders react-ui's chart with a `customPalette` of Loom tokens.
 * The props, descriptions and data handling mirror upstream's genui-lib.
 */

type Props = Record<string, unknown>
type ElementNode = { type: 'element'; props: Props }

const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : v == null ? [] : [v])

const asElementNodes = (v: unknown): ElementNode[] =>
  asArray(v).filter((x): x is ElementNode => typeof x === 'object' && x !== null && (x as { type?: unknown }).type === 'element')

const unwrap = (node: unknown): Props | undefined =>
  (node as ElementNode | undefined)?.type === 'element' ? (node as ElementNode).props : (node as Props | undefined)

type ChartRow = { category: string } & Record<string, string | number>

/** Rows of `{ category, <series>: value }` from `labels` and `Series(...)` (or row arrays). */
function buildChartData(labels: unknown, series: unknown): ChartRow[] {
  const lbls = asArray(labels) as string[]
  const rows = asArray(series)
  if (rows.length > 0 && Array.isArray(rows[0])) {
    const seriesNames = lbls.slice(1)
    return (rows as unknown[][]).map((cells) => {
      const point: ChartRow = { category: String(cells[0] ?? '') }
      seriesNames.forEach((name, si) => {
        const val = cells[si + 1]
        point[name] = typeof val === 'number' ? val : Number(val) || 0
      })
      return point
    })
  }
  const seriesNodes = asElementNodes(series)
  return lbls.map((label, i) => {
    const point: ChartRow = { category: label }
    seriesNodes.forEach((s) => {
      const cat = s.props.category
      const vals = s.props.values
      if (typeof cat === 'string' && Array.isArray(vals) && i < vals.length) point[cat] = vals[i] as number
    })
    return point
  })
}

/** `{ category, value }` slices from `labels` + `values`, or from `Slice(...)` nodes. */
function buildSliceData(labels: unknown, values: unknown): Array<{ category: string; value: number }> {
  const lbls = asArray(labels)
  const vals = asArray(values)
  if (lbls.length > 0 && vals.length > 0) {
    return lbls.map((cat, i) => ({ category: String(cat), value: typeof vals[i] === 'number' ? (vals[i] as number) : 0 }))
  }
  return asElementNodes(labels).map((s) => ({ category: s.props.category as string, value: s.props.value as number }))
}

const seriesCount = (data: ChartRow[]) => Math.max(0, ...data.map((row) => Object.keys(row).length - 1))

// react-ui's chart prop types are generic over the row shape; the wrappers
// below build the rows themselves, so they render through a loose type.
const el = (component: unknown, props: Props) => createElement(component as ComponentType<Props>, props)

/** Category charts: `labels` plus a list of `Series`. */
function seriesChart(chart: unknown, extra: (props: Props) => Props = () => ({})): ComponentRenderer<Props> {
  return function LoomSeriesChart({ props }) {
    const colors = useLoomChartColors()
    if (props.labels == null || props.series == null) return null
    const data = buildChartData(props.labels, props.series)
    if (!data.length) return null
    return el(chart, {
      data,
      categoryKey: 'category',
      customPalette: paletteForSeries(colors, seriesCount(data)),
      isAnimationActive: false,
      ...extra(props),
    })
  }
}

const axes = (props: Props): Props => ({
  variant: props.variant,
  xAxisLabel: props.xLabel,
  yAxisLabel: props.yLabel,
})

/** Part-of-whole charts: `labels` plus `values` (or `Slice`s). */
function sliceChart(chart: unknown, extra: (props: Props) => Props = () => ({})): ComponentRenderer<Props> {
  return function LoomSliceChart({ props }) {
    const colors = useLoomChartColors()
    const data = buildSliceData(props.labels, props.values)
    if (!data.length) return null
    return el(chart, {
      data,
      categoryKey: 'category',
      dataKey: 'value',
      customPalette: paletteForSeries(colors, data.length),
      ...extra(props),
    })
  }
}

const ScatterChartRenderer: ComponentRenderer<Props> = ({ props }) => {
  const colors = useLoomChartColors()
  if (props.datasets == null) return null
  const data = asArray(props.datasets).map((ds) => {
    const dsProps = unwrap(ds)
    return {
      name: (dsProps?.name as string | undefined) ?? '',
      data: asArray(dsProps?.points).map((pt) => {
        const p = unwrap(pt)
        return { x: Number(p?.x), y: Number(p?.y), ...(p?.z != null ? { z: Number(p.z) } : {}) }
      }),
    }
  })
  if (!data.length) return null
  return el(ScatterChart, {
    data,
    xAxisDataKey: 'x',
    yAxisDataKey: 'y',
    xAxisLabel: props.xLabel,
    yAxisLabel: props.yLabel,
    customPalette: paletteForSeries(colors, data.length),
    isAnimationActive: false,
  })
}

const THEMED_CHARTS: Record<string, ComponentRenderer<Props>> = {
  BarChart: seriesChart(BarChartCondensed, (p) => ({ ...axes(p), height: p.height })),
  LineChart: seriesChart(LineChartCondensed, (p) => ({ ...axes(p), height: p.height })),
  AreaChart: seriesChart(AreaChartCondensed, (p) => ({ ...axes(p), height: p.height })),
  HorizontalBarChart: seriesChart(HorizontalBarChart, axes),
  RadarChart: seriesChart(RadarChart),
  PieChart: sliceChart(PieChart, (p) => ({
    variant: p.variant ?? 'pie',
    appearance: p.appearance ?? 'circular',
    isAnimationActive: false,
  })),
  RadialChart: sliceChart(RadialChart, () => ({ isAnimationActive: false })),
  SingleStackedBarChart: sliceChart(SingleStackedBar),
  ScatterChart: ScatterChartRenderer,
}

function withThemedCharts(library: Library): Library {
  const components = { ...library.components }
  for (const [name, component] of Object.entries(THEMED_CHARTS)) {
    const upstream = components[name]
    if (upstream) components[name] = { ...upstream, component }
  }
  return { ...library, components }
}

/** The library the `openui` section renders with. */
export const loomOpenUILibrary: Library = withThemedCharts(openuiLibrary)
