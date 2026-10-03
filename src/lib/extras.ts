// Stats for the "price check", "then vs now", habits and fun-extra slides.
// Some of these need the whole history, not just the chosen period.
import type { Item, Shop } from './types'
import type { PeriodId } from './stats'

const DAY = 86_400_000
const BAG = /carrier bag|bag charge|bags? for life|^universal bag$/i
// Old till names like "2 Litre Bottle" or "Can 4x330ml" don't say what the product is.
const PACKAGING = /^(\d+([.,]\d+)?)?(x\d+)?(ml|l|g|kg|cl|pk)?$|^(litre|litres|ltr|bottle|btl|can|cans|pack|pk|pint|pints|x|&)$/
const isVague = (name: string) => name.toLowerCase().split(/[\s,()/]+/).filter((w) => w && !PACKAGING.test(w)).length === 0
const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b)
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2
}

// Real products only: no fuel, nameless lines, refunds or carrier bags.
const isProduct = (i: Item) => i.quantity > 0 && !i.isFuel && !i.isMystery && !BAG.test(i.name) && !isVague(i.name)
const units = (i: Item) => (i.quantity >= 1 ? Math.round(i.quantity) : 1)

export interface ProductTally {
  name: string
  count: number
  first: Date
  last: Date
}

export function tallyProducts(shops: Shop[]): Map<string, ProductTally> {
  const map = new Map<string, ProductTally>()
  for (const s of shops)
    for (const i of s.items) {
      if (!isProduct(i)) continue
      const t = map.get(i.key) ?? { name: i.name, count: 0, first: s.date, last: s.date }
      t.count += units(i)
      if (s.date < t.first) t.first = s.date
      if (s.date > t.last) t.last = s.date
      map.set(i.key, t)
    }
  return map
}

/* ---------- Price check ---------- */

export interface PriceChange {
  name: string
  fromPrice: number
  toPrice: number
  fromYear: number
  toYear: number
  change: number // 0.25 = +25%
}

// Compares what you paid for the same product near your first and last purchase of it.
// Only products bought in the chosen period, at least 3 times, over a year or more apart.
export function priceCheck(all: Shop[], period: Shop[]): { items: PriceChange[]; average: number } | null {
  const inPeriod = new Set(period.flatMap((s) => s.items.map((i) => i.key)))
  const history = new Map<string, { name: string; buys: { date: Date; price: number }[] }>()
  for (const s of all)
    for (const i of s.items) {
      if (!isProduct(i) || i.weighed || i.unitPrice <= 0 || !inPeriod.has(i.key)) continue
      const h = history.get(i.key) ?? { name: i.name, buys: [] }
      h.buys.push({ date: s.date, price: i.unitPrice })
      history.set(i.key, h)
    }

  const changes: (PriceChange & { buys: number })[] = []
  for (const { name, buys } of history.values()) {
    if (buys.length < 3) continue
    const first = buys[0].date
    const last = buys[buys.length - 1].date
    if (last.getTime() - first.getTime() < 365 * DAY) continue
    // Use the typical price within ~6 months of each end, so one-off offers don't skew it.
    const early = buys.filter((b) => b.date.getTime() - first.getTime() < 180 * DAY).map((b) => b.price)
    const late = buys.filter((b) => last.getTime() - b.date.getTime() < 180 * DAY).map((b) => b.price)
    const fromPrice = median(early)
    const toPrice = median(late)
    const change = toPrice / fromPrice - 1
    if (change < -0.8 || change > 3) continue // almost certainly a different pack size
    changes.push({ name, fromPrice, toPrice, fromYear: first.getFullYear(), toYear: last.getFullYear(), change, buys: buys.length })
  }
  if (!changes.length) return null
  // Of your 10 most-bought regulars, show the ones whose price moved the most.
  const items = [...changes]
    .sort((a, b) => b.buys - a.buys)
    .slice(0, 10)
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
    .slice(0, 4)
  const average = changes.reduce((a, c) => a + c.change, 0) / changes.length
  return { items, average }
}

/* ---------- Habits ---------- */

export interface Habits {
  returnTrips: number // extra trips on a day you'd already been
  busiestDay: { date: Date; trips: number } | null
  streak: { days: number; from: Date; to: Date }
  weekendShare: number
  earlyShare: number // before 9am
  lunchShare: number // 12pm to 2pm
  lateShare: number // 9pm or later, or before 5am
}

