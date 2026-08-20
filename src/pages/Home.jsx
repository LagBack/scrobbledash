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

          {/* Social icons */}
          <div className="home__social-row">
            <a
              href="https://github.com/LagBack/scrobbledash"
              target="_blank"
              rel="noopener noreferrer"
              className="home__social-link"
              aria-label="View on GitHub"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.515.12-3.15 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.635.24 2.85.12 3.15.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </a>

            <a
              href="https://www.last.fm/user/lagb2ck"
              target="_blank"
              rel="noopener noreferrer"
              className="home__social-link"
              aria-label="Visit Last.fm"
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/b/b7/Last.fm_favicon.png"
                alt="Last.fm"
                style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }}
              />
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
