import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { GameManager } from '../game/GameManager';
import { gameData } from '../data/DataLoader';
import { RARITY_COLORS } from '../data/types';
import { getLayoutInfo, fontSize, panelRadius, buttonHeight, UI_COLORS, UI_ALPHA } from '../ui/ResponsiveLayout';
import type { LayoutInfo } from '../ui/ResponsiveLayout';
import type { ItemRarity } from '../data/types';

// ─── Crafting Recipes ────────────────────────────────────────────

interface CraftingRecipe {
  id: string;
  name: string;
  description: string;
  resultItemID: string | null; // null = consumable/buff
  resultName: string;
  resultRarity: ItemRarity;
  ingredients: { type: 'gold' | 'item_rarity' | 'item_id'; value: string | number; count: number }[];
  goldCost: number;
  requiredLevel: number;
  category: 'weapon' | 'armor' | 'consumable' | 'enchant';
  worldID: string | null; // null = available everywhere
}

const RECIPES: CraftingRecipe[] = [
  // ─── Consumables ───
  {
    id: 'potion_hp', name: 'Potion de Vie', description: 'Restaure 50 PV',
    resultItemID: null, resultName: 'Potion de Vie', resultRarity: 'common',
    ingredients: [{ type: 'gold', value: 0, count: 0 }],
    goldCost: 25, requiredLevel: 1, category: 'consumable', worldID: null,
  },
  {
    id: 'potion_inv', name: 'Fiole d\'Investiture', description: 'Restaure 40 Investiture',
    resultItemID: null, resultName: 'Fiole d\'Investiture', resultRarity: 'common',
    ingredients: [{ type: 'gold', value: 0, count: 0 }],
    goldCost: 30, requiredLevel: 1, category: 'consumable', worldID: null,
  },
  {
    id: 'elixir_strength', name: 'Élixir de Force', description: '+50% dégâts pendant 30s',
    resultItemID: null, resultName: 'Élixir de Force', resultRarity: 'uncommon',
    ingredients: [{ type: 'gold', value: 0, count: 0 }],
    goldCost: 60, requiredLevel: 3, category: 'consumable', worldID: null,
  },
  {
    id: 'elixir_shield', name: 'Élixir de Protection', description: 'Bouclier pendant 25s',
    resultItemID: null, resultName: 'Élixir de Protection', resultRarity: 'uncommon',
    ingredients: [{ type: 'gold', value: 0, count: 0 }],
    goldCost: 50, requiredLevel: 3, category: 'consumable', worldID: null,
  },
  {
    id: 'elixir_haste', name: 'Élixir de Vitesse', description: '+40% vitesse pendant 20s',
    resultItemID: null, resultName: 'Élixir de Vitesse', resultRarity: 'uncommon',
    ingredients: [{ type: 'gold', value: 0, count: 0 }],
    goldCost: 45, requiredLevel: 2, category: 'consumable', worldID: null,
  },
  {
    id: 'elixir_regen', name: 'Baume Régénérant', description: 'Régénération pendant 30s',
    resultItemID: null, resultName: 'Baume Régénérant', resultRarity: 'rare',
    ingredients: [{ type: 'gold', value: 0, count: 0 }],
    goldCost: 80, requiredLevel: 4, category: 'consumable', worldID: null,
  },

  // ─── Enchantments (world-specific) ───
  {
    id: 'enchant_mist', name: 'Enchantement des Brumes', description: 'Bouclier + Hâte (Scadrial)',
    resultItemID: null, resultName: 'Enchantement des Brumes', resultRarity: 'rare',
    ingredients: [{ type: 'gold', value: 0, count: 0 }],
    goldCost: 120, requiredLevel: 5, category: 'enchant', worldID: 'scadrial',
  },
  {
    id: 'enchant_storm', name: 'Bénédiction d\'Orage', description: 'Force + Régén (Roshar)',
    resultItemID: null, resultName: 'Bénédiction d\'Orage', resultRarity: 'rare',
    ingredients: [{ type: 'gold', value: 0, count: 0 }],
    goldCost: 120, requiredLevel: 5, category: 'enchant', worldID: 'roshar',
  },
  {
    id: 'enchant_breath', name: 'Souffle Éveillé', description: 'Régén + Hâte (Nalthis)',
    resultItemID: null, resultName: 'Souffle Éveillé', resultRarity: 'rare',
    ingredients: [{ type: 'gold', value: 0, count: 0 }],
    goldCost: 120, requiredLevel: 5, category: 'enchant', worldID: 'nalthis',
  },
  {
    id: 'enchant_sand', name: 'Énergie Solaire', description: 'Force + Hâte (Taldain)',
    resultItemID: null, resultName: 'Énergie Solaire', resultRarity: 'rare',
    ingredients: [{ type: 'gold', value: 0, count: 0 }],
    goldCost: 120, requiredLevel: 5, category: 'enchant', worldID: 'taldain',
  },
];

