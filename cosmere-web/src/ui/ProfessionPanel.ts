// ─── Profession Panel — UI for gathering professions & crafting ──────

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { getLayoutInfo, fontSize, scaled, panelSize, panelRadius, buttonHeight, UI_COLORS, UI_ALPHA } from '../ui/ResponsiveLayout';
import { ProfessionManager, MATERIALS, RECIPES } from '../game/ProfessionSystem';
import { GameManager } from '../game/GameManager';
import { gameData } from '../data/DataLoader';
import { ItemModStore } from '../game/ItemModStore';
import type { ProfessionType, CraftingRecipe } from '../game/ProfessionSystem';

// ─── Rarity Colors ───────────────────────────────────────────────

const RARITY_COLORS: Record<string, number> = {
  common: 0xaaaaaa,
  uncommon: 0x44cc66,
  rare: 0x4488ff,
  epic: 0xaa44ff,
};

const PROFESSION_COLORS: Record<ProfessionType, number> = {
  mining: 0xaa7744,
  herbalism: 0x44aa55,
  woodcutting: 0x886633,
  skinning: 0xcc8855,
  enchanting: 0x7744cc,
};

// ─── Panel Entry Point ──────────────────────────────────────────

export function showProfessionPanel(
  uiContainer: Container,
  screenW: number, screenH: number,
  onClose: () => void,
): Container {
  const panel = new Container();
  panel.zIndex = 10000;
  const layout = getLayoutInfo(screenW, screenH);
  const mgr = ProfessionManager.shared;

  // Overlay
  const overlay = new Graphics();
  overlay.rect(0, 0, screenW, screenH).fill({ color: UI_COLORS.overlayDark, alpha: UI_ALPHA.overlay });
  overlay.eventMode = 'static';
  overlay.on('pointerdown', onClose);
  panel.addChild(overlay);

  // Panel dimensions
  const ps = panelSize(layout);
  const panelW = Math.min(ps.width, 440);
  const panelH = Math.min(ps.height, 520);
  const px = (screenW - panelW) / 2;
  const py = (screenH - panelH) / 2;

  const bg = new Graphics();
  bg.roundRect(px, py, panelW, panelH, panelRadius(layout))
    .fill({ color: UI_COLORS.panelBgAlt, alpha: UI_ALPHA.panelBg })
    .stroke({ color: UI_COLORS.borderAccent, width: 2, alpha: UI_ALPHA.panelBorder });
  bg.eventMode = 'static';
  panel.addChild(bg);

  // Title
  const title = new Text({
    text: 'Professions',
    style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: fontSize(15, layout), fill: UI_COLORS.textGold, fontWeight: 'bold' }),
  });
  title.anchor.set(0.5, 0);
  title.x = screenW / 2;
  title.y = py + 10;
  panel.addChild(title);

  // Tabs: Professions | Materiaux | Recettes | Enchanter | Désenchanter
  const tabs = [
    { label: 'Professions', id: 'prof' },
    { label: 'Materiaux', id: 'mats' },
    { label: 'Recettes', id: 'recipes' },
    { label: 'Enchanter', id: 'enchant' },
    { label: 'Désencht.', id: 'disench' },
  ];
  let activeTab = 'prof';

  const tabContainer = new Container();
  panel.addChild(tabContainer);
  const contentContainer = new Container();
  panel.addChild(contentContainer);

  const tabY = py + 32;

  function renderTabs(): void {
    tabContainer.removeChildren();
    tabs.forEach((tab, i) => {
      const tabW = (panelW - 24) / tabs.length;
      const tabX = px + 12 + i * tabW;
      const isActive = activeTab === tab.id;

      const tabBg = new Graphics();
      tabBg.roundRect(tabX, tabY, tabW - 4, 24, 4)
        .fill({ color: isActive ? UI_COLORS.btnSecondary : UI_COLORS.panelBgAlt, alpha: UI_ALPHA.barBg })
        .stroke({ color: isActive ? UI_COLORS.textGold : 0x443355, width: 1, alpha: UI_ALPHA.panelBorder });
      tabBg.eventMode = 'static';
      tabBg.cursor = 'pointer';
      tabBg.on('pointerdown', () => { activeTab = tab.id; renderTabs(); renderContent(); });
      tabContainer.addChild(tabBg);

      const tabLabel = new Text({
        text: tab.label,
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(9, layout), fill: isActive ? UI_COLORS.textGold : UI_COLORS.textMuted }),
      });
      tabLabel.anchor.set(0.5);
      tabLabel.x = tabX + (tabW - 4) / 2;
      tabLabel.y = tabY + 12;
      tabContainer.addChild(tabLabel);
    });
  }

  function renderContent(): void {
    contentContainer.removeChildren();
    if (activeTab === 'prof') renderProfessions();
    else if (activeTab === 'mats') renderMaterials();
    else if (activeTab === 'recipes') renderRecipes();
    else if (activeTab === 'enchant') renderEnchant();
    else renderDisenchant();
  }

  // ─── Professions Tab ──────────────────────────────────────────

  function renderProfessions(): void {
    const startY = tabY + 34;
    const rowH = 52;
    const allTypes: ProfessionType[] = ['mining', 'herbalism', 'woodcutting', 'skinning', 'enchanting'];

    allTypes.forEach((type, i) => {
      const state = mgr.professions.get(type)!;
      const iy = startY + i * rowH;
      const color = PROFESSION_COLORS[type];

      // Row background
      const rowBg = new Graphics();
      rowBg.roundRect(px + 10, iy, panelW - 20, rowH - 4, 6)
        .fill({ color: 0x111122, alpha: 0.6 })
        .stroke({ color, width: 1, alpha: 0.3 });
      contentContainer.addChild(rowBg);

      // Icon (small colored square)
      const icon = new Graphics();
      icon.roundRect(px + 18, iy + 10, 28, 28, 4)
        .fill({ color, alpha: 0.7 })
        .stroke({ color, width: 1.5, alpha: 0.9 });
      contentContainer.addChild(icon);

      const iconLabel = new Text({
        text: professionIcon(type),
        style: new TextStyle({ fontSize: fontSize(13, layout), fill: 0xffffff }),
      });
      iconLabel.anchor.set(0.5);
      iconLabel.x = px + 32;
      iconLabel.y = iy + 24;
      contentContainer.addChild(iconLabel);

      // Name
      const nameText = new Text({
        text: mgr.professionLabel(type),
        style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: fontSize(11, layout), fill: color, fontWeight: 'bold' }),
      });
      nameText.x = px + 54;
      nameText.y = iy + 6;
      contentContainer.addChild(nameText);

      // Level
      const lvlText = new Text({
        text: `Niveau ${state.level}`,
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(9, layout), fill: UI_COLORS.textSecondary }),
      });
      lvlText.x = px + 54;
      lvlText.y = iy + 22;
      contentContainer.addChild(lvlText);

      // XP bar
      const barX = px + 54;
      const barY = iy + 36;
      const barW = panelW - 80;
      const barH = 6;
      const xpNeeded = 50 * state.level * (1 + state.level * 0.15);
      const pct = Math.min(state.xp / xpNeeded, 1);

      const barBg = new Graphics();
      barBg.roundRect(barX, barY, barW, barH, 3).fill({ color: 0x222233, alpha: 0.8 });
      contentContainer.addChild(barBg);

      if (pct > 0) {
        const barFill = new Graphics();
        barFill.roundRect(barX, barY, barW * pct, barH, 3).fill({ color: UI_COLORS.xp, alpha: 0.9 });
        contentContainer.addChild(barFill);
      }
    });
  }

  // ─── Materials Tab ────────────────────────────────────────────

  function renderMaterials(): void {
    const startY = tabY + 34;
    const colW = Math.floor((panelW - 28) / 2);
    let col = 0;
    let row = 0;
    const rowH = 28;

    // Only show owned materials
    const owned = MATERIALS.filter(m => (mgr.inventory.get(m.id) ?? 0) > 0);

    if (owned.length === 0) {
      const emptyText = new Text({
        text: 'Aucun materiau recolte.\nUtilisez la recolte dans les zones !',
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(10, layout), fill: UI_COLORS.textMuted, align: 'center' }),
      });
      emptyText.anchor.set(0.5);
      emptyText.x = screenW / 2;
      emptyText.y = startY + 40;
      contentContainer.addChild(emptyText);
      return;
    }

    for (const mat of owned) {
      const count = mgr.inventory.get(mat.id) ?? 0;
      const ix = px + 14 + col * colW;
      const iy = startY + row * rowH;
      const rarityColor = RARITY_COLORS[mat.rarity] ?? 0xaaaaaa;

      // Material icon (small colored circle)
      const dot = new Graphics();
      dot.circle(ix + 8, iy + 10, 6)
        .fill({ color: rarityColor, alpha: 0.8 })
        .stroke({ color: rarityColor, width: 1, alpha: 0.5 });
      contentContainer.addChild(dot);

      // Name + count
      const matText = new Text({
        text: `${mat.name} x${count}`,
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(8, layout), fill: rarityColor }),
      });
      matText.x = ix + 18;
      matText.y = iy + 3;
      contentContainer.addChild(matText);

      col++;
      if (col >= 2) { col = 0; row++; }
    }
  }

  // ─── Recipes Tab ──────────────────────────────────────────────

  function renderRecipes(): void {
    const startY = tabY + 34;
    const itemH = 54;
    const available = mgr.getAvailableRecipes();
    const maxItems = Math.floor((panelH - 90) / itemH);

    if (available.length === 0) {
      const emptyText = new Text({
        text: 'Aucune recette disponible.\nAugmentez vos niveaux de profession !',
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(10, layout), fill: UI_COLORS.textMuted, align: 'center' }),
      });
      emptyText.anchor.set(0.5);
      emptyText.x = screenW / 2;
      emptyText.y = startY + 40;
      contentContainer.addChild(emptyText);
      return;
    }

    available.slice(0, maxItems).forEach((recipe, i) => {
      const iy = startY + i * itemH;
      const check = mgr.canCraft(recipe.id);
      const profColor = PROFESSION_COLORS[recipe.profession];

      // Row background
      const rowBg = new Graphics();
      rowBg.roundRect(px + 10, iy, panelW - 20, itemH - 4, 6)
        .fill({ color: 0x111122, alpha: 0.6 })
        .stroke({ color: profColor, width: 1, alpha: 0.3 });
      contentContainer.addChild(rowBg);

      // Recipe name
      const nameText = new Text({
        text: recipe.name,
        style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: fontSize(10, layout), fill: profColor, fontWeight: 'bold' }),
      });
      nameText.x = px + 18;
      nameText.y = iy + 4;
      contentContainer.addChild(nameText);

      // Materials needed
      const matList = recipe.materials.map(m => {
        const info = MATERIALS.find(x => x.id === m.materialID);
        const owned = mgr.inventory.get(m.materialID) ?? 0;
        return `${info?.name ?? m.materialID} ${owned}/${m.amount}`;
      }).join(' , ');

      const matText = new Text({
        text: matList,
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(7, layout), fill: UI_COLORS.textSecondary, wordWrap: true, wordWrapWidth: panelW - 100 }),
      });
      matText.x = px + 18;
      matText.y = iy + 19;
      contentContainer.addChild(matText);

      // Profession + level
      const reqText = new Text({
        text: `${mgr.professionLabel(recipe.profession)} Nv.${recipe.requiredLevel}`,
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(7, layout), fill: UI_COLORS.textMuted }),
      });
      reqText.x = px + 18;
      reqText.y = iy + 34;
      contentContainer.addChild(reqText);

      // Craft button
      const btnW = scaled(56, layout);
      const btnH = scaled(22, layout);
      const btnX = px + panelW - btnW - 16;
      const btnY = iy + 14;

      const craftBtn = new Graphics();
      craftBtn.roundRect(btnX, btnY, btnW, btnH, 4)
        .fill({ color: check.possible ? UI_COLORS.btnSuccess : UI_COLORS.btnDanger, alpha: UI_ALPHA.buttonBg })
        .stroke({ color: check.possible ? UI_COLORS.success : UI_COLORS.danger, width: 1, alpha: 0.6 });
      craftBtn.eventMode = 'static';
      craftBtn.cursor = check.possible ? 'pointer' : 'default';
      contentContainer.addChild(craftBtn);

      const craftLabel = new Text({
        text: 'Creer',
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(9, layout), fill: check.possible ? UI_COLORS.success : UI_COLORS.textMuted }),
      });
      craftLabel.anchor.set(0.5);
      craftLabel.x = btnX + btnW / 2;
      craftLabel.y = btnY + btnH / 2;
      contentContainer.addChild(craftLabel);

      if (check.possible) {
        craftBtn.on('pointerdown', () => {
          mgr.craft(recipe.id);
          mgr.save();
          renderContent();
        });
      }
    });
  }

  // ─── Enchant Tab (Apply enchantments to equipment) ──────────────

  let selectedEnchantID: string | null = null;

  function renderEnchant(): void {
    const startY = tabY + 34;
    const champ = GameManager.shared.champion;
    if (!champ) return;

    // Find enchantment items in inventory
    const enchantIDs = champ.inventoryItemIDs.filter(id => id.startsWith('enchant_'));
    const enchantCounts = new Map<string, number>();
    for (const id of enchantIDs) enchantCounts.set(id, (enchantCounts.get(id) ?? 0) + 1);

    if (enchantCounts.size === 0) {
      const emptyText = new Text({
        text: 'Aucun enchantement disponible.\nFabriquez-en via l\'onglet Recettes\n(profession Enchantement).',
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(10, layout), fill: UI_COLORS.textMuted, align: 'center' }),
      });
      emptyText.anchor.set(0.5);
      emptyText.x = screenW / 2;
      emptyText.y = startY + 50;
      contentContainer.addChild(emptyText);
      return;
    }

    // Section 1: Select an enchantment
    const sectionTitle = new Text({
      text: selectedEnchantID ? 'Enchantement sélectionné — Choisir un équipement :' : 'Choisir un enchantement :',
      style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: fontSize(10, layout), fill: UI_COLORS.textGold }),
    });
    sectionTitle.x = px + 14;
    sectionTitle.y = startY;
    contentContainer.addChild(sectionTitle);

    if (!selectedEnchantID) {
      // Show available enchantments
      const itemH = 38;
      let idx = 0;
      for (const [enchantID, count] of enchantCounts) {
        const iy = startY + 18 + idx * itemH;
        const recipe = RECIPES.find(r => r.result.itemID === enchantID);
        const enchName = recipe?.name ?? enchantID;
        const enchDesc = getEnchantDescription(enchantID);

        const rowBg = new Graphics();
        rowBg.roundRect(px + 10, iy, panelW - 20, itemH - 4, 6)
          .fill({ color: 0x111133, alpha: 0.6 })
          .stroke({ color: 0x7744cc, width: 1, alpha: 0.3 });
        rowBg.eventMode = 'static';
        rowBg.cursor = 'pointer';
        contentContainer.addChild(rowBg);

        const nameText = new Text({
          text: `${enchName}${count > 1 ? ` x${count}` : ''}`,
          style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: fontSize(9, layout), fill: 0xaa88ff, fontWeight: 'bold' }),
        });
        nameText.x = px + 18;
        nameText.y = iy + 4;
        contentContainer.addChild(nameText);

        const descText = new Text({
          text: enchDesc,
          style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(7, layout), fill: UI_COLORS.textSecondary }),
        });
        descText.x = px + 18;
        descText.y = iy + 18;
        contentContainer.addChild(descText);

        rowBg.on('pointerdown', () => {
          selectedEnchantID = enchantID;
          renderContent();
        });

        idx++;
      }
    } else {
      // Show equipped items to apply enchantment to
      const eq = champ.equipment;
      const slots: { slot: string; label: string; itemID: string | null }[] = [
        { slot: 'mainWeapon', label: 'Arme', itemID: eq.mainWeapon },
        { slot: 'offhand', label: 'Offhand', itemID: eq.offhand },
        { slot: 'helmet', label: 'Casque', itemID: eq.helmet },
        { slot: 'chest', label: 'Torse', itemID: eq.chest },
        { slot: 'shoulders', label: 'Épaules', itemID: eq.shoulders },
        { slot: 'gloves', label: 'Gants', itemID: eq.gloves },
        { slot: 'legs', label: 'Jambes', itemID: eq.legs },
        { slot: 'boots', label: 'Bottes', itemID: eq.boots },
        { slot: 'cape', label: 'Cape', itemID: eq.cape },
        { slot: 'belt', label: 'Ceinture', itemID: eq.belt },
        { slot: 'amulet', label: 'Amulette', itemID: eq.amulet },
        { slot: 'ring1', label: 'Anneau 1', itemID: eq.ring1 },
        { slot: 'ring2', label: 'Anneau 2', itemID: eq.ring2 },
      ];

      const equippedSlots = slots.filter(s => s.itemID);
      if (equippedSlots.length === 0) {
        const noEquip = new Text({
          text: 'Aucun équipement porté.\nÉquipez des objets d\'abord.',
          style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(10, layout), fill: UI_COLORS.textMuted, align: 'center' }),
        });
        noEquip.anchor.set(0.5);
        noEquip.x = screenW / 2;
        noEquip.y = startY + 50;
        contentContainer.addChild(noEquip);
      } else {
        const itemH = 36;
        equippedSlots.forEach((s, idx) => {
          const iy = startY + 18 + idx * itemH;
          const item = gameData.item(s.itemID!);
          const itemName = item?.name ?? s.itemID!;
          const rarityColor = item ? (RARITY_COLORS[item.rarity as string] ?? 0xaaaaaa) : 0xaaaaaa;

          const rowBg = new Graphics();
          rowBg.roundRect(px + 10, iy, panelW - 20, itemH - 4, 6)
            .fill({ color: 0x111122, alpha: 0.6 })
            .stroke({ color: rarityColor, width: 1, alpha: 0.3 });
          rowBg.eventMode = 'static';
          rowBg.cursor = 'pointer';
          contentContainer.addChild(rowBg);

          const slotLabel = new Text({
            text: `[${s.label}]`,
            style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(8, layout), fill: UI_COLORS.textMuted }),
          });
          slotLabel.x = px + 16;
          slotLabel.y = iy + 4;
          contentContainer.addChild(slotLabel);

          const nameText = new Text({
            text: itemName,
            style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: fontSize(9, layout), fill: rarityColor, fontWeight: 'bold' }),
          });
          nameText.x = px + 16 + slotLabel.width + 6;
          nameText.y = iy + 4;
          contentContainer.addChild(nameText);

          const enchDesc = getEnchantDescription(selectedEnchantID!);
          const previewText = new Text({
            text: `→ ${enchDesc}`,
            style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(7, layout), fill: 0x88ccff }),
          });
          previewText.x = px + 16;
          previewText.y = iy + 18;
          contentContainer.addChild(previewText);

          rowBg.on('pointerdown', () => {
            applyEnchantment(champ, selectedEnchantID!, s.itemID!);
            selectedEnchantID = null;
            renderContent();
          });
        });
      }

      // Back button
      const backBtn = new Graphics();
      const backY = startY + 18 + Math.max(equippedSlots.length, 1) * 36 + 8;
      backBtn.roundRect(px + panelW / 2 - 50, backY, 100, 24, 4)
        .fill({ color: UI_COLORS.btnSecondary, alpha: 0.8 })
        .stroke({ color: 0x666688, width: 1 });
      backBtn.eventMode = 'static';
      backBtn.cursor = 'pointer';
      backBtn.on('pointerdown', () => { selectedEnchantID = null; renderContent(); });
      contentContainer.addChild(backBtn);

      const backLabel = new Text({
        text: 'Retour',
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(9, layout), fill: UI_COLORS.textSecondary }),
      });
      backLabel.anchor.set(0.5);
      backLabel.x = px + panelW / 2;
      backLabel.y = backY + 12;
      contentContainer.addChild(backLabel);
    }
  }

  // ─── Disenchant Tab ─────────────────────────────────────────────

  function renderDisenchant(): void {
    const startY = tabY + 34;
    const champ = GameManager.shared.champion;
    if (!champ) return;

    // Get non-equipped inventory items
    const eq = champ.equipment;
    const equippedIDs = new Set([eq.mainWeapon, eq.offhand, eq.helmet, eq.chest, eq.shoulders, eq.gloves, eq.boots, eq.legs, eq.cape, eq.belt, eq.ring1, eq.ring2, eq.amulet].filter(Boolean));
    const items = champ.inventoryItemIDs.filter(id => !equippedIDs.has(id));

    // Deduplicate (show unique items with count)
    const itemCounts = new Map<string, number>();
    for (const id of items) itemCounts.set(id, (itemCounts.get(id) ?? 0) + 1);

    if (itemCounts.size === 0) {
      const emptyText = new Text({
        text: 'Aucun objet à désenchanter.\nLes objets équipés ne peuvent pas\nêtre désenchantés.',
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(10, layout), fill: UI_COLORS.textMuted, align: 'center' }),
      });
      emptyText.anchor.set(0.5);
      emptyText.x = screenW / 2;
      emptyText.y = startY + 50;
      contentContainer.addChild(emptyText);
      return;
    }

    const itemH = 42;
    const maxItems = Math.floor((panelH - 90) / itemH);
    let idx = 0;

    for (const [itemID, count] of itemCounts) {
      if (idx >= maxItems) break;
      const item = gameData.item(itemID);
      if (!item) continue;

      const iy = startY + idx * itemH;
      const rarityColor = RARITY_COLORS[item.rarity as string] ?? 0xaaaaaa;

      // Row
      const rowBg = new Graphics();
      rowBg.roundRect(px + 10, iy, panelW - 20, itemH - 4, 6)
        .fill({ color: 0x111122, alpha: 0.6 })
        .stroke({ color: rarityColor, width: 1, alpha: 0.3 });
      contentContainer.addChild(rowBg);

      // Item name + rarity
      const nameText = new Text({
        text: `${item.name}${count > 1 ? ` x${count}` : ''}`,
        style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: fontSize(10, layout), fill: rarityColor, fontWeight: 'bold' }),
      });
      nameText.x = px + 18;
      nameText.y = iy + 4;
      contentContainer.addChild(nameText);

      // Preview materials
      const rarity = item.rarity as string;
      const base = rarity === 'common' ? 1 : rarity === 'uncommon' ? 2 : rarity === 'rare' ? 3 : rarity === 'epic' ? 5 : rarity === 'legendary' ? 8 : 12;
      let preview = `→ ${base}x Poudre Arcane`;
      if (['rare', 'epic', 'legendary', 'cosmeric'].includes(rarity)) {
        const c = rarity === 'rare' ? 1 : rarity === 'epic' ? 2 : rarity === 'legendary' ? 3 : 5;
        preview += `, ${c}x Cristal`;
      }
      if (['epic', 'legendary', 'cosmeric'].includes(rarity)) {
        const s = rarity === 'epic' ? 1 : rarity === 'legendary' ? 2 : 4;
        preview += `, ${s}x Sable`;
      }

      const previewText = new Text({
        text: preview,
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(7, layout), fill: UI_COLORS.textSecondary }),
      });
      previewText.x = px + 18;
      previewText.y = iy + 20;
      contentContainer.addChild(previewText);

      // Disenchant button
      const btnW = scaled(68, layout);
      const btnH = scaled(22, layout);
      const btnX = px + panelW - btnW - 16;
      const btnY = iy + 10;

      const disBtn = new Graphics();
      disBtn.roundRect(btnX, btnY, btnW, btnH, 4)
        .fill({ color: 0x442244, alpha: 0.8 })
        .stroke({ color: 0x7744cc, width: 1, alpha: 0.6 });
      disBtn.eventMode = 'static';
      disBtn.cursor = 'pointer';
      contentContainer.addChild(disBtn);

      const disLabel = new Text({
        text: 'Désencht.',
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(8, layout), fill: 0xcc88ff }),
      });
      disLabel.anchor.set(0.5);
      disLabel.x = btnX + btnW / 2;
      disLabel.y = btnY + btnH / 2;
      contentContainer.addChild(disLabel);

      disBtn.on('pointerdown', () => {
        mgr.disenchant(itemID);
        mgr.save();
        renderContent();
      });

      idx++;
    }
  }

  // ─── Close Button ─────────────────────────────────────────────

  const closeBtn = new Graphics();
  closeBtn.roundRect(px + panelW - 28, py + 4, buttonHeight(layout), buttonHeight(layout) * 0.6, 4)
    .fill({ color: UI_COLORS.btnDanger, alpha: UI_ALPHA.buttonBg })
    .stroke({ color: UI_COLORS.danger, width: 1, alpha: 0.4 });
  closeBtn.eventMode = 'static';
  closeBtn.cursor = 'pointer';
  closeBtn.on('pointerdown', onClose);
  panel.addChild(closeBtn);

  const closeX = new Text({
    text: '\u2715',
    style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(11, layout), fill: UI_COLORS.danger }),
  });
  closeX.anchor.set(0.5);
  closeX.x = px + panelW - 17;
  closeX.y = py + 13;
  panel.addChild(closeX);

  // Initial render
  renderTabs();
  renderContent();

  uiContainer.addChild(panel);
  return panel;
}

