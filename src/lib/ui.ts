import type { CSSProperties } from 'react'

// Stagger delay for the "rise" entrance animation.
export const delay = (ms: number) => ({ '--d': `${ms}ms` }) as CSSProperties
