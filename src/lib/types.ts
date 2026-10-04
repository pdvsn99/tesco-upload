// The shared shape every supermarket's data is converted into.
// Each supermarket gets its own converter in src/sources/; everything else
// (stats, slides) only ever sees these types.

export type PaymentMethod = 'card' | 'cash' | 'giftcard' | 'other'

export interface Item {
  name: string
  rawName: string // exactly as it appears in the export
  fromTill: boolean // an old-style SHOUTY till-receipt name (Tesco used these until ~2019)
  key: string // normalised name used for grouping
  quantity: number
  unitPrice: number
  lineTotal: number
  isFuel: boolean
  litres: number
  isMystery: boolean // no product name in the export
  weighed: boolean // sold by weight, so the price depends on how much you took
  isClothing: boolean // clothes and accessories (Tesco's F&F range), kept out of the food stats
}

export interface Shop {
  date: Date
  channel: 'store' | 'online'
  total: number
  savings: number
  items: Item[]
  payments: { method: PaymentMethod; brand: string; amount: number }[]
  selfScan: boolean // scanned your own shopping (Tesco's Scan as you Shop)
}
