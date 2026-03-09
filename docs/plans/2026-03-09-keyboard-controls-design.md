# Keyboard Controls & Key Bindings Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add full keyboard support (movement + actions + UI) with a configurable key bindings menu in the pause screen.

**Architecture:** A `KeyBindings` module stores default/custom mappings persisted in LocalStorage. A `KeyboardManager` listens for keyboard events and exposes pressed-key state + action triggers. ZoneScene integrates keyboard input alongside the existing joystick/touch system with auto-detection (hide touch UI when keyboard active, show again on touch).

**Tech Stack:** TypeScript, PixiJS v8, LocalStorage for persistence

---

### Task 1: Create KeyBindings data module

**Files:**
- Create: `cosmere-web/src/input/KeyBindings.ts`

**Step 1: Write KeyBindings module**

```typescript
// cosmere-web/src/input/KeyBindings.ts

export type GameAction =
  | 'moveUp' | 'moveDown' | 'moveLeft' | 'moveRight'
  | 'skill1' | 'skill2' | 'skill3' | 'skill4'
  | 'attack' | 'ultimate'
  | 'potion1' | 'potion2' | 'potion3'
  | 'interact'
  | 'inventory' | 'pause';

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

const STORAGE_KEY = 'cosmere_keybindings';

// Default bindings — QWERTZ Swiss layout (same positions as LoL QWERTY)
const DEFAULT_BINDINGS: Record<GameAction, string> = {
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

// Uses KeyboardEvent.code for layout-independent mapping
export class KeyBindings {
  private bindings: Record<GameAction, string>;

  constructor() {
    this.bindings = { ...DEFAULT_BINDINGS };
    this.load();
  }

  getKey(action: GameAction): string {
    return this.bindings[action];
  }

  getAction(code: string): GameAction | null {
    for (const [action, key] of Object.entries(this.bindings)) {
      if (key === code) return action as GameAction;
    }
    return null;
  }

  setKey(action: GameAction, code: string): void {
    // Swap if conflict: the other action gets this action's old key
    const conflicting = this.getAction(code);
    if (conflicting && conflicting !== action) {
      this.bindings[conflicting] = this.bindings[action];
    }
    this.bindings[action] = code;
    this.save();
  }

  resetDefaults(): void {
    this.bindings = { ...DEFAULT_BINDINGS };
    this.save();
  }

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.bindings));
    } catch { /* quota exceeded — silent */ }
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      // Merge: only overwrite known actions, ignore stale keys
      for (const action of Object.keys(DEFAULT_BINDINGS) as GameAction[]) {
        if (typeof parsed[action] === 'string') {
          this.bindings[action] = parsed[action];
        }
      }
    } catch { /* corrupted data — keep defaults */ }
  }
}

// Human-readable label for a KeyboardEvent.code
export function keyCodeToLabel(code: string): string {
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  const MAP: Record<string, string> = {
    ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→',
    Space: 'Espace', Tab: 'Tab', Escape: 'Echap', Enter: 'Entrée',
    ShiftLeft: 'Shift G', ShiftRight: 'Shift D',
    ControlLeft: 'Ctrl G', ControlRight: 'Ctrl D',
    AltLeft: 'Alt G', AltRight: 'Alt D',
    Backspace: 'Retour', Delete: 'Suppr',
  };
  return MAP[code] ?? code;
}
```

**Step 2: Verify the file compiles**

Run: `cd cosmere-web && npx tsc --noEmit src/input/KeyBindings.ts`

**Step 3: Commit**

```bash
git add cosmere-web/src/input/KeyBindings.ts
git commit -m "feat: add KeyBindings data module with QWERTZ defaults and LocalStorage persistence"
```

---

### Task 2: Create KeyboardManager

**Files:**
- Create: `cosmere-web/src/input/KeyboardManager.ts`

**Step 1: Write KeyboardManager**