// ─── Crafting Result Callbacks ───────────────────────────────────

export type CraftCallback = (recipeID: string) => void;

// ─── Crafting Panel UI ───────────────────────────────────────────

export function showCraftingPanel(
  uiContainer: Container,
  screenW: number, screenH: number,
  worldID: string,
  onClose: () => void,
  onCraft: CraftCallback,
): Container {
  const champ = GameManager.shared.champion;
  if (!champ) return new Container();

  const panel = new Container();
  panel.zIndex = 10000;
  const layout = getLayoutInfo(screenW, screenH);

  // Overlay
  const overlay = new Graphics();
  overlay.rect(0, 0, screenW, screenH).fill({ color: UI_COLORS.overlayDark, alpha: UI_ALPHA.overlay });
  overlay.eventMode = 'static';
  overlay.on('pointerdown', onClose);
  panel.addChild(overlay);

  const panelW = Math.min(300, screenW - 20);
  const panelH = Math.min(380, screenH - 40);
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
    text: 'Atelier d\'Artisanat',
    style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: fontSize(15, layout), fill: UI_COLORS.textGold, fontWeight: 'bold' }),
  });
  title.anchor.set(0.5);
  title.x = screenW / 2;
  title.y = py + 16;
  panel.addChild(title);

  // Gold display
  const goldText = new Text({
    text: `${champ.gold} or`,
    style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(11, layout), fill: UI_COLORS.textGoldBright, fontWeight: 'bold' }),
  });
  goldText.anchor.set(1, 0);
  goldText.x = px + panelW - 12;
  goldText.y = py + 10;
  panel.addChild(goldText);

  // Category tabs
  const categories: { label: string; cat: string }[] = [
    { label: 'Potions', cat: 'consumable' },
    { label: 'Enchant.', cat: 'enchant' },
  ];

  let activeTab = 'consumable';
  const contentContainer = new Container();
  panel.addChild(contentContainer);

  const tabY = py + 34;
  const tabContainer = new Container();
  panel.addChild(tabContainer);

  function renderTabs(): void {
    tabContainer.removeChildren();
    categories.forEach((cat, i) => {
      const tabW = (panelW - 24) / categories.length;
      const tabX = px + 12 + i * tabW;
      const isActive = activeTab === cat.cat;

      const tab = new Graphics();
      tab.roundRect(tabX, tabY, tabW - 2, 22, 4)
        .fill({ color: isActive ? UI_COLORS.btnSecondary : UI_COLORS.panelBgAlt, alpha: UI_ALPHA.barBg })
        .stroke({ color: isActive ? UI_COLORS.textGold : 0x443355, width: 1, alpha: UI_ALPHA.panelBorder });
      tab.eventMode = 'static';
      tab.cursor = 'pointer';
      tab.on('pointerdown', () => { activeTab = cat.cat; renderTabs(); renderRecipes(); });
      tabContainer.addChild(tab);

      const tabLabel = new Text({
        text: cat.label,
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(9, layout), fill: isActive ? UI_COLORS.textGold : UI_COLORS.textMuted }),
      });
      tabLabel.anchor.set(0.5);
      tabLabel.x = tabX + tabW / 2 - 1;
      tabLabel.y = tabY + 11;
      tabContainer.addChild(tabLabel);
    });
  }

  function renderRecipes(): void {
    contentContainer.removeChildren();

    const available = RECIPES.filter(r =>
      r.category === activeTab &&
      r.requiredLevel <= champ!.level &&
      (r.worldID === null || r.worldID === worldID),
    );

    const listY = tabY + 28;
    const itemH = 52;
    const maxItems = Math.floor((panelH - 80) / itemH);

    available.slice(0, maxItems).forEach((recipe, i) => {
      const iy = listY + i * itemH;
      const canAfford = champ!.gold >= recipe.goldCost;
      const rarityColor = RARITY_COLORS[recipe.resultRarity];

      // Item row bg
      const rowBg = new Graphics();
      rowBg.roundRect(px + 10, iy, panelW - 20, itemH - 4, 6)
        .fill({ color: 0x111122, alpha: 0.6 })
        .stroke({ color: rarityColor, width: 1, alpha: 0.3 });
      contentContainer.addChild(rowBg);

      // Recipe name
      const nameText = new Text({
        text: recipe.name,
        style: new TextStyle({ fontFamily: 'Georgia, serif', fontSize: fontSize(11, layout), fill: rarityColor, fontWeight: 'bold' }),
      });
      nameText.x = px + 18;
      nameText.y = iy + 4;
      contentContainer.addChild(nameText);

      // Description
      const descText = new Text({
        text: recipe.description,
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(8, layout), fill: UI_COLORS.textSecondary, wordWrap: true, wordWrapWidth: panelW - 100 }),
      });
      descText.x = px + 18;
      descText.y = iy + 18;
      contentContainer.addChild(descText);

      // Cost
      const costText = new Text({
        text: `${recipe.goldCost} or`,
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(9, layout), fill: canAfford ? UI_COLORS.textGoldBright : UI_COLORS.danger }),
      });
      costText.x = px + 18;
      costText.y = iy + 32;
      contentContainer.addChild(costText);

      // Craft button
      const btnW = 60;
      const btnH = 22;
      const btnX = px + panelW - btnW - 16;
      const btnY = iy + 14;

      const craftBtn = new Graphics();
      craftBtn.roundRect(btnX, btnY, btnW, btnH, 4)
        .fill({ color: canAfford ? UI_COLORS.btnSuccess : UI_COLORS.btnDanger, alpha: UI_ALPHA.buttonBg })
        .stroke({ color: canAfford ? UI_COLORS.success : UI_COLORS.danger, width: 1, alpha: 0.6 });
      craftBtn.eventMode = 'static';
      craftBtn.cursor = canAfford ? 'pointer' : 'default';
      contentContainer.addChild(craftBtn);

      const craftLabel = new Text({
        text: 'Créer',
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(10, layout), fill: canAfford ? UI_COLORS.success : UI_COLORS.textMuted }),
      });
      craftLabel.anchor.set(0.5);
      craftLabel.x = btnX + btnW / 2;
      craftLabel.y = btnY + btnH / 2;
      contentContainer.addChild(craftLabel);

      if (canAfford) {
        craftBtn.on('pointerdown', () => {
          champ!.gold -= recipe.goldCost;
          onCraft(recipe.id);
          goldText.text = `${champ!.gold} or`;
          renderRecipes(); // Refresh affordability
        });
      }
    });

    if (available.length === 0) {
      const emptyText = new Text({
        text: activeTab === 'enchant'
          ? 'Aucun enchantement disponible\npour ce monde.'
          : 'Aucune recette disponible\nà votre niveau.',
        style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(10, layout), fill: UI_COLORS.textMuted, align: 'center' }),
      });
      emptyText.anchor.set(0.5);
      emptyText.x = screenW / 2;
      emptyText.y = listY + 40;
      contentContainer.addChild(emptyText);
    }
  }

  // Close button
  const closeBtn = new Graphics();
  closeBtn.roundRect(px + panelW - 28, py + 4, buttonHeight(layout), buttonHeight(layout) * 0.6, 4)
    .fill({ color: UI_COLORS.btnDanger, alpha: UI_ALPHA.buttonBg })
    .stroke({ color: UI_COLORS.danger, width: 1, alpha: 0.4 });
  closeBtn.eventMode = 'static';
  closeBtn.cursor = 'pointer';
  closeBtn.on('pointerdown', onClose);
  panel.addChild(closeBtn);

  const closeX = new Text({
    text: '✕',
    style: new TextStyle({ fontFamily: 'sans-serif', fontSize: fontSize(11, layout), fill: UI_COLORS.danger }),
  });
  closeX.anchor.set(0.5);
  closeX.x = px + panelW - 17;
  closeX.y = py + 13;
  panel.addChild(closeX);

  renderTabs();
  renderRecipes();

  uiContainer.addChild(panel);
  return panel;
}

