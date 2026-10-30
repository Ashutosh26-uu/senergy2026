// Fest settings. Times are IST.
window.FEST = {
  name: "SYNERGY",
  year: "2026",
  start: "2026-12-05T00:00:00+05:30",   // fest day 1
  starNight: "2026-12-06T00:00:00+05:30", // Sachin-Jigar live
  end: "2026-12-07T00:00:00+05:30",
  dateLabel: "5–6 December 2026",
};

// The loader never blocks the page for long, even if the 3D scene is slow or fails to load.
(() => {
  const hide = () => document.getElementById("loader").classList.add("done");
  setTimeout(hide, 2500);
  addEventListener("load", () => setTimeout(hide, 600));
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
      [new Date(starNight).getTime(), "Star Night: Sachin-Jigar LIVE in"],
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

  // ---- SYNERGY 2025: day tabs ----
  const tabs = document.querySelectorAll('.tabs [role="tab"]');
  const events = document.querySelectorAll(".ev");
  tabs.forEach(tab => tab.addEventListener("click", () => {
    tabs.forEach(t => t.setAttribute("aria-selected", t === tab));
    const day = tab.dataset.day;
    events.forEach(ev => { ev.hidden = day !== "all" && ev.dataset.day !== day; });
  }));

  // ---- flyer lightbox ----
  const lightbox = document.getElementById("lightbox");
  const lbImg = lightbox.querySelector("img");
  document.querySelectorAll(".ev-flyer").forEach(btn => btn.addEventListener("click", () => {
    lbImg.src = btn.dataset.flyer;
    lbImg.alt = btn.querySelector("img").alt;
    lightbox.showModal();
  }));
  lightbox.querySelector(".lb-close").addEventListener("click", () => lightbox.close());
  lightbox.addEventListener("click", e => { if (e.target === lightbox) lightbox.close(); });

  // ---- mobile menu ----
  const nav = document.querySelector(".nav");
  const menu = nav.querySelector(".menu");
  menu.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    menu.setAttribute("aria-expanded", open);
  });
  nav.querySelectorAll(".links a").forEach(a => a.addEventListener("click", () => {
    nav.classList.remove("open");
    menu.setAttribute("aria-expanded", false);
  }));

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
