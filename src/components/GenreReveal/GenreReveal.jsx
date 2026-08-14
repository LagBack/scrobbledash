import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import './GenreReveal.css'

const DEFAULT_POOL = [
  'indie', 'screamo', 'edm', 'rock', 'rap',
  'emo', 'electronic', 'alternative rock', 'hardcore', 'shoegaze',
]

export default function GenreReveal({ genre, pool = DEFAULT_POOL }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-15% 0px -15% 0px' })
  const [step, setStep] = useState(0)
  const [settled, setSettled] = useState(false)

  // Build the spin sequence once: a handful of random pool words, ending on the real genre.
  const sequence = useMemo(() => {
    const spins = 10
    const words = Array.from({ length: spins }, () => {
      const candidates = pool.filter(w => w.toLowerCase() !== genre.toLowerCase())
      return candidates[Math.floor(Math.random() * candidates.length)]
    })
    words.push(genre)
    return words
  }, [genre, pool])

  useEffect(() => {
    if (!isInView || settled) return

    let i = 0
    const tick = () => {
      i += 1
      setStep(i)
      if (i >= sequence.length - 1) {
        setSettled(true)
        return
      }
      // ease-out timing: fast spins first, slows down as it approaches the real value
      const progress = i / sequence.length
      const delay = 60 + progress * progress * 260
      timeoutRef.current = setTimeout(tick, delay)
    }

    const timeoutRef = { current: null }
    timeoutRef.current = setTimeout(tick, 500)
    return () => clearTimeout(timeoutRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInView])

  const currentWord = sequence[step] ?? genre

  return (
    <div ref={ref} className="genre-reveal">
      <motion.p
        className="genre-reveal__eyebrow"
        initial={{ opacity: 0, y: 12 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        this week you listened to alot of
      </motion.p>

      <div className="genre-reveal__wheel">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={step}
            className={`genre-reveal__word${settled ? ' genre-reveal__word--settled' : ''}`}
            initial={{ y: 36, opacity: 0, filter: 'blur(8px)' }}
            animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
            exit={{ y: -36, opacity: 0, filter: 'blur(8px)' }}
            transition={{
              duration: settled ? 0.7 : 0.16,
              ease: settled ? [0.16, 1, 0.3, 1] : 'easeOut',
            }}
          >
            {currentWord}
          </motion.span>
        </AnimatePresence>
      </div>

      <motion.div
        className="genre-reveal__underline"
        initial={{ scaleX: 0 }}
        animate={settled ? { scaleX: 1 } : {}}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
      />
    </div>
  )
}