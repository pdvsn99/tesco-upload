import type { Item } from './types'

// Each item is put in the first category whose keywords match its name.
// Order matters: "ice cream" must win before "cream" counts as dairy.
const CATEGORIES: { id: string; words: string[] }[] = [
  { id: 'fuel', words: [] },
  { id: 'icecream', words: ['ice cream', 'ben & jerry', 'ben and jerry', 'magnum', 'cornetto', 'cones', 'gelato', 'sorbet', 'haagen', 'carte d or', 'ice lolly', 'lollies'] },
  { id: 'mealdeal', words: ['sandwich', 'sandwiches', 'meal deal', 'sushi', 'pasta pot', 'salad bowl', 'baguette filled', 'sub roll', 'protein pot'] },
  { id: 'booze', words: ['beer', 'lager', 'wine', 'gin', 'vodka', 'whisky', 'whiskey', 'cider', 'prosecco', 'peroni', 'ale', 'rum', 'stella', 'corona', 'budweiser', 'cava', 'champagne', 'merlot', 'sauvignon', 'malbec', 'rioja'] },
  { id: 'caffeine', words: ['coffee', 'nescafe', 'latte', 'cappuccino', 'espresso', 'americano', 'caffe', 'caffionata', 'monster', 'energy', 'red bull', 'relentless', 'lucozade', 'rockstar', 'tea bags', 'teabags', 'pg tips', 'tetley', 'yorkshire tea'] },
  { id: 'fizzy', words: ['cola', 'pepsi', 'coke', 'lemonade', 'fanta', 'sprite', 'irn bru', 'squash', 'sparkling', 'spkling', 'tango', '7up', 'dr pepper', 'oasis', 'juice'] },
  { id: 'sweet', words: ['choc', 'shortbread', 'gum', 'lolly', 'chewits', 'squashies', 'lindt', 'laces', 'pencils', 'chocolate', 'cadbury', 'sweets', 'haribo', 'biscuit', 'cookie', 'cake', 'rocky road', 'twix', 'bounty', 'maoam', 'rowntree', 'kitkat', 'galaxy', 'mars', 'snickers', 'maltesers', 'buttons', 'doughnut', 'donut', 'brownie', 'creams', 'muffin', 'gums', 'jelly', 'nibbles', 'popcorn', 'crisps', 'pringles', 'walkers', 'doritos', 'skittles', 'candy', 'fudge', 'toffee', 'oreo'] },
  { id: 'freezer', words: ['frozen', 'fish fingers', 'oven chips', 'pizza', 'nuggets', 'waffles', 'hash brown', 'hash browns', 'birds eye', 'mccain', 'dippers', 'potato smiles', 'chicken kiev', 'ready meal', 'lasagne'] },
  { id: 'dairy', words: ['milk', 'pints', 'cheese', 'cheddar', 'butter', 'yogurt', 'yoghurt', 'cream', 'eggs', 'lurpak', 'mozzarella'] },
  { id: 'bakery', words: ['bread', 'slcd', 'sliced', 'roll', 'buns', 'bagel', 'wrap', 'croissant', 'loaf', 'baguette', 'crumpet', 'warburtons', 'hovis', 'pitta', 'naan'] },
  { id: 'fresh', words: ['banana', 'apple', 'onion', 'carrot', 'potato', 'tomato', 'salad', 'lettuce', 'broccoli', 'pepper', 'avocado', 'grape', 'berries', 'strawberries', 'blueberries', 'spinach', 'cucumber', 'lemon', 'lime', 'orange', 'pear', 'garlic', 'courgette', 'loose', 'melon', 'kiwi', 'mango', 'leek'] },
  { id: 'meat', words: ['chicken', 'beef', 'pork', 'bacon', 'sausage', 'ham', 'mince', 'steak', 'turkey', 'lamb', 'salmon', 'tuna', 'fish', 'prawn', 'chorizo', 'burger'] },
  { id: 'household', words: ['toilet', 'tissue', 'washing', 'detergent', 'bleach', 'fairy', 'kitchen roll', 'bin bag', 'shampoo', 'deodorant', 'anti-perspirant', 'toothpaste', 'shower', 'soap', 'mitchum', 'lynx', 'dove', 'razor', 'cleaner', 'battery', 'batteries', 'foil', 'bags'] },
]

export interface Persona {
  id: string
  title: string
  emoji: string
  blurb: string
}

