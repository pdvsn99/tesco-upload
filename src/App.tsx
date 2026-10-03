import { useEffect, useMemo, useState } from 'react'
import { PeriodPicker } from './components/PeriodPicker'
import { Story } from './components/Story'
import { Upload } from './components/Upload'
import { parseExport, type Shop } from './lib/parse'
import { computeStats, filterShops, listPeriods, type PeriodId } from './lib/stats'
import { forgetExport, loadExport } from './lib/storage'
import { buildSlides } from './slides/buildSlides'

export default function App() {
  const [shops, setShops] = useState<Shop[] | null>(null)
  const [remembered, setRemembered] = useState(false)
  const [checkingSaved, setCheckingSaved] = useState(true)
  const [periodId, setPeriodId] = useState<PeriodId | null>(null)

  // Returning visitor? Pick up the data saved in this browser last time.
  useEffect(() => {
    loadExport()
      .then((json) => {
        if (!json) return
        try {
          setShops(parseExport(JSON.parse(json)))
          setRemembered(true)
        } catch {
          forgetExport() // saved data is unreadable, so start fresh
        }
      })
      .finally(() => setCheckingSaved(false))
  }, [])

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

  async function forget() {
    await forgetExport()
    setRemembered(false)
    setShops(null)
  }

  if (checkingSaved) return <main className="screen" />
  if (!shops) {
    return (
      <Upload
        onLoaded={(loaded, saved) => {
          setShops(loaded)
          setRemembered(saved)
        }}
      />
    )
  }
  if (!slides) {
    return (
      <PeriodPicker
        periods={periods}
        remembered={remembered}
        onPick={setPeriodId}
        onReset={() => setShops(null)}
        onForget={forget}
      />
    )
  }
  return <Story key={periodId} slides={slides} onClose={() => setPeriodId(null)} />
}
