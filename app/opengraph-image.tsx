import { ImageResponse } from 'next/og'

export const alt = 'Sierra Electric Technologies — Engineering a cleaner, smarter future'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '90px',
          background: 'linear-gradient(150deg, #0c2417 0%, #17301f 55%, #2f9a5b 130%)',
          color: '#eaf4ed',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '44px',
          }}
        >
          <div style={{ width: '20px', height: '20px', borderRadius: '7px', background: '#79cf9c' }} />
          <div style={{ fontSize: 22, letterSpacing: '0.35em', color: '#79cf9c', fontWeight: 600 }}>
            SIERRA LEONE · FREETOWN
          </div>
        </div>
        <div style={{ fontSize: 78, letterSpacing: '-0.02em', fontWeight: 700, lineHeight: 1.04 }}>
          Sierra Electric
        </div>
        <div
          style={{
            fontSize: 78,
            letterSpacing: '-0.02em',
            fontWeight: 700,
            lineHeight: 1.04,
            color: '#79cf9c',
          }}
        >
          Technologies.
        </div>
        <div
          style={{
            marginTop: '40px',
            fontSize: 30,
            color: '#b9d8c6',
            maxWidth: 900,
            lineHeight: 1.45,
          }}
        >
          Engineering a cleaner, smarter future — electric mobility, clean energy and climate
          innovation built in Sierra Leone for Africa.
        </div>
      </div>
    ),
    { ...size },
  )
}