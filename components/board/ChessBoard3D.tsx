import React, { useRef, useEffect, useState } from 'react';
import { View, useWindowDimensions, Platform } from 'react-native';
import { useGameStore } from '@/stores/gameStore';
import { EffectsSystem } from './effects';
import type { Square, PieceSymbol, Color } from '@/lib/chess/types';

const isWeb = Platform.OS === 'web';

const LIGHT_SQ = 0xE8D5B5;
const DARK_SQ = 0x7B6B4F;
const SELECTED = 0x4ECDC4;
const LAST_LIGHT = 0xC2E4DD;
const LAST_DARK = 0x6BADA5;
const LEGAL = 0x4ECDC4;
const CHECK = 0xFF3232;
const FRAME = 0x3D2E16;
const FRAME_EDGE = 0x5C4A2E;
const BG = 0x1A1A2E;

function sq(col: number, row: number): Square {
  return `${String.fromCharCode(97 + col)}${row + 1}` as Square;
}

function makePiece(THREE: any, type: PieceSymbol, color: Color) {
  const isW = color === 'w';
  const pcMat = new THREE.MeshStandardMaterial({ color: isW ? 0xFFEEDD : 0x1A1A1A, roughness: 0.4, metalness: 0.15 });
  const acMat = new THREE.MeshStandardMaterial({ color: isW ? 0xDDC8A8 : 0x333333, roughness: 0.35, metalness: 0.2 });
  const g = new THREE.Group();

  const cs = (m: any) => { m.castShadow = true; return m; };
  const add = (m: any) => { g.add(cs(m)); return m; };

  if (type === 'p') {
    // PION — kort, bol bovenop, simpelste stuk
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.04, 20), acMat)).position.y = 0.02;
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.17, 0.22, 14), pcMat)).position.y = 0.15;
    add(new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), pcMat)).position.y = 0.34;

  } else if (type === 'r') {
    // TOREN — breed, vierkante kantelen bovenop
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.05, 20), acMat)).position.y = 0.03;
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.21, 0.35, 16), pcMat)).position.y = 0.22;
    // Brede platte bovenkant
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.06, 16), acMat)).position.y = 0.43;
    // Vier kantelen
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const m = add(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.08), pcMat));
      m.position.set(Math.sin(angle) * 0.15, 0.51, Math.cos(angle) * 0.15);
    }

  } else if (type === 'n') {
    // PAARD — kijkt naar links (negatieve x-richting)
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.23, 0.05, 20), acMat)).position.y = 0.03;
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.18, 0.25, 14), pcMat)).position.y = 0.18;
    // Nek (schuin naar links)
    const neck = add(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.28, 10), pcMat));
    neck.position.set(-0.02, 0.42, 0); neck.rotation.z = -0.15;
    // Hoofd (naar links)
    const head = add(new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.14), pcMat));
    head.position.set(-0.1, 0.55, 0); head.rotation.z = -0.4;
    // Snuit (naar links)
    const snout = add(new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.10, 0.10), pcMat));
    snout.position.set(-0.2, 0.50, 0); snout.rotation.z = -0.5;
    // Oren
    const ear1 = add(new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.1, 6), pcMat));
    ear1.position.set(-0.06, 0.65, -0.05);
    const ear2 = add(new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.1, 6), pcMat));
    ear2.position.set(-0.06, 0.65, 0.05);

  } else if (type === 'b') {
    // LOPER — hoog, smal, puntige mijter met gleuf
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.23, 0.05, 20), acMat)).position.y = 0.03;
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.18, 0.32, 14), pcMat)).position.y = 0.22;
    // Collar ring
    add(new THREE.Mesh(new THREE.TorusGeometry(0.10, 0.025, 8, 20), acMat)).position.y = 0.40;
    // Druppelvorm (ovaal gestretcht)
    const drop = add(new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 16), pcMat));
    drop.position.y = 0.52; drop.scale.set(1, 1.4, 1);
    // Gleuf (donkere lijn)
    const slit = add(new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.005, 0.04), acMat));
    slit.position.set(0, 0.58, 0.08); slit.rotation.x = -0.5;
    // Puntje bovenop
    add(new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 10), acMat)).position.y = 0.68;

  } else if (type === 'q') {
    // DAME — groot, kroon met punten, bol bovenop
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.27, 0.06, 20), acMat)).position.y = 0.03;
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.21, 0.38, 14), pcMat)).position.y = 0.25;
    // Collar
    add(new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.03, 8, 20), acMat)).position.y = 0.46;
    // Kroon basis (korte brede cilinder)
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.12, 0.08, 16), pcMat)).position.y = 0.52;
    // Kroon punten (8 puntjes in een cirkel)
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const spike = add(new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.12, 6), acMat));
      spike.position.set(Math.sin(angle) * 0.12, 0.62, Math.cos(angle) * 0.12);
    }
    // Bol bovenop
    add(new THREE.Mesh(new THREE.SphereGeometry(0.06, 14, 14), acMat)).position.y = 0.68;

  } else if (type === 'k') {
    // KONING — het hoogste stuk, breed, kruis bovenop
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.28, 0.06, 20), acMat)).position.y = 0.03;
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.22, 0.40, 14), pcMat)).position.y = 0.26;
    // Collar
    add(new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.03, 8, 20), acMat)).position.y = 0.48;
    // Kroon band (brede ring)
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.1, 16), pcMat)).position.y = 0.55;
    // Boog-armen (4 gebogen strips die naar boven komen)
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const arm = add(new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.14, 0.03), pcMat));
      arm.position.set(Math.sin(angle) * 0.10, 0.65, Math.cos(angle) * 0.10);
      arm.rotation.set(
        Math.cos(angle) * 0.3,
        0,
        -Math.sin(angle) * 0.3
      );
    }
    // Kruis
    const vbar = add(new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.22, 0.05), acMat));
    vbar.position.y = 0.75;
    const hbar = add(new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.05, 0.05), acMat));
    hbar.position.y = 0.80;
  }

  return g;
}

