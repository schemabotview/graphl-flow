import type { CSSProperties } from 'react'
import { ICONS } from './icons'
import { THEMES, type Theme } from './theme'
import type { Group, Item, Scene as SceneModel, SceneNode, ThemeKey } from './types'

// Layout is CSS grid all the way down: a row is N auto columns (one per non-spanning child),
// a col is one, a grid is `cols`. `span: 'all'` runs 1 / -1. Grid — not flex — because a
// spanning child must not change the natural width the fit will later scale.

type Dir = 'row' | 'col' | 'grid'

function bodyStyle(dir: Dir, children: SceneNode[], cols?: number): CSSProperties {
  const n = dir === 'grid' ? cols ?? 2 : dir === 'row' ? Math.max(1, children.filter((c) => c.span !== 'all').length) : 1
  return { gridTemplateColumns: `repeat(${n}, auto)` }
}

const toneVars = (theme: Theme, node: SceneNode): CSSProperties | undefined =>
  node.tone && ({ '--gf-accent': theme.tones[node.tone].accent, '--gf-tint': theme.tones[node.tone].tint } as CSSProperties)

const spanStyle = (node: SceneNode): CSSProperties | undefined => (node.span === 'all' ? { gridColumn: '1 / -1' } : undefined)

function ItemView({ node, theme }: { node: Item; theme: Theme }) {
  const Icon = node.icon ? ICONS[node.icon] : undefined
  return (
    <div className="gf-item" data-id={node.id} style={{ ...toneVars(theme, node), ...spanStyle(node) }}>
      {Icon && <Icon className="gf-icon" size={28} strokeWidth={1.75} aria-hidden />}
      <div>
        <div className="gf-item-title">{node.title}</div>
        {node.sub && <div className="gf-item-sub">{node.sub}</div>}
        {node.bullets && <ul className="gf-bullets">{node.bullets.map((b) => <li key={b}>{b}</li>)}</ul>}
      </div>
    </div>
  )
}

function GroupView({ node, theme }: { node: Group; theme: Theme }) {
  return (
    <div className="gf-group" data-id={node.id} style={{ ...toneVars(theme, node), ...spanStyle(node) }}>
      {(node.title || node.badge != null) && (
        <div className="gf-group-title">
          {node.badge != null && <span className="gf-badge">{node.badge}</span>}
          {node.title}
        </div>
      )}
      <div className="gf-body" style={bodyStyle(node.dir ?? 'col', node.children, node.cols)}>
        {node.children.map((c) => <NodeView key={c.id} node={c} theme={theme} />)}
      </div>
    </div>
  )
}

const NodeView = ({ node, theme }: { node: SceneNode; theme: Theme }) =>
  node.type === 'group' ? <GroupView node={node} theme={theme} /> : <ItemView node={node} theme={theme} />

export function Scene({ scene, theme: key = 'dark' }: { scene: SceneModel; theme?: ThemeKey }) {
  const t = THEMES[key]
  const vars = {
    '--gf-bg': t.bg, '--gf-surface': t.surface, '--gf-line': t.line, '--gf-ink': t.ink, '--gf-muted': t.muted,
    '--gf-accent': t.tones.neutral.accent, '--gf-tint': t.tones.neutral.tint,
  } as CSSProperties
  return (
    <div className="gf-scene" data-theme={key} style={vars}>
      {scene.title && <div className="gf-scene-title">{scene.title}</div>}
      {scene.sub && <div className="gf-scene-sub">{scene.sub}</div>}
      <div className="gf-body" style={bodyStyle(scene.dir ?? 'col', scene.nodes)}>
        {scene.nodes.map((n) => <NodeView key={n.id} node={n} theme={t} />)}
      </div>
    </div>
  )
}
