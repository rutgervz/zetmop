/**
 * 3D Effects systeem voor schaakbord
 * Battle Chess-achtige visuele effecten bij captures, check, schaakmat etc.
 */
import type { GameEvent, Square } from '@/lib/chess/types';

// Kleuren voor deeltjes
const COLORS_WHITE = [0xFFEEDD, 0xDDC8A8, 0xFFD700, 0xFFF5E0];
const COLORS_BLACK = [0x1A1A1A, 0x333333, 0x4A0080, 0x2D1B4E];
const COLORS_CONFETTI = [0xFF3366, 0x33FF66, 0x3366FF, 0xFFCC00, 0xFF6633, 0x33FFCC, 0xFF33FF, 0xFFFFFF];
const COLORS_CHECK = [0xFF0000, 0xFF3333, 0xFF6600, 0xCC0000];
const COLORS_CASTLING = [0x4ECDC4, 0x88EEDD, 0xAAFFEE];
const COLORS_PROMOTION = [0xFFD700, 0xFFF5E0, 0xFFAA00, 0xFFFFFF];

type Particle = {
  mesh: any;
  velocity: { x: number; y: number; z: number };
  life: number;
  maxLife: number;
  gravity: number;
  rotSpeed: { x: number; y: number; z: number };
  fadeOut: boolean;
  scale: number;
  shrink: boolean;
};

type ShockWave = {
  mesh: any;
  life: number;
  maxLife: number;
  maxScale: number;
};

type GlowPulse = {
  light: any;
  life: number;
  maxLife: number;
  baseIntensity: number;
};

export class EffectsSystem {
  private THREE: any;
  private scene: any;
  private particles: Particle[] = [];
  private shockWaves: ShockWave[] = [];
  private glows: GlowPulse[] = [];
  private shakeAmount = 0;
  private shakeDecay = 0.92;

  constructor(THREE: any, scene: any) {
    this.THREE = THREE;
    this.scene = scene;
  }

  /** Coördinaten van een veld op het 3D bord */
  private squarePos(square: Square): { x: number; z: number } {
    const col = square.charCodeAt(0) - 97;
    const row = parseInt(square[1]) - 1;
    return { x: col - 3.5, z: -(row - 3.5) };
  }

