import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { GameManager } from '../game/GameManager';
import { gameData } from '../data/DataLoader';
import type { Item, EquipmentSlot } from '../data/types';
import { RARITY_COLORS, CLASS_INFO } from '../data/types';
import { getLayoutInfo, fontSize, scaled, panelSize, panelRadius, buttonHeight, UI_COLORS, UI_ALPHA } from '../ui/ResponsiveLayout';
import type { LayoutInfo } from '../ui/ResponsiveLayout';
import { MusicManager } from '../game/MusicSystem';
import { drawPlayerCharacter } from '../rendering/PlayerRenderer';

const SLOT_LABELS: Record<string, string> = {
  helmet: 'Casque', shoulders: 'Épaul.', chest: 'Torse', cape: 'Cape',
  gloves: 'Gants', belt: 'Ceint.', legs: 'Jamb.', boots: 'Bottes',
  mainWeapon: 'Arme', offhand: 'M.gauche', amulet: 'Amul.', ring1: 'Ann.1', ring2: 'Ann.2',
};
const EQUIPMENT_SLOTS: EquipmentSlot[] = [
  'helmet', 'shoulders', 'chest', 'cape', 'mainWeapon',
  'offhand', 'gloves', 'belt', 'legs', 'boots', 'amulet', 'ring1', 'ring2',
];
const STAT_LABELS: Record<string, string> = {
  vigor: 'VIG', strength: 'FOR', agility: 'AGI', spirit: 'ESP', luck: 'CHA', investiture: 'INV',
};

function slotPositions(s: number): Record<string, { x: number; y: number }> {
  return {
    helmet: { x: 0, y: -58 * s }, shoulders: { x: -28 * s, y: -42 * s },
    chest: { x: 28 * s, y: -36 * s }, cape: { x: -28 * s, y: -28 * s },
    gloves: { x: -30 * s, y: -8 * s }, belt: { x: 28 * s, y: -16 * s },
    legs: { x: 28 * s, y: 2 * s }, boots: { x: -28 * s, y: 10 * s },
    mainWeapon: { x: 34 * s, y: -50 * s }, offhand: { x: -34 * s, y: -50 * s },
    amulet: { x: 0, y: -32 * s }, ring1: { x: -30 * s, y: -2 * s }, ring2: { x: 30 * s, y: -2 * s },
  };
}

function txt(text: string, size: number, fill: number, layout: LayoutInfo, bold = false): Text {
  return new Text({ text, style: new TextStyle({
    fontFamily: 'sans-serif', fontSize: fontSize(size, layout), fill, fontWeight: bold ? 'bold' : 'normal',
  }) });
}

export class InventoryPanel extends Container {
  private onClose: () => void;
  private cc: Container; // content container
  private scrollMask: Graphics;
  private scrollY = 0;
  private scrollVelocity = 0;
  private screenW: number;
  private screenH: number;
  private currentTab: 'equipment' | 'inventory' | 'skills' = 'equipment';
  private layout: LayoutInfo;
  private tabBgs: Graphics[] = [];
  private tabLabels: Text[] = [];
  private ca: { x: number; y: number; w: number; h: number } = { x: 0, y: 0, w: 0, h: 0 };
  private tooltip: Container | null = null;

