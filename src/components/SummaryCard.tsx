import { useEffect, useRef, useState } from 'react'
import { toBlob } from 'html-to-image'
import { canShareFiles } from '../lib/device'
import { count, moneyRound } from '../lib/format'
import type { Stats } from '../lib/stats'
import { delay } from '../lib/ui'

// Turns the card into a PNG file. The "rise" animation is switched off on the
// copy, so the picture never catches the card halfway through fading in.
async function renderCard(card: HTMLElement, fileName: string): Promise<File> {
  await document.fonts.ready
  const blob = await toBlob(card, { pixelRatio: 3, style: { animation: 'none', opacity: '1', transform: 'none' } })
  if (!blob) throw new Error('No image')
  return new File([blob], fileName, { type: 'image/png' })
}

function download(file: File) {
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  document.body.append(a) // Firefox only downloads links that are on the page
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export function SummaryCard({ stats: s, shop, onRestart, onNewFile }: {
  stats: Stats
  shop: string
  onRestart: () => void
  onNewFile: () => void
}) {
  const card = useRef<HTMLDivElement>(null)
  const image = useRef<Promise<File> | null>(null)
  const [saving, setSaving] = useState(false)
  const [fallback, setFallback] = useState<string | null>(null) // picture to press and hold, if all else fails
  const [error, setError] = useState<string | null>(null)
  const [canShare] = useState(canShareFiles)
  const fileName = `aisle-be-back-${s.periodLabel.toLowerCase().replace(/\s+/g, '-')}.png`

  // Phones only open the share sheet straight after a tap. Making the picture
  // takes a moment, so it's made as soon as this screen appears, ready to go.
  // (It's made twice because Safari often leaves the fonts out the first time.)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!card.current) return
      const el = card.current
      image.current = renderCard(el, fileName).then(() => renderCard(el, fileName))
      image.current.catch(() => { image.current = null })
    }, 900)
    return () => clearTimeout(timer)
  }, [fileName])

  async function save() {
    if (!card.current) return
    setSaving(true)
    setError(null)
    let file: File | null = null
    try {
      file = await (image.current ?? (image.current = renderCard(card.current, fileName)))
      if (canShare && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'My Aisle Be Back' })
      } else {
        download(file)
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return // closed the share sheet
      if (file) {
        // The browser blocked sharing or downloading (common in apps like
        // Instagram or Gmail). Show the picture so it can be saved by hand.
        setFallback(URL.createObjectURL(file))
      } else {
        image.current = null
        setError("Sorry, we couldn't make the picture. Try again, or take a screenshot instead.")
      }
    } finally {
      setSaving(false)
    }
  }

  const rows: [string, string][] = [
    ['Shops', count(s.trips)],
    ['Spent', moneyRound(s.spend)],
    ['Saved', moneyRound(s.savings)],
    ['Items', count(s.itemCount)],
    ['Fave day', s.favouriteDay],
    ['Shopper', s.shopper.title],
    ['Vibe', `${s.vibe.title} ${s.vibe.emoji}`],
  ]

  return (
    <div className="summary">
      <div ref={card} className="summary-card rise">
        <div className="summary-head">
          <span className="summary-brand">Aisle Be Back</span>
          <span className="summary-period">{shop} · {s.periodLabel}</span>
        </div>
        <div className="summary-persona">
          <span className="persona-emoji small-emoji">{s.persona.emoji}</span>
          <strong>{s.persona.title}</strong>
        </div>
        {s.topProducts.length > 0 && (
          <div className="summary-top">
            <span className="summary-label">Top products</span>
            <ol>
              {s.topProducts.slice(0, 3).map((p) => <li key={p.name}>{p.name}</li>)}
            </ol>
          </div>
        )}
        <dl className="summary-grid">
          {rows.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="summary-actions rise" style={delay(400)} onClick={(e) => e.stopPropagation()}>
        <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : canShare ? 'Share image' : 'Download image'}
        </button>
        {error && <p className="error" role="alert">{error}</p>}
        {fallback && (
          <div className="share-fallback">
            <img src={fallback} alt="Your Aisle Be Back summary card" />
            <p className="small">Press and hold the picture (or right-click it) to save it.</p>
          </div>
        )}
        <button type="button" className="btn" onClick={onRestart}>Pick another timeframe</button>
        <button type="button" className="link-button" onClick={onNewFile}>Upload a different file</button>
      </div>
    </div>
  )
}
