// ─── Initialize Database ─────────────────────────────────────────
import { initDB, db } from './schema.js';

initDB();
console.log('Database initialized successfully.');
db.close();
