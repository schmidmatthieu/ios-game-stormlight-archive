// ─── Distinct Enemy AI Behaviors ─────────────────────────────────
// Implements patrol, wander, guard, ambush, ranged, berserk, support behaviors
// Each behavior modifies chase/attack/idle logic differently

import type { AIBehavior } from '../data/types';

export interface BehaviorState {
  behavior: AIBehavior;
  // Patrol: waypoint index + timer
  patrolIndex: number;
  patrolWaitTimer: number;
  // Wander: random direction timer
  wanderAngle: number;
  wanderTimer: number;
  // Guard: anchor position
  guardOriginX: number;
  guardOriginY: number;
  // Ranged: kiting distance
  preferredRange: number;
  // Berserk: rage timer
  isEnraged: boolean;
  enrageTimer: number;
  // Support: heal cooldown
  healCooldown: number;
  // Flee threshold
  fleeTimer: number;
  // Summoner: spawn cooldown
  summonCooldown: number;
  summonCount: number;
  // Teleporter: blink cooldown + tracking
  teleportCooldown: number;
  teleportPhase: 'idle' | 'vanishing' | 'appearing';
  teleportTimer: number;
  // Charger: charge state
  chargeState: 'idle' | 'winding' | 'charging' | 'recovering';
  chargeTimer: number;
  chargeTargetX: number;
  chargeTargetY: number;
}

export function createBehaviorState(
  behavior: AIBehavior,
  spawnX: number,
  spawnY: number,
  attackRange: number,
): BehaviorState {
  return {
    behavior,
    patrolIndex: 0,
    patrolWaitTimer: 0,
    wanderAngle: Math.random() * Math.PI * 2,
    wanderTimer: 0,
    guardOriginX: spawnX,
    guardOriginY: spawnY,
    preferredRange: Math.max(attackRange * 32 * 0.8, 80),
    isEnraged: false,
    enrageTimer: 0,
    healCooldown: 0,
    fleeTimer: 0,
    summonCooldown: 8,
    summonCount: 0,
    teleportCooldown: 0,
    teleportPhase: 'idle',
    teleportTimer: 0,
    chargeState: 'idle',
    chargeTimer: 0,
    chargeTargetX: 0,
    chargeTargetY: 0,
  };
}

export interface BehaviorResult {
  // Movement override
  moveX: number;
  moveY: number;
  shouldMove: boolean;
  // Attack modifiers
  attackSpeedMult: number;
  damageMult: number;
  // State overrides
  shouldFlee: boolean;
  shouldHealAlly: boolean;
  healTargetIndex: number;
  // Detection modifier
  detectionMult: number;
}

const EMPTY: BehaviorResult = {
  moveX: 0, moveY: 0, shouldMove: false,
  attackSpeedMult: 1, damageMult: 1,
  shouldFlee: false, shouldHealAlly: false, healTargetIndex: -1,
  detectionMult: 1,
};

/** Update behavior state and get movement/combat modifiers */
export function updateBehavior(
  state: BehaviorState,
  dt: number,
  enemyX: number,
  enemyY: number,
  playerX: number,
  playerY: number,
  dist: number,
  detRange: number,
  atkRange: number,
  hpPct: number,
  enemies: readonly { position: { x: number; y: number }; hp: number; maxHP?: number; isDead: boolean; data: { behavior: string } }[],
  enemyIndex: number,
  patrolPath: { x: number; y: number }[] | null,
): BehaviorResult {
  const result: BehaviorResult = { ...EMPTY };

  switch (state.behavior) {
    case 'patrol':
      updatePatrol(state, dt, result, enemyX, enemyY, dist, detRange, patrolPath);
      break;
    case 'wander':
      updateWander(state, dt, result, enemyX, enemyY, dist, detRange);
      break;
    case 'guard':
      updateGuard(state, result, enemyX, enemyY, playerX, playerY, dist, detRange);
      break;
    case 'ambush':
      updateAmbush(state, result, dist, detRange);
      break;
    case 'ranged':
      updateRanged(state, result, enemyX, enemyY, playerX, playerY, dist, atkRange);
      break;
    case 'berserk':
      updateBerserk(state, dt, result, hpPct);
      break;
    case 'support':
      updateSupport(state, dt, result, enemies, enemyIndex, enemyX, enemyY, dist, detRange);
      break;
    case 'summoner':
      updateSummoner(state, dt, result, dist, detRange, hpPct);
      break;
    case 'teleporter':
      updateTeleporter(state, dt, result, enemyX, enemyY, playerX, playerY, dist, detRange);
      break;
    case 'charger':
      updateCharger(state, dt, result, enemyX, enemyY, playerX, playerY, dist, detRange);
      break;
  }

  // Universal flee logic: all non-boss enemies flee below 15% HP (except berserk)
  if (state.behavior !== 'berserk' && hpPct < 0.15 && hpPct > 0) {
    state.fleeTimer += dt;
    if (state.fleeTimer < 3) { // flee for 3 seconds
      result.shouldFlee = true;
      const angle = Math.atan2(enemyY - playerY, enemyX - playerX);
      result.moveX = Math.cos(angle);
      result.moveY = Math.sin(angle);
      result.shouldMove = true;
    }
  } else {
    state.fleeTimer = 0;
  }

  return result;
}

