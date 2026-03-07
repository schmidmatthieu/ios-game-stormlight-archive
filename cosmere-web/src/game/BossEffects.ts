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
  const y = 50;

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
    case 'steel_push':
    case 'iron_pull':
      g.moveTo(bossX, bossY - 10)
        .lineTo(playerX, playerY - 10)
        .stroke({ color: 0x4488ff, width: 3, alpha: 0.7 });
      g.circle(playerX, playerY - 10, 15).fill({ color: 0x4488ff, alpha: 0.15 });
      break;

    case 'ground_slam':
    case 'stomp_wave':
      g.circle(bossX, bossY, 60).stroke({ color: 0x887766, width: 4, alpha: 0.5 });
      g.circle(bossX, bossY, 40).stroke({ color: 0x998877, width: 2, alpha: 0.3 });
      break;

    case 'rock_throw':
      g.poly([
        { x: bossX, y: bossY - 20 },
        { x: playerX - 5, y: playerY - 5 },
        { x: playerX + 5, y: playerY + 5 },
      ]).fill({ color: 0x665544, alpha: 0.5 });
      g.circle(playerX, playerY, 12).fill({ color: 0x776655, alpha: 0.3 });
      break;

    case 'sand_blast':
    case 'dark_sand':
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const r = 30 + Math.random() * 20;
        g.circle(bossX + Math.cos(angle) * r, bossY + Math.sin(angle) * r, 3)
          .fill({ color: attackName === 'dark_sand' ? 0x222200 : 0xddcc88, alpha: 0.5 });
      }
      break;

    case 'fear_pulse':
    case 'void_consume':
      g.circle(bossX, bossY, 50).fill({ color: 0x220033, alpha: 0.2 });
      g.circle(bossX, bossY, 50).stroke({ color: 0x6633aa, width: 3, alpha: 0.6 });
      break;

    case 'shadow_clone':
      for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI * 2;
        const cx = bossX + Math.cos(angle) * 40;
        const cy = bossY + Math.sin(angle) * 20;
        g.ellipse(cx, cy, 8, 12).fill({ color: 0x332244, alpha: 0.4 });
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
    steel_push: 20, iron_pull: 25, spike_barrage: 40,
    ground_slam: 30, rock_throw: 25, stomp_wave: 35,
    sand_blast: 20, sand_wall: 15, dark_sand: 35,
    fear_pulse: 15, shadow_clone: 10, void_consume: 45,
  };

  return {
    damage: damages[attackName] ?? 20,
    message: getAttackMessage(attackName),
  };
}

function getAttackMessage(attack: string): string {
  const messages: Record<string, string> = {
    steel_push: 'Poussée d\'acier!',
    iron_pull: 'Traction de fer!',
    spike_barrage: 'Pluie de pics!',
    ground_slam: 'Frappe au sol!',
    rock_throw: 'Jet de roche!',
    stomp_wave: 'Onde de choc!',
    sand_blast: 'Souffle de sable!',
    sand_wall: 'Mur de sable!',
    dark_sand: 'Sable noir!',
    fear_pulse: 'Onde de peur!',
    shadow_clone: 'Clones d\'ombre!',
    void_consume: 'Néant dévorant!',
  };
  return messages[attack] ?? 'Attaque spéciale!';
}
