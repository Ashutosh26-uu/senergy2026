// Real-time concert stage, built with React Three Fiber.
// The camera flies through the arena as the page scrolls; lights, lasers and crowd move on a 126 BPM beat.
import { Component, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Center, MeshReflectorMaterial, Text3D } from "@react-three/drei";
import { EffectComposer, Bloom, ToneMapping } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { stage, lowPower, reduceMotion, isScrolling } from "./shared.js";
import { FEST } from "../data/site.js";

const COLORS = { hot: 0xff2e88, cyan: 0x29e0ff, amber: 0xffb547, violet: 0x9b5cff, white: 0xfff4e6 };
const BPM = 126;
const FONT = `${import.meta.env.BASE_URL}fonts/helvetiker_bold.typeface.json`;
const timeScale = reduceMotion ? 0.2 : 1;
// beat clock shared by every animated part (seconds of show time)
const beat = t => { const phase = (t * BPM) / 60; return { phase, kick: Math.pow(1 - (phase % 1), 3), bar: Math.floor(phase / 4) }; };

/* ------------------------------------------------------------------ frame director */
// The canvas renders on demand. This loop decides when a frame is worth drawing.
// The show never stops while the page scrolls; it only pauses behind a gallery or the photo viewer.
// Behind the reading sections (where the stage is dimmed) it draws every other frame at a lower
// resolution, and it steps quality down by itself if frames run slow.
function Director({ onFirstFrame, setBloom }) {
  const { invalidate, setDpr } = useThree();
  useEffect(() => {
    let heroDpr = Math.min(devicePixelRatio, lowPower ? 1 : 1.25);
    let readDpr = Math.min(heroDpr, lowPower ? 0.7 : 0.85);
    let dpr = heroDpr, flip = false, slow = 0, quality = 0, last = performance.now(), first = true, raf, bloomOn = !lowPower;
    setDpr(dpr);
    const loop = now => {
      raf = requestAnimationFrame(loop);
      const dt = (now - last) / 1000; last = now;
      if (first) { first = false; invalidate(); onFirstFrame(); return; }
      if (stage.paused) return;
      const fade = stage.heroFade;
      // quality: frames slower than ~45 fps (laptop) / ~33 fps (phone) for a second
      slow = dt > (lowPower ? 0.03 : 0.022) && dt < 0.5 ? slow + dt : Math.max(0, slow - dt);
      if (slow > 1 && quality < 3) {
        slow = 0; quality++;
        if (quality <= 2) { heroDpr = Math.max(0.6, heroDpr * 0.8); readDpr = Math.min(readDpr, heroDpr); }
        else stage.lite = true;
      }
      const want = fade > 0.95 ? readDpr : fade < 0.8 ? heroDpr : dpr;
      if (want !== dpr) { dpr = want; setDpr(dpr); }
      const wantBloom = !lowPower && fade < 0.95;
      if (wantBloom !== bloomOn) { bloomOn = wantBloom; setBloom(wantBloom); }
      // behind the reading sections: every other frame is plenty and leaves room for smooth scrolling
      if (fade >= 1 || (lowPower && isScrolling())) { flip = !flip; if (flip) return; }
      invalidate();
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [invalidate, setDpr, onFirstFrame, setBloom]);
  return null;
}

/* ------------------------------------------------------------------ camera */
const camPath = new THREE.CatmullRomCurve3([[0, 4.2, 27], [-10, 6.5, 16], [9, 9.5, 9], [1.5, 2.3, 9.5], [-6, 3.5, 2.5], [0, 15, 32]].map(p => new THREE.Vector3(...p)));
const lookPath = new THREE.CatmullRomCurve3([[0, 5.2, -3], [0, 5.2, -3], [-2, 4.5, -1], [0, 7.5, -5], [4, 6, -6], [0, 5, -4]].map(p => new THREE.Vector3(...p)));

const TITLE_AT = new THREE.Vector3(0, 7.1, -3.2); // centre of the 3D title

function CameraRig() {
  const { camera, size, gl } = useThree();
  const s = useRef({ p: stage.scrollP, mx: 0, my: 0 });
  const pos = useMemo(() => new THREE.Vector3(), []), look = useMemo(() => new THREE.Vector3(), []), tmp = useMemo(() => new THREE.Vector3(), []);
  useEffect(() => { // wider lens on portrait screens so the stage fits
    const aspect = size.width / size.height;
    camera.fov = aspect < 1 ? 50 + (1 - aspect) * 42 : 50;
    camera.updateProjectionMatrix();
  }, [camera, size]);
  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05), t = state.clock.elapsedTime * timeScale, v = s.current;
    v.p += (stage.scrollP - v.p) * Math.min(1, dt * 3);
    v.mx += (stage.mouseX - v.mx) * Math.min(1, dt * 2.5);
    v.my += (stage.mouseY - v.my) * Math.min(1, dt * 2.5);
    camPath.getPoint(v.p, pos);
    lookPath.getPoint(v.p, look);
    pos.x += v.mx * 1.6 + Math.sin(t * 0.3) * 0.25;
    pos.y += -v.my * 0.8 + Math.sin(t * 0.47) * 0.12;
    if (camera.aspect < 1) {
      // portrait phones: keep aiming at the title, and stay far enough back that all of "SYNERGY" fits the width
      look.copy(TITLE_AT);
      const halfW = Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * camera.aspect);
      const need = (stage.titleHalfW + 1.6) / Math.tan(halfW) + 0.6;
      tmp.subVectors(pos, TITLE_AT);
      if (tmp.length() < need) pos.copy(TITLE_AT).addScaledVector(tmp.normalize(), need);
      look.y -= 4.2 * (1 - stage.heroFade); // in the hero the title sits above the hero text
    }
    camera.position.copy(pos);
    camera.lookAt(look);
    if (!lowPower) gl.toneMappingExposure = 1.05 - stage.heroFade * 0.45; // full show in the hero, dimmer behind content
  });
  return null;
}