// ─── Patrol ──────────────────────────────────────────────────────
function updatePatrol(
  state: BehaviorState,
  dt: number,
  result: BehaviorResult,
  enemyX: number,
  enemyY: number,
  dist: number,
  detRange: number,
  patrolPath: { x: number; y: number }[] | null,
): void {
  // When player not detected, follow patrol path
  if (dist >= detRange && patrolPath && patrolPath.length > 1) {
    const target = patrolPath[state.patrolIndex];
    const dx = target.x - enemyX;
    const dy = target.y - enemyY;
    const wpDist = Math.hypot(dx, dy);

    if (wpDist < 10) {
      state.patrolWaitTimer += dt;
      if (state.patrolWaitTimer > 1.5) {
        state.patrolIndex = (state.patrolIndex + 1) % patrolPath.length;
        state.patrolWaitTimer = 0;
      }
    } else {
      result.moveX = dx / wpDist;
      result.moveY = dy / wpDist;
      result.shouldMove = true;
    }
  }
}

// ─── Wander ──────────────────────────────────────────────────────
function updateWander(
  state: BehaviorState,
  dt: number,
  result: BehaviorResult,
  enemyX: number,
  enemyY: number,
  dist: number,
  detRange: number,
): void {
  // When player not detected, wander randomly
  if (dist >= detRange) {
    state.wanderTimer -= dt;
    if (state.wanderTimer <= 0) {
      state.wanderAngle = Math.random() * Math.PI * 2;
      state.wanderTimer = 2 + Math.random() * 3;
    }
    result.moveX = Math.cos(state.wanderAngle) * 0.3;
    result.moveY = Math.sin(state.wanderAngle) * 0.3;
    result.shouldMove = true;
  }
}

// ─── Guard ───────────────────────────────────────────────────────
function updateGuard(
  state: BehaviorState,
  result: BehaviorResult,
  enemyX: number,
  enemyY: number,
  playerX: number,
  playerY: number,
  dist: number,
  detRange: number,
): void {
  result.detectionMult = 0.7; // Smaller detection range, but won't leave post
  const distFromOrigin = Math.hypot(enemyX - state.guardOriginX, enemyY - state.guardOriginY);

  // If too far from guard post, return instead of chasing
  if (distFromOrigin > detRange * 0.6 && dist > detRange * 0.3) {
    const dx = state.guardOriginX - enemyX;
    const dy = state.guardOriginY - enemyY;
    const d = Math.hypot(dx, dy);
    if (d > 5) {
      result.moveX = dx / d;
      result.moveY = dy / d;
      result.shouldMove = true;
    }
  }

  // Guards take less damage (tougher)
  result.damageMult = 1.15;
  result.attackSpeedMult = 0.8; // Slower but harder-hitting
}

// ─── Ambush ──────────────────────────────────────────────────────
function updateAmbush(
  state: BehaviorState,
  result: BehaviorResult,
  dist: number,
  detRange: number,
): void {
  // Ambush enemies: first hit does 1.5x damage
  if (dist < detRange * 0.4) {
    result.damageMult = 1.5; // Surprise attack bonus
    result.attackSpeedMult = 1.3; // Strikes fast
  }
}

