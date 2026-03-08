// ─── Database Client — Turso (LibSQL) for Vercel Serverless ──────
// In production, uses Turso cloud. In development, uses local SQLite file.
//
// Required env vars for Turso:
//   TURSO_DATABASE_URL — e.g. libsql://your-db-name-your-org.turso.io
//   TURSO_AUTH_TOKEN   — auth token from Turso dashboard
//
// To set up Turso (free tier):
//   npm i -g turso
//   turso auth signup
//   turso db create cosmere-chronicles
//   turso db tokens create cosmere-chronicles
//   turso db show cosmere-chronicles --url

import { createClient } from '@libsql/client';

const isProduction = !!process.env.TURSO_DATABASE_URL;

export const db = createClient(
  isProduction
    ? {
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN,
      }
    : {
        url: 'file:./data/cosmere-dev.db',
      }
);

export async function initDB(): Promise<void> {
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL COLLATE NOCASE,
      email TEXT UNIQUE NOT NULL COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      last_login TEXT
    );

    CREATE TABLE IF NOT EXISTS saves (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      slot INTEGER NOT NULL DEFAULT 0,
      save_data TEXT NOT NULL,
      champion_name TEXT,
      champion_level INTEGER,
      world_id TEXT,
      play_time INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, slot)
    );

    CREATE INDEX IF NOT EXISTS idx_saves_user ON saves(user_id);
  `);
}