/* ------------------------------------------------------------------ stage set */
function useEnvMap() {
  const gl = useThree(s => s.gl);
  return useMemo(() => {
    const pm = new THREE.PMREMGenerator(gl);
    const tex = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    pm.dispose();
    return tex;
  }, [gl]);
}

function Floor() {
  return (
    <mesh rotation-x={-Math.PI / 2}>
      <planeGeometry args={[140, 140]} />
      {lowPower
        ? <meshStandardMaterial color={0x0b0a10} roughness={0.6} metalness={0.25} />
        : <MeshReflectorMaterial color={0x0b0a10} roughness={0.6} metalness={0.25} mirror={0.35} mixStrength={1.2} resolution={512} blur={[260, 80]} mixBlur={0.8} />}
    </mesh>
  );
}

const ledVertex = "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }";
const ledFragment = `
  uniform float t; uniform float beat; varying vec2 vUv;
  void main(){
    vec2 uv = vUv;
    vec2 g = fract(uv * vec2(190., 78.));
    float pix = smoothstep(0., .18, g.x) * smoothstep(0., .18, g.y) * smoothstep(1., .82, g.x) * smoothstep(1., .82, g.y);
    vec2 p = (uv - .5) * vec2(2.45, 1.);
    float r = length(p);
    float a = atan(p.y, p.x);
    float rings = .5 + .5 * sin(r * 16. - t * 3.2);
    float rays = .5 + .5 * sin(a * 8. + t * .9);
    vec3 hot = vec3(1., .18, .53), cyan = vec3(.16, .88, 1.), amber = vec3(1., .7, .28);
    vec3 c = mix(hot, cyan, smoothstep(-.6, .6, sin(t * .35 + uv.x * 2.5 + uv.y)));
    c = mix(c, amber, .25 * rays);
    c *= .25 + .75 * rings * (.6 + .4 * rays);
    c *= .55 + .7 * beat;
    c *= 1. - smoothstep(.45, 1.25, r) * .75;
    gl_FragColor = vec4(c * pix * .85, 1.);
  }`;