// ─── Helpers ─────────────────────────────────────────────────────

function professionIcon(type: ProfessionType): string {
  switch (type) {
    case 'mining': return '\u26CF';
    case 'herbalism': return '\u2698';
    case 'woodcutting': return '\u2692';
    case 'skinning': return '\u2694';
    case 'enchanting': return '\u2728';
  }
}

// ─── Enchantment Data ───────────────────────────────────────────

interface EnchantmentBonus {
  stat: string;
  value: number;
  label: string;
}

const ENCHANTMENT_BONUSES: Record<string, EnchantmentBonus> = {
  enchant_protection: { stat: 'vigor', value: 3, label: 'Défense +3' },
  enchant_force: { stat: 'strength', value: 4, label: 'Force +4' },
  enchant_agilite: { stat: 'agility', value: 4, label: 'Agilité +4' },
  enchant_esprit: { stat: 'spirit', value: 4, label: 'Esprit +4' },
  enchant_investiture: { stat: 'spirit', value: 6, label: 'Esprit +6' },
  enchant_cosmos: { stat: 'strength', value: 5, label: 'Force +5, Esprit +5' },
  enchant_legendaire: { stat: 'strength', value: 8, label: 'Force +8, Agilité +4' },
  enchant_divin: { stat: 'strength', value: 6, label: 'Tous stats +6' },
};

