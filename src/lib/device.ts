export type Platform = 'ios' | 'android' | 'other'

// Rough check so we can show phone-specific tips. iPads report themselves as
// Macs, so a "Mac" with a touchscreen counts as iOS too.
export function detectPlatform(): Platform {
  const ua = navigator.userAgent
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios'
  if (/Android/.test(ua)) return 'android'
  return 'other'
}

// Can this browser hand a picture to the phone's share sheet? Desktop browsers
// that say yes (like Safari on a Mac) still get the simpler "Download" button.
export function canShareFiles(): boolean {
  if (detectPlatform() === 'other') return false
  try {
    return !!navigator.canShare?.({ files: [new File([''], 'test.png', { type: 'image/png' })] })
  } catch {
    return false
  }
}