  constructor(screenW: number, screenH: number, onClose: () => void) {
    super();
    this.screenW = screenW;
    this.screenH = screenH;
    this.onClose = onClose;
    this.zIndex = 10000;
    this.layout = getLayoutInfo(screenW, screenH);
    const L = this.layout;
    const radius = panelRadius(L);
    const overlay = new Graphics();
    overlay.rect(0, 0, screenW, screenH).fill({ color: 0x000000, alpha: UI_ALPHA.overlay });
    overlay.eventMode = 'static';
    overlay.on('pointerdown', () => this.hideTooltip());
    this.addChild(overlay);

    const ps = panelSize(L);
    const [pW, pH] = [ps.width, ps.height];
    const [px, py] = [(screenW - pW) / 2, (screenH - pH) / 2];
    const panel = new Graphics();
    panel.roundRect(px, py, pW, pH, radius + 2)
      .fill({ color: UI_COLORS.panelBgAlt, alpha: 0.96 })
      .stroke({ color: UI_COLORS.borderAccent, width: 2, alpha: 0.7 });
    panel.eventMode = 'static';
    this.addChild(panel);

    const title = txt('INVENTAIRE', 18, UI_COLORS.textGold, L, true);
    title.anchor.set(0.5);
    title.x = screenW / 2; title.y = py + scaled(20, L);
    this.addChild(title);

    // Tabs
    const tabDefs = [
      { label: 'Équipement', tab: 'equipment' as const },
      { label: 'Objets', tab: 'inventory' as const },
      { label: 'Compétences', tab: 'skills' as const },
    ];
    const tabW = (pW - 24) / 3, tabH = scaled(26, L);
    tabDefs.forEach((t, i) => {
      const tx = px + 12 + i * tabW, ty = py + scaled(40, L);
      const bg = new Graphics();
      this.drawTab(bg, tx, ty, tabW - 6, tabH, this.currentTab === t.tab);
      bg.eventMode = 'static'; bg.cursor = 'pointer';
      bg.on('pointerdown', () => {
        this.currentTab = t.tab; this.scrollY = 0; this.scrollVelocity = 0;
        this.hideTooltip(); this.updateTabs(); this.refreshContent();
      });
      this.addChild(bg); this.tabBgs.push(bg);
      const label = txt(t.label, 10, this.currentTab === t.tab ? UI_COLORS.textPrimary : UI_COLORS.textMuted, L, this.currentTab === t.tab);
      label.anchor.set(0.5); label.x = tx + (tabW - 6) / 2; label.y = ty + tabH / 2;
      this.addChild(label); this.tabLabels.push(label);
    });

    const cY = py + scaled(72, L), cH = pH - scaled(112, L);
    this.ca = { x: px, y: cY, w: pW, h: cH };
    this.cc = new Container();
    this.addChild(this.cc);
    this.scrollMask = new Graphics();
    this.scrollMask.rect(px, cY, pW, cH).fill(0xffffff);
    this.addChild(this.scrollMask);
    this.cc.mask = this.scrollMask;

    let isDragging = false, lastDY = 0;
    this.cc.eventMode = 'static';
    this.cc.hitArea = { contains: (x: number, y: number) => x >= px && x <= px + pW && y >= cY && y <= cY + cH };
    this.cc.on('pointerdown', (e) => { isDragging = true; lastDY = e.globalY; this.scrollVelocity = 0; });
    this.cc.on('globalpointermove', (e) => {
      if (!isDragging) return;
      const dy = e.globalY - lastDY; this.scrollY += dy; lastDY = e.globalY; this.scrollVelocity = dy;
      this.applyScroll();
    });
    const end = () => { isDragging = false; };
    this.cc.on('pointerup', end); this.cc.on('pointerupoutside', end);
    this.refreshContent();

    // Close button
    const cbW = scaled(90, L), cbH = buttonHeight(L);
    const cb = new Graphics();
    cb.roundRect(px + pW / 2 - cbW / 2, py + pH - scaled(38, L), cbW, cbH, 8)
      .fill({ color: 0x553322, alpha: UI_ALPHA.buttonBg }).stroke({ color: 0x886644, width: 1.5 });
    cb.eventMode = 'static'; cb.cursor = 'pointer'; cb.on('pointerdown', () => this.onClose());
    this.addChild(cb);
    const cl = txt('Fermer', 12, UI_COLORS.textPrimary, L, true);
    cl.anchor.set(0.5); cl.x = px + pW / 2; cl.y = py + pH - scaled(38, L) + cbH / 2;
    this.addChild(cl);
    this.startMomentum();
  }

