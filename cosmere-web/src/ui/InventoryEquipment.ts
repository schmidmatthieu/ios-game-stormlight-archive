import { Container, Graphics } from 'pixi.js';
import { GameManager } from '../game/GameManager';
import { gameData } from '../data/DataLoader';
import type { Item, EquipmentSlot } from '../data/types';
import { RARITY_COLORS, CLASS_INFO } from '../data/types';
import { scaled, UI_COLORS } from '../ui/ResponsiveLayout';
import type { LayoutInfo } from '../ui/ResponsiveLayout';
import { drawPlayerCharacter } from '../rendering/PlayerRenderer';
import { SLOT_LABELS, EQUIPMENT_SLOTS, STAT_LABELS, txt } from './InventoryConstants';

/**
 * Renders the Equipment tab: character preview, stats summary, and equipment slot list.
 */
export function renderEquipmentTab(
  cc: Container, cx: number, cy: number, cw: number, _ch: number,
  layout: LayoutInfo,
  showTooltip: (item: Item, slot: EquipmentSlot | string, ax: number, ay: number) => void,
): void {
  const champ = GameManager.shared.champion;
  if (!champ) return;
  const eq = champ.equipment as unknown as Record<string, string | null>;
  const L = layout;

  let y = cy + 4;

  // Header: Character preview (left) + Stats (right)
  const previewSize = scaled(60, L);
  const pg = new Graphics();
  drawPlayerCharacter(pg, champ.championClass);
  pg.scale.set(2);
  pg.x = cx + scaled(14, L) + previewSize / 2;
  pg.y = y + previewSize - scaled(8, L);
  cc.addChild(pg);

  // Class label next to preview
  const info = CLASS_INFO[champ.championClass];
  const cl = txt(`${champ.name}`, 10, UI_COLORS.textGold, L, true);
  cl.x = cx + scaled(14, L) + previewSize + scaled(10, L);
  cl.y = y + 2;
  cc.addChild(cl);

  const classLabel = txt(`${info.name} — Niveau ${champ.level}`, 8, UI_COLORS.textSecondary, L);
  classLabel.x = cx + scaled(14, L) + previewSize + scaled(10, L);
  classLabel.y = y + scaled(16, L);
  cc.addChild(classLabel);

  // Compact stats next to preview
  const totals: Record<string, number> = { ...champ.baseStats };
  for (const slot of EQUIPMENT_SLOTS) {
    const id = eq[slot]; if (!id) continue;
    const it = gameData.item(id); if (!it) continue;
    for (const b of it.statBonuses) if (totals[b.stat] !== undefined) totals[b.stat] += b.value;
  }
  const base = champ.baseStats as unknown as Record<string, number>;
  const statsX = cx + scaled(14, L) + previewSize + scaled(10, L);
  const statsY = y + scaled(30, L);
  const statCols = 3;
  const statColW = (cw - previewSize - scaled(38, L)) / statCols;
  ['vigor', 'strength', 'agility', 'spirit', 'luck', 'investiture'].forEach((s, i) => {
    const bonus = totals[s] - base[s];
    const t = txt(`${STAT_LABELS[s]}: ${totals[s]}${bonus > 0 ? ` (+${bonus})` : ''}`, 7,
      bonus > 0 ? UI_COLORS.success : UI_COLORS.textSecondary, L);
    t.x = statsX + (i % statCols) * statColW;
    t.y = statsY + Math.floor(i / statCols) * scaled(12, L);
    cc.addChild(t);
  });

  y += previewSize + scaled(10, L);

  // Separator line
  const sep = new Graphics();
  sep.rect(cx + 12, y, cw - 24, 1).fill({ color: UI_COLORS.borderSubtle, alpha: 0.3 });
  cc.addChild(sep);
  y += scaled(8, L);

  // Equipment slots as a clean list
  const rowH = scaled(32, L);
  const rowPad = scaled(4, L);
  const iconSize = scaled(22, L);

  for (const slot of EQUIPMENT_SLOTS) {
    const itemID = eq[slot];
    const item = itemID ? gameData.item(itemID) : null;
    const rc = item ? (RARITY_COLORS[item.rarity] ?? 0xaaaaaa) : 0x333344;

    // Row background
    const row = new Graphics();
    row.roundRect(cx + 10, y, cw - 20, rowH, 5)
      .fill({ color: 0x111122, alpha: 0.6 })
      .stroke({ color: rc, width: item ? 1 : 0.5, alpha: item ? 0.6 : 0.2 });
    row.eventMode = 'static';
    row.cursor = 'pointer';
    row.on('pointerdown', () => {
      if (item) showTooltip(item, slot, cx + cw / 2, y);
    });
    cc.addChild(row);

    // Slot icon box
    const iconX = cx + 16;
    const iconY = y + (rowH - iconSize) / 2;
    const iconBg = new Graphics();
    iconBg.roundRect(iconX, iconY, iconSize, iconSize, 3)
      .fill({ color: 0x0a0a18, alpha: 0.8 })
      .stroke({ color: rc, width: item ? 1.2 : 0.5, alpha: item ? 0.7 : 0.3 });
    if (item) {
      iconBg.roundRect(iconX + 2, iconY + 2, iconSize - 4, iconSize - 4, 2)
        .fill({ color: rc, alpha: 0.2 });
    }
    cc.addChild(iconBg);

    // Slot abbreviation in icon
    const slotChar = (SLOT_LABELS[slot] ?? slot).charAt(0);
    const ic = txt(slotChar, 10, item ? rc : 0x444455, L, true);
    ic.anchor.set(0.5);
    ic.x = iconX + iconSize / 2;
    ic.y = iconY + iconSize / 2;
    cc.addChild(ic);

    // Slot label
    const slotLabel = txt(SLOT_LABELS[slot] ?? slot, 8, UI_COLORS.textMuted, L);
    slotLabel.x = iconX + iconSize + scaled(8, L);
    slotLabel.y = y + scaled(3, L);
    cc.addChild(slotLabel);

    // Item name or empty
    if (item) {
      const itemName = txt(item.name, 9, rc, L, true);
      itemName.x = iconX + iconSize + scaled(8, L);
      itemName.y = y + scaled(16, L);
      cc.addChild(itemName);

      // Stats on the right side
      if (item.statBonuses.length > 0) {
        const statsStr = item.statBonuses.map(b => `+${b.value} ${STAT_LABELS[b.stat] ?? b.stat}`).join('  ');
        const statsLabel = txt(statsStr, 7, UI_COLORS.success, L);
        statsLabel.anchor.set(1, 0.5);
        statsLabel.x = cx + cw - 18;
        statsLabel.y = y + rowH / 2;
        cc.addChild(statsLabel);
      }
    } else {
      const emptyLabel = txt('— vide —', 8, 0x444455, L);
      emptyLabel.x = iconX + iconSize + scaled(8, L);
      emptyLabel.y = y + scaled(10, L);
      cc.addChild(emptyLabel);
    }

    y += rowH + rowPad;
  }
}

