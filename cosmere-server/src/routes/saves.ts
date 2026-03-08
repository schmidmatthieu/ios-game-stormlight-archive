// ─── Save Routes — Cloud Save CRUD ───────────────────────────────
import { Hono } from 'hono';
import { db } from '../db/schema.js';
import { requireAuth, type AuthPayload } from '../middleware/auth.js';

const MAX_SLOTS = 3;

const saves = new Hono<{ Variables: { user: AuthPayload } }>();

// All save routes require authentication
saves.use('/*', requireAuth);

// GET /saves — list all save slots for the user
saves.get('/', (c) => {
  const user = c.get('user') as AuthPayload;

  const rows = db.prepare(
    `SELECT slot, champion_name, champion_level, world_id, play_time, updated_at
     FROM saves WHERE user_id = ? ORDER BY slot`
  ).all(user.userId) as Array<{
    slot: number; champion_name: string | null; champion_level: number | null;
    world_id: string | null; play_time: number | null; updated_at: string;
  }>;

  // Build a full slots array (0..MAX_SLOTS-1)
  const slots = [];
  for (let i = 0; i < MAX_SLOTS; i++) {
    const row = rows.find((r) => r.slot === i);
    slots.push({
      slot: i,
      exists: !!row,
      championName: row?.champion_name ?? null,
      championLevel: row?.champion_level ?? null,
      worldID: row?.world_id ?? null,
      playTime: row?.play_time ?? null,
      updatedAt: row?.updated_at ?? null,
    });
  }

  return c.json({ slots });
});

// GET /saves/:slot — load save data
saves.get('/:slot', (c) => {
  const user = c.get('user') as AuthPayload;
  const slot = parseInt(c.req.param('slot'), 10);

  if (isNaN(slot) || slot < 0 || slot >= MAX_SLOTS) {
    return c.json({ error: 'Slot invalide (0-2)' }, 400);
  }

  const row = db.prepare(
    'SELECT save_data, updated_at FROM saves WHERE user_id = ? AND slot = ?'
  ).get(user.userId, slot) as { save_data: string; updated_at: string } | undefined;

  if (!row) {
    return c.json({ error: 'Aucune sauvegarde dans ce slot' }, 404);
  }

  return c.json({ slot, data: JSON.parse(row.save_data), updatedAt: row.updated_at });
});

// PUT /saves/:slot — save/overwrite save data
saves.put('/:slot', async (c) => {
  const user = c.get('user') as AuthPayload;
  const slot = parseInt(c.req.param('slot'), 10);

  if (isNaN(slot) || slot < 0 || slot >= MAX_SLOTS) {
    return c.json({ error: 'Slot invalide (0-2)' }, 400);
  }

  const body = await c.req.json<{
    data: Record<string, string>;
    championName?: string;
    championLevel?: number;
    worldID?: string;
    playTime?: number;
  }>();

  if (!body.data || typeof body.data !== 'object') {
    return c.json({ error: 'Données de sauvegarde manquantes' }, 400);
  }

  const saveData = JSON.stringify(body.data);
  const championName = body.championName ?? null;
  const championLevel = body.championLevel ?? null;
  const worldID = body.worldID ?? null;
  const playTime = body.playTime ?? 0;

  db.prepare(`
    INSERT INTO saves (user_id, slot, save_data, champion_name, champion_level, world_id, play_time, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(user_id, slot) DO UPDATE SET
      save_data = excluded.save_data,
      champion_name = excluded.champion_name,
      champion_level = excluded.champion_level,
      world_id = excluded.world_id,
      play_time = excluded.play_time,
      updated_at = datetime('now')
  `).run(user.userId, slot, saveData, championName, championLevel, worldID, playTime);

  return c.json({ ok: true, slot });
});

// DELETE /saves/:slot — delete save
saves.delete('/:slot', (c) => {
  const user = c.get('user') as AuthPayload;
  const slot = parseInt(c.req.param('slot'), 10);

  if (isNaN(slot) || slot < 0 || slot >= MAX_SLOTS) {
    return c.json({ error: 'Slot invalide (0-2)' }, 400);
  }

  db.prepare('DELETE FROM saves WHERE user_id = ? AND slot = ?').run(user.userId, slot);

  return c.json({ ok: true });
});

export { saves };
