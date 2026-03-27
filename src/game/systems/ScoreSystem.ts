import type { GameState, FallingItem } from '../../types/game';
import type { OrderSystem } from './OrderSystem';

const POINTS_CORRECT = 10;
const POINTS_WRONG = 2;
const POINTS_SPOILED = -15;
const POINTS_GOLDEN = 25;
const POINTS_ORDER_COMPLETE = 50;
const POINTS_MISSED = -5;
const POINTS_MISSED_ORDER = -10;
const COMBO_THRESHOLD = 3;
const COMBO_MULTIPLIER = 2;
const MAX_SPOILED_STREAK = 3;

export class ScoreSystem {
  processCaughtItems(state: GameState, orderSystem: OrderSystem) {
    // Build set of emojis currently wanted by active orders
    const wantedEmojis = new Set<string>();
    for (const order of state.orders) {
      if (order.completed) continue;
      for (const req of order.items) {
        if (req.caught < req.required) {
          wantedEmojis.add(req.def.emoji);
        }
      }
    }

    // Process caught items
    const newlyCaught = state.items.filter((i) => i.caught);
    for (const item of newlyCaught) {
      if ((item as any).__scored) continue;
      (item as any).__scored = true;

      state.itemsCaught++;

      if (item.isSpoiled) {
        this.handleSpoiled(state, item);
      } else if (item.isGolden) {
        this.handleGolden(state, item);
      } else {
        this.handleNormal(state, item, orderSystem);
      }
    }

    // Process missed items (max 1 life lost per frame to avoid instant death)
    let lifeLostThisFrame = false;
    const newlyMissed = state.items.filter((i) => i.missed && !(i as any).__missScored);
    for (const item of newlyMissed) {
      (item as any).__missScored = true;

      // Spoiled items missed = no penalty (good!)
      if (item.isSpoiled) continue;

      state.itemsMissed++;

      // Missed an item that was needed for an order → lose a life!
      // Grace: items spawned before the last order change don't count
      const hasGrace = item.spawnTime < state.lastOrderChangeTime;
      if (wantedEmojis.has(item.def.emoji) && !lifeLostThisFrame && !hasGrace) {
        lifeLostThisFrame = true;
        state.score += POINTS_MISSED_ORDER;
        state.lives--;
        state.combo = 0;
        state.notification = '💔 Bestellungs-Item verpasst!';
        state.notificationTimer = 1.2;
        if (state.lives <= 0) {
          state.gameStatus = 'gameOver';
        }
      } else if (!wantedEmojis.has(item.def.emoji)) {
        // Non-order item missed → small penalty only
        state.score += POINTS_MISSED;
      }
    }

    // Clamp score to 0 minimum
    if (state.score < 0) {
      state.score = 0;
    }
  }

  private handleSpoiled(state: GameState, _item: FallingItem) {
    state.score += POINTS_SPOILED;
    state.combo = 0;
    state.spoiledCaught++;
    state.spoiledStreak++;

    if (state.spoiledStreak >= MAX_SPOILED_STREAK) {
      state.lives--;
      state.spoiledStreak = 0;
      state.notification = '💀 3x Verdorbenes gefangen!';
      state.notificationTimer = 1.2;
      if (state.lives <= 0) {
        state.gameStatus = 'gameOver';
      }
    }
  }

  private handleGolden(state: GameState, _item: FallingItem) {
    const multiplier = state.combo >= COMBO_THRESHOLD ? COMBO_MULTIPLIER : 1;
    state.score += POINTS_GOLDEN * multiplier;
    state.combo++;
    state.maxCombo = Math.max(state.maxCombo, state.combo);
    state.spoiledStreak = 0;
  }

  private handleNormal(state: GameState, item: FallingItem, orderSystem: OrderSystem) {
    const { inOrder, orderCompleted } = orderSystem.checkCaughtItem(state, item.def);

    if (inOrder) {
      state.orderItemsCaught++;
      const multiplier = state.combo >= COMBO_THRESHOLD ? COMBO_MULTIPLIER : 1;
      state.score += POINTS_CORRECT * multiplier;
      state.combo++;
      state.maxCombo = Math.max(state.maxCombo, state.combo);

      if (orderCompleted) {
        state.score += POINTS_ORDER_COMPLETE;
        this.spawnConfetti(state);
      }
    } else {
      state.score += POINTS_WRONG;
      state.combo = 0;
    }
    state.spoiledStreak = 0;
  }

  private spawnConfetti(state: GameState) {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#F7DC6F', '#BB8FCE', '#82E0AA', '#F8C471'];
    const emojis = ['🎉', '⭐', '✨', '🏆'];
    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 * i) / 20 + Math.random() * 0.5;
      const speed = 150 + Math.random() * 200;
      state.particles.push({
        x: 400 + (Math.random() - 0.5) * 200,
        y: 250 + (Math.random() - 0.5) * 100,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 150,
        life: 0.8 + Math.random() * 0.5,
        maxLife: 1.3,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 3 + Math.random() * 4,
        emoji: i < 4 ? emojis[i] : undefined,
      });
    }
  }
}
