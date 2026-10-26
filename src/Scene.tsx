import type { Group, Item, Scene as SceneModel, SceneNode, ThemeKey } from './types'

// Step 1 stub: the tree renders as nested flex boxes with no edges and no fit.
// Edges, fit-to-pane and theming land in later milestones.

function ItemView({ node }: { node: Item }) {
  return (
    <div className="gf-item" data-id={node.id} data-tone={node.tone ?? 'neutral'}>
      <div className="gf-item-title">{node.title}</div>
      {node.sub && <div className="gf-item-sub">{node.sub}</div>}
      {node.bullets && <ul className="gf-bullets">{node.bullets.map((b) => <li key={b}>{b}</li>)}</ul>}
    </div>
  )
}

function GroupView({ node }: { node: Group }) {
  return (
    <div className="gf-group" data-id={node.id} data-tone={node.tone ?? 'neutral'}>
      {node.title && <div className="gf-group-title">{node.badge != null && <span className="gf-badge">{node.badge}</span>}{node.title}</div>}
      <div className="gf-body" data-dir={node.dir ?? 'col'}>{node.children.map((c) => <NodeView key={c.id} node={c} />)}</div>
    </div>
  )
}

const NodeView = ({ node }: { node: SceneNode }) => (node.type === 'group' ? <GroupView node={node} /> : <ItemView node={node} />)

export function Scene({ scene, theme = 'dark' }: { scene: SceneModel; theme?: ThemeKey }) {
  return (
    <div className="gf-scene" data-theme={theme}>
      {scene.title && <div className="gf-scene-title">{scene.title}</div>}
      {scene.sub && <div className="gf-scene-sub">{scene.sub}</div>}
      <div className="gf-body" data-dir={scene.dir ?? 'col'}>{scene.nodes.map((n) => <NodeView key={n.id} node={n} />)}</div>
    </div>
  )
}
