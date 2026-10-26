import { ChevronDown, ChevronRight, FileText, Folder } from 'lucide-react'
import type { CSSProperties } from 'react'
import type { Tree, TreeEntry } from './types'

interface Row { entry: TreeEntry; depth: number; path: string }

/**
 * The entries a `tree` draws, depth-first, each with its PATH (`src/jobs/orders.py`). Shared with the
 * edge planner via `treeEntryIds`, like `tableRows` and `codeRows`: an entry is addressable as
 * `<tree id>.<path>`.
 */
function treeRows(entries: TreeEntry[], depth = 0, prefix = ''): Row[] {
  return entries.flatMap((entry) => {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name
    return [{ entry, depth, path }, ...(entry.children ? treeRows(entry.children, depth + 1, path) : [])]
  })
}

export const treeEntryIds = (node: Tree): string[] => treeRows(node.entries).map((r) => `${node.id}.${r.path}`)

export function TreeView({ node, style }: { node: Tree; style?: CSSProperties }) {
  return (
    <div className="gf-tree" data-id={node.id} style={style}>
      <div className="gf-tree-title">{node.title ?? 'Explorer'}</div>
      <div className="gf-tree-body">
        {treeRows(node.entries).map(({ entry, depth, path }) => {
          const folder = entry.folder ?? !!entry.children
          return (
            <div key={path} className="gf-tree-row" data-id={`${node.id}.${path}`} data-state={entry.state} style={{ paddingLeft: 10 + depth * 16 }}>
              {/* A folder with listed children is open; one marked `folder` with none is collapsed. */}
              {!folder ? <span className="gf-tree-chev" /> : entry.children?.length
                ? <ChevronDown size={13} className="gf-tree-chev" aria-hidden /> : <ChevronRight size={13} className="gf-tree-chev" aria-hidden />}
              {folder ? <Folder size={15} aria-hidden /> : <FileText size={15} aria-hidden />}
              <span className="gf-tree-name">{entry.name}</span>
              {entry.note && <span className="gf-tree-note">{entry.note}</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
