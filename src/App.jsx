import { Routes, Route, useSearchParams, useNavigate } from 'react-router-dom'
import Home from './pages/Home'
import CircularGallery from './components/CircularGallery/CircularGallery'
import DriftWall from './components/DriftWall/DriftWall'
import SplitText from './components/SplitText/SplitText'
import ScrobblesSection from './components/ScrobblesSection/ScrobblesSection'
import RetroGrid from './components/RetroGrid/RetroGrid'
import EtherWavesBackground from './components/EtherWaves/EtherWaves'
import './components/EtherWaves/EtherWaves.css'
import GenreReveal from './components/GenreReveal/GenreReveal'
import './components/GenreReveal/GenreReveal.css'
import Scanner from './components/Scanner/Scanner'
import './components/Scanner/Scanner.css'
import './components/Scanner/ScannerSection.css'
import TimeClock from './components/TimeClock/TimeClock'
import './components/TimeClock/TimeClock.css'
import WeekdayChart from './components/WeekdayChart/WeekdayChart'
import './components/WeekdayChart/WeekdayChart.css'
import GradientWaves from './components/GradientWaves/GradientWaves'
import './components/GradientWaves/GradientWaves.css'
import FloatingLinesBackground from './components/FloatingLines/FloatingLinesBackground'
import PageFooter from './components/PageFooter/PageFooter'
import { recentlyPlayed as mockRecentlyPlayed, topAlbums as mockTopAlbums } from './data/mockData'
import useLastFmData from './lib/useLastFmData'
import './App.css'

