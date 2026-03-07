import { Container, Graphics, Text, TextStyle } from 'pixi.js';

interface MinimapEntity {
  x: number;
  y: number;
  color: number;
  size?: number;
}

export class Minimap extends Container {
  private bg: Graphics;
  private content: Graphics;
  private fogLayer: Graphics;
  private border: Graphics;
  private arrowLayer: Graphics;
  private legendContainer: Container;
  private exploredLabel: Text;
  private readonly MAP_SIZE = 100;
  private readonly MARGIN = 8;
  private gridWidth = 0;
  private gridHeight = 0;
  private tileW = 64;
  private tileH = 32;

  // Fog of war - tracks explored areas
  private explored: Set<string> = new Set();
  private readonly FOG_GRID = 12; // Resolution of fog grid
  private worldID = '';
  private zoneID = '';

  // POI markers
  private poiMarkers: { x: number; y: number; type: string; label: string }[] = [];

  // Objective tracking
  private objectivePos: { x: number; y: number } | null = null;
  private objectiveLabel = '';

  // Player trail
  private trailPoints: { x: number; y: number }[] = [];
  private trailTimer = 0;

  constructor(screenWidth: number, screenHeight: number) {
    super();

    const x = this.MARGIN;
    const y = screenHeight - this.MAP_SIZE - this.MARGIN - 100;

    this.x = x;
    this.y = y;

    // Background
    this.bg = new Graphics();
    this.bg.roundRect(0, 0, this.MAP_SIZE, this.MAP_SIZE, 6)
      .fill({ color: 0x080818, alpha: 0.75 });
    this.addChild(this.bg);

    // Content layer
    this.content = new Graphics();
    this.addChild(this.content);

    // Fog of war layer (on top of content)
    this.fogLayer = new Graphics();
    this.addChild(this.fogLayer);

    // Objective arrow layer
    this.arrowLayer = new Graphics();
    this.addChild(this.arrowLayer);

    // Border with world-themed color
    this.border = new Graphics();
    this.border.roundRect(0, 0, this.MAP_SIZE, this.MAP_SIZE, 6)
      .stroke({ color: 0x334455, width: 1.5, alpha: 0.7 });
    this.addChild(this.border);

    // Zone label
    const label = new Text({
      text: 'CARTE',
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 6, fill: 0x556677, fontWeight: 'bold' }),
    });
    label.anchor.set(0.5, 0);
    label.x = this.MAP_SIZE / 2;
    label.y = 2;
    this.addChild(label);

    // Compass directions
    const compassStyle = new TextStyle({ fontFamily: 'sans-serif', fontSize: 5, fill: 0x556677, fontWeight: 'bold' });
    const dirs: [string, number, number][] = [['N', this.MAP_SIZE / 2, 10], ['S', this.MAP_SIZE / 2, this.MAP_SIZE - 4], ['E', this.MAP_SIZE - 5, this.MAP_SIZE / 2], ['O', 5, this.MAP_SIZE / 2]];
    for (const [d, cx, cy] of dirs) {
      const t = new Text({ text: d, style: compassStyle });
      t.anchor.set(0.5);
      t.x = cx; t.y = cy;
      this.addChild(t);
    }

    // Explored percentage label
    this.exploredLabel = new Text({
      text: '',
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 5, fill: 0x44aa66 }),
    });
    this.exploredLabel.anchor.set(1, 0);
    this.exploredLabel.x = this.MAP_SIZE - 4;
    this.exploredLabel.y = 2;
    this.addChild(this.exploredLabel);

    // Legend
    this.legendContainer = new Container();
    this.legendContainer.y = this.MAP_SIZE + 3;
    this.addChild(this.legendContainer);
    this.renderLegend();

    // Make draggable
    this.eventMode = 'static';
    this.cursor = 'grab';
    let dragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    this.on('pointerdown', (e) => {
      dragging = true;
      this.cursor = 'grabbing';
      dragOffsetX = e.globalX - this.x;
      dragOffsetY = e.globalY - this.y;
    });
    this.on('globalpointermove', (e) => {
      if (!dragging) return;
      this.x = e.globalX - dragOffsetX;
      this.y = e.globalY - dragOffsetY;
    });
    this.on('pointerup', () => { dragging = false; this.cursor = 'grab'; });
    this.on('pointerupoutside', () => { dragging = false; this.cursor = 'grab'; });
  }

  private renderLegend(): void {
    this.legendContainer.removeChildren();
    const items: { color: number; label: string }[] = [
      { color: 0xffffff, label: 'Vous' },
      { color: 0xcc4444, label: 'Ennemi' },
      { color: 0x44aaff, label: 'PNJ' },
      { color: 0xeedd44, label: 'Sortie' },
    ];
    let lx = 0;
    for (const item of items) {
      const dot = new Graphics();
      dot.circle(0, 0, 1.5).fill({ color: item.color, alpha: 0.8 });
      dot.x = lx + 2; dot.y = 4;
      this.legendContainer.addChild(dot);
      const lbl = new Text({
        text: item.label,
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 4.5, fill: 0x556677 }),
      });
      lbl.x = lx + 5; lbl.y = 1;
      this.legendContainer.addChild(lbl);
      lx += item.label.length * 4 + 10;
    }
  }

  setZone(gridWidth: number, gridHeight: number, worldID?: string, zoneID?: string): void {
    this.gridWidth = gridWidth;
    this.gridHeight = gridHeight;
    if (worldID) this.worldID = worldID;
    if (zoneID) this.zoneID = zoneID;

    // Load explored state from localStorage
    this.loadExplored();
    this.trailPoints = [];

    // Update border color per world
    const worldColors: Record<string, number> = {
      scadrial: 0x553322, roshar: 0x2244aa, nalthis: 0x22aa44,
      taldain: 0xaa8833, sel: 0xaaaa33, komashi: 0x8822aa, shadesmar: 0x4422aa,
    };
    this.border.clear();
    this.border.roundRect(0, 0, this.MAP_SIZE, this.MAP_SIZE, 6)
      .stroke({ color: worldColors[this.worldID] ?? 0x334455, width: 1.5, alpha: 0.7 });
  }

  addPOI(worldX: number, worldY: number, type: string, label: string): void {
    this.poiMarkers.push({ x: worldX, y: worldY, type, label });
  }

  clearPOIs(): void {
    this.poiMarkers = [];
  }

  setObjective(worldX: number, worldY: number, label: string): void {
    this.objectivePos = { x: worldX, y: worldY };
    this.objectiveLabel = label;
  }

  clearObjective(): void {
    this.objectivePos = null;
    this.objectiveLabel = '';
  }

  private worldToMinimap(wx: number, wy: number): { mx: number; my: number } {
    const col = wx / this.tileW + wy / this.tileH;
    const row = wy / this.tileH - wx / this.tileW;

    const padding = 8;
    const usable = this.MAP_SIZE - padding * 2;
    return {
      mx: padding + (col / this.gridWidth) * usable,
      my: padding + (row / this.gridHeight) * usable,
    };
  }

  private fogGridKey(gx: number, gy: number): string {
    return `${gx},${gy}`;
  }

  private revealFog(worldX: number, worldY: number): void {
    const col = worldX / this.tileW + worldY / this.tileH;
    const row = worldY / this.tileH - worldX / this.tileW;

    const gx = Math.floor((col / this.gridWidth) * this.FOG_GRID);
    const gy = Math.floor((row / this.gridHeight) * this.FOG_GRID);

    // Reveal 3x3 area around player
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const key = this.fogGridKey(gx + dx, gy + dy);
        this.explored.add(key);
      }
    }
  }

  private saveExplored(): void {
    const key = `minimap_fog_${this.zoneID}`;
    localStorage.setItem(key, JSON.stringify([...this.explored]));
  }

  private loadExplored(): void {
    const key = `minimap_fog_${this.zoneID}`;
    const data = localStorage.getItem(key);
    if (data) {
      this.explored = new Set(JSON.parse(data));
    } else {
      this.explored = new Set();
    }
  }

  private getExploredPercent(): number {
    const totalCells = this.FOG_GRID * this.FOG_GRID;
    return Math.min(100, Math.floor((this.explored.size / totalCells) * 100));
  }

  refresh(
    playerX: number, playerY: number,
    enemies: MinimapEntity[],
    npcs: MinimapEntity[],
    exits: MinimapEntity[],
    loot: MinimapEntity[],
  ): void {
    this.content.clear();
    this.fogLayer.clear();
    this.arrowLayer.clear();

    if (this.gridWidth === 0) return;

    // Reveal fog around player
    this.revealFog(playerX, playerY);

    // Update explored percentage
    this.exploredLabel.text = `${this.getExploredPercent()}%`;

    const padding = 8;
    const usable = this.MAP_SIZE - padding * 2;

    // Draw terrain grid with explored shading
    const cellW = usable / this.FOG_GRID;
    const cellH = usable / this.FOG_GRID;

    for (let gx = 0; gx < this.FOG_GRID; gx++) {
      for (let gy = 0; gy < this.FOG_GRID; gy++) {
        const cx = padding + gx * cellW;
        const cy = padding + gy * cellH;
        const key = this.fogGridKey(gx, gy);
        const isExplored = this.explored.has(key);

        if (isExplored) {
          this.content.rect(cx, cy, cellW, cellH).fill({ color: 0x1a1a2e, alpha: 0.5 });
        } else {
          // Fog of war - dark unexplored
          this.fogLayer.rect(cx, cy, cellW, cellH).fill({ color: 0x050510, alpha: 0.85 });
        }
      }
    }

    // Grid lines (subtle)
    for (let i = 0; i <= this.FOG_GRID; i++) {
      const pos = padding + i * cellW;
      this.content.moveTo(pos, padding).lineTo(pos, padding + usable)
        .stroke({ color: 0x222244, width: 0.3, alpha: 0.3 });
      this.content.moveTo(padding, pos).lineTo(padding + usable, pos)
        .stroke({ color: 0x222244, width: 0.3, alpha: 0.3 });
    }

    // Helper: check if position is in explored area
    const isVisible = (wx: number, wy: number): boolean => {
      const col = wx / this.tileW + wy / this.tileH;
      const row = wy / this.tileH - wx / this.tileW;
      const gx = Math.floor((col / this.gridWidth) * this.FOG_GRID);
      const gy = Math.floor((row / this.gridHeight) * this.FOG_GRID);
      return this.explored.has(this.fogGridKey(gx, gy));
    };

    // Player trail (fading dots)
    this.trailTimer += 0.016;
    if (this.trailTimer > 0.3) {
      this.trailTimer = 0;
      this.trailPoints.push({ x: playerX, y: playerY });
      if (this.trailPoints.length > 30) this.trailPoints.shift();
    }
    for (let i = 0; i < this.trailPoints.length; i++) {
      const tp = this.trailPoints[i];
      const { mx, my } = this.worldToMinimap(tp.x, tp.y);
      const alpha = (i / this.trailPoints.length) * 0.3;
      this.content.circle(mx, my, 0.8).fill({ color: 0xffffff, alpha });
    }

    // Exits (yellow diamonds) - always visible as beacons
    for (const e of exits) {
      const { mx, my } = this.worldToMinimap(e.x, e.y);
      this.content.poly([
        { x: mx, y: my - 3 }, { x: mx + 3, y: my },
        { x: mx, y: my + 3 }, { x: mx - 3, y: my },
      ]).fill({ color: 0xeedd44, alpha: 0.9 });
      // Pulse glow
      const t = performance.now() / 1000;
      const pulse = 0.3 + Math.sin(t * 2) * 0.2;
      this.content.circle(mx, my, 5).fill({ color: 0xeedd44, alpha: pulse * 0.15 });
    }

    // Loot (orange dots) - only visible if explored
    for (const l of loot) {
      if (!isVisible(l.x, l.y)) continue;
      const { mx, my } = this.worldToMinimap(l.x, l.y);
      const t = performance.now() / 1000;
      const sparkle = 0.6 + Math.sin(t * 3) * 0.3;
      this.content.circle(mx, my, 1.8).fill({ color: 0xee9944, alpha: sparkle });
    }

    // NPCs (blue dots with ring) - only visible if explored
    for (const n of npcs) {
      if (!isVisible(n.x, n.y)) continue;
      const { mx, my } = this.worldToMinimap(n.x, n.y);
      this.content.circle(mx, my, 3).fill({ color: 0x44aaff, alpha: 0.2 });
      this.content.circle(mx, my, 2).fill({ color: 0x44aaff, alpha: 0.9 });
    }

    // Enemies (red dots) - only visible if explored
    for (const e of enemies) {
      if (!isVisible(e.x, e.y)) continue;
      const { mx, my } = this.worldToMinimap(e.x, e.y);
      const sz = e.size ?? 1.5;
      if (sz > 3) {
        // Boss enemy - pulsing red
        const t = performance.now() / 1000;
        const pulse = 0.5 + Math.sin(t * 2) * 0.3;
        this.content.circle(mx, my, sz + 2).fill({ color: e.color, alpha: pulse * 0.2 });
      }
      this.content.circle(mx, my, sz).fill({ color: e.color, alpha: 0.85 });
    }

    // POI markers
    for (const poi of this.poiMarkers) {
      if (!isVisible(poi.x, poi.y)) continue;
      const { mx, my } = this.worldToMinimap(poi.x, poi.y);
      const poiColors: Record<string, number> = {
        building: 0xaa8855, secret: 0xffdd44, shrine: 0x88ccff,
      };
      const c = poiColors[poi.type] ?? 0xaaaaaa;
      this.content.rect(mx - 1.5, my - 1.5, 3, 3).fill({ color: c, alpha: 0.8 });
    }

    // Player position indicator (white dot with heading indicator + glow)
    const { mx: px, my: py } = this.worldToMinimap(playerX, playerY);
    this.content.circle(px, py, 5).fill({ color: 0xffffff, alpha: 0.1 });
    this.content.circle(px, py, 3).fill({ color: 0xffffff, alpha: 0.2 });
    this.content.circle(px, py, 2).fill({ color: 0xffffff, alpha: 0.95 });

    // Objective arrow (points toward tracked objective if off-minimap)
    if (this.objectivePos) {
      const { mx: ox, my: oy } = this.worldToMinimap(this.objectivePos.x, this.objectivePos.y);
      const onMap = ox >= padding && ox <= padding + usable && oy >= padding && oy <= padding + usable;

      if (onMap) {
        // Draw objective marker on map
        const t = performance.now() / 1000;
        const pulse = 0.6 + Math.sin(t * 3) * 0.3;
        this.arrowLayer.circle(ox, oy, 4).stroke({ color: 0x44ff44, width: 1.5, alpha: pulse });
      } else {
        // Draw directional arrow at map edge
        const angle = Math.atan2(oy - py, ox - px);
        const edgeDist = usable / 2 - 4;
        const ax = this.MAP_SIZE / 2 + Math.cos(angle) * edgeDist;
        const ay = this.MAP_SIZE / 2 + Math.sin(angle) * edgeDist;

        const arrowSize = 5;
        this.arrowLayer.poly([
          { x: ax + Math.cos(angle) * arrowSize, y: ay + Math.sin(angle) * arrowSize },
          { x: ax + Math.cos(angle + 2.4) * arrowSize * 0.6, y: ay + Math.sin(angle + 2.4) * arrowSize * 0.6 },
          { x: ax + Math.cos(angle - 2.4) * arrowSize * 0.6, y: ay + Math.sin(angle - 2.4) * arrowSize * 0.6 },
        ]).fill({ color: 0x44ff44, alpha: 0.8 });
      }
    }

    // Periodically save explored state
    if (Math.random() < 0.01) this.saveExplored();
  }
}
