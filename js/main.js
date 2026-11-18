// Fest settings. Times are IST.
window.FEST = {
  name: "SYNERGY",
  year: "2026",
  start: "2026-12-05T00:00:00+05:30",   // fest day 1
  starNight: "2026-12-06T00:00:00+05:30", // Sachin-Jigar live
  end: "2026-12-07T00:00:00+05:30",
  dateLabel: "5–6 December 2026",
};

// Last scroll time, shared with the 3D scene and the ring so they can sit still while a finger scrolls.
window.__lastScroll = 0;
addEventListener("scroll", () => { window.__lastScroll = performance.now(); }, { passive: true });
const isScrolling = () => performance.now() - window.__lastScroll < 180;

// The loader never blocks the page for long, even if the 3D scene is slow or fails to load.
(() => {
  const loader = document.getElementById("loader");
  let hidden = false;
  const hide = () => {
    if (hidden) return;
    hidden = true;
    loader.classList.add("done");
    setTimeout(() => loader.remove(), 1000); // stop its animations for good once it has faded
  };
  window.__hideLoader = hide;
  setTimeout(hide, 2500);
  addEventListener("load", () => {
    // three.js comes from a CDN; if it never loaded, show the photo background and the text title
    if (!window.__sceneLoaded) document.body.classList.add("no-webgl");
    setTimeout(hide, 600);
  });
})();