function Dashboard() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const username = searchParams.get('user') || ''

  const { data, loading, error } = useLastFmData(username)

  // ── Derived values (fallback to mock for missing fields) ──
  const d = data || {}
  const user = d.user || { name: username }
  const recentlyPlayed = d.recentlyPlayed ?? mockRecentlyPlayed
  const topAlbums = d.topAlbums ?? mockTopAlbums
  const totalScrobbles = d.totalScrobbles
  const weeklyGenre = d.weeklyGenre || ''
  const listeningByHour = d.listeningByHour || []
  const listeningByWeekday = d.listeningByWeekday || []
  const topArtists = d.topArtists || []
  const dominantArtist = d.dominantArtist || {}
  const secondArtist = d.secondArtist || {}
  const mostPlayedTrack = d.mostPlayedTrack || {}

  // For FloatingLinesBackground, only pass valid data
  const floatingData = topArtists.length && dominantArtist.name ? {
    topArtists,
    dominantArtist,
    secondArtist,
    mostPlayedTrack,
    dominantRatio: (dominantArtist.plays / secondArtist.plays).toFixed(1),
  } : null

  if (loading) {
    return (
      <div className="app__loading">
        <p>fetching your stats...</p>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="app">
        <RetroGrid />
        <div className="app__page-dark" />
        <main className="app__main app__main--error">
          <p className="app__error-text">{error}</p>
          <button className="home__submit" onClick={() => navigate('/')}>
            go back
          </button>
        </main>
      </div>
    )
  }

  // ── No data and no loading → just show the home-style input screen ──
  if (!data) {
    return (
      <div className="app">
        <RetroGrid />
        <div className="app__page-dark" />
        <header className="app__header">
          <div className="app__logo">
            <button onClick={() => navigate('/')} style={backBtn} aria-label="Back to home">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="var(--accent)">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
              <circle cx="12" cy="12" r="3" fill="#0a0a0a"/>
            </svg>
            <span className="app__logo-text">scrobble<span className="app__logo-accent">dash</span></span>
          </div>
        </header>
      </div>
    )
  }

  return (
    <div className="app">
      {/* Retro grid background */}
      <RetroGrid />
      <div className="app__page-dark" />

      {/* Header */}
      <header className="app__header">
        <div className="app__logo">
          <button onClick={() => navigate('/')} style={backBtn} aria-label="Back to home">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="var(--accent)">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
            <circle cx="12" cy="12" r="3" fill="#0a0a0a"/>
          </svg>
          <span className="app__logo-text">scrobble<span className="app__logo-accent">dash</span></span>
        </div>
      </header>

      {/* Main content */}
      <main className="app__main">
        {/* Welcome heading */}
        <section className="app__welcome">
          <h1 className="app__welcome-text">
            welcome,
            <span className="app__accent">
              <SplitText
                text={user.name}
                delay={80}
                duration={1.25}
                ease="power3.out"
                splitType="chars"
                from={{ opacity: 0, y: 40 }}
                to={{ opacity: 1, y: 0 }}
                threshold={0.1}
                rootMargin="-100px"
              />
            </span>
          </h1>
          <p className="app__subtitle">Here's what you've been listening to</p>
        </section>

        {/* Circular gallery — latest tracks */}
        <section className="app__gallery-wrapper">
          <CircularGallery
            items={recentlyPlayed.map(t => ({ image: t.image || t.cover, text: t.text }))}
            bend={3}
            textColor="#ffffff"
            borderRadius={0.05}
            scrollSpeed={2}
            scrollEase={0.05}
          />
        </section>

        {/* DriftWall — top album covers */}
        <section className="app__driftwall">
          <h2 className="app__driftwall-title">Top Albums</h2>
          <div className="app__driftwall-container">
            <DriftWall
              items={topAlbums.map(a => ({ image: a.image || a.cover, title: a.title }))}
              columns={6}
              tileWidth={180}
              tileHeight={120}
              gap={14}
              tilt={16}
              turn={-14}
              perspective={1200}
              depth={120}
              speed={42}
              direction="up"
              variance={0.45}
              parallax={0.6}
              lift={48}
              fade={0.7}
              dim={0.5}
              overlayColor="#0a0a0a"
            />
          </div>
        </section>

        {/* MagicRings → scrobbles choreography */}
        <ScrobblesSection scrobbles={totalScrobbles || 0} />
      </main>

      <div className="ether-waves-wrapper">
        <EtherWavesBackground
          linesGradient={["#ff2d55", "#c1121f", "#780000"]}
          lineCount={6}
          transparentBg={true}
          interactive={false}
          parallax={false}
        />
        <div className="ether-waves__fade" />
        {weeklyGenre && <GenreReveal genre={weeklyGenre} />}
      </div>

      <section className="scanner-section">
        <div className="scanner-section__bg">
          <Scanner
            color1="#3d0000"
            color2="#c1121f"
            color3="#ffffff"
            speed={0.5}
            sweepSpeed={0.25}
            sweepWidth={1.6}
            sweepFalloff={6}
            scale={1.5}
            frequency={2}
            ripple={0.22}
            bandDensity={11}
            lineSharpness={5.5}
            glow={0.22}
            scanDirection="vertical"
            colorSpread={0.7}
            brightness={1.0}
            contrast={1.15}
            softness={1.4}
            vignette={0.45}
            scanline={true}
            grain={true}
            grainIntensity={0.05}
            opacity={1.0}
            mouseInteraction={true}
            mouseRadius={0.5}
            mouseStrength={0.5}
          />
        </div>
        <div className="scanner-section__fade" />
        <div className="scanner-section__content">
          <div className="listening-stats">
            <TimeClock hourly={listeningByHour.length ? listeningByHour : new Array(24).fill(0)} />
            <WeekdayChart weekdays={listeningByWeekday.length ? listeningByWeekday : new Array(7).fill(0)} />
          </div>
        </div>
      </section>

      {floatingData && (
        <FloatingLinesBackground {...floatingData} />
      )}

      <section className="gradient-waves-section">
        <div className="gradient-waves-section__bg">
          <GradientWaves
            horizonColor="#5c0101"
            waveColor="#000000"
            crestColor="#a73e3e"
            speed={0.4}
            amplitude={2.5}
            waveScale={0.6}
            waveRatio={0.9}
            swell={35}
            turbulence={20}
            tilt={1.11}
            zoom={1.0}
            height={5.5}
            fogDepth={15}
            detail="medium"
            brightness={1.0}
            opacity={1.0}
            mouseInteraction={false}
            parallaxStrength={0.5}
            grain={true}
            grainIntensity={0.05}
          />
        </div>
        <div className="gradient-waves-section__fade" />
        <div className="gradient-waves-section__content">
          <PageFooter onGenerateCard={() => {}} />
        </div>
      </section>
    </div>
  )
}

const backBtn = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
  marginRight: 8,
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home onUsername={(name) => window.location.href = `/app?user=${encodeURIComponent(name)}`} />} />
      <Route path="/app" element={<Dashboard />} />
    </Routes>
  )
}

export default App
