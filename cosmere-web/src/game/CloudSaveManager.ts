// ─── Cloud Save Manager — Auth + Remote Saves ───────────────────
// Handles user authentication and cloud save synchronization.

const TOKEN_KEY = 'cosmere_auth_token';
const USER_KEY = 'cosmere_auth_user';

// Individual localStorage keys that make up a full save
const SAVE_KEYS: readonly string[] = [
  'cosmere_save',
  'cosmere_quest_states',
  'cosmere_talents',
  'cosmere_potions',
  'cosmere_bestiary',
  'cosmere_achievements',
  'cosmere_achievement_stats',
  'cosmere_companions',
  'cosmere_npc_rel',
  'cosmere_professions',
  'cosmere_item_mods',
  'minimap_position',
  'cosmere_tutorial',
] as const;

const FOG_KEY_PREFIX = 'minimap_fog_';

export interface CloudUser {
  id: number;
  username: string;
}

export interface CloudSlotInfo {
  slot: number;
  exists: boolean;
  championName: string | null;
  championLevel: number | null;
  worldID: string | null;
  playTime: number | null;
  updatedAt: string | null;
}

export class CloudSaveManager {
  static readonly shared = new CloudSaveManager();
  private constructor() {}

  private _baseURL: string = this.detectBaseURL();
  private _token: string | null = localStorage.getItem(TOKEN_KEY);
  private _user: CloudUser | null = this.loadStoredUser();

  get isLoggedIn(): boolean { return !!this._token; }
  get user(): CloudUser | null { return this._user; }
  get token(): string | null { return this._token; }

  private detectBaseURL(): string {
    // Default to localhost in dev, can be overridden via VITE_API_URL env
    const envURL = import.meta.env?.VITE_API_URL as string | undefined;
    if (envURL) return envURL;
    // If running on localhost, use local API
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      return 'http://localhost:4000';
    }
    // Production — Caddy proxies /auth/* and /saves/* to the backend
    return '';
  }

  private loadStoredUser(): CloudUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }

  private setAuth(token: string, user: CloudUser): void {
    this._token = token;
    this._user = user;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  logout(): void {
    this._token = null;
    this._user = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  private async request<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<{ ok: boolean; status: number; data: T }> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> ?? {}),
    };
    if (this._token) {
      headers['Authorization'] = `Bearer ${this._token}`;
    }

    const resp = await fetch(`${this._baseURL}${path}`, {
      ...options,
      headers,
    });

    const data = await resp.json() as T;
    return { ok: resp.ok, status: resp.status, data };
  }

  // ─── Auth ──────────────────────────────────────────────────────

  async register(username: string, password: string): Promise<{ ok: boolean; error?: string }> {
    const resp = await this.request<{ token?: string; user?: CloudUser; error?: string }>(
      '/auth/register',
      { method: 'POST', body: JSON.stringify({ username, password }) },
    );

    if (resp.ok && resp.data.token && resp.data.user) {
      this.setAuth(resp.data.token, resp.data.user);
      return { ok: true };
    }
    return { ok: false, error: resp.data.error ?? 'Erreur d\'inscription' };
  }

  async login(login: string, password: string): Promise<{ ok: boolean; error?: string }> {
    const resp = await this.request<{ token?: string; user?: CloudUser; error?: string }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ login, password }) },
    );

    if (resp.ok && resp.data.token && resp.data.user) {
      this.setAuth(resp.data.token, resp.data.user);
      return { ok: true };
    }
    return { ok: false, error: resp.data.error ?? 'Erreur de connexion' };
  }

  async verifySession(): Promise<boolean> {
    if (!this._token) return false;
    const resp = await this.request<{ user?: CloudUser; error?: string }>('/auth/me');
    if (resp.ok && resp.data.user) {
      this._user = resp.data.user;
      localStorage.setItem(USER_KEY, JSON.stringify(resp.data.user));
      return true;
    }
    this.logout();
    return false;
  }

  // ─── Saves ─────────────────────────────────────────────────────

  async getSlots(): Promise<CloudSlotInfo[]> {
    const resp = await this.request<{ slots?: CloudSlotInfo[]; error?: string }>('/saves');
    if (resp.ok && resp.data.slots) return resp.data.slots;
    return [];
  }

  async loadSlot(slot: number): Promise<Record<string, string> | null> {
    const resp = await this.request<{ data?: Record<string, string>; error?: string }>(
      `/saves/${slot}`,
    );
    if (resp.ok && resp.data.data) return resp.data.data;
    return null;
  }

  async saveSlot(slot: number): Promise<boolean> {
    const data = this.collectLocalData();

    // Extract champion meta for slot listing
    let championName: string | undefined;
    let championLevel: number | undefined;
    let worldID: string | undefined;
    const champRaw = data['cosmere_save'];
    if (champRaw) {
      try {
        const champ = JSON.parse(champRaw);
        championName = champ.name;
        championLevel = champ.level;
        worldID = champ.currentWorldID ?? champ.currentWorld;
      } catch { /* ignore */ }
    }

    const resp = await this.request<{ ok?: boolean; error?: string }>(
      `/saves/${slot}`,
      {
        method: 'PUT',
        body: JSON.stringify({ data, championName, championLevel, worldID }),
      },
    );
    return !!resp.data.ok;
  }

  async deleteSlot(slot: number): Promise<boolean> {
    const resp = await this.request<{ ok?: boolean }>(`/saves/${slot}`, { method: 'DELETE' });
    return !!resp.data.ok;
  }

  // Download cloud save to localStorage
  async downloadToLocal(slot: number): Promise<boolean> {
    const data = await this.loadSlot(slot);
    if (!data) return false;

    // Clear old keys
    for (const key of SAVE_KEYS) {
      localStorage.removeItem(key);
    }
    // Distribute
    for (const [key, value] of Object.entries(data)) {
      localStorage.setItem(key, value);
    }
    return true;
  }

  // Upload local save to cloud
  async uploadFromLocal(slot: number): Promise<boolean> {
    return this.saveSlot(slot);
  }

  // ─── Helpers ───────────────────────────────────────────────────

  private collectLocalData(): Record<string, string> {
    const data: Record<string, string> = {};
    for (const key of SAVE_KEYS) {
      const value = localStorage.getItem(key);
      if (value !== null) data[key] = value;
    }
    // Include fog keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key !== null && key.startsWith(FOG_KEY_PREFIX)) {
        const value = localStorage.getItem(key);
        if (value !== null) data[key] = value;
      }
    }
    return data;
  }
}
