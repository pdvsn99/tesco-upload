import { useEffect, useMemo, useState } from 'react'
import { PeriodPicker } from './components/PeriodPicker'
import { Story } from './components/Story'
import { Upload } from './components/Upload'
import { identify, type LoadedData } from './lib/readFile'
import { computeStats, filterShops, listPeriods, type PeriodId } from './lib/stats'
import { forgetUpload, loadUpload } from './lib/storage'
import { buildSlides } from './slides/buildSlides'

// Mix the supermarket's colours into the house style once we know who it is.
function applyShopColours(data: LoadedData | null) {
  const root = document.documentElement
  if (data) {
    root.dataset.shop = data.source.id
    root.style.setProperty('--brand', data.source.colors.brand)
    root.style.setProperty('--brand-2', data.source.colors.brand2)
  } else {
    delete root.dataset.shop
    root.style.removeProperty('--brand')
    root.style.removeProperty('--brand-2')
  }
}

export default function App() {
  const [data, setData] = useState<LoadedData | null>(null)
  const [remembered, setRemembered] = useState(false)
  const [checkingSaved, setCheckingSaved] = useState(true)
  const [periodId, setPeriodId] = useState<PeriodId | null>(null)

  // Returning visitor? Pick up the file saved in this browser last time.
  useEffect(() => {
    loadUpload()
      .then((file) => {
        if (!file) return
        try {
          setData(identify([file]))
          setRemembered(true)
        } catch {
          forgetUpload() // saved file is unreadable, so start fresh
        }
      })
      .finally(() => setCheckingSaved(false))
  }, [])

  useEffect(() => applyShopColours(data), [data])

  const periods = useMemo(() => (data ? listPeriods(data.shops) : []), [data])

  const slides = useMemo(() => {
    const period = periods.find((p) => p.id === periodId)
    if (!data || !period) return null
    const stats = computeStats(filterShops(data.shops, period.id), period, data.shops)
    if (!stats) return null
    return buildSlides(stats, data.source, {
      onRestart: () => setPeriodId(null),
      onNewFile: () => {
        setPeriodId(null)
        setData(null)
      },
    })
  }, [data, periods, periodId])

  async function forget() {
    await forgetUpload()
    setRemembered(false)
    setData(null)
  }

  if (checkingSaved) return <main className="screen" />
  if (!data) {
    return (
      <Upload
        onLoaded={(loaded, saved) => {
          setData(loaded)
          setRemembered(saved)
        }}
      />
    )
  }
  if (!slides) {
    return (
      <PeriodPicker
        periods={periods}
        shopName={data.source.name}
        remembered={remembered}
        onPick={setPeriodId}
        onReset={() => setData(null)}
        onForget={forget}
      />
    )
  }
  return <Story key={periodId} slides={slides} onClose={() => setPeriodId(null)} />
}
