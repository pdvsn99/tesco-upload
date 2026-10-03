const gbp = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' })
const gbpRound = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 })

export const money = (n: number) => gbp.format(n)
export const moneyRound = (n: number) => gbpRound.format(n)
export const count = (n: number) => Math.round(n).toLocaleString('en-GB')
export const percent = (n: number) => `${Math.round(n * 100)}%`

export const date = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
export const time = (d: Date) => d.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true })

export function hourRange(h: number): string {
  const fmt = (x: number) => `${x % 12 === 0 ? 12 : x % 12}${x % 24 < 12 ? 'am' : 'pm'}`
  return `${fmt(h)}–${fmt(h + 1)}`
}

export const plural = (n: number, word: string, many = `${word}s`) => `${count(n)} ${n === 1 ? word : many}`
