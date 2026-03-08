// ─── UI Layout Manager — draggable, lockable HUD elements ──────
// Provides a system to make any UI element draggable with position
// persistence via localStorage. Supports global edit mode toggle
// and per-element lock/unlock.

import { Container, Graphics, Text, TextStyle, FederatedPointerEvent } from 'pixi.js';
import { UI_COLORS, UI_ALPHA } from './ResponsiveLayout';

// ─── Storage Key ────────────────────────────────────────────────

const STORAGE_KEY = 'ui_layout_positions';
const EDIT_MODE_KEY = 'ui_layout_edit_mode';

// ─── Saved Position ─────────────────────────────────────────────

interface SavedPosition {
  x: number;
  y: number;
  locked: boolean;
}

// ─── Draggable Element Wrapper ──────────────────────────────────

export interface DraggableElement {
  id: string;
  container: Container;
  defaultX: number;
  defaultY: number;
  locked: boolean;
  handle: Container | null;
}

// ─── UI Layout Manager ─────────────────────────────────────────

export class UILayoutManager {
  private elements = new Map<string, DraggableElement>();
  private editMode = false;
  private editButton: Container | null = null;
  private screenW = 0;
  private screenH = 0;
  private uiContainer: Container | null = null;
  private onEditModeChangedCb: ((active: boolean) => void) | null = null;

  // ─── Singleton ─────────────────────────────────────────────

  private static _instance: UILayoutManager | null = null;
  static get shared(): UILayoutManager {
    if (!this._instance) this._instance = new UILayoutManager();
    return this._instance;
  }

  // ─── Register an Element ───────────────────────────────────

  register(
    id: string,
    container: Container,
    defaultX: number,
    defaultY: number,
  ): void {
    // Load saved position
    const saved = this.loadPosition(id);
    const locked = saved?.locked ?? true; // Locked by default

    if (saved) {
      // Clamp to screen bounds
      container.x = Math.max(0, Math.min(this.screenW - 20, saved.x));
      container.y = Math.max(0, Math.min(this.screenH - 20, saved.y));
    }

    const elem: DraggableElement = {
      id, container, defaultX, defaultY, locked, handle: null,
    };

    this.elements.set(id, elem);
    this.setupDrag(elem);

    // Show handle if already in edit mode
    if (this.editMode) {
      this.showHandle(elem);
    }
  }

  // ─── Unregister ────────────────────────────────────────────

  unregister(id: string): void {
    const elem = this.elements.get(id);
    if (elem?.handle) {
      elem.handle.destroy({ children: true });
    }
    this.elements.delete(id);
  }

  // ─── Clear All ─────────────────────────────────────────────

  clear(): void {
    for (const elem of this.elements.values()) {
      if (elem.handle) {
        elem.handle.destroy({ children: true });
      }
    }
    this.elements.clear();
  }

  // ─── Setup Drag on Element ─────────────────────────────────

  private setupDrag(elem: DraggableElement): void {
    const c = elem.container;
    c.eventMode = 'static';

    let dragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    const onDown = (e: FederatedPointerEvent) => {
      if (!this.editMode || elem.locked) return;
      dragging = true;
      c.cursor = 'grabbing';
      dragOffsetX = e.globalX - c.x;
      dragOffsetY = e.globalY - c.y;
      // Bring to front while dragging
      c.zIndex = 99999;
    };

    const onMove = (e: FederatedPointerEvent) => {
      if (!dragging) return;
      // Clamp to screen bounds during drag
      const newX = e.globalX - dragOffsetX;
      const newY = e.globalY - dragOffsetY;
      c.x = Math.max(-20, Math.min(this.screenW - 10, newX));
      c.y = Math.max(-20, Math.min(this.screenH - 10, newY));
    };

    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      c.cursor = this.editMode && !elem.locked ? 'grab' : 'default';
      c.zIndex = c.y; // Restore z-index
      this.savePosition(elem.id, c.x, c.y, elem.locked);
    };

