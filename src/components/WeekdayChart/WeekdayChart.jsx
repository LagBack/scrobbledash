import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import './WeekdayChart.css'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function WeekdayChart({ weekdays }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-15% 0px -15% 0px' })

  const max = Math.max(...weekdays)
  const peakIndex = weekdays.indexOf(max)
  const peakDay = DAY_LABELS[peakIndex]

  return (
    <section ref={ref} className="weekday-chart">
      <h2 className="weekday-chart__title">Busiest Days</h2>

      <div className="weekday-chart__bars">
        {weekdays.map((value, i) => {
          const isPeak = i === peakIndex
          return (
            <div key={DAY_LABELS[i]} className="weekday-chart__col">
              <motion.div
                className={`weekday-chart__bar${isPeak ? ' weekday-chart__bar--peak' : ''}`}
                initial={{ scaleY: 0 }}
                animate={isInView ? { scaleY: value / max } : {}}
                transition={{ duration: 0.7, delay: 0.2 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
              />
              <span className={`weekday-chart__label${isPeak ? ' weekday-chart__label--peak' : ''}`}>
                {DAY_LABELS[i]}
              </span>
            </div>
          )
        })}
      </div>

      <motion.p
        className="weekday-chart__peak"
        initial={{ opacity: 0, y: 8 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.9 }}
      >
        <span className="weekday-chart__peak-day">{peakDay}</span>
        <span className="weekday-chart__peak-caption">most active day</span>
      </motion.p>
    </section>
  )
}