function StageSet({ envMap }) {
  const darkMetal = useMemo(() => new THREE.MeshStandardMaterial({ color: 0x16141d, roughness: 0.45, metalness: 0.7, envMap, envMapIntensity: 0.25 }), [envMap]);
  const cabMat = useMemo(() => new THREE.MeshStandardMaterial({ color: 0x0d0d10, roughness: 0.85, metalness: 0.2 }), []);
  const led = useRef(), edge = useRef(), glow = useRef();
  const ledUniforms = useMemo(() => ({ t: { value: 0 }, beat: { value: 0 } }), []);
  useFrame(state => {
    const t = state.clock.elapsedTime * timeScale, { kick, bar } = beat(t);
    ledUniforms.t.value = t; ledUniforms.beat.value = kick;
    glow.current.intensity = 40 + kick * 60;
    edge.current.color.setHex(bar % 2 ? COLORS.cyan : COLORS.hot);
  });
  const speakers = [];
  for (const x of [-11.5, 11.5]) {
    for (let i = 0; i < 7; i++) speakers.push(<mesh key={`c${x}${i}`} material={cabMat} position={[x, 11.2 - i * 0.45, 0.2]} rotation-x={i * 0.045}><boxGeometry args={[1.7, 0.42, 1.1]} /></mesh>);
    for (let i = 0; i < 2; i++) speakers.push(<mesh key={`s${x}${i}`} material={cabMat} position={[x + (x < 0 ? -0.2 : 0.2), 1.8 + i * 1.02, -0.2]}><boxGeometry args={[1.6, 1, 1.2]} /></mesh>);
  }
  return (
    <group>
      <hemisphereLight args={[0x2a1840, 0x000000, lowPower ? 1.1 : 0.5]} />
      <pointLight ref={glow} color={COLORS.violet} intensity={60} distance={30} decay={1.6} position={[0, 6, -5]} />
      <mesh material={darkMetal} position={[0, 0.65, -4.5]}><boxGeometry args={[28, 1.3, 11]} /></mesh>
      {[0, 1, 2].map(i => { const h = 0.43 * (i + 1); return <mesh key={i} material={darkMetal} position={[0, h / 2, 2.25 - i * 0.5]}><boxGeometry args={[6, h, 0.5]} /></mesh>; })}
      <mesh position={[0, 1.28, 1.02]}><boxGeometry args={[28, 0.08, 0.08]} /><meshBasicMaterial ref={edge} color={COLORS.hot} /></mesh>
      <mesh ref={led} position={[0, 6.6, -9.4]}><planeGeometry args={[22, 9]} /><shaderMaterial uniforms={ledUniforms} vertexShader={ledVertex} fragmentShader={ledFragment} /></mesh>
      <mesh material={darkMetal} position={[0, 6.6, -9.65]}><boxGeometry args={[22.6, 9.6, 0.4]} /></mesh>
      {speakers}
      {!lowPower && [[-6, COLORS.hot], [6, COLORS.cyan]].map(([x, c]) => <Wash key={x} x={x} color={c} />)}
    </group>
  );
}

function Wash({ x, color }) {
  const target = useMemo(() => { const o = new THREE.Object3D(); o.position.set(x * 0.3, 4, -4); return o; }, [x]);
  return <><primitive object={target} /><spotLight color={color} intensity={260} distance={50} angle={0.5} penumbra={0.8} decay={1.5} position={[x, 12, 14]} target={target} /></>;
}

/* one instanced mesh for every truss bar */
function Truss({ envMap }) {
  const mesh = useMemo(() => {
    const bars = [];
    const add = (a, b, r) => bars.push({ a, b, r });
    const truss = (start, end, s = 0.55) => {
      const dir = end.clone().sub(start), len = dir.length(), u = dir.normalize();
      const v = new THREE.Vector3(0, 1, 0).cross(u).lengthSq() < 0.01 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
      const w = u.clone().cross(v).normalize();
      v.copy(w).cross(u).normalize();
      const corners = [[1, 1], [1, -1], [-1, -1], [-1, 1]].map(([i, j]) => v.clone().multiplyScalar((i * s) / 2).add(w.clone().multiplyScalar((j * s) / 2)));
      const at = (c, t) => start.clone().addScaledVector(u, t).add(corners[c]);
      corners.forEach((_, c) => add(at(c, 0), at(c, len), 0.035));
      const n = Math.round(len / s);
      for (let k = 0; k < n; k++) {
        const t0 = (k / n) * len, t1 = ((k + 1) / n) * len;
        for (let c = 0; c < 4; c++) { const c2 = (c + 1) % 4; k % 2 ? add(at(c, t0), at(c2, t1), 0.018) : add(at(c2, t0), at(c, t1), 0.018); }
      }
    };
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    truss(V(-14, 12.2, -1.2), V(14, 12.2, -1.2));
    truss(V(-14, 13.2, -8), V(14, 13.2, -8));
    for (const x of [-14, 14]) { truss(V(x, 0, -1.2), V(x, 12.2, -1.2)); truss(V(x, 0, -8), V(x, 13.2, -8)); truss(V(x, 12.2, -1.2), V(x, 13.2, -8)); }
    const m = new THREE.InstancedMesh(new THREE.CylinderGeometry(1, 1, 1, 6), new THREE.MeshStandardMaterial({ color: 0xb8bcc8, metalness: 1, roughness: 0.32, envMap, envMapIntensity: 0.55 }), bars.length);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
    bars.forEach(({ a, b, r }, i) => {
      const d = b.clone().sub(a);
      q.setFromUnitVectors(up, d.clone().normalize());
      m4.compose(a.clone().add(b).multiplyScalar(0.5), q, sc.set(r, d.length(), r));
      m.setMatrixAt(i, m4);
    });
    return m;
  }, [envMap]);
  return <primitive object={mesh} />;
}

