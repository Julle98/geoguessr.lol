import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#07021a',
          fontFamily: 'Arial Black, sans-serif',
        }}
      >
        {/* Grid lines */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(0,240,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,.06) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          display: 'flex',
        }} />
        {/* Sun glow */}
        <div style={{
          position: 'absolute', bottom: -120, left: '50%',
          width: 600, height: 300,
          background: 'radial-gradient(ellipse at center top, rgba(255,45,149,.55) 0%, rgba(177,77,255,.25) 40%, transparent 70%)',
          transform: 'translateX(-50%)',
          display: 'flex',
        }} />

        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            fontSize: 16, letterSpacing: '0.35em', color: '#00f0ff',
            textTransform: 'uppercase', marginBottom: 16,
            textShadow: '0 0 12px rgba(0,240,255,.8)',
            display: 'flex',
          }}>
            ● insert coin · v0.2 early access
          </div>
          <div style={{
            fontSize: 110, color: '#ff2d95', letterSpacing: '.02em', lineHeight: 0.85,
            textShadow: '0 0 40px rgba(255,45,149,.8), 0 0 80px rgba(255,45,149,.4)',
            display: 'flex',
          }}>
            geoguessr
            <span style={{ color: '#00f0ff', textShadow: '0 0 40px rgba(0,240,255,.8)' }}>.lol</span>
          </div>
          <div style={{
            fontSize: 32, color: '#ffd60a', marginTop: 24, letterSpacing: '.15em',
            textShadow: '0 0 16px rgba(255,214,10,.7)',
            display: 'flex',
          }}>
            ARVAA TAI ITKE
          </div>
          <div style={{
            fontSize: 18, color: '#a08fce', marginTop: 18, maxWidth: 600, textAlign: 'center',
            fontFamily: 'Arial, sans-serif', fontWeight: 400, lineHeight: 1.5,
            display: 'flex',
          }}>
            Ilmainen geo-arvauspeli party-moodilla. Ei tilausmaksuja. Ei paywallia.
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
