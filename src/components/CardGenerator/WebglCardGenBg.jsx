import { useEffect, useRef } from "react"
import {
  Clock,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  WebGLRenderer,
} from "three"

/* ── Fragment shader: dark particle constellation ─────────────────────── */
const fragmentShader = `
precision highp float;

varying vec2 vUv;

uniform float iTime;
uniform vec3  iResolution;
uniform vec2  iMouse;
uniform bool  interactive;
uniform float animationSpeed;

/* seeded hash for pseudo-random particles */
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  vec2 uv = vUv;
  vec2 aspect = vec2(iResolution.x / iResolution.y, 1.0);
  vec2 p = (2.0 * gl_FragCoord.xy - iResolution.xy) / iResolution.y;
  p.x *= aspect.x;

  float t = iTime * animationSpeed;

  /* mouse parallax offset */
  vec2 mp = vec2(0.0);
  if (interactive) {
    vec2 m = (iMouse.xy / iResolution.xy - 0.5) * 0.6;
    mp = m;
  }

  float colR = 0.0, colG = 0.0, colB = 0.0, alpha = 0.0;

  /* layer 1: dense field of tiny dim dots */
  for (int y = -8; y <= 8; y++) {
    for (int x = -8; x <= 8; x++) {
      vec2 basePos = vec2(float(x) * 0.35, float(y) * 0.35);

      /* drift over time */
      vec2 pos = basePos + mp;
      pos.x += sin(t * 0.15 + float(x) * 0.8) * 0.04;
      pos.y += cos(t * 0.12 + float(y) * 0.9) * 0.03;

      /* random brightness */
      float h = hash(basePos);
      if (h < 0.72) continue; // sparse field

      vec2 diff = p - pos;
      float d = length(diff);

      /* soft dot */
      float r = 0.015 + h * 0.02;
      float brightness = exp(-d * d / (r * r));
      brightness *= smoothstep(0.35, 0.05, d);

      /* color: deep red with some white-hot cores */
      vec3 c;
      if (h > 0.92) {
        // rare bright crimson core
        c = vec3(0.85, 0.15, 0.25) * 1.2;
      } else if (h > 0.85) {
        // warm red dot
        c = vec3(0.45, 0.04, 0.06);
      } else {
        // dim ember
        float pulse = sin(t * 0.3 + h * 20.0) * 0.3 + 0.7;
        c = vec3(0.15, 0.015, 0.02) * pulse;
      }

      /* depth fade near edges */
      float edgeFade = smoothstep(1.4, 0.3, abs(uv.x - 0.5)) *
                       smoothstep(1.2, 0.2, uv.y) *
                       smoothstep(0.0, 0.2, uv.y);

      colR += c.r * brightness * edgeFade;
      colG += c.g * brightness * edgeFade;
      colB += c.b * brightness * edgeFade;
      alpha += brightness * 0.6 * edgeFade;
    }
  }

  /* layer 2: faint connecting lines between close particles */
  for (int i = 0; i < 30; i++) {
    float fi = float(i);
    vec2 basePos = vec2(
      hash(vec2(fi, 1.0)) * 5.6 - mp.x,
      hash(vec2(fi, 7.0)) * 4.8 - mp.y
    );

    /* slow drift */
    basePos.x += sin(t * 0.08 + fi) * 0.15;
    basePos.y += cos(t * 0.06 + fi * 1.3) * 0.12;

    vec2 p2 = basePos * 0.35;
    p2.x *= aspect.x;

    /* find nearest dot */
    float minD = 1e9;
    for (int j = -2; j <= 2; j++) {
      for (int k = -2; k <= 2; k++) {
        vec2 dp = vec2(float(k) * 0.35, float(j) * 0.35) + mp;
        dp.x += sin(t * 0.15 + float(k) * 0.8) * 0.04;
        dp.y += cos(t * 0.12 + float(j) * 0.9) * 0.03;
        minD = min(minD, length(p - dp));
      }
    }

    /* only draw lines if particle is near another one */
    float lineAlpha = exp(-minD * 4.0) * 0.15;
    float dist = length(p - p2);
    float lineFalloff = smoothstep(0.8, 0.0, dist / (1.0 + lineAlpha));

    colR += 0.3 * lineAlpha * lineFalloff;
    colG += 0.02 * lineAlpha * lineFalloff;
    colB += 0.03 * lineAlpha * lineFalloff;
    alpha += lineAlpha * lineFalloff * 0.4;
  }

  /* subtle vignette */
  float vig = 1.0 - length((uv - 0.5) * vec2(1.1, 0.9));
  vig = smoothstep(0.0, 0.6, vig);
  colR *= vig;
  colG *= vig;
  colB *= vig;

  /* cap brightness */
  float lum = max(colR, max(colG, colB));
  alpha = min(alpha, 1.0);

  gl_FragColor = vec4(vec3(colR, colG, colB), alpha);
}
`;