function getEnchantDescription(enchantID: string): string {
  // Handle quality variants (e.g., enchant_force_q3)
  const baseID = enchantID.replace(/_q\d+$/, '');
  const bonus = ENCHANTMENT_BONUSES[baseID];
  return bonus?.label ?? 'Bonus inconnu';
}

function applyEnchantment(champ: import('../data/types').Champion, enchantID: string, targetItemID: string): void {
  // Remove one enchantment from inventory
  const idx = champ.inventoryItemIDs.indexOf(enchantID);
  if (idx === -1) return;
  champ.inventoryItemIDs.splice(idx, 1);

  // Get the target item and add stat bonuses
  const item = gameData.item(targetItemID);
  if (!item) return;

  const baseID = enchantID.replace(/_q\d+$/, '');
  const qualityMatch = enchantID.match(/_q(\d+)$/);
  const qualityBonus = qualityMatch ? parseInt(qualityMatch[1]) : 0;

  // Apply enchantment bonuses based on type
  if (baseID === 'enchant_cosmos') {
    const val = 5 + qualityBonus;
    addItemStat(item, 'strength', val);
    addItemStat(item, 'spirit', val);
  } else if (baseID === 'enchant_legendaire') {
    addItemStat(item, 'strength', 8 + qualityBonus);
    addItemStat(item, 'agility', 4 + qualityBonus);
  } else if (baseID === 'enchant_divin') {
    const val = 6 + qualityBonus;
    addItemStat(item, 'strength', val);
    addItemStat(item, 'agility', val);
    addItemStat(item, 'spirit', val);
    addItemStat(item, 'vigor', val);
  } else {
    const bonus = ENCHANTMENT_BONUSES[baseID];
    if (bonus) {
      addItemStat(item, bonus.stat, bonus.value + qualityBonus);
    }
  }

  // Mark item name as enchanted (if not already)
  if (!item.name.includes('(E)')) {
    item.name = `${item.name} (E)`;
  }

  // Persist modifications
  const appliedBonuses = item.statBonuses.map(b => ({ stat: b.stat, value: b.value }));
  ItemModStore.shared.recordEnchant(targetItemID, appliedBonuses);

  // Grant enchanting XP
  ProfessionManager.shared.addEnchantingXP(20 + qualityBonus * 5);
  ProfessionManager.shared.save();
  GameManager.shared.save();
}

function addItemStat(item: import('../data/types').Item, stat: string, value: number): void {
  const existing = item.statBonuses.find(b => b.stat === stat);
  if (existing) {
    existing.value += value;
  } else {
    item.statBonuses.push({ stat, value });
  }
}
