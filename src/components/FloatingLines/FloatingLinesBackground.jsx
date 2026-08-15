import FloatingLines from './FloatingLines'
import AccordionGallery from '../AccordionGallery/AccordionGallery'
import '../AccordionGallery/AccordionGallery.css'
import FunStatsSection from '../FunStatsSection/FunStatsSection'
import '../FunStatsSection/FunStatsSection.css'
import './FloatingLinesBackground.css'

export default function FloatingLinesBackground({
  topArtists,
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
        <section className="artists-section">
          <div className="artists-section__content">
            <h2 className="artists-section__title">Top Artists</h2>
            <AccordionGallery
              items={topArtists.map(artist => ({
                image: artist.image,
                label: `${artist.name} · ${artist.plays} plays`,
                alt: artist.name
              }))}
              defaultIndex={2}
              expandRatio={0.52}
              trigger="hover"
              accentColor="#c1121f"
              overlayColor="#0a0a0a"
              textColor="#ffffff"
              height={460}
              gap={10}
              radius={16}
              grayscale={true}
              showLabels={true}
            />
          </div>
        </section>

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