```typescript
// cosmere-web/src/input/KeyboardManager.ts

import { KeyBindings } from './KeyBindings';
import type { GameAction } from './KeyBindings';

export type ActionCallback = () => void;

export class KeyboardManager {
  readonly bindings: KeyBindings;
  private pressedKeys = new Set<string>();
  private actionCallbacks = new Map<GameAction, ActionCallback>();
  private onKeyboardUsed: (() => void) | null = null;
  private enabled = true;
  private listeningForRebind = false;

  constructor(bindings: KeyBindings) {
    this.bindings = bindings;
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    // Clear keys on blur to prevent stuck keys
    window.addEventListener('blur', this.clearAll);
  }

  /** Set callback when any keyboard key is pressed (for auto-detect input mode) */
  setOnKeyboardUsed(cb: () => void): void {
    this.onKeyboardUsed = cb;
  }

  /** Register an action callback (for discrete actions like attack, skill, etc.) */
  onAction(action: GameAction, cb: ActionCallback): void {
    this.actionCallbacks.set(action, cb);
  }

  /** Check if a movement direction is currently held */
  isMoving(): boolean {
    return this.isPressed('moveUp') || this.isPressed('moveDown')
      || this.isPressed('moveLeft') || this.isPressed('moveRight');
  }

  /** Get normalized direction vector from arrow keys */
  getDirection(): { x: number; y: number } {
    let x = 0;
    let y = 0;
    if (this.isPressed('moveLeft')) x -= 1;
    if (this.isPressed('moveRight')) x += 1;
    if (this.isPressed('moveUp')) y -= 1;
    if (this.isPressed('moveDown')) y += 1;
    // Normalize diagonal
    if (x !== 0 && y !== 0) {
      const inv = 1 / Math.SQRT2;
      x *= inv;
      y *= inv;
    }
    return { x, y };
  }

  /** Temporarily pause keyboard processing (e.g. during rebind) */
  setEnabled(v: boolean): void { this.enabled = v; }

  /** Start listening for next key press for rebinding. Returns promise with the code. */
  waitForKey(): Promise<string> {
    this.listeningForRebind = true;
    return new Promise<string>((resolve) => {
      const handler = (e: KeyboardEvent) => {
        e.preventDefault();
        e.stopPropagation();
        this.listeningForRebind = false;
        window.removeEventListener('keydown', handler, true);
        resolve(e.code);
      };
      window.addEventListener('keydown', handler, true);
    });
  }

  destroy(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.clearAll);
  }

  private isPressed(action: GameAction): boolean {
    return this.pressedKeys.has(this.bindings.getKey(action));
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (this.listeningForRebind) return;
    if (!this.enabled) return;

    // Prevent default for game keys (Tab, Space, etc.)
    const action = this.bindings.getAction(e.code);
    if (action) {
      e.preventDefault();
    }

    if (this.pressedKeys.has(e.code)) return; // Already held — skip repeat
    this.pressedKeys.add(e.code);

    this.onKeyboardUsed?.();

    // Fire discrete action on key DOWN (not movement — those are polled)
    if (action && !action.startsWith('move')) {
      this.actionCallbacks.get(action)?.();
    }
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    this.pressedKeys.delete(e.code);
  };

  private clearAll = (): void => {
    this.pressedKeys.clear();
  };
}
```

**Step 2: Verify compilation**

Run: `cd cosmere-web && npx tsc --noEmit src/input/KeyboardManager.ts`

**Step 3: Commit**

```bash
git add cosmere-web/src/input/KeyboardManager.ts
git commit -m "feat: add KeyboardManager with key polling, action callbacks, and rebind support"
```

---

### Task 3: Integrate keyboard movement into ZoneScene

**Files:**
- Modify: `cosmere-web/src/scenes/ZoneScene.ts`

**Step 1: Add imports and instance fields**

At the top of ZoneScene.ts (after existing imports ~line 77), add:
```typescript
import { KeyBindings } from '../input/KeyBindings';
import { KeyboardManager } from '../input/KeyboardManager';
```

In the class body (near other private fields ~line 250), add:
```typescript
private keyBindings = new KeyBindings();
private keyboard = new KeyboardManager(this.keyBindings);
private inputMode: 'touch' | 'keyboard' = 'touch';
```

**Step 2: Wire up auto-detection and input mode switching**

In the `init()` method (after action buttons setup, ~line 478), add:
```typescript
// Keyboard → hide touch UI
this.keyboard.setOnKeyboardUsed(() => {
  if (this.inputMode !== 'keyboard') {
    this.inputMode = 'keyboard';
    this.joystick.visible = false;
    this.actionButtons.visible = false;
  }
});
```

Also add a pointerdown listener on the stage/uiContainer to detect return to touch:
```typescript
this.uiContainer.on('pointerdown', () => {
  if (this.inputMode !== 'touch') {
    this.inputMode = 'touch';
    this.joystick.visible = true;
    this.actionButtons.visible = true;
  }
});
```

**Step 3: Modify handleMovement to support keyboard**

