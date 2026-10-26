import type { SceneModel } from '../../../src'

// Curves are SAMPLED here, in the scene file: the engine plots data, it never evaluates functions.
const range = (a: number, b: number, n: number) => Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1))
const curve = (f: (x: number) => number, a: number, b: number, n = 60) => range(a, b, n).map((x) => [x, f(x)] as [number, number])

export const PLOT_FIXTURES: Record<string, SceneModel> = {
  'plot-line': {
    title: 'Line: complexity classes, sampled in the scene',
    nodes: [{ type: 'plot', id: 'big-o', title: 'Operations vs input size', x: { min: 1, max: 64, label: 'n' }, y: { min: 0, max: 400, label: 'operations' }, series: [
      { kind: 'line', points: curve((n) => n, 1, 64), label: 'O(n)' },
      { kind: 'line', points: curve((n) => n * Math.log2(n), 1, 64), label: 'O(n log n)' },
      { kind: 'line', points: curve((n) => n * n, 1, 20), label: 'O(n²)' },
      { kind: 'line', points: curve((n) => Math.log2(n), 1, 64), label: 'O(log n)', dashed: true },
    ] }],
  },
  'plot-bar': {
    title: 'Bars: a categorical x axis, two series side by side',
    nodes: [{ type: 'plot', id: 'engines', title: 'Query time by engine (s)', x: { labels: ['Spark', 'Trino', 'DuckDB', 'Snowflake', 'BigQuery'] }, y: { min: 0, max: 40, step: 10, label: 'seconds' }, series: [
      { kind: 'bar', points: [[0, 31], [1, 18], [2, 9], [3, 12], [4, 14]], label: 'cold' },
      { kind: 'bar', points: [[0, 22], [1, 11], [2, 4], [3, 6], [4, 7]], label: 'warm' },
    ] }],
  },
  'plot-scatter-area': {
    title: 'Scatter over an area: observations and a fitted band',
    nodes: [{ type: 'plot', id: 'fit', x: { min: 0, max: 10, label: 'batch size (k rows)' }, y: { min: 0, max: 60, label: 'latency (ms)' }, series: [
      { kind: 'area', points: curve((x) => 8 + 4.6 * x, 0, 10, 2), label: 'fit', tone: 'serve' },
      { kind: 'scatter', points: [[0.5, 9], [1.2, 15], [2, 16], [2.8, 22], [3.5, 25], [4.1, 24], [5, 33], [5.8, 34], [6.6, 40], [7.3, 41], [8.1, 47], [9, 49], [9.6, 55]], tone: 'ingest' },
    ] }],
  },
  'plot-segment': {
    title: 'Segments: vectors at the origin, a dashed threshold',
    dir: 'row',
    nodes: [
      { type: 'plot', id: 'vectors', title: 'u + v', x: { min: -2, max: 5 }, y: { min: -2, max: 5 }, series: [
        { kind: 'segment', from: [0, 0], to: [3, 1], arrow: true, label: 'u' },
        { kind: 'segment', from: [0, 0], to: [1, 3], arrow: true, label: 'v' },
        { kind: 'segment', from: [0, 0], to: [4, 4], arrow: true, label: 'u+v', tone: 'store' },
        { kind: 'segment', from: [3, 1], to: [4, 4] },
        { kind: 'segment', from: [1, 3], to: [4, 4] },
      ] },
      { type: 'plot', id: 'slo', title: 'p99 latency vs SLO', x: { min: 0, max: 24, step: 4, label: 'hour' }, y: { min: 0, max: 400, label: 'ms' }, series: [
        { kind: 'line', points: [[0, 120], [2, 110], [4, 95], [6, 130], [8, 210], [10, 260], [12, 240], [14, 330], [16, 290], [18, 220], [20, 170], [22, 140], [24, 125]], label: 'p99' },
        { kind: 'segment', from: [0, 300], to: [24, 300], label: 'SLO 300 ms', tone: 'consume' },
      ] },
    ],
  },
}
