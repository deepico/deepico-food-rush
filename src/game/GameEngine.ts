import type { GameState, InputState, LevelConfig } from '../types/game';
import { SpawnSystem } from './systems/SpawnSystem';
import { PhysicsSystem } from './systems/PhysicsSystem';
import { ScoreSystem } from './systems/ScoreSystem';
import { OrderSystem } from './systems/OrderSystem';
import { GameRenderer } from './renderer/GameRenderer';
import { InputManager } from './utils/InputManager';
import { LEVELS, ENDLESS_LEVEL } from './levels/levels';

const CANVAS_WIDTH = 800;
const LEVEL_DURATION = 60; // seconds per level
const LEVEL_INTRO_DURATION = 2;
const BOOST_DURATION = 2;

export type GameEventCallback = (event: string, data?: any) => void;

export class GameEngine {
  private lastTime = 0;
  private running = false;
  private animFrameId = 0;

  private spawnSystem = new SpawnSystem();
  private physicsSystem = new PhysicsSystem();
  private scoreSystem = new ScoreSystem();
  private orderSystem = new OrderSystem();
  private renderer: GameRenderer;
  private canvas: HTMLCanvasElement;
  private input: InputManager;
  private onEvent: GameEventCallback;

  state: GameState;

  constructor(canvas: HTMLCanvasElement, onEvent: GameEventCallback) {
    this.canvas = canvas;
    this.renderer = new GameRenderer(canvas);
    this.input = new InputManager();
    this.onEvent = onEvent;
    this.state = this.createInitialState();
  }

  private createInitialState(): GameState {
    return {
      score: 0,
      lives: 3,
      levelIndex: 0,
      combo: 0,
      maxCombo: 0,
      items: [],
      orders: [],
      player: { x: CANVAS_WIDTH / 2, width: 120, targetX: CANVAS_WIDTH / 2, speed: 450 },
      particles: [],
      boostAvailable: true,
      boostActive: false,
      boostTimer: 0,
      gameStatus: 'menu',
      itemsCaught: 0,
      itemsMissed: 0,
      orderItemsCaught: 0,
      ordersCompleted: 0,
      spoiledCaught: 0,
      spoiledStreak: 0,
      totalItemsSpawned: 0,
      elapsedTime: 0,
      levelScore: 0,
      showLevelIntro: false,
      levelIntroTimer: 0,
      notification: '',
      notificationTimer: 0,
      lastOrderChangeTime: 0,
    };
  }

  getCurrentLevel(): LevelConfig {
    if (this.state.levelIndex >= LEVELS.length) {
      return ENDLESS_LEVEL;
    }
    return LEVELS[this.state.levelIndex];
  }

  startGame() {
    this.state = this.createInitialState();
    this.state.gameStatus = 'playing';
    this.state.showLevelIntro = true;
    this.state.levelIntroTimer = LEVEL_INTRO_DURATION;
    this.spawnSystem.reset();
    this.orderSystem.reset();
    this.onEvent('gameStart');

    if (!this.running) {
      this.running = true;
      this.lastTime = performance.now();
      this.animFrameId = requestAnimationFrame(this.loop);
    }
  }

  stop() {
    this.running = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
  }

  destroy() {
    this.stop();
    this.input.destroy();
  }

  // Render menu screen
  renderMenu() {
    if (!this.running) {
      this.running = true;
      this.lastTime = performance.now();
      this.state.gameStatus = 'menu';
      this.animFrameId = requestAnimationFrame(this.loop);
    }
  }

  private loop = (timestamp: number) => {
    if (!this.running) return;

    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05); // cap delta
    this.lastTime = timestamp;

    const inputState = this.input.getState();

    if (this.state.gameStatus === 'playing') {
      this.handlePlayingInput(inputState);
      this.update(dt);
    } else if (this.state.gameStatus === 'paused') {
      if (inputState.pause) {
        this.state.gameStatus = 'playing';
        this.onEvent('unpause');
      }
    } else if (this.state.gameStatus === 'gameOver') {
      if (inputState.restart) {
        this.startGame();
      }
    } else if (this.state.gameStatus === 'levelComplete') {
      // Wait for UI to handle transition
    }

