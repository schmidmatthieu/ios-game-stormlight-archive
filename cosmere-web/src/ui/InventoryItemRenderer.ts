import { Container, Graphics } from 'pixi.js';
import { GameManager } from '../game/GameManager';
import { gameData } from '../data/DataLoader';
import type { Item, EquipmentSlot } from '../data/types';
import { RARITY_COLORS, RARITY_ORDER } from '../data/types';
import { scaled, UI_COLORS } from '../ui/ResponsiveLayout';
import type { LayoutInfo } from '../ui/ResponsiveLayout';
import { MusicManager } from '../game/MusicSystem';
import { applyEnchantment } from '../game/EnchantmentData';
import { SLOT_LABELS, STAT_LABELS, txt } from './InventoryConstants';
import type { InventoryFilterState, SlotFilter, RarityFilter } from './InventoryFilters';
import { matchesSlotFilter, matchesRarityFilter, SLOT_FILTER_ROW1, SLOT_FILTER_ROW2, SLOT_FILTER_LABELS, RARITY_FILTERS, RARITY_FILTER_LABELS, RARITY_FILTER_COLORS } from './InventoryFilters';

// ─── Filtered item with original inventory index ─────────────────────

interface FilteredEntry {
  id: string;
  invIndex: number; // index in champion.inventoryItemIDs
}

// ─── Filter Bar ──────────────────────────────────────────────────────

function renderChipRow(
  cc: Container, cx: number, chipY: number, cw: number, chipH: number, L: LayoutInfo,
  items: { key: string; label: string; active: boolean; color: number }[],
  onSelect: (key: string) => void,
): void {
  // Calculate chip width to fit all items within panel width
  const totalGap = scaled(3, L) * (items.length - 1);
  const availW = cw - 28;
  const chipW = Math.floor((availW - totalGap) / items.length);
  items.forEach((it, i) => {
    const chipX = cx + 14 + i * (chipW + scaled(3, L));
    const cg = new Graphics();
    cg.roundRect(chipX, chipY, chipW, chipH, 3)
      .fill({ color: it.active ? 0x222233 : 0x111122, alpha: it.active ? 0.9 : 0.5 })
      .stroke({ color: it.active ? it.color : 0x333344, width: 1, alpha: it.active ? 0.8 : 0.3 });
    cg.eventMode = 'static'; cg.cursor = 'pointer';
    cg.on('pointerdown', () => onSelect(it.key));
    cc.addChild(cg);
    const ct = txt(it.label, 6, it.active ? it.color : UI_COLORS.textMuted, L, it.active);
    ct.anchor.set(0.5); ct.x = chipX + chipW / 2; ct.y = chipY + chipH / 2;
    cc.addChild(ct);
  });
}

function renderFilterBar(
  cc: Container, cx: number, y: number, cw: number, layout: LayoutInfo,
  state: InventoryFilterState, refresh: () => void,
): number {
  const L = layout;
  const chipH = scaled(17, L);
  const rowGap = scaled(3, L);

  // Row 1: Category filters
  renderChipRow(cc, cx, y, cw, chipH, L,
    SLOT_FILTER_ROW1.map(sf => ({
      key: sf, label: SLOT_FILTER_LABELS[sf], active: state.slotFilter === sf,
      color: state.slotFilter === sf ? UI_COLORS.textGold : 0xcccccc,
    })),
    (key) => { state.slotFilter = key as SlotFilter; refresh(); },
  );
  y += chipH + rowGap;

  // Row 2: Individual slot filters
  renderChipRow(cc, cx, y, cw, chipH, L,
    SLOT_FILTER_ROW2.map(sf => ({
      key: sf, label: SLOT_FILTER_LABELS[sf], active: state.slotFilter === sf,
      color: state.slotFilter === sf ? 0x66bbee : 0xcccccc,
    })),
    (key) => { state.slotFilter = key as SlotFilter; refresh(); },
  );
  y += chipH + rowGap;

  // Row 3: Rarity filters
  renderChipRow(cc, cx, y, cw, chipH, L,
    RARITY_FILTERS.map(rf => ({
      key: rf, label: RARITY_FILTER_LABELS[rf], active: state.rarityFilter === rf,
      color: RARITY_FILTER_COLORS[rf],
    })),
    (key) => { state.rarityFilter = key as RarityFilter; refresh(); },
  );
  y += chipH + scaled(6, L);

  return y;
}

