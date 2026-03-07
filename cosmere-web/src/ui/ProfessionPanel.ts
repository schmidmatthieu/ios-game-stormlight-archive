// ─── Profession Panel — UI for gathering professions & crafting ──────

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { getLayoutInfo, fontSize, scaled, panelSize, panelRadius, buttonHeight, UI_COLORS, UI_ALPHA } from '../ui/ResponsiveLayout';
import { ProfessionManager, MATERIALS, RECIPES } from '../game/ProfessionSystem';
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

  // Tabs: Professions | Materiaux | Recettes
  const tabs = [
    { label: 'Professions', id: 'prof' },
    { label: 'Materiaux', id: 'mats' },
    { label: 'Recettes', id: 'recipes' },
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
    else renderRecipes();
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
