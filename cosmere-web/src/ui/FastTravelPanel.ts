// ─── Fast Travel Panel ──────────────────────────────────────────
// Full-screen overlay showing discovered zones organized by world.
// Player can select a zone to instantly teleport there.

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { FastTravelManager } from '../game/FastTravelSystem';
import { GameManager } from '../game/GameManager';
import { MusicManager } from '../game/MusicSystem';
import type { Zone, WorldID } from '../data/types';
import { getLayoutInfo, fontSize, scaled, panelRadius, UI_COLORS, UI_ALPHA } from './ResponsiveLayout';

// ─── World Display Names ────────────────────────────────────────

const WORLD_NAMES: Record<string, string> = {
  scadrial: 'Scadrial',
  roshar: 'Roshar',
  taldain: 'Taldain',
  komashi: 'Komashi',
  nalthis: 'Nalthis',
  sel: 'Sel',
  shadesmar: 'Shadesmar',
};

const WORLD_COLORS: Record<string, number> = {
  scadrial: 0x886644,
  roshar: 0x4466aa,
  taldain: 0xddaa44,
  komashi: 0x664488,
  nalthis: 0x44aa66,
  sel: 0xaaaa44,
  shadesmar: 0x4444aa,
};

const ZONE_TYPE_ICON: Record<string, string> = {
  hub: '🏠',
  exploration: '⚔',
  boss: '💀',
};

// ─── Panel Creation ─────────────────────────────────────────────

