import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import '../src/styles.css'
import { Scene, type ThemeKey } from '../src'
import { FIXTURES } from './fixtures'

// Routes: #/<fixtureId>, plus ?theme=dark|light and ?capture=1. No hash lists the catalog.
// ?capture=1 renders ONLY the scene, filling the viewport — the recorder sets that to 3840×2160 at
// deviceScaleFactor 1, as ui-shell's record-course / shots-4k do. Headless Chrome has no saved
// state, so a capture names its theme in the URL.

const FRAME = { width: '100vw', height: '100vh' }

document.body.style.margin = '0' // a capture frame must start at the page origin

function App() {
  const read = () => window.location.hash.replace(/^#\/?/, '')
  const [id, setId] = useState(read)
  useEffect(() => {
    const onHash = () => setId(read())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  const params = new URLSearchParams(window.location.search)
  const theme = (params.get('theme') ?? 'dark') as ThemeKey
  const scene = FIXTURES[id]
  if (!scene) return <ul>{Object.keys(FIXTURES).map((k) => <li key={k}><a href={`#/${k}`}>{k}</a></li>)}</ul>
  if (params.get('capture') === '1') return <div style={FRAME}><Scene scene={scene} theme={theme} /></div>
  return (
    <div style={{ display: 'grid', gap: 12, padding: 16 }}>
      <a href="#/">← fixtures</a>
      {/* A 16:9 preview at window width — the same frame a capture records, just smaller. */}
      <div style={{ width: 'min(100%, calc((100vh - 80px) * 16 / 9))', aspectRatio: '16 / 9', outline: '1px solid #8884' }}>
        <Scene scene={scene} theme={theme} />
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
