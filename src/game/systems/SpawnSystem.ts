import type { GameState, FallingItem, LevelConfig } from '../../types/game';

const CANVAS_WIDTH = 800;
const COLUMNS = 8;
const COLUMN_WIDTH = CANVAS_WIDTH / COLUMNS;

let nextId = 0;

export class SpawnSystem {
  private timer = 0;

  reset() {
    this.timer = 0;
    nextId = 0;
  }

  update(dt: number, state: GameState, level: LevelConfig) {
    this.timer += dt;

    if (this.timer >= level.spawnInterval) {
      this.timer -= level.spawnInterval;
      this.spawnItem(state, level);
    }
  }

  private spawnItem(state: GameState, level: LevelConfig) {
    const items = level.items;
    const def = items[Math.floor(Math.random() * items.length)];
    const column = Math.floor(Math.random() * COLUMNS);

    const isSpoiled = Math.random() < level.spoiledChance;
    const isGolden = !isSpoiled && Math.random() < level.goldenChance;

    const item: FallingItem = {
      id: nextId++,
      def,
      x: column * COLUMN_WIDTH + COLUMN_WIDTH / 2,
      y: -40,
      column,
      speed: level.baseSpeed * def.weight,
      rotation: 0,
      rotationSpeed: (Math.random() - 0.5) * 2,
      wobblePhase: Math.random() * Math.PI * 2,
      spawnTime: state.elapsedTime,
      isSpoiled,
      isGolden,
      caught: false,
      missed: false,
    };

    state.items.push(item);
    state.totalItemsSpawned++;
  }
}
