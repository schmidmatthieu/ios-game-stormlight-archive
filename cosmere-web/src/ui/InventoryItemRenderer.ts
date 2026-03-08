import { Container, Graphics } from 'pixi.js';
import { GameManager } from '../game/GameManager';
import { gameData } from '../data/DataLoader';
import type { Item, EquipmentSlot } from '../data/types';
import { RARITY_COLORS } from '../data/types';
import { scaled, UI_COLORS } from '../ui/ResponsiveLayout';
import type { LayoutInfo } from '../ui/ResponsiveLayout';
import { MusicManager } from '../game/MusicSystem';
import { SLOT_LABELS, STAT_LABELS, txt } from './InventoryConstants';

/**
 * Renders the Inventory (items) tab content, including potion quick-slots
 * and the equipment item grid.
 */
export function renderInventoryTab(
  cc: Container, cx: number, cy: number, cw: number, _ch: number,
  layout: LayoutInfo,
  showTooltip: (item: Item, slot: EquipmentSlot | string, ax: number, ay: number) => void,
  usePotion: (itemID: string) => void,
): void {
  const champ = GameManager.shared.champion;
  if (!champ) return;
  const L = layout;
  let y = cy;

  // Gold
  const gl = txt(`Or: ${champ.gold}`, 10, 0xe6cc33, L, true);
  gl.x = cx + 14; gl.y = y; cc.addChild(gl);
  const ic = txt(`${champ.inventoryItemIDs.length} objets`, 8, 0x888888, L);
  ic.anchor.set(1, 0); ic.x = cx + cw - 14; ic.y = y; cc.addChild(ic);
  y += scaled(18, L);

  // Potion quick-slots
  const potionIDs = champ.inventoryItemIDs.filter(id => {
    const it = gameData.item(id); return it && (it.slot as string) === 'consumable';
  });
  const pl = txt('Potions rapides', 9, UI_COLORS.textSecondary, L, true);
  pl.x = cx + 14; pl.y = y; cc.addChild(pl);
  y += scaled(14, L);

  const ps = scaled(32, L), pg = scaled(8, L);
  for (let i = 0; i < 3; i++) {
    const px = cx + 14 + i * (ps + pg);
    const pid = potionIDs[i] ?? null;
    const pot = pid ? gameData.item(pid) : null;
    const rc = pot ? (RARITY_COLORS[pot.rarity] ?? 0xaaaaaa) : 0x333344;
    const g = new Graphics();
    g.roundRect(px, y, ps, ps, 4).fill({ color: 0x112211, alpha: 0.7 })
      .stroke({ color: rc, width: pot ? 1.5 : 0.8, alpha: pot ? 0.8 : 0.3 });
    if (pot) {
      g.circle(px + ps / 2, y + ps / 2 - 3, ps / 4).fill({ color: rc, alpha: 0.5 });
      g.eventMode = 'static'; g.cursor = 'pointer';
      g.on('pointerdown', () => usePotion(pid!));
    }
    cc.addChild(g);
    if (pot) {
      const n = txt(pot.name.substring(0, 6), 6, rc, L);
      n.anchor.set(0.5, 0); n.x = px + ps / 2; n.y = y + ps - scaled(8, L);
      cc.addChild(n);
    } else {
      const e = txt('-', 10, 0x444444, L);
      e.anchor.set(0.5); e.x = px + ps / 2; e.y = y + ps / 2; cc.addChild(e);
    }
  }
  if (potionIDs.length > 0) {
    const bx = cx + 14 + 3 * (ps + pg), bw = scaled(50, L);
    const btn = new Graphics();
    btn.roundRect(bx, y + ps / 4, bw, ps / 2, 4)
      .fill({ color: 0x224422, alpha: 0.8 }).stroke({ color: 0x44aa44, width: 1 });
    btn.eventMode = 'static'; btn.cursor = 'pointer';
    btn.on('pointerdown', () => { if (potionIDs[0]) usePotion(potionIDs[0]); });
    cc.addChild(btn);
    const bt = txt('Utiliser', 8, 0x66cc44, L, true);
    bt.anchor.set(0.5); bt.x = bx + bw / 2; bt.y = y + ps / 2;
    cc.addChild(bt);
  }
  y += ps + scaled(12, L);

  // Equipment grid
  const eqItems = champ.inventoryItemIDs.filter(id => {
    const it = gameData.item(id); return it && (it.slot as string) !== 'consumable';
  });
  if (eqItems.length === 0 && potionIDs.length === 0) {
    const em = txt('Aucun objet. Tuez des ennemis pour du butin!', 11, UI_COLORS.textMuted, L);
    em.anchor.set(0.5, 0); em.x = cx + cw / 2; em.y = y + 20; cc.addChild(em);
    return;
  }
  const cols = 4, pad = 12, gap = scaled(6, L);
  const cell = Math.floor((cw - pad * 2 - gap * (cols - 1)) / cols);
  eqItems.forEach((itemID, idx) => {
    const item = gameData.item(itemID); if (!item) return;
    const col = idx % cols, row = Math.floor(idx / cols);
    const cx2 = cx + pad + col * (cell + gap), cy2 = y + row * (cell + gap + scaled(10, L));
    const rc = RARITY_COLORS[item.rarity] ?? 0xaaaaaa;
    const g = new Graphics();
    g.roundRect(cx2, cy2, cell, cell, 4).fill({ color: 0x111122, alpha: 0.75 })
      .stroke({ color: rc, width: 1.2, alpha: 0.7 });
    g.roundRect(cx2 + 3, cy2 + 3, cell - 6, cell - 6, 2).fill({ color: rc, alpha: 0.12 });
    g.eventMode = 'static'; g.cursor = 'pointer';
    g.on('pointerdown', () => showTooltip(item, item.slot, cx2 + cell / 2, cy2));
    cc.addChild(g);
    const iconChar = txt((SLOT_LABELS[item.slot] ?? 'X').charAt(0), 12, rc, L, true);
    iconChar.anchor.set(0.5); iconChar.x = cx2 + cell / 2; iconChar.y = cy2 + cell / 2 - 4;
    cc.addChild(iconChar);
    const nm = txt(item.name.length > 8 ? item.name.substring(0, 7) + '\u2026' : item.name, 6, UI_COLORS.textPrimary, L);
    nm.anchor.set(0.5, 0); nm.x = cx2 + cell / 2; nm.y = cy2 + cell - scaled(10, L);
    cc.addChild(nm);
  });
}

