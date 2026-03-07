import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { GameManager } from '../game/GameManager';
import { getLayoutInfo, fontSize, scaled, buttonHeight, panelRadius, UI_COLORS } from '../ui/ResponsiveLayout';
import type { LayoutInfo } from '../ui/ResponsiveLayout';

// ─── World-Specific Death Particles ─────────────────────────────

interface DeathParticle {
  g: Graphics;
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  size: number;
  rotSpeed: number;
}

const WORLD_PARTICLE_CONFIGS: Record<string, { color: number; count: number; style: string }> = {
  scadrial:  { color: 0x8888aa, count: 30, style: 'ash' },
  roshar:    { color: 0x88ccff, count: 25, style: 'stormlight' },
  nalthis:   { color: 0xcc88ff, count: 20, style: 'color-drain' },
  taldain:   { color: 0xddcc88, count: 35, style: 'sand' },
  sel:       { color: 0xffcc44, count: 20, style: 'aon-fade' },
  komashi:   { color: 0x6633aa, count: 25, style: 'ink' },
  shadesmar: { color: 0xaa88ff, count: 20, style: 'cognitive' },
};

// ─── Main Death Screen ──────────────────────────────────────────

export function showDeathScreen(
  uiContainer: Container,
  screenW: number,
  screenH: number,
  onRespawn: () => void,
): Container {
  const layout = getLayoutInfo(screenW, screenH);
  const panel = new Container();
  panel.zIndex = 20000;

  // Full screen dark overlay with red tint — fade in
  const overlay = new Graphics();
  overlay.rect(0, 0, screenW, screenH).fill({ color: 0x110000, alpha: 0.88 });
  overlay.eventMode = 'static';
  panel.addChild(overlay);

  // Blood vignette edges
  const vignetteH = scaled(35, layout);
  const vignetteW = scaled(25, layout);
  const vignette = new Graphics();
  vignette.rect(0, 0, screenW, vignetteH).fill({ color: 0x440000, alpha: 0.5 });
  vignette.rect(0, screenH - vignetteH, screenW, vignetteH).fill({ color: 0x440000, alpha: 0.5 });
  vignette.rect(0, 0, vignetteW, screenH).fill({ color: 0x440000, alpha: 0.35 });
  vignette.rect(screenW - vignetteW, 0, vignetteW, screenH).fill({ color: 0x440000, alpha: 0.35 });
  panel.addChild(vignette);

  // ─── Death Symbol ───────────────────────────────────────────
  const symbol = new Graphics();
  const symX = screenW / 2;
  const symY = screenH / 2 - scaled(110, layout);
  drawDeathSymbol(symbol, symX, symY, layout);
  symbol.alpha = 0;
  panel.addChild(symbol);

  // ─── Particle Layer ─────────────────────────────────────────
  const particleContainer = new Container();
  particleContainer.zIndex = 20001;
  panel.addChild(particleContainer);

  const worldID = GameManager.shared.champion?.currentWorldID ?? 'scadrial';
  const particleConfig = WORLD_PARTICLE_CONFIGS[worldID] ?? WORLD_PARTICLE_CONFIGS.scadrial;
  const particles: DeathParticle[] = [];

  // Spawn death particles
  for (let i = 0; i < particleConfig.count; i++) {
    const p = spawnDeathParticle(particleContainer, screenW, screenH, particleConfig, i);
    particles.push(p);
  }

  // Death title — dramatic with glow
  const title = new Text({
    text: 'VOUS \u00CATES TOMB\u00C9',
    style: new TextStyle({
      fontFamily: 'Georgia, serif',
      fontSize: fontSize(30, layout),
      fill: UI_COLORS.danger,
      fontWeight: 'bold',
      dropShadow: { color: 0x000000, blur: 6, distance: 3 },
    }),
  });
  title.anchor.set(0.5);
  title.x = screenW / 2;
  title.y = screenH / 2 - scaled(65, layout);
  title.alpha = 0;
  title.scale.set(1.5);
  panel.addChild(title);

  // Title glow behind text
  const titleGlow = new Graphics();
  titleGlow.ellipse(screenW / 2, screenH / 2 - scaled(65, layout), scaled(140, layout), scaled(20, layout))
    .fill({ color: 0xff2200, alpha: 0.08 });
  titleGlow.alpha = 0;
  panel.addChild(titleGlow);

  // Penalty info
  const champ = GameManager.shared.champion;
  const goldLost = champ ? Math.floor(champ.gold * 0.1) : 0;
  const xpLost = champ ? Math.floor(champ.currentXP * 0.05) : 0;

  const penaltyText = new Text({
    text: `P\u00E9nalit\u00E9: -${goldLost} or  -${xpLost} XP`,
    style: new TextStyle({
      fontFamily: 'sans-serif',
      fontSize: fontSize(13, layout),
      fill: 0xff6644,
      fontWeight: 'bold',
    }),
  });
  penaltyText.anchor.set(0.5);
  penaltyText.x = screenW / 2;
  penaltyText.y = screenH / 2 - scaled(22, layout);
  penaltyText.alpha = 0;
  panel.addChild(penaltyText);

  // Apply penalties
  if (champ) {
    champ.gold = Math.max(0, champ.gold - goldLost);
    champ.currentXP = Math.max(0, champ.currentXP - xpLost);
  }

  // Flavor text
  const flavorTexts: Record<string, string> = {
    scadrial: 'Les brumes vous enveloppent... vous sombrez dans l\'obscurit\u00E9.',
    roshar: 'La Lumi\u00E8re d\'Orage s\'\u00E9teint... les t\u00E9n\u00E8bres vous happent.',
    nalthis: 'Vos couleurs s\'estompent... le monde devient gris.',
    taldain: 'Le sable retombe... le silence du d\u00E9sert vous engloutit.',
    sel: 'Les Aons s\'effacent... le Dor vous abandonne.',
    komashi: 'Les cauchemars vous submergent... tout devient noir.',
    shadesmar: 'Le Royaume Cognitif se dissout autour de vous...',
  };

  const flavor = new Text({
    text: flavorTexts[worldID] ?? flavorTexts.scadrial,
    style: new TextStyle({
      fontFamily: 'Georgia, serif',
      fontSize: fontSize(11, layout),
      fill: 0x886666,
      fontStyle: 'italic',
      wordWrap: true,
      wordWrapWidth: screenW - scaled(80, layout),
      align: 'center',
    }),
  });
  flavor.anchor.set(0.5);
  flavor.x = screenW / 2;
  flavor.y = screenH / 2 + scaled(12, layout);
  flavor.alpha = 0;
  panel.addChild(flavor);

  // Respawn button
  const btnW = scaled(180, layout);
  const btnH = buttonHeight(layout) + scaled(4, layout);
  const radius = panelRadius(layout);
  const btnContainer = new Container();
  btnContainer.alpha = 0;

  const btnBg = new Graphics();
  btnBg.roundRect(screenW / 2 - btnW / 2, screenH / 2 + scaled(52, layout), btnW, btnH, radius)
    .fill({ color: 0x331111, alpha: 0.92 })
    .stroke({ color: 0xcc4444, width: 2, alpha: 0.8 });
  btnBg.eventMode = 'static';
  btnBg.cursor = 'pointer';
  btnContainer.addChild(btnBg);

  const btnLabel = new Text({
    text: 'R\u00E9appara\u00EEtre',
    style: new TextStyle({
      fontFamily: 'Georgia, serif',
      fontSize: fontSize(15, layout),
      fill: 0xffcccc,
      fontWeight: 'bold',
    }),
  });
  btnLabel.anchor.set(0.5);
  btnLabel.x = screenW / 2;
  btnLabel.y = screenH / 2 + scaled(52, layout) + btnH / 2;
  btnContainer.addChild(btnLabel);

  // Pulsing border on button
  const btnPulse = new Graphics();
  btnContainer.addChild(btnPulse);

  panel.addChild(btnContainer);

  // ─── Animation Loop ─────────────────────────────────────────
  let elapsed = 0;
  let lastTime = performance.now();
  let animActive = true;

  const animate = () => {
    if (!animActive) return;
    const now = performance.now();
    const frameDt = (now - lastTime) / 1000;
    lastTime = now;
    elapsed += frameDt;

    // Phase 1: Overlay fade in (0-0.3s)
    if (elapsed < 0.3) {
      overlay.alpha = (elapsed / 0.3) * 0.88;
    }

    // Phase 2: Symbol fade in (0.2-0.6s)
    if (elapsed > 0.2 && elapsed < 0.6) {
      const p = (elapsed - 0.2) / 0.4;
      symbol.alpha = p;
      symbol.scale.set(1.2 - p * 0.2);
    } else if (elapsed >= 0.6) {
      symbol.alpha = 1;
      // Subtle pulse
      symbol.scale.set(1 + Math.sin(elapsed * 2) * 0.02);
    }

    // Phase 3: Title slam in (0.4-0.7s)
    if (elapsed > 0.4 && elapsed < 0.7) {
      const p = (elapsed - 0.4) / 0.3;
      title.alpha = p;
      title.scale.set(1.5 - p * 0.5); // Scale down from 1.5 to 1
      titleGlow.alpha = p;
    } else if (elapsed >= 0.7) {
      title.alpha = 1;
      title.scale.set(1);
      titleGlow.alpha = 0.6 + Math.sin(elapsed * 3) * 0.4;
    }

    // Phase 4: Penalty and flavor fade (0.8-1.2s)
    if (elapsed > 0.8) {
      const p = Math.min(1, (elapsed - 0.8) / 0.4);
      penaltyText.alpha = p;
      flavor.alpha = p;
    }

    // Phase 5: Button fade in (1.5-2.0s)
    if (elapsed > 1.5) {
      const fadeProgress = Math.min(1, (elapsed - 1.5) / 0.5);
      btnContainer.alpha = fadeProgress;
      // Pulsing button border
      if (fadeProgress >= 1) {
        const pulse = 0.5 + Math.sin(elapsed * 3) * 0.5;
        btnPulse.clear();
        btnPulse.roundRect(
          screenW / 2 - btnW / 2 - 2, screenH / 2 + scaled(52, layout) - 2,
          btnW + 4, btnH + 4, radius + 2,
        ).stroke({ color: 0xff4444, width: 1, alpha: pulse * 0.4 });
      }
    }

    // Update particles
    for (const p of particles) {
      p.life += frameDt;
      p.x += p.vx * frameDt;
      p.y += p.vy * frameDt;
      p.g.x = p.x;
      p.g.y = p.y;
      p.g.rotation += p.rotSpeed * frameDt;

      const lifeRatio = p.life / p.maxLife;
      p.g.alpha = Math.max(0, (1 - lifeRatio) * 0.5);

      // Respawn particles
      if (p.life >= p.maxLife) {
        p.life = 0;
        p.x = Math.random() * screenW;
        p.y = screenH + 10;
        p.vy = -20 - Math.random() * 30;
        p.vx = (Math.random() - 0.5) * 20;
      }
    }

    // Vignette pulse
    vignette.alpha = 0.8 + Math.sin(elapsed * 1.5) * 0.2;

    requestAnimationFrame(animate);
  };
  requestAnimationFrame(animate);

  btnBg.on('pointerdown', () => {
    btnBg.alpha = 0.7;
    animActive = false;
    // Cleanup particles
    for (const p of particles) p.g.destroy();
    onRespawn();
  });
  btnBg.on('pointerup', () => { btnBg.alpha = 1; });

  uiContainer.addChild(panel);
  return panel;
}

