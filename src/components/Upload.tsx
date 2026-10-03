import { useRef, useState, type CSSProperties } from 'react'
import { delay } from '../lib/ui'
import { readUpload, type LoadedData } from '../lib/readFile'
import { forgetUpload, saveUpload } from '../lib/storage'
import { comingSoonSources, readySources } from '../sources'

export function Upload({ onLoaded }: { onLoaded: (data: LoadedData, remembered: boolean) => void }) {
  const input = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [remember, setRemember] = useState(true)

  async function read(file: File | undefined) {
    if (!file) return
    setError(null)
    setBusy(true)
    try {
      const data = await readUpload(file)
      await (remember ? saveUpload(data.file) : forgetUpload())
      onLoaded(data, remember)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong reading that file.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="screen screen-upload">
      <div className="upload-inner">
        <p className="eyebrow rise">Your supermarket year, unpacked</p>
        <h1 className="logo rise" style={delay(80)}>
          Aisle<br />
          <span>Be Back</span>
        </h1>
        <p className="lede rise" style={delay(160)}>
          Upload your supermarket shopping history and we'll turn it into a story about how you shop.
        </p>

        <div className="shops rise" style={delay(200)}>
          {readySources.map((s) => (
            <span key={s.id} className="shop-chip is-ready" style={{ '--chip': s.colors.brand } as CSSProperties}>✓ {s.name}</span>
          ))}
          {comingSoonSources.map((s) => (
            <span key={s.id} className="shop-chip">{s.name}</span>
          ))}
          <span className="shops-note">Greyed out = coming soon</span>
        </div>

        <button
          type="button"
          className={`dropzone rise ${dragging ? 'is-dragging' : ''}`}
          style={delay(240)}
          onClick={() => input.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            read(e.dataTransfer.files[0])
          }}
          disabled={busy}
        >
          <span className="dropzone-icon" aria-hidden>🛒</span>
          <strong>{busy ? 'Reading your receipts…' : 'Choose your data file'}</strong>
          <span>The .zip your supermarket sends you, or the file inside it</span>
        </button>
        <input
          ref={input}
          type="file"
          accept=".json,.zip,.csv,application/json,application/zip,text/csv"
          hidden
          onChange={(e) => {
            read(e.target.files?.[0])
            e.target.value = ''
          }}
        />

        <label className="remember rise" style={delay(280)}>
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          Remember my data on this device, so I don't have to upload it again
        </label>

        {error && <p className="error" role="alert">{error}</p>}

        {readySources.map((s) => s.howTo && (
          <details key={s.id} className="howto rise" style={delay(320)}>
            <summary>How do I get my {s.name} data?</summary>
            <p className="howto-note">It's free and takes a few minutes.</p>
            <ol>{s.howTo.steps.map((step, i) => <li key={i}>{step}</li>)}</ol>
            {s.howTo.notes?.map((note, i) => <p key={i} className="howto-note">{note}</p>)}
          </details>
        ))}

        <p className="privacy rise" style={delay(400)}>
          🔒 Your data never leaves your device. Everything is worked out in your browser.
        </p>
      </div>
      <footer className="disclaimer">A fan-made project. Not affiliated with or endorsed by any supermarket.</footer>
    </main>
  )
}