// ─── Bulk Action Bar ─────────────────────────────────────────────────

function renderBulkBar(
  cc: Container, cx: number, y: number, cw: number, layout: LayoutInfo,
  state: InventoryFilterState, entries: FilteredEntry[], refresh: () => void,
): number {
  const L = layout;
  const barH = scaled(26, L);

  // Toggle bulk mode
  const toggleW = scaled(70, L);
  const toggleBg = new Graphics();
  toggleBg.roundRect(cx + 14, y, toggleW, barH, 4)
    .fill({ color: state.bulkMode ? 0x442222 : 0x222233, alpha: 0.8 })
    .stroke({ color: state.bulkMode ? 0xcc4444 : 0x444466, width: 1 });
  toggleBg.eventMode = 'static'; toggleBg.cursor = 'pointer';
  toggleBg.on('pointerdown', () => {
    state.bulkMode = !state.bulkMode;
    if (!state.bulkMode) state.selectedIndices.clear();
    refresh();
  });
  cc.addChild(toggleBg);
  const toggleLabel = txt(state.bulkMode ? 'Annuler' : 'Sélection', 8,
    state.bulkMode ? 0xcc6644 : UI_COLORS.textSecondary, L, true);
  toggleLabel.anchor.set(0.5); toggleLabel.x = cx + 14 + toggleW / 2; toggleLabel.y = y + barH / 2;
  cc.addChild(toggleLabel);

  if (state.bulkMode) {
    const count = state.selectedIndices.size;
    const allIndices = entries.map(e => e.invIndex);
    let bx = cx + 14 + toggleW + scaled(8, L);

    // Select all / deselect
    const selAllW = scaled(60, L);
    const selAllBg = new Graphics();
    selAllBg.roundRect(bx, y, selAllW, barH, 4)
      .fill({ color: 0x222244, alpha: 0.8 }).stroke({ color: 0x4466aa, width: 1 });
    selAllBg.eventMode = 'static'; selAllBg.cursor = 'pointer';
    selAllBg.on('pointerdown', () => {
      if (count === allIndices.length) state.selectedIndices.clear();
      else { state.selectedIndices.clear(); for (const idx of allIndices) state.selectedIndices.add(idx); }
      refresh();
    });
    cc.addChild(selAllBg);
    const selAllLabel = txt(count === allIndices.length ? 'Tout \u00d7' : 'Tout \u2713', 8, 0x6688cc, L, true);
    selAllLabel.anchor.set(0.5); selAllLabel.x = bx + selAllW / 2; selAllLabel.y = y + barH / 2;
    cc.addChild(selAllLabel);
    bx += selAllW + scaled(6, L);

    if (count > 0) {
      // Gather selected IDs (from indices)
      const champ = GameManager.shared.champion;
      const selectedIDs: string[] = [];
      if (champ) {
        for (const idx of state.selectedIndices) {
          if (idx < champ.inventoryItemIDs.length) selectedIDs.push(champ.inventoryItemIDs[idx]);
        }
      }

      // Bulk sell
      let totalGold = 0;
      for (const id of selectedIDs) totalGold += GameManager.getItemSellPrice(id);
      const sellW = scaled(70, L);
      const sellBg = new Graphics();
      sellBg.roundRect(bx, y, sellW, barH, 4)
        .fill({ color: 0x332211, alpha: 0.8 }).stroke({ color: 0xcc9933, width: 1 });
      sellBg.eventMode = 'static'; sellBg.cursor = 'pointer';
      sellBg.on('pointerdown', () => {
        // Remove from highest index first to preserve lower indices
        const sorted = [...state.selectedIndices].sort((a, b) => b - a);
        if (champ) {
          for (const idx of sorted) {
            if (idx < champ.inventoryItemIDs.length) {
              const id = champ.inventoryItemIDs[idx];
              const gold = GameManager.getItemSellPrice(id);
              champ.inventoryItemIDs.splice(idx, 1);
              champ.gold += gold;
            }
          }
        }
        GameManager.shared.save();
        state.selectedIndices.clear();
        refresh();
      });
      cc.addChild(sellBg);
      const sellLabel = txt(`Vendre ${totalGold}g`, 7, 0xe6cc33, L, true);
      sellLabel.anchor.set(0.5); sellLabel.x = bx + sellW / 2; sellLabel.y = y + barH / 2;
      cc.addChild(sellLabel);
      bx += sellW + scaled(6, L);

      // Bulk disenchant
      let totalEss = 0;
      for (const id of selectedIDs) totalEss += GameManager.getDisenchantResult(id).amount;
      const disW = scaled(70, L);
      const disBg = new Graphics();
      disBg.roundRect(bx, y, disW, barH, 4)
        .fill({ color: 0x221133, alpha: 0.8 }).stroke({ color: 0x9955ee, width: 1 });
      disBg.eventMode = 'static'; disBg.cursor = 'pointer';
      disBg.on('pointerdown', () => {
        const sorted = [...state.selectedIndices].sort((a, b) => b - a);
        if (champ) {
          for (const idx of sorted) {
            if (idx < champ.inventoryItemIDs.length) {
              const id = champ.inventoryItemIDs[idx];
              const result = GameManager.getDisenchantResult(id);
              champ.inventoryItemIDs.splice(idx, 1);
              champ.gold += result.amount;
            }
          }
        }
        GameManager.shared.save();
        state.selectedIndices.clear();
        refresh();
      });
      cc.addChild(disBg);
      const disLabel = txt(`D\u00e9ch. +${totalEss}`, 7, 0xbb88ee, L, true);
      disLabel.anchor.set(0.5); disLabel.x = bx + disW / 2; disLabel.y = y + barH / 2;
      cc.addChild(disLabel);
    }

    // Count indicator
    const countLabel = txt(`${count}/${allIndices.length}`, 8, UI_COLORS.textMuted, L);
    countLabel.anchor.set(1, 0.5); countLabel.x = cx + cw - 14; countLabel.y = y + barH / 2;
    cc.addChild(countLabel);
  }

  return y + barH + scaled(6, L);
}

