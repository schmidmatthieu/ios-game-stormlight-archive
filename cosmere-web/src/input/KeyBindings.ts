// KeyBindings — Rebindable keyboard configuration with LocalStorage persistence

export type GameAction =
  | 'moveUp'
  | 'moveDown'
  | 'moveLeft'
  | 'moveRight'
  | 'skill1'
  | 'skill2'
  | 'skill3'
  | 'skill4'
  | 'attack'
  | 'ultimate'
  | 'potion1'
  | 'potion2'
  | 'potion3'
  | 'interact'
  | 'inventory'
  | 'pause';

export const ACTION_LABELS: Record<GameAction, string> = {
  moveUp: 'Haut',
  moveDown: 'Bas',
  moveLeft: 'Gauche',
  moveRight: 'Droite',
  skill1: 'Sort 1',
  skill2: 'Sort 2',
  skill3: 'Sort 3',
  skill4: 'Sort 4',
  attack: 'Attaque',
  ultimate: 'Ultimate',
  potion1: 'Potion 1',
  potion2: 'Potion 2',
  potion3: 'Potion 3',
  interact: 'Interaction',
  inventory: 'Inventaire',
  pause: 'Pause',
};

export const DEFAULT_BINDINGS: Record<GameAction, string> = {
  moveUp: 'ArrowUp',
  moveDown: 'ArrowDown',
  moveLeft: 'ArrowLeft',
  moveRight: 'ArrowRight',
  skill1: 'KeyQ',
  skill2: 'KeyW',
  skill3: 'KeyE',
  skill4: 'KeyR',
  attack: 'Space',
  ultimate: 'KeyF',
  potion1: 'Digit1',
  potion2: 'Digit2',
  potion3: 'Digit3',
  interact: 'KeyG',
  inventory: 'Tab',
  pause: 'Escape',
};

const STORAGE_KEY = 'cosmere_keybindings';

const ALL_ACTIONS: GameAction[] = [
  'moveUp', 'moveDown', 'moveLeft', 'moveRight',
  'skill1', 'skill2', 'skill3', 'skill4',
  'attack', 'ultimate',
  'potion1', 'potion2', 'potion3',
  'interact', 'inventory', 'pause',
];

export class KeyBindings {
  private bindings: Record<GameAction, string>;
  private reverseMap: Map<string, GameAction>;

  constructor() {
    this.bindings = { ...DEFAULT_BINDINGS };
    this.reverseMap = new Map();
    this.load();
    this.rebuildReverseMap();
  }

  /** Returns the KeyboardEvent.code bound to the given action. */
  getKey(action: GameAction): string {
    return this.bindings[action];
  }

  /** Returns the GameAction bound to the given code, or null if unbound. */
  getAction(code: string): GameAction | null {
    return this.reverseMap.get(code) ?? null;
  }

  /** Rebinds an action to a new code. If the code is already used, swaps the bindings. */
  setKey(action: GameAction, code: string): void {
    const existingAction = this.reverseMap.get(code);

    if (existingAction != null && existingAction !== action) {
      // Swap: give the conflicting action the old key of the action being rebound
      const oldCode = this.bindings[action];
      this.bindings[existingAction] = oldCode;
    }

    this.bindings[action] = code;
    this.rebuildReverseMap();
  }

  /** Restores all bindings to their defaults. */
  resetDefaults(): void {
    this.bindings = { ...DEFAULT_BINDINGS };
    this.rebuildReverseMap();
  }

  /** Persists current bindings to LocalStorage. */
  save(): void {
    try {
      const data = JSON.stringify(this.bindings);
      localStorage.setItem(STORAGE_KEY, data);
    } catch {
      // LocalStorage may be unavailable (private browsing, quota exceeded, etc.)
    }
  }

  /** Loads bindings from LocalStorage. Falls back to defaults on failure. */
  load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw == null) return;

      const parsed: unknown = JSON.parse(raw);
      if (typeof parsed !== 'object' || parsed == null) return;

      const record = parsed as Record<string, unknown>;

      for (const action of ALL_ACTIONS) {
        const value = record[action];
        if (typeof value === 'string') {
          this.bindings[action] = value;
        }
      }
    } catch {
      // Corrupted data — keep current (default) bindings
    }
  }

  private rebuildReverseMap(): void {
    this.reverseMap.clear();
    for (const action of ALL_ACTIONS) {
      this.reverseMap.set(this.bindings[action], action);
    }
  }
}

/** Converts a KeyboardEvent.code to a human-readable French label. */
export function keyCodeToLabel(code: string): string {
  // Special keys
  const specialKeys: Record<string, string> = {
    ArrowUp: '\u2191',
    ArrowDown: '\u2193',
    ArrowLeft: '\u2190',
    ArrowRight: '\u2192',
    Space: 'Espace',
    Tab: 'Tab',
    Escape: '\u00C9chap',
    Enter: 'Entr\u00E9e',
    Backspace: 'Retour',
    ShiftLeft: 'Maj G',
    ShiftRight: 'Maj D',
    ControlLeft: 'Ctrl G',
    ControlRight: 'Ctrl D',
    AltLeft: 'Alt G',
    AltRight: 'Alt D',
    MetaLeft: 'Cmd G',
    MetaRight: 'Cmd D',
    CapsLock: 'Verr. Maj',
    Delete: 'Suppr',
  };

  if (code in specialKeys) {
    return specialKeys[code];
  }

  // Letter keys: "KeyQ" → "Q"
  if (code.startsWith('Key')) {
    return code.slice(3);
  }

  // Digit keys: "Digit1" → "1"
  if (code.startsWith('Digit')) {
    return code.slice(5);
  }

  // Numpad keys: "Numpad0" → "Num 0"
  if (code.startsWith('Numpad')) {
    return `Num ${code.slice(6)}`;
  }

  // Function keys: "F1" → "F1" (already readable)
  if (/^F\d+$/.test(code)) {
    return code;
  }

  // Fallback: return the code as-is
  return code;
}
