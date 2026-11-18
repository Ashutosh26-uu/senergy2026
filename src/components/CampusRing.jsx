// 3D ring of campus photos (CSS 3D). Drag sets a target angle, release keeps the flick's momentum,
// then it settles into a slow idle spin. Rates are per second so it moves the same at 60, 120 or 144 Hz.
import { useEffect, useRef } from "react";
import { A, RING } from "../data/site.js";
import { reduceMotion } from "../three/shared.js";

export default function CampusRing() {
  const stageRef = useRef(), ringRef = useRef();
  useEffect(() => {
    const stage = stageRef.current, ring = ringRef.current, items = [...ring.children];
    const IDLE = reduceMotion ? 0 : 7, HOVER_IDLE = reduceMotion ? 0 : 2.5; // deg/s
    let radius = 0, angle = 0, target = 0, velocity = IDLE;
    let dragging = false, hovering = false, visible = false, lastX = 0, raf = 0, prev = 0, samples = [];
    const render = () => { ring.style.transform = `translateZ(${-radius}px) rotateX(-6deg) rotateY(${angle.toFixed(3)}deg)`; };
    const layout = () => {
      radius = Math.round(ring.offsetWidth / 2 / Math.tan(Math.PI / items.length)) + 24;
      items.forEach((f, i) => { f.style.transform = `rotateY(${(360 / items.length) * i}deg) translateZ(${radius}px)`; });
      render();
    };
    const frame = now => {
      const dt = Math.min((now - prev) / 1000, 0.05);
      prev = now;
      if (!dragging) {
        const idle = hovering ? HOVER_IDLE : IDLE;
        velocity = idle + (velocity - idle) * Math.exp(-dt * 2.2); // momentum fades into the idle spin
        target += velocity * dt;
      }
      angle += (target - angle) * (1 - Math.exp(-dt * (dragging ? 18 : 10)));
      render();
      raf = visible ? requestAnimationFrame(frame) : 0;
    };
    const run = () => { if (!raf) { prev = performance.now(); raf = requestAnimationFrame(frame); } };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) run(); });
    io.observe(stage);
    const down = e => { dragging = true; lastX = e.clientX; samples = [[performance.now(), target]]; stage.setPointerCapture(e.pointerId); stage.classList.add("dragging"); };
    const move = e => {
      if (!dragging) return;
      target += (e.clientX - lastX) * 0.28; lastX = e.clientX;
      const now = performance.now(); samples.push([now, target]);
      while (samples.length > 2 && now - samples[0][0] > 100) samples.shift();
    };
    const release = () => {
      if (!dragging) return;
      dragging = false; stage.classList.remove("dragging");
      const [t0, a0] = samples[0], [t1, a1] = samples[samples.length - 1];
      velocity = Math.max(-720, Math.min(720, t1 > t0 ? ((a1 - a0) / (t1 - t0)) * 1000 : 0));
    };
    const key = e => {
      const step = 360 / items.length;
      if (e.key === "ArrowLeft") { target -= step; velocity = 0; } else if (e.key === "ArrowRight") { target += step; velocity = 0; }
    };
    const enter = () => { hovering = true; }, leave = () => { hovering = false; };
    stage.addEventListener("pointerdown", down); stage.addEventListener("pointermove", move);
    stage.addEventListener("pointerup", release); stage.addEventListener("pointercancel", release);
    stage.addEventListener("pointerenter", enter); stage.addEventListener("pointerleave", leave);
    stage.addEventListener("keydown", key);
    addEventListener("resize", layout);
    layout();
    return () => {
      cancelAnimationFrame(raf); io.disconnect(); removeEventListener("resize", layout);
      stage.removeEventListener("pointerdown", down); stage.removeEventListener("pointermove", move);
      stage.removeEventListener("pointerup", release); stage.removeEventListener("pointercancel", release);
      stage.removeEventListener("pointerenter", enter); stage.removeEventListener("pointerleave", leave);
      stage.removeEventListener("keydown", key);
    };
  }, []);
  return (
    <section className="section" id="gallery">
      <div className="wrap">
        <div className="head reveal">
          <p className="kicker">Life @ United</p>
          <h2>The campus that hosts the fest</h2>
          <p className="muted">Drag to spin.</p>
        </div>
      </div>
      <div ref={stageRef} className="ring-stage reveal" tabIndex={0} aria-label="Campus photo carousel. Drag, or use the left and right arrow keys, to spin.">
        <div ref={ringRef} className="ring">
          {RING.map(([f, alt]) => <figure key={f}><img loading="lazy" src={A(`ring/${f}.jpg`)} decoding="async" alt={alt} /></figure>)}
        </div>
      </div>
    </section>
  );
}