// ─── Ranged ──────────────────────────────────────────────────────
function updateRanged(
  state: BehaviorState,
  result: BehaviorResult,
  enemyX: number,
  enemyY: number,
  playerX: number,
  playerY: number,
  dist: number,
  atkRange: number,
): void {
  // Ranged enemies try to maintain distance — kite the player
  if (dist < state.preferredRange * 0.6) {
    // Too close, back away
    const angle = Math.atan2(enemyY - playerY, enemyX - playerX);
    result.moveX = Math.cos(angle);
    result.moveY = Math.sin(angle);
    result.shouldMove = true;
  }
  result.detectionMult = 1.5; // Spot player from further away
  result.attackSpeedMult = 1.2; // Faster attack rate
  result.damageMult = 0.7; // Less damage per hit
}

// ─── Berserk ─────────────────────────────────────────────────────
function updateBerserk(
  state: BehaviorState,
  dt: number,
  result: BehaviorResult,
  hpPct: number,
): void {
  // Berserk enemies get stronger as they lose HP, never flee
  if (hpPct < 0.5 && !state.isEnraged) {
    state.isEnraged = true;
    state.enrageTimer = 0;
  }

  if (state.isEnraged) {
    state.enrageTimer += dt;
    const rageBonus = Math.min(2.0, 1.0 + (1 - hpPct)); // Up to 2x damage at 0% HP
    result.damageMult = rageBonus;
    result.attackSpeedMult = 1.0 + (1 - hpPct) * 0.5; // Up to 1.5x attack speed
  }
}

// ─── Support ─────────────────────────────────────────────────────
function updateSupport(
  state: BehaviorState,
  dt: number,
  result: BehaviorResult,
  enemies: readonly { position: { x: number; y: number }; hp: number; maxHP?: number; isDead: boolean; data: { behavior: string } }[],
  selfIndex: number,
  enemyX: number,
  enemyY: number,
  dist: number,
  detRange: number,
): void {
  state.healCooldown = Math.max(0, state.healCooldown - dt);

  // Support enemies heal nearby allies
  if (state.healCooldown <= 0) {
    let lowestHpIdx = -1;
    let lowestHpPct = 0.8; // Only heal allies below 80%

    for (let i = 0; i < enemies.length; i++) {
      if (i === selfIndex || enemies[i].isDead) continue;
      const ally = enemies[i];
      const allyMax = (ally as { maxHP?: number }).maxHP ?? ally.hp;
      if (allyMax <= 0) continue;
      const allyHpPct = ally.hp / allyMax;
      const allyDist = Math.hypot(ally.position.x - enemyX, ally.position.y - enemyY);
      if (allyDist < 120 && allyHpPct < lowestHpPct) {
        lowestHpPct = allyHpPct;
        lowestHpIdx = i;
      }
    }

    if (lowestHpIdx >= 0) {
      result.shouldHealAlly = true;
      result.healTargetIndex = lowestHpIdx;
      state.healCooldown = 4; // 4 second cooldown between heals

      // Move towards injured ally if far
      const ally = enemies[lowestHpIdx];
      const dx = ally.position.x - enemyX;
      const dy = ally.position.y - enemyY;
      const d = Math.hypot(dx, dy);
      if (d > 60) {
        result.moveX = dx / d;
        result.moveY = dy / d;
        result.shouldMove = true;
      }
    }
  }

  // Support enemies are weaker in direct combat
  result.damageMult = 0.5;
  result.attackSpeedMult = 0.7;
}

