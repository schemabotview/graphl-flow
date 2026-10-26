import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import '../src/styles.css'
import './harness.css'
import { Scene, type ThemeKey } from '../src'
import { CATEGORIES, FIXTURES } from './fixtures'
import { SAME_FIT } from './fixtures/studies/ide-frame'

// Routes: #/<fixtureId>, plus ?theme=dark|light and ?capture=1.
// ?capture=1 renders ONLY the scene, filling the viewport — the recorder sets that to 3840×2160 at
// deviceScaleFactor 1, as ui-shell's record-course / shots-4k do. Headless Chrome has no saved
// state, so a capture names its theme in the URL.
// The gallery keeps the selection in STATE and only mirrors it to the hash, because a published
// copy of this page cannot route on its URL. Scripts enumerate fixtures by a[data-fixture].

const params = new URLSearchParams(window.location.search)
const fromHash = () => window.location.hash.replace(/^#\/?/, '')
const systemTheme = (): ThemeKey => (window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark')

function Capture() {
  const [id, setId] = useState(fromHash)
  useEffect(() => {
    const onHash = () => setId(fromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  const scene = FIXTURES[id]
  return scene ? <div className="capture"><Scene scene={scene} theme={(params.get('theme') ?? 'dark') as ThemeKey} /></div> : null
}

function Gallery() {
  const [id, setId] = useState(() => (FIXTURES[fromHash()] ? fromHash() : 'barclays-azure'))
  const [theme, setTheme] = useState<ThemeKey>(() => (params.get('theme') as ThemeKey) ?? systemTheme())
  const open = (next: string) => {
    setId(next)
    try { history.replaceState(null, '', `#/${next}`) } catch { /* a sandboxed copy cannot */ }
  }
  const scene = FIXTURES[id]
  return (
    <div className="gallery">
      <nav className="side" aria-label="Fixtures" data-same-fit={JSON.stringify(SAME_FIT)}>
        <div className="brand">graphl-flow <span>fixtures</span></div>
        {CATEGORIES.map(([label, ids]) => (
          <section key={label}>
            <h2>{label}</h2>
            <ul>
              {ids.map((k) => (
                <li key={k}>
                  <a
                    href={`#/${k}`}
                    data-fixture={k}
                    aria-current={k === id ? 'page' : undefined}
                    onClick={(e) => { e.preventDefault(); open(k) }}
                  >
                    {k}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </nav>
      <main className="stage">
        <header className="bar">
          <h1>{id}</h1>
          <div className="toggle" role="group" aria-label="Scene theme">
            {(['dark', 'light'] as const).map((t) => (
              <button key={t} type="button" aria-pressed={theme === t} onClick={() => setTheme(t)}>{t}</button>
            ))}
          </div>
        </header>
        {/* The same 16:9 frame a capture records at 3840×2160, just smaller. */}
        <div className="frame">{scene && <Scene key={id} scene={scene} theme={theme} />}</div>
        <p className="note">16:9 frame, scaled to fit — recorded at 3840×2160. Text is selectable.</p>
      </main>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<StrictMode>{params.get('capture') === '1' ? <Capture /> : <Gallery />}</StrictMode>)
