import type { CSSProperties } from 'react'

// Stagger delay for the "rise" entrance animation.
export const delay = (ms: number) => ({ '--d': `${ms}ms` }) as CSSProperties

// Font size for the giant numbers: as big as possible while the longest word
// (e.g. "£441.85" or "Wednesdays") still fits on one line of the slide.
export const fit = (text: string, ms = 0) => {
  const longest = Math.max(...text.split(/\s+/).map((w) => w.length), 1)
  return { ...delay(ms), fontSize: `min(92px, ${(115 / longest).toFixed(1)}cqi)` } as CSSProperties
}
