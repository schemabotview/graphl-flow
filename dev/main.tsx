import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import '../src/styles.css'
import { Scene, type ThemeKey } from '../src'
import { FIXTURES } from './fixtures'

// Routes: #/<fixtureId>, plus ?theme=dark|light. No hash lists the catalog.
function App() {
  const read = () => window.location.hash.replace(/^#\/?/, '')
  const [id, setId] = useState(read)
  useEffect(() => {
    const onHash = () => setId(read())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  const theme = (new URLSearchParams(window.location.search).get('theme') ?? 'dark') as ThemeKey
  const scene = FIXTURES[id]
  if (!scene) return <ul>{Object.keys(FIXTURES).map((k) => <li key={k}><a href={`#/${k}`}>{k}</a></li>)}</ul>
  return (
    <div style={{ display: 'grid', gap: 24, justifyItems: 'start' }}>
      <a href="#/">← fixtures</a>
      <Scene scene={scene} theme={theme} />
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
