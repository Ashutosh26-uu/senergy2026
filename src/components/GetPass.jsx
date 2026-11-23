// "Get your pass": a student enters their UU ID and full name, the gate server checks them and hands
// over the signed pass once; the card is drawn here as a PNG. Plus the schedule/poster popup.
import { useCallback, useEffect, useRef, useState } from "react";
import { A, FEST, PASS_SERVER } from "../data/site.js";
import { Modal, useViewer } from "./ui.jsx";

export const POSTERS = [
  { src: A("img/synergy26-schedule.jpg"), alt: "SYNERGY 2026 Day 1 and Day 2 events and venues", caption: "SYNERGY 2026 · Day 1 & Day 2 schedule and venues" },
  { src: A("img/sachin-jigar-poster.jpg"), alt: "Sachin-Jigar live at SYNERGY 2026 on 6 December", caption: "Sachin-Jigar LIVE · 6 December 2026" },
];

/* open the pass popup from anywhere (nav button, floating button) */
export const openPass = () => dispatchEvent(new Event("synergy:pass"));

/* ---------- helpers ---------- */
let qrLib;
function loadQR() {   // the same QR library the gate pages use, loaded only when needed
  if (!qrLib) qrLib = new Promise((ok, fail) => {
    if (window.qrcode) return ok(window.qrcode);
    const s = document.createElement("script");
    s.src = `${import.meta.env.BASE_URL}gate/vendor/qrcode.js`; s.onload = () => ok(window.qrcode); s.onerror = () => { qrLib = null; fail(new Error("Could not load the QR maker.")); };
    document.head.appendChild(s);
  });
  return qrLib;
}
const loadImg = src => new Promise((ok, fail) => { const i = new Image(); i.onload = () => ok(i); i.onerror = fail; i.src = src; });
function rounded(c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, r); }
function fit(c, text, max, size, weight, family) {
  let s = size; do { c.font = `${weight} ${s}px ${family}`; s -= 2; } while (c.measureText(text).width > max && s > 20);
}