export default function ChessBoard3D() {
  const { width, height } = useWindowDimensions();
  const size = Math.min(width - 8, height - 80);
  const sceneRef = useRef<any>(null);
  const [ready, setReady] = useState(false);

  const board = useGameStore((s) => s.board);
  const selectedSquare = useGameStore((s) => s.selectedSquare);
  const legalMoves = useGameStore((s) => s.legalMoves);
  const lastMove = useGameStore((s) => s.lastMove);
  const status = useGameStore((s) => s.status);
  const turn = useGameStore((s) => s.turn);
  const lastEvent = useGameStore((s) => s.lastEvent);
  const lastEventRef = useRef(lastEvent);

  // Init scene once
  useEffect(() => {
    if (!isWeb) return;
    let disposed = false;

    (async () => {
      const THREE = (await import('three')).default || await import('three');

      const canvas = document.createElement('canvas');
      canvas.width = size * 2;
      canvas.height = size * 2;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
      canvas.style.borderRadius = '8px';

      const container = document.getElementById('chess3d-container');
      if (!container || disposed) return;
      container.innerHTML = '';
      container.appendChild(canvas);

      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
      renderer.setPixelRatio(2);
      renderer.setSize(size, size);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(BG);
      scene.fog = new THREE.Fog(BG, 18, 28);

      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
      camera.position.set(0, 13, 5);
      camera.lookAt(0, 0, 0);

      // Lighting
      scene.add(new THREE.AmbientLight(0xffffff, 0.55));
      const dl = new THREE.DirectionalLight(0xfff5e0, 1.1);
      dl.position.set(5, 12, 5);
      dl.castShadow = true;
      dl.shadow.mapSize.set(2048, 2048);
      dl.shadow.camera.near = 0.5; dl.shadow.camera.far = 50;
      dl.shadow.camera.left = -10; dl.shadow.camera.right = 10;
      dl.shadow.camera.top = 10; dl.shadow.camera.bottom = -10;
      scene.add(dl);
      const fl = new THREE.DirectionalLight(0x8888ff, 0.2);
      fl.position.set(-4, 6, -4);
      scene.add(fl);

      // Board frame
      const frameMat = new THREE.MeshStandardMaterial({ color: FRAME, roughness: 0.85 });
      const edgeMat = new THREE.MeshStandardMaterial({ color: FRAME_EDGE, roughness: 0.7 });

      const base = new THREE.Mesh(new THREE.BoxGeometry(9, 0.18, 9), frameMat);
      base.position.y = -0.1; base.receiveShadow = true; scene.add(base);

      [[0, 0.02, -4.55, 9.2, 0.14, 0.3], [0, 0.02, 4.55, 9.2, 0.14, 0.3],
       [-4.55, 0.02, 0, 0.3, 0.14, 9.2], [4.55, 0.02, 0, 0.3, 0.14, 9.2]].forEach(([x, y, z, w, h, d]) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), edgeMat);
        m.position.set(x, y, z); m.receiveShadow = true; m.castShadow = true; scene.add(m);
      });

      // Squares
      const squareMap = new Map();
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const isLight = (col + row) % 2 === 0;
          const mat = new THREE.MeshStandardMaterial({ color: isLight ? LIGHT_SQ : DARK_SQ, roughness: 0.75, metalness: 0.05 });
          const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.96, 0.96), mat);
          mesh.rotation.x = -Math.PI / 2;
          mesh.position.set(col - 3.5, 0.01, -(row - 3.5));
          mesh.receiveShadow = true;
          scene.add(mesh);
          squareMap.set(sq(col, row), { mesh, mat, isLight });
        }
      }

      // Click detection
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();
      const allSquares = Array.from(squareMap.values()).map((s: any) => s.mesh);

      canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObjects(allSquares);
        if (hits.length > 0) {
          for (const [s, data] of squareMap) {
            if (data.mesh === hits[0].object) {
              useGameStore.getState().selectSquare(s);
              break;
            }
          }
        }
      });

      // Camera orbit (right-click/shift+drag)
      let dragging = false, px = 0, py = 0;
      let theta = 0, phi = Math.PI / 6, radius = 14;

      canvas.addEventListener('pointerdown', (e) => {
        if (e.button === 2 || e.shiftKey) { dragging = true; px = e.clientX; py = e.clientY; }
      });
      canvas.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        theta -= (e.clientX - px) * 0.005;
        phi = Math.max(0.25, Math.min(1.35, phi + (e.clientY - py) * 0.005));
        px = e.clientX; py = e.clientY;
      });
      canvas.addEventListener('pointerup', () => dragging = false);
      canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        radius = Math.max(7, Math.min(18, radius + e.deltaY * 0.01));
      }, { passive: false });
      canvas.addEventListener('contextmenu', (e) => e.preventDefault());

      // Effects systeem
      const effects = new EffectsSystem(THREE, scene);

      // Store scene ref
      sceneRef.current = { THREE, renderer, scene, camera, squareMap, effects, dynamicObjects: [] as any[], theta: () => theta, phi: () => phi, radius: () => radius };

      // Render loop met delta time
      let lastTime = performance.now();
      const animate = () => {
        if (disposed) return;
        requestAnimationFrame(animate);

        const now = performance.now();
        const dt = Math.min((now - lastTime) / 1000, 0.05); // cap op 50ms
        lastTime = now;

        // Camera orbit
        const t = theta, p = phi, r = radius;
        camera.position.x += (r * Math.sin(p) * Math.sin(t) - camera.position.x) * 0.08;
        camera.position.y += (r * Math.cos(p) - camera.position.y) * 0.08;
        camera.position.z += (r * Math.sin(p) * Math.cos(t) - camera.position.z) * 0.08;
        camera.lookAt(0, 0, 0);

        // Update effects (particles, shockwaves, glows)
        effects.update(dt, camera);

        renderer.render(scene, camera);
      };
      animate();
      setReady(true);
    })();

    return () => {
      disposed = true;
      if (sceneRef.current) {
        sceneRef.current.effects.dispose();
        sceneRef.current.renderer.dispose();
      }
    };
  }, [size]);

  // Update board state
  useEffect(() => {
    if (!ready || !sceneRef.current) return;
    const { THREE, scene, squareMap, dynamicObjects } = sceneRef.current;

    // Remove old dynamic objects (pieces + indicators)
    dynamicObjects.forEach((obj: any) => {
      scene.remove(obj);
      obj.traverse((c: any) => { if (c.geometry) c.geometry.dispose(); if (c.material) c.material.dispose(); });
    });
    sceneRef.current.dynamicObjects = [];

    // Check square
    let checkSq: Square | null = null;
    if (status === 'check' || status === 'checkmate') {
      for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p && p.type === 'k' && p.color === turn) checkSq = sq(c, 7 - r);
      }
    }

    // Update square colors
    for (const [s, data] of squareMap) {
      let color = data.isLight ? LIGHT_SQ : DARK_SQ;
      if (selectedSquare === s) color = SELECTED;
      else if (checkSq === s) color = CHECK;
      else if (lastMove?.from === s || lastMove?.to === s) color = data.isLight ? LAST_LIGHT : LAST_DARK;
      data.mat.color.setHex(color);
    }

    // Add pieces and indicators
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const br = 7 - row;
        const piece = board[br][col];
        const s = sq(col, row);
        const x = col - 3.5, z = -(row - 3.5);

        // Legal move dot/ring
        if (legalMoves.includes(s)) {
          if (!piece) {
            const dot = new THREE.Mesh(
              new THREE.CircleGeometry(0.14, 24),
              new THREE.MeshStandardMaterial({ color: LEGAL, transparent: true, opacity: 0.5 })
            );
            dot.rotation.x = -Math.PI / 2; dot.position.set(x, 0.02, z);
            scene.add(dot); sceneRef.current.dynamicObjects.push(dot);
          } else {
            const ring = new THREE.Mesh(
              new THREE.RingGeometry(0.36, 0.46, 32),
              new THREE.MeshStandardMaterial({ color: LEGAL, transparent: true, opacity: 0.6 })
            );
            ring.rotation.x = -Math.PI / 2; ring.position.set(x, 0.02, z);
            scene.add(ring); sceneRef.current.dynamicObjects.push(ring);
          }
        }

        if (!piece) continue;
        const group = makePiece(THREE, piece.type, piece.color);
        group.position.set(x, 0, z);
        scene.add(group);
        sceneRef.current.dynamicObjects.push(group);
      }
    }
  }, [ready, board, selectedSquare, legalMoves, lastMove, status, turn]);

  // Trigger 3D effecten bij game events
  useEffect(() => {
    if (!ready || !sceneRef.current) return;
    if (lastEvent === lastEventRef.current) return;
    lastEventRef.current = lastEvent;

    if (lastEvent) {
      sceneRef.current.effects.handleEvent(lastEvent);
    }
  }, [ready, lastEvent]);

  if (!isWeb) {
    const ChessBoard = require('./ChessBoard').default;
    return <ChessBoard />;
  }

  return (
    <View style={{ width: size, height: size, alignSelf: 'center' }}>
      <div id="chess3d-container" style={{ width: size, height: size, borderRadius: 8, overflow: 'hidden' }} />
    </View>
  );
}
