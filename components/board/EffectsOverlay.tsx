/**
 * Transparante Three.js overlay voor 3D effecten bovenop het 2D bord.
 * Rendert alleen particles, shockwaves en glows — geen bord of stukken.
 */
import React, { useRef, useEffect, useState } from 'react';
import { View, Platform } from 'react-native';
import { useGameStore } from '@/stores/gameStore';
import { EffectsSystem } from './effects';
import type { GameEvent } from '@/lib/chess/types';

const isWeb = Platform.OS === 'web';

type Props = {
  boardSize: number;
};

export default function EffectsOverlay({ boardSize }: Props) {
  const sceneRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const lastEvent = useGameStore((s) => s.lastEvent);
  const lastEventRef = useRef<GameEvent | null>(null);

  useEffect(() => {
    if (!isWeb || boardSize < 100) return;
    let disposed = false;

    (async () => {
      const THREE = await import('three');

      const canvas = document.createElement('canvas');
      canvas.width = boardSize * 2;
      canvas.height = boardSize * 2;
      canvas.style.width = `${boardSize}px`;
      canvas.style.height = `${boardSize}px`;
      canvas.style.pointerEvents = 'none'; // clicks gaan door naar het 2D bord

      const container = document.getElementById('effects-overlay');
      if (!container || disposed) return;
      container.innerHTML = '';
      container.appendChild(canvas);

      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true, // transparante achtergrond!
      });
      renderer.setPixelRatio(2);
      renderer.setSize(boardSize, boardSize);
      renderer.setClearColor(0x000000, 0);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;

      const scene = new THREE.Scene();
      // Geen achtergrondkleur — volledig transparant

      // Orthografische camera zodat 3D posities 1:1 mappen op het 2D bord
      // Het bord loopt van -4 tot +4 in de effects.ts coordinate space
      const halfW = 4.5;
      const camera = new THREE.OrthographicCamera(-halfW, halfW, halfW, -halfW, 0.1, 50);
      camera.position.set(0, 15, 0);
      camera.lookAt(0, 0, 0);

      // Minimale belichting voor de deeltjes
      scene.add(new THREE.AmbientLight(0xffffff, 0.8));
      const dl = new THREE.DirectionalLight(0xffffff, 0.6);
      dl.position.set(2, 10, 2);
      scene.add(dl);

      const effects = new EffectsSystem(THREE, scene);

      sceneRef.current = { THREE, renderer, scene, camera, effects };

      let lastTime = performance.now();
      const animate = () => {
        if (disposed) return;
        requestAnimationFrame(animate);

        const now = performance.now();
        const dt = Math.min((now - lastTime) / 1000, 0.05);
        lastTime = now;

        effects.update(dt, null); // geen camera shake op 2D
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
  }, [boardSize]);

  // Trigger effecten bij game events
  useEffect(() => {
    if (!ready || !sceneRef.current) return;
    if (lastEvent === lastEventRef.current) return;
    lastEventRef.current = lastEvent;

    if (lastEvent) {
      sceneRef.current.effects.handleEvent(lastEvent);
    }
  }, [ready, lastEvent]);

  if (!isWeb) return null;

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: boardSize,
        height: boardSize,
        pointerEvents: 'none' as any,
      }}
    >
      <div
        id="effects-overlay"
        style={{
          width: boardSize,
          height: boardSize,
          pointerEvents: 'none',
        }}
      />
    </View>
  );
}