// ─── Main Inventory Tab ──────────────────────────────────────────────

export function renderInventoryTab(
  cc: Container, cx: number, cy: number, cw: number, _ch: number,
  layout: LayoutInfo,
  showTooltip: (item: Item, slot: EquipmentSlot | string, ax: number, ay: number) => void,
  usePotionCb: (itemID: string) => void,
  filterState: InventoryFilterState,
  refresh: () => void,
): void {
  const champ = GameManager.shared.champion;
  if (!champ) return;
  const L = layout;
  let y = cy;

  // Gold + item count header
  const gl = txt(`Or: ${champ.gold}`, 10, 0xe6cc33, L, true);
  gl.x = cx + 14; gl.y = y; cc.addChild(gl);
  const ic = txt(`${champ.inventoryItemIDs.length} objets`, 8, 0x888888, L);
  ic.anchor.set(1, 0); ic.x = cx + cw - 14; ic.y = y; cc.addChild(ic);
  y += scaled(18, L);

  // Filter bar
  y = renderFilterBar(cc, cx, y, cw, L, filterState, refresh);

  // Get equipped item IDs
  const eq = champ.equipment as unknown as Record<string, string | null>;
  const equippedSet = new Set(Object.values(eq).filter(Boolean) as string[]);

  // Build filtered entries with original inventory indices
  const entries: FilteredEntry[] = [];
  champ.inventoryItemIDs.forEach((id, invIndex) => {
    if (equippedSet.has(id)) return;
    const it = gameData.item(id);
    if (!it) return;
    const slot = it.slot as string;
    const slotForFilter = id.startsWith('enchant_') ? 'enchant' : slot === 'consumable' ? 'consumable' : slot;
    if (!matchesSlotFilter(slotForFilter, filterState.slotFilter)) return;
    if (!matchesRarityFilter(it.rarity, filterState.rarityFilter)) return;
    entries.push({ id, invIndex });
  });

  // Clean up selected indices that are no longer in filtered entries
  const validIndices = new Set(entries.map(e => e.invIndex));
  for (const idx of [...filterState.selectedIndices]) {
    if (!validIndices.has(idx)) filterState.selectedIndices.delete(idx);
  }

  // Bulk action bar
  y = renderBulkBar(cc, cx, y, cw, L, filterState, entries, refresh);

  // Potion quick-slots (only if no filter or consumable filter)
  if (filterState.slotFilter === 'all' || filterState.slotFilter === 'consumable') {
    const potionIDs = champ.inventoryItemIDs.filter(id => {
      const it = gameData.item(id); return it && (it.slot as string) === 'consumable';
    });
    if (potionIDs.length > 0) {
      const pl = txt('Potions rapides', 9, UI_COLORS.textSecondary, L, true);
      pl.x = cx + 14; pl.y = y; cc.addChild(pl);
      y += scaled(14, L);
      const ps = scaled(32, L), pg = scaled(8, L);
      for (let i = 0; i < Math.min(3, potionIDs.length); i++) {
        const px = cx + 14 + i * (ps + pg);
        const pid = potionIDs[i];
        const pot = pid ? gameData.item(pid) : null;
        const rc = pot ? (RARITY_COLORS[pot.rarity] ?? 0xaaaaaa) : 0x333344;
        const g = new Graphics();
        g.roundRect(px, y, ps, ps, 4).fill({ color: 0x112211, alpha: 0.7 })
          .stroke({ color: rc, width: pot ? 1.5 : 0.8, alpha: pot ? 0.8 : 0.3 });
        if (pot) {
          g.circle(px + ps / 2, y + ps / 2 - 3, ps / 4).fill({ color: rc, alpha: 0.5 });
          g.eventMode = 'static'; g.cursor = 'pointer';
          g.on('pointerdown', () => usePotionCb(pid));
        }
        cc.addChild(g);
        if (pot) {
          const n = txt(pot.name.substring(0, 6), 6, rc, L);
          n.anchor.set(0.5, 0); n.x = px + ps / 2; n.y = y + ps - scaled(8, L);
          cc.addChild(n);
        }
      }
      y += ps + scaled(12, L);
    }
  }

  // Equipment grid
  if (entries.length === 0) {
    const em = txt('Aucun objet correspondant aux filtres.', 10, UI_COLORS.textMuted, L);
    em.anchor.set(0.5, 0); em.x = cx + cw / 2; em.y = y + 20; cc.addChild(em);
    return;
  }

  const cols = 4, pad = 12, gap = scaled(6, L);
  const cell = Math.floor((cw - pad * 2 - gap * (cols - 1)) / cols);
  entries.forEach((entry, gridIdx) => {
    const item = gameData.item(entry.id); if (!item) return;
    const col = gridIdx % cols, row = Math.floor(gridIdx / cols);
    const cx2 = cx + pad + col * (cell + gap), cy2 = y + row * (cell + gap + scaled(10, L));
    const rc = RARITY_COLORS[item.rarity] ?? 0xaaaaaa;
    const isSelected = filterState.selectedIndices.has(entry.invIndex);

    const g = new Graphics();
    g.roundRect(cx2, cy2, cell, cell, 4).fill({ color: isSelected ? 0x222244 : 0x111122, alpha: 0.75 })
      .stroke({ color: isSelected ? 0x66aaff : rc, width: isSelected ? 2 : 1.2, alpha: isSelected ? 1 : 0.7 });
    g.roundRect(cx2 + 3, cy2 + 3, cell - 6, cell - 6, 2).fill({ color: rc, alpha: 0.12 });
    g.eventMode = 'static'; g.cursor = 'pointer';

    if (filterState.bulkMode) {
      g.on('pointerdown', () => {
        if (isSelected) filterState.selectedIndices.delete(entry.invIndex);
        else filterState.selectedIndices.add(entry.invIndex);
        refresh();
      });
      // Checkbox indicator
      if (isSelected) {
        const check = txt('\u2713', 10, 0x66aaff, L, true);
        check.anchor.set(0.5); check.x = cx2 + cell - 8; check.y = cy2 + 8;
        cc.addChild(check);
      }
    } else {
      g.on('pointerdown', () => showTooltip(item, item.slot, cx2 + cell / 2, cy2));
    }
    cc.addChild(g);

    const iconChar = txt((SLOT_LABELS[item.slot] ?? 'X').charAt(0), 12, rc, L, true);
    iconChar.anchor.set(0.5); iconChar.x = cx2 + cell / 2; iconChar.y = cy2 + cell / 2 - 4;
    cc.addChild(iconChar);

    // Item level badge
    const lvl = item.itemLevel ?? 0;
    if (lvl > 0) {
      const lvlBadge = txt(`+${lvl}`, 7, 0x44ddff, L, true);
      lvlBadge.anchor.set(0, 0); lvlBadge.x = cx2 + 3; lvlBadge.y = cy2 + 2;
      cc.addChild(lvlBadge);
    }

    const nm = txt(item.name.length > 8 ? item.name.substring(0, 7) + '\u2026' : item.name, 6, UI_COLORS.textPrimary, L);
    nm.anchor.set(0.5, 0); nm.x = cx2 + cell / 2; nm.y = cy2 + cell - scaled(10, L);
    cc.addChild(nm);
  });
}

