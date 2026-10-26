import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import '../src/styles.css'
import { Scene, type ThemeKey } from '../src'
import { FIXTURES } from './fixtures'

// Routes: #/<fixtureId>, plus ?theme=dark|light and ?capture=1. No hash lists the catalog.
// ?capture=1 renders ONLY the scene in a fixed 1920×1080 frame (shot at 2× = 3840×2160 by
// scripts/capture.mjs). Headless Chrome has no saved state, so a capture names its theme in the URL.

const FRAME = { width: 1920, height: 1080 }

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
