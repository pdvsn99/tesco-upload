// Stats for the "where your money goes", "treats vs greens", "own label vs
// brands" and "big shop or top-up" slides. All worked out from product names,
// so they're a rough guide rather than exact.
import { isProduct, units } from './extras'
import { categorise } from './persona'
import type { Item, Shop } from './types'

const products = (shops: Shop[]) => shops.flatMap((s) => s.items).filter(isProduct)

/* ---------- Where your money goes ---------- */

const AISLES: Record<string, string> = {
  fresh: 'Fruit & veg',
  meat: 'Meat & fish',
  dairy: 'Milk, cheese & eggs',
  bakery: 'Bread & bakery',
  freezer: 'Frozen',
  sweet: 'Snacks & sweets',
  icecream: 'Ice cream',
  fizzy: 'Soft drinks',
  caffeine: 'Tea, coffee & energy',
  booze: 'Beer, wine & spirits',
  mealdeal: 'Lunch on the go',
  household: 'Household & toiletries',
}

export interface Aisles {
  top: { label: string; spend: number; share: number }[] // biggest first
  total: number
  unsorted: number // share of spend we couldn't put in an aisle
}

export function aisles(shops: Shop[]): Aisles | null {
  const spend = new Map<string, number>()
  let total = 0
  for (const i of products(shops)) {
    total += i.lineTotal
    const id = categorise(i)
    if (id && AISLES[id]) spend.set(id, (spend.get(id) ?? 0) + i.lineTotal)
  }
  const sorted = [...spend.values()].reduce((a, b) => a + b, 0)
  if (total < 20 || sorted / total < 0.3) return null // too little recognised to be worth showing
  const top = [...spend.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, amount]) => ({ label: AISLES[id], spend: amount, share: amount / total }))
  return { top, total, unsorted: 1 - sorted / total }
}

/* ---------- Treats vs greens ---------- */

export interface TreatsVsGreens {
  greens: number // spent on fruit & veg
  treats: number // spent on sweets, snacks and ice cream
  topGreen: string | null
  topTreat: string | null
}

function favourite(items: Item[]): string | null {
  const tally = new Map<string, { name: string; count: number }>()
  for (const i of items) {
    const t = tally.get(i.key) ?? { name: i.name, count: 0 }
    t.count += units(i)
    tally.set(i.key, t)
  }
  return [...tally.values()].sort((a, b) => b.count - a.count)[0]?.name ?? null
}

export function treatsVsGreens(shops: Shop[]): TreatsVsGreens | null {
  const greens: Item[] = []
  const treats: Item[] = []
  for (const i of products(shops)) {
    const id = categorise(i)
    if (id === 'fresh') greens.push(i)
    else if (id === 'sweet' || id === 'icecream') treats.push(i)
  }
  const sum = (xs: Item[]) => xs.reduce((a, i) => a + i.lineTotal, 0)
  const result = { greens: sum(greens), treats: sum(treats), topGreen: favourite(greens), topTreat: favourite(treats) }
  return result.greens + result.treats >= 10 ? result : null
}

/* ---------- Own label vs brands ---------- */