// ─── Rarity Labels ───────────────────────────────────────────────────

const RARITY_LABELS: Record<string, string> = {
  common: 'Commun', uncommon: 'Insolite', rare: 'Rare',
  epic: '\u00c9pique', legendary: 'L\u00e9gend.', cosmeric: 'Cosm\u00e8re',
};

// ─── Item Tooltip (with upgrade + promote) ───────────────────────────

export function showItemTooltip(
  panel: Container, item: Item, slot: EquipmentSlot | string,
  ax: number, ay: number, screenW: number, screenH: number,
  layout: LayoutInfo,
  onAction: () => void,
): Container {
  const champ = GameManager.shared.champion; if (!champ) return new Container();
  const L = layout;
  const tw = scaled(220, L), th = scaled(240, L);
  const tx = Math.max(10, Math.min(screenW - tw - 10, ax - tw / 2));
  const ty = Math.max(10, Math.min(screenH - th - 10, ay - th - 10));
  const rc = RARITY_COLORS[item.rarity] ?? 0xaaaaaa;
  const c = new Container(); c.zIndex = 20000;

  const bg = new Graphics();
  bg.roundRect(tx, ty, tw, th, 8).fill({ color: 0x0a0815, alpha: 0.95 })
    .stroke({ color: rc, width: 2, alpha: 0.8 });
  bg.eventMode = 'static'; c.addChild(bg);

  let ly = ty + 8;

  // Name + item level
  const lvl = item.itemLevel ?? 0;
  const nameStr = lvl > 0 ? `${item.name} +${lvl}` : item.name;
  const nm = txt(nameStr, 11, rc, L, true); nm.x = tx + 10; nm.y = ly; c.addChild(nm);
  ly += scaled(16, L);

  // Slot + rarity
  const rarLabel = RARITY_LABELS[item.rarity] ?? item.rarity;
  const sl = txt(`${SLOT_LABELS[item.slot] ?? item.slot} \u2022 ${rarLabel}`, 8, UI_COLORS.textMuted, L);
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
  ly += scaled(4, L);

  // ─── Action Row 1: Equip/Sell/Disenchant ──────────────────────
  const bw = scaled(48, L), bh = scaled(20, L), bg2 = scaled(4, L);
  const inInv = champ.inventoryItemIDs.includes(item.id);
  if (inInv) {
    addTooltipBtn(c, tx + 6, ly, bw, bh, 0x224422, 0x44aa44, '\u00c9quiper', 7, 0x66cc44, L, () => {
      MusicManager.shared.playSFX('equip');
      GameManager.shared.equipItem(item.id, item.slot);
      onAction();
    });
    const sp = GameManager.getItemSellPrice(item.id);
    addTooltipBtn(c, tx + 6 + bw + bg2, ly, bw, bh, 0x332211, 0xcc9933, `${sp}g`, 7, 0xe6cc33, L, () => {
      MusicManager.shared.playSFX('loot_common');
      GameManager.shared.sellItem(item.id);
      onAction();
    });
    const dr = GameManager.getDisenchantResult(item.id);
    addTooltipBtn(c, tx + 6 + 2 * (bw + bg2), ly, bw * 1.5, bh, 0x221133, 0x9955ee, `D\u00e9ch.+${dr.amount}`, 6, 0xbb88ee, L, () => {
      MusicManager.shared.playSFX('magic_aondor');
      GameManager.shared.disenchantItem(item.id);
      onAction();
    });
  } else {
    addTooltipBtn(c, tx + 6, ly, bw * 1.3, bh, 0x442222, 0xcc4444, 'Retirer', 8, 0xcc6644, L, () => {
      GameManager.shared.unequipItem(slot);
      onAction();
    });
  }
  ly += bh + scaled(6, L);

  // ─── Action Row 2: Upgrade + Promote (for all items) ──────────
  const upCost = GameManager.getUpgradeCost(item.id);
  const canUp = champ.gold >= upCost.gold;
  const upW = scaled(90, L);
  addTooltipBtn(c, tx + 6, ly, upW, bh,
    canUp ? 0x112233 : 0x111122, canUp ? 0x44aadd : 0x333344,
    `Am\u00e9liorer +${upCost.currentLevel + 1} (${upCost.gold}g)`, 7,
    canUp ? 0x66ccff : 0x555555, L, () => {
      if (!canUp) return;
      GameManager.shared.upgradeItem(item.id);
      GameManager.shared.save();
      onAction();
    });

  const promCost = GameManager.getPromoteCost(item.id);
  const canProm = promCost.canPromote && champ.gold >= promCost.gold;
  const nextRarColor = promCost.nextRarity ? (RARITY_COLORS[promCost.nextRarity] ?? 0xaaaaaa) : 0x555555;
  const nextRarLabel = promCost.nextRarity ? (RARITY_LABELS[promCost.nextRarity] ?? promCost.nextRarity) : 'MAX';
  const promLabel = promCost.canPromote ? `\u2191 ${nextRarLabel} (${promCost.gold}g)` : 'Raret\u00e9 MAX';
  const promW = tw - upW - 18;
  addTooltipBtn(c, tx + 6 + upW + bg2, ly, promW, bh,
    canProm ? 0x1a1122 : 0x111122, canProm ? nextRarColor : 0x333344,
    promLabel, 6, canProm ? nextRarColor : 0x555555, L, () => {
      if (!canProm) return;
      GameManager.shared.promoteItem(item.id);
      GameManager.shared.save();
      onAction();
    });

  // ─── Action Row 3: Enchant (if player has enchantment items) ──
  ly += bh + scaled(4, L);
  const enchantIDs = champ.inventoryItemIDs.filter(id => id.startsWith('enchant_'));
  if (enchantIDs.length > 0) {
    const enchW = tw - 12;
    addTooltipBtn(c, tx + 6, ly, enchW, bh,
      0x112222, 0x44aa88, `Enchanter (${enchantIDs.length} dispo.)`, 7,
      0x66ddaa, L, () => {
        // Apply first available enchantment
        const eid = enchantIDs[0];
        applyEnchantment(champ, eid, item.id);
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
