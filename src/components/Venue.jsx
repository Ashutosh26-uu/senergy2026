// Venue with the Google map: it is a whole app, so it loads only as the section nears the screen (or on tap).
import { useRef, useState } from "react";
import { A, MAP } from "../data/site.js";
import { useNearScreen } from "./ui.jsx";

export default function Venue() {
  const [load, setLoad] = useState(false);
  const [ready, setReady] = useState(false);
  const box = useRef();
  useNearScreen(box, () => setLoad(true));
  return (
    <section className="section" id="venue">
      <div className="wrap">
        <figure className="pano reveal" data-tilt>
          <img src={A("img/counter-2-sm.jpg")} srcSet={`${A("img/counter-2-sm.jpg")} 1000w, ${A("img/counter-2.jpg")} 2400w`} sizes="(max-width: 700px) 100vw, 1180px" decoding="async" alt="United University campus buildings" loading="lazy" />
        </figure>
        <div className="grid-2 venue-grid">
          <div className="glass reveal">
            <p className="kicker">Venue</p>
            <h2>United University Campus</h2>
            <p className="addr">Rawatpur, Jhalwa,<br />Prayagraj, Uttar Pradesh 211012</p>
            <p className="muted">Corporate office: United Tower, Ground Floor, 53, Leader Road, Prayagraj 211003</p>
            <ul className="getting-there">
              <li><b>9 km</b><span>from Prayagraj Airport</span></li>
              <li><b>12 km</b><span>from Prayagraj Junction</span></li>
            </ul>
            <div className="map-actions">
              <a className="btn" href={MAP.directions} target="_blank" rel="noopener">Get directions</a>
              <a className="btn btn-ghost" href={MAP.open} target="_blank" rel="noopener">Open in Google Maps</a>
            </div>
          </div>
          <div className="map reveal" ref={box}>
            {!ready && (
              <button className={`map-load${load ? " loading" : ""}`} onClick={() => setLoad(true)}>
                <span className="map-pin" aria-hidden="true" />
                <strong>{load ? "Loading map…" : "Show map"}</strong>
                <small>United University, Rawatpur, Jhalwa, Prayagraj</small>
              </button>
            )}
            {load && <iframe className={ready ? "ready" : undefined} src={MAP.embed} title="Map: United University, Rawatpur, Jhalwa, Prayagraj"
              referrerPolicy="no-referrer-when-downgrade" allowFullScreen onLoad={() => setReady(true)} />}
          </div>
        </div>
      </div>
    </section>
  );
}