// Brands whose name is more than one word, so "Coca Cola" isn't counted as "Coca".
const MULTI_WORD: [string, string][] = [
  ['ben & jerry', "Ben & Jerry's"], ['ben and jerry', "Ben & Jerry's"], ['cathedral city', 'Cathedral City'],
  ['yorkshire tea', 'Yorkshire Tea'], ['pg tips', 'PG Tips'], ['birds eye', 'Birds Eye'], ['mr kipling', 'Mr Kipling'],
  ['dr pepper', 'Dr Pepper'], ['dr oetker', 'Dr Oetker'], ['old el paso', 'Old El Paso'], ["ben's original", "Ben's Original"],
  ['lea & perrins', 'Lea & Perrins'], ['green giant', 'Green Giant'], ['pot noodle', 'Pot Noodle'], ['red bull', 'Red Bull'],
  ['irn bru', 'Irn Bru'], ['san pellegrino', 'San Pellegrino'], ['fever tree', 'Fever-Tree'], ['cow & gate', 'Cow & Gate'],
  ['head & shoulders', 'Head & Shoulders'], ['coca cola', 'Coca-Cola'], ['coca-cola', 'Coca-Cola'], ['kinder bueno', 'Kinder'],
  ['pip & nut', 'Pip & Nut'], ['the collective', 'The Collective'], ['country life', 'Country Life'], ['loyd grossman', 'Loyd Grossman'],
]
// First words that describe the product rather than naming a brand.
const NOT_A_BRAND = new Set([
  'loose', 'fresh', 'british', 'organic', 'large', 'medium', 'small', 'mini', 'whole', 'free', 'mixed', 'red', 'green',
  'white', 'brown', 'baby', 'sweet', 'ripe', 'bananas', 'banana', 'apples', 'carrots', 'onions', 'potatoes', 'milk',
  'semi', 'skimmed', 'unsmoked', 'smoked', 'english', 'scottish', 'welsh', 'irish', 'fairtrade', 'reduced', 'single',
])

const titleCase = (s: string) => s.replace(/(^|[\s&-])([a-z])/g, (_, p, c) => p + c.toUpperCase())

/** Best guess at the brand from a product name, or null if it doesn't seem to have one. */
export function brandOf(name: string): string | null {
  const n = name.toLowerCase()
  const multi = MULTI_WORD.find(([start]) => n.startsWith(start))
  if (multi) return multi[1]
  const first = n.split(/\s+/)[0].replace(/'s$/, '')
  if (!/^[a-z]/.test(first) || NOT_A_BRAND.has(first)) return null
  return titleCase(first)
}

export interface Brands {
  ownShare: number // share of spend on the supermarket's own label
  ownItems: number
  brandItems: number
  topBrand: { name: string; count: number } | null // most-bought big brand
}

export function brands(shops: Shop[], ownLabel: RegExp | undefined): Brands | null {
  if (!ownLabel) return null
  let own = 0
  let branded = 0
  let ownItems = 0
  let brandItems = 0
  const tally = new Map<string, number>()
  for (const i of products(shops)) {
    if (ownLabel.test(i.name)) {
      own += i.lineTotal
      ownItems += units(i)
      continue
    }
    const brand = brandOf(i.name)
    if (!brand) continue // loose fruit and veg, etc.
    branded += i.lineTotal
    brandItems += units(i)
    tally.set(brand, (tally.get(brand) ?? 0) + units(i))
  }
  if (ownItems + brandItems < 20 || own + branded <= 0) return null
  const [name, count] = [...tally.entries()].sort((a, b) => b[1] - a[1])[0] ?? []
  return { ownShare: own / (own + branded), ownItems, brandItems, topBrand: name && count >= 3 ? { name, count } : null }
}

/* ---------- Big shop or top-up? ---------- */

export interface Baskets {
  topUp: number // shops of 5 items or fewer
  middle: number // 6 to 19 items
  big: number // 20 or more
  total: number
  avgItems: number
  byYear: { year: number; avgItems: number }[]
}

export function baskets(shops: Shop[]): Baskets | null {
  const b: Baskets = { topUp: 0, middle: 0, big: 0, total: 0, avgItems: 0, byYear: [] }
  const years = new Map<number, { items: number; shops: number }>()
  let items = 0
  for (const s of shops) {
    const n = s.items.filter((i) => i.quantity > 0 && !i.isFuel).reduce((a, i) => a + units(i), 0)
    if (!n) continue // fuel-only stops don't count
    if (n <= 5) b.topUp++
    else if (n < 20) b.middle++
    else b.big++
    b.total++
    items += n
    const y = years.get(s.date.getFullYear()) ?? { items: 0, shops: 0 }
    y.items += n
    y.shops++
    years.set(s.date.getFullYear(), y)
  }
  if (b.total < 5) return null
  b.avgItems = items / b.total
  b.byYear = [...years.entries()]
    .filter(([, y]) => y.shops >= 5)
    .sort((x, y) => x[0] - y[0])
    .map(([year, y]) => ({ year, avgItems: y.items / y.shops }))
  return b
}
