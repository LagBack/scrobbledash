import { useRef, useEffect, useState, useMemo } from 'react';
import MagicRings from '../MagicRings/MagicRings';
import BlurText from '../BlurText/BlurText';
import Counter from '../Counter/Counter';

// Choreography uses refs internally so children never re-mount.
export default function ScrobblesSection({ scrobbles }) {
  const containerRef = useRef(null);
  const [choreoPhase, setChoreoPhase] = useState(0);
  const [counting, setCounting] = useState(false);

  useEffect(() => {
    if (choreoPhase !== 0) return;

    const el = containerRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setChoreoPhase(1);

          // Phase 2 (~1800ms): label blurs out, counter fades in and counts up
          setTimeout(() => {
            setChoreoPhase(2);
            setCounting(true);
          }, 1600);

          // Phase 3 (~3800ms): both re-animate on top
          setTimeout(() => setChoreoPhase(3), 3800);
        }
      },
      { threshold: 0.3 }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [choreoPhase]);

  // Phase-driven opacity overrides for the choreography sequence:
  //   phase 0: label hidden, counter hidden          (pre-trigger)
  //   phase 1: label fades in                          (label only)
  //   phase 2: label hidden again, counter fades in + starts counting (counter only)
  //   phase 3: both fade to full opacity               (both visible)
  const labelStyle = choreoPhase === 0 ? { opacity: 0 } :
                     choreoPhase === 1 ? { opacity: 1, transition: 'opacity 0.5s ease' } :
                     choreoPhase === 2 ? { opacity: 0 } :
                                         { opacity: 1, transition: 'opacity 0.5s ease' };

  const counterStyle = choreoPhase <= 1 ? { opacity: 0 } :
                               { opacity: 1, transition: 'opacity 0.5s ease' };

  // Build digit positions dynamically — no leading zeros.
  // e.g. scrobbles=90000 → [90000, 0, 0, 0, 0]
  const places = useMemo(() => {
    const str = String(scrobbles);
    if (str.length <= 1) return [1];
    return Array.from({ length: str.length }, (_, i) =>
      Number(str[i].padEnd(str.length - i, '0'))
    );
  }, [scrobbles]);

  return (
    <section ref={containerRef} className="app__scrobbles">
      {/* Rings: always playing */}
      <div className="app__scrobbles-bg">
        <MagicRings
          color="#780000"
          colorTwo="#c1121f"
          ringCount={6}
          speed={0.8}
          attenuation={8}
          lineThickness={2.5}
          baseRadius={0.3}
          radiusStep={0.1}
          scaleRate={0.08}
          opacity={0.45}
          blur={6}
          noiseAmount={0.06}
          rotation={15}
          ringGap={1.4}
          fadeIn={0.8}
          fadeOut={0.6}
          followMouse={false}
          hoverScale={1.15}
          parallax={0.03}
        />
      </div>

      {/* Foreground — children always mounted, always visible */}
      <div className="app__scrobbles-content">
        <BlurText
          text="scrobbles"
          delay={100}
          animateBy="letters"
          direction="top"
          stepDuration={0.35}
          style={labelStyle}
          className=""
        />
        <div className="app__counter-wrap" style={counterStyle}>
          <Counter
            value={counting ? scrobbles : 0}
            fontSize={96}
            places={places}
            textColor="var(--text-primary)"
            fontWeight={900}
            gap={6}
            padding={4}
            showGradients={false}
          />
        </div>
      </div>
    </section>
  );
}