(() => {
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- date + countdown: to day 1, then to Star Night, then "live" ----
  const { start, starNight, end, dateLabel } = window.FEST;
  document.getElementById("fest-date").textContent = dateLabel;
  if (start) {
    const box = document.getElementById("countdown");
    const label = document.getElementById("countdown-label");
    const out = Object.fromEntries([...box.querySelectorAll("b")].map(b => [b.dataset.k, b]));
    const stages = [
      [new Date(start).getTime(), "SYNERGY 2026 begins in"],
      [new Date(starNight).getTime(), "Day 2 + Star Night begins in"], // counts to the start of 6 Dec, not the show time
    ];
    const endAt = new Date(end).getTime();
    let timer;
    const tick = () => {
      const now = Date.now();
      const next = stages.find(([t]) => t > now);
      if (!next) {
        label.textContent = now < endAt ? "SYNERGY 2026 is live now" : "Thank you for an unforgettable SYNERGY 2026";
        box.hidden = true;
        clearInterval(timer);
        return;
      }
      label.textContent = next[1];
      const ms = next[0] - now;
      const parts = { d: ms / 864e5, h: (ms / 36e5) % 24, m: (ms / 6e4) % 60, s: (ms / 1e3) % 60 };
      for (const k in parts) out[k].textContent = String(Math.floor(parts[k])).padStart(2, "0");
    };
    box.hidden = false;
    label.hidden = false;
    tick();
    timer = setInterval(tick, 1000);
  }

  // ---- day filters: each .tabs group filters the event grid named in data-target ----
  document.querySelectorAll(".tabs[data-target]").forEach(group => {
    const tabs = group.querySelectorAll("button");
    const events = document.querySelectorAll(`#${group.dataset.target} .ev`);
    tabs.forEach(tab => tab.addEventListener("click", () => {
      tabs.forEach(t => t.setAttribute("aria-pressed", t === tab));
      const day = tab.dataset.day;
      events.forEach(ev => { ev.hidden = day !== "all" && ev.dataset.day !== day; });
    }));
  });

  // ---- past years: each year card opens that year's full gallery ----
  const openYear = year => {
    const dlg = document.getElementById(`year-${year}`);
    if (!dlg || dlg.open) return;
    dlg.showModal();
    dlg.scrollTop = 0;
  };
  document.querySelectorAll(".year-card").forEach(card => card.addEventListener("click", () => openYear(card.dataset.year)));
  document.querySelectorAll(".year-gallery").forEach(dlg => {
    dlg.querySelector(".yg-close").addEventListener("click", () => dlg.close());
  });
  // old links (#synergy2025, #synergy2024) still land on the right photos
  const fromHash = () => {
    const m = location.hash.match(/^#synergy(2024|2025)$/);
    if (m) { document.getElementById("archive")?.scrollIntoView(); openYear(m[1]); }
  };
  addEventListener("hashchange", fromHash);
  fromHash();

  // ---- photo / flyer viewer: steps through the gallery it was opened from ----
  // A container with data-gallery="<selector>" defines which items step together;
  // items inside a hidden card (filtered out) are skipped.
  const lightbox = document.getElementById("lightbox");
  const lbImg = lightbox.querySelector("img");
  const lbCap = lightbox.querySelector(".lb-cap");
  const lbCount = lightbox.querySelector(".lb-count");
  let lbItems = [], lbIndex = 0;
  const captionOf = btn =>
    btn.querySelector(".shot span")?.innerText.replace(/\s+/g, " ").trim() ||
    btn.closest(".ev")?.querySelector("h3")?.textContent ||
    btn.querySelector("img")?.alt || btn.getAttribute("aria-label") || "";
  const showAt = i => {
    lbIndex = (i + lbItems.length) % lbItems.length;
    const btn = lbItems[lbIndex];
    lbImg.src = btn.dataset.flyer;
    lbImg.alt = btn.querySelector("img")?.alt || btn.getAttribute("aria-label") || "";
    lbCap.textContent = captionOf(btn);
    lbCount.textContent = lbItems.length > 1 ? `${lbIndex + 1} / ${lbItems.length}` : "";
    lightbox.classList.toggle("single", lbItems.length < 2);
    const next = lbItems[(lbIndex + 1) % lbItems.length]; // warm the next one so stepping feels instant
    if (next) new Image().src = next.dataset.flyer;
  };
  document.querySelectorAll("[data-flyer]").forEach(btn => btn.addEventListener("click", () => {
    const box = btn.closest("[data-gallery]");
    lbItems = box && btn.matches(box.dataset.gallery)
      ? [...box.querySelectorAll(box.dataset.gallery)].filter(b => !b.closest("[hidden]"))
      : [btn];
    showAt(Math.max(0, lbItems.indexOf(btn)));
    if (!lightbox.open) lightbox.showModal();
  }));
  lightbox.querySelector(".lb-prev").addEventListener("click", () => showAt(lbIndex - 1));
  lightbox.querySelector(".lb-next").addEventListener("click", () => showAt(lbIndex + 1));
  lightbox.querySelector(".lb-close").addEventListener("click", () => lightbox.close());
  lightbox.addEventListener("click", e => { if (e.target === lightbox) lightbox.close(); });
  lightbox.addEventListener("keydown", e => {
    if (e.key === "ArrowRight") { e.preventDefault(); showAt(lbIndex + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); showAt(lbIndex - 1); }
  });
  let swipeX = null, swipeY = 0;
  lightbox.addEventListener("pointerdown", e => { if (e.pointerType !== "mouse") { swipeX = e.clientX; swipeY = e.clientY; } });
  lightbox.addEventListener("pointerup", e => {
    if (swipeX === null) return;
    const dx = e.clientX - swipeX, dy = e.clientY - swipeY;
    swipeX = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) && lbItems.length > 1) showAt(lbIndex + (dx < 0 ? 1 : -1));
  });
  lightbox.addEventListener("close", () => lbImg.removeAttribute("src")); // next open never flashes the last image

  // ---- small status message (copied link, etc.) ----
  const toastEl = document.getElementById("toast");
  let toastTimer;
  const toast = msg => {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    requestAnimationFrame(() => toastEl.classList.add("show"));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastEl.classList.remove("show"); setTimeout(() => { toastEl.hidden = true; }, 300); }, 2600);
  };

  // ---- SYNERGY 2026 events: filters, search, My picks, deadlines, schedule, calendar, share ----
  (() => {
    const grid = document.getElementById("ev-grid-2026");
    if (!grid) return;
    const cards = [...grid.querySelectorAll(".ev26")];
    const tabs = [...document.querySelectorAll("#ev-tabs-2026 button")];
    const search = document.getElementById("ev-search");
    const empty = document.getElementById("ev-empty");
    const schedule = document.getElementById("schedule-2026");
    const picksCount = document.getElementById("picks-count");
    const viewBtns = [...document.querySelectorAll(".view-toggle button")];
    const IST = "+05:30";
    const at = s => new Date(s.length > 10 ? `${s}:00${IST}` : `${s}T23:59:59${IST}`).getTime();
    const ev = cards.map(card => ({
      card,
      slug: card.id.replace(/^ev-/, ""),
      day: card.dataset.day,
      title: card.dataset.title,
      venue: card.dataset.venue,
      time: card.dataset.time,
      reg: card.dataset.reg ? at(card.dataset.reg) : null,
      sessions: JSON.parse(card.dataset.sessions || "[]").map(([s, e, label]) => ({ start: at(s), end: at(e), label })),
      text: `${card.dataset.title} ${card.dataset.tag} ${card.dataset.venue} ${card.querySelector(".ev-body p")?.textContent || ""}`.toLowerCase(),
    }));

    // saved picks live only in this browser
    const KEY = "synergy26-picks";
    let picks = new Set();
    try { picks = new Set(JSON.parse(localStorage.getItem(KEY) || "[]")); } catch {}
    const savePicks = () => { try { localStorage.setItem(KEY, JSON.stringify([...picks])); } catch {} };

    let day = "all", query = "", view = "cards";
    const apply = () => {
      let shown = 0;
      ev.forEach(e => {
        const okDay = day === "all" || (day === "picks" ? picks.has(e.slug) : e.day === day);
        const okText = !query || query.split(/\s+/).every(w => e.text.includes(w));
        e.card.hidden = !(okDay && okText);
        if (!e.card.hidden) shown++;
      });
      empty.hidden = shown > 0;
      if (!shown) empty.textContent = day === "picks" && !query
        ? "Tap ♡ on any event to save it here. Your picks stay on this device."
        : `No events match “${search.value.trim()}”. Try another word, or pick “All”.`;
      grid.hidden = view !== "cards";
      schedule.hidden = view !== "schedule";
      if (view === "schedule") renderSchedule();
    };

    tabs.forEach(tab => tab.addEventListener("click", () => {
      tabs.forEach(t => t.setAttribute("aria-pressed", t === tab));
      day = tab.dataset.day;
      apply();
    }));
    search.addEventListener("input", () => { query = search.value.trim().toLowerCase(); apply(); });
    viewBtns.forEach(btn => btn.addEventListener("click", () => {
      viewBtns.forEach(b => b.setAttribute("aria-pressed", b === btn));
      view = btn.dataset.view;
      apply();
    }));

    // ♡ My picks
    const syncPicks = () => {
      ev.forEach(e => {
        const on = picks.has(e.slug);
        const b = e.card.querySelector(".ev-fav");
        b.setAttribute("aria-pressed", on);
        b.textContent = on ? "♥" : "♡";
      });
      picksCount.textContent = picks.size ? `${picks.size} saved` : "None saved yet";
    };
    ev.forEach(e => e.card.querySelector(".ev-fav").addEventListener("click", () => {
      picks.has(e.slug) ? picks.delete(e.slug) : picks.add(e.slug);
      savePicks(); syncPicks(); apply();
      toast(picks.has(e.slug) ? `Saved ${e.title} to My picks` : `Removed ${e.title} from My picks`);
    }));

    // live status: registration deadline before the fest, live / done during it
    const DAY = 864e5;
    const fmtLeft = ms => {
      const d = Math.floor(ms / DAY), h = Math.floor(ms / 36e5);
      return d >= 2 ? `${d} days` : h >= 1 ? `${h} hour${h > 1 ? "s" : ""}` : "under an hour";
    };
    const statusOf = (e, now) => {
      const s = e.sessions;
      if (s.some(x => now >= x.start && now < x.end)) return ["live", "Live now"];
      if (s.length && now >= s[s.length - 1].end) return ["done", "Done"];
      if (e.reg) {
        if (now > e.reg) return ["closed", "Registration closed"];
        const left = e.reg - now;
        return [left < 2 * DAY ? "urgent" : "open", left < DAY && new Date(now).toDateString() === new Date(e.reg).toDateString()
          ? "Registration closes today" : `Registration closes in ${fmtLeft(left)}`];
      }
      return null;
    };
    const tick = () => {
      const now = Date.now();
      let soonest = null;
      ev.forEach(e => {
        const st = statusOf(e, now), badge = e.card.querySelector(".ev-status");
        badge.hidden = !st;
        if (st) { badge.className = `ev-status is-${st[0]}`; badge.textContent = st[1]; }
        if (e.reg && e.reg > now && (!soonest || e.reg < soonest.reg)) soonest = e;
      });
      const sum = document.getElementById("reg-summary");
      if (sum && soonest) {
        const same = ev.filter(e => e.reg === soonest.reg).length;
        sum.textContent = `Next registration deadline: ${new Date(soonest.reg).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" })} (${same} event${same > 1 ? "s" : ""}, closes in ${fmtLeft(soonest.reg - now)}). Tap a flyer and scan its QR code to register.`;
      } else if (sum) sum.textContent = "Registrations for SYNERGY 2026 have closed. See you on 5–6 December!";
      if (view === "schedule") renderSchedule();
    };

    // schedule: every session on a time line, grouped by day
    const fmtTime = t => new Date(t).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" }).replace(":00", "").toUpperCase();
    const dayKey = t => new Date(t).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    const dayName = t => new Date(t).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
    function renderSchedule() {
      const now = Date.now(), rows = [];
      ev.filter(e => !e.card.hidden).forEach(e => e.sessions.forEach(s => rows.push({ e, ...s })));
      if (day === "all" || day === "6") rows.push({ star: true, start: at("2026-12-06T19:00"), end: at("2026-12-06T23:00") });
      rows.sort((a, b) => a.start - b.start);
      const nextUp = rows.find(r => r.start > now);
      const groups = new Map();
      rows.forEach(r => { const k = r.e?.day === "online" ? "online" : dayKey(r.start); (groups.get(k) || groups.set(k, []).get(k)).push(r); });
      const tbas = ev.filter(e => !e.card.hidden && !e.sessions.length);
      const esc = s => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
      let out = "";
      groups.forEach((list, k) => {
        out += `<h3 class="sch-day">${k === "online" ? `Online · ${dayName(list[0].end)}` : dayName(list[0].start)}</h3><ol class="sch-list">`;
        list.forEach(r => {
          const state = now >= r.start && now < r.end ? "live" : now >= r.end ? "done" : r === nextUp ? "next" : "";
          const pill = { live: "Live now", done: "Done", next: "Up next" }[state] || "";
          const time = r.star ? "Evening" : r.e.day === "online" ? `By ${fmtTime(r.end)}` : fmtTime(r.start);
          const title = r.star ? "Star Night: Sachin-Jigar LIVE" : r.e.title + (r.label ? ` · ${r.label}` : "");
          const where = r.star ? "Main ground" : r.e.venue;
          const target = r.star ? "starnight" : r.e.card.id;
          out += `<li class="${state ? "is-" + state : ""}${r.star ? " is-star" : ""}"><button type="button" data-goto="${target}">
            <span class="sch-time">${time}</span><span class="sch-what"><b>${esc(title)}</b><small>${esc(where)}</small></span>${pill ? `<span class="sch-pill">${pill}</span>` : ""}</button></li>`;
        });
        out += "</ol>";
      });
      if (tbas.length) out += `<h3 class="sch-day">Date to be announced</h3><ol class="sch-list">${tbas.map(e => `<li><button type="button" data-goto="${e.card.id}"><span class="sch-time">${esc(e.time)}</span><span class="sch-what"><b>${esc(e.title)}</b><small>${esc(e.venue)}</small></span></button></li>`).join("")}</ol>`;
      schedule.innerHTML = out || `<p class="ev-empty">Nothing to show for this filter.</p>`;
    }
    // tapping a schedule row jumps to that event's card (or Star Night)
    schedule.addEventListener("click", e => {
      const id = e.target.closest("[data-goto]")?.dataset.goto;
      if (!id) return;
      if (id !== "starnight") viewBtns.find(b => b.dataset.view === "cards").click();
      flash(document.getElementById(id));
    });
    const flash = el => {
      if (!el) return;
      el.hidden = false;
      el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
      el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash");
    };

    // 📅 add to calendar (.ics works with Google, Apple and Outlook calendars)
    const icsDate = t => new Date(t).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const icsText = s => s.replace(/[\\,;]/g, m => "\\" + m);
    ev.forEach(e => e.card.querySelector(".ev-cal")?.addEventListener("click", () => {
      const url = `${location.origin}${location.pathname}#${e.card.id}`;
      const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//SYNERGY 2026//United University//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
      e.sessions.forEach((s, i) => lines.push("BEGIN:VEVENT",
        `UID:${e.slug}-${i}@synergy2026`, `DTSTAMP:${icsDate(Date.now())}`, `DTSTART:${icsDate(s.start)}`, `DTEND:${icsDate(s.end)}`,
        `SUMMARY:${icsText(`${e.title}${s.label ? " – " + s.label : ""} · SYNERGY 2026`)}`,
        `LOCATION:${icsText(`${e.venue}, United University, Rawatpur, Jhalwa, Prayagraj`)}`,
        `DESCRIPTION:${icsText(`SYNERGY 2026 at United University. Details and registration: ${url}`)}`,
        "BEGIN:VALARM", "TRIGGER:-PT1H", "ACTION:DISPLAY", `DESCRIPTION:${icsText(e.title)} starts in 1 hour`, "END:VALARM",
        "END:VEVENT"));
      lines.push("END:VCALENDAR");
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/calendar" }));
      a.download = `synergy-2026-${e.slug}.ics`;
      document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      toast(`Calendar file for ${e.title} downloaded`);
    }));

    // ↗ share: the phone's share sheet, or copy the link
    ev.forEach(e => e.card.querySelector(".ev-share").addEventListener("click", async () => {
      const url = `${location.origin}${location.pathname}#${e.card.id}`;
      const data = { title: `${e.title} · SYNERGY 2026`, text: `${e.title} at SYNERGY 2026, United University (${e.time}, ${e.venue})`, url };
      try {
        if (navigator.share) { await navigator.share(data); return; }
        await navigator.clipboard.writeText(url);
        toast("Link copied");
      } catch (err) {
        if (err?.name !== "AbortError") toast(url);
      }
    }));

    // a shared link (#ev-slug) lands on that event
    const fromEventHash = () => {
      const card = location.hash.startsWith("#ev-") && document.getElementById(location.hash.slice(1));
      if (card && grid.contains(card)) {
        tabs[0].click(); search.value = ""; query = "";
        viewBtns[0].click();
        setTimeout(() => flash(card), 400);
      }
    };
    addEventListener("hashchange", fromEventHash);

    syncPicks(); apply(); tick();
    setInterval(tick, 60000);
    fromEventHash();
  })();

  // ---- mobile menu ----
  const nav = document.querySelector(".nav");
  const menu = nav.querySelector(".menu");
  menu.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    menu.setAttribute("aria-expanded", open);
  });
  const closeMenu = () => {
    nav.classList.remove("open");
    menu.setAttribute("aria-expanded", false);
  };
  nav.querySelectorAll(".links a").forEach(a => a.addEventListener("click", closeMenu));
  addEventListener("keydown", e => {
    if (e.key === "Escape" && nav.classList.contains("open")) { closeMenu(); menu.focus(); }
  });

  // ---- reveal on scroll + number counters ----
  const countUp = el => {
    const end = +el.dataset.count;
    if (reduceMotion) { el.textContent = end; return; }
    const t0 = performance.now();
    const step = now => {
      const p = Math.min(1, (now - t0) / 1600);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const siblings = [...el.parentElement.children].filter(c => c.classList.contains("reveal"));
      el.style.transitionDelay = `${Math.min(siblings.indexOf(el), 6) * 70}ms`;
      el.classList.add("in");
      el.querySelectorAll("[data-count]").forEach(countUp);
      io.unobserve(el);
    });
  }, { threshold: 0.15 });
  document.querySelectorAll(".reveal").forEach(el => io.observe(el));

  // ---- 3D tilt with a moving light glare ----
  if (!reduceMotion && matchMedia("(hover: hover)").matches) {
    document.querySelectorAll("[data-tilt]").forEach(el => {
      const max = el.classList.contains("pano") ? 4 : 10;
      el.addEventListener("pointermove", e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        el.style.transitionDelay = "0ms";
        el.style.transform = `perspective(900px) rotateX(${(0.5 - y) * max}deg) rotateY(${(x - 0.5) * max}deg) translateZ(10px)`;
        el.style.setProperty("--gx", `${x * 100}%`);
        el.style.setProperty("--gy", `${y * 100}%`);
      });
      el.addEventListener("pointerleave", () => { el.style.transform = ""; });
    });
  }

  // ---- Google Map: a whole app, so it loads only as the venue nears the screen (or on tap) ----
  const mapBtn = document.querySelector(".map-load");
  if (mapBtn) {
    let loaded = false;
    const loadMap = () => {
      if (loaded) return;
      loaded = true;
      const frame = document.createElement("iframe");
      frame.title = "Map: United University, Rawatpur, Jhalwa, Prayagraj";
      frame.referrerPolicy = "no-referrer-when-downgrade";
      frame.allowFullscreen = true;
      frame.src = mapBtn.dataset.src;
      frame.addEventListener("load", () => frame.classList.add("ready"), { once: true });
      mapBtn.classList.add("loading");
      mapBtn.querySelector("strong").textContent = "Loading map…";
      mapBtn.parentElement.append(frame);
      frame.addEventListener("load", () => mapBtn.remove(), { once: true });
    };
    mapBtn.addEventListener("click", loadMap, { once: true });
    const mio = new IntersectionObserver(([e]) => { if (e.isIntersecting) { loadMap(); mio.disconnect(); } }, { rootMargin: "400px 0px" });
    mio.observe(mapBtn);
  }

  // ---- pause the 3D stage while a gallery or the viewer covers it ----
  const syncPause = () => { window.__scenePaused = !!document.querySelector("dialog.year-gallery[open], dialog.lightbox[open]"); };
  const dlgWatch = new MutationObserver(syncPause);
  document.querySelectorAll("dialog").forEach(d => dlgWatch.observe(d, { attributes: true, attributeFilter: ["open"] }));

  // ---- nav: highlight the section on screen ----
  const navLinks = [...document.querySelectorAll(".links a[href^='#']")];
  const byId = new Map(navLinks.map(a => [a.getAttribute("href").slice(1), a]));
  const spy = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      navLinks.forEach(a => a.classList.toggle("active", a === byId.get(e.target.id)));
    });
  }, { rootMargin: "-45% 0px -50% 0px" }); // the section crossing the middle of the screen
  byId.forEach((_, id) => { const s = document.getElementById(id); if (s) spy.observe(s); });
  const hero = document.getElementById("hero");
  if (hero) new IntersectionObserver(([e]) => { if (e.isIntersecting) navLinks.forEach(a => a.classList.remove("active")); }, { rootMargin: "-45% 0px -50% 0px" }).observe(hero);

  // ---- back to top, with a ring that fills as you scroll ----
  const topBtn = document.createElement("button");
  topBtn.className = "to-top";
  topBtn.setAttribute("aria-label", "Back to top");
  topBtn.innerHTML = '<svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="19" fill="none" stroke="rgba(255,255,255,.15)" stroke-width="2"/><circle class="ring-p" cx="22" cy="22" r="19" fill="none" stroke="url(#tg)" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="119.4" stroke-dashoffset="119.4" transform="rotate(-90 22 22)"/><defs><linearGradient id="tg"><stop offset="0" stop-color="#ff2e88"/><stop offset="1" stop-color="#29e0ff"/></linearGradient></defs><path d="M22 28V16m-6 6 6-6 6 6" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  document.body.append(topBtn);
  const ringP = topBtn.querySelector(".ring-p");
  topBtn.addEventListener("click", () => scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }));
  let topQueued = false;
  addEventListener("scroll", () => {
    if (topQueued) return;
    topQueued = true;
    requestAnimationFrame(() => { // at most once a frame
      topQueued = false;
      const max = document.documentElement.scrollHeight - innerHeight;
      topBtn.classList.toggle("show", scrollY > innerHeight * 1.2);
      ringP.style.strokeDashoffset = (119.4 * (1 - (max > 0 ? scrollY / max : 0))).toFixed(1);
    });
  }, { passive: true });

  // ---- year galleries: chips to jump between days ----
  document.querySelectorAll(".year-gallery").forEach(dlg => {
    const days = [...dlg.querySelectorAll(".yg-day")];
    if (days.length < 2) return;
    const bar = document.createElement("nav");
    bar.className = "yg-jump";
    bar.setAttribute("aria-label", "Jump to");
    days.forEach((h, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = h.textContent.split(" · tap")[0].replace("Star Night · Ankit Tiwari LIVE", "Star Night").replace(" & Star Night", " + Star Night");
      b.addEventListener("click", () => h.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" }));
      bar.append(b);
    });
    dlg.querySelector(".yg-head").after(bar);
    const chips = [...bar.children];
    const mark = () => {
      const top = dlg.scrollTop + 160;
      let cur = 0;
      days.forEach((h, i) => { if (h.offsetTop <= top) cur = i; });
      if (dlg.scrollTop + dlg.clientHeight >= dlg.scrollHeight - 4) cur = days.length - 1; // at the bottom, the last day is the one on screen
      chips.forEach((c, i) => c.classList.toggle("on", i === cur));
    };
    dlg.addEventListener("scroll", () => requestAnimationFrame(mark), { passive: true });
    dlg.addEventListener("toggle", mark);
    mark();
  });

  // ---- YouTube: load the player only when clicked ----
  document.querySelectorAll(".yt").forEach(btn => btn.addEventListener("click", () => {
    const frame = document.createElement("iframe");
    frame.src = `https://www.youtube-nocookie.com/embed/${btn.dataset.id}?autoplay=1&rel=0`;
    frame.title = btn.getAttribute("aria-label");
    frame.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    frame.allowFullscreen = true;
    btn.replaceChildren(frame);
  }, { once: true }));

  // ---- 3D ring gallery ----
  // Rendered angle eases toward a target angle; drag sets the target, release keeps the
  // flick's momentum, then it settles back into a slow idle spin. All rates are per second
  // so it moves the same at 60, 120 or 144 Hz.
  const ring = document.getElementById("ring");
  const items = [...ring.children];
  const stage = ring.parentElement;
  const IDLE = reduceMotion ? 0 : 7;   // deg/s
  const HOVER_IDLE = reduceMotion ? 0 : 2.5;
  let radius = 0, angle = 0, target = 0, velocity = IDLE;
  let dragging = false, hovering = false, visible = false, lastX = 0, raf = 0, prev = 0;
  let samples = [];

  const layout = () => {
    radius = Math.round((ring.offsetWidth / 2) / Math.tan(Math.PI / items.length)) + 24;
    items.forEach((f, i) => { f.style.transform = `rotateY(${(360 / items.length) * i}deg) translateZ(${radius}px)`; });
    render();
  };
  const render = () => {
    ring.style.transform = `translateZ(${-radius}px) rotateX(-6deg) rotateY(${angle.toFixed(3)}deg)`;
  };

  const frame = now => {
    const dt = Math.min((now - prev) / 1000, 0.05);
    prev = now;
    if (!dragging && isScrolling()) { // hold still while the page scrolls
      raf = visible ? requestAnimationFrame(frame) : 0;
      return;
    }
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

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) run();
  }).observe(stage);

  stage.addEventListener("pointerdown", e => {
    dragging = true;
    lastX = e.clientX;
    samples = [[performance.now(), target]];
    stage.setPointerCapture(e.pointerId);
    stage.classList.add("dragging");
  });
  stage.addEventListener("pointermove", e => {
    if (!dragging) return;
    target += (e.clientX - lastX) * 0.28;
    lastX = e.clientX;
    const now = performance.now();
    samples.push([now, target]);
    while (samples.length > 2 && now - samples[0][0] > 100) samples.shift();
  });
  const release = () => {
    if (!dragging) return;
    dragging = false;
    stage.classList.remove("dragging");
    const [t0, a0] = samples[0], [t1, a1] = samples[samples.length - 1];
    const fling = t1 > t0 ? ((a1 - a0) / (t1 - t0)) * 1000 : 0;
    velocity = Math.max(-720, Math.min(720, fling));
  };
  stage.addEventListener("pointerup", release);
  stage.addEventListener("pointercancel", release);
  stage.addEventListener("pointerenter", () => { hovering = true; });
  stage.addEventListener("pointerleave", () => { hovering = false; });
  stage.addEventListener("keydown", e => {
    const step = 360 / items.length;
    if (e.key === "ArrowLeft") { target -= step; velocity = 0; }
    else if (e.key === "ArrowRight") { target += step; velocity = 0; }
  });

  layout();
  addEventListener("resize", layout);
})();
