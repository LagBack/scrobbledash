import { useState } from 'react'
import './FunStatsSection.css'

const FALLBACK = 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/no-image-available-symbol-300x300.png/300px-no-image-available-symbol-300x300.png'

export default function FunStatsSection({ stats, dominantArtist, secondArtist, mostPlayedTrack, dominantRatio }) {
  const [imgSrc, setImgSrc] = useState(mostPlayedTrack.cover || FALLBACK)

  return (
    <section className="fun-stats">
      <div className="fun-stats__inner">
        <div className="fun-stats__grid">
          {/* Dominant Artist Card */}
          <article className="fun-stats__card fun-stats__card--dominant">
            <p className="fun-stats__label">#1 artist</p>
            <div className="fun-stats__dominant-content">
              <p className="fun-stats__dominant-line">
                <span className="fun-stats__dominant-stat">{dominantArtist.percentage}%</span>
                <span className="fun-stats__dominant-desc">of your listening history belongs to</span>
              </p>
              <h3 className="fun-stats__dominant-artist">{dominantArtist.name}</h3>
              <p className="fun-stats__dominant-plays">
                {dominantArtist.plays.toLocaleString()} plays · that's <strong>{dominantArtist.percentage}%</strong> of everything you've listened to.
              </p>

              {/* Comparison with #2 */}
              <div className="fun-stats__comparison">
                <p className="fun-stats__comparison-text">
                  <strong>{dominantArtist.name}</strong> has <strong>{dominantRatio}×</strong> more plays than <strong>{secondArtist.name}</strong> (#2)
                </p>
              </div>

            </div>
          </article>

          {/* Most Played Track Card */}
          <article className="fun-stats__card fun-stats__card--track">
            <p className="fun-stats__label">most played</p>
            <div className="fun-stats__track-content">
              <div className="fun-stats__track-art">
                <img
                  src={imgSrc}
                  alt={`${mostPlayedTrack.track} cover`}
                  className="fun-stats__track-img"
                  onError={() => setImgSrc(FALLBACK)}
                />
              </div>
              <p className="fun-stats__track-title">{mostPlayedTrack.track}</p>
              <p className="fun-stats__track-artist">
                by <strong>{mostPlayedTrack.artist}</strong>
              </p>
              <p className="fun-stats__track-album">from <em>{mostPlayedTrack.album}</em></p>
              <p className="fun-stats__track-plays">{mostPlayedTrack.plays} plays</p>
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}
