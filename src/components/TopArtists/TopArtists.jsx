import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import './TopArtists.css'

export default function TopArtists({ artists }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-10% 0px -10% 0px' })
  const maxPlays = Math.max(...artists.map(a => a.plays))

  return (
    <section ref={ref} className="top-artists">
      <h2 className="top-artists__title">Top Artists</h2>
      <div className="top-artists__list">
        {artists.map((artist, i) => (
          <motion.div
            key={artist.name}
            className="top-artists__row"
            initial={{ opacity: 0, x: -24 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="top-artists__rank">{String(i + 1).padStart(2, '0')}</span>
            <div className="top-artists__info">
              <div className="top-artists__meta">
                <span className="top-artists__name">{artist.name}</span>
                <span className="top-artists__plays">{artist.plays} plays</span>
              </div>
              <div className="top-artists__track">
                <motion.div
                  className="top-artists__bar"
                  initial={{ scaleX: 0 }}
                  animate={isInView ? { scaleX: artist.plays / maxPlays } : {}}
                  transition={{ duration: 0.9, delay: i * 0.08 + 0.15, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}