/* ------------------------------------------------------------------ moving heads */
const beamGeo = (() => { const g = new THREE.CylinderGeometry(0.05, 1, 1, 48, 1, true); g.translate(0, -0.5, 0); g.rotateX(-Math.PI / 2); return g; })();
const beamVertex = `varying vec2 vUv; varying vec3 vN; varying vec3 vV;
  void main(){ vUv = uv; vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position, 1.); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`;
const beamFragment = `uniform vec3 color; uniform float intensity; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
  void main(){ float edge = pow(abs(dot(vN, vV)), 1.8); float along = pow(vUv.y, 2.4); gl_FragColor = vec4(color * edge * along * intensity * .5, 1.); }`;
const PALETTE = [COLORS.hot, COLORS.cyan, COLORS.amber, COLORS.white, COLORS.violet, COLORS.cyan, COLORS.hot, COLORS.amber];

function MovingHeads() {
  const heads = useMemo(() => PALETTE.map((color, i) => {
    const x = -10.5 + (21 / (PALETTE.length - 1)) * i;
    const mat = new THREE.ShaderMaterial({ uniforms: { color: { value: new THREE.Color(color) }, intensity: { value: 1 } }, vertexShader: beamVertex, fragmentShader: beamFragment, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
    const target = new THREE.Object3D();
    return { i, x, color, mat, target, phase: i * 0.9, spot: i % 2 === 0 && !lowPower };
  }), []);
  const rigs = useRef([]), beams = useRef([]), spots = useRef([]);
  useFrame(state => {
    const t = state.clock.elapsedTime * timeScale, { kick, bar } = beat(t), pattern = bar % 4;
    heads.forEach((h, i) => {
      const s = t * 0.55 + h.phase, tp = h.target.position;
      if (pattern === 3) tp.set(h.x * 0.15, 0, 12 + Math.sin(s) * 3);                       // converge into one point
      else if (pattern === 2) tp.set(h.x * 1.6 + Math.sin(s) * 3, 0, 8 + Math.cos(s * 0.8) * 10); // fan out
      else tp.set(h.x + Math.sin(s) * 7, 0, 9 + Math.cos(s * 0.73) * 9);                     // free sweep
      const rig = rigs.current[i];
      rig.lookAt(tp);
      const dist = rig.position.distanceTo(tp);
      beams.current[i].scale.set(dist * 0.15, dist * 0.15, dist);
      h.mat.uniforms.intensity.value = 0.75 + kick * 0.6;
      if (spots.current[i]) spots.current[i].intensity = 600 + kick * 700;
    });
  });
  return heads.map((h, i) => (
    <group key={i}>
      <group ref={el => (rigs.current[i] = el)} position={[h.x, 11.5, -1.2]}>
        <mesh position-z={-0.2}><boxGeometry args={[0.5, 0.5, 0.7]} /><meshStandardMaterial color={0x0d0d10} roughness={0.85} metalness={0.2} /></mesh>
        <mesh position-z={0.16}><circleGeometry args={[0.2, 24]} /><meshBasicMaterial color={h.color} /></mesh>
        <mesh ref={el => (beams.current[i] = el)} geometry={beamGeo} material={h.mat} />
      </group>
      {h.spot && <>
        <primitive object={h.target} />
        <spotLight ref={el => (spots.current[i] = el)} color={h.color} intensity={900} distance={60} angle={0.2} penumbra={0.55} decay={1.6} position={[h.x, 10.9, -0.6]} target={h.target} />
      </>}
    </group>
  ));
}

/* ------------------------------------------------------------------ lasers */
const laserGeo = (() => { const g = new THREE.CylinderGeometry(0.012, 0.012, 1, 6, 1, true); g.translate(0, 0.5, 0); g.rotateX(Math.PI / 2); return g; })();
function Lasers() {
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: 0x2bff88, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }), []);
  const srcs = useRef([]);
  useFrame(state => {
    const t = state.clock.elapsedTime * timeScale, { kick } = beat(t), on = Math.sin(t * 0.22) > 0.55;
    srcs.current.forEach((src, si) => {
      src.visible = on;
      if (!on) return;
      src.children.forEach((l, k0) => { const k = k0 - 3; l.rotation.set(-0.08 - Math.abs(Math.sin(t * 0.8 + k)) * 0.25, k * 0.11 + Math.sin(t * 0.9 + si) * 0.5, 0); });
    });
    mat.opacity = 0.25 + kick * 0.35;
  });
  return [-5, 5].map((ox, si) => (
    <group key={ox} ref={el => (srcs.current[si] = el)} position={[ox, 1.6, -7.5]}>
      {Array.from({ length: 7 }, (_, k) => <mesh key={k} geometry={laserGeo} material={mat} scale-z={70} />)}
    </group>
  ));
}

