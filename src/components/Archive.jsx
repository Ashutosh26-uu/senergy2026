// Past editions: a glimpses preview, then one full-screen gallery per year.
import { useCallback, useEffect, useRef, useState } from "react";
import { EDITIONS, EVENTS_2025, GALLERY, PREVIEW, shotSize } from "../data/pastYears.js";
import { A } from "../data/site.js";
import { reduceMotion } from "../three/shared.js";
import { Modal, useViewer } from "./ui.jsx";
import { YouTube } from "./sections.jsx";

const shotItem = (year, slug, title, sub) => ({ src: A(`glimpses/${year}/${slug}.jpg`), alt: `${title}${sub ? ` (${sub})` : ""}, SYNERGY ${year}`, caption: sub ? `${title} · ${sub}` : title });

/** One photo at its natural shape, with a caption under it. */
function Shot({ year, slug, title, sub, onOpen }) {
  const [w, h] = shotSize(year, slug);
  return (
    <button className="shot" onClick={onOpen}>
      <img loading="lazy" decoding="async" src={A(`glimpses/${year}/${slug}-sm.jpg`)} width={w} height={h} alt={`${title}${sub ? ` (${sub})` : ""}, SYNERGY ${year}`} />
      <span>{title}{sub && <small>{sub}</small>}</span>
    </button>
  );
}

const countPhotos = y => GALLERY[y].days.reduce((n, [, list]) => n + list.length, 0);

