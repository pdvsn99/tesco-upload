import type { ReactNode } from 'react'
import { Bars } from '../components/Bars'
import { CountUp } from '../components/CountUp'
import { SummaryCard } from '../components/SummaryCard'
import { count, date, hourRange, money, moneyRound, percent, plural, time } from '../lib/format'
import { DAYS, type Stats } from '../lib/stats'
import { delay, fit } from '../lib/ui'

export type Theme = 'blue' | 'red' | 'navy' | 'white' | 'yellow' | 'sky'

export interface Slide {
  id: string
  theme: Theme
  content: ReactNode
}

// The first UK lockdown ran from 23 March to early July 2020.
const duringLockdown = (from: Date, to: Date) => from < new Date(2020, 6, 4) && to > new Date(2020, 2, 23)

export function buildSlides(s: Stats, actions: { onRestart: () => void; onNewFile: () => void }): Slide[] {
  const slides: Slide[] = []
  const add = (id: string, theme: Theme, content: ReactNode) => slides.push({ id, theme, content })

  add('intro', 'blue', (
    <>
      <p className="eyebrow rise">Tesco Wrapped</p>
      <h1 className="huge rise" style={fit(s.isAllTime ? 'All time' : s.periodLabel, 150)}>{s.isAllTime ? 'All time' : s.periodLabel}</h1>
      <p className="lede rise" style={delay(400)}>
        Every receipt, every meal deal, every “I only came in for milk”. Let's see what your baskets say about you.
      </p>
      <p className="hint rise" style={delay(900)}>Tap to continue →</p>
    </>
  ))

  add('trips', 'red', (
    <>
      <p className="lede rise">{s.isAllTime ? `Since ${date(s.first)}` : `${s.periodHeading[0].toUpperCase()}${s.periodHeading.slice(1)}`} you popped into Tesco</p>
      <h1 className="huge rise" style={fit(count(s.trips), 150)}>
        <CountUp value={s.trips} format={count} />
      </h1>
      <p className="big rise" style={delay(300)}>times</p>
      <p className="lede rise" style={delay(900)}>
        That's about once every <strong>{count(Math.max(1, s.daysPerTrip))} days</strong>.
        {s.onlineTrips > 0 && ` ${plural(s.onlineTrips, 'was an online order', 'were online orders')}.`}
      </p>
    </>
  ))

  const firstItems = s.firstShop.items.filter((i) => i.quantity > 0 && !i.isMystery).slice(0, 4)
  if (firstItems.length) {
    add('first', 'white', (
      <>
        <p className="lede rise">{s.isAllTime ? 'Your first ever Tesco receipt' : `Your first shop ${s.periodHeading}`} was on</p>
        <h2 className="title xl rise" style={delay(150)}>{date(s.firstShop.date)}</h2>
        <p className="lede rise" style={delay(500)}>at {time(s.firstShop.date)}, and in the basket was:</p>
        <ul className="chips rise" style={delay(800)}>
          {firstItems.map((i, n) => <li key={`${i.key}-${n}`}>{i.name}</li>)}
        </ul>
        <p className="small rise" style={delay(1100)}>Where it all began.</p>
      </>
    ))
  }

  add('spend', 'navy', (
    <>
      <p className="lede rise">All in, you spent</p>
      <h1 className="huge rise" style={fit(moneyRound(s.spend), 150)}>
        <CountUp value={s.spend} format={moneyRound} />
      </h1>
      <p className="lede rise" style={delay(800)}>
        Your average basket came to <strong>{money(s.avgBasket)}</strong>, which makes you a…
      </p>
      <p className="badge rise" style={delay(1100)}>{s.shopper.title}</p>
      <p className="small rise" style={delay(1250)}>{s.shopper.blurb}</p>
    </>
  ))

  if (s.isAllTime && s.byYear.length > 1) {
    const top = s.byYear.reduce((a, y, i) => (y.spend > s.byYear[a].spend ? i : a), 0)
    add('years', 'sky', (
      <>
        <p className="lede rise">Year by year</p>
        <h2 className="title rise" style={delay(150)}>
          {s.byYear[top].year} was your biggest year, with {moneyRound(s.byYear[top].spend)} across {plural(s.byYear[top].trips, 'shop')}.
        </h2>
        <Bars values={s.byYear.map((y) => y.spend)} labels={s.byYear.map((y) => `’${String(y.year).slice(2)}`)} highlight={top} />
      </>
    ))
  }

  const cmp = s.thenVsNow?.compare
  if (cmp) {
    const up = cmp.spendChange >= 0
    add('compare', 'red', (
      <>
        <p className="lede rise">Compared with {cmp.label}, you spent</p>
        <h1 className="huge rise" style={fit(percent(Math.abs(cmp.spendChange)), 150)}>
          {percent(Math.abs(cmp.spendChange))}
        </h1>
        <p className="big rise" style={delay(300)}>{up ? 'more' : 'less'}</p>
        <p className="lede rise" style={delay(500)}>
          That's {moneyRound(s.spend)}, compared with {moneyRound(cmp.prevSpend)}.
        </p>
        <p className="lede rise" style={delay(800)}>
          And you went to Tesco <strong>{plural(s.trips, 'time')}</strong>, against {count(cmp.prevTrips)} before.{' '}
          {cmp.tripsChange > 0.1 ? 'Somebody likes it here.' : cmp.tripsChange < -0.1 ? 'Playing hard to get?' : 'Steady as she goes.'}
        </p>
      </>
    ))
  }

  if (s.savings > 0) {
    add('savings', 'yellow', (
      <>
        <p className="lede rise">Clubcard prices and offers saved you</p>
        <h1 className="huge rise" style={fit(money(s.savings), 150)}>
          <CountUp value={s.savings} format={money} />
        </h1>
        <p className="lede rise" style={delay(900)}>
          That's <strong>{percent(s.savings / (s.spend + s.savings))}</strong> knocked off everything you bought. Nice work.
        </p>
      </>
    ))
  }

  if (s.priceCheck) {
    const pc = s.priceCheck
    add('prices', 'white', (
      <>
        <p className="lede rise">Price check! Your regulars have gone {pc.average >= 0 ? 'up' : 'down'} by an average of</p>
        <h1 className="huge rise" style={fit(percent(Math.abs(pc.average)), 150)}>{percent(Math.abs(pc.average))}</h1>
        <ul className="pricelist">
          {pc.items.map((p, i) => (
            <li key={p.name} className="rise" style={delay(500 + i * 180)}>
              <span className="price-name">{p.name}</span>
              <span className="price-then">{money(p.fromPrice)} <small>{p.fromYear}</small></span>
              <span className="price-arrow" aria-hidden>→</span>
              <span className="price-now">{money(p.toPrice)} <small>{p.toYear}</small></span>
            </li>
          ))}
        </ul>
        <p className="small rise" style={delay(1300)}>Same product, what you paid near your first and latest buys.</p>
      </>
    ))
  }

  const big = s.biggestShop
  const bigItems = [...big.items].filter((i) => i.quantity > 0 && !i.isMystery).sort((a, b) => b.lineTotal - a.lineTotal).slice(0, 3)
  add('biggest', 'red', (
    <>
      <p className="lede rise">Your biggest shop was on</p>
      <h2 className="title rise" style={delay(150)}>{date(big.date)}</h2>
      <h1 className="huge rise" style={fit(money(big.total), 300)}>
        <CountUp value={big.total} format={money} delay={500} />
      </h1>
      <p className="lede rise" style={delay(900)}>
        {plural(big.items.reduce((a, i) => a + Math.max(0, Math.round(i.quantity) || 1), 0), 'item')} in the basket
        {bigItems.length > 0 && ', including:'}
      </p>
      {bigItems.length > 0 && (
        <ul className="chips rise" style={delay(1100)}>
          {bigItems.map((i) => <li key={i.key}>{i.name}</li>)}
        </ul>
      )}
    </>
  ))

  if (s.priciestItem) {
    add('priciest', 'white', (
      <>
        <p className="lede rise">The single most expensive thing you bought?</p>
        <h2 className="title rise" style={delay(300)}>{s.priciestItem.item.name}</h2>
        <h1 className="huge rise" style={fit(money(s.priciestItem.item.unitPrice), 600)}>{money(s.priciestItem.item.unitPrice)}</h1>
        <p className="small rise" style={delay(900)}>Bought on {date(s.priciestItem.date)}. Treat yourself.</p>
      </>
    ))
  }

  add('items', 'blue', (
    <>
      <p className="lede rise">You carried home</p>
      <h1 className="huge rise" style={fit(count(s.itemCount), 150)}>
        <CountUp value={s.itemCount} format={count} />
      </h1>
      <p className="big rise" style={delay(300)}>items</p>
      <p className="lede rise" style={delay(900)}>
        from <strong>{count(s.uniqueProducts)}</strong> different products.
      </p>
    </>
  ))

  if (s.topProducts.length >= 3) {
    add('top', 'navy', (
      <>
        <p className="lede rise">Your top products</p>
        <ol className="toplist">
          {s.topProducts.map((p, i) => (
            <li key={p.name} className="rise" style={delay(250 + i * 180)}>
              <span className="rank">{i + 1}</span>
              <span className="top-name">{p.name}</span>
              <span className="top-count">×{p.count}</span>
            </li>
          ))}
        </ol>
      </>
    ))

    const sig = s.topProducts[0]
    add('signature', 'red', (
      <>
        <p className="lede rise">Your signature item is…</p>
        <h1 className="title xl rise" style={delay(600)}>{sig.name}</h1>
        <p className="lede rise" style={delay(1200)}>
          You bought it <strong>{plural(sig.count, 'time')}</strong>, spending {money(sig.spend)}. We think you might be a bit obsessed.
        </p>
        {s.topBySpend && s.topBySpend.name !== sig.name && (
          <p className="small rise" style={delay(1600)}>
            But your biggest money pit was <strong>{s.topBySpend.name}</strong>, at {money(s.topBySpend.spend)}.
          </p>
        )}
      </>
    ))
  }

  const tvn = s.thenVsNow
  if (tvn && (tvn.newFaves.length || tvn.gone.length)) {
    add('newgone', 'blue', (
      <>
        {tvn.newFaves.length > 0 && (
          <>
            <p className="lede rise">New in your basket ✨</p>
            <ul className="chips rise" style={delay(200)}>
              {tvn.newFaves.map((t) => <li key={t.name}>{t.name} ×{t.count}</li>)}
            </ul>
          </>
        )}
        {tvn.gone.length > 0 && (
          <>
            <p className="lede rise" style={delay(600)}>{tvn.goneLabel} 💔</p>
            <ul className="chips chips-faded rise" style={delay(800)}>
              {tvn.gone.map((t) => <li key={t.name}>{t.name}</li>)}
            </ul>
            <p className="small rise" style={delay(1100)}>Was it something they said?</p>
          </>
        )}
      </>
    ))
  }

  add('when', 'sky', (
    <>
      <p className="lede rise">Your favourite day to shop is</p>
      <h1 className="huge rise" style={fit(`${s.favouriteDay}s`, 150)}>
        {s.favouriteDay}s
      </h1>
      <p className="lede rise" style={delay(350)}>
        usually {s.timeOfDay}. Your peak hour is <strong>{hourRange(s.favouriteHour)}</strong>.
      </p>
      <Bars values={s.weekdayTrips} labels={DAYS.map((d) => d.slice(0, 1))} highlight={DAYS.indexOf(s.favouriteDay)} />
    </>
  ))

  const h = s.habits
  add('habits', 'red', (
    <>
      <p className="lede rise">Forgot something?</p>
      <h1 className="huge rise" style={fit(count(h.returnTrips), 150)}>
        <CountUp value={h.returnTrips} format={count} />
      </h1>
      <p className="lede rise" style={delay(300)}>
        times you went back to Tesco on a day you'd already been.
        {h.busiestDay && <> Your record is <strong>{plural(h.busiestDay.trips, 'trip')}</strong> on {date(h.busiestDay.date)}.</>}
      </p>
      {h.streak.days > 1 && (
        <div className="duo rise" style={delay(900)}>
          <div>
            <span className="small">Longest streak</span>
            <strong>{plural(h.streak.days, 'day')}</strong>
            <span className="small">in a row, ending {date(h.streak.to)}</span>
          </div>
          <div>
            <span className="small">Weekend shops</span>
            <strong>{percent(h.weekendShare)}</strong>
            <span className="small">{h.weekendShare >= 0.4 ? 'Weekends are for Tesco' : 'Mostly a weekday shopper'}</span>
          </div>
        </div>
      )}
    </>
  ))

  add('month', 'white', (
    <>
      <p className="lede rise">Your busiest month was</p>
      <h1 className="title xl rise" style={delay(150)}>{s.busiestMonth.label}</h1>
      <p className="lede rise" style={delay(400)}>
        {plural(s.busiestMonth.trips, 'shop')} and {money(s.busiestMonth.spend)} spent.
      </p>
      {s.longestGap && s.longestGap.days > 1 && (
        <p className="lede rise" style={delay(900)}>
          But between {date(s.longestGap.from)} and {date(s.longestGap.to)} you went <strong>{plural(s.longestGap.days, 'day')}</strong> without a single Tesco trip. {duringLockdown(s.longestGap.from, s.longestGap.to) ? 'Lockdown, eh? Fair enough.' : 'Were you okay?'}
        </p>
      )}
    </>
  ))

  add('clock', 'navy', (
    <>
      <p className="lede rise">{s.vibe.title === 'Night Owl' ? 'A certified night owl 🦉' : 'Early bird or night owl?'}</p>
      <h1 className="huge rise" style={fit(count(s.lateNight), 150)}>
        <CountUp value={s.lateNight} format={count} />
      </h1>
      <p className="lede rise" style={delay(300)}>{s.lateNight === 1 ? 'shop' : 'shops'} after 9pm</p>
      <div className="duo rise" style={delay(800)}>
        <div>
          <span className="small">Earliest visit</span>
          <strong>{time(s.earliest)}</strong>
          <span className="small">{date(s.earliest)}</span>
        </div>
        <div>
          <span className="small">Latest visit</span>
          <strong>{time(s.latest)}</strong>
          <span className="small">{date(s.latest)}</span>
        </div>
      </div>
    </>
  ))

  const topSeason = s.seasons.reduce((a, x) => (x.trips > a.trips ? x : a))
  add('seasons', 'sky', (
    <>
      <p className="lede rise">Your favourite season to shop is {topSeason.emoji}</p>
      <h1 className="huge rise" style={fit(topSeason.name, 150)}>{topSeason.name}</h1>
      <div className="season-grid">
        {s.seasons.map((x, i) => (
          <div key={x.name} className={`rise ${x === topSeason ? 'is-top' : ''}`} style={delay(500 + i * 150)}>
            <span className="small">{x.emoji} {x.name}</span>
            <strong>{plural(x.trips, 'shop')}</strong>
            {x.top && <span className="small">Top: {x.top}</span>}
          </div>
        ))}
      </div>
    </>
  ))

  if (s.christmas) {
    const x = s.christmas
    add('christmas', 'red', (
      <>
        <p className="lede rise">🎄 Christmas build-up (1st to 24th December)</p>
        <h1 className="huge rise" style={fit(moneyRound(x.spend), 150)}>
          <CountUp value={x.spend} format={moneyRound} />
        </h1>
        <p className="lede rise" style={delay(500)}>across {plural(x.trips, 'shop')}.</p>
        <p className="lede rise" style={delay(900)}>
          The big one was {money(x.biggest.total)} on {date(x.biggest.date)}. Ho ho ho.
        </p>
      </>
    ))
  }

  if (s.cardShare + s.cashShare > 0) {
    const cardWins = s.cardShare >= s.cashShare
    add('pay', 'blue', (
      <>
        <p className="lede rise">Cash or card?</p>
        <h1 className="huge rise" style={fit(percent(cardWins ? s.cardShare : s.cashShare), 150)}>{percent(cardWins ? s.cardShare : s.cashShare)}</h1>
        <p className="lede rise" style={delay(300)}>of your spending was by {cardWins ? 'card' : 'cash'}.</p>
        <div className="split rise" style={delay(600)}>
          <div className="split-card" style={{ flexGrow: Math.max(s.cardShare, 0.02) }}>Card</div>
          <div className="split-cash" style={{ flexGrow: Math.max(s.cashShare, 0.02) }}>Cash</div>
        </div>
        {s.topCardBrand && (
          <p className="small rise" style={delay(900)}>Most used: {s.topCardBrand}</p>
        )}
      </>
    ))
  }

  if (s.bags) {
    add('bags', 'white', (
      <>
        <p className="lede rise">Forgot your bags again?</p>
        <h1 className="huge rise" style={fit(count(s.bags.count), 150)}>
          <CountUp value={s.bags.count} format={count} />
        </h1>
        <p className="lede rise" style={delay(300)}>
          bags bought at the till, costing <strong>{money(s.bags.spend)}</strong>.
        </p>
        <p className="small rise" style={delay(800)}>There's probably a cupboard full of them somewhere.</p>
      </>
    ))
  }

  if (s.fuelLitres > 0) {
    add('fuel', 'red', (
      <>
        <p className="lede rise">And at the pump…</p>
        <h1 className="huge rise" style={fit(count(s.fuelLitres), 150)}>
          <CountUp value={s.fuelLitres} format={count} />
        </h1>
        <p className="big rise" style={delay(300)}>litres</p>
        <p className="lede rise" style={delay(800)}>of fuel across {plural(s.fuelVisits, 'fill-up')}. ⛽</p>
      </>
    ))
  }

  add('persona', 'yellow', (
    <>
      <p className="lede rise">Put it all together and you are…</p>
      <div className="persona-emoji rise" style={delay(700)}>{s.persona.emoji}</div>
      <h1 className="title xl rise" style={delay(900)}>{s.persona.title}</h1>
      <p className="lede rise" style={delay(1300)}>{s.persona.blurb}</p>
      <p className="badge rise" style={delay(1700)}>{s.vibe.emoji} {s.vibe.title}</p>
    </>
  ))

  add('summary', 'blue', (
    <SummaryCard stats={s} onRestart={actions.onRestart} onNewFile={actions.onNewFile} />
  ))

  return slides
}
