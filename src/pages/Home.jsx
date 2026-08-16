import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import RetroGrid from '../components/RetroGrid/RetroGrid';
import './Home.css';

export default function Home() {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = useCallback(
    e => {
      e.preventDefault();
      const trimmed = username.trim().toLowerCase();
      if (!trimmed) {
        setError('Please enter a Last.fm username');
        return;
      }
      setError('');
      navigate(`/app?user=${encodeURIComponent(trimmed)}`);
    },
    [username, navigate],
  );

  return (
    <div className="home">
      {/* RetroGrid background */}
      <RetroGrid />

      {/* Full-page dark gradient overlay */}
      <div className="home__overlay" />

      {/* Content card */}
      <main className="home__content">
        <div className="home__card">
          <div className="home__logo-row">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="#780000">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
              <circle cx="12" cy="12" r="3" fill="#0a0a0a" />
            </svg>
            <span className="home__logo-text">
              scrobble<span className="home__accent">dash</span>
            </span>
          </div>

          <h1 className="home__title">your last.fm stats, visualized</h1>
          <p className="home__subtitle">
            enter your last.fm username below to generate your listening dashboard
          </p>

          <form className="home__form" onSubmit={handleSubmit} noValidate>
            <div className="home__input-wrap">
              <label htmlFor="lastfm-username" className="home__label">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </label>
              <input
                id="lastfm-username"
                type="text"
                value={username}
                onChange={e => {
                  setUsername(e.target.value);
                  if (error) setError('');
                }}
                placeholder="your last.fm username"
                autoComplete="off"
                spellCheck={false}
                autoFocus
                className={`home__input ${error ? 'home__input--error' : ''}`}
              />
            </div>

            {error && <p className="home__error">{error}</p>}

            <button type="submit" className="home__submit">
              generate my dashboard
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </form>

          <p className="home__footer-link">
            <a href="/privacy.html">privacy policy</a>
          </p>
        </div>
      </main>
    </div>
  );
}
