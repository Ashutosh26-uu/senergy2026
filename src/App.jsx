import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { A } from "./data/site.js";
import { reduceMotion } from "./three/shared.js";
import { ToastProvider, ViewerProvider } from "./components/ui.jsx";
import { About, BackToTop, Contact, Footer, Hero, Loader, Nav, StarNight } from "./components/sections.jsx";
import Events2026 from "./components/Events2026.jsx";
import Archive from "./components/Archive.jsx";
import CampusRing from "./components/CampusRing.jsx";
import Venue from "./components/Venue.jsx";
import { GetPass, PassPopup } from "./components/GetPass.jsx";

// three.js + React Three Fiber load in their own chunk, so the page and its text show first
const Stage = lazy(() => import("./three/Stage.jsx"));

/** Fade sections in as they arrive, staggered among siblings. */
function useReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target, sibs = [...el.parentElement.children].filter(c => c.classList.contains("reveal"));
      el.style.transitionDelay = `${Math.min(sibs.indexOf(el), 6) * 70}ms`;
      el.classList.add("in");
      io.unobserve(el);
    }), { threshold: 0.15 });
    document.querySelectorAll(".reveal").forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/** 3D tilt with a moving light glare, on devices with a mouse. */
function useTilt() {
  useEffect(() => {
    if (reduceMotion || !matchMedia("(hover: hover)").matches) return;
    const offs = [...document.querySelectorAll("[data-tilt]")].map(el => {
      const max = el.classList.contains("pano") ? 4 : 10;
      const move = e => {
        const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        el.style.transitionDelay = "0ms";
        el.style.transform = `perspective(900px) rotateX(${(0.5 - y) * max}deg) rotateY(${(x - 0.5) * max}deg) translateZ(10px)`;
        el.style.setProperty("--gx", `${x * 100}%`); el.style.setProperty("--gy", `${y * 100}%`);
      };
      const leave = () => { el.style.transform = ""; };
      el.addEventListener("pointermove", move); el.addEventListener("pointerleave", leave);
      return () => { el.removeEventListener("pointermove", move); el.removeEventListener("pointerleave", leave); };
    });
    return () => offs.forEach(f => f());
  }, []);
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [noStage, setNoStage] = useState(false);
  const onReady = useCallback(() => setReady(true), []);
  const onFail = useCallback(() => { setNoStage(true); setReady(true); }, []);
  // the loader never blocks the page for long, even if the 3D stage is slow
  useEffect(() => { const t = setTimeout(() => setReady(true), 2500); return () => clearTimeout(t); }, []);
  useReveal();
  useTilt();
  return (
    <ToastProvider>
      <ViewerProvider>
        <Loader done={ready} />
        {noStage
          ? <div id="stage" className="stage-photo" aria-hidden="true"><img src={A("img/counter-2-sm.jpg")} alt="" /></div>
          : <Suspense fallback={null}><Stage onReady={onReady} onFail={onFail} /></Suspense>}
        <div className="vignette" aria-hidden="true" />
        <div className="grain" aria-hidden="true" />
        <Nav />
        <main id="top">
          <Hero fallback={noStage} />
          <About />
          <GetPass />
          <Events2026 />
          <StarNight />
          <Archive />
          <CampusRing />
          <Venue />
          <Contact />
        </main>
        <Footer />
        <BackToTop />
        <PassPopup />
      </ViewerProvider>
    </ToastProvider>
  );
}