// ─── Death Symbol ───────────────────────────────────────────────

function drawDeathSymbol(g: Graphics, x: number, y: number, layout: LayoutInfo): void {
  const s = scaled(1, layout);

  // Outer ring
  g.circle(x, y, 22 * s).stroke({ color: 0xcc3333, width: 2, alpha: 0.5 });
  g.circle(x, y, 18 * s).stroke({ color: 0x882222, width: 1, alpha: 0.3 });

  // Broken sword (death icon)
  // Blade top half
  g.poly([
    { x: x - 2 * s, y: y - 16 * s },
    { x: x, y: y - 22 * s },
    { x: x + 2 * s, y: y - 16 * s },
    { x: x + 1.5 * s, y: y - 4 * s },
    { x: x - 1.5 * s, y: y - 4 * s },
  ]).fill({ color: 0x888899, alpha: 0.6 });
  // Blade bottom (broken, angled)
  g.poly([
    { x: x - 1.5 * s, y: y - 2 * s },
    { x: x + 2 * s, y: y - 3 * s },
    { x: x + 3 * s, y: y + 6 * s },
    { x: x - 1 * s, y: y + 5 * s },
  ]).fill({ color: 0x667788, alpha: 0.5 });
  // Crossguard
  g.rect(x - 8 * s, y - 5 * s, 16 * s, 3 * s).fill({ color: 0xaa8833, alpha: 0.6 });
  // Handle
  g.rect(x - 1.5 * s, y - 2 * s, 3 * s, 10 * s).fill({ color: 0x553322, alpha: 0.7 });
  // Pommel
  g.circle(x, y + 10 * s, 2.5 * s).fill({ color: 0xaa8833, alpha: 0.5 });

  // Break line glow
  g.moveTo(x - 2 * s, y - 3 * s).lineTo(x + 3 * s, y - 2 * s)
    .stroke({ color: 0xff4444, width: 1.5, alpha: 0.4 });
}

