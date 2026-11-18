// State the page and the 3D stage share without React re-renders (read every frame).
export const lowPower =
  typeof window !== "undefined" &&
  (matchMedia("(max-width: 768px), (pointer: coarse)").matches || (navigator.hardwareConcurrency || 8) <= 4);
export const reduceMotion = typeof window !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

export const stage = {
  scrollP: 0,          // 0..1 through the page
  heroFade: 0,         // 0 in the hero, 1 once a full screen below it
  lastScroll: 0,       // performance.now() of the last scroll event
  mouseX: 0, mouseY: 0, // -0.5..0.5
  paused: false,       // a gallery or the viewer covers the stage
  lite: false,         // auto quality dropped the haze and confetti
};

if (typeof window !== "undefined") {
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    stage.scrollP = max > 0 ? scrollY / max : 0;
    stage.heroFade = Math.min(1, scrollY / innerHeight);
    stage.lastScroll = performance.now();
  };
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll, { passive: true });
  addEventListener("pointermove", e => { stage.mouseX = e.clientX / innerWidth - 0.5; stage.mouseY = e.clientY / innerHeight - 0.5; }, { passive: true });
  onScroll();
}

export const isScrolling = () => performance.now() - stage.lastScroll < 180;
