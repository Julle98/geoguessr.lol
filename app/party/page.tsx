'use client'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

const GAME_MODES = [
  { id: 'classic',  name: 'Klassikko',  sub: '5 kierrosta · 120s · maailma',  icon: '🌍', color: 'magenta', desc: 'Vanha kunnon. Arvaa ja itke.',                  rounds: 5,  timer: 120, available: true },
  { id: 'blitz',    name: 'BLITZ',      sub: '10 kierrosta · 15s/arvaus',     icon: '⚡', color: 'amber',   desc: 'Pelkkä vaisto ja paniikki.',                   rounds: 10, timer: 15,  available: true, hot: true },
  { id: 'off_road', name: 'Off-Road',   sub: 'ei kylttejä · ei autoja',       icon: '🌲', color: 'violet',  desc: 'Kasvit, maaperä, taivas.',                     rounds: 5,  timer: 120, available: false },
  { id: 'duel',     name: '1v1 Duel',   sub: 'tappio = potkut lobbystä',      icon: '⚔️', color: 'coral',   desc: 'Kaksi entää, yksi jää.',                       rounds: 5,  timer: 60,  available: false },
  { id: 'chaos',    name: 'Chaos Party',sub: 'powerupit + 8 pelaajaa',        icon: '🎉', color: 'magenta', desc: 'Sumua, kaaosta, väärennettyjä karttoja. New!', rounds: 7,  timer: 30,  available: false, hot: true },
]

const REGIONS = [
  { id: 'world',    label: 'Maailma' },
  { id: 'europe',   label: 'Eurooppa' },
  { id: 'asia',     label: 'Aasia' },
  { id: 'americas', label: 'Amerikat' },
  { id: 'africa',   label: 'Afrikka' },
]

const TINT: Record<string, string> = {
  magenta: 'var(--neon-magenta)', cyan: 'var(--neon-cyan)',
  amber: 'var(--neon-amber)', violet: 'var(--neon-violet)', coral: 'var(--neon-coral)',
}

function randCode() {
  const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 6; i++) s += a[Math.floor(Math.random() * a.length)]
  return s.slice(0, 3) + '-' + s.slice(3)
}

