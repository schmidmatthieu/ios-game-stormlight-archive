// ─── Zone Setup — UI initialization helpers for ZoneScene.onEnter ──
// Extracted from ZoneScene for modularity.

import { Container } from 'pixi.js';
import { GameManager } from '../../game/GameManager';
import { gameData } from '../../data/DataLoader';
import { MusicManager } from '../../game/MusicSystem';
import { AchievementManager } from '../../game/AchievementSystem';
import { BestiaryManager } from '../../game/BestiarySystem';
import { CompanionManager } from '../../game/CompanionSystem';
import { QuestManager } from '../../game/QuestManager';
import { TutorialManager } from '../../ui/TutorialSystem';
import { SaveManager } from '../../game/SaveManager';
import { PotionManager } from '../../game/PotionSystem';
import { ComboManager } from '../../game/ComboSystem';
import { createComboDisplay } from '../../game/ComboSystem';
import { FloatingDamageManager } from '../../rendering/FloatingDamage';
import { createMusicIndicator } from '../../ui/MusicIndicator';
import { createWorldEventBanner } from '../../ui/WorldEventBanner';
import { createPotionHotbar } from '../../ui/PotionHotbar';
import { createAchievementToast } from '../../ui/AchievementUI';
import { QuestTracker } from '../../ui/QuestTracker';
import { Minimap } from '../../ui/Minimap';
import { createWorldMechanics } from '../../game/WorldMechanics';
import { DayNightManager, createDayNightOverlay } from '../../rendering/DayNightCycle';
import { WeatherManager, createWeatherOverlay } from '../../rendering/WeatherSystem';
import { AmbientAtmosphereManager } from '../../rendering/AmbientAtmosphere';
import type { WorldEffect } from '../../game/WorldMechanics';
import type { BlendedTimeConfig } from '../../rendering/DayNightCycle';
import type { Zone } from '../../data/types';

// ─── Result Interface ───────────────────────────────────────────

export interface ZoneSystemsResult {
  comboDisplay: { update: () => void } | null;
  floatingDmg: FloatingDamageManager;
  musicIndicator: { update: (dt: number) => void } | null;
  eventBanner: { update: (dt: number) => void } | null;
  achievementToast: { update: (dt: number) => void } | null;
  questTracker: QuestTracker;
  minimap: Minimap;
  worldMechanics: WorldEffect;
  dayNightManager: DayNightManager;
  dayNightOverlay: { overlay: any; stars: Container; timeLabel: any; update: (config: BlendedTimeConfig) => void } | null;
  weatherManager: WeatherManager;
  weatherOverlay: { overlay: any; label: any; update: (config: any, lightning: number) => void } | null;
  ambientAtmosphere: AmbientAtmosphereManager | null;
  potionHotbar: { container: Container; refresh: () => void } | null;
}

// ─── Initialize Game Systems ────────────────────────────────────

export function initGameSystems(
  zone: Zone,
  worldContainer: Container,
  uiContainer: Container,
  w: number, h: number,
  onUsePotion: (idx: number) => void,
): ZoneSystemsResult {
  // Companion
  CompanionManager.shared.checkWorldUnlocks(zone.worldID);

  // Combo display
  const comboDisplay = createComboDisplay(uiContainer, w, h);
  ComboManager.shared.reset();

  // Floating damage
  const floatingDmg = new FloatingDamageManager(worldContainer);

  // Music
  MusicManager.shared.setWorld(zone.worldID);
  MusicManager.shared.setWeather(zone.weatherEffect ?? 'none');
  const musicIndicator = createMusicIndicator(uiContainer, w, h);

  // World events
  const eventBanner = createWorldEventBanner(uiContainer, w);

  // Tutorial
  if (!TutorialManager.shared.isComplete()) {
    TutorialManager.shared.startTutorial(uiContainer, w, h);
  }

  // Auto-save
  SaveManager.shared.autoSave();

  // World mechanics
  const worldMechanics = createWorldMechanics(zone.worldID);

  // Day/night
  const dayNightManager = new DayNightManager(zone.worldID);
  const dayNightOverlay = createDayNightOverlay(uiContainer, w, h);

  // Weather
  const weatherManager = new WeatherManager(zone.worldID);
  const weatherOverlay = createWeatherOverlay(uiContainer, w, h);

  // Ambient atmosphere
  const ambientAtmosphere = new AmbientAtmosphereManager(worldContainer, zone.worldID, w, h);

  // Potion hotbar
  PotionManager.shared.load();
  if (!PotionManager.shared.slots[0] && !PotionManager.shared.slots[1] && !PotionManager.shared.slots[2]) {
    PotionManager.shared.addPotion('potion_heal_small', 5);
    PotionManager.shared.addPotion('potion_investiture', 3);
    PotionManager.shared.addPotion('potion_strength', 2);
  }
  const potionHotbar = createPotionHotbar(uiContainer, w, h, { onUsePotion });

  // Achievements
  const achievementToast = createAchievementToast(uiContainer, w);
  AchievementManager.shared.recordZoneVisit(zone.id, zone.worldID);
  AchievementManager.shared.recordLevel(GameManager.shared.champion?.level ?? 1);
  AchievementManager.shared.recordCreatureDiscovered(BestiaryManager.shared.totalDiscovered);
  AchievementManager.shared.check();

  // Quests
  QuestManager.shared.init();
  QuestManager.shared.onZoneEntered(zone.id);

  // Quest tracker
  const questTracker = new QuestTracker(w, h);
  questTracker.refresh();
  uiContainer.addChild(questTracker);

  // Minimap
  const minimap = new Minimap(w, h);
  minimap.setZone(zone.gridWidth, zone.gridHeight, zone.worldID, zone.id);
  uiContainer.addChild(minimap);

  return {
    comboDisplay, floatingDmg, musicIndicator, eventBanner, achievementToast,
    questTracker, minimap, worldMechanics, dayNightManager, dayNightOverlay,
    weatherManager, weatherOverlay, ambientAtmosphere, potionHotbar,
  };
}
