// SYNERGY 2026 events: filters, search, My picks, live deadlines, schedule, calendar and share.
import { useCallback, useEffect, useMemo, useState } from "react";
import { EVENTS_2026, FLYER_CARD_SIZE, STAR_NIGHT } from "../data/events2026.js";
import { A } from "../data/site.js";
import { reduceMotion } from "../three/shared.js";
import { useToast, useViewer } from "./ui.jsx";

const IST = "+05:30";
const DAY = 864e5;
const at = s => new Date(s.length > 10 ? `${s}:00${IST}` : `${s}T23:59:59${IST}`).getTime();
const EVENTS = EVENTS_2026.map(e => ({
  ...e,
  id: `ev-${e.slug}`,
  regAt: e.reg ? at(e.reg) : null,
  // a date with no time (end null) covers that whole day in IST and shows as "Time TBA"
  times: e.sessions.map(([s, end, label]) => end
    ? { start: at(s), end: at(end), label }
    : { start: new Date(`${s}T00:00:00${IST}`).getTime(), end: new Date(`${s}T00:00:00${IST}`).getTime() + DAY, label, allDay: true }),
  text: `${e.title} ${e.tag} ${e.venue} ${e.desc}`.toLowerCase(),
}));
const TABS = [["all", "All", `${EVENTS.length} events`], ["5", "5 Dec", "Day 1"], ["6", "6 Dec", "Day 2 + Star Night"], ["online", "Online", "Click & Roll"], ["picks", "♥ My picks", null]];

const fmtLeft = ms => { const d = Math.floor(ms / DAY), h = Math.floor(ms / 36e5); return d >= 2 ? `${d} days` : h >= 1 ? `${h} hour${h > 1 ? "s" : ""}` : "under an hour"; };
const fmtTime = t => new Date(t).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" }).replace(":00", "").toUpperCase();
const dayKey = t => new Date(t).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
const dayName = t => new Date(t).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
const shortDate = t => new Date(t).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });

/** registration badge before the fest, live / done during it */
function statusOf(e, now) {
  const s = e.times;
  if (s.some(x => !x.allDay && now >= x.start && now < x.end)) return ["live", "Live now"];
  if (s.length && now >= s[s.length - 1].end) return ["done", "Done"];
  if (e.regAt) {
    if (now > e.regAt) return ["closed", "Registration closed"];
    const left = e.regAt - now;
    return [left < 2 * DAY ? "urgent" : "open", left < DAY && new Date(now).toDateString() === new Date(e.regAt).toDateString() ? "Registration closes today" : `Registration closes in ${fmtLeft(left)}`];
  }
  return null;
}

function usePicks() {
  const KEY = "synergy26-picks";
  const [picks, setPicks] = useState(() => { try { return new Set(JSON.parse(localStorage.getItem(KEY) || "[]")); } catch { return new Set(); } });
  const toggle = useCallback(slug => setPicks(p => {
    const n = new Set(p); n.has(slug) ? n.delete(slug) : n.add(slug);
    try { localStorage.setItem(KEY, JSON.stringify([...n])); } catch {}
    return n;
  }), []);
  return [picks, toggle];
}

function useMinuteClock() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 60000); return () => clearInterval(i); }, []);
  return now;
}

function downloadIcs(e) {
  const url = `${location.origin}${location.pathname}#${e.id}`;
  const d = t => new Date(t).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const esc = s => s.replace(/[\\,;]/g, m => "\\" + m);
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//SYNERGY 2026//United University//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
  const day = t => new Date(t).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }).replace(/-/g, "");
  e.times.forEach((s, i) => lines.push("BEGIN:VEVENT", `UID:${e.slug}-${i}@synergy2026`, `DTSTAMP:${d(Date.now())}`,
    ...(s.allDay ? [`DTSTART;VALUE=DATE:${day(s.start)}`, `DTEND;VALUE=DATE:${day(s.end)}`] : [`DTSTART:${d(s.start)}`, `DTEND:${d(s.end)}`]),
    `SUMMARY:${esc(`${e.title}${s.label ? " – " + s.label : ""} · SYNERGY 2026`)}`,
    `LOCATION:${esc(`${e.venue}, United University, Rawatpur, Jhalwa, Prayagraj`)}`,
    `DESCRIPTION:${esc(`SYNERGY 2026 at United University. Details and registration: ${url}`)}`,
    "BEGIN:VALARM", "TRIGGER:-PT1H", "ACTION:DISPLAY", `DESCRIPTION:${esc(e.title)} starts in 1 hour`, "END:VALARM", "END:VEVENT"));
  lines.push("END:VCALENDAR");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/calendar" }));
  a.download = `synergy-2026-${e.slug}.ics`;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

