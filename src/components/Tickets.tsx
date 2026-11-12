"use client";
import { useEffect, useRef } from "react";

/**
 * The hero: a loose stream of gig tickets drifting across the top of the page, like a board
 * that never stops filling up. Built live in three.js (same craft as Rewire's ribbon): soft
 * pastel card stock, a punched hole, two printed lines, a soft shadow on the page, and the
 * whole stream leans toward the cursor. A few tickets carry a lime "paid" bar.
 */
const PALETTE = ["#DCEBB4", "#F4E3A6", "#C9E6D6", "#F3CDB4", "#DCD5F3", "#F1D3E2", "#E6EFC0"];

export default function Tickets() {
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    let dead = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import("three");
      const { RoomEnvironment } = await import("three/examples/jsm/environments/RoomEnvironment.js");
      if (dead) return;

      let renderer: import("three").WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance", preserveDrawingBuffer: true });
      } catch {
        return; // no WebGL: the page reads fine without the stream
      }
      const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      renderer.setPixelRatio(Math.min(1.75, window.devicePixelRatio || 1));
      renderer.toneMapping = THREE.NeutralToneMapping;
      renderer.toneMappingExposure = 1.02;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      el.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environmentIntensity = 0.7;

      const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
      camera.position.set(0, 0, 22);

      const key = new THREE.DirectionalLight("#ffffff", 1.6);
      key.position.set(-6, 9, 12);
      key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
      key.shadow.radius = 14;
      Object.assign(key.shadow.camera, { left: -22, right: 22, top: 13, bottom: -13, near: 1, far: 40 });
      scene.add(key);
      scene.add(new THREE.HemisphereLight("#ffffff", "#dcdccf", 0.9));

      const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 40), new THREE.ShadowMaterial({ opacity: 0.045 }));
      floor.position.z = -5;
      floor.receiveShadow = true;
      // no floor shadow: on a light page the cast shadows read as smudges
      void floor;

      const group = new THREE.Group();
      scene.add(group);

      // One ticket: a rounded card with a punched hole near its left edge.
      const TW = 2.1, TH = 1.25, R = 0.2;
      const shape = new THREE.Shape();
      shape.moveTo(-TW / 2 + R, -TH / 2);
      shape.lineTo(TW / 2 - R, -TH / 2); shape.quadraticCurveTo(TW / 2, -TH / 2, TW / 2, -TH / 2 + R);
      shape.lineTo(TW / 2, TH / 2 - R); shape.quadraticCurveTo(TW / 2, TH / 2, TW / 2 - R, TH / 2);
      shape.lineTo(-TW / 2 + R, TH / 2); shape.quadraticCurveTo(-TW / 2, TH / 2, -TW / 2, TH / 2 - R);
      shape.lineTo(-TW / 2, -TH / 2 + R); shape.quadraticCurveTo(-TW / 2, -TH / 2, -TW / 2 + R, -TH / 2);
      const hole = new THREE.Path();
      hole.absarc(-TW / 2 + 0.32, 0, 0.11, 0, Math.PI * 2, true);
      shape.holes.push(hole);
      const DEPTH = 0.07;
      const geo = new THREE.ExtrudeGeometry(shape, { depth: DEPTH, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.025, bevelSegments: 3, curveSegments: 10 });
      geo.translate(0, 0, -DEPTH / 2);
      geo.computeVertexNormals();
      const mat = new THREE.MeshPhysicalMaterial({ roughness: 0.48, metalness: 0, clearcoat: 0.45, clearcoatRoughness: 0.45, sheen: 0.35, sheenRoughness: 0.6, sheenColor: new THREE.Color("#ffffff") });

      // Printed lines on both faces: a title line and a shorter detail line.
      const lineGeo = new THREE.BoxGeometry(1, 0.11, 0.012);
      const lineMat = new THREE.MeshStandardMaterial({ color: "#1b1e24", roughness: 0.8, transparent: true, opacity: 0.32 });
      const paidGeo = new THREE.BoxGeometry(0.62, 0.2, 0.014);
      const paidMat = new THREE.MeshStandardMaterial({ color: "#a9d81c", roughness: 0.55 });

      const COUNT = 38;
      const tickets = new THREE.InstancedMesh(geo, mat, COUNT);
      tickets.castShadow = false;
      tickets.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      const lines = new THREE.InstancedMesh(lineGeo, lineMat, COUNT * 4);
      lines.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      const PAID: number[] = [];
      for (let i = 0; i < COUNT; i++) if (i % 5 === 2) PAID.push(i);
      const paid = new THREE.InstancedMesh(paidGeo, paidMat, PAID.length * 2);
      paid.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

      const rnd = (i: number, n: number) => { const s = Math.sin(i * 91.7 + n * 13.3) * 43758.5453; return s - Math.floor(s); };
      const seeds = Array.from({ length: COUNT }, (_, i) => ({
        off: i / COUNT + (rnd(i, 1) - 0.5) * 0.012,
        spreadY: (rnd(i, 2) - 0.5) * 2,
        spreadZ: (rnd(i, 3) - 0.5) * 2,
        spin: 0.4 + rnd(i, 4) * 0.8,
        phase: rnd(i, 5) * Math.PI * 2,
        tilt: (rnd(i, 6) - 0.5) * 0.9,
        size: 0.85 + rnd(i, 7) * 0.3,
      }));
      const c = new THREE.Color();
      for (let i = 0; i < COUNT; i++) {
        c.set(PALETTE[i % PALETTE.length]);
        c.offsetHSL(0, 0, ((i * 37) % 7) / 220 - 0.012);
        tickets.setColorAt(i, c);
      }
      group.add(tickets, lines, paid);

      let span = 20, amp = 1.6, lift = 0, scale = 1, band = 1, narrow = false;
      const resize = () => {
        const w = el.clientWidth, h = el.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        const viewH = 2 * camera.position.z * Math.tan((camera.fov * Math.PI) / 360);
        const viewW = viewH * camera.aspect;
        narrow = w < 760;
        scale = narrow ? 0.62 : Math.min(1.35, Math.max(0.95, viewW / 24));
        span = viewW * 1.3;
        amp = viewH * (narrow ? 0.06 : 0.1);
        lift = viewH * (narrow ? 0.22 : 0.15);
        band = viewH * (narrow ? 0.06 : 0.075);
      };
      resize();

      const P = new THREE.Vector3(), P2 = new THREE.Vector3(), Tn = new THREE.Vector3();
      const M = new THREE.Matrix4(), L = new THREE.Matrix4(), S = new THREE.Vector3(), Q = new THREE.Quaternion();
      const E = new THREE.Euler();
      const curve = (s: number, t: number, out: import("three").Vector3) => {
        const x = (s - 0.5) * span;
        const y = lift + amp * (Math.sin(s * Math.PI * 2 + 0.6 + t * 0.1) * 0.9 + Math.sin(s * Math.PI * 4.4 - t * 0.08) * 0.22) - (s - 0.5) * amp * 0.5;
        const z = Math.cos(s * Math.PI * 1.6 + t * 0.06) * 2;
        return out.set(x, y, z);
      };
      // where each printed line sits on the ticket face (x, y, length), front and back
      const PRINT = [[0.18, 0.2, 1.1], [0.0, -0.08, 0.7]];

      const look = { x: 0, y: 0 }, aim = { x: 0, y: 0 };
      const onMove = (e: PointerEvent) => {
        aim.x = (e.clientX / window.innerWidth - 0.5) * 2;
        aim.y = (e.clientY / window.innerHeight - 0.5) * 2;
      };
      window.addEventListener("pointermove", onMove, { passive: true });

      const draw = (t: number) => {
        look.x += (aim.x - look.x) * 0.04;
        look.y += (aim.y - look.y) * 0.04;
        group.rotation.y = look.x * 0.07;
        group.rotation.x = look.y * 0.045;

        const flow = still ? 0 : t * 0.014;
        let li = 0, pi = 0;
        for (let i = 0; i < COUNT; i++) {
          const d = seeds[i];
          const s = (((d.off + flow) % 1) + 1) % 1;
          curve(s, t, P);
          curve(s + 0.003, t, P2);
          Tn.subVectors(P2, P).normalize();
          P.y += d.spreadY * band;
          P.z += d.spreadZ * band * 1.4;
          const tt = still ? 0 : t;
          E.set(
            0.35 + Math.sin(tt * 0.35 * d.spin + d.phase) * 0.7,
            Math.sin(tt * 0.22 * d.spin + d.phase * 1.3) * 0.9 + s * 1.4,
            Math.atan2(Tn.y, Tn.x) + d.tilt
          );
          Q.setFromEuler(E);
          const edge = Math.min(1, Math.min(s, 1 - s) * 8);
          S.setScalar(scale * d.size * (0.5 + 0.5 * edge));
          M.compose(P, Q, S);
          tickets.setMatrixAt(i, M);
          for (const face of [1, -1]) {
            for (const [x, y, len] of PRINT) {
              L.makeScale(len, 1, 1).setPosition(x, y, face * (DEPTH / 2 + 0.03));
              lines.setMatrixAt(li++, L.premultiply(M));
            }
          }
          if (i % 5 === 2) {
            for (const face of [1, -1]) {
              L.makeTranslation(0.52, -0.36, face * (DEPTH / 2 + 0.032));
              paid.setMatrixAt(pi++, L.premultiply(M));
            }
          }
        }
        tickets.instanceMatrix.needsUpdate = true;
        lines.instanceMatrix.needsUpdate = true;
        paid.instanceMatrix.needsUpdate = true;
        renderer.render(scene, camera);
      };

      let raf = 0, visible = true;
      const start = performance.now();
      const loop = () => {
        raf = 0;
        if (!visible || document.hidden) return;
        draw((performance.now() - start) / 1000);
        if (!still) raf = requestAnimationFrame(loop);
      };
      const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
      const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick(); });
      io.observe(el);
      const ro = new ResizeObserver(() => { resize(); if (still) draw(0); });
      ro.observe(el);
      document.addEventListener("visibilitychange", kick);

      draw(0);
      el.classList.add("is-ready");
      kick();

      cleanup = () => {
        cancelAnimationFrame(raf);
        io.disconnect(); ro.disconnect();
        window.removeEventListener("pointermove", onMove);
        document.removeEventListener("visibilitychange", kick);
        geo.dispose(); mat.dispose(); lineGeo.dispose(); lineMat.dispose(); paidGeo.dispose(); paidMat.dispose(); pmrem.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    })();

    return () => { dead = true; cleanup(); };
  }, []);

  return <div ref={wrap} className="stream" aria-hidden="true" />;
}