/**
 * Shows an item tooltip with stats comparison and action buttons.
 */
export function showItemTooltip(
  panel: Container, item: Item, slot: EquipmentSlot | string,
  ax: number, ay: number, screenW: number, screenH: number,
  layout: LayoutInfo,
  onAction: () => void,
): Container {
  const champ = GameManager.shared.champion; if (!champ) return new Container();
  const L = layout;
  const tw = scaled(200, L), th = scaled(180, L);
  const tx = Math.max(10, Math.min(screenW - tw - 10, ax - tw / 2));
  const ty = Math.max(10, Math.min(screenH - th - 10, ay - th - 10));
  const rc = RARITY_COLORS[item.rarity] ?? 0xaaaaaa;
  const c = new Container(); c.zIndex = 20000;

  const bg = new Graphics();
  bg.roundRect(tx, ty, tw, th, 8).fill({ color: 0x0a0815, alpha: 0.95 })
    .stroke({ color: rc, width: 2, alpha: 0.8 });
  bg.eventMode = 'static'; c.addChild(bg);

  let ly = ty + 8;
  const nm = txt(item.name, 11, rc, L, true); nm.x = tx + 10; nm.y = ly; c.addChild(nm);
  ly += scaled(16, L);
  const sl = txt(`Emplacement: ${SLOT_LABELS[item.slot] ?? item.slot}`, 8, UI_COLORS.textMuted, L);
  sl.x = tx + 10; sl.y = ly; c.addChild(sl);
  ly += scaled(14, L);

  // Compare vs equipped
  const eq = champ.equipment as unknown as Record<string, string | null>;
  const eqID = eq[item.slot]; const eqItem = eqID ? gameData.item(eqID) : null;
  for (const b of item.statBonuses) {
    const eqB = eqItem?.statBonuses.find(e => e.stat === b.stat);
    const diff = b.value - (eqB?.value ?? 0);
    const ds = diff > 0 ? ` (+${diff})` : diff < 0 ? ` (${diff})` : '';
    const dc = diff > 0 ? UI_COLORS.success : diff < 0 ? UI_COLORS.danger : UI_COLORS.textSecondary;
    const t = txt(`+${b.value} ${STAT_LABELS[b.stat] ?? b.stat}${ds}`, 8, dc, L);
    t.x = tx + 10; t.y = ly; c.addChild(t); ly += scaled(12, L);
  }
  if (eqItem) {
    for (const eb of eqItem.statBonuses) {
      if (!item.statBonuses.find(b => b.stat === eb.stat)) {
        const t = txt(`0 ${STAT_LABELS[eb.stat] ?? eb.stat} (-${eb.value})`, 8, UI_COLORS.danger, L);
        t.x = tx + 10; t.y = ly; c.addChild(t); ly += scaled(12, L);
      }
    }
  }
  ly += scaled(6, L);

  // Action buttons
  const bw = scaled(55, L), bh = scaled(18, L), bg2 = scaled(6, L);
  const inInv = champ.inventoryItemIDs.includes(item.id);
  if (inInv) {
    addTooltipBtn(c, tx + 8, ly, bw, bh, 0x224422, 0x44aa44, 'Équiper', 8, 0x66cc44, L, () => {
      MusicManager.shared.playSFX('equip');
      GameManager.shared.equipItem(item.id, item.slot);
      onAction();
    });
    const sp = GameManager.getItemSellPrice(item.id);
    addTooltipBtn(c, tx + 8 + bw + bg2, ly, bw, bh, 0x332211, 0xcc9933, `Vendre ${sp}g`, 7, 0xe6cc33, L, () => {
      MusicManager.shared.playSFX('loot_common');
      GameManager.shared.sellItem(item.id);
      onAction();
    });
    const dr = GameManager.getDisenchantResult(item.id);
    addTooltipBtn(c, tx + 8 + 2 * (bw + bg2), ly, bw, bh, 0x221133, 0x9955ee, `Déch. +${dr.amount}`, 6, 0xbb88ee, L, () => {
      MusicManager.shared.playSFX('magic_aondor');
      GameManager.shared.disenchantItem(item.id);
      onAction();
    });
  } else {
    addTooltipBtn(c, tx + 8, ly, bw * 1.5, bh, 0x442222, 0xcc4444, 'Déséquiper', 8, 0xcc6644, L, () => {
      GameManager.shared.unequipItem(slot);
      onAction();
    });
  }
  return c;
}

