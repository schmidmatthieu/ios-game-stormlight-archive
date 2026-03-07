import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { GameScene } from '../game/SceneRouter';
import { SceneRouter } from '../game/SceneRouter';
import { GameManager } from '../game/GameManager';
import { ZoneScene } from './ZoneScene';
import { getCurrentRank, getReputation } from '../game/ReputationSystem';
import { gameData } from '../data/DataLoader';

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

  constructor(app: Application, router: SceneRouter) {
    super();
    this.app = app;
    this.router = router;
  }

  onEnter(): void {
    const w = this.app.screen.width;
    const h = this.app.screen.height;
    const champ = GameManager.shared.champion;
    if (!champ) return;

    // Background - cosmic void
    const bg = new Graphics();
    bg.rect(0, 0, w, h).fill(0x030310);
    this.addChild(bg);

    // Star field
    for (let i = 0; i < 120; i++) {
      const star = new Graphics();
      const size = Math.random() * 1.5 + 0.3;
      const alpha = Math.random() * 0.4 + 0.1;
      star.circle(0, 0, size).fill({ color: 0xccccff, alpha });
      star.x = Math.random() * w;
      star.y = Math.random() * h;
      this.addChild(star);
    }

    // Cosmic dust/nebula patches
    for (let i = 0; i < 5; i++) {
      const nebula = new Graphics();
      const nx = Math.random() * w;
      const ny = Math.random() * h;
      const nr = 40 + Math.random() * 60;
      const colors = [0x221133, 0x112233, 0x331122, 0x113322, 0x222211];
      nebula.circle(nx, ny, nr).fill({ color: colors[i % colors.length], alpha: 0.08 });
      nebula.circle(nx, ny, nr * 0.6).fill({ color: colors[i % colors.length], alpha: 0.05 });
      this.addChild(nebula);
    }

    // Title
    const title = new Text({
      text: 'Carte du Cosmere',
      style: new TextStyle({
        fontFamily: 'Georgia, serif', fontSize: 18, fill: 0xe6cc66,
        fontWeight: 'bold', dropShadow: { color: 0x000000, blur: 4, distance: 1 },
      }),
    });
    title.anchor.set(0.5, 0);
    title.x = w / 2;
    title.y = 10;
    this.addChild(title);

    // Draw connections first (behind nodes)
    const connectionLayer = new Graphics();
    for (const world of WORLDS) {
      for (const connID of world.connections) {
        const other = WORLDS.find(wn => wn.id === connID);
        if (!other || other.id < world.id) continue; // Avoid duplicate lines
        const x1 = world.x * (w - 80) + 40;
        const y1 = world.y * (h - 120) + 60;
        const x2 = other.x * (w - 80) + 40;
        const y2 = other.y * (h - 120) + 60;

        // Dashed line effect
        const steps = 20;
        for (let i = 0; i < steps; i += 2) {
          const t1 = i / steps;
          const t2 = (i + 1) / steps;
          connectionLayer.moveTo(x1 + (x2 - x1) * t1, y1 + (y2 - y1) * t1)
            .lineTo(x1 + (x2 - x1) * t2, y1 + (y2 - y1) * t2)
            .stroke({ color: 0x333355, width: 1, alpha: 0.4 });
        }
      }
    }
    this.addChild(connectionLayer);

    // Draw world nodes
    for (const world of WORLDS) {
      const nx = world.x * (w - 80) + 40;
      const ny = world.y * (h - 120) + 60;
      const isUnlocked = champ.level >= world.unlockLevel;
      const isCurrent = champ.currentWorldID === world.id;

      const nodeContainer = new Container();
      nodeContainer.x = nx;
      nodeContainer.y = ny;

      // Glow
      const glow = new Graphics();
      glow.circle(0, 0, 28).fill({ color: world.glowColor, alpha: isUnlocked ? 0.15 : 0.05 });
      glow.circle(0, 0, 18).fill({ color: world.glowColor, alpha: isUnlocked ? 0.1 : 0.03 });
      nodeContainer.addChild(glow);

      // Node circle
      const node = new Graphics();
      node.circle(0, 0, 14)
        .fill({ color: isUnlocked ? world.color : 0x333344, alpha: 0.9 })
        .stroke({ color: isCurrent ? 0xffcc44 : isUnlocked ? world.color : 0x444455, width: isCurrent ? 2.5 : 1.5, alpha: 0.8 });
      nodeContainer.addChild(node);

      // Current world indicator
      if (isCurrent) {
        const marker = new Graphics();
        marker.circle(0, 0, 4).fill({ color: 0xffcc44, alpha: 0.9 });
        nodeContainer.addChild(marker);
      }

      // Lock icon for locked worlds
      if (!isUnlocked) {
        const lock = new Text({
          text: '🔒',
          style: new TextStyle({ fontSize: 10 }),
        });
        lock.anchor.set(0.5);
        lock.y = -1;
        nodeContainer.addChild(lock);
      }

      // World name
      const nameLabel = new Text({
        text: world.name,
        style: new TextStyle({
          fontFamily: 'Georgia, serif', fontSize: 9,
          fill: isUnlocked ? 0xddddcc : 0x666666,
          fontWeight: isCurrent ? 'bold' : 'normal',
        }),
      });
      nameLabel.anchor.set(0.5, 0);
      nameLabel.y = 18;
      nodeContainer.addChild(nameLabel);

      // Reputation indicator
      if (isUnlocked) {
        const rep = getReputation(world.id);
        const { name: rankName, rank } = getCurrentRank(world.id);
        const repLabel = new Text({
          text: rep > 0 ? `${rankName}` : '',
          style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 6, fill: rank.color }),
        });
        repLabel.anchor.set(0.5, 0);
        repLabel.y = 28;
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
    this.createBackButton(w);

    // Ambient particles
    for (let i = 0; i < 15; i++) {
      const p = new Graphics();
      p.circle(0, 0, 1).fill({ color: 0x8888cc, alpha: 0.2 });
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

    const w = this.app.screen.width;
    const h = this.app.screen.height;
    const champ = GameManager.shared.champion!;
    const panelW = Math.min(260, w - 30);
    const panelH = 130;
    const px = (w - panelW) / 2;
    const py = h - panelH - 15;

    const panel = new Container();
    panel.zIndex = 5000;

    const bg = new Graphics();
    bg.roundRect(px, py, panelW, panelH, 10)
      .fill({ color: 0x0a0815, alpha: 0.92 })
      .stroke({ color: world.color, width: 2, alpha: 0.7 });
    bg.eventMode = 'static';
    panel.addChild(bg);

    // World name + subtitle
    const nameText = new Text({
      text: world.name,
      style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: 14, fill: world.color, fontWeight: 'bold' }),
    });
    nameText.x = px + 12;
    nameText.y = py + 8;
    panel.addChild(nameText);

    const subText = new Text({
      text: world.subtitle,
      style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: 9, fill: 0x888888, fontStyle: 'italic' }),
    });
    subText.x = px + 12;
    subText.y = py + 26;
    panel.addChild(subText);

    // Reputation info
    const rep = getReputation(world.id);
    const { name: rankName, rank } = getCurrentRank(world.id);
    const repText = new Text({
      text: `Réputation: ${rankName} (${rep})`,
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 9, fill: rank.color }),
    });
    repText.x = px + 12;
    repText.y = py + 42;
    panel.addChild(repText);

    // Zone count
    const zones = Array.from(gameData.zones.values()).filter(z => z.worldID === world.id);
    const zoneText = new Text({
      text: `${zones.length} zones disponibles`,
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 8, fill: 0x999999 }),
    });
    zoneText.x = px + 12;
    zoneText.y = py + 56;
    panel.addChild(zoneText);

    // Travel button
    const isCurrent = champ.currentWorldID === world.id;
    const btnW = panelW - 24;
    const btnH = 32;
    const btnX = px + 12;
    const btnY = py + panelH - btnH - 12;

    const btn = new Graphics();
    btn.roundRect(btnX, btnY, btnW, btnH, 6)
      .fill({ color: isCurrent ? 0x224433 : 0x33264d, alpha: 0.9 })
      .stroke({ color: world.color, width: 1.5, alpha: 0.6 });
    btn.eventMode = 'static';
    btn.cursor = 'pointer';
    panel.addChild(btn);

    const btnLabel = new Text({
      text: isCurrent ? 'Retourner au hub' : `Voyager vers ${world.name}`,
      style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: 11, fill: 0xeeddcc }),
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

  private createBackButton(screenW: number): void {
    const btn = new Container();
    const bg = new Graphics();
    bg.roundRect(0, 0, 70, 28, 6)
      .fill({ color: 0x1a1528, alpha: 0.8 })
      .stroke({ color: 0x443355, width: 1, alpha: 0.5 });
    btn.addChild(bg);

    const label = new Text({
      text: '← Retour',
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 9, fill: 0xcccccc }),
    });
    label.x = 10;
    label.y = 7;
    btn.addChild(label);

    btn.x = 10;
    btn.y = 10;
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
