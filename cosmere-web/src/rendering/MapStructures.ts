// ─── Map Structures (barrel re-export) ──────────────────────────
// Split into modular files for maintainability.

export { spawnWalls } from './WallSystem';
export type { WallSegment } from './WallSystem';

export { spawnEnterableBuildings } from './EnterableBuildings';
export type { EnterableBuilding } from './EnterableBuildings';

export { spawnSecretAreas, revealSecret } from './SecretAreas';
export type { SecretArea } from './SecretAreas';
