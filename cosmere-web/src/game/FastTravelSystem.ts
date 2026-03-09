// ─── Fast Travel System ──────────────────────────────────────────
// Allows players to instantly travel between discovered zones
// via waypoint portals found in hub zones and discovered areas.
// Tracks which zones the player has visited.

import { GameManager } from './GameManager';
import { gameData } from '../data/DataLoader';
import type { Zone, WorldID } from '../data/types';

// ─── Storage Key ────────────────────────────────────────────────

const STORAGE_KEY = 'cosmere_discovered_zones';

// ─── Discovered Zone Tracker ────────────────────────────────────

export class FastTravelManager {
  private static _instance: FastTravelManager;
  static get shared(): FastTravelManager {
    if (!this._instance) this._instance = new FastTravelManager();
    return this._instance;
  }

  private discoveredZones: Set<string> = new Set();

  /** Load discovered zones from localStorage */
  load(): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const arr = JSON.parse(data) as string[];
        this.discoveredZones = new Set(arr);
      }
    } catch { /* ignore */ }

    // Always include hub zones as discovered
    this.ensureHubsDiscovered();
  }

  /** Save discovered zones to localStorage */
  save(): void {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([...this.discoveredZones]),
    );
  }

  /** Mark a zone as discovered */
  discoverZone(zoneID: string): boolean {
    if (this.discoveredZones.has(zoneID)) return false;
    this.discoveredZones.add(zoneID);
    this.save();
    return true; // New discovery
  }

  /** Check if a zone has been discovered */
  isDiscovered(zoneID: string): boolean {
    return this.discoveredZones.has(zoneID);
  }

  /** Get all discovered zones for a world */
  getDiscoveredForWorld(worldID: WorldID): Zone[] {
    const zones: Zone[] = [];
    for (const zoneID of this.discoveredZones) {
      const zone = gameData.zone(zoneID);
      if (zone && zone.worldID === worldID) {
        zones.push(zone);
      }
    }
    return zones.sort((a, b) => a.name.localeCompare(b.name));
  }

  /** Get all discovered zones across all worlds */
  getAllDiscovered(): Zone[] {
    const zones: Zone[] = [];
    for (const zoneID of this.discoveredZones) {
      const zone = gameData.zone(zoneID);
      if (zone) zones.push(zone);
    }
    return zones;
  }

  /** Get discovered zone count per world */
  getDiscoveryStats(): Record<string, { discovered: number; total: number }> {
    const stats: Record<string, { discovered: number; total: number }> = {};
    const allZones = Array.from(gameData.zones.values());

    for (const zone of allZones) {
      if (!stats[zone.worldID]) {
        stats[zone.worldID] = { discovered: 0, total: 0 };
      }
      stats[zone.worldID].total++;
      if (this.discoveredZones.has(zone.id)) {
        stats[zone.worldID].discovered++;
      }
    }
    return stats;
  }

  /** Travel to a discovered zone */
  travelTo(zoneID: string): boolean {
    const champ = GameManager.shared.champion;
    if (!champ) return false;
    if (!this.discoveredZones.has(zoneID)) return false;

    const zone = gameData.zone(zoneID);
    if (!zone) return false;

    champ.currentWorldID = zone.worldID;
    champ.currentZoneID = zone.id;
    champ.gridPosition = { ...zone.playerSpawnPosition };
    GameManager.shared.save();
    return true;
  }

  /** Ensure all hub zones are always discovered */
  private ensureHubsDiscovered(): void {
    const hubWorlds: WorldID[] = [
      'scadrial', 'roshar', 'taldain',
      'komashi', 'nalthis', 'sel', 'shadesmar',
    ];
    for (const world of hubWorlds) {
      this.discoveredZones.add(`${world}_hub`);
    }
  }

  /** Reset all discoveries (new game) */
  reset(): void {
    this.discoveredZones.clear();
    this.ensureHubsDiscovered();
    this.save();
  }
}