// ─── Summoner ────────────────────────────────────────────────────
function updateSummoner(
  state: BehaviorState,
  dt: number,
  result: BehaviorResult,
  dist: number,
  detRange: number,
  hpPct: number,
): void {
  state.summonCooldown = Math.max(0, state.summonCooldown - dt);

  // Summoners try to stay back and summon allies
  if (dist < detRange && state.summonCooldown <= 0 && state.summonCount < 3) {
    result.shouldHealAlly = true; // Reuse heal flag to signal "summon" event
    result.healTargetIndex = -2; // Special marker for summoning
    state.summonCooldown = hpPct < 0.5 ? 5 : 8; // Summon faster when hurt
    state.summonCount++;
  }

  // Stay at medium range, back away if player gets close
  if (dist < detRange * 0.4) {
    const safeDist = detRange * 0.5;
    result.moveX = -1; // Move away (simplified)
    result.moveY = 0;
    result.shouldMove = true;
  }

  result.detectionMult = 1.3;
  result.damageMult = 0.6;
  result.attackSpeedMult = 0.8;
}

// ─── Teleporter ─────────────────────────────────────────────────
function updateTeleporter(
  state: BehaviorState,
  dt: number,
  result: BehaviorResult,
  enemyX: number,
  enemyY: number,
  playerX: number,
  playerY: number,
  dist: number,
  detRange: number,
): void {
  state.teleportCooldown = Math.max(0, state.teleportCooldown - dt);

  if (state.teleportPhase === 'vanishing') {
    state.teleportTimer += dt;
    if (state.teleportTimer > 0.3) {
      state.teleportPhase = 'appearing';
      state.teleportTimer = 0;
      // Teleport behind the player
      const angle = Math.atan2(playerY - enemyY, playerX - enemyX);
      const behindDist = 40;
      result.moveX = playerX + Math.cos(angle) * behindDist - enemyX;
      result.moveY = playerY + Math.sin(angle) * behindDist - enemyY;
      result.shouldMove = true;
    }
    return;
  }

  if (state.teleportPhase === 'appearing') {
    state.teleportTimer += dt;
    if (state.teleportTimer > 0.2) {
      state.teleportPhase = 'idle';
      state.teleportCooldown = 4;
    }
    // Strike immediately after appearing
    result.damageMult = 1.8;
    result.attackSpeedMult = 2.0;
    return;
  }

  // Idle: decide when to teleport
  if (dist < detRange && state.teleportCooldown <= 0 && dist > 30) {
    state.teleportPhase = 'vanishing';
    state.teleportTimer = 0;
  }

  result.detectionMult = 1.2;
}

// ─── Charger ────────────────────────────────────────────────────
function updateCharger(
  state: BehaviorState,
  dt: number,
  result: BehaviorResult,
  enemyX: number,
  enemyY: number,
  playerX: number,
  playerY: number,
  dist: number,
  detRange: number,
): void {
  switch (state.chargeState) {
    case 'idle':
      // Normal movement, but wind up for charge at medium range
      if (dist < detRange * 0.8 && dist > 60) {
        state.chargeState = 'winding';
        state.chargeTimer = 0;
        state.chargeTargetX = playerX;
        state.chargeTargetY = playerY;
      }
      break;

    case 'winding':
      // Pause and telegraph the charge (visual: shaking)
      state.chargeTimer += dt;
      result.shouldMove = false;
      result.attackSpeedMult = 0; // Can't attack while winding
      if (state.chargeTimer > 0.8) {
        state.chargeState = 'charging';
        state.chargeTimer = 0;
        // Lock in target direction
        state.chargeTargetX = playerX;
        state.chargeTargetY = playerY;
      }
      break;

    case 'charging': {
      state.chargeTimer += dt;
      const dx = state.chargeTargetX - enemyX;
      const dy = state.chargeTargetY - enemyY;
      const d = Math.hypot(dx, dy);
      if (d > 5) {
        result.moveX = (dx / d) * 3; // Triple speed charge
        result.moveY = (dy / d) * 3;
        result.shouldMove = true;
      }
      result.damageMult = 2.5; // Devastating on contact
      result.attackSpeedMult = 1.5;
      // Stop charging after time or reaching target
      if (state.chargeTimer > 1.0 || d < 20) {
        state.chargeState = 'recovering';
        state.chargeTimer = 0;
      }
      break;
    }

    case 'recovering':
      state.chargeTimer += dt;
      result.shouldMove = false;
      result.attackSpeedMult = 0.3; // Stunned briefly
      if (state.chargeTimer > 1.5) {
        state.chargeState = 'idle';
      }
      break;
  }
}
