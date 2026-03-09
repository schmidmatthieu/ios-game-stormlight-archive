import express from 'express';
import cors from 'cors';
import { initDB } from './db.js';
import { authRouter } from './auth.js';
import { savesRouter } from './saves.js';

const PORT = Number(process.env.PORT ?? 4000);
const CORS_ORIGINS = process.env.CORS_ALLOWED_ORIGINS?.split(',') ?? [
  'http://localhost:3000',
  'http://localhost:5173',
];

const app = express();

app.use(cors({ origin: CORS_ORIGINS, credentials: true }));
app.use(express.json({ limit: '5mb' }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'cosmere-api' });
});

// Routes
app.use('/auth', authRouter);
app.use('/saves', savesRouter);

async function start(): Promise<void> {
  await initDB();
  console.log('Database initialized');

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Cosmere API listening on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