const PERSONAS: Record<string, Omit<Persona, 'id'>> = {
  fuel: { title: 'The Forecourt Regular', emoji: '⛽', blurb: 'Half your supermarket life happens at the pump. Points on petrol? Smart.' },
  icecream: { title: 'The Ice Cream Devotee', emoji: '🍦', blurb: 'The freezer aisle knows you by name. Rain or shine, there is always room for a tub.' },
  mealdeal: { title: 'The Meal Deal Legend', emoji: '🥪', blurb: 'Sandwich, snack, drink. The lunchtime combo is basically a lifestyle.' },
  caffeine: { title: 'The Caffeine Fiend', emoji: '☕', blurb: 'Coffee, energy drinks, tea bags by the hundred. Sleep is optional.' },
  freezer: { title: 'The Freezer Raider', emoji: '🧊', blurb: 'Pizzas, chips, nuggets. If it goes in the oven from frozen, it goes in your basket.' },
  booze: { title: 'The Party Planner', emoji: '🍻', blurb: 'Someone has to bring the drinks, and that someone is clearly you.' },
  fizzy: { title: 'The Fizz Fanatic', emoji: '🥤', blurb: 'Bubbles, bottles and 2 litre jugs. You keep the drinks cupboard well stocked.' },
  sweet: { title: 'The Sweet Tooth', emoji: '🍫', blurb: 'Biscuits, chocolate, treats. You know exactly where the snack aisle is with your eyes closed.' },
  dairy: { title: 'The Milk Run Master', emoji: '🥛', blurb: 'Pints, cheese and butter. You are the reason the fridge is never empty.' },
  bakery: { title: 'The Bread Winner', emoji: '🍞', blurb: 'Toast is a lifestyle. The bakery aisle is your happy place.' },
  fresh: { title: 'The Fresh Picker', emoji: '🥦', blurb: 'Fruit, veg, loose onions. Your basket would make a nutritionist proud.' },
  meat: { title: 'The Grill Master', emoji: '🍗', blurb: 'Protein first, questions later. The meat counter is your second home.' },
  household: { title: 'The Home Hero', emoji: '🧼', blurb: 'Loo roll, washing up liquid, deodorant. You keep the household running.' },
  allrounder: { title: 'The All-Rounder', emoji: '🛒', blurb: 'A bit of everything. No aisle left behind.' },
}

// Names that contain a keyword but belong elsewhere ("wine gums", "beer battered").
const NOT_BOOZE = /wine gum|vinegar|vngr|battered/

// Whole-word matching (with an optional plural "s") so "gin" doesn't match "original".
const escape = (w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const MATCHERS = CATEGORIES.filter((c) => c.words.length).map((c) => ({
  id: c.id,
  re: new RegExp(`(^|[^a-z])(${c.words.map(escape).join('|')})s?($|[^a-z])`),
}))

export function categorise(item: Item): string | null {
  if (item.isFuel) return 'fuel'
  const n = item.name.toLowerCase()
  for (const m of MATCHERS) {
    if (m.id === 'booze' && NOT_BOOZE.test(n)) continue
    if (m.re.test(n)) return m.id
  }
  return null
}

export function pickPersona(items: Item[]): Persona & { share: number } {
  const spend: Record<string, number> = {}
  let total = 0
  for (const i of items) {
    if (i.quantity <= 0 || i.isClothing) continue
    total += i.lineTotal
    const c = categorise(i)
    if (c) spend[c] = (spend[c] ?? 0) + i.lineTotal
  }
  const [best, amount] = Object.entries(spend).sort((a, b) => b[1] - a[1])[0] ?? ['allrounder', 0]
  const share = total ? amount / total : 0
  const id = share < 0.12 ? 'allrounder' : best
  return { id, ...PERSONAS[id], share }
}

export function shopperType(avgBasket: number): { title: string; blurb: string } {
  if (avgBasket < 10) return { title: 'Top-Up Ninja', blurb: 'In and out, a few bits at a time.' }
  if (avgBasket < 40) return { title: 'Midweek Regular', blurb: 'A proper basket, but no trolley needed.' }
  return { title: 'Big Shop Boss', blurb: 'Trolley out, list in hand, weekly shop sorted.' }
}

// A second badge, based on when you shop rather than what you buy.
export function timeBadge(h: { lateShare: number; earlyShare: number; lunchShare: number; weekendShare: number }): { title: string; emoji: string } {
  if (h.lateShare >= 0.2) return { title: 'Night Owl', emoji: '🦉' }
  if (h.earlyShare >= 0.25) return { title: 'Early Bird', emoji: '🐦' }
  if (h.lunchShare >= 0.35) return { title: 'Lunchtime Dasher', emoji: '🏃' }
  if (h.weekendShare >= 0.45) return { title: 'Weekend Warrior', emoji: '🎉' }
  return { title: 'Anytime Shopper', emoji: '🕒' }
}
