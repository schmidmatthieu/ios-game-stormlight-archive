import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { GameScene } from '../game/SceneRouter';
import { SceneRouter } from '../game/SceneRouter';
import { GameManager } from '../game/GameManager';
import { ZoneScene } from './ZoneScene';
import { getCurrentRank, getReputation } from '../game/ReputationSystem';
import { gameData } from '../data/DataLoader';
import { getLayoutInfo, fontSize, scaled, panelRadius, buttonHeight, UI_COLORS, UI_ALPHA } from '../ui/ResponsiveLayout';
import type { LayoutInfo } from '../ui/ResponsiveLayout';

// ─── World Definitions ──────────────────────────────────────────

interface WorldNode {
  id: string;
  name: string;
  subtitle: string;
  color: number;
  glowColor: number;
  x: number; y: number; // Normalized 0-1 positions
  connections: string[];
  hubZoneID: string;
  unlockLevel: number;
}

const WORLDS: WorldNode[] = [
  {
    id: 'scadrial', name: 'Scadrial', subtitle: 'Brumes & Métaux',
    color: 0x8877aa, glowColor: 0x553322,
    x: 0.2, y: 0.35, connections: ['roshar', 'shadesmar'],
    hubZoneID: 'scadrial_hub', unlockLevel: 1,
  },
  {
    id: 'roshar', name: 'Roshar', subtitle: 'Tempêtes & Radiants',
    color: 0x4488cc, glowColor: 0x2244aa,
    x: 0.5, y: 0.2, connections: ['scadrial', 'nalthis', 'shadesmar'],
    hubZoneID: 'roshar_hub', unlockLevel: 1,
  },
  {
    id: 'nalthis', name: 'Nalthis', subtitle: 'Couleurs & Souffles',
    color: 0x44aa66, glowColor: 0x22aa44,
    x: 0.8, y: 0.3, connections: ['roshar', 'sel'],
    hubZoneID: 'nalthis_hub', unlockLevel: 3,
  },
  {
    id: 'taldain', name: 'Taldain', subtitle: 'Sable & Soleil',
    color: 0xccaa44, glowColor: 0xaa8833,
    x: 0.15, y: 0.65, connections: ['scadrial', 'komashi'],
    hubZoneID: 'taldain_hub', unlockLevel: 3,
  },
  {
    id: 'sel', name: 'Sel', subtitle: 'Aons & Dor',
    color: 0xddbb44, glowColor: 0xaaaa33,
    x: 0.75, y: 0.6, connections: ['nalthis', 'shadesmar'],
    hubZoneID: 'sel_hub', unlockLevel: 5,
  },
  {
    id: 'komashi', name: 'Komashi', subtitle: 'Cauchemars & Peinture',
    color: 0x9944cc, glowColor: 0x8822aa,
    x: 0.35, y: 0.75, connections: ['taldain', 'shadesmar'],
    hubZoneID: 'komashi_hub', unlockLevel: 5,
  },
  {
    id: 'shadesmar', name: 'Shadesmar', subtitle: 'Royaume Cognitif',
    color: 0x6644aa, glowColor: 0x4422aa,
    x: 0.5, y: 0.5, connections: ['scadrial', 'roshar', 'sel', 'komashi'],
    hubZoneID: 'shadesmar_hub', unlockLevel: 7,
  },
];

// ─── World Map Scene ────────────────────────────────────────────

export class WorldMapScene extends Container implements GameScene {
  private app: Application;
  private router: SceneRouter;
  private particles: { g: Graphics; vx: number; vy: number; life: number }[] = [];
  private selectedWorld: WorldNode | null = null;
  private infoPanel: Container | null = null;
  private animTimer = 0;
  private nodeSprites: Map<string, Container> = new Map();
  private layout!: LayoutInfo;

  constructor(app: Application, router: SceneRouter) {
    super();
    this.app = app;
    this.router = router;
  }

  onEnter(): void {
    this.layout = getLayoutInfo(this.app.screen.width, this.app.screen.height);
    this.buildUI();
  }

  onResize(): void {
    this.layout = getLayoutInfo(this.app.screen.width, this.app.screen.height);

    // Tear down everything and rebuild
    this.particles = [];
    this.nodeSprites.clear();
    this.selectedWorld = null;
    this.infoPanel = null;
    this.removeChildren();

    this.buildUI();
  }

