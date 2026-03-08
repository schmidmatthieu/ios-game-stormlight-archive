// ─── Cosmere Chronicles — API Server ─────────────────────────────
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { initDB } from './db/schema.js';
import { auth } from './routes/auth.js';
import { saves } from './routes/saves.js';

// Initialize database on startup
initDB();

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors({
  origin: (origin) => {
    // Allow localhost dev and production domain
    if (!origin) return 'http://localhost:3000';
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) return origin;
    if (origin.includes('vercel.app')) return origin;
    if (origin.includes('cosmere')) return origin;
    return 'http://localhost:3000';
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Routes
app.route('/auth', auth);
app.route('/saves', saves);

// Health check
app.get('/', (c) => {
  return c.json({ status: 'ok', name: 'Cosmere Chronicles API', version: '1.0.0' });
});

// Start server
const PORT = parseInt(process.env.PORT ?? '4000', 10);
serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`Cosmere API running on http://localhost:${info.port}`);
});

export default app;
