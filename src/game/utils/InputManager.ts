import type { InputState } from '../../types/game';

export class InputManager {
  private keys: Set<string> = new Set();
  private justPressed: Set<string> = new Set();

  constructor() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (['ArrowLeft', 'ArrowRight', ' ', 'p', 'r'].includes(e.key)) {
      e.preventDefault();
    }
    if (!this.keys.has(e.key)) {
      this.justPressed.add(e.key);
    }
    this.keys.add(e.key);
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.key);
  };

  getState(): InputState {
    const state: InputState = {
      left: this.keys.has('ArrowLeft'),
      right: this.keys.has('ArrowRight'),
      boost: this.justPressed.has(' '),
      pause: this.justPressed.has('p') || this.justPressed.has('P'),
      restart: this.justPressed.has('r') || this.justPressed.has('R'),
    };
    this.justPressed.clear();
    return state;
  }

  destroy() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }
}
