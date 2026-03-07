// ─── NPC Animator — smooth movement & activity indicators ────────

import { Graphics, Text, TextStyle } from 'pixi.js';
import { isoToScreen } from '../scenes/IsoUtils';
import { ACTIVITY_VISUALS, NPCScheduleManager } from '../game/NPCScheduleSystem';
import type { NPCActivity } from '../game/NPCScheduleSystem';
import type { GridPosition } from '../data/types';
import type { NPCInstance } from '../scenes/ZoneTypes';

// ─── Movement State ──────────────────────────────────────────────

interface NPCMoveState {
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  progress: number;   // 0-1
  speed: number;       // progress per second
  moving: boolean;
}

interface NPCActivityIndicator {
  icon: Graphics;
  timer: number;
}

const moveStates = new Map<string, NPCMoveState>();
const activityIndicators = new Map<string, NPCActivityIndicator>();

// ─── Public API ──────────────────────────────────────────────────

/** Start moving an NPC to a new grid position */
export function moveNPCTo(npc: NPCInstance, target: GridPosition): void {
  const targetScreen = isoToScreen(target.col, target.row);

  moveStates.set(npc.id, {
    startX: npc.position.x,
    startY: npc.position.y,
    targetX: targetScreen.x,
    targetY: targetScreen.y,
    progress: 0,
    speed: 0.4, // takes ~2.5s to move
    moving: true,
  });
}

/** Teleport NPC instantly (for initialization) */
export function teleportNPC(npc: NPCInstance, target: GridPosition): void {
  const targetScreen = isoToScreen(target.col, target.row);
  npc.position.x = targetScreen.x;
  npc.position.y = targetScreen.y;
  npc.sprite.x = targetScreen.x;
  npc.sprite.y = targetScreen.y;
  npc.sprite.zIndex = targetScreen.y;
  moveStates.delete(npc.id);
}

/** Update NPC animation (call each frame) */
export function updateNPCAnimation(npc: NPCInstance, dt: number): void {
  const state = moveStates.get(npc.id);

  if (state && state.moving) {
    state.progress = Math.min(1, state.progress + dt * state.speed);
    const t = easeInOutQuad(state.progress);

    npc.position.x = state.startX + (state.targetX - state.startX) * t;
    npc.position.y = state.startY + (state.targetY - state.startY) * t;
    npc.sprite.x = npc.position.x;
    npc.sprite.y = npc.position.y;
    npc.sprite.zIndex = npc.position.y;

    if (state.progress >= 1) {
      state.moving = false;
    }
  }

  // Activity indicator bob animation
  const indicator = activityIndicators.get(npc.id);
  if (indicator) {
    const activity = NPCScheduleManager.shared.getCurrentActivity(npc.id);
    const visual = ACTIVITY_VISUALS[activity];
    indicator.timer += dt * visual.bobSpeed;
    indicator.icon.y = -50 + Math.sin(indicator.timer * 2) * 2;
    indicator.icon.alpha = activity === 'sleeping' ? 0.4 + Math.sin(indicator.timer) * 0.2 : 0.7;
  }
}

/** Show activity indicator above NPC */
export function showActivityIndicator(npc: NPCInstance, activity: NPCActivity): void {
  // Remove existing indicator
  hideActivityIndicator(npc);

  const visual = ACTIVITY_VISUALS[activity];

  const icon = new Graphics();
  // Activity dot
  icon.circle(0, 0, 5).fill({ color: visual.color, alpha: 0.6 });

  // Activity icon text
  const iconText = new Text({
    text: visual.icon,
    style: new TextStyle({ fontSize: 8 }),
  });
  iconText.anchor.set(0.5);
  icon.addChild(iconText);

  icon.y = -50;
  npc.sprite.addChild(icon);

  activityIndicators.set(npc.id, { icon, timer: Math.random() * Math.PI * 2 });
}

/** Remove activity indicator */
export function hideActivityIndicator(npc: NPCInstance): void {
  const existing = activityIndicators.get(npc.id);
  if (existing) {
    npc.sprite.removeChild(existing.icon);
    existing.icon.destroy({ children: true });
    activityIndicators.delete(npc.id);
  }
}

/** Fade NPC for sleeping (dim sprite) */
export function setNPCSleeping(npc: NPCInstance, sleeping: boolean): void {
  npc.sprite.alpha = sleeping ? 0.4 : 1.0;
}

/** Clean up all movement states */
export function clearNPCAnimations(): void {
  moveStates.clear();
  activityIndicators.clear();
}

// ─── Easing ──────────────────────────────────────────────────────

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
