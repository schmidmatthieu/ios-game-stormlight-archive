// ─── Zone UI Panel Toggles ──────────────────────────────────────
// Extracted from ZoneScene.ts — all panel toggle methods.

import { Container } from 'pixi.js';
import { InventoryPanel } from '../../ui/InventoryPanel';
import { showDialoguePanel, showShopPanel } from '../../ui/DialoguePanel';
import { showCraftingPanel, getRecipeEffect } from '../../ui/CraftingPanel';
import { showPauseMenu } from '../../ui/PauseMenu';
import { showQuestJournal } from '../../ui/QuestJournal';
import { showBestiaryPanel } from '../../ui/BestiaryPanel';
import { showAchievementPanel } from '../../ui/AchievementUI';
import { showSkillTreePanel } from '../../ui/SkillTreePanel';
import { showTalentTreePanel } from '../../ui/TalentTreePanel';
import { showCompanionPanel } from '../../ui/CompanionPanel';
import { showProfessionPanel } from '../../ui/ProfessionPanel';
import { MusicManager } from '../../game/MusicSystem';
import { GameManager } from '../../game/GameManager';
import { BestiaryManager } from '../../game/BestiarySystem';
import { AchievementManager } from '../../game/AchievementSystem';
import { CompanionManager } from '../../game/CompanionSystem';
import { NPCRelationshipManager } from '../../game/NPCRelationships';
import { WorldMapScene } from '../WorldMapScene';
import type { SceneRouter } from '../../game/SceneRouter';
import type { StatusEffectManager } from '../../game/StatusEffects';

export interface PanelHost {
  dialoguePanel: Container | null;
  isPaused: boolean;
  uiContainer: Container;
  screenWidth: number;
  screenHeight: number;
  worldID: string;
  closeDialogue: () => void;
  showFloatingText: (x: number, y: number, msg: string, color: number) => void;
  playerScreenPos: { x: number; y: number };
  router: SceneRouter;
  playerStatusEffects: StatusEffectManager;
  onCompanionToggleClosed: () => void;
}

export function toggleInventory(host: PanelHost): void {
  if (host.dialoguePanel) return;
  MusicManager.shared.playSFX('open_menu');
  host.isPaused = true;
  host.dialoguePanel = new InventoryPanel(
    host.screenWidth, host.screenHeight,
    () => host.closeDialogue(),
  );
  host.uiContainer.addChild(host.dialoguePanel);
}

export function toggleProfessions(host: PanelHost): void {
  if (host.dialoguePanel) return;
  MusicManager.shared.playSFX('open_menu');
  host.isPaused = true;
  host.dialoguePanel = showProfessionPanel(
    host.uiContainer, host.screenWidth, host.screenHeight,
    () => host.closeDialogue(),
  );
}

export function toggleCrafting(host: PanelHost, applyCraftResult: (recipeID: string) => void): void {
  if (host.dialoguePanel) return;
  MusicManager.shared.playSFX('open_menu');
  host.isPaused = true;
  host.dialoguePanel = showCraftingPanel(
    host.uiContainer, host.screenWidth, host.screenHeight,
    host.worldID,
    () => host.closeDialogue(),
    applyCraftResult,
  );
}

export function toggleBestiary(host: PanelHost): void {
  if (host.dialoguePanel) return;
  MusicManager.shared.playSFX('open_menu');
  host.isPaused = true;
  host.dialoguePanel = showBestiaryPanel(
    host.uiContainer, host.screenWidth, host.screenHeight,
    () => host.closeDialogue(),
  );
}

export function toggleAchievements(host: PanelHost): void {
  if (host.dialoguePanel) return;
  MusicManager.shared.playSFX('open_menu');
  host.isPaused = true;
  host.dialoguePanel = showAchievementPanel(
    host.uiContainer, host.screenWidth, host.screenHeight,
    () => host.closeDialogue(),
  );
}