    this.render();
    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private handlePlayingInput(input: InputState) {
    const state = this.state;

    // Movement
    if (input.left) {
      state.player.targetX -= 15;
    }
    if (input.right) {
      state.player.targetX += 15;
    }

    // Clamp target
    const halfW = state.player.width / 2;
    state.player.targetX = Math.max(halfW, Math.min(CANVAS_WIDTH - halfW, state.player.targetX));

    // Boost
    if (input.boost && state.boostAvailable && !state.boostActive) {
      state.boostActive = true;
      state.boostAvailable = false;
      state.boostTimer = BOOST_DURATION;
      this.onEvent('boost');
    }

    // Pause
    if (input.pause) {
      state.gameStatus = 'paused';
      this.onEvent('pause');
    }
  }

  private update(dt: number) {
    const state = this.state;
    const level = this.getCurrentLevel();

    // Level intro countdown
    if (state.showLevelIntro) {
      state.levelIntroTimer -= dt;
      if (state.levelIntroTimer <= 0) {
        state.showLevelIntro = false;
      }
      // Still render but don't spawn during intro
      this.physicsSystem.update(dt, state);
      return;
    }

    state.elapsedTime += dt;

    // Notification timer
    if (state.notificationTimer > 0) {
      state.notificationTimer -= dt;
      if (state.notificationTimer <= 0) {
        state.notification = '';
      }
    }

    // Track orders completed before processing
    const prevOrders = state.ordersCompleted;

    // Systems – order: spawn → physics → score → then refresh orders
    this.spawnSystem.update(dt, state, level);
    this.physicsSystem.update(dt, state);
    this.scoreSystem.processCaughtItems(state, this.orderSystem);
    this.orderSystem.update(state, level);

    // Check if a new order was completed
    if (state.ordersCompleted > prevOrders) {
      state.notification = '🎉 Bestellung komplett! +50';
      state.notificationTimer = 1.5;
    }

    // Check level transition
    if (state.elapsedTime >= LEVEL_DURATION && state.levelIndex < LEVELS.length) {
      this.advanceLevel();
    }

    // Notify state changes
    this.onEvent('stateUpdate', { ...state });
  }

  private advanceLevel() {
    const state = this.state;
    state.levelIndex++;
    state.elapsedTime = 0;
    state.items = [];
    state.boostAvailable = true;
    state.boostActive = false;
    state.levelScore = 0;
    state.spoiledStreak = 0;
    state.orders = [];

    if (state.levelIndex >= LEVELS.length) {
      // Entered endless mode
      state.showLevelIntro = true;
      state.levelIntroTimer = LEVEL_INTRO_DURATION;
      this.onEvent('endlessMode');
    } else {
      state.gameStatus = 'levelComplete';
      this.onEvent('levelComplete', {
        levelIndex: state.levelIndex - 1,
        nextLevel: LEVELS[state.levelIndex],
      });
    }

    this.spawnSystem.reset();
    this.orderSystem.reset();
  }

  continueToNextLevel() {
    const state = this.state;
    state.gameStatus = 'playing';
    state.showLevelIntro = true;
    state.levelIntroTimer = LEVEL_INTRO_DURATION;
    state.lastOrderChangeTime = state.elapsedTime;
    state.items = [];
    state.particles = [];
  }

  private render() {
    const level = this.getCurrentLevel();
    this.renderer.render(this.state, level);

    // Draw pause overlay on canvas
    if (this.state.gameStatus === 'paused') {
      this.drawPauseOverlay();
    }
  }

  private drawPauseOverlay() {
    const canvas = this.canvas;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#F8FAFC';
    ctx.font = 'bold 48px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⏸ PAUSE', canvas.width / 2, canvas.height / 2 - 20);

    ctx.font = '18px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(248, 250, 252, 0.6)';
    ctx.fillText('P drücken zum Weiterspielen', canvas.width / 2, canvas.height / 2 + 25);
  }
}