Replace `handleMovement` (~line 1079-1110) to add keyboard support:
```typescript
private handleMovement(dt: number): void {
  let dirX = 0;
  let dirY = 0;
  let magnitude = 0;

  // Keyboard takes priority if any movement key is pressed
  if (this.keyboard.isMoving()) {
    const dir = this.keyboard.getDirection();
    dirX = dir.x;
    dirY = dir.y;
    magnitude = 1; // Fixed speed for keyboard
  } else if (this.joystick.active && this.joystick.magnitude > 0) {
    dirX = this.joystick.direction.x;
    dirY = this.joystick.direction.y;
    magnitude = this.joystick.magnitude;
  }

  if (magnitude === 0) return;

  const speedMult = this.playerStatusEffects.getSpeedMultiplier() * getCompanionSpeedBonus();
  const dx = dirX * this.playerSpeed * dt * magnitude * speedMult;
  const dy = dirY * this.playerSpeed * dt * magnitude * speedMult;

  if (dx > 0.5) this.playerFacing = 'right';
  else if (dx < -0.5) this.playerFacing = 'left';

  const newX = this.playerScreenPos.x + dx;
  const newY = this.playerScreenPos.y + dy;
  const iso = screenToIso(newX, newY);
  const clampedCol = Math.max(0.5, Math.min(this.zone.gridWidth - 1.5, iso.col));
  const clampedRow = Math.max(0.5, Math.min(this.zone.gridHeight - 1.5, iso.row));
  const clamped = isoToScreen(clampedCol, clampedRow);
  this.playerScreenPos.x = clamped.x;
  this.playerScreenPos.y = clamped.y;
  this.playerGridPos = { col: Math.round(clampedCol), row: Math.round(clampedRow) };
  this.playerContainer.x = this.playerScreenPos.x;
  this.playerContainer.y = this.playerScreenPos.y;
}
```

**Step 4: Fix animation detection for keyboard movement**

In `updateAnimations` (~line 1118), replace the isMoving check:
```typescript
const isMoving = this.keyboard.isMoving() || (this.joystick.active && this.joystick.magnitude > 0);
```

**Step 5: Wire action callbacks for keyboard**

In `init()` after the keyboard auto-detection code, add:
```typescript
this.keyboard.onAction('attack', () => this.handleAttack());
this.keyboard.onAction('skill1', () => this.handleSkill(0));
this.keyboard.onAction('skill2', () => this.handleSkill(1));
this.keyboard.onAction('skill3', () => this.handleSkill(2));
this.keyboard.onAction('skill4', () => this.handleSkill(3));
this.keyboard.onAction('ultimate', () => this.handleUltimate());
this.keyboard.onAction('potion1', () => this.usePotion(0));
this.keyboard.onAction('potion2', () => this.usePotion(1));
this.keyboard.onAction('potion3', () => this.usePotion(2));
this.keyboard.onAction('interact', () => this.handleInteraction(this.actionButtons.currentMode));
this.keyboard.onAction('inventory', () => this.toggleInventory());
this.keyboard.onAction('pause', () => this.togglePause());
```

**Step 6: Clean up on scene destroy**

In the scene's destroy/cleanup method, add:
```typescript
this.keyboard.destroy();
```

**Step 7: Build and test**

Run: `cd cosmere-web && npm run build`
Expected: No errors

**Step 8: Commit**

```bash
git add cosmere-web/src/scenes/ZoneScene.ts
git commit -m "feat: integrate keyboard controls into ZoneScene with auto-detect input mode"
```

---

### Task 4: Create KeyBindingsPanel UI

**Files:**
- Create: `cosmere-web/src/ui/KeyBindingsPanel.ts`

**Step 1: Write the panel**

