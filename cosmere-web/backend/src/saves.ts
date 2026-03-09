import { Router } from 'express';
import type { Response } from 'express';
import { pool } from './db.js';
import { authMiddleware } from './auth.js';
import type { AuthRequest } from './auth.js';

const router = Router();

// All save routes require auth
router.use(authMiddleware);

// List save slots
router.get('/', async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  try {
    const result = await pool.query(
      `SELECT slot, champion_name, champion_level, world_id, play_time, updated_at
       FROM saves WHERE user_id = $1 ORDER BY slot`,
      [userId],
    );

    const slots = [];
    for (let i = 0; i < 10; i++) {
      const row = result.rows.find(r => r.slot === i);
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

    res.json({ slots });
  } catch (err) {
    console.error('List saves error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Load a save slot
router.get('/:slot', async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const slot = Number(req.params.slot);

  if (isNaN(slot) || slot < 0 || slot > 9) {
    res.status(400).json({ error: 'Slot invalide (0-9)' });
    return;
  }

  try {
    const result = await pool.query(
      'SELECT data FROM saves WHERE user_id = $1 AND slot = $2',
      [userId, slot],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Aucune sauvegarde dans ce slot' });
      return;
    }

    res.json({ data: result.rows[0].data });
  } catch (err) {
    console.error('Load save error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Save to a slot (upsert)
router.put('/:slot', async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const slot = Number(req.params.slot);

  if (isNaN(slot) || slot < 0 || slot > 9) {
    res.status(400).json({ error: 'Slot invalide (0-9)' });
    return;
  }

  const { data, championName, championLevel, worldID } = req.body as {
    data: Record<string, string>;
    championName?: string;
    championLevel?: number;
    worldID?: string;
  };

  if (!data || typeof data !== 'object') {
    res.status(400).json({ error: 'Données de sauvegarde manquantes' });
    return;
  }

  try {
    await pool.query(
      `INSERT INTO saves (user_id, slot, data, champion_name, champion_level, world_id, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (user_id, slot) DO UPDATE SET
         data = $3, champion_name = $4, champion_level = $5, world_id = $6, updated_at = NOW()`,
      [userId, slot, JSON.stringify(data), championName ?? null, championLevel ?? null, worldID ?? null],
    );

    res.json({ ok: true });
  } catch (err) {
    console.error('Save error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Delete a save slot
router.delete('/:slot', async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const slot = Number(req.params.slot);

  if (isNaN(slot) || slot < 0 || slot > 9) {
    res.status(400).json({ error: 'Slot invalide (0-9)' });
    return;
  }

  try {
    await pool.query(
      'DELETE FROM saves WHERE user_id = $1 AND slot = $2',
      [userId, slot],
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('Delete save error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export { router as savesRouter };
