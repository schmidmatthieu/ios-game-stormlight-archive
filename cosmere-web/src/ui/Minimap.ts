import { Container, Graphics } from 'pixi.js';

interface MinimapEntity {
  x: number;
  y: number;
  color: number;
  size?: number;
}

export class Minimap extends Container {
  private bg: Graphics;
  private content: Graphics;
  private border: Graphics;
  private readonly MAP_SIZE = 90;
  private readonly MARGIN = 8;
  private gridWidth = 0;
  private gridHeight = 0;
  private tileW = 64;
  private tileH = 32;

  constructor(screenWidth: number, screenHeight: number) {
    super();

    const x = this.MARGIN;
    const y = screenHeight - this.MAP_SIZE - this.MARGIN - 100; // above joystick

    this.x = x;
    this.y = y;

    // Background
    this.bg = new Graphics();
    this.bg.roundRect(0, 0, this.MAP_SIZE, this.MAP_SIZE, 4)
      .fill({ color: 0x0a0a1a, alpha: 0.65 });
    this.addChild(this.bg);

    // Content layer (entities)
    this.content = new Graphics();
    this.addChild(this.content);

    // Border
    this.border = new Graphics();
    this.border.roundRect(0, 0, this.MAP_SIZE, this.MAP_SIZE, 4)
      .stroke({ color: 0x334455, width: 1, alpha: 0.6 });
    this.addChild(this.border);

    this.eventMode = 'none';
  }

  setZone(gridWidth: number, gridHeight: number): void {
    this.gridWidth = gridWidth;
    this.gridHeight = gridHeight;
  }

  private worldToMinimap(wx: number, wy: number): { mx: number; my: number } {
    // Convert world screen coords to grid coords, then to minimap coords
    const col = wx / this.tileW + wy / this.tileH;
    const row = wy / this.tileH - wx / this.tileW;

    const padding = 4;
    const usable = this.MAP_SIZE - padding * 2;
    return {
      mx: padding + (col / this.gridWidth) * usable,
      my: padding + (row / this.gridHeight) * usable,
    };
  }

  refresh(
    playerX: number, playerY: number,
    enemies: MinimapEntity[],
    npcs: MinimapEntity[],
    exits: MinimapEntity[],
    loot: MinimapEntity[],
  ): void {
    this.content.clear();

    if (this.gridWidth === 0) return;

    // Zone background tiles (simplified)
    const padding = 4;
    const usable = this.MAP_SIZE - padding * 2;
    this.content.roundRect(padding, padding, usable, usable, 2)
      .fill({ color: 0x1a1a2a, alpha: 0.4 });

    // Exits (yellow diamonds)
    for (const e of exits) {
      const { mx, my } = this.worldToMinimap(e.x, e.y);
      this.content.rect(mx - 2, my - 2, 4, 4).fill({ color: 0xeedd44, alpha: 0.8 });
    }

    // Loot (small orange dots)
    for (const l of loot) {
      const { mx, my } = this.worldToMinimap(l.x, l.y);
      this.content.circle(mx, my, 1.5).fill({ color: 0xee9944, alpha: 0.7 });
    }

    // NPCs (blue dots)
    for (const n of npcs) {
      const { mx, my } = this.worldToMinimap(n.x, n.y);
      this.content.circle(mx, my, 2).fill({ color: 0x44aaff, alpha: 0.8 });
    }

    // Enemies (red dots)
    for (const e of enemies) {
      const { mx, my } = this.worldToMinimap(e.x, e.y);
      this.content.circle(mx, my, e.size ?? 1.5).fill({ color: e.color, alpha: 0.8 });
    }

    // Player (white dot with glow)
    const { mx: px, my: py } = this.worldToMinimap(playerX, playerY);
    this.content.circle(px, py, 4).fill({ color: 0xffffff, alpha: 0.15 });
    this.content.circle(px, py, 2.5).fill({ color: 0xffffff, alpha: 0.9 });
  }
}
