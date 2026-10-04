import type { Item, Shop } from './types'
import { carrierBags, christmas, habits, priceCheck, seasons, thenVsNow } from './extras'
import { aisles, baskets, brands as ownLabelVsBrands, treatsVsGreens } from './insights'
import { pickPersona, shopperType, timeBadge } from './persona'

export type PeriodId = 'all' | '12m' | `y${number}`

export interface Period {
  id: PeriodId
  label: string // "All time", "Past 12 months", "2025"
  heading: string // used in sentences: "of all time", "in the past 12 months", "in 2025"
  trips: number
}

const DAY = 86_400_000

export function filterShops(shops: Shop[], id: PeriodId, now = new Date()): Shop[] {
  if (id === 'all') return shops
  if (id === '12m') {
    const from = new Date(now)
    from.setFullYear(from.getFullYear() - 1)
    return shops.filter((s) => s.date >= from && s.date <= now)
  }
  const year = Number(id.slice(1))
  return shops.filter((s) => s.date.getFullYear() === year)
}

export function listPeriods(shops: Shop[], now = new Date()): Period[] {
  const years = [...new Set(shops.map((s) => s.date.getFullYear()))].sort((a, b) => b - a)
  const make = (id: PeriodId, label: string, heading: string): Period => ({
    id,
    label,
    heading,
    trips: filterShops(shops, id, now).length,
  })
  return [
    make('all', 'All time', 'of all time'),
    make('12m', 'Past 12 months', 'in the past 12 months'),
    ...years.map((y) => make(`y${y}`, String(y), `in ${y}`)),
  ]
}

export interface Ranked {
  name: string
  count: number
  spend: number
}

export interface Stats {
  periodLabel: string
  periodHeading: string
  isAllTime: boolean
  first: Date
  last: Date
  trips: number
  storeTrips: number
  onlineTrips: number
  spend: number
  savings: number
  avgBasket: number
  daysPerTrip: number
  itemCount: number
  uniqueProducts: number
  biggestShop: Shop
  priciestItem: { item: Item; date: Date } | null
  topProducts: Ranked[]
  topBySpend: Ranked | null
  weekdayTrips: number[] // Monday first
  favouriteDay: string
  favouriteHour: number
  timeOfDay: string
  busiestMonth: { label: string; trips: number; spend: number }
  longestGap: { days: number; from: Date; to: Date } | null
  lateNight: number
  earliest: Date
  latest: Date
  cashShare: number
  cardShare: number
  topCardBrand: string | null
  fuelLitres: number
  fuelVisits: number
  refunds: number
  byYear: { year: number; spend: number; trips: number }[]
  persona: ReturnType<typeof pickPersona>
  shopper: ReturnType<typeof shopperType>
  vibe: ReturnType<typeof timeBadge>
  firstShop: Shop
  priceCheck: ReturnType<typeof priceCheck>
  habits: ReturnType<typeof habits>
  thenVsNow: ReturnType<typeof thenVsNow>
  seasons: ReturnType<typeof seasons>
  christmas: ReturnType<typeof christmas>
  bags: ReturnType<typeof carrierBags>
  aisles: ReturnType<typeof aisles>
  treatsVsGreens: ReturnType<typeof treatsVsGreens>
  brands: ReturnType<typeof ownLabelVsBrands>
  baskets: ReturnType<typeof baskets>
}

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const minutesOfDay = (d: Date) => d.getHours() * 60 + d.getMinutes()
// Shops between midnight and 5am count as "late" rather than "early".
const lateness = (d: Date) => (minutesOfDay(d) + 24 * 60 - 5 * 60) % (24 * 60)

function argMax(values: number[]): number {
  return values.reduce((best, v, i) => (v > values[best] ? i : best), 0)
}

