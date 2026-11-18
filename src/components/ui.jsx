// Shared UI: modal dialogs, the photo/flyer viewer, and toast messages.
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { stage } from "../three/shared.js";

/* ---------- open dialogs pause the 3D stage behind them ---------- */
let openCount = 0;
const holdStage = on => { openCount = Math.max(0, openCount + (on ? 1 : -1)); stage.paused = openCount > 0; };

/** Native <dialog> driven by `open`; Esc and the close button call onClose. */
export function Modal({ open, onClose, className, label, children, onOpened }) {
  const ref = useRef();
  useEffect(() => {
    const d = ref.current;
    if (open && !d.open) { d.showModal(); holdStage(true); onOpened?.(d); }
    else if (!open && d.open) d.close();
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const d = ref.current;
    const onClosed = () => { holdStage(false); onClose(); };
    d.addEventListener("close", onClosed);
    return () => d.removeEventListener("close", onClosed);
  }, [onClose]);
  return <dialog ref={ref} className={className} aria-label={label} onClick={e => { if (e.target === ref.current && className?.includes("lightbox")) ref.current.close(); }}>{open && children}</dialog>;
}

/* ---------- toast ---------- */
const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);
export function ToastProvider({ children }) {
  const [msg, setMsg] = useState(null);
  const [show, setShow] = useState(false);
  const timer = useRef();
  const toast = useCallback(m => {
    setMsg(m); requestAnimationFrame(() => setShow(true));
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { setShow(false); setTimeout(() => setMsg(null), 300); }, 2600);
  }, []);
  return <ToastCtx.Provider value={toast}>
    {children}
    <div className={`toast${show ? " show" : ""}`} role="status" aria-live="polite" hidden={!msg}>{msg}</div>
  </ToastCtx.Provider>;
}

/* ---------- viewer: steps through the list it was opened with ---------- */
const ViewerCtx = createContext(() => {});
export const useViewer = () => useContext(ViewerCtx);

export function ViewerProvider({ children }) {
  const [state, setState] = useState(null); // { items: [{src, alt, caption}], index }
  const open = useCallback((items, index = 0) => setState({ items, index }), []);
  const close = useCallback(() => setState(null), []);
  return <ViewerCtx.Provider value={open}>
    {children}
    <Modal open={!!state} onClose={close} className={`lightbox${state && state.items.length < 2 ? " single" : ""}`} label="Full-size image">
      {state && <ViewerBody state={state} setState={setState} />}
    </Modal>
  </ViewerCtx.Provider>;
}

function ViewerBody({ state, setState }) {
  const { items, index } = state;
  const item = items[index];
  const go = useCallback(step => setState(s => ({ ...s, index: (s.index + step + s.items.length) % s.items.length })), [setState]);
  useEffect(() => { // warm the next one so stepping feels instant
    const next = items[(index + 1) % items.length];
    if (next && items.length > 1) new Image().src = next.src;
  }, [items, index]);
  const swipe = useRef(null);
  const close = e => e.currentTarget.closest("dialog").close();
  return <>
    <button className="lb-close" aria-label="Close" onClick={close}>×</button>
    <button className="lb-nav lb-prev" aria-label="Previous" onClick={() => go(-1)}>‹</button>
    <figure className="lb-fig"
      onKeyDown={e => { if (e.key === "ArrowRight") go(1); else if (e.key === "ArrowLeft") go(-1); }}
      onPointerDown={e => { if (e.pointerType !== "mouse") swipe.current = [e.clientX, e.clientY]; }}
      onPointerUp={e => {
        if (!swipe.current) return;
        const dx = e.clientX - swipe.current[0], dy = e.clientY - swipe.current[1];
        swipe.current = null;
        if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) && items.length > 1) go(dx < 0 ? 1 : -1);
      }}>
      <img key={item.src} src={item.src} alt={item.alt || ""} decoding="async" />
      <figcaption><span className="lb-cap">{item.caption}</span><span className="lb-count">{items.length > 1 ? `${index + 1} / ${items.length}` : ""}</span></figcaption>
    </figure>
    <button className="lb-nav lb-next" aria-label="Next" onClick={() => go(1)}>›</button>
    <ArrowKeys go={go} enabled={items.length > 1} />
  </>;
}

function ArrowKeys({ go, enabled }) {
  useEffect(() => {
    if (!enabled) return;
    const onKey = e => {
      if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [go, enabled]);
  return null;
}

/* ---------- helpers ---------- */
/** Calls fn once when the element comes within `margin` of the screen. */
export function useNearScreen(ref, fn, margin = "400px 0px") {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { fn(); io.disconnect(); } }, { rootMargin: margin });
    io.observe(el);
    return () => io.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