// ─── Recipe Effect Resolver ──────────────────────────────────────

export function getRecipeEffect(recipeID: string): {
  type: 'heal_hp' | 'heal_inv' | 'buff_strength' | 'buff_shield' | 'buff_haste' | 'buff_regen' | 'multi_buff';
  value: number;
  duration: number;
  message: string;
} | null {
  switch (recipeID) {
    case 'potion_hp': return { type: 'heal_hp', value: 50, duration: 0, message: '+50 PV!' };
    case 'potion_inv': return { type: 'heal_inv', value: 40, duration: 0, message: '+40 Investiture!' };
    case 'elixir_strength': return { type: 'buff_strength', value: 1, duration: 30, message: 'Force augmentée!' };
    case 'elixir_shield': return { type: 'buff_shield', value: 1, duration: 25, message: 'Bouclier activé!' };
    case 'elixir_haste': return { type: 'buff_haste', value: 1, duration: 20, message: 'Vitesse augmentée!' };
    case 'elixir_regen': return { type: 'buff_regen', value: 4, duration: 30, message: 'Régénération active!' };
    case 'enchant_mist': return { type: 'multi_buff', value: 1, duration: 40, message: 'Enchantement des Brumes!' };
    case 'enchant_storm': return { type: 'multi_buff', value: 2, duration: 40, message: 'Bénédiction d\'Orage!' };
    case 'enchant_breath': return { type: 'multi_buff', value: 3, duration: 40, message: 'Souffle Éveillé!' };
    case 'enchant_sand': return { type: 'multi_buff', value: 4, duration: 40, message: 'Énergie Solaire!' };
    default: return null;
  }
}
