// ─── Boss Visual Effects (HP Bar + Special Attacks) ─────────────

import { Container, Graphics, Text, TextStyle } from 'pixi.js';

// ─── Boss HP Bar UI ─────────────────────────────────────────────

export function createBossHPBar(
  uiContainer: Container,
  screenW: number,
  bossName: string,
): { container: Container; update: (hpPct: number, phaseName: string) => void; destroy: () => void } {
  const container = new Container();
  container.zIndex = 9000;

  const barW = Math.min(280, screenW - 40);
  const barH = 14;
  const x = (screenW - barW) / 2;
  const y = 100;

  const bg = new Graphics();
  bg.roundRect(x - 4, y - 20, barW + 8, barH + 28, 6)
    .fill({ color: 0x0a0a1a, alpha: 0.75 })
    .stroke({ color: 0x883322, width: 1.5, alpha: 0.6 });
  container.addChild(bg);

  const name = new Text({
    text: bossName,
    style: new TextStyle({
      fontFamily: 'Georgia, serif', fontSize: 10, fill: 0xff6644, fontWeight: 'bold',
    }),
  });
  name.anchor.set(0.5);
  name.x = screenW / 2;
  name.y = y - 12;
  container.addChild(name);

  const barBg = new Graphics();
  barBg.roundRect(x, y, barW, barH, 4)
    .fill({ color: 0x111122, alpha: 0.9 })
    .stroke({ color: 0x332222, width: 1 });
  container.addChild(barBg);

  const barFill = new Graphics();
  container.addChild(barFill);

  const phaseLabel = new Text({
    text: '',
    style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 7, fill: 0xcc6644 }),
  });
  phaseLabel.anchor.set(0.5);
  phaseLabel.x = screenW / 2;
  phaseLabel.y = y + barH + 2;
  container.addChild(phaseLabel);

  uiContainer.addChild(container);

  return {
    container,
    update(hpPct: number, phaseName: string) {
      barFill.clear();
      if (hpPct > 0) {
        const color = hpPct > 0.5 ? 0xcc3333 : hpPct > 0.2 ? 0xff6633 : 0xff2222;
        barFill.roundRect(x, y, barW * hpPct, barH, 4).fill(color);
        barFill.roundRect(x, y, barW * hpPct, barH / 2, 4)
          .fill({ color: 0xffffff, alpha: 0.1 });
      }
      phaseLabel.text = phaseName;
    },
    destroy() {
      container.destroy({ children: true });
    },
  };
}

// ─── Boss Special Attack Effects ────────────────────────────────

