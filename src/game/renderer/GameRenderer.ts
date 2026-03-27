import type { GameState, LevelConfig, FallingItem, Order, Particle } from '../../types/game';

const W = 800;
const H = 600;
const BASKET_Y = H - 70;
const CONVEYOR_HEIGHT = 24;

export class GameRenderer {
  private ctx: CanvasRenderingContext2D;
  private bgGradientCache: Map<string, CanvasGradient> = new Map();
  private starField: { x: number; y: number; size: number; speed: number; alpha: number }[] = [];

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
    // Generate star field for background
    for (let i = 0; i < 60; i++) {
      this.starField.push({
        x: Math.random() * W,
        y: Math.random() * H,
        size: 0.5 + Math.random() * 1.5,
        speed: 0.1 + Math.random() * 0.3,
        alpha: 0.2 + Math.random() * 0.5,
      });
    }
  }

  /** Build a Set of emojis that appear in any active (non-completed) order */
  private getWantedEmojis(state: GameState): Set<string> {
    const wanted = new Set<string>();
    for (const order of state.orders) {
      if (order.completed) continue;
      for (const req of order.items) {
        if (req.caught < req.required) {
          wanted.add(req.def.emoji);
        }
      }
    }
    return wanted;
  }

  render(state: GameState, level: LevelConfig) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, W, H);

    const wantedEmojis = this.getWantedEmojis(state);

    this.drawBackground(level);
    this.drawColumns();
    this.drawConveyor(level);
    this.drawCatchZone(state, level);
    this.drawItems(state, wantedEmojis);
    this.drawPlayer(state, level);
    this.drawParticles(state);
    this.drawUI(state, level);

    if (state.boostActive) {
      this.drawBoostEffect(state);
    }

    if (state.notification && state.notificationTimer > 0) {
      this.drawNotification(state);
    }

    if (state.showLevelIntro) {
      this.drawLevelIntro(state, level);
    }
  }

  // ── Background ──────────────────────────────────────────────

  private drawBackground(level: LevelConfig) {
    const ctx = this.ctx;
    const key = level.id;
    if (!this.bgGradientCache.has(key)) {
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, level.colors.background);
      grad.addColorStop(0.6, this.blendColor(level.colors.background, '#0F172A', 0.5));
      grad.addColorStop(1, '#0F172A');
      this.bgGradientCache.set(key, grad);
    }
    ctx.fillStyle = this.bgGradientCache.get(key)!;
    ctx.fillRect(0, 0, W, H);

    // Animated star field
    const t = Date.now() / 1000;
    for (const star of this.starField) {
      const twinkle = Math.sin(t * star.speed * 5 + star.x) * 0.3 + 0.7;
      ctx.globalAlpha = star.alpha * twinkle;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Subtle vignette
    const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.8);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.4)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);
  }

  /** Subtle column guides so player can see lanes */
  private drawColumns() {
    const ctx = this.ctx;
    ctx.strokeStyle = 'rgba(255,255,255,0.025)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 8; i++) {
      const x = (W / 8) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H - CONVEYOR_HEIGHT);
      ctx.stroke();
    }
  }

  // ── Conveyor Belt ───────────────────────────────────────────

  private drawConveyor(level: LevelConfig) {
    const ctx = this.ctx;
    const y = H - CONVEYOR_HEIGHT;

    // Belt body
    const beltGrad = ctx.createLinearGradient(0, y, 0, H);
    beltGrad.addColorStop(0, '#4B5563');
    beltGrad.addColorStop(0.3, '#374151');
    beltGrad.addColorStop(1, '#1F2937');
    ctx.fillStyle = beltGrad;
    ctx.fillRect(0, y, W, CONVEYOR_HEIGHT);

    // Animated rollers
    const t = Date.now() / 150;
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    for (let x = (t % 24) - 24; x < W; x += 24) {
      ctx.fillRect(x, y + 3, 12, CONVEYOR_HEIGHT - 6);
    }

    // Top edge - colored accent line
    const edgeGrad = ctx.createLinearGradient(0, y, W, y);
    edgeGrad.addColorStop(0, level.colors.secondary);
    edgeGrad.addColorStop(0.5, level.colors.primary);
    edgeGrad.addColorStop(1, level.colors.secondary);
    ctx.fillStyle = edgeGrad;
    ctx.fillRect(0, y, W, 3);

    // Metal bolts
    ctx.fillStyle = '#6B7280';
    for (let x = 20; x < W; x += 80) {
      ctx.beginPath();
      ctx.arc(x, y + CONVEYOR_HEIGHT / 2, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── Catch Zone indicator ────────────────────────────────────

  private drawCatchZone(state: GameState, level: LevelConfig) {
    const ctx = this.ctx;
    const p = state.player;
    const left = p.x - p.width / 2;

    // Subtle glow zone above basket
    const zoneGrad = ctx.createLinearGradient(0, BASKET_Y - 60, 0, BASKET_Y);
    zoneGrad.addColorStop(0, 'rgba(255,255,255,0)');
    zoneGrad.addColorStop(1, `${level.colors.primary}15`);
    ctx.fillStyle = zoneGrad;
    ctx.fillRect(left - 5, BASKET_Y - 60, p.width + 10, 60);
  }

  // ── Food Items ──────────────────────────────────────────────

  private drawItems(state: GameState, wantedEmojis: Set<string>) {
    for (const item of state.items) {
      if (item.caught || item.missed) continue;
      const isWanted = !item.isSpoiled && !item.isGolden && wantedEmojis.has(item.def.emoji);
      this.drawFoodItem(item, isWanted);
    }
  }

  private drawFoodItem(item: FallingItem, isWanted: boolean) {
    const ctx = this.ctx;
    const wobble = Math.sin(item.wobblePhase) * 8;
    const t = Date.now() / 1000;

    ctx.save();
    ctx.translate(item.x + wobble * 0.3, item.y);
    ctx.rotate(item.rotation * 0.15);

    // ── Wanted item highlight (pulsing blue ring) ──
    if (isWanted) {
      const pulse = 0.6 + Math.sin(t * 4) * 0.4;
      ctx.shadowColor = '#2D5BFF';
      ctx.shadowBlur = 12 * pulse;
      ctx.strokeStyle = `rgba(45, 91, 255, ${0.5 * pulse})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.stroke();

      // Small down-arrow hint
      ctx.fillStyle = `rgba(45, 91, 255, ${0.6 * pulse})`;
      ctx.font = '10px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('▼', 0, -26);

      ctx.shadowBlur = 0;
    }

    // ── Golden glow ──
    if (item.isGolden) {
      const pulse = 0.7 + Math.sin(t * 5) * 0.3;
      ctx.shadowColor = '#F59E0B';
      ctx.shadowBlur = 18 * pulse;

      // Gold ring
      ctx.strokeStyle = `rgba(245, 158, 11, ${0.6 * pulse})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.stroke();
    }

    // ── Spoiled aura ──
    if (item.isSpoiled) {
      ctx.shadowColor = '#22C55E';
      ctx.shadowBlur = 14;

      // Toxic green circle behind
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = '#22C55E';
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Skull indicator
      ctx.font = '12px serif';
      ctx.textAlign = 'center';
      ctx.fillText('💀', 0, -24);
    }

    // ── Main emoji ──
    ctx.shadowBlur = 0;
    ctx.font = '34px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.def.emoji, 0, 0);

    // ── Golden star badge ──
    if (item.isGolden) {
      ctx.font = '14px serif';
      ctx.fillText('⭐', 16, -16);
    }

    // ── Spoiled flies ──
    if (item.isSpoiled) {
      ctx.font = '11px serif';
      ctx.fillText('🪰', Math.cos(t * 3) * 20, Math.sin(t * 3) * 14 - 10);
      ctx.fillText('🪰', Math.cos(t * 3 + 2) * 16, Math.sin(t * 3 + 2) * 12 + 10);
    }

    ctx.restore();
  }

  // ── Player Basket ───────────────────────────────────────────

  private drawPlayer(state: GameState, level: LevelConfig) {
    const ctx = this.ctx;
    const p = state.player;
    const left = p.x - p.width / 2;
    const bh = 44; // basket height

    // Drop shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    this.fillRoundedTrapezoid(left + 5, BASKET_Y + 5, p.width, bh, 10, 10);

    // Main body gradient
    const bodyGrad = ctx.createLinearGradient(left, BASKET_Y, left, BASKET_Y + bh);
    bodyGrad.addColorStop(0, level.colors.primary);
    bodyGrad.addColorStop(0.5, level.colors.secondary);
    bodyGrad.addColorStop(1, this.blendColor(level.colors.secondary, '#000', 0.3));
    ctx.fillStyle = bodyGrad;
    this.fillRoundedTrapezoid(left, BASKET_Y, p.width, bh, 10, 8);

    // Inner highlight
    const innerGrad = ctx.createLinearGradient(left, BASKET_Y, left, BASKET_Y + 12);
    innerGrad.addColorStop(0, 'rgba(255,255,255,0.25)');
    innerGrad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = innerGrad;
    this.fillRoundedTrapezoid(left + 3, BASKET_Y + 2, p.width - 6, 14, 8, 0);

    // Rim / edge line
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(left + 10, BASKET_Y + 1);
    ctx.lineTo(left + p.width - 10, BASKET_Y + 1);
    ctx.stroke();

    // Cart icon
    ctx.font = '26px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🛒', p.x, BASKET_Y + bh / 2 + 2);

    // Side handles
    ctx.strokeStyle = level.colors.primary;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    // left handle
    ctx.beginPath();
    ctx.moveTo(left + 4, BASKET_Y + 8);
    ctx.lineTo(left - 4, BASKET_Y - 4);
    ctx.stroke();
    // right handle
    ctx.beginPath();
    ctx.moveTo(left + p.width - 4, BASKET_Y + 8);
    ctx.lineTo(left + p.width + 4, BASKET_Y - 4);
    ctx.stroke();
    ctx.lineCap = 'butt';
  }

  /** Draw a rounded trapezoid (narrower at bottom, like a basket) */
  private fillRoundedTrapezoid(x: number, y: number, w: number, h: number, r: number, inset: number) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w - inset, y + h);
    ctx.lineTo(x + inset, y + h);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
  }

  // ── Particles ───────────────────────────────────────────────

  private drawParticles(state: GameState) {
    const ctx = this.ctx;

    for (const p of state.particles) {
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;

      if (p.emoji) {
        ctx.font = `${p.size * 3}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.emoji, p.x, p.y);
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  // ── HUD / UI ────────────────────────────────────────────────

  private drawUI(state: GameState, level: LevelConfig) {
    const ctx = this.ctx;

    // ── Top bar background ──
    const topBarGrad = ctx.createLinearGradient(0, 0, 0, 42);
    topBarGrad.addColorStop(0, 'rgba(15,23,42,0.8)');
    topBarGrad.addColorStop(1, 'rgba(15,23,42,0)');
    ctx.fillStyle = topBarGrad;
    ctx.fillRect(0, 0, W, 42);

    // Score
    ctx.fillStyle = '#F8FAFC';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`${this.formatNumber(state.score)}`, 15, 12);
    ctx.fillStyle = 'rgba(248,250,252,0.4)';
    ctx.font = '11px system-ui, sans-serif';
    ctx.fillText('SCORE', 15, 0);

    // Lives
    ctx.font = '22px serif';
    ctx.textAlign = 'center';
    const livesStr = '❤️'.repeat(state.lives) + '🖤'.repeat(Math.max(0, 3 - state.lives));
    ctx.fillText(livesStr, W / 2, 10);

    // Level name
    ctx.fillStyle = level.colors.primary;
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(level.displayName, W - 15, 14);

    // Level timer bar
    const elapsed = state.elapsedTime;
    const total = 60;
    const pct = Math.min(elapsed / total, 1);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(W - 160, 34, 145, 4);
    ctx.fillStyle = level.colors.primary;
    ctx.fillRect(W - 160, 34, 145 * pct, 4);

    // Combo
    if (state.combo >= 3) {
      ctx.fillStyle = '#F59E0B';
      ctx.font = 'bold 20px system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.shadowColor = '#F59E0B';
      ctx.shadowBlur = 8;
      ctx.fillText(`COMBO x${state.combo}`, W - 15, 52);
      ctx.shadowBlur = 0;
    }

    // Boost indicator
    ctx.textAlign = 'right';
    ctx.font = '13px system-ui, sans-serif';
    if (state.boostActive) {
      ctx.fillStyle = '#F59E0B';
      ctx.fillText(`🧲 BOOST ${state.boostTimer.toFixed(1)}s`, W - 15, 72);
    } else if (state.boostAvailable) {
      ctx.fillStyle = 'rgba(248,250,252,0.35)';
      ctx.fillText('[Leertaste] 🧲 Magnet', W - 15, 72);
    }

    // Orders
    this.drawOrders(state, level);
  }

  // ── Orders Panel ────────────────────────────────────────────

  private drawOrders(state: GameState, level: LevelConfig) {
    const ctx = this.ctx;
    const startY = 48;
    const panelW = 220;
    const itemH = 72;

    ctx.textAlign = 'left';

    for (let i = 0; i < state.orders.length; i++) {
      const order = state.orders[i];
      const y = startY + i * (itemH + 6);

      // Panel background with subtle border
      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.strokeStyle = order.completed
        ? '#22C55E'
        : i === 0
          ? `${level.colors.primary}60`
          : 'rgba(255,255,255,0.08)';
      ctx.lineWidth = i === 0 && !order.completed ? 1.5 : 1;
      this.roundRect(12, y, panelW, itemH, 8);

      // "FANGE:" label
      ctx.fillStyle = i === 0 ? level.colors.primary : 'rgba(248,250,252,0.4)';
      ctx.font = 'bold 10px system-ui, sans-serif';
      ctx.fillText(i === 0 ? '▶ FANGE:' : 'FANGE:', 20, y + 14);

      // Order items – bigger emojis with count badges
      let ix = 22;
      for (const req of order.items) {
        const done = req.caught >= req.required;

        // Emoji
        ctx.font = '22px serif';
        ctx.textAlign = 'center';
        ctx.fillText(req.def.emoji, ix + 12, y + 36);

        // Count badge
        ctx.font = 'bold 11px system-ui, sans-serif';
        ctx.textAlign = 'center';
        if (done) {
          ctx.fillStyle = '#22C55E';
          ctx.fillText('✓', ix + 12, y + 54);
        } else {
          ctx.fillStyle = '#F8FAFC';
          ctx.fillText(`${req.caught}/${req.required}`, ix + 12, y + 54);
        }

        ix += 46;
      }
      ctx.textAlign = 'left';

      // Progress bar
      const total = order.items.reduce((s, r) => s + r.required, 0);
      const caught = order.items.reduce((s, r) => s + Math.min(r.caught, r.required), 0);
      const progress = total > 0 ? caught / total : 0;
      const barW = panelW - 20;
      const barY = y + itemH - 8;

      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      this.fillPill(22, barY, barW, 5);
      if (progress > 0) {
        ctx.fillStyle = order.completed ? '#22C55E' : level.colors.primary;
        this.fillPill(22, barY, barW * progress, 5);
      }
    }
  }

  private fillPill(x: number, y: number, w: number, h: number) {
    const ctx = this.ctx;
    const r = h / 2;
    if (w < h) return;
    ctx.beginPath();
    ctx.arc(x + r, y + r, r, Math.PI * 0.5, Math.PI * 1.5);
    ctx.arc(x + w - r, y + r, r, Math.PI * 1.5, Math.PI * 0.5);
    ctx.closePath();
    ctx.fill();
  }

  // ── Notifications ───────────────────────────────────────────

  private drawNotification(state: GameState) {
    const ctx = this.ctx;
    const alpha = Math.min(1, state.notificationTimer);
    const yOffset = (1 - alpha) * -30;
    const scale = 0.8 + alpha * 0.2;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(W / 2, H / 2 - 80 + yOffset);
    ctx.scale(scale, scale);

    // Glow background pill
    ctx.fillStyle = 'rgba(34, 197, 94, 0.2)';
    const tw = ctx.measureText(state.notification).width + 40;
    this.fillPill(-tw / 2, -18, tw, 36);

    ctx.fillStyle = '#22C55E';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#22C55E';
    ctx.shadowBlur = 12;
    ctx.fillText(state.notification, 0, 0);

    ctx.restore();
  }

  // ── Boost Effect ────────────────────────────────────────────

  private drawBoostEffect(state: GameState) {
    const ctx = this.ctx;
    const p = state.player;
    const t = Date.now() / 500;

    // Pulsing magnetic field
    const pulse = 0.5 + Math.sin(t * 3) * 0.3;
    ctx.strokeStyle = `rgba(245, 158, 11, ${0.15 + pulse * 0.15})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);

    ctx.beginPath();
    ctx.arc(p.x, BASKET_Y, 150, Math.PI * 1.15, Math.PI * 1.85, true);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(p.x, BASKET_Y, 120, Math.PI * 1.2, Math.PI * 1.8, true);
    ctx.stroke();

    ctx.setLineDash([]);

    // Magnet icon above basket
    ctx.font = '18px serif';
    ctx.textAlign = 'center';
    ctx.globalAlpha = 0.6 + pulse * 0.4;
    ctx.fillText('🧲', p.x, BASKET_Y - 20);
    ctx.globalAlpha = 1;
  }

  // ── Level Intro ─────────────────────────────────────────────

  private drawLevelIntro(state: GameState, level: LevelConfig) {
    const ctx = this.ctx;
    const alpha = Math.min(1, state.levelIntroTimer);
    const scale = 0.9 + alpha * 0.1;

    ctx.fillStyle = `rgba(15, 23, 42, ${0.75 * alpha})`;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(W / 2, H / 2);
    ctx.scale(scale, scale);

    // Level emoji big
    ctx.font = '64px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(level.emoji, 0, -50);

    // Level name
    ctx.fillStyle = '#F8FAFC';
    ctx.font = 'bold 42px system-ui, sans-serif';
    ctx.fillText(level.name, 0, 10);

    // Subtitle
    ctx.font = '18px system-ui, sans-serif';
    ctx.fillStyle = level.colors.primary;
    ctx.fillText(`Level ${state.levelIndex + 1}`, 0, 48);

    // Hint
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(248,250,252,0.4)';
    ctx.fillText('Fange die Zutaten der Bestellungen!', 0, 80);

    ctx.restore();
  }

  // ── Helpers ─────────────────────────────────────────────────

  private roundRect(x: number, y: number, w: number, h: number, r: number) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  private formatNumber(n: number): string {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "'");
  }

  /** Simple hex color blend */
  private blendColor(c1: string, c2: string, t: number): string {
    const h2r = (h: string) => {
      const n = parseInt(h.slice(1), 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    };
    const [r1, g1, b1] = h2r(c1);
    const [r2, g2, b2] = h2r(c2);
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    return `rgb(${r},${g},${b})`;
  }
}
