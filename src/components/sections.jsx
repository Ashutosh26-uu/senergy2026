// Page chrome and the simpler sections.
import { useEffect, useRef, useState } from "react";
import { A, FACULTIES, FEST, NAV, SOCIALS } from "../data/site.js";
import { reduceMotion } from "../three/shared.js";

/* ---------- loader: never blocks for long, even if the 3D stage is slow ---------- */
export function Loader({ done }) {
  const [gone, setGone] = useState(false);
  useEffect(() => { if (done) { const t = setTimeout(() => setGone(true), 1000); return () => clearTimeout(t); } }, [done]);
  if (gone) return null;
  return (
    <div id="loader" className={done ? "done" : ""} aria-hidden="true">
      <div className="loader-inner">
        <img className="loader-logo" src={A("img/synergy-2026.svg")} alt="SYNERGY 2026: Let the Synergy Ignite" />
        <div className="loader-bar"><i /></div>
        <small>Setting up the stage…</small>
      </div>
    </div>
  );
}

/* ---------- nav: mobile menu + highlight of the section on screen ---------- */
export function Nav() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(null);
  const menuBtn = useRef();
  useEffect(() => {
    const io = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id === "hero" ? null : e.target.id); }),
      { rootMargin: "-45% 0px -50% 0px" }); // the section crossing the middle of the screen
    ["hero", ...NAV.map(n => n[0])].forEach(id => { const el = document.getElementById(id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (!open) return;
    const onKey = e => { if (e.key === "Escape") { setOpen(false); menuBtn.current?.focus(); } };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [open]);
  return (
    <header className={`nav${open ? " open" : ""}`}>
      <a href="#top" className="brand" aria-label="United University home">
        <span className="brand-logo"><img src={A("img/logo_small.png")} alt="United University" /></span>
      </a>
      <nav className="links" aria-label="Sections">
        {NAV.map(([id, label]) => <a key={id} href={`#${id}`} className={active === id ? "active" : undefined} onClick={() => setOpen(false)}>{label}</a>)}
      </nav>
      <a className="btn btn-sm" href="https://www.instagram.com/united_university/" target="_blank" rel="noopener">Get updates</a>
      <button ref={menuBtn} className="menu" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(o => !o)}><span /><span /></button>
    </header>
  );
}

/* ---------- hero with countdown: to day 1, then to day 2, then "live" ---------- */
const STAGES = [[FEST.start, "SYNERGY 2026 begins in"], [FEST.starNight, "Day 2 + Star Night begins in"]].map(([t, l]) => [new Date(t).getTime(), l]);
function useCountdown() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(i); }, []);
  const next = STAGES.find(([t]) => t > now);
  if (!next) return { label: now < new Date(FEST.end).getTime() ? "SYNERGY 2026 is live now" : "Thank you for an unforgettable SYNERGY 2026" };
  const ms = next[0] - now, pad = n => String(Math.floor(n)).padStart(2, "0");
  return { label: next[1], parts: [[pad(ms / 864e5), "Days"], [pad((ms / 36e5) % 24), "Hours"], [pad((ms / 6e4) % 60), "Min"], [pad((ms / 1e3) % 60), "Sec"]] };
}

export function Hero({ fallback }) {
  const cd = useCountdown();
  return (
    <section className="hero" id="hero">
      <p className="eyebrow reveal">United University, Prayagraj presents</p>
      <h1 className="sr-only">SYNERGY 2026 — Annual Fest of United University</h1>
      {fallback && <h1 className="hero-fallback" aria-hidden="true" style={{ display: "block" }}>SYNERGY<br /><span>2026</span></h1>}
      <div className="hero-bottom">
        <p className="tagline reveal">Let the Synergy Ignite. Headlining Star Night: <strong>Sachin-Jigar LIVE</strong>.</p>
        <div className="hero-meta reveal">
          <div><small>Fest</small><strong>{FEST.dateLabel}</strong></div>
          <div><small>Star Night · 6 Dec</small><strong>Sachin-Jigar LIVE</strong></div>
        </div>
        <p className="countdown-label reveal">{cd.label}</p>
        {cd.parts && <div className="countdown reveal" role="timer">
          {cd.parts.map(([v, l]) => <div key={l}><b>{v}</b><small>{l}</small></div>)}
        </div>}
        <div className="cta reveal">
          <a className="btn" href="#events">SYNERGY 2026</a>
          <a className="btn btn-ghost" href="#archive">Past SYNERGYs</a>
        </div>
      </div>
      <a href="#about" className="scroll-hint" aria-label="Scroll down"><span /></a>
    </section>
  );
}

