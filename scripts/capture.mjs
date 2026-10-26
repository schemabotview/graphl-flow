// Capture fixtures as 3840×2160 PNGs: a 3840×2160 viewport at deviceScaleFactor 1 — the same
// frame ui-shell's record-course.mjs and shots-4k.mjs record, so a still matches the video.
//   node scripts/capture.mjs [fixtureId ...] [--theme dark|light] [--out captures]
// No ids captures every fixture. Boots its own vite on :5176.
import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'
import { createServer } from 'vite'

const args = process.argv.slice(2)
const flag = (name, fallback) => { const i = args.indexOf(`--${name}`); return i < 0 ? fallback : args.splice(i, 2)[1] }
const theme = flag('theme', 'dark')
const out = flag('out', 'captures')
const PORT = 5176
const W = 3840, H = 2160

const server = await createServer({ server: { port: PORT, strictPort: true }, logLevel: 'error' })
await server.listen()
const browser = await chromium.launch()
try {
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })
  const ids = args.length ? args : await (await page.goto(`http://localhost:${PORT}/`), page.$$eval('a[data-fixture]', (as) => as.map((a) => a.dataset.fixture)))
  mkdirSync(out, { recursive: true })
  for (const id of ids) {
    await page.goto(`http://localhost:${PORT}/?capture=1&theme=${theme}#/${id}`)
    await page.waitForSelector('.gf-scene[data-fit="ready"]')
    // A still is reproducible only if the edge pulses stand still: freeze every SVG at t = 0.
    await page.evaluate(() => document.querySelectorAll('svg').forEach((s) => { s.pauseAnimations(); s.setCurrentTime(0) }))
    await page.screenshot({ path: `${out}/${id}-${theme}.png`, clip: { x: 0, y: 0, width: W, height: H } })
    console.log(`${out}/${id}-${theme}.png`)
  }
} finally {
  await browser.close()
  await server.close()
}
