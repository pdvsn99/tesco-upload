import { delay } from '../lib/ui'

export function Bars({ values, labels, highlight }: { values: number[]; labels: string[]; highlight: number }) {
  const max = Math.max(...values, 1)
  return (
    <div className="bars rise" style={delay(500)}>
      {values.map((v, i) => (
        <div key={i} className={`bar ${i === highlight ? 'is-top' : ''}`}>
          <div className="bar-fill" style={{ height: `${Math.max(4, (v / max) * 100)}%`, animationDelay: `${600 + i * 70}ms` }} />
          <span className="bar-label">{labels[i]}</span>
        </div>
      ))}
    </div>
  )
}