export function createBossSpecialEffect(
  worldContainer: Container,
  bossX: number, bossY: number,
  playerX: number, playerY: number,
  attackName: string,
): { damage: number; message: string } {
  const g = new Graphics();

  switch (attackName) {
    // ─── Scadrial (Inquisitor) ───
    case 'steel_push':
    case 'iron_pull':
      g.moveTo(bossX, bossY - 10)
        .lineTo(playerX, playerY - 10)
        .stroke({ color: 0x4488ff, width: 3, alpha: 0.7 });
      g.circle(playerX, playerY - 10, 15).fill({ color: 0x4488ff, alpha: 0.15 });
      break;

    case 'spike_barrage':
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const tx = playerX + Math.cos(angle) * 25;
        const ty = playerY + Math.sin(angle) * 12;
        g.moveTo(bossX, bossY - 10).lineTo(tx, ty - 5)
          .stroke({ color: 0xccccdd, width: 2, alpha: 0.6 });
        g.circle(tx, ty, 4).fill({ color: 0xff4444, alpha: 0.4 });
      }
      break;

    case 'hemalurgy_burst':
      g.circle(bossX, bossY, 70).fill({ color: 0x440000, alpha: 0.15 });
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const r = 60;
        g.moveTo(bossX, bossY).lineTo(bossX + Math.cos(angle) * r, bossY + Math.sin(angle) * r * 0.5)
          .stroke({ color: 0xcc2222, width: 2, alpha: 0.5 });
      }
      g.circle(playerX, playerY, 20).fill({ color: 0x660000, alpha: 0.25 });
      break;

    // ─── Roshar (Thunderclast) ───
    case 'ground_slam':
    case 'stomp_wave':
      g.circle(bossX, bossY, 60).stroke({ color: 0x887766, width: 4, alpha: 0.5 });
      g.circle(bossX, bossY, 40).stroke({ color: 0x998877, width: 2, alpha: 0.3 });
      break;

    case 'earthquake':
      for (let i = 0; i < 4; i++) {
        const r = 30 + i * 20;
        g.circle(bossX, bossY, r).stroke({ color: 0x887766, width: 3 - i * 0.5, alpha: 0.5 - i * 0.1 });
      }
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + Math.random() * 0.3;
        const len = 40 + Math.random() * 30;
        g.moveTo(bossX, bossY).lineTo(bossX + Math.cos(angle) * len, bossY + Math.sin(angle) * len * 0.5)
          .stroke({ color: 0xaa8866, width: 1.5, alpha: 0.4 });
      }
      break;

    case 'rock_throw':
      g.poly([
        { x: bossX, y: bossY - 20 },
        { x: playerX - 5, y: playerY - 5 },
        { x: playerX + 5, y: playerY + 5 },
      ]).fill({ color: 0x665544, alpha: 0.5 });
      g.circle(playerX, playerY, 12).fill({ color: 0x776655, alpha: 0.3 });
      break;

    // ─── Taldain (Sand Lord) ───
    case 'sand_blast':
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const r = 30 + Math.random() * 20;
        g.circle(bossX + Math.cos(angle) * r, bossY + Math.sin(angle) * r, 3)
          .fill({ color: 0xddcc88, alpha: 0.5 });
      }
      break;

    case 'sand_wall':
      for (let i = 0; i < 3; i++) {
        const wx = bossX + (i - 1) * 50;
        g.rect(wx - 3, bossY - 30, 6, 40).fill({ color: 0xccbb77, alpha: 0.4 });
        g.rect(wx - 3, bossY - 30, 6, 40).stroke({ color: 0xddcc88, width: 1, alpha: 0.6 });
      }
      break;

    case 'dark_sand':
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const r = 25 + Math.random() * 25;
        g.circle(bossX + Math.cos(angle) * r, bossY + Math.sin(angle) * r, 4)
          .fill({ color: 0x222200, alpha: 0.5 });
      }
      g.circle(bossX, bossY, 45).fill({ color: 0x111100, alpha: 0.15 });
      break;

    case 'total_eclipse':
      g.rect(bossX - 80, bossY - 40, 160, 80).fill({ color: 0x000000, alpha: 0.3 });
      g.circle(bossX, bossY - 20, 20).fill({ color: 0x110000, alpha: 0.4 });
      g.circle(bossX, bossY - 20, 22).stroke({ color: 0xcc6600, width: 2, alpha: 0.5 });
      break;

    // ─── Komashi (Father of Nightmares) ───
    case 'fear_pulse':
      g.circle(bossX, bossY, 50).fill({ color: 0x220033, alpha: 0.2 });
      g.circle(bossX, bossY, 50).stroke({ color: 0x6633aa, width: 3, alpha: 0.6 });
      break;

    case 'shadow_clone':
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        const cx = bossX + Math.cos(angle) * 45;
        const cy = bossY + Math.sin(angle) * 22;
        g.ellipse(cx, cy, 8, 12).fill({ color: 0x332244, alpha: 0.4 });
        g.ellipse(cx, cy, 10, 14).stroke({ color: 0x6644aa, width: 1, alpha: 0.3 });
      }
      break;

    case 'reality_warp':
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const r1 = 30 + Math.random() * 20;
        const r2 = 20 + Math.random() * 15;
        g.ellipse(bossX + Math.cos(angle) * r1, bossY + Math.sin(angle) * r2 * 0.5, 10, 6)
          .fill({ color: 0x4422aa, alpha: 0.2 });
      }
      g.circle(bossX, bossY, 35).stroke({ color: 0x8855cc, width: 2, alpha: 0.4 });
      break;

    case 'void_consume':
      g.circle(bossX, bossY, 60).fill({ color: 0x110022, alpha: 0.3 });
      g.circle(bossX, bossY, 60).stroke({ color: 0x6633aa, width: 4, alpha: 0.6 });
      g.circle(bossX, bossY, 40).stroke({ color: 0x8844cc, width: 2, alpha: 0.4 });
      g.moveTo(bossX, bossY).lineTo(playerX, playerY)
        .stroke({ color: 0x440066, width: 3, alpha: 0.5 });
      break;

    // ─── Nalthis (Returned Champion) ───
    case 'divine_breath_blast':
      g.moveTo(bossX, bossY - 10).lineTo(playerX, playerY - 10)
        .stroke({ color: 0xffdd44, width: 4, alpha: 0.6 });
      g.circle(playerX, playerY, 18).fill({ color: 0xffdd44, alpha: 0.15 });
      g.circle(bossX, bossY, 25).fill({ color: 0xffee66, alpha: 0.1 });
      break;

    case 'lifeless_summon':
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const sx = bossX + Math.cos(angle) * 50;
        const sy = bossY + Math.sin(angle) * 25;
        g.ellipse(sx, sy, 6, 10).fill({ color: 0x666666, alpha: 0.4 });
        g.circle(sx, sy - 8, 3).fill({ color: 0x888888, alpha: 0.3 });
      }
      break;

    case 'color_storm': {
      const colors = [0xff4444, 0x44ff44, 0x4444ff, 0xffff44, 0xff44ff, 0x44ffff];
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const r = 20 + Math.random() * 35;
        const c = colors[i % colors.length];
        g.circle(bossX + Math.cos(angle) * r, bossY + Math.sin(angle) * r * 0.5, 5)
          .fill({ color: c, alpha: 0.3 });
      }
      break;
    }

    case 'divine_explosion':
      g.circle(bossX, bossY, 80).fill({ color: 0xffee44, alpha: 0.1 });
      g.circle(bossX, bossY, 60).fill({ color: 0xffcc22, alpha: 0.15 });
      g.circle(bossX, bossY, 40).fill({ color: 0xffaa00, alpha: 0.2 });
      g.circle(bossX, bossY, 80).stroke({ color: 0xffdd44, width: 3, alpha: 0.5 });
      break;

    // ─── Sel (Dominion Avatar) ───
    case 'dominion_decree':
      g.moveTo(bossX, bossY - 15).lineTo(playerX, playerY - 15)
        .stroke({ color: 0xddaa44, width: 3, alpha: 0.6 });
      g.circle(playerX, playerY, 15).stroke({ color: 0xddaa44, width: 2, alpha: 0.4 });
      g.circle(bossX, bossY, 30).stroke({ color: 0xddaa44, width: 1.5, alpha: 0.3 });
      break;

    case 'aon_shatter':
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const r = 25 + Math.random() * 30;
        const sx = bossX + Math.cos(angle) * r;
        const sy = bossY + Math.sin(angle) * r * 0.5;
        g.rect(sx - 4, sy - 4, 8, 8).stroke({ color: 0xddaa44, width: 1.5, alpha: 0.5 });
        g.moveTo(sx - 4, sy - 4).lineTo(sx + 4, sy + 4)
          .stroke({ color: 0xff6644, width: 1, alpha: 0.4 });
      }
      break;

    case 'realm_tear':
      g.ellipse(bossX + 40, bossY, 12, 20).stroke({ color: 0x6644aa, width: 2, alpha: 0.5 });
      g.ellipse(bossX + 40, bossY, 10, 18).fill({ color: 0x330066, alpha: 0.2 });
      g.ellipse(bossX - 40, bossY + 10, 12, 20).stroke({ color: 0x6644aa, width: 2, alpha: 0.5 });
      g.ellipse(bossX - 40, bossY + 10, 10, 18).fill({ color: 0x330066, alpha: 0.2 });
      break;

    case 'divine_wrath':
      for (let i = 0; i < 5; i++) {
        const tx = playerX + (Math.random() - 0.5) * 60;
        const ty = playerY + (Math.random() - 0.5) * 30;
        g.moveTo(tx, ty - 80).lineTo(tx + (Math.random() - 0.5) * 15, ty - 40).lineTo(tx, ty)
          .stroke({ color: 0xffdd44, width: 2, alpha: 0.6 });
        g.circle(tx, ty, 6).fill({ color: 0xffee66, alpha: 0.2 });
      }
      break;

    // ─── Shadesmar (Shattered Shard — Final Boss) ───
    case 'shard_beam':
      g.moveTo(bossX, bossY - 15).lineTo(playerX, playerY - 10)
        .stroke({ color: 0xee4444, width: 5, alpha: 0.6 });
      g.circle(playerX, playerY, 20).fill({ color: 0xee4444, alpha: 0.15 });
      g.circle(bossX, bossY, 30).fill({ color: 0xff6644, alpha: 0.1 });
      break;

    case 'summon_shades':
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const sx = bossX + Math.cos(angle) * 55;
        const sy = bossY + Math.sin(angle) * 28;
        g.ellipse(sx, sy, 6, 10).fill({ color: 0x443366, alpha: 0.4 });
        g.circle(sx, sy - 6, 2).fill({ color: 0xaa88ff, alpha: 0.3 });
      }
      break;

    case 'cosmic_storm':
      for (let i = 0; i < 5; i++) {
        const r = 25 + i * 15;
        g.circle(bossX, bossY, r).stroke({ color: i % 2 === 0 ? 0x4466cc : 0xcc4466, width: 2, alpha: 0.4 - i * 0.06 });
      }
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const r = 70;
        g.moveTo(bossX, bossY).lineTo(bossX + Math.cos(angle) * r, bossY + Math.sin(angle) * r * 0.5)
          .stroke({ color: 0xaa66ff, width: 1.5, alpha: 0.4 });
      }
      break;

    case 'shard_annihilation':
      g.circle(bossX, bossY, 90).fill({ color: 0xff2222, alpha: 0.1 });
      g.circle(bossX, bossY, 70).fill({ color: 0xff4444, alpha: 0.12 });
      g.circle(bossX, bossY, 50).fill({ color: 0xff6644, alpha: 0.15 });
      g.circle(bossX, bossY, 30).fill({ color: 0xffaa44, alpha: 0.2 });
      g.circle(bossX, bossY, 90).stroke({ color: 0xff2222, width: 4, alpha: 0.6 });
      for (let i = 0; i < 4; i++) {
        const off = (Math.random() - 0.5) * 20;
        g.moveTo(bossX + off, bossY + off * 0.5).lineTo(playerX + off, playerY + off * 0.5)
          .stroke({ color: 0xff4444, width: 2, alpha: 0.4 });
      }
      break;

    default:
      g.circle(bossX, bossY, 30).stroke({ color: 0xff4444, width: 3, alpha: 0.5 });
      g.moveTo(bossX, bossY - 10).lineTo(playerX, playerY - 10)
        .stroke({ color: 0xff4444, width: 2, alpha: 0.4 });
      break;
  }

  g.zIndex = 100000;
  worldContainer.addChild(g);

  // Fade and destroy with real delta time
  let elapsed = 0;
  let lastTime = performance.now();
  const anim = () => {
    const now = performance.now();
    const frameDt = (now - lastTime) / 1000;
    lastTime = now;
    elapsed += frameDt;
    g.alpha = Math.max(0, 1 - elapsed / 0.6);
    if (elapsed < 0.6) requestAnimationFrame(anim);
    else g.destroy();
  };
  requestAnimationFrame(anim);

  const damages: Record<string, number> = {
    // Scadrial
    steel_push: 20, iron_pull: 25, spike_barrage: 40, hemalurgy_burst: 55,
    // Roshar
    ground_slam: 30, rock_throw: 25, stomp_wave: 35, earthquake: 40,
    // Taldain
    sand_blast: 20, sand_wall: 15, dark_sand: 35, total_eclipse: 50,
    // Komashi
    fear_pulse: 15, shadow_clone: 10, void_consume: 45, reality_warp: 30,
    // Nalthis
    divine_breath_blast: 30, lifeless_summon: 10, color_storm: 35, divine_explosion: 55,
    // Sel
    dominion_decree: 25, aon_shatter: 30, realm_tear: 35, divine_wrath: 50,
    // Shadesmar (Final Boss)
    shard_beam: 35, summon_shades: 15, cosmic_storm: 45, shard_annihilation: 70,
  };

  return {
    damage: damages[attackName] ?? 20,
    message: getAttackMessage(attackName),
  };
}

