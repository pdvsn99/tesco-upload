import { useCallback, useEffect, useState } from 'react'
import type { Slide } from '../slides/buildSlides'

// Instagram-style stories: tap the right side to go forward, left side to go back.
// On bigger screens there are also arrows either side and a list of every screen.
export function Story({ slides, onClose }: { slides: Slide[]; onClose: () => void }) {
  const [index, setIndex] = useState(0)
  const last = slides.length - 1

  const next = useCallback(() => setIndex((i) => Math.min(last, i + 1)), [last])
  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') next()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'Home') setIndex(0)
      else if (e.key === 'End') setIndex(last)
      else if (e.key === 'Escape') onClose()
      else return
      e.preventDefault() // stop the space bar scrolling the page
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev, last, onClose])

  const slide = slides[index]

  return (
    <div className="story-stage">
      <nav className="story-nav" aria-label="Screens">
        <p className="story-nav-title">Your story</p>
        <ol>
          {slides.map((s, i) => (
            <li key={s.id}>
              <button
                type="button"
                className={i === index ? 'is-current' : i < index ? 'is-seen' : ''}
                aria-current={i === index ? 'step' : undefined}
                onClick={() => setIndex(i)}
              >
                {s.title}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <div className="story-row">
        <button type="button" className="story-arrow" aria-label="Previous screen" onClick={prev} disabled={index === 0}>‹</button>

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

        <button type="button" className="story-arrow" aria-label="Next screen" onClick={next} disabled={index === last}>›</button>
      </div>

      <p className="story-keys" aria-hidden>
        {index + 1} of {slides.length} · Use <kbd>←</kbd> <kbd>→</kbd> to move · <kbd>Esc</kbd> to close
      </p>
    </div>
  )
}
