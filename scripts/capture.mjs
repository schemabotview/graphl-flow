// Capture fixtures as 3840×2160 PNGs: a 1920×1080 frame at deviceScaleFactor 2.
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

const server = await createServer({ server: { port: PORT, strictPort: true }, logLevel: 'error' })
await server.listen()
const browser = await chromium.launch()
try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 })
  const ids = args.length ? args : await (await page.goto(`http://localhost:${PORT}/`), page.$$eval('li a', (as) => as.map((a) => a.textContent)))
  mkdirSync(out, { recursive: true })
  for (const id of ids) {
    await page.goto(`http://localhost:${PORT}/?capture=1&theme=${theme}#/${id}`)
    await page.waitForSelector('.gf-scene[data-fit="ready"]')
    await page.screenshot({ path: `${out}/${id}-${theme}.png`, clip: { x: 0, y: 0, width: 1920, height: 1080 } })
    console.log(`${out}/${id}-${theme}.png`)
  }
} finally {
  await browser.close()
  await server.close()
}