async function drawPass(p) {
  const W = 900, H = 1440, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const c = cv.getContext("2d");
  await document.fonts?.ready;
  const [qrcode, logo, photo] = await Promise.all([
    loadQR(), loadImg(A("img/synergy-2026.svg")).catch(() => null),
    p.photo ? loadImg("data:image/jpeg;base64," + p.photo).catch(() => null) : null,
  ]);
  // background
  c.fillStyle = "#0a0712"; c.fillRect(0, 0, W, H);
  const glow = (x, y, r, col) => { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = g; c.fillRect(0, 0, W, H); };
  glow(80, 120, 620, "rgba(255,46,136,.38)"); glow(860, 520, 620, "rgba(41,224,255,.25)"); glow(450, 1440, 700, "rgba(163,92,255,.32)");
  const bar = c.createLinearGradient(0, 0, W, 0); bar.addColorStop(0, "#ff2e88"); bar.addColorStop(.5, "#a35cff"); bar.addColorStop(1, "#29e0ff");
  c.fillStyle = bar; c.fillRect(0, 0, W, 14); c.fillRect(0, H - 14, W, 14);
  // logo + title
  if (logo) c.drawImage(logo, (W - 300) / 2, 54, 300, 300 * 203 / 353);
  c.textAlign = "center"; c.fillStyle = "#fff";
  c.font = "800 44px Unbounded, system-ui, sans-serif"; c.fillText("ENTRY PASS", W / 2, 290);
  c.font = "500 26px Inter, system-ui, sans-serif"; c.fillStyle = "rgba(255,255,255,.78)";
  c.fillText(`${FEST.dateLabel} · United University, Prayagraj`, W / 2, 332);
  // photo
  const px = 70, py = 390, pw = 300, ph = 375;
  c.save(); rounded(c, px, py, pw, ph, 26); c.clip();
  if (photo) {
    const s = Math.max(pw / photo.width, ph / photo.height), w = photo.width * s, h = photo.height * s;
    c.drawImage(photo, px + (pw - w) / 2, py + (ph - h) / 2, w, h);
  } else {
    c.fillStyle = "#1c1630"; c.fillRect(px, py, pw, ph);
    c.fillStyle = "rgba(255,255,255,.7)"; c.font = "800 110px Unbounded, sans-serif";
    c.fillText(p.name.split(/\s+/).map(w => w[0]).slice(0, 2).join(""), px + pw / 2, py + ph / 2 + 38);
  }
  c.restore();
  c.strokeStyle = bar; c.lineWidth = 6; rounded(c, px, py, pw, ph, 26); c.stroke();
  // details
  c.textAlign = "left"; const tx = 410, tw = W - tx - 60;
  const label = (t, y) => { c.font = "600 20px Inter, sans-serif"; c.fillStyle = "#29e0ff"; c.fillText(t, tx, y); };
  label("NAME", 430);
  c.fillStyle = "#fff"; const words = p.name.split(/\s+/); let l1 = p.name, l2 = "";
  fit(c, p.name, tw, 44, 800, "Unbounded, sans-serif");
  if (c.measureText(p.name).width > tw && words.length > 1) { l1 = words.slice(0, Math.ceil(words.length / 2)).join(" "); l2 = words.slice(Math.ceil(words.length / 2)).join(" "); fit(c, l1.length > l2.length ? l1 : l2, tw, 40, 800, "Unbounded, sans-serif"); }
  c.fillText(l1, tx, 482); if (l2) c.fillText(l2, tx, 530);
  label("UU ID", 600); c.fillStyle = "#fff"; c.font = "700 38px Inter, sans-serif"; c.fillText(p.id, tx, 645);
  label("COURSE CODE", 712); c.fillStyle = "#fff"; c.font = "700 34px Inter, sans-serif"; c.fillText(String(p.course), tx, 755);
  // QR
  const qr = qrcode(0, "M"); qr.addData(p.qr); qr.make();
  const n = qr.getModuleCount(), box = 470, qx = (W - box) / 2, qy = 820, cell = Math.floor((box - 60) / n), off = (box - cell * n) / 2;
  c.fillStyle = "#fff"; rounded(c, qx, qy, box, box, 30); c.fill();
  c.fillStyle = "#000";
  for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (qr.isDark(r, k)) c.fillRect(qx + off + k * cell, qy + off + r * cell, cell, cell);
  // footer
  c.textAlign = "center"; c.fillStyle = "#fff"; c.font = "700 26px Inter, sans-serif";
  c.fillText("Show this QR at the university gate and the fest venue gate.", W / 2, 1345);
  c.fillStyle = "rgba(255,255,255,.7)"; c.font = "500 21px Inter, sans-serif";
  c.fillText("One person, one pass · Carry your college ID card · Copies are refused at the gate", W / 2, 1385);
  return new Promise(ok => cv.toBlob(b => ok(b), "image/png"));
}

async function askServer(id, name) {
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 25000);
  try {
    const r = await fetch(PASS_SERVER, { method: "POST", body: JSON.stringify({ action: "pass.get", id, name }), signal: ctl.signal, redirect: "follow" });
    if (!r.ok) throw new Error();
    return await r.json();
  } catch { return { ok: false, error: "Could not reach the pass server. Check your internet and try again." }; }
  finally { clearTimeout(t); }
}