  private buildUI(): void {
    const layout = this.layout;
    const w = layout.width;
    const h = layout.height;
    const sa = layout.safeArea;
    const champ = GameManager.shared.champion;
    if (!champ) return;

    // Usable area accounting for safe-area insets
    const saLeft = Math.max(sa.left, scaled(10, layout));
    const saRight = Math.max(sa.right, scaled(10, layout));
    const saTop = Math.max(sa.top, scaled(10, layout));
    const saBottom = Math.max(sa.bottom, scaled(10, layout));

    // Background - cosmic void
    const bg = new Graphics();
    bg.rect(0, 0, w, h).fill(0x030310);
    this.addChild(bg);

    // Star field — scale star count with screen area
    const starCount = Math.round(120 * (w * h) / (390 * 844));
    for (let i = 0; i < starCount; i++) {
      const star = new Graphics();
      const size = Math.random() * 1.5 + 0.3;
      const alpha = Math.random() * 0.4 + 0.1;
      star.circle(0, 0, size).fill({ color: 0xccccff, alpha });
      star.x = Math.random() * w;
      star.y = Math.random() * h;
      this.addChild(star);
    }

    // Cosmic dust/nebula patches — scale radius with screen
    for (let i = 0; i < 5; i++) {
      const nebula = new Graphics();
      const nx = Math.random() * w;
      const ny = Math.random() * h;
      const nr = scaled(40 + Math.random() * 60, layout);
      const colors = [0x221133, 0x112233, 0x331122, 0x113322, 0x222211];
      nebula.circle(nx, ny, nr).fill({ color: colors[i % colors.length], alpha: 0.08 });
      nebula.circle(nx, ny, nr * 0.6).fill({ color: colors[i % colors.length], alpha: 0.05 });
      this.addChild(nebula);
    }

    // Title
    const title = new Text({
      text: 'Carte du Cosmere',
      style: new TextStyle({
        fontFamily: 'Georgia, serif', fontSize: fontSize(18, layout), fill: 0xe6cc66,
        fontWeight: 'bold', dropShadow: { color: 0x000000, blur: 4, distance: 1 },
      }),
    });
    title.anchor.set(0.5, 0);
    title.x = w / 2;
    title.y = saTop;
    this.addChild(title);

    // Map area: region in which world nodes are placed (with safe-area margins)
    const mapLeft = saLeft + scaled(20, layout);
    const mapRight = w - saRight - scaled(20, layout);
    const mapTop = saTop + scaled(35, layout);
    const mapBottom = h - saBottom - scaled(10, layout);
    const mapW = mapRight - mapLeft;
    const mapH = mapBottom - mapTop;

    // Draw connections first (behind nodes)
    const lineWidth = Math.max(0.5, scaled(1, layout));
    const connectionLayer = new Graphics();
    for (const world of WORLDS) {
      for (const connID of world.connections) {
        const other = WORLDS.find(wn => wn.id === connID);
        if (!other || other.id < world.id) continue;
        const x1 = mapLeft + world.x * mapW;
        const y1 = mapTop + world.y * mapH;
        const x2 = mapLeft + other.x * mapW;
        const y2 = mapTop + other.y * mapH;

        // Dashed line effect
        const steps = 20;
        for (let i = 0; i < steps; i += 2) {
          const t1 = i / steps;
          const t2 = (i + 1) / steps;
          connectionLayer.moveTo(x1 + (x2 - x1) * t1, y1 + (y2 - y1) * t1)
            .lineTo(x1 + (x2 - x1) * t2, y1 + (y2 - y1) * t2)
            .stroke({ color: 0x333355, width: lineWidth, alpha: 0.4 });
        }
      }
    }
    this.addChild(connectionLayer);

    // Node sizing
    const glowRadius = scaled(28, layout);
    const glowInnerRadius = scaled(18, layout);
    const nodeRadius = scaled(14, layout);
    const markerRadius = scaled(4, layout);

    // Draw world nodes
    for (const world of WORLDS) {
      const nx = mapLeft + world.x * mapW;
      const ny = mapTop + world.y * mapH;
      const isUnlocked = champ.level >= world.unlockLevel;
      const isCurrent = champ.currentWorldID === world.id;

      const nodeContainer = new Container();
      nodeContainer.x = nx;
      nodeContainer.y = ny;

      // Glow
      const glow = new Graphics();
      glow.circle(0, 0, glowRadius).fill({ color: world.glowColor, alpha: isUnlocked ? 0.15 : 0.05 });
      glow.circle(0, 0, glowInnerRadius).fill({ color: world.glowColor, alpha: isUnlocked ? 0.1 : 0.03 });
      nodeContainer.addChild(glow);

      // Node circle
      const node = new Graphics();
      node.circle(0, 0, nodeRadius)
        .fill({ color: isUnlocked ? world.color : 0x333344, alpha: 0.9 })
        .stroke({
          color: isCurrent ? 0xffcc44 : isUnlocked ? world.color : 0x444455,
          width: isCurrent ? scaled(2.5, layout) : scaled(1.5, layout),
          alpha: 0.8,
        });
      nodeContainer.addChild(node);

      // Current world indicator
      if (isCurrent) {
        const marker = new Graphics();
        marker.circle(0, 0, markerRadius).fill({ color: 0xffcc44, alpha: 0.9 });
        nodeContainer.addChild(marker);
      }

      // Lock icon for locked worlds
      if (!isUnlocked) {
        const lock = new Text({
          text: '🔒',
          style: new TextStyle({ fontSize: fontSize(10, layout) }),
        });
        lock.anchor.set(0.5);
        lock.y = -1;
        nodeContainer.addChild(lock);
      }

      // World name
      const nameLabel = new Text({
        text: world.name,
        style: new TextStyle({
          fontFamily: 'Georgia, serif', fontSize: fontSize(9, layout),
          fill: isUnlocked ? 0xddddcc : 0x666666,
          fontWeight: isCurrent ? 'bold' : 'normal',
        }),
      });
      nameLabel.anchor.set(0.5, 0);
      nameLabel.y = nodeRadius + scaled(4, layout);
      nodeContainer.addChild(nameLabel);

      // Reputation indicator
      if (isUnlocked) {
        const rep = getReputation(world.id);
        const { name: rankName, rank } = getCurrentRank(world.id);
        const repLabel = new Text({
          text: rep > 0 ? `${rankName}` : '',
          style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(6, layout), fill: rank.color }),
        });
        repLabel.anchor.set(0.5, 0);
        repLabel.y = nodeRadius + scaled(14, layout);
        nodeContainer.addChild(repLabel);
      }

