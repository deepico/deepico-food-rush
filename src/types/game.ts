export interface FoodItemDef {
  name: string;
  emoji: string;
  weight: number;
}

export interface LevelConfig {
  id: string;
  name: string;
  displayName: string;
  emoji: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
  };
  items: FoodItemDef[];
  baseSpeed: number;
  spawnInterval: number;
  spoiledChance: number;
  goldenChance: number;
}

export interface FallingItem {
  id: number;
  def: FoodItemDef;
  x: number;
  y: number;
  column: number;
  speed: number;
  rotation: number;
  rotationSpeed: number;
  wobblePhase: number;
  isSpoiled: boolean;
  isGolden: boolean;
  caught: boolean;
  missed: boolean;
  /** Timestamp when item was spawned – items spawned before an order change get grace */
  spawnTime: number;
}

export interface Order {
  id: number;
  items: { def: FoodItemDef; required: number; caught: number }[];
  completed: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  emoji?: string;
}

export interface Player {
  x: number;
  width: number;
  targetX: number;
  speed: number;
}

export type GameStatus = 'menu' | 'playing' | 'paused' | 'levelComplete' | 'gameOver';

export interface GameState {
  score: number;
  lives: number;
  levelIndex: number;
  combo: number;
  maxCombo: number;
  items: FallingItem[];
  orders: Order[];
  player: Player;
  particles: Particle[];
  boostAvailable: boolean;
  boostActive: boolean;
  boostTimer: number;
  gameStatus: GameStatus;
  itemsCaught: number;
  itemsMissed: number;
  orderItemsCaught: number;
  ordersCompleted: number;
  spoiledCaught: number;
  spoiledStreak: number;
  totalItemsSpawned: number;
  elapsedTime: number;
  levelScore: number;
  showLevelIntro: boolean;
  levelIntroTimer: number;
  notification: string;
  notificationTimer: number;
  /** Timestamp of last order change – for grace period on new orders */
  lastOrderChangeTime: number;
}

export interface HighScore {
  id: string;
  player_name: string;
  score: number;
  level_reached: string;
  orders_completed: number;
  accuracy: number;
  items_caught: number;
  created_at: string;
}

export interface InputState {
  left: boolean;
  right: boolean;
  boost: boolean;
  pause: boolean;
  restart: boolean;
}