export function showFastTravelPanel(
  parent: Container,
  screenW: number,
  screenH: number,
  onTravel: (zoneID: string) => void,
  onClose: () => void,
): Container {
  const panel = new Container();
  panel.zIndex = 200000;
  parent.addChild(panel);

  const layout = getLayoutInfo(screenW, screenH);
  const ftm = FastTravelManager.shared;
  const champ = GameManager.shared.champion;
  const currentZone = champ?.currentZoneID ?? '';
  const currentWorld = champ?.currentWorldID ?? 'scadrial';

  // Backdrop
  const backdrop = new Graphics();
  backdrop.rect(0, 0, screenW, screenH).fill({ color: 0x000000, alpha: 0.7 });
  backdrop.eventMode = 'static';
  backdrop.on('pointerdown', () => { /* block clicks */ });
  panel.addChild(backdrop);

  // Panel background
  const pw = Math.min(screenW * 0.9, scaled(500, layout));
  const ph = Math.min(screenH * 0.85, scaled(600, layout));
  const px = (screenW - pw) / 2;
  const py = (screenH - ph) / 2;
  const radius = panelRadius(layout);

  const bg = new Graphics();
  bg.roundRect(px, py, pw, ph, radius).fill({ color: 0x0a0a1a, alpha: 0.95 });
  bg.roundRect(px, py, pw, ph, radius).stroke({ color: UI_COLORS.borderGold, width: 1.5, alpha: 0.6 });
  panel.addChild(bg);

  // Title
  const titleSize = fontSize(18, layout);
  const title = new Text({
    text: '⚡ Voyage Rapide',
    style: new TextStyle({
      fontFamily: "'Cinzel', Georgia, serif",
      fontSize: titleSize,
      fill: UI_COLORS.textPrimary,
      fontWeight: 'bold',
    }),
  });
  title.anchor.set(0.5, 0);
  title.x = screenW / 2;
  title.y = py + scaled(15, layout);
  panel.addChild(title);

  // Discovery stats
  const stats = ftm.getDiscoveryStats();
  const totalDiscovered = Object.values(stats).reduce((s, v) => s + v.discovered, 0);
  const totalZones = Object.values(stats).reduce((s, v) => s + v.total, 0);
  const statsText = new Text({
    text: `${totalDiscovered}/${totalZones} zones découvertes`,
    style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(9, layout), fill: 0x888899 }),
  });
  statsText.anchor.set(0.5, 0);
  statsText.x = screenW / 2;
  statsText.y = py + scaled(40, layout);
  panel.addChild(statsText);

  // Close button
  const closeBtn = createCloseButton(px + pw - scaled(30, layout), py + scaled(10, layout), layout, () => {
    parent.removeChild(panel);
    panel.destroy({ children: true });
    onClose();
  });
  panel.addChild(closeBtn);

  // Scrollable zone list
  const listY = py + scaled(60, layout);
  const listH = ph - scaled(80, layout);
  const itemH = scaled(36, layout);
  const itemW = pw - scaled(30, layout);
  const listX = px + scaled(15, layout);

  // Show current world first, then others
  const worldOrder = [currentWorld, ...Object.keys(WORLD_NAMES).filter(w => w !== currentWorld)];
  let yOff = 0;

  for (const worldID of worldOrder) {
    const zones = ftm.getDiscoveredForWorld(worldID as WorldID);
    if (zones.length === 0) continue;

    // World header
    const worldColor = WORLD_COLORS[worldID] ?? 0x888888;
    const worldStat = stats[worldID];
    const headerText = new Text({
      text: `${WORLD_NAMES[worldID] ?? worldID}  (${worldStat?.discovered ?? 0}/${worldStat?.total ?? 0})`,
      style: new TextStyle({
        fontFamily: 'sans-serif',
        fontSize: fontSize(11, layout),
        fill: worldColor,
        fontWeight: 'bold',
      }),
    });
    headerText.x = listX;
    headerText.y = listY + yOff;
    if (headerText.y + itemH < listY + listH) {
      panel.addChild(headerText);
    }
    yOff += scaled(22, layout);

    // Zone entries
    for (const zone of zones) {
      const isCurrent = zone.id === currentZone;
      const entryY = listY + yOff;
      if (entryY + itemH > listY + listH) break;

      const entry = new Container();
      entry.x = listX;
      entry.y = entryY;

      // Background
      const entryBg = new Graphics();
      const bgColor = isCurrent ? 0x223344 : 0x111122;
      entryBg.roundRect(0, 0, itemW, itemH - 2, 4).fill({ color: bgColor, alpha: 0.6 });
      if (isCurrent) {
        entryBg.roundRect(0, 0, itemW, itemH - 2, 4).stroke({ color: worldColor, width: 1, alpha: 0.5 });
      }
      entry.addChild(entryBg);

      // Zone icon + name
      const icon = ZONE_TYPE_ICON[zone.type] ?? '?';
      const label = new Text({
        text: `${icon} ${zone.name}`,
        style: new TextStyle({
          fontFamily: 'sans-serif',
          fontSize: fontSize(10, layout),
          fill: isCurrent ? 0xddddee : 0xaaaabb,
        }),
      });
      label.x = scaled(8, layout);
      label.y = (itemH - 2) / 2;
      label.anchor.set(0, 0.5);
      entry.addChild(label);

      // Level indicator
      const lvlText = new Text({
        text: isCurrent ? '(ici)' : `Nv.${zone.recommendedLevel}`,
        style: new TextStyle({
          fontFamily: 'sans-serif',
          fontSize: fontSize(8, layout),
          fill: isCurrent ? worldColor : 0x666677,
        }),
      });
      lvlText.x = itemW - scaled(8, layout);
      lvlText.y = (itemH - 2) / 2;
      lvlText.anchor.set(1, 0.5);
      entry.addChild(lvlText);

      // Click handler
      if (!isCurrent) {
        entry.eventMode = 'static';
        entry.cursor = 'pointer';
        entry.on('pointerover', () => { entryBg.tint = 0xaaaaff; });
        entry.on('pointerout', () => { entryBg.tint = 0xffffff; });
        entry.on('pointerdown', () => {
          MusicManager.shared.playSFX('button_click');
          if (ftm.travelTo(zone.id)) {
            parent.removeChild(panel);
            panel.destroy({ children: true });
            onTravel(zone.id);
          }
        });
      }

      panel.addChild(entry);
      yOff += itemH;
    }

    yOff += scaled(8, layout); // Spacing between worlds
  }

  return panel;
}

// ─── Close Button ───────────────────────────────────────────────

function createCloseButton(
  x: number, y: number,
  layout: ReturnType<typeof getLayoutInfo>,
  onClick: () => void,
): Container {
  const btn = new Container();
  btn.x = x;
  btn.y = y;

  const bg = new Graphics();
  const size = scaled(22, layout);
  bg.circle(0, 0, size / 2).fill({ color: 0x332222, alpha: 0.8 });
  bg.circle(0, 0, size / 2).stroke({ color: 0x884444, width: 1, alpha: 0.6 });
  btn.addChild(bg);

  const txt = new Text({
    text: '✕',
    style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(12, layout), fill: 0xcc6666 }),
  });
  txt.anchor.set(0.5);
  btn.addChild(txt);

  btn.eventMode = 'static';
  btn.cursor = 'pointer';
  btn.on('pointerdown', onClick);

  return btn;
}