export function computeStats(
  shops: Shop[],
  period: Period,
  all: Shop[],
  ownLabel?: RegExp, // the supermarket's own-label product names (see sources/types.ts)
  now = new Date(),
): Stats | null {
  if (!shops.length) return null
  const trips = shops.length
  const spend = shops.reduce((a, s) => a + s.total, 0)
  const savings = shops.reduce((a, s) => a + s.savings, 0)
  const items = shops.flatMap((s) => s.items)
  const bought = items.filter((i) => i.quantity > 0)
  const first = shops[0].date
  const last = shops[trips - 1].date

  // Products, ignoring fuel and nameless lines
  const products = new Map<string, Ranked>()
  for (const i of bought) {
    if (i.isFuel || i.isMystery) continue
    const p = products.get(i.key) ?? { name: i.name, count: 0, spend: 0 }
    p.count += i.quantity >= 1 ? Math.round(i.quantity) : 1
    p.spend += i.lineTotal
    products.set(i.key, p)
  }
  const ranked = [...products.values()]
  const topProducts = [...ranked].sort((a, b) => b.count - a.count || b.spend - a.spend).slice(0, 5)
  const topBySpend = [...ranked].sort((a, b) => b.spend - a.spend)[0] ?? null

  // Skip anything that was later returned, so a refunded hoover doesn't win.
  const refunded = new Set(items.filter((i) => i.quantity < 0).map((i) => i.key))
  let priciestItem: Stats['priciestItem'] = null
  for (const s of shops)
    for (const i of s.items)
      if (i.quantity > 0 && !i.isFuel && !i.isMystery && !refunded.has(i.key) && (!priciestItem || i.unitPrice > priciestItem.item.unitPrice))
        priciestItem = { item: i, date: s.date }

  const weekdayTrips = Array(7).fill(0)
  const hourTrips = Array(24).fill(0)
  const months = new Map<string, { label: string; trips: number; spend: number }>()
  for (const s of shops) {
    weekdayTrips[(s.date.getDay() + 6) % 7]++
    hourTrips[s.date.getHours()]++
    const key = `${s.date.getFullYear()}-${s.date.getMonth()}`
    const m = months.get(key) ?? {
      label: period.id.startsWith('y') ? MONTHS[s.date.getMonth()] : `${MONTHS[s.date.getMonth()]} ${s.date.getFullYear()}`,
      trips: 0,
      spend: 0,
    }
    m.trips++
    m.spend += s.total
    months.set(key, m)
  }
  const favouriteHour = argMax(hourTrips)
  const timeOfDay =
    favouriteHour < 5 ? 'in the middle of the night' : favouriteHour < 12 ? 'in the morning' : favouriteHour < 17 ? 'in the afternoon' : favouriteHour < 21 ? 'in the evening' : 'late at night'

  let longestGap: Stats['longestGap'] = null
  for (let i = 1; i < trips; i++) {
    const days = Math.floor((shops[i].date.getTime() - shops[i - 1].date.getTime()) / DAY)
    if (!longestGap || days > longestGap.days) longestGap = { days, from: shops[i - 1].date, to: shops[i].date }
  }

  const byLateness = [...shops].sort((a, b) => lateness(a.date) - lateness(b.date))

  const payments = shops.flatMap((s) => s.payments)
  const paid = payments.reduce((a, p) => a + Math.abs(p.amount), 0) || 1
  const cash = payments.filter((p) => p.method === 'cash').reduce((a, p) => a + Math.abs(p.amount), 0)
  const card = payments.filter((p) => p.method === 'card').reduce((a, p) => a + Math.abs(p.amount), 0)
  const brands = new Map<string, number>()
  for (const p of payments) if (p.brand) brands.set(p.brand, (brands.get(p.brand) ?? 0) + 1)
  const topCardBrand = [...brands.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  const fuel = bought.filter((i) => i.isFuel)
  const years = new Map<number, { year: number; spend: number; trips: number }>()
  for (const s of shops) {
    const y = years.get(s.date.getFullYear()) ?? { year: s.date.getFullYear(), spend: 0, trips: 0 }
    y.spend += s.total
    y.trips++
    years.set(y.year, y)
  }

  // How many days the period covers, for the "once every N days" line
  let spanDays = (last.getTime() - first.getTime()) / DAY
  if (period.id === '12m') spanDays = 365
  else if (period.id.startsWith('y')) {
    const year = Number(period.id.slice(1))
    spanDays = year === now.getFullYear() ? (now.getTime() - new Date(year, 0, 1).getTime()) / DAY : 365
  }
  spanDays = Math.max(1, spanDays)
  const avgBasket = spend / trips
  const shopHabits = habits(shops)

  return {
    periodLabel: period.label,
    periodHeading: period.heading,
    isAllTime: period.id === 'all',
    first,
    last,
    trips,
    storeTrips: shops.filter((s) => s.channel === 'store').length,
    onlineTrips: shops.filter((s) => s.channel === 'online').length,
    spend,
    savings,
    avgBasket,
    daysPerTrip: spanDays / trips,
    itemCount: bought.reduce((a, i) => a + (i.quantity >= 1 ? Math.round(i.quantity) : 1), 0),
    uniqueProducts: products.size,
    biggestShop: shops.reduce((a, s) => (s.total > a.total ? s : a)),
    priciestItem,
    topProducts,
    topBySpend,
    weekdayTrips,
    favouriteDay: DAYS[argMax(weekdayTrips)],
    favouriteHour,
    timeOfDay,
    busiestMonth: [...months.values()].sort((a, b) => b.trips - a.trips || b.spend - a.spend)[0],
    longestGap,
    lateNight: shops.filter((s) => s.date.getHours() >= 21 || s.date.getHours() < 5).length,
    earliest: byLateness[0].date,
    latest: byLateness[trips - 1].date,
    cashShare: cash / paid,
    cardShare: card / paid,
    topCardBrand,
    fuelLitres: fuel.reduce((a, i) => a + i.litres, 0),
    fuelVisits: shops.filter((s) => s.items.some((i) => i.isFuel)).length,
    refunds: items.filter((i) => i.quantity < 0).length,
    byYear: [...years.values()].sort((a, b) => a.year - b.year),
    persona: pickPersona(bought),
    shopper: shopperType(avgBasket),
    vibe: timeBadge(shopHabits),
    firstShop: shops[0],
    priceCheck: priceCheck(all, shops),
    habits: shopHabits,
    thenVsNow: thenVsNow(all, shops, period.id, now),
    seasons: seasons(shops),
    christmas: christmas(shops),
    bags: carrierBags(shops),
    aisles: aisles(shops),
    treatsVsGreens: treatsVsGreens(shops),
    brands: ownLabelVsBrands(shops, ownLabel),
    baskets: baskets(shops),
  }
}
