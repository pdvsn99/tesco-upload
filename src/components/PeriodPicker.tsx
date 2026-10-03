import type { Period, PeriodId } from '../lib/stats'
import { delay } from '../lib/ui'

export function PeriodPicker({ periods, onPick, onReset }: {
  periods: Period[]
  onPick: (id: PeriodId) => void
  onReset: () => void
}) {
  const [all, twelve, ...years] = periods
  return (
    <main className="screen screen-pick">
      <div className="upload-inner">
        <p className="eyebrow rise">Got it! {all.trips.toLocaleString('en-GB')} shops found</p>
        <h1 className="title rise" style={delay(80)}>
          Which story do you want to see?
        </h1>

        <div className="pick-main rise" style={delay(160)}>
          {[all, twelve].map((p) => (
            <button key={p.id} type="button" className="pick-big" disabled={!p.trips} onClick={() => onPick(p.id)}>
              <strong>{p.label}</strong>
              <span>{p.trips ? `${p.trips.toLocaleString('en-GB')} shops` : 'No shops'}</span>
            </button>
          ))}
        </div>

        {years.length > 0 && (
          <>
            <p className="pick-label rise" style={delay(240)}>Or pick a year</p>
            <div className="pick-years rise" style={delay(280)}>
              {years.map((p) => (
                <button key={p.id} type="button" className="pick-year" onClick={() => onPick(p.id)}>
                  <strong>{p.label}</strong>
                  <span>{p.trips}</span>
                </button>
              ))}
            </div>
          </>
        )}

        <button type="button" className="link-button" onClick={onReset}>Upload a different file</button>
      </div>
    </main>
  )
}