/**
 * Renders the Skills tab: equipped skills and available skills list.
 */
export function renderSkillsTab(
  cc: Container, cx: number, cy: number, cw: number, _ch: number,
  layout: LayoutInfo,
  refreshContent: () => void,
): void {
  const champ = GameManager.shared.champion;
  if (!champ) return;
  const L = layout;
  let y = cy;
  const h = txt(`Points de compétence: ${champ.skillPoints}`, 11, UI_COLORS.textGold, L, true);
  h.x = cx + 16; h.y = y; cc.addChild(h);
  y += scaled(22, L);
  const el = txt('Compétences équipées:', 10, UI_COLORS.textSecondary, L);
  el.x = cx + 16; el.y = y; cc.addChild(el);
  y += scaled(16, L);
  const sH = scaled(30, L);
  for (let i = 0; i < 4; i++) {
    const sid = champ.equippedSkillIDs[i], skill = sid ? gameData.skill(sid) : null;
    const r = new Graphics();
    r.roundRect(cx + 10, y, cw - 20, sH, 5)
      .fill({ color: skill ? 0x1a2228 : UI_COLORS.btnSecondary, alpha: 0.6 })
      .stroke({ color: UI_COLORS.borderSubtle, width: 0.8, alpha: 0.4 });
    cc.addChild(r);
    const sn = txt(`[${i + 1}]`, 10, 0x6688aa, L, true);
    sn.x = cx + 16; sn.y = y + 4; cc.addChild(sn);
    if (skill) {
      const n = txt(skill.name, 10, UI_COLORS.textPrimary, L);
      n.x = cx + 40; n.y = y + 4; cc.addChild(n);
      const d = txt(`DMG: ${skill.baseDamage} | INV: ${skill.investitureCost} | CD: ${skill.cooldown}s`, 8, UI_COLORS.textMuted, L);
      d.x = cx + 40; d.y = y + 18; cc.addChild(d);
    } else {
      const e = txt('- vide -', 10, 0x555555, L);
      e.x = cx + 40; e.y = y + 8; cc.addChild(e);
    }
    y += sH + 3;
  }
  y += 8;
  const al = txt('Compétences disponibles:', 10, UI_COLORS.textSecondary, L);
  al.x = cx + 16; al.y = y; cc.addChild(al);
  y += scaled(16, L);
  for (const sid of champ.unlockedSkillIDs) {
    if (champ.equippedSkillIDs.includes(sid)) continue;
    const skill = gameData.skill(sid); if (!skill) continue;
    const r = new Graphics();
    r.roundRect(cx + 10, y, cw - 20, scaled(26, L), 5)
      .fill({ color: UI_COLORS.btnSecondary, alpha: 0.5 })
      .stroke({ color: 0x332244, width: 0.8, alpha: 0.3 });
    r.eventMode = 'static'; r.cursor = 'pointer';
    r.on('pointerdown', () => {
      const ei = champ.equippedSkillIDs.findIndex(id => !id);
      if (ei >= 0) champ.equippedSkillIDs[ei] = sid;
      else if (champ.equippedSkillIDs.length < 4) champ.equippedSkillIDs.push(sid);
      else champ.equippedSkillIDs[3] = sid;
      refreshContent();
    });
    cc.addChild(r);
    const n = txt(`${skill.name} (Nv.${skill.requiredLevel})`, 9, UI_COLORS.textPrimary, L);
    n.x = cx + 16; n.y = y + 5; cc.addChild(n);
    const eq = txt('Équiper', 9, UI_COLORS.success, L, true);
    eq.anchor.set(1, 0); eq.x = cx + cw - 16; eq.y = y + 5; cc.addChild(eq);
    y += scaled(28, L);
  }
}
