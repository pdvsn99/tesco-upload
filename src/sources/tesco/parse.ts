// Turns Tesco's data export into the shared Shop/Item shape (see lib/types.ts).
// The export is messy (mixed casing, missing names, refunds, old till-receipt
// abbreviations) so everything defensive lives here.

import type { Item, PaymentMethod, Shop } from '../../lib/types'
import { linkOldNames } from './linkNames'

const num = (v: unknown): number => {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? ''))
  return Number.isFinite(n) ? n : 0
}

// "2026-10-01 19:59:23.606" -> local Date (the export has no timezone)
export function parseTimestamp(raw: unknown): Date | null {
  if (typeof raw !== 'string' && typeof raw !== 'number') return null
  const s = String(raw)
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/)
  if (m) {
    const [, y, mo, d, h, mi, sec] = m
    return new Date(+y, +mo - 1, +d, +h, +mi, sec ? +sec : 0)
  }
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}

// Common till-receipt abbreviations seen on older Tesco receipts.
const ABBREVIATIONS: [RegExp, string][] = [
  [/\bslcd\b/gi, 'Sliced'],
  [/\bwht\b/gi, 'White'],
  [/\bbtl\b/gi, 'Bottle'],
  [/\bltr\b/gi, 'Litre'],
  [/\bspkling\b/gi, 'Sparkling'],
  [/\bvngr\b/gi, 'Vinegar'],
  [/\bb\/crnt\b/gi, 'Blackcurrant'],
  [/^t\.? (?=[a-z])/i, 'Tesco '],
  [/\s*\(c\)$/i, ''],
]

// Old receipts are SHOUTY ("MEDIUM SLCD WHT"), so soften them to Title Case
// and expand the abbreviations so they read like real products.
export function tidyName(raw: string): string {
  let s = raw.replace(/\s+/g, ' ').trim()
  const milk = s.match(/^[\d.]+\s*l(?:tr|itre)?,?\s*(\d+)\s*pints?$/i)
  if (milk) return `Milk (${milk[1]} pints)`
  const letters = s.replace(/[^a-zA-Z]/g, '')
  if (letters && letters === letters.toUpperCase()) {
    s = s.toLowerCase().replace(/(^|[\s(&/-])([a-z])/g, (_, p, c) => p + c.toUpperCase())
  }
  for (const [re, to] of ABBREVIATIONS) s = s.replace(re, to)
  return s.trim()
}

const FUEL = /^(unleaded|diesel|super unleaded|v-power|momentum 99|petrol)\b/i

function parseItem(raw: Record<string, unknown>): Item {
  const quantity = num(raw.quantity ?? raw.qty ?? 1)
  const unitPrice = num(raw.price ?? raw.unitPrice)
  const volume = num(raw.volume)
  const weight = num(raw.weight)
  const rawName = typeof raw.name === 'string' ? raw.name.trim() : ''
  // Fuel shows up as a nameless line with a fractional "volume" (litres), or
  // as "UNLEADED" / "DIESEL" where "price" is per litre and "volume" is litres.
  const namedFuel = FUEL.test(rawName) && volume > 0 && !Number.isInteger(volume)
  const isFuel = namedFuel || (!rawName && volume > 2 && !Number.isInteger(volume))
  const name = rawName ? tidyName(rawName) : isFuel ? 'Fuel' : 'Mystery item'
  // Loose fruit and veg: "price" is per kg and "weight" is how many kg you took.
  const weighed = weight > 0
  const amount = weighed ? weight * quantity : namedFuel ? volume : quantity
  const letters = rawName.replace(/[^a-zA-Z]/g, '')
  return {
    name,
    rawName,
    fromTill: !!letters && letters === letters.toUpperCase(),
    key: name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(),
    quantity,
    unitPrice,
    lineTotal: Math.round(unitPrice * amount * 100) / 100,
    isFuel,
    litres: isFuel ? volume : 0,
    isMystery: !rawName && !isFuel,
    weighed,
  }
}

function parsePayments(raw: unknown): Shop['payments'] {
  if (!Array.isArray(raw)) return []
  return raw.map((p: Record<string, unknown>) => {
    const type = String(p.type ?? '').toLowerCase()
    const category = String(p.category ?? '').toLowerCase()
    const method: PaymentMethod =
      type.includes('cash')
        ? 'cash'
        : type.includes('gift') || category.includes('gift')
          ? 'giftcard'
          : type.includes('card')
            ? 'card'
            : 'other'
    let brand = ''
    if (category.includes('visa')) brand = 'Visa'
    else if (category.includes('master')) brand = 'Mastercard'
    else if (category.includes('amex') || category.includes('american')) brand = 'Amex'
    else if (category.includes('debit')) brand = 'Debit card'
    else if (category.includes('credit')) brand = 'Credit card'
    return { method, brand, amount: num(p.amount) }
  })
}

function parseShop(raw: Record<string, unknown>, fallback: Shop['channel']): Shop | null {
  // Online orders ("GHS", grocery home shopping) also turn up in "purchases".
  const channel = /^ghs$|online|delivery|collect/i.test(String(raw.type ?? '')) ? 'online' : fallback
  const date = parseTimestamp(
    raw.timestamp ?? raw.orderDate ?? raw.date ?? raw.deliveryDate ?? raw.placedDate,
  )
  if (!date) return null
  const rawItems = (raw.items ?? raw.products ?? raw.orderItems) as unknown
  const items = Array.isArray(rawItems) ? rawItems.map(parseItem) : []
  const itemSum = items.reduce((a, i) => a + i.lineTotal, 0)
  const total = num(
    raw.basketValueNet ?? raw.basketValueGross ?? raw.totalPrice ?? raw.total ?? raw.orderTotal ?? itemSum,
  )
  return {
    date,
    channel,
    total,
    savings: num(raw.overallBasketSavings ?? raw.savings ?? raw.totalSavings),
    items,
    payments: parsePayments(raw.payment ?? raw.payments),
  }
}

export function parseExport(json: unknown): Shop[] {
  if (!json || typeof json !== 'object') throw new Error("That file doesn't look like a Tesco data export.")
  const data = json as Record<string, unknown>
  const purchases = Array.isArray(data.purchases) ? data.purchases : Array.isArray(json) ? (json as unknown[]) : []
  const orders = Array.isArray(data.orders) ? data.orders : []
  if (!purchases.length && !orders.length) {
    throw new Error("We couldn't find any shopping trips in that file. Make sure it's the transactions JSON from Tesco.")
  }
  const shops = [
    ...purchases.map((p) => parseShop(p as Record<string, unknown>, 'store')),
    ...orders.map((o) => parseShop(o as Record<string, unknown>, 'online')),
  ].filter((s): s is Shop => s !== null)
  if (!shops.length) throw new Error("We found the file, but couldn't read any dates in it.")
  shops.sort((a, b) => a.date.getTime() - b.date.getTime())
  linkOldNames(shops)
  return shops
}
