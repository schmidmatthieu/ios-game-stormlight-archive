export interface SaveSlotInfo {
  slotIndex: number;
  exists: boolean;
  championName?: string;
  level?: number;
  worldID?: string;
  timestamp?: number;
  playTime?: number;
}

interface UnifiedSave {
  version: number;
  timestamp: number;
  data: Record<string, string>;
}

const SAVE_VERSION = 1;
const UNIFIED_KEY = 'cosmere_full_save';
const SLOT_KEY_PREFIX = 'cosmere_save_slot_';
const FOG_KEY_PREFIX = 'minimap_fog_';

const INDIVIDUAL_KEYS: readonly string[] = [
  'cosmere_save',
  'cosmere_quest_states',
  'cosmere_talents',
  'cosmere_potions',
  'cosmere_bestiary',
  'cosmere_achievements',
  'cosmere_achievement_stats',
  'cosmere_companion',
  'cosmere_npc_rel',
  'cosmere_professions',
  'minimap_position',
  'cosmere_tutorial',
] as const;

const MAX_SLOTS = 3;

export class SaveManager {
  static readonly shared = new SaveManager();
  private constructor() {}

  private collectAllData(): Record<string, string> {
    const data: Record<string, string> = {};

    for (const key of INDIVIDUAL_KEYS) {
      const value = localStorage.getItem(key);
      if (value !== null) {
        data[key] = value;
      }
    }

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key !== null && key.startsWith(FOG_KEY_PREFIX)) {
        const value = localStorage.getItem(key);
        if (value !== null) {
          data[key] = value;
        }
      }
    }

    return data;
  }

  private distributeData(data: Record<string, string>): void {
    for (const [key, value] of Object.entries(data)) {
      localStorage.setItem(key, value);
    }
  }

  private buildUnifiedSave(): UnifiedSave {
    return {
      version: SAVE_VERSION,
      timestamp: Date.now(),
      data: this.collectAllData(),
    };
  }

  private extractSlotInfo(slotIndex: number, raw: string | null): SaveSlotInfo {
    if (raw === null) {
      return { slotIndex, exists: false };
    }

    try {
      const save: UnifiedSave = JSON.parse(raw);
      const championRaw = save.data['cosmere_save'];
      let championName: string | undefined;
      let level: number | undefined;
      let worldID: string | undefined;
      let playTime: number | undefined;

      if (championRaw) {
        const champion = JSON.parse(championRaw);
        championName = champion.name ?? champion.championName;
        level = champion.level;
        worldID = champion.currentWorld ?? champion.worldID;
        playTime = champion.playTime;
      }

      return {
        slotIndex,
        exists: true,
        championName,
        level,
        worldID,
        timestamp: save.timestamp,
        playTime,
      };
    } catch {
      return { slotIndex, exists: false };
    }
  }

  saveAll(): void {
    const save = this.buildUnifiedSave();
    localStorage.setItem(UNIFIED_KEY, JSON.stringify(save));
  }

  loadAll(): boolean {
    const raw = localStorage.getItem(UNIFIED_KEY);
    if (raw === null) {
      return false;
    }

    try {
      const save: UnifiedSave = JSON.parse(raw);
      this.distributeData(save.data);
      return true;
    } catch {
      return false;
    }
  }

  exportSave(): string {
    const save = this.buildUnifiedSave();
    return btoa(JSON.stringify(save));
  }

  importSave(encoded: string): boolean {
    try {
      const json = atob(encoded);
      const save: UnifiedSave = JSON.parse(json);

      if (typeof save.version !== 'number' || typeof save.data !== 'object') {
        return false;
      }

      this.distributeData(save.data);
      localStorage.setItem(UNIFIED_KEY, JSON.stringify(save));
      return true;
    } catch {
      return false;
    }
  }

  getSaveSlots(): SaveSlotInfo[] {
    const slots: SaveSlotInfo[] = [];
    for (let i = 0; i < MAX_SLOTS; i++) {
      const raw = localStorage.getItem(SLOT_KEY_PREFIX + i);
      slots.push(this.extractSlotInfo(i, raw));
    }
    return slots;
  }

  saveToSlot(slotIndex: number): void {
    if (slotIndex < 0 || slotIndex >= MAX_SLOTS) {
      return;
    }
    const save = this.buildUnifiedSave();
    localStorage.setItem(SLOT_KEY_PREFIX + slotIndex, JSON.stringify(save));
    // Also keep the unified key and individual keys in sync
    localStorage.setItem(UNIFIED_KEY, JSON.stringify(save));
  }

  loadFromSlot(slotIndex: number): boolean {
    if (slotIndex < 0 || slotIndex >= MAX_SLOTS) {
      return false;
    }

    const raw = localStorage.getItem(SLOT_KEY_PREFIX + slotIndex);
    if (raw === null) {
      return false;
    }

    try {
      const save: UnifiedSave = JSON.parse(raw);
      this.distributeData(save.data);
      localStorage.setItem(UNIFIED_KEY, JSON.stringify(save));
      return true;
    } catch {
      return false;
    }
  }

  deleteSaveSlot(slotIndex: number): void {
    if (slotIndex < 0 || slotIndex >= MAX_SLOTS) {
      return;
    }
    localStorage.removeItem(SLOT_KEY_PREFIX + slotIndex);
  }

  autoSave(): void {
    this.saveToSlot(0);
  }

  downloadSaveFile(): void {
    const save = this.buildUnifiedSave();
    const json = JSON.stringify(save, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const date = new Date().toISOString().slice(0, 10);
    a.download = `cosmere-save-${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  uploadSaveFile(): Promise<boolean> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) { resolve(false); return; }
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const save: UnifiedSave = JSON.parse(reader.result as string);
            if (typeof save.version !== 'number' || typeof save.data !== 'object') {
              resolve(false);
              return;
            }
            this.distributeData(save.data);
            localStorage.setItem(UNIFIED_KEY, JSON.stringify(save));
            resolve(true);
          } catch {
            resolve(false);
          }
        };
        reader.onerror = () => resolve(false);
        reader.readAsText(file);
      };
      input.oncancel = () => resolve(false);
      input.click();
    });
  }

  hasSaveData(): boolean {
    if (localStorage.getItem(UNIFIED_KEY) !== null) {
      return true;
    }
    for (let i = 0; i < MAX_SLOTS; i++) {
      if (localStorage.getItem(SLOT_KEY_PREFIX + i) !== null) {
        return true;
      }
    }
    // Check if any individual keys exist (pre-migration)
    for (const key of INDIVIDUAL_KEYS) {
      if (localStorage.getItem(key) !== null) {
        return true;
      }
    }
    return false;
  }
}
