import { useCallback, useEffect, useState } from 'react'
import type { Slide } from '../slides/buildSlides'

// Instagram-style stories: tap the right side to go forward, left side to go back.
export function Story({ slides, onClose }: { slides: Slide[]; onClose: () => void }) {
  const [index, setIndex] = useState(0)
  const last = slides.length - 1

  const next = useCallback(() => setIndex((i) => Math.min(last, i + 1)), [last])
  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') next()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev, onClose])

  const slide = slides[index]

  return (
    <div className={`story theme-${slide.theme}`}>
      <div className="progress" aria-hidden>
        {slides.map((s, i) => (
          <span key={s.id} className={i < index ? 'done' : i === index ? 'current' : ''} />
        ))}
      </div>
      <button type="button" className="close" aria-label="Close" onClick={onClose}>×</button>

      <section
        key={slide.id}
        className="slide"
        aria-live="polite"
        onClick={(e) => {
          if (index === last) return
          const { left, width } = e.currentTarget.getBoundingClientRect()
          if (e.clientX - left < width * 0.3) prev()
          else next()
        }}
      >
        <div className="shapes" aria-hidden>
          <span className="shape shape-a" />
          <span className="shape shape-b" />
        </div>
        <div className="slide-content">{slide.content}</div>
      </section>

      {index === last && index > 0 && (
        <button type="button" className="back-tap" aria-label="Previous" onClick={prev}>‹</button>
      )}
    </div>
  )
}
