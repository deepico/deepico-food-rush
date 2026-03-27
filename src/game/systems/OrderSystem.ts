import type { GameState, Order, LevelConfig, FoodItemDef } from '../../types/game';

let nextOrderId = 0;

export class OrderSystem {
  reset() {
    nextOrderId = 0;
  }

  update(state: GameState, level: LevelConfig) {
    const hadCompleted = state.orders.some((o) => o.completed);

    // Remove completed orders
    state.orders = state.orders.filter((o) => !o.completed);

    // Ensure we always have 1-2 active orders
    while (state.orders.length < 2) {
      state.orders.push(this.generateOrder(level, state.levelIndex));
    }

    // Mark time of order change for grace period
    if (hadCompleted) {
      state.lastOrderChangeTime = state.elapsedTime;
    }
  }

  checkCaughtItem(state: GameState, itemDef: FoodItemDef): { inOrder: boolean; orderCompleted: boolean } {
    for (const order of state.orders) {
      if (order.completed) continue;
      for (const req of order.items) {
        if (req.def.emoji === itemDef.emoji && req.caught < req.required) {
          req.caught++;
          // Check if order is complete
          const complete = order.items.every((r) => r.caught >= r.required);
          if (complete) {
            order.completed = true;
            state.ordersCompleted++;
            return { inOrder: true, orderCompleted: true };
          }
          return { inOrder: true, orderCompleted: false };
        }
      }
    }
    return { inOrder: false, orderCompleted: false };
  }

  private generateOrder(level: LevelConfig, levelIndex: number): Order {
    const items = level.items;
    const numDistinct = Math.min(2 + Math.floor(levelIndex / 2), Math.min(4, items.length));
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, numDistinct);

    return {
      id: nextOrderId++,
      items: selected.map((def) => ({
        def,
        required: 1 + Math.floor(Math.random() * 3),
        caught: 0,
      })),
      completed: false,
    };
  }
}