export function habits(shops: Shop[]): Habits {
  const byDay = new Map<string, { date: Date; trips: number }>()
  for (const s of shops) {
    const d = byDay.get(dayKey(s.date)) ?? { date: s.date, trips: 0 }
    d.trips++
    byDay.set(dayKey(s.date), d)
  }
  const days = [...byDay.values()].sort((a, b) => a.date.getTime() - b.date.getTime())
  const busiest = days.reduce((a, d) => (d.trips > a.trips ? d : a), days[0])

  let streak = { days: 1, from: days[0].date, to: days[0].date }
  let run = { days: 1, from: days[0].date }
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1].date.getFullYear(), days[i - 1].date.getMonth(), days[i - 1].date.getDate() + 1)
    run = dayKey(prev) === dayKey(days[i].date) ? { days: run.days + 1, from: run.from } : { days: 1, from: days[i].date }
    if (run.days > streak.days) streak = { days: run.days, from: run.from, to: days[i].date }
  }

  const share = (test: (d: Date) => boolean) => shops.filter((s) => test(s.date)).length / shops.length
  return {
    returnTrips: shops.length - days.length,
    busiestDay: busiest.trips > 1 ? busiest : null,
    streak,
    weekendShare: share((d) => d.getDay() === 0 || d.getDay() === 6),
    earlyShare: share((d) => d.getHours() >= 5 && d.getHours() < 9),
    lunchShare: share((d) => d.getHours() >= 12 && d.getHours() < 14),
    lateShare: share((d) => d.getHours() >= 21 || d.getHours() < 5),
  }
}

/* ---------- Then vs now ---------- */

export interface ThenVsNow {
  compare: { label: string; spendChange: number; tripsChange: number; prevSpend: number; prevTrips: number } | null
  newFaves: ProductTally[]
  gone: ProductTally[]
  goneLabel: string
}

export function thenVsNow(all: Shop[], period: Shop[], id: PeriodId, now: Date): ThenVsNow | null {
  const current = tallyProducts(period)

  if (id === 'all') {
    // "Old flames": things you used to buy often but not for 2+ years.
    const end = period[period.length - 1].date.getTime()
    const gone = [...current.values()]
      .filter((t) => t.count >= 4 && end - t.last.getTime() > 730 * DAY)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
    return gone.length ? { compare: null, newFaves: [], gone, goneLabel: "Old flames you haven't bought in over 2 years" } : null
  }

  let from: Date
  let prevFrom: Date
  let label: string
  if (id === '12m') {
    from = new Date(now)
    from.setFullYear(from.getFullYear() - 1)
    prevFrom = new Date(from)
    prevFrom.setFullYear(prevFrom.getFullYear() - 1)
    label = 'the 12 months before'
  } else {
    const year = Number(id.slice(1))
    from = new Date(year, 0, 1)
    prevFrom = new Date(year - 1, 0, 1)
    label = String(year - 1)
  }
  const before = all.filter((s) => s.date < from)
  const prev = before.filter((s) => s.date >= prevFrom)
  const everBefore = tallyProducts(before)
  const previous = tallyProducts(prev)

  const spend = period.reduce((a, s) => a + s.total, 0)
  const prevSpend = prev.reduce((a, s) => a + s.total, 0)
  const compare = prev.length
    ? { label, spendChange: spend / (prevSpend || 1) - 1, tripsChange: period.length / prev.length - 1, prevSpend, prevTrips: prev.length }
    : null

  const newFaves = [...current.entries()]
    .filter(([key, t]) => t.count >= 2 && !everBefore.has(key))
    .map(([, t]) => t)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
  const gone = [...previous.entries()]
    .filter(([key, t]) => t.count >= 3 && !current.has(key))
    .map(([, t]) => t)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)

  if (!compare && !newFaves.length && !gone.length) return null
  return { compare, newFaves, gone, goneLabel: `Regulars from ${label} you've stopped buying` }
}

/* ---------- Fun extras ---------- */


export interface Season {
  name: string
  emoji: string
  trips: number
  spend: number
  top: string | null
}

export function seasons(shops: Shop[]): Season[] {
  const defs = [
    { name: 'Spring', emoji: '🌷', months: [2, 3, 4] },
    { name: 'Summer', emoji: '☀️', months: [5, 6, 7] },
    { name: 'Autumn', emoji: '🍂', months: [8, 9, 10] },
    { name: 'Winter', emoji: '❄️', months: [11, 0, 1] },
  ]
  return defs.map(({ name, emoji, months }) => {
    const inSeason = shops.filter((s) => months.includes(s.date.getMonth()))
    const top = [...tallyProducts(inSeason).values()].sort((a, b) => b.count - a.count)[0]
    return {
      name,
      emoji,
      trips: inSeason.length,
      spend: inSeason.reduce((a, s) => a + s.total, 0),
      top: top && top.count > 1 ? top.name : null,
    }
  })
}

export function christmas(shops: Shop[]): { spend: number; trips: number; biggest: Shop } | null {
  const xmas = shops.filter((s) => s.date.getMonth() === 11 && s.date.getDate() <= 24)
  if (!xmas.length) return null
  return {
    spend: xmas.reduce((a, s) => a + s.total, 0),
    trips: xmas.length,
    biggest: xmas.reduce((a, s) => (s.total > a.total ? s : a)),
  }
}

export function carrierBags(shops: Shop[]): { count: number; spend: number } | null {
  const bags = shops.flatMap((s) => s.items).filter((i) => i.quantity > 0 && BAG.test(i.name))
  if (!bags.length) return null
  return { count: bags.reduce((a, i) => a + units(i), 0), spend: bags.reduce((a, i) => a + i.lineTotal, 0) }
}