  private drawTab(g: Graphics, x: number, y: number, w: number, h: number, active: boolean): void {
    g.clear();
    g.roundRect(x, y, w, h, 6).fill({ color: active ? 0x332244 : UI_COLORS.btnSecondary, alpha: active ? 0.9 : 0.6 });
    if (active) g.roundRect(x, y + h - 3, w, 3, 2).fill({ color: UI_COLORS.textGold, alpha: 0.8 });
  }

  private updateTabs(): void {
    (['equipment', 'inventory', 'skills'] as const).forEach((tab, i) => {
      const a = this.currentTab === tab;
      const ps = panelSize(this.layout);
      const px = (this.screenW - ps.width) / 2, py = (this.screenH - ps.height) / 2;
      const tw = (ps.width - 24) / 3;
      this.drawTab(this.tabBgs[i], px + 12 + i * tw, py + scaled(40, this.layout), tw - 6, scaled(26, this.layout), a);
      this.tabLabels[i].style.fill = a ? UI_COLORS.textPrimary : UI_COLORS.textMuted;
      this.tabLabels[i].style.fontWeight = a ? 'bold' : 'normal';
    });
  }

  private startMomentum(): void {
    const tick = () => {
      if (this.destroyed) return;
      if (Math.abs(this.scrollVelocity) > 0.5) {
        this.scrollVelocity *= 0.92; this.scrollY += this.scrollVelocity; this.applyScroll();
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  private applyScroll(): void {
    let maxY = 0;
    for (const c of this.cc.children) { const b = c.y + ((c as { height?: number }).height ?? 0); if (b > maxY) maxY = b; }
    const ch = maxY - this.ca.y;
    this.scrollY = Math.max(Math.min(0, this.ca.h - ch), Math.min(0, this.scrollY));
    this.cc.y = this.scrollY;
  }

  private refreshContent(): void {
    this.cc.removeChildren(); this.cc.y = 0; this.scrollY = 0;
    const { x, y, w, h } = this.ca;
    if (this.currentTab === 'equipment') this.renderEquipment(x, y, w, h);
    else if (this.currentTab === 'inventory') this.renderInventory(x, y, w, h);
    else this.renderSkills(x, y, w, h);
  }

  // ─── Equipment Tab ──────────────────────────────────────────────

  private renderEquipment(cx: number, cy: number, cw: number, _ch: number): void {
    const champ = GameManager.shared.champion;
    if (!champ) return;
    const eq = champ.equipment as unknown as Record<string, string | null>;
    const L = this.layout;
    const centerX = cx + cw / 2, centerY = cy + scaled(80, L);

    // Player preview (3x scale)
    const pg = new Graphics();
    drawPlayerCharacter(pg, champ.championClass);
    pg.scale.set(3); pg.x = centerX; pg.y = centerY + scaled(40, L);
    this.cc.addChild(pg);

    // Class label
    const info = CLASS_INFO[champ.championClass];
    const cl = txt(`${champ.name} — ${info.name} Nv.${champ.level}`, 10, UI_COLORS.textGold, L, true);
    cl.anchor.set(0.5, 0); cl.x = centerX; cl.y = cy + 2;
    this.cc.addChild(cl);

    // Equipment slots around character
    const positions = slotPositions(L.scale);
    const ss = scaled(18, L);
    for (const slot of EQUIPMENT_SLOTS) {
      const p = positions[slot]; if (!p) continue;
      const sx = centerX + p.x, sy = centerY + p.y;
      const itemID = eq[slot];
      const item = itemID ? gameData.item(itemID) : null;
      const rc = item ? (RARITY_COLORS[item.rarity] ?? 0xaaaaaa) : 0x333344;

      const g = new Graphics();
      g.roundRect(sx - ss / 2, sy - ss / 2, ss, ss, 3)
        .fill({ color: 0x111122, alpha: 0.8 })
        .stroke({ color: rc, width: item ? 1.5 : 0.8, alpha: item ? 0.9 : 0.4 });
      if (item) g.roundRect(sx - ss / 2 + 2, sy - ss / 2 + 2, ss - 4, ss - 4, 2).fill({ color: rc, alpha: 0.25 });
      g.eventMode = 'static'; g.cursor = 'pointer';
      g.on('pointerdown', () => { if (item) this.showTooltip(item, slot, sx, sy); });
      this.cc.addChild(g);

      const sl = txt(SLOT_LABELS[slot] ?? slot, 6, UI_COLORS.textMuted, L);
      sl.anchor.set(0.5, 0); sl.x = sx; sl.y = sy + ss / 2 + 1;
      this.cc.addChild(sl);

      // Connection line
      const ln = new Graphics();
      ln.moveTo(sx, sy).lineTo(centerX, centerY + p.y * 0.3).stroke({ color: rc, width: 0.5, alpha: 0.2 });
      this.cc.addChild(ln);
    }

    // Stats summary
    const sY = centerY + scaled(90, L);
    const bg = new Graphics();
    bg.roundRect(cx + 10, sY, cw - 20, scaled(50, L), 5)
      .fill({ color: 0x111122, alpha: 0.7 }).stroke({ color: UI_COLORS.borderSubtle, width: 0.8, alpha: 0.4 });
    this.cc.addChild(bg);
    const st = txt('STATISTIQUES TOTALES', 8, UI_COLORS.textGold, L, true);
    st.anchor.set(0.5, 0); st.x = cx + cw / 2; st.y = sY + 4;
    this.cc.addChild(st);

    const totals: Record<string, number> = { ...champ.baseStats };
    for (const slot of EQUIPMENT_SLOTS) {
      const id = eq[slot]; if (!id) continue;
      const it = gameData.item(id); if (!it) continue;
      for (const b of it.statBonuses) if (totals[b.stat] !== undefined) totals[b.stat] += b.value;
    }
    const base = champ.baseStats as unknown as Record<string, number>;
    const colW = (cw - 40) / 3;
    ['vigor', 'strength', 'agility', 'spirit', 'luck', 'investiture'].forEach((s, i) => {
      const bonus = totals[s] - base[s];
      const t = txt(`${STAT_LABELS[s]}: ${totals[s]}${bonus > 0 ? ` (+${bonus})` : ''}`, 8,
        bonus > 0 ? UI_COLORS.success : UI_COLORS.textSecondary, L);
      t.x = cx + 20 + (i % 3) * colW;
      t.y = sY + 18 + Math.floor(i / 3) * scaled(14, L);
      this.cc.addChild(t);
    });
  }

  // ─── Inventory Tab ──────────────────────────────────────────────

  private renderInventory(cx: number, cy: number, cw: number, _ch: number): void {
    const champ = GameManager.shared.champion;
    if (!champ) return;
    const L = this.layout;
    let y = cy;

    // Gold
    const gl = txt(`Or: ${champ.gold}`, 10, 0xe6cc33, L, true);
    gl.x = cx + 14; gl.y = y; this.cc.addChild(gl);
    const ic = txt(`${champ.inventoryItemIDs.length} objets`, 8, 0x888888, L);
    ic.anchor.set(1, 0); ic.x = cx + cw - 14; ic.y = y; this.cc.addChild(ic);
    y += scaled(18, L);

    // Potion quick-slots
    const potionIDs = champ.inventoryItemIDs.filter(id => {
      const it = gameData.item(id); return it && (it.slot as string) === 'consumable';
    });
    const pl = txt('Potions rapides', 9, UI_COLORS.textSecondary, L, true);
    pl.x = cx + 14; pl.y = y; this.cc.addChild(pl);
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
        g.on('pointerdown', () => this.usePotion(pid!));
      }
      this.cc.addChild(g);
      if (pot) {
        const n = txt(pot.name.substring(0, 6), 6, rc, L);
        n.anchor.set(0.5, 0); n.x = px + ps / 2; n.y = y + ps - scaled(8, L);
        this.cc.addChild(n);
      } else {
        const e = txt('-', 10, 0x444444, L);
        e.anchor.set(0.5); e.x = px + ps / 2; e.y = y + ps / 2; this.cc.addChild(e);
      }
    }
    if (potionIDs.length > 0) {
      const bx = cx + 14 + 3 * (ps + pg), bw = scaled(50, L);
      const btn = new Graphics();
      btn.roundRect(bx, y + ps / 4, bw, ps / 2, 4)
        .fill({ color: 0x224422, alpha: 0.8 }).stroke({ color: 0x44aa44, width: 1 });
      btn.eventMode = 'static'; btn.cursor = 'pointer';
      btn.on('pointerdown', () => { if (potionIDs[0]) this.usePotion(potionIDs[0]); });
      this.cc.addChild(btn);
      const bt = txt('Utiliser', 8, 0x66cc44, L, true);
      bt.anchor.set(0.5); bt.x = bx + bw / 2; bt.y = y + ps / 2;
      this.cc.addChild(bt);
    }
    y += ps + scaled(12, L);

    // Equipment grid
    const eqItems = champ.inventoryItemIDs.filter(id => {
      const it = gameData.item(id); return it && (it.slot as string) !== 'consumable';
    });
    if (eqItems.length === 0 && potionIDs.length === 0) {
      const em = txt('Aucun objet. Tuez des ennemis pour du butin!', 11, UI_COLORS.textMuted, L);
      em.anchor.set(0.5, 0); em.x = cx + cw / 2; em.y = y + 20; this.cc.addChild(em);
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
      g.on('pointerdown', () => this.showTooltip(item, item.slot, cx2 + cell / 2, cy2));
      this.cc.addChild(g);
      const ic = txt((SLOT_LABELS[item.slot] ?? 'X').charAt(0), 12, rc, L, true);
      ic.anchor.set(0.5); ic.x = cx2 + cell / 2; ic.y = cy2 + cell / 2 - 4;
      this.cc.addChild(ic);
      const nm = txt(item.name.length > 8 ? item.name.substring(0, 7) + '…' : item.name, 6, UI_COLORS.textPrimary, L);
      nm.anchor.set(0.5, 0); nm.x = cx2 + cell / 2; nm.y = cy2 + cell - scaled(10, L);
      this.cc.addChild(nm);
    });
  }