```typescript
// cosmere-web/src/ui/KeyBindingsPanel.ts

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { KeyboardManager } from '../input/KeyboardManager';
import { keyCodeToLabel, ACTION_LABELS } from '../input/KeyBindings';
import type { GameAction } from '../input/KeyBindings';
import { getLayoutInfo, fontSize, scaled, panelRadius, buttonHeight, UI_COLORS, UI_ALPHA } from './ResponsiveLayout';
import type { LayoutInfo } from './ResponsiveLayout';

const ALL_ACTIONS: GameAction[] = [
  'moveUp', 'moveDown', 'moveLeft', 'moveRight',
  'skill1', 'skill2', 'skill3', 'skill4',
  'attack', 'ultimate',
  'potion1', 'potion2', 'potion3',
  'interact', 'inventory', 'pause',
];

export function showKeyBindingsPanel(
  uiContainer: Container,
  screenW: number,
  screenH: number,
  keyboard: KeyboardManager,
  onClose: () => void,
): Container {
  const layout = getLayoutInfo(screenW, screenH);
  const panel = new Container();
  panel.zIndex = 10001;

  // Overlay
  const overlay = new Graphics();
  overlay.rect(0, 0, screenW, screenH).fill({ color: 0x000000, alpha: 0.7 });
  overlay.eventMode = 'static';
  panel.addChild(overlay);

  const radius = panelRadius(layout);
  const rowH = buttonHeight(layout);
  const rowSpacing = rowH + scaled(6, layout);
  const panelW = Math.min(scaled(340, layout), screenW - 40);
  const panelH = Math.min(scaled(60, layout) + ALL_ACTIONS.length * rowSpacing + scaled(50, layout), screenH - 40);
  const px = (screenW - panelW) / 2;
  const py = (screenH - panelH) / 2;

  // Panel background
  const bg = new Graphics();
  bg.roundRect(px, py, panelW, panelH, radius + 2)
    .fill({ color: UI_COLORS.panelBgAlt, alpha: 0.96 })
    .stroke({ color: UI_COLORS.borderAccent, width: 2, alpha: 0.7 });
  bg.eventMode = 'static';
  panel.addChild(bg);

  // Title
  const title = new Text({
    text: 'CONTROLES',
    style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: fontSize(20, layout), fill: UI_COLORS.textGold, fontWeight: 'bold' }),
  });
  title.anchor.set(0.5);
  title.x = screenW / 2;
  title.y = py + scaled(24, layout);
  panel.addChild(title);

  // Scrollable content area
  const contentY = py + scaled(48, layout);
  const keyTexts: Text[] = [];

  for (let i = 0; i < ALL_ACTIONS.length; i++) {
    const action = ALL_ACTIONS[i];
    const y = contentY + i * rowSpacing;

    // Action label
    const label = new Text({
      text: ACTION_LABELS[action],
      style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: fontSize(12, layout), fill: UI_COLORS.textPrimary }),
    });
    label.x = px + 20;
    label.y = y + rowH / 2;
    label.anchor.set(0, 0.5);
    panel.addChild(label);

    // Key button
    const keyBtnW = scaled(80, layout);
    const keyBtnX = px + panelW - 20 - keyBtnW;
    const keyBg = new Graphics();
    keyBg.roundRect(keyBtnX, y, keyBtnW, rowH, 6)
      .fill({ color: 0x2a3a50, alpha: UI_ALPHA.buttonBg })
      .stroke({ color: UI_COLORS.borderAccent, width: 1, alpha: 0.5 });
    keyBg.eventMode = 'static';
    keyBg.cursor = 'pointer';
    panel.addChild(keyBg);

    const keyLabel = new Text({
      text: keyCodeToLabel(keyboard.bindings.getKey(action)),
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(12, layout), fill: 0xffffff, fontWeight: 'bold' }),
    });
    keyLabel.anchor.set(0.5);
    keyLabel.x = keyBtnX + keyBtnW / 2;
    keyLabel.y = y + rowH / 2;
    panel.addChild(keyLabel);
    keyTexts.push(keyLabel);

    // Click to rebind
    keyBg.on('pointerdown', async () => {
      keyLabel.text = '...';
      keyLabel.style.fill = UI_COLORS.textGold;
      keyboard.setEnabled(false);
      const code = await keyboard.waitForKey();
      keyboard.bindings.setKey(action, code);
      keyboard.setEnabled(true);
      // Refresh all labels (swap may have occurred)
      refreshLabels();
    });
  }

  function refreshLabels(): void {
    for (let i = 0; i < ALL_ACTIONS.length; i++) {
      keyTexts[i].text = keyCodeToLabel(keyboard.bindings.getKey(ALL_ACTIONS[i]));
      keyTexts[i].style.fill = 0xffffff;
    }
  }

  // Reset defaults button
  const resetY = contentY + ALL_ACTIONS.length * rowSpacing + scaled(8, layout);
  const resetW = scaled(140, layout);
  const resetBg = new Graphics();
  resetBg.roundRect(screenW / 2 - resetW / 2, resetY, resetW, rowH, 8)
    .fill({ color: UI_COLORS.btnDanger, alpha: UI_ALPHA.buttonBg })
    .stroke({ color: UI_COLORS.borderAccent, width: 1, alpha: 0.5 });
  resetBg.eventMode = 'static';
  resetBg.cursor = 'pointer';
  resetBg.on('pointerdown', () => {
    keyboard.bindings.resetDefaults();
    refreshLabels();
  });
  panel.addChild(resetBg);

  const resetLabel = new Text({
    text: 'Réinitialiser',
    style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: fontSize(13, layout), fill: UI_COLORS.textPrimary }),
  });
  resetLabel.anchor.set(0.5);
  resetLabel.x = screenW / 2;
  resetLabel.y = resetY + rowH / 2;
  panel.addChild(resetLabel);

  // Close with Escape or back button
  overlay.on('pointerdown', onClose);

  uiContainer.addChild(panel);
  return panel;
}
```

