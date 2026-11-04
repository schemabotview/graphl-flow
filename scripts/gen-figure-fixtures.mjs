// Generate the `figure` fixtures' screenshots: a small program's output (a checkout diagram, drawn
// as an SVG file, and the same diagram in a page) shot in headless Chromium in both themes — the way
// a content repo's spine shoots what its program drew. Committed; re-run after changing the art.
//   node scripts/gen-figure-fixtures.mjs
// The size is the IDE frame's tall bottom slot (715×479, less the 33px bar and borders) at the 4K
// fit (×2.8), rounded up: a figure must never be drawn larger than its image (check fails it).
import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'

const W = 2000, H = 1250
const OUT = 'dev/fixtures/figures'
const THEMES = {
  dark: { bg: '#16181d', box: '#232733', line: '#5b6578', ink: '#e8eaee', muted: '#9aa3b2', accent: '#5b8cff', store: '#3fb27f', bar: '#1d2027' },
  light: { bg: '#ffffff', box: '#f3f5f9', line: '#b8c0cc', ink: '#1b1f24', muted: '#5d6672', accent: '#1f5fc4', store: '#1f8a5b', bar: '#eef1f5' },
}

// The diagram, in its own 1000×560 units: boxes and right-angle arrows, as miniflow draws them.
function diagram(t) {
  const box = (x, y, w, h, title, sub, c = t.accent) => `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${t.box}" stroke="${c}" stroke-width="2.5"/>
    <text x="${x + 20}" y="${y + 40}" font-size="24" font-weight="600" fill="${t.ink}">${title}</text>
    <text x="${x + 20}" y="${y + 72}" font-size="18" fill="${t.muted}">${sub}</text>`
  const arrow = (d) => `<path d="${d}" fill="none" stroke="${t.line}" stroke-width="2.5" marker-end="url(#h)"/>`
  return `
    <defs><marker id="h" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto">
      <path d="M0 0 L10 5 L0 10 z" fill="${t.line}"/></marker></defs>
    ${box(30, 220, 200, 100, 'Browser', 'the shop page')}
    ${box(300, 220, 200, 100, 'API', 'POST /checkout')}
    ${box(580, 90, 220, 100, 'Orders DB', 'Postgres', t.store)}
    ${box(580, 350, 220, 100, 'Payments', 'card provider')}
    ${box(840, 220, 140, 100, 'Email', 'receipt')}
    ${arrow('M232 270 L298 270')}
    ${arrow('M502 255 L540 255 L540 140 L578 140')}
    ${arrow('M502 285 L540 285 L540 400 L578 400')}
    ${arrow('M802 140 L910 140 L910 218')}`
}

const svgFile = (t) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 560" font-family="system-ui, sans-serif">
  <rect width="1000" height="560" fill="${t.bg}"/>${diagram(t)}</svg>`

const page = (t) => `<!doctype html><html><body style="margin:0;background:${t.bg};font-family:system-ui,sans-serif;color:${t.ink}">
  <header style="display:flex;align-items:center;justify-content:space-between;padding:28px 48px;background:${t.bar};border-bottom:2px solid ${t.line}">
    <b style="font-size:40px">miniflow · checkout.json</b>
    <span style="font-size:30px;padding:8px 24px;border:2px solid ${t.line};border-radius:999px">theme: ${t === THEMES.dark ? 'dark' : 'light'}</span>
  </header>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 560" style="display:block;width:100%;height:${H - 112}px" font-family="system-ui, sans-serif">${diagram(t)}</svg>
</body></html>`

mkdirSync(OUT, { recursive: true })
const browser = await chromium.launch()
const tab = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })
for (const [name, t] of Object.entries(THEMES)) {
  await tab.setContent(`<body style="margin:0;background:${t.bg}">${svgFile(t).replace('<svg ', `<svg style="display:block;width:${W}px;height:${H}px" `)}</body>`)
  await tab.screenshot({ path: `${OUT}/checkout-svg-${name}.png` })
  await tab.setContent(page(t))
  await tab.screenshot({ path: `${OUT}/checkout-page-${name}.png` })
  console.log(`${OUT}/checkout-{svg,page}-${name}.png`)
}
await browser.close()
