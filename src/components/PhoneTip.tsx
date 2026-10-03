import type { Platform } from '../lib/device'

// Where to find the download on a phone, shown under the upload button.
export function PhoneTip({ platform }: { platform: Platform }) {
  if (platform === 'ios') {
    return (
      <details className="phone-tip">
        <summary>📱 On an iPhone? Where to find your file</summary>
        <ol>
          <li>Open the download link from your supermarket's email in <strong>Safari</strong>. If it opens inside your email app, choose <strong>Open in Safari</strong> first.</li>
          <li>Tap <strong>Download</strong>. It saves to the Files app.</li>
          <li>Come back here and tap <strong>Choose your data file</strong>. Your download will be at the top of <strong>Recents</strong> (or under <strong>Browse → Downloads</strong>).</li>
        </ol>
      </details>
    )
  }
  if (platform === 'android') {
    return (
      <details className="phone-tip">
        <summary>📱 On Android? Where to find your file</summary>
        <ol>
          <li>Tap the download link in your supermarket's email and let it download.</li>
          <li>Come back here and tap <strong>Choose your data file</strong>, then pick it from <strong>Downloads</strong>.</li>
        </ol>
      </details>
    )
  }
  return null
}
