import { useState, useCallback, useRef } from 'react'
import './CardGenerator.css'
import { renderCard } from '../../lib/cardRenderer'

const THEMES = [
  { id: 'crimson',   name: 'Crimson',   top: '#780000', bot: '#1a0000', accent: '#ff2d55' },
  { id: 'purple',    name: 'Purple',    top: '#4c1d95', bot: '#1e0a3c', accent: '#a78bfa' },
  { id: 'ocean',     name: 'Ocean',     top: '#0369a1', bot: '#0c1a3a', accent: '#38bdf8' },
  { id: 'emerald',   name: 'Emerald',   top: '#047857', bot: '#052e16', accent: '#34d399' },
  { id: 'amber',     name: 'Amber',     top: '#b45309', bot: '#451a03', accent: '#fbbf24' },
  { id: 'sunset',    name: 'Sunset',    top: '#ea580c', bot: '#431407', accent: '#fb923c' },
  { id: 'twilight',  name: 'Twilight',  top: '#be185d', bot: '#3b0726', accent: '#f472b6' },
]

const PERIODS = [
  { id: 'week',    label: 'This Week' },
  { id: 'month',   label: 'This Month' },
  { id: 'year',    label: 'This Year' },
  { id: 'alltime', label: 'All Time' },
]

export default function CardGenerator({ isOpen, onClose, user, topArtists, topTracks, topAlbums, weeklyGenre, dominantArtist, totalScrobbles, listeningByHour, listeningByWeekday }) {
  const [selectedTheme, setSelectedTheme] = useState('crimson')
  const [selectedPeriod, setSelectedPeriod] = useState('alltime')
  const [generating, setGenerating] = useState(false)
  const [generatedUrl, setGeneratedUrl] = useState(null)
  const canvasRef = useRef(null)

  const handleGenerate = useCallback(async () => {
    setGenerating(true)
    setGeneratedUrl(null)

    // Wait for fonts to be ready
    if (document.fonts?.ready) await document.fonts.ready

    const canvas = canvasRef.current || document.createElement('canvas')
    await renderCard(canvas, {
      theme: selectedTheme,
      periodLabel: PERIODS.find(p => p.id === selectedPeriod)?.label ?? 'All Time',
      user: user ? { name: user.name, image: user.image } : null,
      topArtists: topArtists || [],
      topTracks: topTracks || [],
      topAlbums: topAlbums || [],
      weeklyGenre: weeklyGenre || '',
      dominantArtist: dominantArtist || {},
      totalScrobbles: totalScrobbles || 0,
      listeningByHour: listeningByHour || [],
      listeningByWeekday: listeningByWeekday || [],
    })

    setGeneratedUrl(canvas.toDataURL('image/png'))
    setGenerating(false)
  }, [selectedTheme, selectedPeriod, user, topArtists, topTracks, topAlbums, weeklyGenre, dominantArtist, totalScrobbles, listeningByHour, listeningByWeekday])

  const handleDownload = useCallback(() => {
    if (!generatedUrl) return
    const a = document.createElement('a')
    a.href = generatedUrl
    a.download = `scrobble${selectedPeriod}_card.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }, [generatedUrl, selectedPeriod])

  // When modal opens, reset state
  const prevIsOpenRef = useRef(isOpen)
  if (prevIsOpenRef.current !== isOpen) {
    prevIsOpenRef.current = isOpen
    if (isOpen) setGeneratedUrl(null)
  }

  if (!isOpen) return null

  return (
    <div className="card-gen__overlay" onClick={onClose}>
      <div className="card-gen__panel" onClick={e => e.stopPropagation()}>
        {/* close */}
        <button className="card-gen__close" onClick={onClose} aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>

        <h2 className="card-gen__title">Generate Your ScrobbDash Card</h2>
        <p className="card-gen__subtitle">Choose your stats period and card theme</p>

        {/* period picker */}
        <fieldset className="card-gen__field">
          <legend className="card-gen__legend">Time Period</legend>
          <div className="card-gen__periods">
            {PERIODS.map(p => (
              <button
                key={p.id}
                type="button"
                className={`card-gen__period${selectedPeriod === p.id ? ' is-selected' : ''}`}
                onClick={() => setSelectedPeriod(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </fieldset>

        {/* theme picker */}
        <fieldset className="card-gen__field">
          <legend className="card-gen__legend">Card Theme</legend>
          <div className="card-gen__themes">
            {THEMES.map(t => (
              <button
                key={t.id}
                type="button"
                className={`card-gen__theme${selectedTheme === t.id ? ' is-selected' : ''}`}
                onClick={() => setSelectedTheme(t.id)}
              >
                <span className="card-gen__theme-swatch" style={{ background: `linear-gradient(135deg, ${t.top}, ${t.bot})` }} />
                <span className="card-gen__theme-name">{t.name}</span>
              </button>
            ))}
          </div>
        </fieldset>

        {/* generate button */}
        <button
          className="card-gen__generate"
          onClick={handleGenerate}
          disabled={generating}
        >
          {generating ? (
            <>
              <span className="card-gen__spinner" />
              Generating...
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="3" /><path d="M7 9h10M7 13h6" /></svg>
              Generate Card
            </>
          )}
        </button>

        {/* preview */}
        {generatedUrl && (
          <div className="card-gen__preview">
            <img src={generatedUrl} alt="Generated scrobbledash card" />
            <div className="card-gen__actions">
              <button className="card-gen__download" onClick={handleDownload}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                Download PNG
              </button>
              <button className="card-gen__regenerate" onClick={handleGenerate}>
                Regenerate
              </button>
            </div>
          </div>
        )}

        {/* hidden canvas for rendering */}
        <canvas ref={canvasRef} className="card-gen__canvas" style={{ display: 'none' }} />
      </div>
    </div>
  )
}