export default function Archive() {
  const [year, setYear] = useState(null);
  const openViewer = useViewer();
  // old links (#synergy2025, #synergy2024) still land on the right photos
  useEffect(() => {
    const go = () => { const m = location.hash.match(/^#synergy(2024|2025)$/); if (m) { document.getElementById("archive")?.scrollIntoView(); setYear(m[1]); } };
    go(); addEventListener("hashchange", go);
    return () => removeEventListener("hashchange", go);
  }, []);
  const preview = PREVIEW.map(([y, s, t, sub]) => shotItem(y, s, t, sub));
  const close = useCallback(() => setYear(null), []);
  return (
    <section className="section" id="archive">
      <div className="wrap">
        <div className="head reveal">
          <p className="kicker">Glimpses</p>
          <h2>SYNERGY through the years</h2>
          <p className="muted">A few moments from the last two editions. Pick a year to open every photo from it.</p>
        </div>
        <div className="masonry preview reveal">
          {PREVIEW.map(([y, s, t, sub], i) => <Shot key={y + s} year={y} slug={s} title={t} sub={sub} onOpen={() => openViewer(preview, i)} />)}
        </div>

        <div className="years reveal">
          {["2025", "2024"].map(y => (
            <button key={y} className="year-card" onClick={() => setYear(y)}>
              <img className={GALLERY[y].darkLogo ? "dark" : undefined} src={A(`img/${GALLERY[y].logo}`)} alt="" loading="lazy" decoding="async" />
              <span className="yc-text"><b>{GALLERY[y].title}</b><small>{GALLERY[y].dates.replace("November", "Nov")}</small>
                <small>{countPhotos(y)} photos · {y === "2025" ? "9 events with flyers" : "14 events"}</small></span>
              <span className="yc-go" aria-hidden="true">Open all photos →</span>
            </button>
          ))}
        </div>

        <div className="grid-2 recap">
          <figure className="video reveal">
            <YouTube id="ijBcWvlX1K8" label="Play SYNERGY 2025 recap video">
              <img src={A("img/yt-synergy-2025-sm.jpg")} srcSet={`${A("img/yt-synergy-2025-sm.jpg")} 720w, ${A("img/yt-synergy-2025.jpg")} 1280w`} sizes="(max-width: 900px) 100vw, 560px" decoding="async" alt="SYNERGY 2025: Ankit Tiwari live in concert, 29th November" loading="lazy" />
              <span className="play" aria-hidden="true" />
            </YouTube>
            <figcaption>Relive SYNERGY 2025: the official recap</figcaption>
          </figure>
          <div className="editions">
            {EDITIONS.map(e => (
              <article key={e.year} className={`edition reveal${e.now ? " now" : ""}`}>
                <img decoding="async" className={e.dark ? "dark-badge" : undefined} src={A(`img/${e.logo}`)} alt={`SYNERGY ${e.year}`} loading="lazy" />
                <div><b>{e.year}</b><small>{e.sub}</small></div>
              </article>
            ))}
          </div>
        </div>
      </div>

      {["2025", "2024"].map(y => (
        <Modal key={y} open={year === y} onClose={close} className="year-gallery" label={`${GALLERY[y].title} photos`} onOpened={d => { d.scrollTop = 0; }}>
          <YearGallery year={y} />
        </Modal>
      ))}
    </section>
  );
}

function YearGallery({ year }) {
  const g = GALLERY[year];
  const openViewer = useViewer();
  const body = useRef();
  const all = g.days.flatMap(([, list]) => list.map(s => ({ ...s, item: shotItem(year, s.slug, s.title, s.sub) })));
  const items = all.map(s => s.item);
  const sections = [...(year === "2025" ? [["events", "The events"]] : []), ...g.days.map(([label], i) => [`d${i}`, label])];
  const [on, setOn] = useState(sections[0][0]);
  // highlight the chip of the day on screen; at the bottom, the last day
  useEffect(() => {
    const dlg = body.current.closest("dialog");
    let queued = false;
    const mark = () => {
      queued = false;
      const heads = [...dlg.querySelectorAll(".yg-day")], top = dlg.scrollTop + 160;
      let cur = 0;
      heads.forEach((h, i) => { if (h.offsetTop <= top) cur = i; });
      if (dlg.scrollTop + dlg.clientHeight >= dlg.scrollHeight - 4) cur = heads.length - 1;
      setOn(sections[cur][0]);
    };
    const onScroll = () => { if (!queued) { queued = true; requestAnimationFrame(mark); } };
    dlg.addEventListener("scroll", onScroll, { passive: true });
    return () => dlg.removeEventListener("scroll", onScroll);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  let n = 0;
  return <>
    <header className="yg-head">
      <img className={g.darkLogo ? "dark" : undefined} src={A(`img/${g.logo}`)} alt="" decoding="async" />
      <div><b>{g.title}</b><small>{g.dates}</small></div>
      <button className="yg-close" aria-label={`Close ${g.title} photos`} onClick={e => e.currentTarget.closest("dialog").close()}>×</button>
    </header>
    <nav className="yg-jump" aria-label="Jump to">
      {sections.map(([id, label]) => <button key={id} type="button" className={on === id ? "on" : undefined}
        onClick={() => document.getElementById(`yg-${year}-${id}`)?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" })}>{label}</button>)}
    </nav>
    <div className="yg-body" ref={body}>
      {year === "2025" && <Events2025 />}
      {g.days.map(([label, list], i) => (
        <div key={label}>
          <h3 className="yg-day" id={`yg-${year}-d${i}`}>{label}</h3>
          <div className="masonry">
            {list.map(s => { const idx = n++; return <Shot key={s.slug} year={year} {...s} onOpen={() => openViewer(items, idx)} />; })}
          </div>
        </div>
      ))}
    </div>
  </>;
}

function Events2025() {
  const [day, setDay] = useState("all");
  const openViewer = useViewer();
  const shown = EVENTS_2025.filter(e => day === "all" || e.day === day);
  const photos = shown.map(e => ({ src: A(`glimpses/2025/${e.photo}.jpg`), alt: `${e.title} at SYNERGY 2025`, caption: e.title }));
  return <>
    <h3 className="yg-day" id="yg-2025-events">The events · tap a photo or its flyer</h3>
    <div className="tabs" role="group" aria-label="Filter SYNERGY 2025 events by day">
      {[["all", "All", "9 events"], ["28", "28 Nov", "Day 1"], ["29", "29 Nov", "Day 2 + Star Night"]].map(([k, b, s]) =>
        <button key={k} type="button" aria-pressed={day === k} onClick={() => setDay(k)}><b>{b}</b><small>{s}</small></button>)}
    </div>
    <div className="ev-grid">
      {shown.map((e, i) => (
        <article key={e.flyer} className="ev">
          <div className="ev-media">
            <button className="ev-flyer" aria-label={`View a photo from ${e.title}`} onClick={() => openViewer(photos, i)}>
              <img src={A(`glimpses/2025/${e.photo}-sm.jpg`)} width={700} height={e.photo === "tattoo" ? 393 : 467} decoding="async" alt={`${e.title} at SYNERGY 2025`} loading="lazy" />
            </button>
            <button className="ev-poster" aria-label={`View the ${e.title} flyer`} onClick={() => openViewer([{ src: A(`flyers/${e.flyer}.jpg`), alt: `${e.title} flyer`, caption: `${e.title} · flyer` }])}>
              <img src={A(`flyers/card/${e.flyer}.jpg`)} decoding="async" alt="" loading="lazy" /><span>Flyer</span>
            </button>
          </div>
          <div className="ev-body">
            <span className="tag">{e.tag}</span>
            <h3>{e.title}</h3>
            <p>{e.desc}</p>
            <dl><div><dt>Date</dt><dd>{e.day} Nov 2025</dd></div><div><dt>Time</dt><dd>{e.time}</dd></div><div><dt>Venue</dt><dd>{e.venue}</dd></div></dl>
          </div>
        </article>
      ))}
    </div>
  </>;
}
