import pg from 'pg';

const pool = new pg.Pool({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  user: process.env.DB_USER ?? 'cosmere',
  password: process.env.DB_PASSWORD ?? 'cosmere',
  database: process.env.DB_NAME ?? 'cosmere',
});

export async function initDB(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(32) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS saves (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      slot SMALLINT NOT NULL CHECK (slot BETWEEN 0 AND 9),
      data JSONB NOT NULL DEFAULT '{}',
      champion_name VARCHAR(64),
      champion_level SMALLINT,
      world_id VARCHAR(32),
      play_time INTEGER,
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, slot)
    );

    CREATE INDEX IF NOT EXISTS idx_saves_user ON saves(user_id);
  `);
}

export { pool };