/* ------------------------------------------------------------------ crowd, phone torches, haze, confetti */
const sprite = (() => {
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas"); c.width = c.height = 64;
  const g = c.getContext("2d"), grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, "rgba(255,255,255,1)"); grd.addColorStop(0.35, "rgba(255,255,255,.35)"); grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
})();

function Crowd() {
  const { standers, cheerers, personGeo, cheerGeo, phones } = useMemo(() => {
    const body = new THREE.CapsuleGeometry(0.21, 0.72, 4, 10); body.translate(0, 0.6, 0);
    const head = new THREE.SphereGeometry(0.13, 12, 10); head.translate(0, 1.42, 0);
    const armL = new THREE.CapsuleGeometry(0.05, 0.55, 3, 6); armL.rotateZ(0.35); armL.translate(-0.3, 1.55, 0);
    const armR = armL.clone(); armR.scale(-1, 1, 1);
    const people = [], cols = lowPower ? 18 : 40, rows = lowPower ? 10 : 22;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x = -17 + (34 / cols) * c + (Math.random() - 0.5) * 0.6, z = 3.2 + r * 1.05 + (Math.random() - 0.5) * 0.5;
      if (Math.abs(x) < 1.1 && z > 12) continue; // front-of-house aisle
      people.push({ x, z, s: 0.88 + Math.random() * 0.24, ry: (Math.random() - 0.5) * 0.6, ph: Math.random() * Math.PI * 2, cheer: Math.random() < 0.28, e: 0.5 + Math.random() * 0.8 });
    }
    const cheerers = people.filter(p => p.cheer);
    return { standers: people.filter(p => !p.cheer), cheerers, personGeo: mergeGeometries([body, head]), cheerGeo: mergeGeometries([body.clone(), head.clone(), armL, armR]), phones: cheerers.filter(() => Math.random() < 0.55) };
  }, []);
  const a = useRef(), b = useRef(), pts = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const phonePos = useMemo(() => new Float32Array(phones.length * 3), [phones]);
  useFrame(state => {
    const t = state.clock.elapsedTime * timeScale, { phase } = beat(t);
    const bounce = (list, mesh) => {
      list.forEach((p, i) => {
        dummy.position.set(p.x, Math.max(0, Math.sin(phase * Math.PI + p.ph)) * 0.16 * p.e, p.z);
        dummy.rotation.set(0, p.ry + Math.sin(t + p.ph) * 0.1, Math.sin(t * 2 + p.ph) * 0.04);
        dummy.scale.setScalar(p.s);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    };
    bounce(standers, a.current); bounce(cheerers, b.current);
    phones.forEach((p, i) => {
      const jump = Math.max(0, Math.sin(phase * Math.PI + p.ph)) * 0.16 * p.e;
      phonePos[i * 3] = p.x + Math.sin(t + p.ph) * 0.08; phonePos[i * 3 + 1] = (1.95 + jump) * p.s; phonePos[i * 3 + 2] = p.z;
    });
    pts.current.geometry.attributes.position.needsUpdate = true;
  });
  return <>
    <instancedMesh ref={a} args={[personGeo, undefined, standers.length]}><meshStandardMaterial color={0x0d0c12} roughness={0.75} metalness={0.15} /></instancedMesh>
    <instancedMesh ref={b} args={[cheerGeo, undefined, cheerers.length]}><meshStandardMaterial color={0x0d0c12} roughness={0.75} metalness={0.15} /></instancedMesh>
    <points ref={pts}>
      <bufferGeometry><bufferAttribute attach="attributes-position" array={phonePos} count={phones.length} itemSize={3} /></bufferGeometry>
      <pointsMaterial size={0.35} map={sprite} color={0xfff6e0} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  </>;
}

function Haze() {
  const pos = useMemo(() => {
    const n = lowPower ? 140 : 1400, a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { a[i * 3] = (Math.random() - 0.5) * 44; a[i * 3 + 1] = Math.random() * 15; a[i * 3 + 2] = -9 + Math.random() * 40; }
    return a;
  }, []);
  const ref = useRef();
  useFrame(state => {
    const t = state.clock.elapsedTime * timeScale;
    ref.current.visible = !stage.lite;
    ref.current.rotation.y = Math.sin(t * 0.05) * 0.04;
    ref.current.position.x = Math.sin(t * 0.1) * 0.8;
  });
  return <points ref={ref}>
    <bufferGeometry><bufferAttribute attach="attributes-position" array={pos} count={pos.length / 3} itemSize={3} /></bufferGeometry>
    <pointsMaterial size={lowPower ? 2.2 : 3.2} map={sprite} color={0x6b5a8a} transparent opacity={lowPower ? 0.07 : 0.05} depthWrite={false} blending={THREE.AdditiveBlending} />
  </points>;
}

function Confetti() {
  const count = reduceMotion ? 0 : lowPower ? 80 : 420;
  const ref = useRef();
  const bits = useMemo(() => Array.from({ length: count }, () => ({ x: (Math.random() - 0.5) * 30, y: Math.random() * 16, z: Math.random() * 24, v: 0.6 + Math.random() * 0.9, r: Math.random() * 6, sp: 1 + Math.random() * 3 })), [count]);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useEffect(() => {
    const colors = [COLORS.hot, COLORS.cyan, COLORS.amber, 0xffffff, COLORS.violet].map(c => new THREE.Color(c));
    for (let i = 0; i < count; i++) ref.current.setColorAt(i, colors[i % colors.length]);
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
  }, [count]);
  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05), t = state.clock.elapsedTime * timeScale, m = ref.current;
    m.visible = !stage.lite;
    bits.forEach((b, i) => {
      b.y -= b.v * dt;
      if (b.y < 0) { b.y = 16; b.x = (Math.random() - 0.5) * 30; b.z = Math.random() * 24; }
      dummy.position.set(b.x + Math.sin(t * 0.8 + b.r) * 0.6, b.y, b.z);
      dummy.rotation.set(t * b.sp + b.r, t * b.sp * 0.7, b.r);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });
  if (!count) return null;
  return <instancedMesh ref={ref} args={[undefined, undefined, count]}>
    <planeGeometry args={[0.09, 0.15]} />
    <meshStandardMaterial side={THREE.DoubleSide} roughness={0.4} metalness={0.6} emissive={0x222222} />
  </instancedMesh>;
}

