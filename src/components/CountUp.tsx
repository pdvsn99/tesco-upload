import { useEffect, useState } from 'react'

// Animates a number from 0 up to `value` when it first appears.
export function CountUp({ value, format, duration = 1400, delay = 300 }: {
  value: number
  format: (n: number) => string
  duration?: number
  delay?: number
}) {
  const [shown, setShown] = useState(0)

  useEffect(() => {
    let frame = 0
    let start = 0
    const tick = (t: number) => {
      if (!start) start = t
      const p = Math.min(1, (t - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setShown(value * eased)
      if (p < 1) frame = requestAnimationFrame(tick)
    }
    const timer = setTimeout(() => (frame = requestAnimationFrame(tick)), delay)
    return () => {
      clearTimeout(timer)
      cancelAnimationFrame(frame)
    }
  }, [value, duration, delay])

  return <span className="tabular">{format(shown)}</span>
}
