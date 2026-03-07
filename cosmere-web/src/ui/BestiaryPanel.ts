import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { BestiaryManager } from '../game/BestiarySystem';
import { getLayoutInfo, fontSize, panelRadius, buttonHeight, UI_COLORS, UI_ALPHA } from '../ui/ResponsiveLayout';
import type { LayoutInfo } from '../ui/ResponsiveLayout';
import type { BestiaryEntry } from '../game/BestiarySystem';

// ─── Tier Colors & World Colors ──────────────────────────────

const TIER_COLORS: Record<string, number> = {
  minion: 0x889988,
  soldier: 0x5588cc,
  elite: 0xaa66dd,
  boss: 0xffaa33,
};

const TIER_LABELS: Record<string, string> = {
  minion: 'Sbire',
  soldier: 'Soldat',
  elite: 'Élite',
  boss: 'Boss',
};

const WORLD_NAMES: Record<string, string> = {
  all: 'Tous les Mondes',
  scadrial: 'Scadrial',
  roshar: 'Roshar',
  taldain: 'Taldain',
  nalthis: 'Nalthis',
  sel: 'Sel',
  komashi: 'Komashi',
  shadesmar: 'Shadesmar',
};

const WORLD_COLORS: Record<string, number> = {
  scadrial: 0x886644,
  roshar: 0x4466aa,
  taldain: 0xaaaa44,
  nalthis: 0x44aa66,
  sel: 0xaaaa55,
  komashi: 0x8844aa,
  shadesmar: 0x6644aa,
};

const BEHAVIOR_LABELS: Record<string, string> = {
  patrol: 'Patrouille',
  wander: 'Errant',
  guard: 'Gardien',
  ambush: 'Embuscade',
  ranged: 'Distance',
  berserk: 'Berserk',
  support: 'Soutien',
};

// ─── Bestiary Panel ──────────────────────────────────────────