function addTooltipBtn(c: Container, x: number, y: number, w: number, h: number,
  bgColor: number, border: number, label: string, fs: number, fc: number, L: LayoutInfo, cb: () => void): void {
  const g = new Graphics();
  g.roundRect(x, y, w, h, 4).fill({ color: bgColor, alpha: 0.9 }).stroke({ color: border, width: 1 });
  g.eventMode = 'static'; g.cursor = 'pointer'; g.on('pointerdown', cb);
  c.addChild(g);
  const t = txt(label, fs, fc, L, true);
  t.anchor.set(0.5); t.x = x + w / 2; t.y = y + h / 2; c.addChild(t);
}

/**
 * Handles using a potion: applies effects and removes from inventory.
 */
export function usePotion(itemID: string, refreshContent: () => void): void {
  const champ = GameManager.shared.champion; if (!champ) return;
  const item = gameData.item(itemID); if (!item) return;
  const idx = champ.inventoryItemIDs.indexOf(itemID); if (idx < 0) return;
  for (const b of item.statBonuses) {
    if (b.stat === 'hp' || b.stat === 'vigor')
      champ.currentHP = Math.min(champ.currentHP + b.value, GameManager.shared.maxHP);
    else if (b.stat === 'investiture')
      champ.currentInvestiture = Math.min(champ.currentInvestiture + b.value, GameManager.shared.maxInvestiture);
  }
  if (item.statBonuses.length === 0)
    champ.currentHP = Math.min(champ.currentHP + 30, GameManager.shared.maxHP);
  champ.inventoryItemIDs.splice(idx, 1);
  MusicManager.shared.playSFX('loot_common');
  refreshContent();
}
