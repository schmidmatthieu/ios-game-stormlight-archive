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

  /**
   * Opens a file picker for save import.
   * IMPORTANT: This must be called directly from a user gesture handler (pointerdown/click)
   * to work on iOS Safari / iPad. The input.click() call must be synchronous in the gesture stack.
   */
  uploadSaveFile(): Promise<boolean> {
    // Create and append input synchronously within the user gesture call stack.
    // iOS Safari requires the file input to be clicked in the same synchronous
    // execution context as the user interaction (pointerdown/click).
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    // Must be in the DOM and visible enough for iOS Safari to allow the click
    input.style.position = 'fixed';
    input.style.top = '0';
    input.style.left = '0';
    input.style.width = '100%';
    input.style.height = '100%';
    input.style.opacity = '0.001';
    input.style.zIndex = '99999';
    input.style.cursor = 'pointer';
    document.body.appendChild(input);

    // Click synchronously — critical for iOS gesture chain
    input.click();

    return new Promise((resolve) => {
      let resolved = false;
      const cleanup = () => {
        if (input.parentNode) document.body.removeChild(input);
      };
      const finish = (result: boolean) => {
        if (resolved) return;
        resolved = true;
        cleanup();
        resolve(result);
      };

      input.addEventListener('change', () => {
        const file = input.files?.[0];
        if (!file) { finish(false); return; }
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const text = reader.result as string;
            const save: UnifiedSave = JSON.parse(text);
            if (typeof save.version !== 'number' || typeof save.data !== 'object' || save.data === null) {
              finish(false);
              return;
            }
            // Clear old individual keys first to avoid stale data
            for (const key of INDIVIDUAL_KEYS) {
              localStorage.removeItem(key);
            }
            // Distribute imported data to localStorage
            this.distributeData(save.data);
            // Update unified save key
            localStorage.setItem(UNIFIED_KEY, JSON.stringify(save));
            // Also update auto-save slot so the game loads the imported data
            localStorage.setItem(SLOT_KEY_PREFIX + '0', JSON.stringify(save));
            finish(true);
          } catch {
            finish(false);
          }
        };
        reader.onerror = () => finish(false);
        reader.readAsText(file);
      });

      // Fallback: if user cancels the file dialog, detect via focus/visibility change
      const onVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          document.removeEventListener('visibilitychange', onVisibilityChange);
          // Small delay to let 'change' fire first if a file was selected
          setTimeout(() => finish(false), 1000);
        }
      };
      // Use visibilitychange instead of focus — more reliable on iOS
      document.addEventListener('visibilitychange', onVisibilityChange);
      // Also listen to focus as a fallback for desktop browsers
      const onFocus = () => {
        window.removeEventListener('focus', onFocus);
        setTimeout(() => finish(false), 1000);
      };
      window.addEventListener('focus', onFocus);
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