  // ─── Skills Tab ─────────────────────────────────────────────────

  private renderSkills(cx: number, cy: number, cw: number, _ch: number): void {
    const champ = GameManager.shared.champion;
    if (!champ) return;
    const L = this.layout;
    let y = cy;
    const h = txt(`Points de compétence: ${champ.skillPoints}`, 11, UI_COLORS.textGold, L, true);
    h.x = cx + 16; h.y = y; this.cc.addChild(h);
    y += scaled(22, L);
    const el = txt('Compétences équipées:', 10, UI_COLORS.textSecondary, L);
    el.x = cx + 16; el.y = y; this.cc.addChild(el);
    y += scaled(16, L);
    const sH = scaled(30, L);
    for (let i = 0; i < 4; i++) {
      const sid = champ.equippedSkillIDs[i], skill = sid ? gameData.skill(sid) : null;
      const r = new Graphics();
      r.roundRect(cx + 10, y, cw - 20, sH, 5)
        .fill({ color: skill ? 0x1a2228 : UI_COLORS.btnSecondary, alpha: 0.6 })
        .stroke({ color: UI_COLORS.borderSubtle, width: 0.8, alpha: 0.4 });
      this.cc.addChild(r);
      const sn = txt(`[${i + 1}]`, 10, 0x6688aa, L, true);
      sn.x = cx + 16; sn.y = y + 4; this.cc.addChild(sn);
      if (skill) {
        const n = txt(skill.name, 10, UI_COLORS.textPrimary, L);
        n.x = cx + 40; n.y = y + 4; this.cc.addChild(n);
        const d = txt(`DMG: ${skill.baseDamage} | INV: ${skill.investitureCost} | CD: ${skill.cooldown}s`, 8, UI_COLORS.textMuted, L);
        d.x = cx + 40; d.y = y + 18; this.cc.addChild(d);
      } else {
        const e = txt('- vide -', 10, 0x555555, L);
        e.x = cx + 40; e.y = y + 8; this.cc.addChild(e);
      }
      y += sH + 3;
    }
    y += 8;
    const al = txt('Compétences disponibles:', 10, UI_COLORS.textSecondary, L);
    al.x = cx + 16; al.y = y; this.cc.addChild(al);
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
        this.refreshContent();
      });
      this.cc.addChild(r);
      const n = txt(`${skill.name} (Nv.${skill.requiredLevel})`, 9, UI_COLORS.textPrimary, L);
      n.x = cx + 16; n.y = y + 5; this.cc.addChild(n);
      const eq = txt('Équiper', 9, UI_COLORS.success, L, true);
      eq.anchor.set(1, 0); eq.x = cx + cw - 16; eq.y = y + 5; this.cc.addChild(eq);
      y += scaled(28, L);
    }
  }

  // ─── Item Tooltip ───────────────────────────────────────────────

  private showTooltip(item: Item, slot: EquipmentSlot | string, ax: number, ay: number): void {
    this.hideTooltip();
    const champ = GameManager.shared.champion; if (!champ) return;
    const L = this.layout;
    const tw = scaled(200, L), th = scaled(180, L);
    const tx = Math.max(10, Math.min(this.screenW - tw - 10, ax - tw / 2));
    const ty = Math.max(10, Math.min(this.screenH - th - 10, ay - th - 10));
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
      this.addTooltipBtn(c, tx + 8, ly, bw, bh, 0x224422, 0x44aa44, 'Équiper', 8, 0x66cc44, L, () => {
        MusicManager.shared.playSFX('equip');
        GameManager.shared.equipItem(item.id, item.slot);
        this.hideTooltip(); this.refreshContent();
      });
      const sp = GameManager.getItemSellPrice(item.id);
      this.addTooltipBtn(c, tx + 8 + bw + bg2, ly, bw, bh, 0x332211, 0xcc9933, `Vendre ${sp}g`, 7, 0xe6cc33, L, () => {
        MusicManager.shared.playSFX('loot_common');
        GameManager.shared.sellItem(item.id);
        this.hideTooltip(); this.refreshContent();
      });
      const dr = GameManager.getDisenchantResult(item.id);
      this.addTooltipBtn(c, tx + 8 + 2 * (bw + bg2), ly, bw, bh, 0x221133, 0x9955ee, `Déch. +${dr.amount}`, 6, 0xbb88ee, L, () => {
        MusicManager.shared.playSFX('magic_aondor');
        GameManager.shared.disenchantItem(item.id);
        this.hideTooltip(); this.refreshContent();
      });
    } else {
      this.addTooltipBtn(c, tx + 8, ly, bw * 1.5, bh, 0x442222, 0xcc4444, 'Déséquiper', 8, 0xcc6644, L, () => {
        GameManager.shared.unequipItem(slot);
        this.hideTooltip(); this.refreshContent();
      });
    }
    this.tooltip = c; this.addChild(c);
  }

  private addTooltipBtn(c: Container, x: number, y: number, w: number, h: number,
    bg: number, border: number, label: string, fs: number, fc: number, L: LayoutInfo, cb: () => void): void {
    const g = new Graphics();
    g.roundRect(x, y, w, h, 4).fill({ color: bg, alpha: 0.9 }).stroke({ color: border, width: 1 });
    g.eventMode = 'static'; g.cursor = 'pointer'; g.on('pointerdown', cb);
    c.addChild(g);
    const t = txt(label, fs, fc, L, true);
    t.anchor.set(0.5); t.x = x + w / 2; t.y = y + h / 2; c.addChild(t);
  }

  private hideTooltip(): void {
    if (this.tooltip) {
      this.removeChild(this.tooltip); this.tooltip.destroy({ children: true }); this.tooltip = null;
    }
  }

  private usePotion(itemID: string): void {
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
    this.refreshContent();
  }
}