  /** Spawn deeltjes op een positie */
  private spawnParticles(
    x: number, z: number, y: number,
    count: number,
    colors: number[],
    opts: {
      speed?: number;
      gravity?: number;
      life?: number;
      size?: number;
      upward?: boolean;
      spread?: number;
      shrink?: boolean;
      shapes?: ('sphere' | 'box' | 'cone')[];
    } = {}
  ) {
    const {
      speed = 3, gravity = -6, life = 1.5, size = 0.06,
      upward = false, spread = 1, shrink = true,
      shapes = ['sphere', 'box']
    } = opts;

    for (let i = 0; i < count; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const mat = new this.THREE.MeshStandardMaterial({
        color, emissive: color, emissiveIntensity: 0.5,
        transparent: true, opacity: 1,
      });

      const shape = shapes[Math.floor(Math.random() * shapes.length)];
      const s = size * (0.5 + Math.random());
      let geo;
      if (shape === 'box') geo = new this.THREE.BoxGeometry(s, s, s);
      else if (shape === 'cone') geo = new this.THREE.ConeGeometry(s * 0.5, s, 4);
      else geo = new this.THREE.SphereGeometry(s * 0.5, 6, 6);

      const mesh = new this.THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);

      this.scene.add(mesh);

      const angle = Math.random() * Math.PI * 2;
      const upForce = upward ? speed * (0.5 + Math.random()) : speed * Math.random();
      const sideForce = speed * spread * (0.3 + Math.random() * 0.7);

      this.particles.push({
        mesh,
        velocity: {
          x: Math.cos(angle) * sideForce * (0.5 + Math.random()),
          y: upForce,
          z: Math.sin(angle) * sideForce * (0.5 + Math.random()),
        },
        life: life * (0.7 + Math.random() * 0.6),
        maxLife: life,
        gravity,
        rotSpeed: {
          x: (Math.random() - 0.5) * 10,
          y: (Math.random() - 0.5) * 10,
          z: (Math.random() - 0.5) * 10,
        },
        fadeOut: true,
        scale: 1,
        shrink,
      });
    }
  }

  /** Shockwave ring op een positie */
  private spawnShockWave(x: number, z: number, color: number, maxScale = 3, life = 0.6) {
    const geo = new this.THREE.RingGeometry(0.3, 0.45, 32);
    const mat = new this.THREE.MeshStandardMaterial({
      color, emissive: color, emissiveIntensity: 0.8,
      transparent: true, opacity: 0.8, side: this.THREE.DoubleSide,
    });
    const mesh = new this.THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, 0.05, z);
    this.scene.add(mesh);

    this.shockWaves.push({ mesh, life, maxLife: life, maxScale });
  }

  /** Glow licht op een positie */
  private spawnGlow(x: number, z: number, color: number, intensity = 3, life = 1.5) {
    const light = new this.THREE.PointLight(color, 0, 5);
    light.position.set(x, 1, z);
    this.scene.add(light);

    this.glows.push({ light, life, maxLife: life, baseIntensity: intensity });
  }

  /** Camera shake */
  private shake(amount: number) {
    this.shakeAmount = Math.max(this.shakeAmount, amount);
  }

  // ==========================================
  // GAME EVENT TRIGGERS
  // ==========================================

  /** Stuk geslagen — explosie van deeltjes in kleur van het geslagen stuk */
  triggerCapture(square: Square, capturedColor: 'w' | 'b') {
    const { x, z } = this.squarePos(square);
    const colors = capturedColor === 'w' ? COLORS_WHITE : COLORS_BLACK;

    // Grote deeltjesexplosie
    this.spawnParticles(x, z, 0.3, 45, colors, {
      speed: 4.5, gravity: -8, life: 1.8, size: 0.07,
      spread: 1.2, shapes: ['sphere', 'box', 'cone'],
    });

    // Shockwave
    this.spawnShockWave(x, z, colors[0], 3.5, 0.7);

    // Glow flash
    this.spawnGlow(x, z, colors[0], 4, 0.8);

    // Camera shake
    this.shake(0.15);
  }

  /** Schaak — koning trilt, rode gloed */
  triggerCheck(kingSquare: Square) {
    const { x, z } = this.squarePos(kingSquare);

    // Rode vonken rond de koning
    this.spawnParticles(x, z, 0.5, 20, COLORS_CHECK, {
      speed: 2, gravity: -3, life: 1.2, size: 0.04,
      upward: true, spread: 0.6,
    });

    // Rode shockwave
    this.spawnShockWave(x, z, 0xFF0000, 2.5, 1.0);

    // Rode gloed
    this.spawnGlow(x, z, 0xFF0000, 5, 2.0);

    // Kleine shake
    this.shake(0.08);
  }

  /** Schaakmat — groot vuurwerk + confetti over het hele bord */
  triggerCheckmate(winnerColor: 'w' | 'b', kingSquare: Square) {
    const { x: kx, z: kz } = this.squarePos(kingSquare);

    // Explosie bij de verliezende koning
    this.spawnParticles(kx, kz, 0.4, 60, COLORS_CHECK, {
      speed: 5, gravity: -6, life: 2.5, size: 0.08,
      spread: 1.5,
    });

    // Confetti over het hele bord (meerdere bronpunten)
    const confettiPoints = [
      { x: -2, z: -2 }, { x: 2, z: -2 }, { x: 0, z: 0 },
      { x: -2, z: 2 }, { x: 2, z: 2 }, { x: -3, z: 0 }, { x: 3, z: 0 },
    ];
    confettiPoints.forEach((p, i) => {
      setTimeout(() => {
        this.spawnParticles(p.x, p.z, 3 + Math.random() * 2, 25, COLORS_CONFETTI, {
          speed: 2, gravity: -3, life: 3.5, size: 0.09,
          upward: false, spread: 2, shapes: ['box'],
        });
      }, i * 120);
    });

    // Meerdere shockwaves
    this.spawnShockWave(kx, kz, 0xFF3333, 5, 1.2);
    setTimeout(() => this.spawnShockWave(0, 0, 0xFFD700, 8, 1.5), 300);

    // Gouden gloed in het midden
    this.spawnGlow(0, 0, 0xFFD700, 6, 3.0);

    // Flinke shake
    this.shake(0.3);
  }

  /** Remise/Pat — zachte blauwe deeltjes, alles komt tot stilstand */
  triggerStalemate() {
    const blueColors = [0x4466AA, 0x6688CC, 0x88AAEE, 0xAABBFF];

    // Zachte deeltjes van alle hoeken
    for (let col = 0; col < 8; col += 2) {
      for (let row = 0; row < 8; row += 2) {
        this.spawnParticles(col - 3.5, -(row - 3.5), 0.2, 3, blueColors, {
          speed: 0.8, gravity: -1, life: 3, size: 0.04,
          upward: true, spread: 0.3, shapes: ['sphere'],
        });
      }
    }

    // Zachte blauwe gloed
    this.spawnGlow(0, 0, 0x4466AA, 3, 3.0);
  }

  /** Rokade — swoosh trail van toren */
  triggerCastling(side: 'kingside' | 'queenside', color: 'w' | 'b') {
    const row = color === 'w' ? 0 : 7;
    const fromCol = side === 'kingside' ? 7 : 0;
    const toCol = side === 'kingside' ? 5 : 3;

    const steps = 8;
    for (let i = 0; i <= steps; i++) {
      const col = fromCol + (toCol - fromCol) * (i / steps);
      const x = col - 3.5;
      const z = -(row - 3.5);
      setTimeout(() => {
        this.spawnParticles(x, z, 0.2, 4, COLORS_CASTLING, {
          speed: 1, gravity: -2, life: 0.8, size: 0.03,
          upward: true, spread: 0.3, shapes: ['sphere'],
        });
      }, i * 40);
    }

    // Swoosh gloed langs het pad
    const midX = ((fromCol + toCol) / 2) - 3.5;
    const midZ = -(row - 3.5);
    this.spawnGlow(midX, midZ, 0x4ECDC4, 3, 1.0);
  }

  /** En passant — ghost effect */
  triggerEnPassant(captureSquare: Square) {
    const { x, z } = this.squarePos(captureSquare);

    // Ghostachtige deeltjes die omhoog zweven
    this.spawnParticles(x, z, 0.2, 25, [0xFFFFFF, 0xCCCCFF, 0xAABBFF], {
      speed: 1.5, gravity: 0.5, life: 2, size: 0.05,
      upward: true, spread: 0.4, shapes: ['sphere'],
    });

    // Blauwe shockwave
    this.spawnShockWave(x, z, 0x8888FF, 2, 0.8);

    this.shake(0.1);
  }

  /** Promotie — lichtflits + spiraal omhoog */
  triggerPromotion(square: Square) {
    const { x, z } = this.squarePos(square);

    // Gouden spiraal omhoog
    for (let i = 0; i < 30; i++) {
      const angle = (i / 30) * Math.PI * 4;
      const r = 0.15 + (i / 30) * 0.3;
      setTimeout(() => {
        this.spawnParticles(
          x + Math.cos(angle) * r,
          z + Math.sin(angle) * r,
          0.1 + (i / 30) * 0.6,
          2, COLORS_PROMOTION, {
            speed: 1.5, gravity: -1, life: 1.2, size: 0.05,
            upward: true, spread: 0.2, shapes: ['sphere'],
          }
        );
      }, i * 25);
    }

    // Grote gouden flash
    this.spawnGlow(x, z, 0xFFD700, 6, 1.5);
    this.spawnShockWave(x, z, 0xFFD700, 3, 0.8);

    this.shake(0.12);
  }

  // ==========================================
  // DISPATCH vanuit GameEvent
  // ==========================================

  handleEvent(event: GameEvent | null) {
    if (!event) return;

    switch (event.type) {
      case 'capture': {
        // Het geslagen stuk had de tegenovergestelde kleur van de speler die sloeg
        const capturedColor: 'w' | 'b' = event.move.color === 'w' ? 'b' : 'w';
        this.triggerCapture(event.move.to as Square, capturedColor);
        break;
      }
      case 'check':
        this.triggerCheck(event.kingSquare);
        break;
      case 'checkmate':
        this.triggerCheckmate(event.winner, event.kingSquare);
        break;
      case 'stalemate':
        this.triggerStalemate();
        break;
      case 'castling':
        this.triggerCastling(event.side, event.color);
        break;
      case 'enPassant':
        this.triggerEnPassant(event.move.to as Square);
        break;
      case 'promotion':
        this.triggerPromotion(event.move.to as Square);
        break;
    }
  }

  // ==========================================
  // UPDATE LOOP (elke frame)
  // ==========================================

  update(dt: number, camera: any) {
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        this.particles.splice(i, 1);
        continue;
      }

      // Physics
      p.velocity.y += p.gravity * dt;
      p.mesh.position.x += p.velocity.x * dt;
      p.mesh.position.y += p.velocity.y * dt;
      p.mesh.position.z += p.velocity.z * dt;

      // Bounce op het bord
      if (p.mesh.position.y < 0.02) {
        p.mesh.position.y = 0.02;
        p.velocity.y = Math.abs(p.velocity.y) * 0.3;
        p.velocity.x *= 0.7;
        p.velocity.z *= 0.7;
      }

      // Rotation
      p.mesh.rotation.x += p.rotSpeed.x * dt;
      p.mesh.rotation.y += p.rotSpeed.y * dt;
      p.mesh.rotation.z += p.rotSpeed.z * dt;

      // Fade out
      const lifeRatio = p.life / p.maxLife;
      if (p.fadeOut) {
        p.mesh.material.opacity = Math.min(1, lifeRatio * 2);
      }
      if (p.shrink && lifeRatio < 0.3) {
        const s = lifeRatio / 0.3;
        p.mesh.scale.set(s, s, s);
      }
    }

    // Update shockwaves
    for (let i = this.shockWaves.length - 1; i >= 0; i--) {
      const sw = this.shockWaves[i];
      sw.life -= dt;

      if (sw.life <= 0) {
        this.scene.remove(sw.mesh);
        sw.mesh.geometry.dispose();
        sw.mesh.material.dispose();
        this.shockWaves.splice(i, 1);
        continue;
      }

      const progress = 1 - (sw.life / sw.maxLife);
      const scale = 1 + progress * sw.maxScale;
      sw.mesh.scale.set(scale, scale, 1);
      sw.mesh.material.opacity = (1 - progress) * 0.8;
    }

    // Update glows
    for (let i = this.glows.length - 1; i >= 0; i--) {
      const g = this.glows[i];
      g.life -= dt;

      if (g.life <= 0) {
        this.scene.remove(g.light);
        this.glows.splice(i, 1);
        continue;
      }

      const progress = g.life / g.maxLife;
      // Snel aan, langzaam uit
      const envelope = progress < 0.8 ? 1 : progress * 5 - 4;
      g.light.intensity = g.baseIntensity * Math.max(0, 1 - Math.pow(1 - progress, 0.5)) *
        (1 + Math.sin(progress * Math.PI * 8) * 0.2);
    }

    // Camera shake
    if (this.shakeAmount > 0.001 && camera) {
      camera.position.x += (Math.random() - 0.5) * this.shakeAmount;
      camera.position.y += (Math.random() - 0.5) * this.shakeAmount;
      this.shakeAmount *= this.shakeDecay;
    } else {
      this.shakeAmount = 0;
    }
  }

  /** Cleanup alle actieve effecten */
  dispose() {
    this.particles.forEach(p => {
      this.scene.remove(p.mesh);
      p.mesh.geometry.dispose();
      p.mesh.material.dispose();
    });
    this.shockWaves.forEach(sw => {
      this.scene.remove(sw.mesh);
      sw.mesh.geometry.dispose();
      sw.mesh.material.dispose();
    });
    this.glows.forEach(g => {
      this.scene.remove(g.light);
    });
    this.particles = [];
    this.shockWaves = [];
    this.glows = [];
    this.shakeAmount = 0;
  }
}
