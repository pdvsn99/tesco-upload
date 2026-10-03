import { useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { count, moneyRound } from '../lib/format'
import type { Stats } from '../lib/stats'
import { delay } from '../lib/ui'

export function SummaryCard({ stats: s, onRestart, onNewFile }: {
  stats: Stats
  onRestart: () => void
  onNewFile: () => void
}) {
  const card = useRef<HTMLDivElement>(null)
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!card.current) return
    setSaving(true)
    try {
      const url = await toPng(card.current, { pixelRatio: 3, cacheBust: true })
      const fileName = `tesco-wrapped-${s.periodLabel.toLowerCase().replace(/\s+/g, '-')}.png`
      const blob = await (await fetch(url)).blob()
      const file = new File([blob], fileName, { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'My Tesco Wrapped' })
      } else {
        const a = document.createElement('a')
        a.href = url
        a.download = fileName
        a.click()
      }
    } catch {
      // The user closed the share sheet, or the browser blocked it. Nothing to do.
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
          <span className="summary-brand">Tesco Wrapped</span>
          <span className="summary-period">{s.periodLabel}</span>
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
          {saving ? 'Saving…' : 'Save & share image'}
        </button>
        <button type="button" className="btn" onClick={onRestart}>Pick another timeframe</button>
        <button type="button" className="link-button" onClick={onNewFile}>Upload a different file</button>
      </div>
    </div>
  )
}
