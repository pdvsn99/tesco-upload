export type Platform = 'ios' | 'android' | 'other'

// Rough check so we can show phone-specific tips. iPads report themselves as
// Macs, so a "Mac" with a touchscreen counts as iOS too.
export function detectPlatform(): Platform {
  const ua = navigator.userAgent
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios'
  if (/Android/.test(ua)) return 'android'
  return 'other'
}