    c.on('pointerdown', onDown);
    c.on('globalpointermove', onMove);
    c.on('pointerup', onUp);
    c.on('pointerupoutside', onUp);
  }

  // ─── Show/Hide Edit Handles ────────────────────────────────

  private showHandle(elem: DraggableElement): void {
    if (elem.handle) return;

    const handle = new Container();
    handle.zIndex = 100000;

    // Colored outline around element
    const outline = new Graphics();
    const bounds = elem.container.getLocalBounds();
    const pad = 3;
    outline.roundRect(
      bounds.x - pad, bounds.y - pad,
      bounds.width + pad * 2, bounds.height + pad * 2,
      4,
    ).stroke({ color: elem.locked ? 0x666688 : 0x44aaff, width: 1.5, alpha: 0.8 });
    handle.addChild(outline);

    // Lock/unlock icon (top-right corner of element)
    const lockBtn = new Container();
    lockBtn.eventMode = 'static';
    lockBtn.cursor = 'pointer';

    const lockBg = new Graphics();
    lockBg.circle(0, 0, 10).fill({ color: elem.locked ? 0x553333 : 0x335533, alpha: 0.9 });
    lockBg.circle(0, 0, 10).stroke({ color: elem.locked ? 0xcc4444 : 0x44cc44, width: 1 });
    lockBtn.addChild(lockBg);

    const lockIcon = new Text({
      text: elem.locked ? '🔒' : '🔓',
      style: new TextStyle({ fontSize: 10 }),
    });
    lockIcon.anchor.set(0.5);
    lockBtn.addChild(lockIcon);

    lockBtn.x = bounds.x + bounds.width + pad;
    lockBtn.y = bounds.y - pad;

    lockBtn.on('pointerdown', (e: FederatedPointerEvent) => {
      e.stopPropagation();
      elem.locked = !elem.locked;
      lockIcon.text = elem.locked ? '🔒' : '🔓';
      lockBg.clear();
      lockBg.circle(0, 0, 10).fill({ color: elem.locked ? 0x553333 : 0x335533, alpha: 0.9 });
      lockBg.circle(0, 0, 10).stroke({ color: elem.locked ? 0xcc4444 : 0x44cc44, width: 1 });
      outline.clear();
      outline.roundRect(
        bounds.x - pad, bounds.y - pad,
        bounds.width + pad * 2, bounds.height + pad * 2,
        4,
      ).stroke({ color: elem.locked ? 0x666688 : 0x44aaff, width: 1.5, alpha: 0.8 });
      elem.container.cursor = elem.locked ? 'default' : 'grab';
      this.savePosition(elem.id, elem.container.x, elem.container.y, elem.locked);
    });

    handle.addChild(lockBtn);

    // Element label
    const label = new Text({
      text: elem.id,
      style: new TextStyle({
        fontFamily: 'sans-serif', fontSize: 8, fill: 0xaaccff,
        dropShadow: { color: 0x000000, blur: 2, distance: 1 },
      }),
    });
    label.anchor.set(0.5, 1);
    label.x = bounds.x + bounds.width / 2;
    label.y = bounds.y - pad - 2;
    handle.addChild(label);

    elem.container.addChild(handle);
    elem.handle = handle;

    // Set cursor
    elem.container.cursor = elem.locked ? 'default' : 'grab';
  }

  private hideHandle(elem: DraggableElement): void {
    if (elem.handle) {
      elem.handle.destroy({ children: true });
      elem.handle = null;
    }
    elem.container.cursor = 'default';
  }

  // ─── Toggle Edit Mode ─────────────────────────────────────

  toggleEditMode(): boolean {
    this.editMode = !this.editMode;

    for (const elem of this.elements.values()) {
      if (this.editMode) {
        this.showHandle(elem);
      } else {
        this.hideHandle(elem);
      }
    }

    // Save edit mode state
    try {
      localStorage.setItem(EDIT_MODE_KEY, JSON.stringify(this.editMode));
    } catch { /* ignore */ }

    // Notify listener (used to pause/unpause game)
    if (this.onEditModeChangedCb) this.onEditModeChangedCb(this.editMode);

    return this.editMode;
  }

  // ─── Callback for edit mode changes ────────────────────────

  onEditModeChanged(cb: (active: boolean) => void): void {
    this.onEditModeChangedCb = cb;
  }

  get isEditMode(): boolean {
    return this.editMode;
  }

  // ─── Lock/Unlock All ──────────────────────────────────────

  lockAll(): void {
    for (const elem of this.elements.values()) {
      elem.locked = true;
      this.savePosition(elem.id, elem.container.x, elem.container.y, true);
      if (elem.handle) {
        this.hideHandle(elem);
        this.showHandle(elem); // Refresh handle appearance
      }
    }
  }

  unlockAll(): void {
    for (const elem of this.elements.values()) {
      elem.locked = false;
      this.savePosition(elem.id, elem.container.x, elem.container.y, false);
      if (elem.handle) {
        this.hideHandle(elem);
        this.showHandle(elem); // Refresh handle appearance
      }
    }
  }

  // ─── Reset All to Defaults ────────────────────────────────

  resetAll(): void {
    for (const elem of this.elements.values()) {
      elem.container.x = elem.defaultX;
      elem.container.y = elem.defaultY;
      elem.locked = true;
      this.savePosition(elem.id, elem.defaultX, elem.defaultY, true);
      if (elem.handle) {
        this.hideHandle(elem);
        this.showHandle(elem);
      }
    }
  }

  // ─── Set Screen Size ──────────────────────────────────────

  setScreenSize(w: number, h: number): void {
    this.screenW = w;
    this.screenH = h;
  }

  // ─── Persistence ──────────────────────────────────────────

  private loadPosition(id: string): SavedPosition | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      return data[id] ?? null;
    } catch {
      return null;
    }
  }

  private savePosition(id: string, x: number, y: number, locked: boolean): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const data = raw ? JSON.parse(raw) : {};
      data[id] = { x, y, locked };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch { /* ignore */ }
  }

  // ─── Create Edit Mode Button ──────────────────────────────

  createEditButton(
    uiContainer: Container,
    screenW: number, screenH: number,
  ): Container {
    this.uiContainer = uiContainer;
    this.setScreenSize(screenW, screenH);

    const btn = new Container();
    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    btn.zIndex = 100001;

    const btnSize = 38;
    // Background — more visible with contrasting border
    const bg = new Graphics();
    bg.roundRect(0, 0, btnSize, btnSize, 8)
      .fill({ color: 0x1a1528, alpha: 0.9 })
      .stroke({ color: 0x6688aa, width: 1.5 });
    btn.addChild(bg);

    // Icon — move/grid icon, larger
    const icon = new Text({
      text: '⊞',
      style: new TextStyle({ fontSize: 20, fill: 0xaaccff }),
    });
    icon.anchor.set(0.5);
    icon.x = btnSize / 2;
    icon.y = btnSize / 2;
    btn.addChild(icon);

    // Label below icon
    const label = new Text({
      text: 'UI',
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 7, fill: 0x8899bb }),
    });
    label.anchor.set(0.5, 0);
    label.x = btnSize / 2;
    label.y = btnSize + 1;
    btn.addChild(label);

    // Position: top-center, slightly lower to avoid notch
    btn.x = screenW / 2 - btnSize / 2;
    btn.y = 6;

    // Edit mode overlay (shown when active)
    let overlay: Container | null = null;

    btn.on('pointerdown', () => {
      const active = this.toggleEditMode();

      // Update button appearance
      bg.clear();
      bg.roundRect(0, 0, btnSize, btnSize, 8)
        .fill({ color: active ? 0x2a3548 : 0x1a1528, alpha: 0.9 })
        .stroke({ color: active ? 0x44aaff : 0x6688aa, width: active ? 2 : 1.5 });
      icon.style.fill = active ? 0x44aaff : 0xaaccff;

      if (active) {
        // Show edit mode toolbar
        overlay = this.createEditOverlay(uiContainer, screenW, screenH);
      } else {
        if (overlay) {
          overlay.destroy({ children: true });
          overlay = null;
        }
      }
    });

    uiContainer.addChild(btn);
    this.editButton = btn;
    return btn;
  }

  // ─── Edit Mode Overlay (toolbar with lock all / reset) ────

  private createEditOverlay(
    uiContainer: Container,
    screenW: number, screenH: number,
  ): Container {
    const overlay = new Container();
    overlay.zIndex = 100000;

    // Semi-transparent banner at top
    const banner = new Graphics();
    banner.rect(0, 0, screenW, 40).fill({ color: 0x0a0a2a, alpha: 0.75 });
    banner.rect(0, 39, screenW, 1).fill({ color: 0x44aaff, alpha: 0.5 });
    overlay.addChild(banner);

    // Title
    const title = new Text({
      text: 'Mode Édition UI',
      style: new TextStyle({
        fontFamily: 'Georgia, serif', fontSize: 12, fill: 0x44aaff,
        fontWeight: 'bold',
        dropShadow: { color: 0x000000, blur: 2, distance: 1 },
      }),
    });
    title.anchor.set(0.5, 0.5);
    title.x = screenW / 2;
    title.y = 20;
    overlay.addChild(title);

    // Buttons
    const btnY = 12;
    const btnH = 24;

    // "Tout déverrouiller" button
    const unlockBtn = this.createOverlayButton('🔓 Tout déverrouiller', screenW / 2 - 180, btnY, 120, btnH);
    unlockBtn.on('pointerdown', () => this.unlockAll());
    overlay.addChild(unlockBtn);

    // "Tout verrouiller" button
    const lockBtn = this.createOverlayButton('🔒 Tout verrouiller', screenW / 2 - 50, btnY, 110, btnH);
    lockBtn.on('pointerdown', () => this.lockAll());
    overlay.addChild(lockBtn);

    // "Réinitialiser" button
    const resetBtn = this.createOverlayButton('↺ Réinitialiser', screenW / 2 + 70, btnY, 100, btnH);
    resetBtn.on('pointerdown', () => this.resetAll());
    overlay.addChild(resetBtn);

    uiContainer.addChild(overlay);
    return overlay;
  }

  private createOverlayButton(label: string, x: number, y: number, w: number, h: number): Container {
    const btn = new Container();
    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    btn.x = x;
    btn.y = y;

    const bg = new Graphics();
    bg.roundRect(0, 0, w, h, 4)
      .fill({ color: 0x1a2233, alpha: 0.9 })
      .stroke({ color: 0x446688, width: 1 });
    btn.addChild(bg);

    const text = new Text({
      text: label,
      style: new TextStyle({
        fontFamily: 'sans-serif', fontSize: 9, fill: 0xccddee,
      }),
    });
    text.anchor.set(0.5);
    text.x = w / 2;
    text.y = h / 2;
    btn.addChild(text);

    return btn;
  }
}