/* ------------------------------------------------------------------ 3D title */
function Title({ envMap, onLoaded }) {
  const group = useRef(), yearMat = useRef(), s = useRef({ mx: 0, my: 0 });
  useEffect(() => { // runs once the font has loaded (Suspense): measure the title so phones can keep it in frame
    const box = new THREE.Box3().setFromObject(group.current);
    if (isFinite(box.max.x)) stage.titleHalfW = (box.max.x - box.min.x) / 2;
    onLoaded();
  }, [onLoaded]);
  useFrame((state, delta) => {
    const t = state.clock.elapsedTime * timeScale, { kick } = beat(t), v = s.current, k = Math.min(1, Math.min(delta, 0.05) * 2.5);
    v.mx += (stage.mouseX - v.mx) * k; v.my += (stage.mouseY - v.my) * k;
    group.current.rotation.y = Math.sin(t * 0.4) * 0.12 + v.mx * 0.15;
    group.current.rotation.x = v.my * 0.08;
    group.current.position.y = 7.1 + Math.sin(t * 0.8) * 0.12;
    if (yearMat.current) yearMat.current.emissiveIntensity = 1.2 + kick * 1.4;
  });
  const text = { font: FONT, curveSegments: 10, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.035, bevelSegments: 5 };
  return (
    <group ref={group} position={[0, 7.1, -3.2]}>
      <Center>
        <Text3D {...text} size={2.15} height={0.55} depth={0.55}>
          {FEST.name}
          {lowPower
            ? <meshStandardMaterial color={0xffffff} metalness={1} roughness={0.2} envMap={envMap} envMapIntensity={1.1} />
            : <meshPhysicalMaterial color={0xffffff} metalness={1} roughness={0.2} envMap={envMap} envMapIntensity={0.9} clearcoat={1} clearcoatRoughness={0.08} />}
        </Text3D>
      </Center>
      <Center position={[0, -2.15, 0]}>
        <Text3D {...text} size={1.05} height={0.3} depth={0.3}>
          {FEST.year}
          <meshStandardMaterial ref={yearMat} color={COLORS.hot} emissive={COLORS.hot} emissiveIntensity={1.6} roughness={0.3} metalness={0.4} />
        </Text3D>
      </Center>
    </group>
  );
}

