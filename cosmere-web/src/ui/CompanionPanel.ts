import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { CompanionManager, COMPANIONS } from '../game/CompanionSystem';
import type { CompanionDef } from '../game/CompanionSystem';

// ─── World Labels ────────────────────────────────────────────

const WORLD_NAMES: Record<string, string> = {
  scadrial: 'Scadrial', roshar: 'Roshar', taldain: 'Taldain',
  nalthis: 'Nalthis', sel: 'Sel', komashi: 'Komashi', shadesmar: 'Shadesmar',
};

// ─── Companion Panel ─────────────────────────────────────────

export function showCompanionPanel(
  uiContainer: Container,
  screenW: number, screenH: number,
  onClose: () => void,
): Container {
  const panel = new Container();
  panel.zIndex = 10000;

  const cm = CompanionManager.shared;

  // Overlay
  const overlay = new Graphics();
  overlay.rect(0, 0, screenW, screenH).fill({ color: 0x000000, alpha: 0.6 });
  overlay.eventMode = 'static';
  overlay.on('pointerdown', onClose);
  panel.addChild(overlay);

  // Main panel
  const panelW = Math.min(screenW - 16, 380);
  const panelH = Math.min(screenH - 24, 460);
  const px = (screenW - panelW) / 2;
  const py = (screenH - panelH) / 2;

  const panelBg = new Graphics();
  panelBg.roundRect(px, py, panelW, panelH, 12)
    .fill({ color: 0x0a0815, alpha: 0.95 })
    .stroke({ color: 0x554433, width: 2, alpha: 0.7 });
  panelBg.eventMode = 'static';
  panel.addChild(panelBg);

  // Title
  const title = new Text({
    text: '🐾 Compagnons',
    style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: 14, fontWeight: 'bold', fill: 0xe6cc66 }),
  });
  title.x = px + panelW / 2;
  title.anchor.set(0.5, 0);
  title.y = py + 10;
  panel.addChild(title);

  // Active companion info
  const activeInfo = new Container();
  activeInfo.y = py + 32;
  panel.addChild(activeInfo);

  // Companion list
  const listContainer = new Container();
  const listMask = new Graphics();
  listMask.rect(px + 5, py + 80, panelW - 10, panelH - 90);
  listMask.fill({ color: 0xffffff });
  listContainer.mask = listMask;
  panel.addChild(listMask);
  panel.addChild(listContainer);

  let scrollOffset = 0;
  const maxScroll = { value: 0 };

  function renderActiveInfo(): void {
    activeInfo.removeChildren();
    const active = cm.getActive();
    if (active) {
      const text = new Text({
        text: `Actif: ${active.name} (${active.bonusDescription})`,
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 8, fill: 0xaaddaa }),
      });
      text.x = px + panelW / 2;
      text.anchor.set(0.5, 0);
      activeInfo.addChild(text);

      const desc = new Text({
        text: active.description.length > 60 ? active.description.slice(0, 57) + '...' : active.description,
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 7, fill: 0x888899, fontStyle: 'italic' }),
      });
      desc.x = px + panelW / 2;
      desc.anchor.set(0.5, 0);
      desc.y = 14;
      activeInfo.addChild(desc);
    } else {
      const text = new Text({
        text: 'Aucun compagnon actif',
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 8, fill: 0x666677 }),
      });
      text.x = px + panelW / 2;
      text.anchor.set(0.5, 0);
      activeInfo.addChild(text);
    }
  }

  function renderList(): void {
    listContainer.removeChildren();
    const cardH = 72;
    let yPos = py + 84 - scrollOffset;

    for (const comp of COMPANIONS) {
      const unlocked = cm.unlockedIDs.includes(comp.id);
      const isActive = cm.activeCompanionID === comp.id;

      if (yPos + cardH < py + 80 || yPos > py + panelH - 10) {
        yPos += cardH + 5;
        continue;
      }

      const card = renderCompanionCard(comp, unlocked, isActive, px + 8, yPos, panelW - 16);
      listContainer.addChild(card);
      yPos += cardH + 5;
    }

    maxScroll.value = Math.max(0, COMPANIONS.length * (cardH + 5) - (panelH - 100));
  }

  function renderCompanionCard(comp: CompanionDef, unlocked: boolean, isActive: boolean, x: number, y: number, w: number): Container {
    const card = new Container();

    // Background
    const bg = new Graphics();
    bg.roundRect(x, y, w, 70, 8)
      .fill({ color: isActive ? 0x151a28 : 0x12101e, alpha: 0.9 })
      .stroke({ color: isActive ? comp.color : unlocked ? 0x555566 : 0x333344, width: isActive ? 2 : 1, alpha: isActive ? 0.8 : 0.4 });
    card.addChild(bg);

    // Companion orb icon
    const orb = new Graphics();
    if (unlocked) {
      orb.circle(x + 22, y + 24, comp.size + 4)
        .fill({ color: comp.glowColor, alpha: 0.2 });
      orb.circle(x + 22, y + 24, comp.size)
        .fill({ color: comp.color, alpha: 0.8 });
      orb.circle(x + 22, y + 24, comp.size - 2)
        .fill({ color: 0xffffff, alpha: 0.3 });
    } else {
      orb.circle(x + 22, y + 24, comp.size + 2)
        .fill({ color: 0x333344, alpha: 0.5 })
        .stroke({ color: 0x444455, width: 1, alpha: 0.4 });
    }
    card.addChild(orb);

    // Name
    const nameText = new Text({
      text: unlocked ? comp.name : '???',
      style: new TextStyle({
        fontFamily: 'Georgia, serif', fontSize: 10, fontWeight: 'bold',
        fill: unlocked ? comp.color : 0x555566,
      }),
    });
    nameText.x = x + 44;
    nameText.y = y + 5;
    card.addChild(nameText);

    // Origin world
    const worldText = new Text({
      text: WORLD_NAMES[comp.origin] ?? comp.origin,
      style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 7, fill: 0x888899 }),
    });
    worldText.x = x + w - 6;
    worldText.anchor.set(1, 0);
    worldText.y = y + 8;
    card.addChild(worldText);

    if (unlocked) {
      // Description
      const desc = comp.description.length > 60 ? comp.description.slice(0, 57) + '...' : comp.description;
      const descText = new Text({
        text: desc,
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 7, fill: 0x999999, fontStyle: 'italic', wordWrap: true, wordWrapWidth: w - 54 }),
      });
      descText.x = x + 44;
      descText.y = y + 20;
      card.addChild(descText);

      // Bonus
      const bonusText = new Text({
        text: comp.bonusDescription,
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 8, fontWeight: 'bold', fill: 0x66cc44 }),
      });
      bonusText.x = x + 44;
      bonusText.y = y + 52;
      card.addChild(bonusText);

      // Select/Deselect button
      if (isActive) {
        const badge = new Text({
          text: '✓ Actif',
          style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 8, fontWeight: 'bold', fill: 0x44cc44 }),
        });
        badge.x = x + w - 6;
        badge.anchor.set(1, 0);
        badge.y = y + 52;
        card.addChild(badge);
      } else {
        const selectBtn = new Graphics();
        selectBtn.roundRect(x + w - 60, y + 48, 54, 18, 4)
          .fill({ color: 0x224433, alpha: 0.8 })
          .stroke({ color: 0x44aa66, width: 1, alpha: 0.5 });
        selectBtn.eventMode = 'static';
        selectBtn.cursor = 'pointer';
        selectBtn.on('pointerdown', () => {
          cm.setActive(comp.id);
          renderActiveInfo();
          renderList();
        });
        card.addChild(selectBtn);

        const selectText = new Text({
          text: 'Sélectionner',
          style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 7, fill: 0x88dd88 }),
        });
        selectText.x = x + w - 33;
        selectText.anchor.set(0.5, 0);
        selectText.y = y + 52;
        card.addChild(selectText);
      }
    } else {
      // Lock condition
      const lockText = new Text({
        text: `🔒 ${comp.unlockCondition}`,
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: 7, fill: 0x666677 }),
      });
      lockText.x = x + 44;
      lockText.y = y + 22;
      card.addChild(lockText);
    }

    return card;
  }

  // Scroll
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
    renderList();
  });
  panelBg.on('pointerup', () => { isDragging = false; });
  panelBg.on('pointerupoutside', () => { isDragging = false; });

  // Close button
  const closeBtn = new Graphics();
  closeBtn.circle(px + panelW - 16, py + 16, 10)
    .fill({ color: 0x332222, alpha: 0.8 })
    .stroke({ color: 0x664444, width: 1.5, alpha: 0.6 });
  closeBtn.eventMode = 'static';
  closeBtn.cursor = 'pointer';
  closeBtn.on('pointerdown', onClose);
  panel.addChild(closeBtn);

  const closeX = new Text({
    text: '✕',
    style: new TextStyle({ fontSize: 10, fill: 0xcc6666 }),
  });
  closeX.anchor.set(0.5);
  closeX.x = px + panelW - 16;
  closeX.y = py + 16;
  panel.addChild(closeX);

  renderActiveInfo();
  renderList();

  uiContainer.addChild(panel);
  return panel;
}
