export interface Size { w: number; h: number }
export interface Fit { scale: number; x: number; y: number }

/** Margin on each side, as a fraction of the pane's own axis. */
export const FIT_PADDING = 0.04
export const MIN_SCALE = 0.05
/** A small scene stops growing here, so it still reads as a diagram, not a poster. */
export const MAX_SCALE = 4

/**
 * The fit is a PURE function of the pane and the content's natural size — no async, no history.
 * That is what makes recordings reproducible: two frames whose scenes have the same natural box get
 * the same scale and put every panel at the same pixels.
 */
export function fitTransform(pane: Size, content: Size): Fit {
  if (!content.w || !content.h) return { scale: 1, x: 0, y: 0 }
  const raw = Math.min((pane.w * (1 - 2 * FIT_PADDING)) / content.w, (pane.h * (1 - 2 * FIT_PADDING)) / content.h)
  const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, raw))
  return { scale, x: (pane.w - content.w * scale) / 2, y: (pane.h - content.h * scale) / 2 }
}