function getAttackMessage(attack: string): string {
  const messages: Record<string, string> = {
    // Scadrial
    steel_push: 'Poussée d\'acier!',
    iron_pull: 'Traction de fer!',
    spike_barrage: 'Pluie de pics!',
    hemalurgy_burst: 'Explosion hémalurgique!',
    // Roshar
    ground_slam: 'Frappe au sol!',
    rock_throw: 'Jet de roche!',
    stomp_wave: 'Onde de choc!',
    earthquake: 'Tremblement de terre!',
    // Taldain
    sand_blast: 'Souffle de sable!',
    sand_wall: 'Mur de sable!',
    dark_sand: 'Sable noir!',
    total_eclipse: 'Éclipse totale!',
    // Komashi
    fear_pulse: 'Onde de peur!',
    shadow_clone: 'Clones d\'ombre!',
    void_consume: 'Néant dévorant!',
    reality_warp: 'Distorsion de réalité!',
    // Nalthis
    divine_breath_blast: 'Souffle Divin!',
    lifeless_summon: 'Armée de Sans-Vie!',
    color_storm: 'Tempête chromatique!',
    divine_explosion: 'Explosion divine!',
    // Sel
    dominion_decree: 'Décret de Domination!',
    aon_shatter: 'Fracture des Aons!',
    realm_tear: 'Déchirure dimensionnelle!',
    divine_wrath: 'Colère divine!',
    // Shadesmar
    shard_beam: 'Rayon de l\'Éclat!',
    summon_shades: 'Invocation d\'ombres!',
    cosmic_storm: 'Tempête cosmique!',
    shard_annihilation: 'ANNIHILATION!',
  };
  return messages[attack] ?? 'Attaque spéciale!';
}