**Step 2: Verify compilation**

Run: `cd cosmere-web && npm run build`

**Step 3: Commit**

```bash
git add cosmere-web/src/ui/KeyBindingsPanel.ts
git commit -m "feat: add KeyBindingsPanel UI for rebinding controls"
```

---

### Task 5: Add "Controles" tab to PauseMenu

**Files:**
- Modify: `cosmere-web/src/ui/PauseMenu.ts`
- Modify: `cosmere-web/src/scenes/ZoneScene.ts`

**Step 1: Add "Controles" button to PauseMenu**

The pause menu is a function `showPauseMenu()` that builds buttons in a list. Add a new button "Controles" before the "Quitter" button.

The `showPauseMenu` function signature needs a new parameter for the keyboard manager, and a callback to show the key bindings panel.

Modify the `showPauseMenu` function signature (~line 12) to accept an `onControls` callback:
```typescript
export function showPauseMenu(
  uiContainer: Container,
  screenW: number, screenH: number,
  onResume: () => void,
  showFloatingText: (x: number, y: number, msg: string, color: number) => void,
  playerPos: { x: number; y: number },
  onWorldMap?: () => void,
  onControls?: () => void,  // NEW
): Container {
```

Insert a "Controles" button before the "Quitter" button (~before the last `buttons.push`):
```typescript
if (onControls) {
  buttons.push({
    label: 'Controles', y: py + scaled(60, layout) + btnSpacing * nextIdx, color: 0x2a4a3a,
    action: onControls,
  });
  nextIdx++;
}
```

Update `buttonCount` to include the controls button:
```typescript
const buttonCount = (onWorldMap ? 4 : 3) + 2 + (isLoggedIn ? 2 : 0) + (onControls ? 1 : 0);
```

**Step 2: Wire the controls button in ZoneScene**

In ZoneScene's `togglePause()` method, update the `showPauseMenu` call to pass the new `onControls` callback. This should open the `KeyBindingsPanel`.

Add import at the top of ZoneScene.ts:
```typescript
import { showKeyBindingsPanel } from '../ui/KeyBindingsPanel';
```

In the `togglePause` method, pass the onControls callback:
```typescript
// After: this.pauseMenu = togglePauseModule(h, this.pauseMenu, ...
// The onControls callback:
onControls: () => {
  showKeyBindingsPanel(this.uiContainer, w, h, this.keyboard, () => {
    // Close panel — panel removes itself
  });
}
```

Note: The exact wiring depends on how `togglePauseModule` delegates to `showPauseMenu`. Check `ZoneUI.ts` for the intermediate function and thread the `onControls` parameter through.

**Step 3: Build and test**

Run: `cd cosmere-web && npm run build`

**Step 4: Commit**

```bash
git add cosmere-web/src/ui/PauseMenu.ts cosmere-web/src/scenes/ZoneScene.ts cosmere-web/src/ui/KeyBindingsPanel.ts
git commit -m "feat: add Controles tab in pause menu to open key bindings panel"
```

---

### Task 6: Final integration testing and polish

**Files:**
- Modify: `cosmere-web/src/scenes/ZoneScene.ts` (if needed)

**Step 1: Full build**

Run: `cd cosmere-web && npm run build`
Expected: No TypeScript errors

**Step 2: Manual testing checklist**

- [ ] Arrow keys move the player in 8 directions (diagonals normalized)
- [ ] Q/W/E/R trigger the 4 equipped skills
- [ ] Space triggers attack
- [ ] F triggers ultimate
- [ ] 1/2/3 use potions
- [ ] G triggers contextual interaction (talk/enter/loot)
- [ ] Tab opens inventory
- [ ] Escape toggles pause menu
- [ ] Touch UI (joystick + action buttons) hides when keyboard is used
- [ ] Touch UI reappears when screen is touched
- [ ] Pause menu shows "Controles" button
- [ ] Clicking a key binding shows "..." and waits for new key
- [ ] Conflicting keys auto-swap
- [ ] "Réinitialiser" restores defaults
- [ ] Bindings persist after page reload (LocalStorage)
- [ ] Walk animation plays during keyboard movement
- [ ] No stuck keys after Alt+Tab or window blur

**Step 3: Commit final adjustments**

```bash
git add -A
git commit -m "feat: keyboard controls complete — movement, actions, configurable bindings"
```
