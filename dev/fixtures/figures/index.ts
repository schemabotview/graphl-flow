/// <reference types="vite/client" />
import type { Figure, SceneModel } from '../../../src'
import svgDark from './checkout-svg-dark.png'
import svgLight from './checkout-svg-light.png'
import pageDark from './checkout-page-dark.png'
import pageLight from './checkout-page-light.png'

// Screenshots of what a PROGRAM drew (0.11), made by scripts/gen-figure-fixtures.mjs: an SVG file
// the program wrote, and the page it served, each shot in both themes.

export const CHECKOUT_SVG = { dark: svgDark, light: svgLight }
export const CHECKOUT_PAGE = { dark: pageDark, light: pageLight }

/** The IDE frame's tall bottom slot (`run`: 715 × 479): the size the images were shot for. */
const SLOT = { w: 715, h: 479 }

const svg: Figure = { type: 'figure', id: 'out', alt: 'the checkout diagram miniflow drew', src: CHECKOUT_SVG, title: 'out/checkout.svg', ...SLOT }

export const FIGURE_FIXTURES: Record<string, SceneModel> = {
  // Both windows side by side, at the IDE slot's size: alone, one would be fitted to the whole frame
  // and drawn larger than its image (check fails that — it is blurry on video).
  'figure-chrome': {
    title: 'figure: a file the program wrote (a viewer tab), a page it served (a URL bar)',
    dir: 'row',
    nodes: [svg, { ...svg, id: 'page', alt: 'the checkout page', src: CHECKOUT_PAGE, chrome: 'browser', title: 'localhost:5173' }],
  },
}