const flash = id => {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
  el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash");
};

export default function Events2026() {
  const [day, setDay] = useState("all");
  const [query, setQuery] = useState("");
  const [view, setView] = useState("cards");
  const [picks, togglePick] = usePicks();
  const now = useMinuteClock();
  const toast = useToast();
  const openViewer = useViewer();

  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const shown = useMemo(() => EVENTS.filter(e =>
    (day === "all" || (day === "picks" ? picks.has(e.slug) : e.day === day)) && words.every(w => e.text.includes(w))
  ), [day, picks, query]); // eslint-disable-line react-hooks/exhaustive-deps

  // a shared link (#ev-slug) lands on that event
  useEffect(() => {
    const go = () => {
      if (!location.hash.startsWith("#ev-") || !EVENTS.some(e => e.id === location.hash.slice(1))) return;
      setDay("all"); setQuery(""); setView("cards");
      setTimeout(() => flash(location.hash.slice(1)), 400);
    };
    go(); addEventListener("hashchange", go);
    return () => removeEventListener("hashchange", go);
  }, []);

  const soonest = EVENTS.filter(e => e.regAt && e.regAt > now).sort((a, b) => a.regAt - b.regAt)[0];
  const sameDeadline = soonest ? EVENTS.filter(e => e.regAt === soonest.regAt).length : 0;

  const share = async e => {
    const url = `${location.origin}${location.pathname}#${e.id}`;
    try {
      if (navigator.share) { await navigator.share({ title: `${e.title} · SYNERGY 2026`, text: `${e.title} at SYNERGY 2026, United University (${e.time}, ${e.venue})`, url }); return; }
      await navigator.clipboard.writeText(url); toast("Link copied");
    } catch (err) { if (err?.name !== "AbortError") toast(url); }
  };
  const pick = e => { const was = picks.has(e.slug); togglePick(e.slug); toast(was ? `Removed ${e.title} from My picks` : `Saved ${e.title} to My picks`); };
  const viewFlyers = e => openViewer(shown.map(x => ({ src: A(`flyers/2026/${x.slug}.jpg`), alt: `${x.title} flyer`, caption: x.title })), shown.indexOf(e));

  const empty = !shown.length && (day === "picks" && !words.length
    ? "Tap ♡ on any event to save it here. Your picks stay on this device."
    : `No events match “${query.trim()}”. Try another word, or pick “All”.`);

  return (
    <section className="section" id="events">
      <div className="wrap grid-2">
        <div className="glass reveal">
          <p className="kicker">SYNERGY 2026</p>
          <h2>5–6 December 2026</h2>
          <p>Two days of SYNERGY at United University, Prayagraj: {EVENTS.length} events, closing with a live Star Night on 6 December.</p>
          <ol className="plan">
            <li><b>5 Dec</b><span>Day 1: {EVENTS.filter(e => e.day === "5").length} events, from Decor Dazzler at 9:30 AM to Anantya at 4 PM</span></li>
            <li><b>6 Dec</b><span>Day 2: {EVENTS.filter(e => e.day === "6").length} events + Star Night: <strong>Sachin-Jigar LIVE</strong></span></li>
          </ol>
          <div className="soon"><span className="dot" /><span>{soonest
            ? `Next registration deadline: ${shortDate(soonest.regAt)} (${sameDeadline} event${sameDeadline > 1 ? "s" : ""}, closes in ${fmtLeft(soonest.regAt - now)}). Tap a flyer and scan its QR code to register.`
            : "Registrations for SYNERGY 2026 have closed. See you on 5–6 December!"}</span></div>
        </div>
        <figure className="logo-card reveal" data-tilt>
          <img loading="lazy" decoding="async" src={A("img/synergy-2026-ignite.png")} alt="SYNERGY 2026: Let the Synergy Ignite" />
        </figure>
      </div>

      <div className="wrap">
        <div className="ev-toolbar reveal">
          <div className="tabs" role="group" aria-label="Filter SYNERGY 2026 events">
            {TABS.map(([k, b, s]) => <button key={k} type="button" aria-pressed={day === k} onClick={() => setDay(k)}>
              <b>{b}</b><small>{k === "picks" ? (picks.size ? `${picks.size} saved` : "None saved yet") : s}</small>
            </button>)}
          </div>
          <div className="ev-tools">
            <label className="ev-search"><span className="sr-only">Search events</span>
              <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search events, venues, categories…" autoComplete="off" />
            </label>
            <div className="view-toggle" role="group" aria-label="View">
              {[["cards", "Cards"], ["schedule", "Schedule"]].map(([v, l]) => <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)}>{l}</button>)}
            </div>
          </div>
        </div>

        {empty && <p className="ev-empty">{empty}</p>}

        {view === "cards" ? (
          <div className="ev-grid ev-grid-26">
            {shown.map(e => {
              const st = statusOf(e, now), [w, h] = FLYER_CARD_SIZE[e.slug], saved = picks.has(e.slug);
              return (
                <article key={e.slug} className="ev ev26" id={e.id}>
                  <div className="ev-media26">
                    <button className="ev-flyer" aria-label={`View the ${e.title} flyer`} onClick={() => viewFlyers(e)}>
                      <img src={A(`flyers/2026/${e.slug}-card.jpg`)} width={w} height={h} decoding="async" alt={`${e.title} flyer`} loading="lazy" />
                    </button>
                    {st && <span className={`ev-status is-${st[0]}`}>{st[1]}</span>}
                    <button type="button" className="ev-fav" aria-pressed={saved} aria-label={`Save ${e.title} to My picks`} title="Save to My picks" onClick={() => pick(e)}>{saved ? "♥" : "♡"}</button>
                  </div>
                  <div className="ev-body">
                    <span className="tag">{e.tag}</span>
                    <h3>{e.title}</h3>
                    <p>{e.desc}</p>
                    <dl>
                      <div><dt>Date</dt><dd>{e.date}</dd></div>
                      <div><dt>Time</dt><dd>{e.time}</dd></div>
                      <div><dt>Venue</dt><dd>{e.venue}</dd></div>
                      {e.regAt && <div><dt>Register</dt><dd>By {shortDate(e.regAt)} 2026</dd></div>}
                    </dl>
                    <div className="ev-actions">
                      {e.times.length > 0 && <button type="button" className="ev-act" onClick={() => { downloadIcs(e); toast(`Calendar file for ${e.title} downloaded`); }}><span aria-hidden="true">📅</span> Add to calendar</button>}
                      <button type="button" className="ev-act" onClick={() => share(e)}><span aria-hidden="true">↗</span> Share</button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <Schedule shown={shown} day={day} now={now} onGo={id => { if (id === "starnight") { flash("starnight"); return; } setView("cards"); setTimeout(() => flash(id), 60); }} />
        )}
      </div>
    </section>
  );
}

function Schedule({ shown, day, now, onGo }) {
  const rows = [];
  shown.forEach(e => e.times.forEach(s => rows.push({ e, ...s })));
  if (day === "all" || day === "6") rows.push({ star: true, start: at(STAR_NIGHT.start), end: at(STAR_NIGHT.end) });
  const sortKey = r => r.allDay ? r.end - 1 : r.start; // "Time TBA" rows go last in their day
  rows.sort((a, b) => sortKey(a) - sortKey(b));
  const nextUp = rows.find(r => !r.allDay && r.start > now);
  const groups = new Map();
  rows.forEach(r => { const k = r.e?.day === "online" ? "online" : dayKey(r.start); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(r); });
  const tbas = shown.filter(e => !e.times.length);
  if (!rows.length && !tbas.length) return <p className="ev-empty">Nothing to show for this filter.</p>;
  return (
    <div className="schedule">
      {[...groups].map(([k, list]) => (
        <div key={k}>
          <h3 className="sch-day">{k === "online" ? `Online · ${dayName(list[0].end)}` : dayName(list[0].start)}</h3>
          <ol className="sch-list">
            {list.map((r, i) => {
              const state = now >= r.end ? "done" : r.allDay ? "" : now >= r.start ? "live" : r === nextUp ? "next" : "";
              const pill = { live: "Live now", done: "Done", next: "Up next" }[state];
              return (
                <li key={i} className={[state && `is-${state}`, r.star && "is-star"].filter(Boolean).join(" ") || undefined}>
                  <button type="button" onClick={() => onGo(r.star ? "starnight" : r.e.id)}>
                    <span className="sch-time">{r.star ? "Evening" : r.allDay ? "Time TBA" : r.e.day === "online" ? `By ${fmtTime(r.end)}` : fmtTime(r.start)}</span>
                    <span className="sch-what"><b>{r.star ? STAR_NIGHT.title : r.e.title + (r.label ? ` · ${r.label}` : "")}</b><small>{r.star ? STAR_NIGHT.venue : r.e.venue}</small></span>
                    {pill && <span className="sch-pill">{pill}</span>}
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      ))}
      {tbas.length > 0 && <div>
        <h3 className="sch-day">Date to be announced</h3>
        <ol className="sch-list">{tbas.map(e => <li key={e.slug}><button type="button" onClick={() => onGo(e.id)}>
          <span className="sch-time">{e.time}</span><span className="sch-what"><b>{e.title}</b><small>{e.venue}</small></span></button></li>)}</ol>
      </div>}
    </div>
  );
}
