import type { GameState, Particle } from '../../types/game';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const BASKET_Y = CANVAS_HEIGHT - 70;
const PLAYER_SPEED = 450;
const BOOST_MAGNET_RANGE = 150;

export class PhysicsSystem {
  update(dt: number, state: GameState) {
    this.updatePlayer(dt, state);
    this.updateItems(dt, state);
    this.updateParticles(dt, state);
    this.updateBoost(dt, state);
  }

  private updatePlayer(dt: number, state: GameState) {
    const diff = state.player.targetX - state.player.x;
    if (Math.abs(diff) > 1) {
      state.player.x += Math.sign(diff) * Math.min(PLAYER_SPEED * dt, Math.abs(diff));
    }
    // Clamp to canvas
    const halfW = state.player.width / 2;
    state.player.x = Math.max(halfW, Math.min(CANVAS_WIDTH - halfW, state.player.x));
  }

  private updateItems(dt: number, state: GameState) {
    for (const item of state.items) {
      if (item.caught || item.missed) continue;

      // Boost magnet effect
      if (state.boostActive && !item.isSpoiled) {
        const dx = state.player.x - item.x;
        const dist = Math.abs(dx);
        if (dist < BOOST_MAGNET_RANGE && item.y > BASKET_Y - 200) {
          item.x += Math.sign(dx) * 200 * dt;
        }
      }

      // Wobble
      item.wobblePhase += dt * 3;
      const wobble = Math.sin(item.wobblePhase) * 15;

      item.y += item.speed * dt;
      item.rotation += item.rotationSpeed * dt;

      // Collision with basket
      const basketLeft = state.player.x - state.player.width / 2;
      const basketRight = state.player.x + state.player.width / 2;
      const itemX = item.x + wobble * 0.3;

      if (
        item.y >= BASKET_Y - 10 &&
        item.y <= BASKET_Y + 20 &&
        itemX >= basketLeft &&
        itemX <= basketRight
      ) {
        item.caught = true;
        this.spawnCatchParticles(state, itemX, BASKET_Y, item.isSpoiled, item.isGolden);
      }

      // Missed - fell to bottom
      if (item.y > CANVAS_HEIGHT + 20) {
        item.missed = true;
      }
    }

    // Clean up caught and missed items (keep them briefly for score processing)
    state.items = state.items.filter((i) => {
      if (i.caught && (i as any).__scored) return false;
      if (i.missed && (i as any).__missScored) return false;
      if (i.y > CANVAS_HEIGHT + 50) return false;
      return true;
    });
  }

  private updateParticles(dt: number, state: GameState) {
    for (const p of state.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 200 * dt; // gravity
      p.life -= dt;
    }
    state.particles = state.particles.filter((p) => p.life > 0);
  }

  private updateBoost(dt: number, state: GameState) {
    if (state.boostActive) {
      state.boostTimer -= dt;
      if (state.boostTimer <= 0) {
        state.boostActive = false;
        state.boostTimer = 0;
      }
    }
  }

  private spawnCatchParticles(state: GameState, x: number, y: number, isSpoiled: boolean, isGolden: boolean) {
    const color = isSpoiled ? '#22C55E' : isGolden ? '#F59E0B' : '#2D5BFF';
    const count = isGolden ? 12 : 8;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
      const speed = 80 + Math.random() * 120;
      const p: Particle = {
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 100,
        life: 0.5 + Math.random() * 0.3,
        maxLife: 0.8,
        color,
        size: 3 + Math.random() * 3,
        emoji: isGolden ? '⭐' : undefined,
      };
      state.particles.push(p);
    }
  }
}
