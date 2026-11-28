// Shared by the gate app and the admin panel: server calls, pass signature check, pack decryption, camera QR reading.
import * as ed from "./vendor/ed25519.js";

// Public half of the pass-signing key (the private half never leaves the pass maker).
const PUBLIC_KEY = "ISE-T-7xTQlwDAqwzXOCVyyqUJmIPe4hsT7vs1W09CU";
export const enc = new TextEncoder();
export const b64u = s => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4)), c => c.charCodeAt(0));
const pubKey = b64u(PUBLIC_KEY);

/** Call the gate server. Throws on network failure; returns the server's JSON otherwise. */
export async function api(url, body, timeoutMs = 20000) {
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { method: "POST", body: JSON.stringify(body), signal: ctl.signal, redirect: "follow" });
    if (!r.ok) throw new Error(`Server error ${r.status}`);
    return await r.json();
  } finally { clearTimeout(t); }
}

/** Checks a pass QR offline: format and Ed25519 signature. Returns {id, ver} or {bad}. */
export async function verifyPass(text) {
  const m = /^SYN26\.(UU(?:\d{9}|-?PG\d{6,7}))\.(\d{1,3})\.([A-Za-z0-9_-]{80,90})$/.exec(String(text).trim());
  if (!m) return { bad: "Not a SYNERGY 2026 pass." };
  const [, id, ver, sig] = m;
  let ok = false;
  try { ok = await ed.verifyAsync(b64u(sig), enc.encode(`SYNERGY2026|${id}|${ver}`), pubKey); } catch {}
  return ok ? { id, ver: Number(ver), text: m[0] } : { bad: "Fake or edited pass: signature does not match." };
}

/** Gate setup code, made by the admin: server URL + gate code. */
export const packSetup = (url, code, name) => "SYN26GATE:" + btoa(unescape(encodeURIComponent(JSON.stringify({ u: url, c: code, n: name })))).replace(/=+$/, "");
export function readSetup(text) {
  const m = /^SYN26GATE:([A-Za-z0-9+/]+)$/.exec(String(text).trim());
  if (!m) return null;
  try { const o = JSON.parse(decodeURIComponent(escape(atob(m[1])))); return o.u && o.c ? o : null; } catch { return null; }
}

/** Decrypts the gate pack (AES-256-GCM, key from PBKDF2). */
export async function decryptPack(bytes, pass) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (new TextDecoder().decode(b.slice(0, 8)) !== "SYNPACK1") throw new Error("Not a SYNERGY gate pack.");
  const base = await crypto.subtle.importKey("raw", enc.encode(pass), "PBKDF2", false, ["deriveKey"]);
  const key = await crypto.subtle.deriveKey({ name: "PBKDF2", hash: "SHA-256", salt: b.slice(8, 24), iterations: 250000 }, base, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b.slice(24, 36), additionalData: enc.encode("SYNPACK1") }, key, b.slice(36));
  return JSON.parse(new TextDecoder().decode(plain));
}

/** Small key-value store in IndexedDB (the roster with photos is too big for localStorage). */
export async function openStore(name) {
  const db = await new Promise((res, rej) => { const r = indexedDB.open(name, 1); r.onupgradeneeded = () => r.result.createObjectStore("kv"); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  return {
    get: k => new Promise(r => { const q = db.transaction("kv").objectStore("kv").get(k); q.onsuccess = () => r(q.result); q.onerror = () => r(undefined); }),
    set: (k, v) => new Promise((r, j) => { const t = db.transaction("kv", "readwrite"); t.objectStore("kv").put(v, k); t.oncomplete = r; t.onerror = () => j(t.error); }),
    clear: () => new Promise(r => { const t = db.transaction("kv", "readwrite"); t.objectStore("kv").clear(); t.oncomplete = r; t.onerror = r; }),
  };
}

/** Back camera → QR text. BarcodeDetector where available (Android Chrome), jsQR otherwise (iPhone). */
export class QRCamera {
  constructor(video, onText) { this.video = video; this.onText = onText; this.paused = false; this.raf = 0; this.last = ""; this.lastAt = 0; this.busy = false;
    this.canvas = document.createElement("canvas"); this.ctx = this.canvas.getContext("2d", { willReadFrequently: true });
    this.detector = "BarcodeDetector" in window ? new BarcodeDetector({ formats: ["qr_code"] }) : null; }
  async start() {
    this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 1280 } }, audio: false });
    this.video.srcObject = this.stream; await this.video.play(); this.loop();
  }
  stop() { cancelAnimationFrame(this.raf); this.stream?.getTracks().forEach(t => t.stop()); this.stream = null; }
  async loop() {
    this.raf = requestAnimationFrame(() => this.loop());
    const v = this.video; if (this.paused || this.busy || v.readyState < 2) return;
    this.busy = true;
    try {
      let text = null;
      if (this.detector) { const c = await this.detector.detect(v); text = c[0]?.rawValue || null; }
      else {
        const s = Math.min(v.videoWidth, v.videoHeight), side = Math.min(720, s);
        this.canvas.width = this.canvas.height = side;
        this.ctx.drawImage(v, (v.videoWidth - s) / 2, (v.videoHeight - s) / 2, s, s, 0, 0, side, side);
        text = window.jsQR(this.ctx.getImageData(0, 0, side, side).data, side, side, { inversionAttempts: "dontInvert" })?.data || null;
      }
      if (text && !(text === this.last && Date.now() - this.lastAt < 3000)) { this.last = text; this.lastAt = Date.now(); await this.onText(text); }
    } catch {}
    this.busy = false;
  }
}

export const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
