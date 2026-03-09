// KeyboardManager — Keyboard input handling with polling and action callbacks

import { KeyBindings, GameAction } from './KeyBindings';

export type ActionCallback = () => void;

const MOVEMENT_ACTIONS: ReadonlySet<GameAction> = new Set([
  'moveUp', 'moveDown', 'moveLeft', 'moveRight',
]);

const PREVENT_DEFAULT_KEYS: ReadonlySet<string> = new Set([
  'Tab', 'Space', 'Escape',
]);

export class KeyboardManager {
  private readonly bindings: KeyBindings;
  private readonly pressed: Set<string> = new Set();
  private readonly actionCallbacks: Map<GameAction, ActionCallback[]> = new Map();

  private enabled = true;
  private rebindResolve: ((code: string) => void) | null = null;
  private onKeyboardUsedCb: (() => void) | null = null;

  private readonly handleKeyDown: (e: KeyboardEvent) => void;
  private readonly handleKeyUp: (e: KeyboardEvent) => void;
  private readonly handleBlur: () => void;

  constructor(bindings: KeyBindings) {
    this.bindings = bindings;

    this.handleKeyDown = (e: KeyboardEvent) => this.onKeyDown(e);
    this.handleKeyUp = (e: KeyboardEvent) => this.onKeyUp(e);
    this.handleBlur = () => this.pressed.clear();

    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
  }

  // --- Movement polling ---

  isMoving(): boolean {
    const up = this.bindings.getKey('moveUp');
    const down = this.bindings.getKey('moveDown');
    const left = this.bindings.getKey('moveLeft');
    const right = this.bindings.getKey('moveRight');

    return (
      this.pressed.has(up) ||
      this.pressed.has(down) ||
      this.pressed.has(left) ||
      this.pressed.has(right)
    );
  }

  getDirection(): { x: number; y: number } {
    let x = 0;
    let y = 0;

    if (this.pressed.has(this.bindings.getKey('moveLeft'))) x -= 1;
    if (this.pressed.has(this.bindings.getKey('moveRight'))) x += 1;
    if (this.pressed.has(this.bindings.getKey('moveUp'))) y -= 1;
    if (this.pressed.has(this.bindings.getKey('moveDown'))) y += 1;

    // Normalize diagonals
    if (x !== 0 && y !== 0) {
      const inv = 1 / Math.SQRT2;
      x *= inv;
      y *= inv;
    }

    return { x, y };
  }

  // --- Action callbacks ---

  onAction(action: GameAction, cb: ActionCallback): void {
    let list = this.actionCallbacks.get(action);
    if (list == null) {
      list = [];
      this.actionCallbacks.set(action, list);
    }
    list.push(cb);
  }

  // --- Input mode detection ---

  setOnKeyboardUsed(cb: () => void): void {
    this.onKeyboardUsedCb = cb;
  }

  // --- Rebind support ---

  waitForKey(): Promise<string> {
    return new Promise<string>((resolve) => {
      this.rebindResolve = resolve;
    });
  }

  // --- Enable / disable ---

  setEnabled(v: boolean): void {
    this.enabled = v;
    if (!v) {
      this.pressed.clear();
    }
  }

  // --- Cleanup ---

  destroy(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    this.pressed.clear();
    this.actionCallbacks.clear();
    this.rebindResolve = null;
    this.onKeyboardUsedCb = null;
  }

  // --- Private event handlers ---

  private onKeyDown(e: KeyboardEvent): void {
    if (!this.enabled) return;

    // Rebind mode: capture the next key and return early
    if (this.rebindResolve != null) {
      e.preventDefault();
      const resolve = this.rebindResolve;
      this.rebindResolve = null;
      resolve(e.code);
      return;
    }

    // Notify keyboard usage
    if (this.onKeyboardUsedCb != null) {
      this.onKeyboardUsedCb();
    }

    const code = e.code;
    const action = this.bindings.getAction(code);

    // Prevent browser defaults for game-bound keys
    if (action != null && PREVENT_DEFAULT_KEYS.has(code)) {
      e.preventDefault();
    }

    // Skip key repeats
    if (e.repeat) return;

    this.pressed.add(code);

    // Fire action callback for non-movement actions
    if (action != null && !MOVEMENT_ACTIONS.has(action)) {
      const callbacks = this.actionCallbacks.get(action);
      if (callbacks != null) {
        for (const cb of callbacks) {
          cb();
        }
      }
    }
  }

  private onKeyUp(e: KeyboardEvent): void {
    if (!this.enabled) return;
    this.pressed.delete(e.code);
  }
}