/* ------------------------------------------------------------------ assembly */
function Scene({ onTitle }) {
  const envMap = useEnvMap();
  return <>
    <color attach="background" args={[0x05040a]} />
    <fogExp2 attach="fog" args={[0x07060d, 0.02]} />
    <CameraRig />
    <Floor />
    <StageSet envMap={envMap} />
    <Truss envMap={envMap} />
    <MovingHeads />
    <Lasers />
    <Crowd />
    <Haze />
    <Confetti />
    <Suspense fallback={null}><Title envMap={envMap} onLoaded={onTitle} /></Suspense>
  </>;
}

class CatchStage extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFail(); }
  render() { return this.state.failed ? null : this.props.children; }
}

const hasWebGL = () => { try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch { return false; } };

export default function Stage({ onReady, onFail }) {
  const [bloom, setBloom] = useState(!lowPower);
  const [ok] = useState(hasWebGL);
  const wrap = useRef();
  useEffect(() => { if (!ok) onFail(); }, [ok, onFail]);
  // phones dim the stage behind the content by fading the canvas: costs nothing while scrolling
  useEffect(() => {
    if (!lowPower) return;
    let queued = false;
    const dim = () => {
      if (queued) return; queued = true;
      requestAnimationFrame(() => { queued = false; if (wrap.current) wrap.current.style.opacity = (1 - stage.heroFade * 0.5).toFixed(3); });
    };
    addEventListener("scroll", dim, { passive: true }); dim();
    return () => removeEventListener("scroll", dim);
  }, []);
  const ready = useRef({ frame: false, title: false, done: false });
  const check = () => { const r = ready.current; if (!r.done && r.frame && r.title) { r.done = true; setTimeout(onReady, 400); } };
  const onFirstFrame = useMemo(() => () => { ready.current.frame = true; check(); }, []); // eslint-disable-line
  const onTitle = useMemo(() => () => { ready.current.title = true; check(); }, []); // eslint-disable-line
  if (!ok) return null;
  return (
    <div id="stage" ref={wrap} aria-hidden="true">
      <CatchStage onFail={onFail}>
        <Canvas frameloop="demand" dpr={1} resize={{ debounce: 120 }}
          gl={{ antialias: !lowPower, powerPreference: "high-performance" }}
          camera={{ fov: 50, near: 0.1, far: 200, position: [0, 4.2, 27] }}
          onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.05; }}>
          <Director onFirstFrame={onFirstFrame} setBloom={setBloom} />
          <Scene onTitle={onTitle} />
          {!lowPower && (
            <EffectComposer enabled={bloom} multisampling={0}>
              <Bloom intensity={0.9} luminanceThreshold={0.72} luminanceSmoothing={0.2} mipmapBlur radius={0.6} />
              <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
            </EffectComposer>
          )}
        </Canvas>
      </CatchStage>
    </div>
  );
}
