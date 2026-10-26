// Sweep EVERY fixture × both themes at the recording frame (3840×2160) and measure the result.
// Exhaustive on purpose: an assertion earns its place by catching what a screenshot glance missed.
// Fails on: module paths differing only by case; an edge off its node's face / not orthogonal / shorter than 24px / crossing an unrelated
// node; overlapping labels or a label on an item; any overflow; content outside the frame; a fit
// that moves after data-fit="ready"; any page or console error. Boots its own vite on :5178.
import { execSync } from 'node:child_process'
import { chromium } from 'playwright'
import { createServer } from 'vite'

// Module paths that differ only by case collide on macOS/Windows: an extensionless import
// resolves case-insensitively to whichever file it meets first (`./Edges` found src/edges.ts, not
// src/Edges.tsx). Compare tracked paths case-folded and with the extension stripped.
const tracked = execSync('git ls-files', { encoding: 'utf8' }).split('\n').filter(Boolean)
const byFold = Map.groupBy(tracked, (f) => f.toLowerCase().replace(/\.[cm]?[jt]sx?$/, ''))
const clashes = [...byFold.values()].filter((fs) => fs.length > 1)
if (clashes.length) {
  console.log('FAIL module paths differ only by case:', clashes.map((fs) => fs.join(' / ')).join('; '))
  process.exit(1)
}
const server = await createServer({ server: { port: 5178, strictPort: true }, logLevel: 'error' }); await server.listen()
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 3840, height: 2160 } })
const errs = []; let at = ''
p.on('pageerror', e => errs.push(`${at}: ${e.message}`)); p.on('console', m => m.type() === 'error' && errs.push(`${at}: ${m.text()}`))
const ids = await (await p.goto('http://localhost:5178/'), p.$$eval('a[data-fixture]', as => as.map(a => a.dataset.fixture)))
let fails = 0
const BODY_MIN_PX = +(process.env.BODY_MIN_PX ?? 24), ICON_MIN_PX = +(process.env.ICON_MIN_PX ?? 32)
const fits = new Map()
for (const theme of ['dark', 'light']) for (const id of ids) {
  at = `${theme} ${id}`
  await p.goto(`http://localhost:5178/?capture=1&theme=${theme}#/${id}`); await p.waitForSelector('.gf-scene[data-fit="ready"]')
  const before = await p.$eval('.gf-content', c => c.style.transform); await p.waitForTimeout(300)
  await p.evaluate(([b, i]) => { window.BODY_MIN_PX = b; window.ICON_MIN_PX = i }, [BODY_MIN_PX, ICON_MIN_PX])
  const res = await p.evaluate(() => {
    const c = document.querySelector('.gf-content'), box = c.getBoundingClientRect(), s = box.width / c.offsetWidth
    const R = (el) => { const r = el.getBoundingClientRect(); return { x: (r.left - box.left) / s, y: (r.top - box.top) / s, w: r.width / s, h: r.height / s } }
    const node = (id) => document.querySelector(`[data-id="${id}"]`)
    const onFace = (pt, r) => {
      const near = (a, b) => Math.abs(a - b) < 0.01, inY = pt.y >= r.y && pt.y <= r.y + r.h, inX = pt.x >= r.x && pt.x <= r.x + r.w
      return (near(pt.x, r.x - 4) && inY) || (near(pt.x, r.x + r.w + 4) && inY) || (near(pt.y, r.y - 4) && inX) || (near(pt.y, r.y + r.h + 4) && inX)
    }
    const paths = [...document.querySelectorAll('.gf-edge')]
    const pts = (e) => e.dataset.route.slice(2).split(' L ').map((q) => q.split(',').map(Number)).map(([x, y]) => ({ x, y }))
    const len = (ps) => ps.reduce((sum, q, i) => i ? sum + Math.abs(q.x - ps[i-1].x) + Math.abs(q.y - ps[i-1].y) : 0, 0)
    const problems = []
    const all = [...document.querySelectorAll('[data-id]')]
    for (const e of paths) {
      const ps = pts(e), a = node(e.dataset.from), z = node(e.dataset.to), tag = `${e.dataset.from}->${e.dataset.to}`
      if (!ps.every((q, i) => i === 0 || q.x === ps[i - 1].x || q.y === ps[i - 1].y)) problems.push(`not orthogonal ${tag}`)
      if (!onFace(ps[0], R(a)) || !onFace(ps.at(-1), R(z))) problems.push(`off face ${tag}`)
      if (len(ps) < 24) problems.push(`short ${tag}`)
      // A row end must leave its TABLE, not just its row: a row narrower than its frame starts the
      // arrow inside the border (title wider than the cells, in memory-hashmap).
      for (const [el, pt] of [[a, ps[0]], [z, ps.at(-1)]]) {
        const t = el.tagName === 'TR' && el.closest('.gf-table')
        if (t) { const r = R(t); if (pt.x > r.x && pt.x < r.x + r.w) problems.push(`${tag} ends inside table ${t.dataset.id}`) }
      }
      // A segment may cross ancestors/descendants of its ends, never an unrelated node's interior.
      for (const n of all) {
        if (n.contains(a) || n.contains(z) || a.contains(n) || z.contains(n)) continue
        const r = R(n)
        const cuts = ps.some((q, i) => i > 0 && (() => {
          const p0 = ps[i - 1], x0 = Math.min(p0.x, q.x), x1 = Math.max(p0.x, q.x), y0 = Math.min(p0.y, q.y), y1 = Math.max(p0.y, q.y)
          return x0 < r.x + r.w - 1 && x1 > r.x + 1 && y0 < r.y + r.h - 1 && y1 > r.y + 1
        })())
        if (cuts) problems.push(`${tag} crosses ${n.dataset.id}`)
      }
    }
    // Plot text is placed by counted gutters, not by layout: every <text> must sit inside its SVG,
    // or a miscount clips a tick or a label silently (the SVG is overflow: hidden).
    for (const svg of document.querySelectorAll('.gf-plot svg')) {
      const r = svg.getBoundingClientRect()
      for (const t of svg.querySelectorAll('text')) {
        const b = t.getBoundingClientRect()
        if (b.left < r.left - 0.5 || b.right > r.right + 0.5 || b.top < r.top - 0.5 || b.bottom > r.bottom + 0.5)
          problems.push(`plot ${svg.closest('[data-id]').dataset.id} clips text "${t.textContent}"`)
      }
    }
    const ls = [...document.querySelectorAll('.gf-edge-label')].map((l) => l.getBoundingClientRect())
    const hit = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom
    if (ls.some((a, i) => ls.some((b, j) => j > i && hit(a, b)))) problems.push('labels overlap')
    // A label may sit only on its OWN edge: another edge running under it reads as one line (Spark's
    // dashed back edge passed under the 'tasks' label once spread moved its end).
    for (const l of document.querySelectorAll('.gf-edge-label')) {
      const lr = l.getBoundingClientRect()
      for (const e of paths.filter((e) => e.dataset.edge !== l.dataset.edge)) {
        const ps = pts(e).map((q) => ({ x: box.left + q.x * s, y: box.top + q.y * s }))
        const under = ps.some((q, i) => i > 0 && Math.min(ps[i - 1].x, q.x) < lr.right && Math.max(ps[i - 1].x, q.x) > lr.left
          && Math.min(ps[i - 1].y, q.y) < lr.bottom && Math.max(ps[i - 1].y, q.y) > lr.top)
        if (under) problems.push(`edge ${e.dataset.from}->${e.dataset.to} runs under label "${l.textContent}"`)
      }
    }
    if (ls.some((l) => [...document.querySelectorAll('.gf-item')].some((n) => hit(l, n.getBoundingClientRect())))) problems.push('label on node')
    // LEGIBILITY on video: the smallest text people must read, and the smallest item icon, measured in
    // the 4K frame. 24px is 12px at 1080p. A scene denser than this fails like an overflow does —
    // split it or trim it (Barclays read at 20px before the type scale and reading measure).
    const BODY = '.gf-item-title, .gf-item-sub, .gf-bullets li, .gf-table td, .gf-line, .gf-tree-name, .gf-note, .gf-edge-label'
    const minBody = Math.min(...[...document.querySelectorAll(BODY)].filter((e) => e.textContent.trim()).map((e) => parseFloat(getComputedStyle(e).fontSize) * s))
    if (minBody < window.BODY_MIN_PX) problems.push(`body text ${minBody.toFixed(1)}px < ${window.BODY_MIN_PX}px at 4K`)
    const minIcon = Math.min(...[...document.querySelectorAll('.gf-item > .gf-icon')].map((e) => e.getBoundingClientRect().height))
    if (minIcon < window.ICON_MIN_PX) problems.push(`item icon ${minIcon.toFixed(1)}px < ${window.ICON_MIN_PX}px at 4K`)
    const over = [...document.querySelectorAll('.gf-scene *')].filter(e => !(e instanceof SVGElement) && getComputedStyle(e).display !== 'inline' && e.scrollWidth > e.clientWidth + 1)
    if (over.length) problems.push(`overflow x${over.length}`)
    const cr = c.getBoundingClientRect(), pr = document.querySelector('.gf-scene').getBoundingClientRect()
    if (cr.left < pr.left - 0.5 || cr.right > pr.right + 0.5 || cr.top < pr.top - 0.5 || cr.bottom > pr.bottom + 0.5) problems.push('content outside frame')
    return { drawn: paths.length, problems }
  })
  if (before !== await p.$eval('.gf-content', c => c.style.transform)) res.problems.push('fit moved after ready')
  fits.set(`${theme} ${id}`, before)
  if (res.problems.length) fails++
  console.log(res.problems.length ? 'FAIL' : 'ok  ', theme.padEnd(5), id.padEnd(15), `edges ${res.drawn}`, res.problems.join('; '))
}
// Frames that share minW/minH floors must share the fit, to the pixel — that is what keeps a pane at
// the same place across the cuts of a video.
// The groups live with the fixtures (SAME_FIT in dev/fixtures/index.ts); the gallery exposes them.
const sameFit = await (await p.goto('http://localhost:5178/'), p.$eval('[data-same-fit]', (e) => JSON.parse(e.dataset.sameFit)))
for (const group of sameFit) for (const theme of ['dark', 'light']) for (const id of group.slice(1)) {
  const fa = fits.get(`${theme} ${group[0]}`), fb = fits.get(`${theme} ${id}`)
  if (fa !== fb) { fails++; console.log(`FAIL ${theme} ${group[0]} vs ${id}: fit differs (${fa} / ${fb})`) }
}
for (const e of errs) console.log('FAIL page error', e)
console.log(fails || errs.length ? `FAILED: ${fails} fixture run(s), ${errs.length} page error(s)` : 'ALL OK')
await b.close(); await server.close()
process.exit(fails || errs.length ? 1 : 0)
