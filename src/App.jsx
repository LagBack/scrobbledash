import { useState } from 'react'
import CircularGallery from './components/CircularGallery/CircularGallery'
import { user, recentlyPlayed } from './data/mockData'
import './App.css'

function App() {
  return (
    <div className="app">
      <header className="app__header">
        <div className="app__logo">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="var(--accent)">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
            <circle cx="12" cy="12" r="3" fill="#0a0a0a"/>
          </svg>
          <span className="app__logo-text">scrobble<span className="app__logo-accent">dash</span></span>
        </div>
      </header>

      <main className="app__main">
        <section className="app__welcome">
          <h1 className="app__welcome-text">
            welcome, <span className="app__accent">{user.name}</span>
          </h1>
          <p className="app__subtitle">Here's what you've been listening to</p>
        </section>

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
      </main>

      <footer className="app__footer">
        <div className="app__stat">
          <span className="app__stat-number">{recentlyPlayed.length}</span>
          <span className="app__stat-label">Recent Tracks</span>
        </div>
        <div className="app__divider" />
        <div className="app__stat">
          <span className="app__stat-number">{recentlyPlayed.reduce((a, b) => a + b.playCount, 0).toLocaleString()}</span>
          <span className="app__stat-label">Total Plays</span>
        </div>
      </footer>
    </div>
  )
}

export default App