/* ---------- about, with numbers that count up when seen ---------- */
function CountUp({ to }) {
  const ref = useRef(); const [n, setN] = useState(0);
  useEffect(() => {
    const el = ref.current;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      if (reduceMotion) { setN(to); return; }
      const t0 = performance.now();
      const step = now => { const p = Math.min(1, (now - t0) / 1600); setN(Math.round(to * (1 - Math.pow(1 - p, 3)))); if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, [to]);
  return <b ref={ref}>{n}</b>;
}

export function About() {
  return (
    <section className="section" id="about">
      <div className="wrap grid-2">
        <div className="glass reveal">
          <p className="kicker">About the fest</p>
          <h2>Where every department of United comes alive.</h2>
          <p>SYNERGY is the annual fest of <strong>United University</strong>, bringing all {FACULTIES.length} of its faculties onto one stage. It's days of competition, culture and creativity across the Jhalwa campus, ending in a Star Night under the lights.</p>
          <ul className="faculties" aria-label="Faculties of United University">
            {FACULTIES.map(f => <li key={f}>{f}</li>)}
          </ul>
          <p>From "Pulse of United" in 2024 to "Let the Synergy Ignite" in 2025 and 2026, every edition has ended in a packed open-air concert. SYNERGY 2026 brings <strong>Sachin-Jigar</strong> to the main stage.</p>
          <div className="stats">
            <div><CountUp to={30} /><span>+</span><small>Courses</small></div>
            <div><CountUp to={4150} /><span>+</span><small>Students</small></div>
            <div><CountUp to={250} /><span>+</span><small>Faculty</small></div>
            <div><CountUp to={1998} /><small>United Group since</small></div>
          </div>
        </div>
        <figure className="photo-3d reveal" data-tilt>
          <img src={A("img/glob_4-sm.jpg")} srcSet={`${A("img/glob_4-sm.jpg")} 700w, ${A("img/glob_4.jpg")} 1000w`} sizes="(max-width: 900px) 100vw, 560px" decoding="async" alt="United students on a global exposure tour" loading="lazy" />
          <figcaption>United students on a global exposure tour</figcaption>
        </figure>
      </div>
    </section>
  );
}

/* ---------- YouTube: the player loads only when clicked ---------- */
export function YouTube({ id, label, className, children }) {
  const [playing, setPlaying] = useState(false);
  return (
    <button className={`yt${className ? " " + className : ""}`} aria-label={label} onClick={() => setPlaying(true)}>
      {playing
        ? <iframe src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`} title={label} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
        : children}
    </button>
  );
}

export function StarNight() {
  return (
    <section className="section" id="starnight">
      <div className="wrap grid-2 reverse">
        <div className="glass reveal">
          <p className="kicker">Star Night · 6 December 2026</p>
          <h2>Sachin-Jigar LIVE</h2>
          <p>"The wait is over." United University has announced composer duo <strong>Sachin-Jigar</strong>, Sachin Sanghvi and Jigar Saraiya, as the SYNERGY 2026 headliners. Expect a night of their Bollywood hits like <em>Apna Bana Le</em>, <em>Aaj Ki Raat</em>, <em>Tum Hi Ho Bandhu</em> and <em>Sun Saathiya</em>.</p>
          <div className="mystery">
            <img loading="lazy" decoding="async" className="artist-avatar" src={A("img/sachin-jigar-wide.jpg")} alt="Sachin Sanghvi and Jigar Saraiya" />
            <div><strong>Sachin-Jigar</strong><small>Live performance · 6 Dec 2026 · United University campus</small></div>
          </div>
          <a className="btn" href="https://www.youtube.com/shorts/Yju1cMFxBGc" target="_blank" rel="noopener">Watch the announcement</a>
        </div>
        <figure className="video short reveal">
          <YouTube id="Yju1cMFxBGc" label="Play the Sachin-Jigar announcement video">
            <img loading="lazy" decoding="async" src={A("img/sachin-jigar-wide.jpg")} alt="Sachin Sanghvi and Jigar Saraiya" className="sj-photo" />
            <span className="shade" aria-hidden="true" />
            <img loading="lazy" decoding="async" src={A("img/synergy-2026.svg")} alt="SYNERGY 2026 logo" className="logo-poster" />
            <span className="poster-title">SACHIN-JIGAR<br /><small>LIVE AT SYNERGY 2026</small></span>
            <span className="play" aria-hidden="true" />
          </YouTube>
        </figure>
      </div>
    </section>
  );
}

export function Contact() {
  return (
    <section className="section" id="contact">
      <div className="wrap">
        <div className="glass contact reveal">
          <div>
            <p className="kicker">Contact</p>
            <h2>Be part of SYNERGY 2026</h2>
            <p className="muted">Registrations, sponsorships and participation queries:</p>
          </div>
          <div className="contact-list">
            <a href="tel:18001218797"><small>Toll free</small>1800-121-8797</a>
            <a href="mailto:contact@uniteduniversity.edu.in"><small>Email</small>contact@uniteduniversity.edu.in</a>
            <a href="https://api.whatsapp.com/send?phone=918189059923" target="_blank" rel="noopener"><small>WhatsApp</small>+91 81890 59923</a>
          </div>
          <div className="socials">{SOCIALS.map(([l, h]) => <a key={l} href={h} target="_blank" rel="noopener">{l}</a>)}</div>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="foot">
      <div className="foot-grid">
        <div className="foot-brand">
          <img loading="lazy" decoding="async" className="foot-logo" src={A("img/synergy-2026.svg")} alt="SYNERGY 2026" />
          <p>The annual fest of United University, Prayagraj<br /><span className="muted">5–6 December 2026 · Rawatpur, Jhalwa, Prayagraj</span></p>
        </div>
        <nav className="foot-links" aria-label="Footer">
          <a href="#events">SYNERGY 2026</a><a href="#starnight">Star Night</a><a href="#archive">Past years</a><a href="#venue">Venue</a><a href="#contact">Contact</a>
        </nav>
      </div>
      <div className="foot-bottom">
        <p className="muted">Photos, flyers and videos: United University, Prayagraj</p>
        <p className="credit">Built by <a href="https://reasonateai.com/" target="_blank" rel="noopener">REASONATEAI</a></p>
      </div>
    </footer>
  );
}

/* ---------- back to top, with a ring that fills as you scroll ---------- */
export function BackToTop() {
  const ref = useRef(), ring = useRef();
  useEffect(() => {
    let queued = false;
    const on = () => {
      if (queued) return; queued = true;
      requestAnimationFrame(() => { // at most once a frame, without React re-renders
        queued = false;
        const max = document.documentElement.scrollHeight - innerHeight;
        ref.current.classList.toggle("show", scrollY > innerHeight * 1.2);
        ring.current.style.strokeDashoffset = (119.4 * (1 - (max > 0 ? scrollY / max : 0))).toFixed(1);
      });
    };
    addEventListener("scroll", on, { passive: true }); on();
    return () => removeEventListener("scroll", on);
  }, []);
  return (
    <button ref={ref} className="to-top" aria-label="Back to top" onClick={() => scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" })}>
      <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">
        <circle cx="22" cy="22" r="19" fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="2" />
        <circle ref={ring} cx="22" cy="22" r="19" fill="none" stroke="url(#tg)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="119.4" strokeDashoffset="119.4" transform="rotate(-90 22 22)" />
        <defs><linearGradient id="tg"><stop offset="0" stopColor="#ff2e88" /><stop offset="1" stopColor="#29e0ff" /></linearGradient></defs>
        <path d="M22 28V16m-6 6 6-6 6 6" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