export default function PartyPage() {
  const { data: session } = useSession()
  const [mode, setMode] = useState('classic')
  const [region, setRegion] = useState('world')
  const [rounds, setRounds] = useState(5)
  const [timer, setTimer] = useState<number | null>(120)
  const [cap, setCap] = useState(6)
  const [privacy, setPrivacy] = useState<'private' | 'friends' | 'public'>('private')
  const [code] = useState(randCode)
  const [copied, setCopied] = useState(false)

  const selectedMode = GAME_MODES.find(m => m.id === mode)!


  function copyCode() {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <>
      <div className="app-bg" /><div className="app-sun" /><div className="app-grid" /><div className="app-overlay" />
      <div style={{ position: 'relative', zIndex: 10, minHeight: '100vh' }}>

        {/* Nav */}
        <nav style={{
          position: 'sticky', top: 0, zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 28px',
          background: 'linear-gradient(180deg, rgba(7,2,26,.92), rgba(7,2,26,.65))',
          backdropFilter: 'blur(14px)',
          borderBottom: '1px solid var(--line)',
        }}>
          <Link href="/" style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--text-bright)', textDecoration: 'none', textShadow: '0 0 12px rgba(255,45,149,.55)' }}>
            geoguessr<span style={{ color: 'var(--neon-cyan)' }}>.</span><span style={{ color: 'var(--neon-amber)' }}>lol</span>
          </Link>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link href="/leaderboard" style={navLink}>Top 100</Link>
            <Link href="/play" style={navLink}>Solo ▶</Link>
            {session
              ? <Link href="/profile" style={navLink}>Profiili</Link>
              : <Link href="/login" style={navLink}>Kirjaudu</Link>
            }
          </div>
        </nav>

        {/* Coming soon banner */}
        <div style={{
          background: 'rgba(255,214,10,.06)', borderBottom: '1px solid rgba(255,214,10,.25)',
          padding: '10px 28px', display: 'flex', alignItems: 'center', gap: 10,
          fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--neon-amber)',
        }}>
          <span style={{ fontSize: 16 }}>🚧</span>
          <span>Party-moodi on kehitteillä — voit esikatsella asetuksia, mutta peliä ei voi vielä luoda.</span>
          <Link href="/play" style={{ marginLeft: 'auto', fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--neon-cyan)', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Pelaa solo →
          </Link>
        </div>

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px 80px' }}>

          {/* Page header + code */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '.3em', color: 'var(--neon-cyan)', textTransform: 'uppercase', marginBottom: 6 }}>
                // uusi peli
              </div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 48, margin: 0, lineHeight: 1, color: 'var(--text-bright)' }}>
                Konffaa<br />party<span style={{ color: 'var(--neon-magenta)' }}>.</span>
              </h1>
            </div>

            {/* Join code box */}
            <div style={{ background: 'linear-gradient(180deg, rgba(29,18,72,.85), rgba(21,10,54,.85))', border: '1px solid var(--line)', borderRadius: 8, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, color: 'var(--text-mute)', letterSpacing: '.15em', textTransform: 'uppercase' }}>JOIN CODE</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 32, color: 'var(--neon-cyan)', textShadow: '0 0 10px rgba(0,240,255,.5)', fontWeight: 800 }}>{code}</div>
              </div>
              <button onClick={copyCode} style={{
                fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '.1em',
                padding: '10px 14px', borderRadius: 4, cursor: 'pointer',
                border: '1px solid var(--neon-cyan)', color: 'var(--neon-cyan)',
                background: copied ? 'rgba(0,240,255,.15)' : 'transparent',
                textTransform: 'uppercase', transition: 'all .15s',
              }}>
                {copied ? '✓ kopioitu' : '⧉ kopioi'}
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 18, alignItems: 'start' }}>

            {/* LEFT col */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Mode select */}
              <Panel title="// 1 · valitse moodi" color="magenta">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                  {GAME_MODES.map(m => {
                    const tint = TINT[m.color]
                    const sel = mode === m.id
                    return (
                      <button key={m.id} onClick={() => {
                        if (!m.available) return
                        setMode(m.id)
                        setRounds(m.rounds)
                        setTimer(m.timer)
                      }} style={{
                        position: 'relative', textAlign: 'left',
                        cursor: m.available ? 'pointer' : 'not-allowed',
                        background: 'linear-gradient(180deg, var(--bg-panel) 0%, var(--bg-base) 100%)',
                        border: `1px solid ${sel ? tint : 'var(--line)'}`,
                        borderRadius: 8, padding: 14, overflow: 'hidden',
                        boxShadow: sel ? `0 0 0 1px ${tint}, 0 0 22px -4px ${tint}` : 'none',
                        opacity: m.available ? 1 : 0.45,
                        transition: 'all .15s',
                      }}>
                        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 100% 0%, ${tint} 0%, transparent 55%)`, opacity: sel ? .22 : .1, pointerEvents: 'none' }} />
                        {m.hot && <span style={{ position: 'absolute', top: 10, right: 10, fontFamily: 'var(--font-display)', fontSize: 9, padding: '3px 6px', borderRadius: 3, color: 'var(--neon-coral)', background: 'rgba(255,107,53,.1)', border: '1px solid rgba(255,107,53,.3)', letterSpacing: '.1em' }}>🔥 HOT</span>}
                        <div style={{ fontSize: 26, filter: `drop-shadow(0 0 10px ${tint})`, marginBottom: 8 }}>{m.icon}</div>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--text-bright)', marginBottom: 2 }}>{m.name}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-mute)' }}>{m.sub}</div>
                      </button>
                    )
                  })}
                </div>
              </Panel>

              {/* Settings */}
              <Panel title="// 2 · säädöt" color="cyan">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>

                  <FieldBlock label="Alue">
                    <ChipGroup>
                      {REGIONS.map(r => (
                        <Chip key={r.id} active={region === r.id} onClick={() => setRegion(r.id)}>{r.label}</Chip>
                      ))}
                    </ChipGroup>
                  </FieldBlock>

                  <FieldBlock label={`Kierrokset · `} accent={String(rounds)}>
                    <input type="range" min={1} max={15} value={rounds} onChange={e => setRounds(+e.target.value)}
                      style={{ width: '100%', accentColor: 'var(--neon-cyan)', cursor: 'pointer' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>
                      <span>1</span><span>5</span><span>10</span><span>15</span>
                    </div>
                  </FieldBlock>

                  <FieldBlock label="Aikaraja / arvaus">
                    <ChipGroup>
                      {([null, 15, 30, 60, 120, 180] as (number | null)[]).map(t => (
                        <Chip key={String(t)} active={timer === t} color="magenta" onClick={() => setTimer(t)}>
                          {t === null ? '∞' : t + 's'}
                        </Chip>
                      ))}
                    </ChipGroup>
                  </FieldBlock>

                  <FieldBlock label="Max pelaajat">
                    <ChipGroup>
                      {[2, 4, 6, 8].map(c => (
                        <Chip key={c} active={cap === c} color="amber" onClick={() => setCap(c)}>{c}</Chip>
                      ))}
                    </ChipGroup>
                  </FieldBlock>

                  <FieldBlock label="Yksityisyys">
                    <ChipGroup>
                      {(['private', 'friends', 'public'] as const).map(p => (
                        <Chip key={p} active={privacy === p} onClick={() => setPrivacy(p)}>
                          {p === 'private' ? '🔒 Priva' : p === 'friends' ? '👥 Frendit' : '🌐 Avoin'}
                        </Chip>
                      ))}
                    </ChipGroup>
                  </FieldBlock>
                </div>
              </Panel>
            </div>

            {/* RIGHT col — preview + CTA */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, position: 'sticky', top: 90 }}>
              <Panel title="// preview" color="amber">
                <div style={{ paddingBottom: 14 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--text-mute)', letterSpacing: '.15em', textTransform: 'uppercase' }}>MOODI</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, color: 'var(--neon-magenta)', textShadow: 'var(--glow-mag)', marginTop: 4 }}>{selectedMode.name}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-base)', marginTop: 6 }}>{selectedMode.desc}</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, margin: '14px 0' }}>
                  <Stub label="alue" value={region.toUpperCase()} />
                  <Stub label="pelaajat" value={`≤ ${cap}`} />
                  <Stub label="kierrokset" value={String(rounds)} />
                  <Stub label="aikaraja" value={timer === null ? '∞' : timer + 's'} />
                  <Stub label="priva" value={privacy === 'private' ? '🔒 priva' : privacy === 'friends' ? '👥 frendit' : '🌐 avoin'} />
                </div>

                {/* Invite link */}
                <div style={{ marginBottom: 14, padding: 10, background: 'var(--bg-deep)', border: '1px dashed var(--line)', borderRadius: 4, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--neon-cyan)', wordBreak: 'break-all' }}>
                  geoguessr.lol/p/<b style={{ color: 'var(--neon-magenta)' }}>{code}</b>
                </div>

                <button disabled style={{
                  display: 'block', textAlign: 'center', width: '100%',
                  background: 'rgba(255,255,255,.04)', color: 'var(--text-dim)',
                  border: '1px solid var(--line)',
                  fontFamily: 'var(--font-display)', fontSize: 15, letterSpacing: '.08em',
                  padding: '16px', borderRadius: 6, cursor: 'not-allowed',
                  textTransform: 'uppercase', marginBottom: 8,
                }}>
                  🚧 Tulossa pian
                </button>

                <Link href="/" style={{
                  display: 'block', textAlign: 'center',
                  fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '.08em',
                  padding: '12px', borderRadius: 4, cursor: 'pointer',
                  border: '1px solid var(--line)', color: 'var(--text-mute)',
                  textDecoration: 'none', textTransform: 'uppercase',
                }}>
                  ← Peruuta
                </Link>
              </Panel>

              {/* Info note */}
              <div style={{ padding: '14px 16px', background: 'rgba(0,240,255,.04)', border: '1px solid rgba(0,240,255,.15)', borderRadius: 6, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-mute)', lineHeight: 1.6 }}>
                <span style={{ color: 'var(--neon-cyan)' }}>ⓘ</span> Party-moodi on tulossa. Tällä hetkellä voit pelata soolo-pelinä ja haastaa kaverisi koodilla.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

/* ── Small shared components ── */

function Panel({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  const tint = { magenta: 'var(--neon-magenta)', cyan: 'var(--neon-cyan)', amber: 'var(--neon-amber)', violet: 'var(--neon-violet)' }[color] ?? 'var(--neon-cyan)'
  return (
    <div style={{ background: 'linear-gradient(180deg, rgba(29,18,72,.85), rgba(21,10,54,.85))', border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line-soft)', fontFamily: 'var(--font-display)', fontSize: 12, letterSpacing: '.12em', textTransform: 'uppercase', color: tint, textShadow: `0 0 8px ${tint}66` }}>
        {title}
      </div>
      <div style={{ padding: 18 }}>{children}</div>
    </div>
  )
}

function FieldBlock({ label, accent, children }: { label: string; accent?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--text-mute)' }}>
        {label}{accent && <span style={{ color: 'var(--neon-cyan)' }}>{accent}</span>}
      </label>
      {children}
    </div>
  )
}

function ChipGroup({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{children}</div>
}

const CHIP_TINT: Record<string, { color: string; bg: string; glow: string }> = {
  magenta: { color: 'var(--neon-magenta)', bg: 'rgba(255,45,149,.14)',  glow: '0 0 10px rgba(255,45,149,.35)' },
  amber:   { color: 'var(--neon-amber)',   bg: 'rgba(255,214,10,.12)',  glow: '0 0 10px rgba(255,214,10,.35)' },
  cyan:    { color: 'var(--neon-cyan)',    bg: 'rgba(0,240,255,.10)',   glow: '0 0 10px rgba(0,240,255,.35)' },
}

function Chip({ children, active, color, onClick }: { children: React.ReactNode; active: boolean; color?: string; onClick: () => void }) {
  const t = CHIP_TINT[color ?? 'cyan']
  return (
    <button onClick={onClick} style={{
      fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: '.06em',
      padding: '8px 12px', borderRadius: 4, cursor: 'pointer',
      textTransform: 'uppercase', transition: 'all .12s',
      border: `1px solid ${active ? t.color : 'var(--line)'}`,
      background: active ? t.bg : 'rgba(255,255,255,.02)',
      color: active ? t.color : 'var(--text-mute)',
      boxShadow: active ? t.glow : 'none',
    }}>
      {children}
    </button>
  )
}

function Stub({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: '8px 10px', background: 'rgba(255,255,255,.025)', border: '1px solid var(--line)', borderRadius: 4 }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 9, color: 'var(--text-mute)', letterSpacing: '.15em', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-bright)', marginTop: 2 }}>{value}</div>
    </div>
  )
}

const navLink: React.CSSProperties = {
  fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: '.08em',
  padding: '8px 14px', borderRadius: 4, color: 'var(--text-mute)',
  textDecoration: 'none', textTransform: 'uppercase',
}
