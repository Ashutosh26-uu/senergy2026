// Real-time concert stage for the SYNERGY site.
// The camera flies through the arena as the page scrolls; lights, lasers and crowd move on a 126 BPM beat.
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { Reflector } from "three/addons/objects/Reflector.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const FONT_URL = "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/fonts/helvetiker_bold.typeface.json";
const COLORS = { hot: 0xff2e88, cyan: 0x29e0ff, amber: 0xffb547, violet: 0x9b5cff, white: 0xfff4e6 };
const BPM = 126;

const loader = document.getElementById("loader");
const hideLoader = () => loader.classList.add("done");

const canvas = document.getElementById("stage");
const lowPower = matchMedia("(max-width: 768px)").matches || (navigator.hardwareConcurrency || 8) <= 4;
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: !lowPower, powerPreference: "high-performance" });
} catch (err) {
  document.body.classList.add("no-webgl");
  hideLoader();
}

if (renderer) init();

function init() {
  const heroRatio = Math.min(devicePixelRatio, lowPower ? 1.25 : 1.75);
  const readingRatio = Math.min(heroRatio, lowPower ? 0.75 : 1); // dimmed background behind content: fewer pixels, smoother scrolling
  renderer.setPixelRatio(heroRatio);
  renderer.setSize(innerWidth, innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05040a);
  scene.fog = new THREE.FogExp2(0x07060d, 0.02);

  const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 200);
  const envTex = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;

  // ---------- lighting ----------
  scene.add(new THREE.HemisphereLight(0x2a1840, 0x000000, 0.5));
  const screenGlow = new THREE.PointLight(COLORS.violet, 60, 30, 1.6);
  screenGlow.position.set(0, 6, -5);
  scene.add(screenGlow);

  // ---------- floor ----------
  if (!lowPower) {
    const mirror = new Reflector(new THREE.PlaneGeometry(140, 140), {
      textureWidth: innerWidth * 0.5, textureHeight: innerHeight * 0.5, color: 0x8a8a8a, clipBias: 0.003,
    });
    mirror.rotation.x = -Math.PI / 2;
    scene.add(mirror);
  }
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(140, 140),
    new THREE.MeshStandardMaterial({ color: 0x0b0a10, roughness: 0.6, metalness: 0.25, transparent: !lowPower, opacity: 0.8 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.01;
  scene.add(floor);

  // ---------- stage ----------
  const darkMetal = new THREE.MeshStandardMaterial({ color: 0x16141d, roughness: 0.45, metalness: 0.7, envMap: envTex, envMapIntensity: 0.25 });
  const deck = new THREE.Mesh(new THREE.BoxGeometry(28, 1.3, 11), darkMetal);
  deck.position.set(0, 0.65, -4.5);
  scene.add(deck);
  for (let i = 0; i < 3; i++) { // stair steps at the front
    const h = 0.43 * (i + 1);
    const step = new THREE.Mesh(new THREE.BoxGeometry(6, h, 0.5), darkMetal);
    step.position.set(0, h / 2, 2.25 - i * 0.5);
    scene.add(step);
  }
  const edgeLed = new THREE.Mesh(new THREE.BoxGeometry(28, 0.08, 0.08), new THREE.MeshBasicMaterial({ color: COLORS.hot }));
  edgeLed.position.set(0, 1.28, 1.02);
  scene.add(edgeLed);

  // LED wall with an animated pixel shader
  const ledMat = new THREE.ShaderMaterial({
    uniforms: { t: { value: 0 }, beat: { value: 0 } },
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }",
    fragmentShader: `
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
      }`,
  });
  const led = new THREE.Mesh(new THREE.PlaneGeometry(22, 9), ledMat);
  led.position.set(0, 6.6, -9.4);
  scene.add(led);
  const ledFrame = new THREE.Mesh(new THREE.BoxGeometry(22.6, 9.6, 0.4), darkMetal);
  ledFrame.position.set(0, 6.6, -9.65);
  scene.add(ledFrame);

  // ---------- truss (one instanced mesh for every bar) ----------
  const bars = [];
  const addBar = (a, b, r) => bars.push({ a, b, r });
  const truss = (start, end, s = 0.55) => {
    const dir = end.clone().sub(start);
    const len = dir.length();
    const u = dir.normalize();
    const v = new THREE.Vector3(0, 1, 0).cross(u).lengthSq() < 0.01 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
    const w = u.clone().cross(v).normalize();
    v.copy(w).cross(u).normalize();
    const corners = [[1, 1], [1, -1], [-1, -1], [-1, 1]].map(([i, j]) => v.clone().multiplyScalar(i * s / 2).add(w.clone().multiplyScalar(j * s / 2)));
    const at = (c, t) => start.clone().addScaledVector(u, t).add(corners[c]);
    corners.forEach((_, c) => addBar(at(c, 0), at(c, len), 0.035));
    const n = Math.round(len / s);
    for (let k = 0; k < n; k++) {
      const t0 = (k / n) * len, t1 = ((k + 1) / n) * len;
      for (let c = 0; c < 4; c++) {
        const c2 = (c + 1) % 4;
        k % 2 ? addBar(at(c, t0), at(c2, t1), 0.018) : addBar(at(c2, t0), at(c, t1), 0.018);
      }
    }
  };
  truss(new THREE.Vector3(-14, 12.2, -1.2), new THREE.Vector3(14, 12.2, -1.2));
  truss(new THREE.Vector3(-14, 13.2, -8), new THREE.Vector3(14, 13.2, -8));
  for (const x of [-14, 14]) {
    truss(new THREE.Vector3(x, 0, -1.2), new THREE.Vector3(x, 12.2, -1.2));
    truss(new THREE.Vector3(x, 0, -8), new THREE.Vector3(x, 13.2, -8));
    truss(new THREE.Vector3(x, 12.2, -1.2), new THREE.Vector3(x, 13.2, -8));
  }
  const barGeo = new THREE.CylinderGeometry(1, 1, 1, 6);
  const barMat = new THREE.MeshStandardMaterial({ color: 0xb8bcc8, metalness: 1, roughness: 0.32, envMap: envTex, envMapIntensity: 0.55 });
  const barMesh = new THREE.InstancedMesh(barGeo, barMat, bars.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  bars.forEach(({ a, b, r }, i) => {
    const d = b.clone().sub(a);
    q.setFromUnitVectors(up, d.clone().normalize());
    m4.compose(a.clone().add(b).multiplyScalar(0.5), q, sc.set(r, d.length(), r));
    barMesh.setMatrixAt(i, m4);
  });
  scene.add(barMesh);

  // line-array speakers hanging off the truss + ground subs
  const cabMat = new THREE.MeshStandardMaterial({ color: 0x0d0d10, roughness: 0.85, metalness: 0.2 });
  for (const x of [-11.5, 11.5]) {
    for (let i = 0; i < 7; i++) {
      const cab = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.42, 1.1), cabMat);
      cab.position.set(x, 11.2 - i * 0.45, 0.2);
      cab.rotation.x = i * 0.045;
      scene.add(cab);
    }
    for (let i = 0; i < 2; i++) {
      const sub = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1, 1.2), cabMat);
      sub.position.set(x + (x < 0 ? -0.2 : 0.2), 1.8 + i * 1.02, -0.2);
      scene.add(sub);
    }
  }

  // ---------- moving-head lights with volumetric beams ----------
  const beamGeo = new THREE.CylinderGeometry(0.05, 1, 1, 48, 1, true);
  beamGeo.translate(0, -0.5, 0);
  beamGeo.rotateX(-Math.PI / 2); // beam now shoots along +z from the origin
  const beamMaterial = color => new THREE.ShaderMaterial({
    uniforms: { color: { value: new THREE.Color(color) }, intensity: { value: 1 } },
    vertexShader: `
      varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      void main(){
        vUv = uv;
        vN = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.);
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 color; uniform float intensity; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      void main(){
        float edge = pow(abs(dot(vN, vV)), 1.8);
        float along = pow(vUv.y, 2.4);
        gl_FragColor = vec4(color * edge * along * intensity * .5, 1.);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });

  const palette = [COLORS.hot, COLORS.cyan, COLORS.amber, COLORS.white, COLORS.violet, COLORS.cyan, COLORS.hot, COLORS.amber];
  const heads = [];
  const headCount = 8;
  for (let i = 0; i < headCount; i++) {
    const x = -10.5 + (21 / (headCount - 1)) * i;
    const color = palette[i % palette.length];
    const rig = new THREE.Group();
    rig.position.set(x, 11.5, -1.2);
    const yoke = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.7), cabMat);
    yoke.position.z = -0.2;
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.2, 24), new THREE.MeshBasicMaterial({ color }));
    lens.position.z = 0.16;
    const beam = new THREE.Mesh(beamGeo, beamMaterial(color));
    rig.add(yoke, lens, beam);
    scene.add(rig);
    let spot = null;
    if (i % 2 === 0) {
      spot = new THREE.SpotLight(color, 900, 60, 0.2, 0.55, 1.6);
      spot.position.copy(rig.position).add(new THREE.Vector3(0, -0.6, 0.6));
      scene.add(spot, spot.target);
    }
    heads.push({ rig, beam, lens, spot, x, phase: i * 0.9, target: new THREE.Vector3() });
  }

  // front wash so the stage deck and title catch light
  for (const [x, c] of [[-6, COLORS.hot], [6, COLORS.cyan]]) {
    const wash = new THREE.SpotLight(c, 260, 50, 0.5, 0.8, 1.5);
    wash.position.set(x, 12, 14);
    wash.target.position.set(x * 0.3, 4, -4);
    scene.add(wash, wash.target);
  }

  // ---------- lasers ----------
  const laserGeo = new THREE.CylinderGeometry(0.012, 0.012, 1, 6, 1, true);
  laserGeo.translate(0, 0.5, 0);
  laserGeo.rotateX(Math.PI / 2);
  const laserMat = new THREE.MeshBasicMaterial({ color: 0x2bff88, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
  const lasers = [];
  for (const ox of [-5, 5]) {
    const src = new THREE.Group();
    src.position.set(ox, 1.6, -7.5);
    for (let k = 0; k < 7; k++) {
      const l = new THREE.Mesh(laserGeo, laserMat);
      l.scale.z = 70;
      l.userData.k = k;
      src.add(l);
    }
    scene.add(src);
    lasers.push(src);
  }

  // ---------- crowd ----------
  const body = new THREE.CapsuleGeometry(0.21, 0.72, 4, 10); body.translate(0, 0.6, 0);
  const head = new THREE.SphereGeometry(0.13, 12, 10); head.translate(0, 1.42, 0);
  const armL = new THREE.CapsuleGeometry(0.05, 0.55, 3, 6); armL.rotateZ(0.35); armL.translate(-0.3, 1.55, 0);
  const armR = armL.clone(); armR.scale(-1, 1, 1);
  const personGeo = mergeGeometries([body, head]);
  const cheerGeo = mergeGeometries([body.clone(), head.clone(), armL, armR]);
  const crowdMat = new THREE.MeshStandardMaterial({ color: 0x0d0c12, roughness: 0.75, metalness: 0.15 });
  const people = [];
  const cols = lowPower ? 26 : 40, rows = lowPower ? 14 : 22;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = -17 + (34 / cols) * c + (Math.random() - 0.5) * 0.6;
      const z = 3.2 + r * 1.05 + (Math.random() - 0.5) * 0.5;
      if (Math.abs(x) < 1.1 && z > 12) continue; // front-of-house aisle
      people.push({ x, z, s: 0.88 + Math.random() * 0.24, ry: (Math.random() - 0.5) * 0.6, ph: Math.random() * Math.PI * 2, cheer: Math.random() < 0.28, e: 0.5 + Math.random() * 0.8 });
    }
  }
  const standers = people.filter(p => !p.cheer), cheerers = people.filter(p => p.cheer);
  const crowdA = new THREE.InstancedMesh(personGeo, crowdMat, standers.length);
  const crowdB = new THREE.InstancedMesh(cheerGeo, crowdMat, cheerers.length);
  crowdA.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  crowdB.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(crowdA, crowdB);

  // soft round sprite shared by haze, phone lights
  const sprite = (() => {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d");
    const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, "rgba(255,255,255,1)");
    grd.addColorStop(0.35, "rgba(255,255,255,.35)");
    grd.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  })();

  // phone torches above the cheering hands
  const phones = cheerers.filter(() => Math.random() < 0.55);
  const phoneGeo = new THREE.BufferGeometry();
  phoneGeo.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(phones.length * 3), 3));
  const phonePts = new THREE.Points(phoneGeo, new THREE.PointsMaterial({ size: 0.35, map: sprite, color: 0xfff6e0, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(phonePts);

  // ---------- haze ----------
  const hazeCount = lowPower ? 500 : 1400;
  const hazePos = new Float32Array(hazeCount * 3);
  for (let i = 0; i < hazeCount; i++) {
    hazePos[i * 3] = (Math.random() - 0.5) * 44;
    hazePos[i * 3 + 1] = Math.random() * 15;
    hazePos[i * 3 + 2] = -9 + Math.random() * 40;
  }
  const hazeGeo = new THREE.BufferGeometry();
  hazeGeo.setAttribute("position", new THREE.BufferAttribute(hazePos, 3));
  const haze = new THREE.Points(hazeGeo, new THREE.PointsMaterial({ size: 3.2, map: sprite, color: 0x6b5a8a, transparent: true, opacity: 0.05, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(haze);

  // ---------- confetti ----------
  const confettiCount = reduceMotion ? 0 : lowPower ? 180 : 420;
  const confetti = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(0.09, 0.15),
    new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.4, metalness: 0.6, emissive: 0x222222 }),
    Math.max(confettiCount, 1)
  );
  confetti.count = confettiCount;
  const bits = [];
  const confettiColors = [COLORS.hot, COLORS.cyan, COLORS.amber, 0xffffff, COLORS.violet].map(c => new THREE.Color(c));
  for (let i = 0; i < confettiCount; i++) {
    bits.push({ x: (Math.random() - 0.5) * 30, y: Math.random() * 16, z: Math.random() * 24, v: 0.6 + Math.random() * 0.9, r: Math.random() * 6, sp: 1 + Math.random() * 3 });
    confetti.setColorAt(i, confettiColors[i % confettiColors.length]);
  }
  confetti.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(confetti);

  // ---------- 3D title ----------
  const title = new THREE.Group();
  title.position.set(0, 7.1, -3.2);
  scene.add(title);
  new FontLoader().load(FONT_URL, font => {
    const make = (text, size, depth) => {
      const g = new TextGeometry(text, { font, size, height: depth, depth, curveSegments: 10, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.035, bevelSegments: 5 });
      g.center();
      return g;
    };
    const chrome = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 1, roughness: 0.2, envMap: envTex, envMapIntensity: 0.9, clearcoat: 1, clearcoatRoughness: 0.08 });
    const word = new THREE.Mesh(make(window.FEST?.name || "SYNERGY", 2.15, 0.55), chrome);
    const year = new THREE.Mesh(make(window.FEST?.year || "2026", 1.05, 0.3),
      new THREE.MeshStandardMaterial({ color: COLORS.hot, emissive: COLORS.hot, emissiveIntensity: 1.6, roughness: 0.3, metalness: 0.4 }));
    year.position.y = -2.15;
    title.add(word, year);
    title.userData.year = year;
    hideLoader();
  }, undefined, () => { document.body.classList.add("no-font"); hideLoader(); });

  // ---------- post-processing ----------
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  // Clamp HDR hot spots (and any NaN) so bloom's blur chain can't smear them across the frame.
  composer.addPass(new ShaderPass({
    uniforms: { tDiffuse: { value: null } },
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }",
    fragmentShader: `
      uniform sampler2D tDiffuse; varying vec2 vUv;
      void main(){
        vec4 c = texture2D(tDiffuse, vUv);
        if (any(isnan(c)) || any(isinf(c))) c = vec4(0., 0., 0., 1.);
        gl_FragColor = vec4(clamp(c.rgb, 0., 24.), 1.);
      }`,
  }));
  const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), lowPower ? 0.55 : 0.7, 0.5, 0.72);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // ---------- camera path driven by page scroll ----------
  const camPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 4.2, 27),
    new THREE.Vector3(-10, 6.5, 16),
    new THREE.Vector3(9, 9.5, 9),
    new THREE.Vector3(1.5, 2.3, 9.5),
    new THREE.Vector3(-6, 3.5, 2.5),
    new THREE.Vector3(0, 15, 32),
  ]);
  const lookPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 5.2, -3),
    new THREE.Vector3(0, 5.2, -3),
    new THREE.Vector3(-2, 4.5, -1),
    new THREE.Vector3(0, 7.5, -5),
    new THREE.Vector3(4, 6, -6),
    new THREE.Vector3(0, 5, -4),
  ]);
  let scrollP = 0, smoothP = 0;
  const mouse = new THREE.Vector2(), smoothMouse = new THREE.Vector2();
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    scrollP = max > 0 ? scrollY / max : 0;
  };
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("pointermove", e => mouse.set(e.clientX / innerWidth - 0.5, e.clientY / innerHeight - 0.5));
  onScroll();

  const fit = () => {
    const aspect = innerWidth / innerHeight;
    camera.aspect = aspect;
    camera.fov = aspect < 1 ? 50 + (1 - aspect) * 42 : 50;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    composer.setSize(innerWidth, innerHeight);
    bloom.resolution.set(innerWidth, innerHeight);
  };
  addEventListener("resize", fit);
  fit();

  // ---------- animate ----------
  const clock = new THREE.Clock();
  const dummy = new THREE.Object3D();
  const camPos = new THREE.Vector3(), camLook = new THREE.Vector3();
  const timeScale = reduceMotion ? 0.2 : 1;
  let firstFrame = false;

  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime * timeScale;
    const beatPhase = (t * BPM) / 60;
    const kick = Math.pow(1 - (beatPhase % 1), 3);
    const bar = Math.floor(beatPhase / 4);

    // camera
    smoothP += (scrollP - smoothP) * Math.min(1, dt * 3);
    smoothMouse.lerp(mouse, Math.min(1, dt * 2.5));
    camPath.getPoint(smoothP, camPos);
    lookPath.getPoint(smoothP, camLook);
    camPos.x += smoothMouse.x * 1.6 + Math.sin(t * 0.3) * 0.25;
    camPos.y += -smoothMouse.y * 0.8 + Math.sin(t * 0.47) * 0.12;
    camera.position.copy(camPos);
    camera.lookAt(camLook);
    // full show in the hero, dimmer behind the reading sections
    const heroFade = Math.min(1, scrollY / innerHeight);
    // portrait phones: tilt down in the hero so the 3D title sits above the hero text
    if (camera.aspect < 0.8) {
      camLook.y -= 4.2 * (1 - heroFade);
      camera.lookAt(camLook);
    }
    renderer.toneMappingExposure = 1.05 - heroFade * (camera.aspect < 0.8 ? 0.6 : 0.45);
    const wantRatio = heroFade > 0.95 ? readingRatio : heroFade < 0.8 ? heroRatio : renderer.getPixelRatio();
    if (wantRatio !== renderer.getPixelRatio()) {
      renderer.setPixelRatio(wantRatio);
      composer.setPixelRatio(wantRatio);
    }

    // LED wall + glow
    ledMat.uniforms.t.value = t;
    ledMat.uniforms.beat.value = kick;
    screenGlow.intensity = 40 + kick * 60;
    edgeLed.material.color.setHex(bar % 2 ? COLORS.cyan : COLORS.hot);

    // moving heads: sweep the crowd, pulse on the kick
    const pattern = bar % 4;
    heads.forEach((h, i) => {
      const s = t * 0.55 + h.phase;
      if (pattern === 3) h.target.set(h.x * 0.15, 0, 12 + Math.sin(s) * 3);             // converge into one point
      else if (pattern === 2) h.target.set(h.x * 1.6 + Math.sin(s) * 3, 0, 8 + Math.cos(s * 0.8) * 10); // fan out
      else h.target.set(h.x + Math.sin(s) * 7, 0, 9 + Math.cos(s * 0.73) * 9);          // free sweep
      h.rig.lookAt(h.target);
      const dist = h.rig.position.distanceTo(h.target);
      h.beam.scale.set(dist * 0.15, dist * 0.15, dist);
      const strobe = 0.75 + kick * 0.6;
      h.beam.material.uniforms.intensity.value = strobe;
      if (h.spot) {
        h.spot.target.position.copy(h.target);
        h.spot.intensity = 600 + kick * 700;
      }
    });

    // lasers come in on alternate phrases
    const lasersOn = Math.sin(t * 0.22) > 0.55;
    lasers.forEach((src, si) => {
      src.visible = lasersOn;
      if (!lasersOn) return;
      src.children.forEach(l => {
        const k = l.userData.k - 3;
        l.rotation.set(-0.08 - Math.abs(Math.sin(t * 0.8 + k)) * 0.25, k * 0.11 + Math.sin(t * 0.9 + si) * 0.5, 0);
      });
      laserMat.opacity = 0.25 + kick * 0.35;
    });

    // crowd bounces on the beat
    const bounce = (list, mesh) => {
      list.forEach((p, i) => {
        const jump = Math.max(0, Math.sin(beatPhase * Math.PI + p.ph)) * 0.16 * p.e;
        dummy.position.set(p.x, jump, p.z);
        dummy.rotation.set(0, p.ry + Math.sin(t + p.ph) * 0.1, Math.sin(t * 2 + p.ph) * 0.04);
        dummy.scale.setScalar(p.s);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    };
    bounce(standers, crowdA);
    bounce(cheerers, crowdB);

    const pp = phoneGeo.attributes.position.array;
    phones.forEach((p, i) => {
      const jump = Math.max(0, Math.sin(beatPhase * Math.PI + p.ph)) * 0.16 * p.e;
      pp[i * 3] = p.x + Math.sin(t + p.ph) * 0.08;
      pp[i * 3 + 1] = (1.95 + jump) * p.s;
      pp[i * 3 + 2] = p.z;
    });
    phoneGeo.attributes.position.needsUpdate = true;

    // haze drifts
    haze.rotation.y = Math.sin(t * 0.05) * 0.04;
    haze.position.x = Math.sin(t * 0.1) * 0.8;

    // confetti
    bits.forEach((b, i) => {
      b.y -= b.v * dt;
      if (b.y < 0) { b.y = 16; b.x = (Math.random() - 0.5) * 30; b.z = Math.random() * 24; }
      dummy.position.set(b.x + Math.sin(t * 0.8 + b.r) * 0.6, b.y, b.z);
      dummy.rotation.set(t * b.sp + b.r, t * b.sp * 0.7, b.r);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      confetti.setMatrixAt(i, dummy.matrix);
    });
    confetti.instanceMatrix.needsUpdate = true;

    // title floats and catches the light
    title.rotation.y = Math.sin(t * 0.4) * 0.12 + smoothMouse.x * 0.15;
    title.rotation.x = smoothMouse.y * 0.08;
    title.position.y = 7.1 + Math.sin(t * 0.8) * 0.12;
    if (title.userData.year) title.userData.year.material.emissiveIntensity = 1.2 + kick * 1.4;

    composer.render();
    if (!firstFrame) { firstFrame = true; setTimeout(hideLoader, 400); }
  });
}
