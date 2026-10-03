// Until around spring 2019, Tesco receipts used short, SHOUTY till names
// ("MEDIUM SLCD WHT", "3.408L, 6 PINTS"). After that they switched to full
// product names ("Warburtons Medium Sliced White Bread 800G"). Without help,
// the same product looks like two different ones either side of the switch.
//
// This links each old till name to the full name it most likely became:
//  - every number must match exactly (so 4 pints never becomes 6 pints)
//  - each word must match a full word, allowing abbreviations: "slcd" fits
//    "sliced" because it starts with the same letter and its letters appear
//    in order
//  - the price must be similar, and the full name must start appearing
//    around when the old name stopped
import type { Shop } from './parse'

const DAY = 86_400_000
// Filler and packaging words say nothing about what the product is.
const IGNORE = new Set(['t', 'tesco', 'the', 'and', 'of', 'c', 'x', 'l', 'g', 'ml', 'kg', 'cl', 'pk', 'litre', 'litres', 'ltr', 'bottle', 'btl', 'can', 'cans', 'pack'])

interface Words {
  words: string[]
  numbers: string[]
}

function split(name: string): Words {
  const parts = name
    .toLowerCase()
    .replace(/\b([a-z])\/([a-z]{3,})/g, '$1$2') // "b/berry" -> "bberry", which fits "blackberry"
    .replace(/(\d)([a-z])/g, '$1 $2') // "800g" -> "800 g"
    .replace(/([a-z])(\d)/g, '$1 $2') // "4x330" -> "4 x 330"
    .split(/[^a-z0-9.]+/)
    .map((p) => p.replace(/^\.+|\.+$/g, ''))
    .filter((p) => p && !IGNORE.has(p))
  return {
    words: parts.filter((p) => !/\d/.test(p) && p.length > 1),
    numbers: parts.filter((p) => /^\d+(\.\d+)?$/.test(p)).map((n) => String(parseFloat(n))),
  }
}

const isSubsequence = (short: string, long: string) => {
  let i = 0
  for (const ch of long) if (ch === short[i]) i++
  return i === short.length
}

// "slcd" ~ "sliced", "brt" ~ "british", "bberry" ~ "blackberry"
const wordFits = (short: string, long: string) =>
  short === long || (short[0] === long[0] && short.length <= long.length && isSubsequence(short, long))

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b)
  return s[Math.floor(s.length / 2)]
}

interface Product {
  name: string
  key: string
  parts: Words
  first: number
  last: number
  prices: number[]
  count: number
}

/** Rewrites matching items in place and returns the old -> new pairs it linked. */
export function linkOldNames(shops: Shop[]): [string, string][] {
  const oldNames = new Map<string, Product>()
  const newNames = new Map<string, Product>()
  for (const s of shops)
    for (const i of s.items) {
      if (i.quantity <= 0 || i.isFuel || i.isMystery || i.weighed) continue
      const target = i.fromTill ? oldNames : newNames
      const id = i.fromTill ? i.rawName : i.key
      const p = target.get(id) ?? { name: i.name, key: i.key, parts: split(i.rawName), first: s.date.getTime(), last: 0, prices: [], count: 0 }
      p.last = s.date.getTime()
      p.prices.push(i.unitPrice)
      p.count += 1
      target.set(id, p)
    }
  if (!oldNames.size || !newNames.size) return []

  const links = new Map<string, Product>() // old raw name -> new product
  for (const [raw, old] of oldNames) {
    if (!old.parts.words.length) continue
    // A short name seen only once ("WHITE CHOCOLATE") could be anything.
    if (old.parts.words.length <= 2 && old.count < 2) continue
    const oldPrice = median(old.prices)
    const fits: { p: Product; extra: number }[] = []
    for (const cand of newNames.values()) {
      if (cand.first < old.first || cand.first > old.last + 3 * 365 * DAY) continue
      const ratio = median(cand.prices) / oldPrice
      if (!(ratio >= 0.5 && ratio <= 2)) continue
      if (!old.parts.numbers.every((n) => cand.parts.numbers.includes(n))) continue
      const used = new Set<number>()
      for (const w of old.parts.words) {
        const at = cand.parts.words.findIndex((c, idx) => !used.has(idx) && wordFits(w, c))
        if (at >= 0) used.add(at)
      }
      // Short names must match every word; longer ones can miss one in four
      // (old receipts squeeze in words like "hint" or "brt" that later vanish).
      const needed = old.parts.words.length < 4 ? old.parts.words.length : Math.ceil(old.parts.words.length * 0.75)
      if (used.size < needed) continue
      const extra = cand.parts.words.length - used.size
      // A lone word with no size ("PEPPERMINT") is too vague to link to a long name.
      if (old.parts.words.length === 1 && !old.parts.numbers.length && extra > 2) continue
      fits.push({ p: cand, extra })
    }
    // Prefer the version you bought most, then the closest name. If two
    // products fit about equally well, don't guess.
    fits.sort((a, b) => b.p.count - a.p.count || a.extra - b.extra)
    const [best, runnerUp] = fits
    if (best && (!runnerUp || best.p.count >= runnerUp.p.count * 2)) links.set(raw, best.p)
  }

  for (const s of shops)
    for (const i of s.items) {
      const to = i.fromTill ? links.get(i.rawName) : undefined
      if (to) {
        i.name = to.name
        i.key = to.key
      }
    }
  return [...links].map(([raw, p]) => [raw, p.name])
}
