import FloatingLines from './FloatingLines'
import FunStatsSection from '../FunStatsSection/FunStatsSection'
import '../FunStatsSection/FunStatsSection.css'
import './FloatingLinesBackground.css'

export default function FloatingLinesBackground({
  dominantArtist,
  secondArtist,
  mostPlayedTrack,
  dominantRatio
}) {
  return (
    <div className="floating-lines-wrapper">
      <div className="floating-lines-wrapper__bg" aria-hidden="true">
        <FloatingLines
          linesGradient={['#6b1520', '#4a0808', '#2a0000']}
          enabledWaves={['top', 'middle', 'bottom']}
          lineCount={[4, 10, 16]}
          lineDistance={[10, 7, 4]}
          animationSpeed={0.7}
          interactive={false}
          parallax={false}
        />
      </div>

      <div className="floating-lines__dim" aria-hidden="true" />
      <div className="floating-lines__fade-top" aria-hidden="true" />
      <div className="floating-lines__fade-bottom" aria-hidden="true" />

      <div className="floating-lines__content">
        <FunStatsSection
          dominantArtist={dominantArtist}
          secondArtist={secondArtist}
          mostPlayedTrack={mostPlayedTrack}
          dominantRatio={dominantRatio}
        />
      </div>
    </div>
  )
}