const vertexShader = `
precision highp float;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

/* ── React component ─────────────────────────────────────────────────── */
export default function WebglCardGenBg({
  interactive = true,
  animationSpeed = 0.25,
  className = "",
}) {
  const containerRef = useRef(null);

  const targetMouseRef = useRef(new Vector2(-1000, -1000));
  const currentMouseRef = useRef(new Vector2(-1000, -1000));

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let active = true;
    const scene = new Scene();
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    camera.position.z = 1;

    const renderer = new WebGLRenderer({ antialias: false, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);

    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    renderer.domElement.style.pointerEvents = "none";
    container.appendChild(renderer.domElement);

    const uniforms = {
      iTime: { value: 0 },
      iResolution: { value: new Vector3(1, 1, 1) },
      iMouse: { value: new Vector2(-1000, -1000) },
      interactive: { value: interactive },
      animationSpeed: { value: animationSpeed },
    };

    const material = new ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    });

    const geometry = new PlaneGeometry(2, 2);
    const mesh = new Mesh(geometry, material);
    scene.add(mesh);

    const clock = new Clock();

    const setSize = () => {
      if (!active) return;
      const width = container.clientWidth || 1;
      const height = container.clientHeight || 1;
      renderer.setSize(width, height, false);
      uniforms.iResolution.value.set(
        renderer.domElement.width,
        renderer.domElement.height,
        1
      );
    };

    setSize();

    const resizeObserver = new ResizeObserver(() => { if (active) setSize(); });
    resizeObserver.observe(container);

    const handlePointerMove = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      targetMouseRef.current.set(
        (event.clientX - rect.left) * renderer.getPixelRatio(),
        (rect.height - event.clientY + rect.top) * renderer.getPixelRatio()
      );
    };

    const handlePointerLeave = () => {
      targetMouseRef.current.set(-1000, -1000);
    };

    if (interactive) {
      container.addEventListener("pointermove", handlePointerMove);
      container.addEventListener("pointerleave", handlePointerLeave);
    }

    let rafId = 0;
    const renderLoop = () => {
      if (!active) return;
      uniforms.iTime.value = clock.getElapsedTime();

      const ease = 1 - Math.exp(-0.08 * 60 / 60);
      currentMouseRef.current.x +=
        (targetMouseRef.current.x - currentMouseRef.current.x) * ease;
      currentMouseRef.current.y +=
        (targetMouseRef.current.y - currentMouseRef.current.y) * ease;

      uniforms.iMouse.value.set(
        currentMouseRef.current.x,
        currentMouseRef.current.y
      );

      renderer.render(scene, camera);
      rafId = requestAnimationFrame(renderLoop);
    };
    rafId = requestAnimationFrame(renderLoop);

    return () => {
      active = false;
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      if (interactive) {
        container.removeEventListener("pointermove", handlePointerMove);
        container.removeEventListener("pointerleave", handlePointerLeave);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
    };
  }, [interactive, animationSpeed]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 w-full h-full overflow-hidden ${className}`}
      style={{ mixBlendMode: "normal", pointerEvents: "none", opacity: 1 }}
    />
  );
}
