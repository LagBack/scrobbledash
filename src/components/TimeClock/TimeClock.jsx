import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import './TimeClock.css'

export default function TimeClock({ hourly }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-15% 0px -15% 0px' })

  const size = 280
  const center = size / 2
  const innerR = 40
  const maxR = 120
  const max = Math.max(...hourly)
  const peakHour = hourly.indexOf(max)

  const hourMarkers = [
    { hour: 0, label: '12a' },
    { hour: 6, label: '6a' },
    { hour: 12, label: '12p' },
    { hour: 18, label: '6p' },
  ]

  return (
    <section ref={ref} className="time-clock">
      <h2 className="time-clock__title">When You Listen</h2>

      <div className="time-clock__chart-wrap">
        <svg viewBox={`0 0 ${size} ${size}`} className="time-clock__svg">
          <circle cx={center} cy={center} r={innerR} className="time-clock__ring" />
          <circle cx={center} cy={center} r={(innerR + maxR) / 2} className="time-clock__ring" />
          <circle cx={center} cy={center} r={maxR} className="time-clock__ring" />

          {hourMarkers.map(({ hour, label }) => {
            const angle = (hour / 24) * 360 - 90
            const rad = (angle * Math.PI) / 180
            const x = center + (maxR + 14) * Math.cos(rad)
            const y = center + (maxR + 14) * Math.sin(rad)
            return (
              <text
                key={hour}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                className="time-clock__marker"
              >
                {label}
              </text>
            )
          })}

          {hourly.map((value, hour) => {
            const angle = (hour / 24) * 360 - 90
            const rad = (angle * Math.PI) / 180
            const length = innerR + (value / max) * (maxR - innerR)
            const x1 = center + innerR * Math.cos(rad)
            const y1 = center + innerR * Math.sin(rad)
            const x2Final = center + length * Math.cos(rad)
            const y2Final = center + length * Math.sin(rad)
            const isPeak = hour === peakHour

            return (
              <motion.line
                key={hour}
                x1={x1}
                y1={y1}
                initial={{ x2: x1, y2: y1, opacity: 0 }}
                animate={isInView ? { x2: x2Final, y2: y2Final, opacity: 1 } : {}}
                transition={{ duration: 0.6, delay: 0.3 + hour * 0.025, ease: [0.16, 1, 0.3, 1] }}
                className={`time-clock__spoke${isPeak ? ' time-clock__spoke--peak' : ''}`}
                strokeLinecap="round"
              />
            )
          })}
        </svg>

        <motion.div
          className="time-clock__peak-label"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 1.2 }}
        >
          <span className="time-clock__peak-value">{formatHour(peakHour)}</span>
          <span className="time-clock__peak-caption">peak listening hour</span>
        </motion.div>
      </div>
    </section>
  )
}

function formatHour(hour) {
  const period = hour < 12 ? 'AM' : 'PM'
  let h = hour % 12
  if (h === 0) h = 12
  return `${h}${period}`
}