export function showBestiaryPanel(
  uiContainer: Container,
  screenW: number, screenH: number,
  onClose: () => void,
): Container {
  const panel = new Container();
  panel.zIndex = 10000;
  const layout = getLayoutInfo(screenW, screenH);

  // Dark overlay
  const overlay = new Graphics();
  overlay.rect(0, 0, screenW, screenH).fill({ color: UI_COLORS.overlayDark, alpha: UI_ALPHA.overlay });
  overlay.eventMode = 'static';
  overlay.on('pointerdown', onClose);
  panel.addChild(overlay);

  // Main panel
  const panelW = Math.min(screenW - 20, 420);
  const panelH = Math.min(screenH - 30, 500);
  const px = (screenW - panelW) / 2;
  const py = (screenH - panelH) / 2;

  const panelBg = new Graphics();
  panelBg.roundRect(px, py, panelW, panelH, panelRadius(layout))
    .fill({ color: UI_COLORS.panelBgAlt, alpha: UI_ALPHA.panelBg })
    .stroke({ color: UI_COLORS.borderAccent, width: 2, alpha: UI_ALPHA.panelBorder });
  panelBg.eventMode = 'static'; // Prevent clicks from reaching overlay
  panel.addChild(panelBg);

  // Title
  const title = new Text({
    text: '📖 Bestiaire du Cosmere',
    style: new TextStyle({
      fontFamily: 'Georgia, serif', fontSize: fontSize(15, layout), fontWeight: 'bold',
      fill: UI_COLORS.textGold,
    }),
  });
  title.x = px + panelW / 2 - 80;
  title.y = py + 10;
  panel.addChild(title);

  // Stats summary
  const bestiary = BestiaryManager.shared;
  const statsText = new Text({
    text: `${bestiary.totalDiscovered} créatures découvertes · ${bestiary.totalKills} vaincues`,
    style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(9, layout), fill: UI_COLORS.textMuted }),
  });
  statsText.x = px + panelW / 2 - 80;
  statsText.y = py + 30;
  panel.addChild(statsText);

  // World filter tabs
  const worlds = ['all', 'scadrial', 'roshar', 'taldain', 'nalthis', 'sel', 'komashi', 'shadesmar'];
  let currentFilter = 'all';
  const tabContainer = new Container();
  tabContainer.y = py + 46;
  panel.addChild(tabContainer);

  // Content area
  const contentContainer = new Container();
  const contentMask = new Graphics();
  contentMask.rect(px + 5, py + 70, panelW - 10, panelH - 80);
  contentMask.fill({ color: 0xffffff });
  contentContainer.mask = contentMask;
  panel.addChild(contentMask);
  panel.addChild(contentContainer);

  let scrollOffset = 0;
  const maxScroll = { value: 0 };

  function renderTabs(): void {
    tabContainer.removeChildren();
    let tabX = px + 8;
    for (const w of worlds) {
      const entries = bestiary.getEntries(w);
      if (w !== 'all' && entries.length === 0) continue; // Skip empty worlds

      const isActive = currentFilter === w;
      const tabBg = new Graphics();
      const label = w === 'all' ? 'Tous' : (WORLD_NAMES[w] ?? w);
      const tabW = label.length * 6 + 12;

      tabBg.roundRect(0, 0, tabW, 18, 4)
        .fill({ color: isActive ? (WORLD_COLORS[w] ?? 0x444455) : UI_COLORS.btnSecondary, alpha: isActive ? 0.8 : 0.5 })
        .stroke({ color: isActive ? UI_COLORS.textPrimary : 0x444455, width: 1, alpha: 0.4 });
      tabBg.x = tabX;
      tabBg.eventMode = 'static';
      tabBg.cursor = 'pointer';
      tabBg.on('pointerdown', () => {
        currentFilter = w;
        scrollOffset = 0;
        renderTabs();
        renderEntries();
      });

      const tabText = new Text({
        text: label,
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(8, layout), fill: isActive ? 0xffffff : UI_COLORS.textSecondary }),
      });
      tabText.x = tabX + 6;
      tabText.y = 4;
      tabContainer.addChild(tabBg, tabText);

      tabX += tabW + 4;
    }
  }

  function renderEntries(): void {
    contentContainer.removeChildren();
    const entries = bestiary.getEntries(currentFilter);

    if (entries.length === 0) {
      const emptyText = new Text({
        text: 'Aucune créature découverte.\nExplorez le monde et combattez des ennemis!',
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(10, layout), fill: UI_COLORS.textMuted, align: 'center' }),
      });
      emptyText.x = px + panelW / 2 - 80;
      emptyText.y = py + panelH / 2 - 20;
      contentContainer.addChild(emptyText);
      return;
    }

    let yPos = py + 74 - scrollOffset;
    const cardH = 80;

    for (const entry of entries) {
      // Only render visible cards
      if (yPos + cardH < py + 70 || yPos > py + panelH - 10) {
        yPos += cardH + 6;
        continue;
      }

      const card = renderEntryCard(entry, px + 8, yPos, panelW - 16);
      contentContainer.addChild(card);
      yPos += cardH + 6;
    }

    maxScroll.value = Math.max(0, entries.length * (cardH + 6) - (panelH - 90));
  }

  function renderEntryCard(entry: BestiaryEntry, x: number, y: number, w: number): Container {
    const card = new Container();

    // Card background
    const tierColor = TIER_COLORS[entry.tier] ?? 0x888888;
    const bg = new Graphics();
    bg.roundRect(x, y, w, 78, 8)
      .fill({ color: 0x12101e, alpha: 0.9 })
      .stroke({ color: tierColor, width: 1.5, alpha: 0.5 });
    card.addChild(bg);

    // Enemy icon (small colored circle with tier symbol)
    const icon = new Graphics();
    icon.circle(x + 22, y + 24, 14)
      .fill({ color: WORLD_COLORS[entry.worldID] ?? 0x555555, alpha: 0.6 })
      .stroke({ color: tierColor, width: 2, alpha: 0.8 });
    card.addChild(icon);

    // Tier symbol in icon
    const tierSymbol = entry.tier === 'boss' ? '★' : entry.tier === 'elite' ? '◆' : entry.tier === 'soldier' ? '▲' : '●';
    const iconText = new Text({
      text: tierSymbol,
      style: new TextStyle({ fontSize: 10, fill: tierColor }),
    });
    iconText.anchor.set(0.5);
    iconText.x = x + 22;
    iconText.y = y + 24;
    card.addChild(iconText);

    // Name
    const nameText = new Text({
      text: entry.name,
      style: new TextStyle({
        fontFamily: 'Georgia, serif', fontSize: fontSize(11, layout), fontWeight: 'bold',
        fill: tierColor,
      }),
    });
    nameText.x = x + 44;
    nameText.y = y + 6;
    card.addChild(nameText);

    // Tier + Level badge
    const badgeText = new Text({
      text: `${TIER_LABELS[entry.tier] ?? entry.tier} Nv.${entry.level}`,
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(8, layout), fill: UI_COLORS.textSecondary }),
    });
    badgeText.x = x + 44;
    badgeText.y = y + 20;
    card.addChild(badgeText);

    // World + Behavior
    const worldLabel = WORLD_NAMES[entry.worldID] ?? entry.worldID;
    const behaviorLabel = BEHAVIOR_LABELS[entry.behavior] ?? entry.behavior;
    const infoText = new Text({
      text: `${worldLabel} · ${behaviorLabel}`,
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(8, layout), fill: UI_COLORS.textMuted }),
    });
    infoText.x = x + w - 6;
    infoText.anchor.set(1, 0);
    infoText.y = y + 8;
    card.addChild(infoText);

    // Stats row
    const statsRow = new Text({
      text: `♥ ${entry.maxHP}  ⚔ ${entry.damage}  🛡 ${entry.defense}`,
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(9, layout), fill: UI_COLORS.textPrimary }),
    });
    statsRow.x = x + 44;
    statsRow.y = y + 34;
    card.addChild(statsRow);

    // Description (truncated)
    const desc = entry.description.length > 70 ? entry.description.slice(0, 67) + '...' : entry.description;
    const descText = new Text({
      text: desc,
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(8, layout), fill: UI_COLORS.textMuted, fontStyle: 'italic', wordWrap: true, wordWrapWidth: w - 54 }),
    });
    descText.x = x + 44;
    descText.y = y + 48;
    card.addChild(descText);

    // Kill count
    const killText = new Text({
      text: `${entry.timesDefeated}×`,
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(9, layout), fontWeight: 'bold', fill: entry.timesDefeated > 0 ? UI_COLORS.success : 0x555555 }),
    });
    killText.x = x + 22;
    killText.anchor.set(0.5, 0);
    killText.y = y + 44;
    card.addChild(killText);

    // Drops discovered
    if (entry.dropsDiscovered.length > 0) {
      const dropText = new Text({
        text: `Butins: ${entry.dropsDiscovered.length} découvert(s)`,
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(8, layout), fill: UI_COLORS.warning }),
      });
      dropText.x = x + 44;
      dropText.y = y + 65;
      card.addChild(dropText);
    }

    return card;
  }

  // Scroll handling via pointer drag
  let isDragging = false;
  let dragStartY = 0;
  let dragStartScroll = 0;

  panelBg.on('pointerdown', (e) => {
    isDragging = true;
    dragStartY = e.globalY;
    dragStartScroll = scrollOffset;
  });
  panelBg.on('pointermove', (e) => {
    if (!isDragging) return;
    const dy = dragStartY - e.globalY;
    scrollOffset = Math.max(0, Math.min(maxScroll.value, dragStartScroll + dy));
    renderEntries();
  });
  panelBg.on('pointerup', () => { isDragging = false; });
  panelBg.on('pointerupoutside', () => { isDragging = false; });

  // Close button
  const closeBtn = new Graphics();
  closeBtn.circle(px + panelW - 16, py + 16, buttonHeight(layout) / 2)
    .fill({ color: UI_COLORS.btnDanger, alpha: UI_ALPHA.buttonBg })
    .stroke({ color: UI_COLORS.danger, width: 1.5, alpha: 0.6 });
  closeBtn.eventMode = 'static';
  closeBtn.cursor = 'pointer';
  closeBtn.on('pointerdown', onClose);
  panel.addChild(closeBtn);

  const closeX = new Text({
    text: '✕',
    style: new TextStyle({ fontSize: fontSize(11, layout), fill: UI_COLORS.danger }),
  });
  closeX.anchor.set(0.5);
  closeX.x = px + panelW - 16;
  closeX.y = py + 16;
  panel.addChild(closeX);

  // Initial render
  renderTabs();
  renderEntries();

  uiContainer.addChild(panel);
  return panel;
}