export function toggleSkillTree(host: PanelHost): void {
  if (host.dialoguePanel) return;
  MusicManager.shared.playSFX('open_menu');
  host.isPaused = true;
  host.dialoguePanel = showSkillTreePanel(
    host.uiContainer, host.screenWidth, host.screenHeight,
    () => host.closeDialogue(),
  );
}

export function toggleTalentTree(host: PanelHost): void {
  if (host.dialoguePanel) return;
  MusicManager.shared.playSFX('open_menu');
  host.isPaused = true;
  host.dialoguePanel = showTalentTreePanel(
    host.uiContainer, host.screenWidth, host.screenHeight,
    () => host.closeDialogue(),
  );
}

export function toggleCompanion(host: PanelHost): void {
  if (host.dialoguePanel) return;
  MusicManager.shared.playSFX('open_menu');
  host.isPaused = true;
  host.dialoguePanel = showCompanionPanel(
    host.uiContainer, host.screenWidth, host.screenHeight,
    () => { host.closeDialogue(); host.onCompanionToggleClosed(); },
  );
}

export function toggleQuestJournal(host: PanelHost): void {
  if (host.dialoguePanel) return;
  MusicManager.shared.playSFX('open_menu');
  host.isPaused = true;
  host.dialoguePanel = showQuestJournal(
    host.uiContainer, host.screenWidth, host.screenHeight,
    () => host.closeDialogue(),
  );
}

export function togglePause(host: PanelHost, pauseMenu: Container | null, onResumed: () => void): Container | null {
  if (pauseMenu) {
    pauseMenu.destroy({ children: true });
    host.isPaused = false;
    return null;
  }
  host.isPaused = true;
  return showPauseMenu(
    host.uiContainer, host.screenWidth, host.screenHeight,
    () => { onResumed(); },
    (x, y, msg, color) => host.showFloatingText(x, y, msg, color),
    host.playerScreenPos,
    () => {
      GameManager.shared.save();
      BestiaryManager.shared.save();
      AchievementManager.shared.save();
      CompanionManager.shared.save();
      NPCRelationshipManager.shared.save();
      host.router.goto(WorldMapScene);
    },
  );
}

// ─── Craft Result Application ──────────────────────────────────

export function applyCraftResult(
  recipeID: string,
  statusEffects: StatusEffectManager,
  showFloatingText: (x: number, y: number, msg: string, color: number) => void,
  playerPos: { x: number; y: number },
): void {
  const effect = getRecipeEffect(recipeID);
  if (!effect) return;
  const champ = GameManager.shared.champion;
  if (!champ) return;

  switch (effect.type) {
    case 'heal_hp':
      champ.currentHP = Math.min(GameManager.shared.maxHP, champ.currentHP + effect.value);
      break;
    case 'heal_inv':
      champ.currentInvestiture = Math.min(GameManager.shared.maxInvestiture, champ.currentInvestiture + effect.value);
      break;
    case 'buff_strength':
      statusEffects.apply('strengthened', effect.duration, effect.value);
      break;
    case 'buff_shield':
      statusEffects.apply('shielded', effect.duration, effect.value);
      break;
    case 'buff_haste':
      statusEffects.apply('haste', effect.duration, effect.value);
      break;
    case 'buff_regen':
      statusEffects.apply('regenerating', effect.duration, effect.value);
      break;
    case 'multi_buff':
      if (effect.value === 1) {
        statusEffects.apply('shielded', effect.duration, 1);
        statusEffects.apply('haste', effect.duration, 1);
      } else if (effect.value === 2) {
        statusEffects.apply('strengthened', effect.duration, 1);
        statusEffects.apply('regenerating', effect.duration, 3);
      } else if (effect.value === 3) {
        statusEffects.apply('regenerating', effect.duration, 4);
        statusEffects.apply('haste', effect.duration, 1);
      } else if (effect.value === 4) {
        statusEffects.apply('strengthened', effect.duration, 1);
        statusEffects.apply('haste', effect.duration, 1);
      }
      break;
  }

  showFloatingText(playerPos.x, playerPos.y - 40, effect.message, 0x66cc88);
}