/* ---------- the form (used in the section and in the popup) ---------- */
function PassForm({ compact }) {
  const [id, setId] = useState(""), [name, setName] = useState(""), [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false), [err, setErr] = useState(""), [done, setDone] = useState(null);
  useEffect(() => () => done && URL.revokeObjectURL(done.url), [done]);
  const save = d => { const a = document.createElement("a"); a.href = d.url; a.download = d.file; document.body.appendChild(a); a.click(); a.remove(); };
  const submit = async e => {
    e.preventDefault(); setErr("");
    const uid = id.trim().toUpperCase().replace(/\s+/g, "");
    if (!/^UU\d{9}$/.test(uid)) return setErr("Enter your UU ID exactly as on your college ID, like UU26XXXXXXX.");
    if (name.trim().length < 3) return setErr("Enter your full name as on your college ID.");
    if (!agree) return setErr("Please confirm the pass is for you only.");
    setBusy(true);
    const r = await askServer(uid, name.trim());
    if (!r.ok) { setBusy(false); return setErr(r.error || "Something went wrong. Try again."); }
    try {
      const blob = await drawPass(r.pass);
      const d = { url: URL.createObjectURL(blob), file: `SYNERGY-2026-pass-${r.pass.id}.png`, name: r.pass.name };
      setDone(d); save(d);
    } catch { setErr("Your pass was issued but could not be drawn on this device. Please visit the SYNERGY desk."); }
    setBusy(false);
  };
  if (done) return (
    <div className="pass-done">
      <img src={done.url} alt={`SYNERGY 2026 entry pass for ${done.name}`} />
      <div>
        <h3>Your pass is ready, {done.name.split(" ")[0]}!</h3>
        <p>It has been saved to your downloads. <b>Keep it safe now:</b> each pass can be downloaded only once. On a phone, you can also press and hold the picture to save it.</p>
        <button className="btn" onClick={() => save(done)}>Save the pass again</button>
        <p className="small muted">Show the QR at a university gate, then at the fest venue gate. Do not share it: the first scan wins and a copy is refused.</p>
      </div>
    </div>
  );
  return (
    <form className={`pass-form${compact ? " compact" : ""}`} onSubmit={submit} noValidate>
      <label><span>UU ID</span>
        <input value={id} onChange={e => setId(e.target.value)} placeholder="UU26XXXXXXX" autoComplete="off" autoCapitalize="characters" spellCheck="false" inputMode="text" maxLength={14} required />
      </label>
      <label><span>Full name (as on your college ID)</span>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Rahul Kumar" autoComplete="name" maxLength={80} required />
      </label>
      <label className="check"><input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} />
        <span>This pass is for me only. I understand it can be downloaded <b>once</b>, and that a shared or copied pass is refused at the gate.</span></label>
      {err && <p className="pass-err" role="alert">{err}</p>}
      <button className="btn" disabled={busy}>{busy ? "Checking…" : "Download my pass"}</button>
      <p className="small muted">Lost it or can't download? Visit the SYNERGY desk with your college ID card.</p>
    </form>
  );
}

/* ---------- section ---------- */
export function GetPass() {
  const view = useViewer();
  return (
    <section className="section" id="pass">
      <div className="wrap grid-2">
        <div className="glass reveal">
          <p className="kicker">Entry pass · SYNERGY 2026</p>
          <h2>Get your pass</h2>
          <p className="muted">Every United University student gets one personal QR pass. Enter your UU ID and your full name to download it.</p>
          <PassForm />
        </div>
        <div className="poster-pair reveal">
          {POSTERS.map((p, i) => (
            <button key={p.src} className="poster-thumb" onClick={() => view(POSTERS, i)} aria-label={`Open: ${p.caption}`}>
              <img loading="lazy" decoding="async" src={p.src} alt={p.alt} />
              <span>{p.caption}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- popup + floating button ---------- */
export function PassPopup() {
  const [open, setOpen] = useState(false);
  useEffect(() => { const on = () => setOpen(true); addEventListener("synergy:pass", on); return () => removeEventListener("synergy:pass", on); }, []);
  const close = useCallback(() => setOpen(false), []);
  const [hide, setHide] = useState(false);   // the section's own form is on screen: no need for the button
  useEffect(() => {
    const el = document.getElementById("pass"); if (!el) return;
    const io = new IntersectionObserver(([e]) => setHide(e.isIntersecting), { threshold: 0.2 });
    io.observe(el); return () => io.disconnect();
  }, []);
  return <>
    <button className={`pass-fab${hide ? " hide" : ""}`} onClick={openPass}><span aria-hidden="true">🎟</span> Get your pass</button>
    <Modal open={open} onClose={close} className="pass-modal" label="Get your SYNERGY 2026 pass">
      <button className="lb-close" aria-label="Close" onClick={e => e.currentTarget.closest("dialog").close()}>×</button>
      <img className="pass-modal-logo" src={A("img/synergy-2026.svg")} alt="SYNERGY 2026" />
      <h2>Get your pass</h2>
      <PassForm compact />
    </Modal>
  </>;
}

/** Shows the schedule and the Sachin-Jigar poster once a day, a moment after the page is ready. */
export function PosterPopup({ ready }) {
  const view = useViewer(), shown = useRef(false);
  useEffect(() => {
    if (!ready || shown.current) return;
    const key = "synergy-posters", today = new Date().toDateString();
    try { if (localStorage.getItem(key) === today) return; } catch { /* storage blocked: show anyway */ }
    const t = setTimeout(() => {
      if (shown.current || document.querySelector("dialog[open]")) return;
      shown.current = true;
      view(POSTERS, 0);
      try { localStorage.setItem(key, today); } catch { /* ignore */ }
    }, 1800);
    return () => clearTimeout(t);
  }, [ready, view]);
  return null;
}