      // Interactivity
      if (isUnlocked) {
        nodeContainer.eventMode = 'static';
        nodeContainer.cursor = 'pointer';
        nodeContainer.on('pointerdown', () => this.selectWorld(world));
      }

      this.addChild(nodeContainer);
      this.nodeSprites.set(world.id, nodeContainer);
    }

    // Back button
    this.createBackButton();

    // Ambient particles
    const particleCount = Math.round(15 * (w * h) / (390 * 844));
    for (let i = 0; i < particleCount; i++) {
      const p = new Graphics();
      p.circle(0, 0, scaled(1, layout)).fill({ color: 0x8888cc, alpha: 0.2 });
      p.x = Math.random() * w;
      p.y = Math.random() * h;
      this.addChild(p);
      this.particles.push({
        g: p,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        life: Math.random(),
      });
    }
  }

  private selectWorld(world: WorldNode): void {
    this.selectedWorld = world;
    if (this.infoPanel) {
      this.infoPanel.destroy({ children: true });
      this.infoPanel = null;
    }

    const layout = this.layout;
    const w = layout.width;
    const h = layout.height;
    const sa = layout.safeArea;
    const champ = GameManager.shared.champion!;

    const saBottom = Math.max(sa.bottom, scaled(10, layout));
    const saLeft = Math.max(sa.left, scaled(10, layout));
    const saRight = Math.max(sa.right, scaled(10, layout));

    // Panel dimensions — responsive width with a maximum, taller on larger screens
    const maxPanelW = layout.device === 'mobile' ? 280 : layout.device === 'tablet' ? 360 : 400;
    const panelW = Math.min(scaled(260, layout), maxPanelW, w - saLeft - saRight - scaled(10, layout));
    const panelH = scaled(130, layout);
    const px = (w - panelW) / 2;
    const py = h - panelH - saBottom - scaled(5, layout);

    const panel = new Container();
    panel.zIndex = 5000;

    const bgPanel = new Graphics();
    bgPanel.roundRect(px, py, panelW, panelH, scaled(10, layout))
      .fill({ color: 0x0a0815, alpha: 0.92 })
      .stroke({ color: world.color, width: scaled(2, layout), alpha: 0.7 });
    bgPanel.eventMode = 'static';
    panel.addChild(bgPanel);

    const innerPad = scaled(12, layout);

    // World name + subtitle
    const nameText = new Text({
      text: world.name,
      style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: fontSize(14, layout), fill: world.color, fontWeight: 'bold' }),
    });
    nameText.x = px + innerPad;
    nameText.y = py + scaled(8, layout);
    panel.addChild(nameText);

    const subText = new Text({
      text: world.subtitle,
      style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: fontSize(9, layout), fill: 0x888888, fontStyle: 'italic' }),
    });
    subText.x = px + innerPad;
    subText.y = py + scaled(26, layout);
    panel.addChild(subText);

    // Reputation info
    const rep = getReputation(world.id);
    const { name: rankName, rank } = getCurrentRank(world.id);
    const repText = new Text({
      text: `Réputation: ${rankName} (${rep})`,
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(9, layout), fill: rank.color }),
    });
    repText.x = px + innerPad;
    repText.y = py + scaled(42, layout);
    panel.addChild(repText);

    // Zone count
    const zones = Array.from(gameData.zones.values()).filter(z => z.worldID === world.id);
    const zoneText = new Text({
      text: `${zones.length} zones disponibles`,
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(8, layout), fill: 0x999999 }),
    });
    zoneText.x = px + innerPad;
    zoneText.y = py + scaled(56, layout);
    panel.addChild(zoneText);

    // Travel button
    const isCurrent = champ.currentWorldID === world.id;
    const btnW = panelW - innerPad * 2;
    const btnH = scaled(32, layout);
    const btnX = px + innerPad;
    const btnY = py + panelH - btnH - scaled(12, layout);

    const btn = new Graphics();
    btn.roundRect(btnX, btnY, btnW, btnH, scaled(6, layout))
      .fill({ color: isCurrent ? 0x224433 : 0x33264d, alpha: 0.9 })
      .stroke({ color: world.color, width: scaled(1.5, layout), alpha: 0.6 });
    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    panel.addChild(btn);

    const btnLabel = new Text({
      text: isCurrent ? 'Retourner au hub' : `Voyager vers ${world.name}`,
      style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: fontSize(11, layout), fill: 0xeeddcc }),
    });
    btnLabel.anchor.set(0.5);
    btnLabel.x = btnX + btnW / 2;
    btnLabel.y = btnY + btnH / 2;
    panel.addChild(btnLabel);

    btn.on('pointerdown', () => {
      champ.currentWorldID = world.id;
      champ.currentZoneID = world.hubZoneID;
      champ.gridPosition = { col: 5, row: 5 };
      GameManager.shared.save();
      this.router.goto(ZoneScene);
    });

    this.infoPanel = panel;
    this.addChild(panel);
  }

  private createBackButton(): void {
    const layout = this.layout;
    const sa = layout.safeArea;
    const saLeft = Math.max(sa.left, scaled(10, layout));
    const saTop = Math.max(sa.top, scaled(10, layout));

    const btnW = scaled(70, layout);
    const btnH = scaled(28, layout);

    const btn = new Container();
    const bg = new Graphics();
    bg.roundRect(0, 0, btnW, btnH, scaled(6, layout))
      .fill({ color: 0x1a1528, alpha: 0.8 })
      .stroke({ color: 0x443355, width: scaled(1, layout), alpha: 0.5 });
    btn.addChild(bg);

    const label = new Text({
      text: '← Retour',
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(9, layout), fill: 0xcccccc }),
    });
    label.anchor.set(0.5);
    label.x = btnW / 2;
    label.y = btnH / 2;
    btn.addChild(label);

    btn.x = saLeft;
    btn.y = saTop;
    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    btn.on('pointerdown', () => {
      this.router.goto(ZoneScene);
    });
    this.addChild(btn);
  }

  update(dt: number): void {
    this.animTimer += dt / 60;
    const w = this.app.screen.width;
    const h = this.app.screen.height;

    // Particles drift
    for (const p of this.particles) {
      p.g.x += p.vx;
      p.g.y += p.vy;
      p.life += dt / 60;
      p.g.alpha = 0.15 + Math.sin(p.life * 2) * 0.1;
      if (p.g.x < -5) p.g.x = w + 5;
      if (p.g.x > w + 5) p.g.x = -5;
      if (p.g.y < -5) p.g.y = h + 5;
      if (p.g.y > h + 5) p.g.y = -5;
    }

    // Pulse current world node
    const champ = GameManager.shared.champion;
    if (champ) {
      const currentNode = this.nodeSprites.get(champ.currentWorldID);
      if (currentNode) {
        const pulse = 1 + Math.sin(this.animTimer * 3) * 0.05;
        currentNode.scale.set(pulse);
      }
    }
  }
}
