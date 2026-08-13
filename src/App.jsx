import { useState } from 'react'
import CircularGallery from './components/CircularGallery/CircularGallery'
import DriftWall from './components/DriftWall/DriftWall'
import SplitText from './components/SplitText/SplitText'
import { user, recentlyPlayed, topAlbums } from './data/mockData'
import './App.css'

function App() {
  const [hovering, setHovering] = useState(false)

  return (
    <div className="app">
      {/* Header */}
      <header className="app__header">
        <div className="app__logo">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="var(--accent)">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
            <circle cx="12" cy="12" r="3" fill="#0a0a0a"/>
          </svg>
          <span className="app__logo-text">scroble<span className="app__logo-accent">dash</span></span>
        </div>
      </header>

      {/* Main content */}
      <main className="app__main">
        {/* Welcome heading */}
        <section className="app__welcome">
          <h1 className="app__welcome-text">
            welcome,             <span className="app__accent">
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
            items={recentlyPlayed.map(t => ({ image: t.cover, text: `${t.artist} — ${t.track}` }))}
            bend={3}
            textColor="#ffffff"
            borderRadius={0.05}
            scrollSpeed={2}
            scrollEase={0.05}
          />
        </section>

        {/* DriftWall — top album covers */}
        <section className="app__driftwall">
          <h2 className="app__driftwall-title">Top Album Covers</h2>
          <div className="app__driftwall-container">
            <DriftWall
              items={topAlbums.map(a => ({ image: a.cover, title: `${a.artist} — ${a.album}` }))}
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
      </main>
    </div>
  )
}

export default App
