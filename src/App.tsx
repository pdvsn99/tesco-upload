import { useMemo, useState } from 'react'
import { PeriodPicker } from './components/PeriodPicker'
import { Story } from './components/Story'
import { Upload } from './components/Upload'
import type { Shop } from './lib/parse'
import { computeStats, filterShops, listPeriods, type PeriodId } from './lib/stats'
import { buildSlides } from './slides/buildSlides'

export default function App() {
  const [shops, setShops] = useState<Shop[] | null>(null)
  const [periodId, setPeriodId] = useState<PeriodId | null>(null)

  const periods = useMemo(() => (shops ? listPeriods(shops) : []), [shops])

  const slides = useMemo(() => {
    const period = periods.find((p) => p.id === periodId)
    if (!shops || !period) return null
    const stats = computeStats(filterShops(shops, period.id), period, shops)
    if (!stats) return null
    return buildSlides(stats, {
      onRestart: () => setPeriodId(null),
      onNewFile: () => {
        setPeriodId(null)
        setShops(null)
      },
    })
  }, [shops, periods, periodId])

  if (!shops) return <Upload onLoaded={setShops} />
  if (!slides) {
    return (
      <PeriodPicker
        periods={periods}
        onPick={setPeriodId}
        onReset={() => setShops(null)}
      />
    )
  }
  return <Story key={periodId} slides={slides} onClose={() => setPeriodId(null)} />
}
