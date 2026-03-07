import type { Item, Enemy, Skill, Zone, Quest } from './types';

// Shared JSON data loaded once at startup
export class DataLoader {
  items: Map<string, Item> = new Map();
  enemies: Map<string, Enemy> = new Map();
  skills: Map<string, Skill> = new Map();
  zones: Map<string, Zone> = new Map();
  quests: Map<string, Quest> = new Map();

  private loaded = false;

  async loadAll(onProgress?: (pct: number) => void): Promise<void> {
    if (this.loaded) return;

    const files = ['items', 'enemies', 'skills', 'zones', 'quests'] as const;
    let done = 0;

    for (const file of files) {
      const resp = await fetch(`/data/${file}.json`);
      const arr = await resp.json();

      switch (file) {
        case 'items':
          for (const item of arr as Item[]) this.items.set(item.id, item);
          break;
        case 'enemies':
          for (const e of arr as Enemy[]) this.enemies.set(e.id, e);
          break;
        case 'skills':
          for (const s of arr as Skill[]) this.skills.set(s.id, s);
          break;
        case 'zones':
          for (const z of arr as Zone[]) this.zones.set(z.id, z);
          break;
        case 'quests':
          for (const q of arr as Quest[]) this.quests.set(q.id, q);
          break;
      }

      done++;
      onProgress?.(done / files.length);
    }

    this.loaded = true;
  }

  item(id: string): Item | undefined { return this.items.get(id); }
  enemy(id: string): Enemy | undefined { return this.enemies.get(id); }
  skill(id: string): Skill | undefined { return this.skills.get(id); }
  zone(id: string): Zone | undefined { return this.zones.get(id); }
  quest(id: string): Quest | undefined { return this.quests.get(id); }
}

export const gameData = new DataLoader();
