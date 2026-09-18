import Link from 'next/link'

export default function NotFound() {
  return (
    <main
      id="main"
      tabIndex={-1}
      className="section container"
      style={{
        minHeight: '62vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
      }}
    >
      <p className="section-head__meta">
        <span className="kicker">Error · 404</span>
      </p>
      <h1 style={{ fontSize: 'clamp(2.3rem, 5vw, 3.9rem)', maxWidth: 640 }}>
        This page moved or <em>never existed.</em>
      </h1>
      <p style={{ marginTop: 18, maxWidth: 460, color: 'var(--muted)' }}>
        The route you followed does not lead anywhere. Head back to the homepage, or get in touch
        and we will point you the right way.
      </p>
      <div style={{ display: 'flex', gap: 14, marginTop: 36, flexWrap: 'wrap' }}>
        <Link href="/" className="btn btn-primary">
          <span>Back to homepage</span>
        </Link>
        <Link href="/contact" className="btn btn-ghost">
          <span>Contact SET</span>
        </Link>
      </div>
    </main>
  )
}