// ─── Particle Spawning ──────────────────────────────────────────

function spawnDeathParticle(
  container: Container,
  screenW: number, screenH: number,
  config: { color: number; style: string },
  index: number,
): DeathParticle {
  const g = new Graphics();
  const size = 1 + Math.random() * 3;

  switch (config.style) {
    case 'ash':
      // Ash flakes drifting down
      g.ellipse(0, 0, size, size * 0.5).fill({ color: config.color, alpha: 0.4 });
      break;
    case 'stormlight':
      // Glowing orbs rising
      g.circle(0, 0, size * 0.8).fill({ color: 0x88ccff, alpha: 0.3 });
      g.circle(0, 0, size * 0.4).fill({ color: 0xcceeFF, alpha: 0.2 });
      break;
    case 'color-drain':
      // Colored motes fading to gray
      const colors = [0xff4466, 0x44aaff, 0x44ff66, 0xffaa22, 0xaa44ff];
      g.circle(0, 0, size).fill({ color: colors[index % colors.length], alpha: 0.3 });
      break;
    case 'sand':
      // Sand grains falling
      g.circle(0, 0, size * 0.5).fill({ color: config.color, alpha: 0.35 });
      break;
    case 'aon-fade':
      // Glowing Aon dots
      g.circle(0, 0, size * 0.6).fill({ color: 0xffcc44, alpha: 0.25 });
      g.circle(0, 0, size * 0.3).fill({ color: 0xffee88, alpha: 0.15 });
      break;
    case 'ink':
      // Dark ink drips
      g.ellipse(0, 0, size * 0.6, size).fill({ color: 0x222244, alpha: 0.4 });
      break;
    case 'cognitive':
      // Reality fragments
      g.rect(-size * 0.5, -size * 0.5, size, size).fill({ color: config.color, alpha: 0.25 });
      break;
    default:
      g.circle(0, 0, size).fill({ color: config.color, alpha: 0.3 });
  }

  const x = Math.random() * screenW;
  const y = Math.random() * screenH;
  g.x = x;
  g.y = y;
  container.addChild(g);

  const isRising = config.style === 'stormlight' || config.style === 'cognitive';

  return {
    g, x, y,
    vx: (Math.random() - 0.5) * 15,
    vy: isRising ? (-15 - Math.random() * 25) : (5 + Math.random() * 15),
    life: Math.random() * 3, // Stagger start times
    maxLife: 3 + Math.random() * 3,
    size,
    rotSpeed: (Math.random() - 0.5) * 2,
  };
}
