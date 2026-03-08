// ─── JWT Auth Middleware ─────────────────────────────────────────
import { createMiddleware } from 'hono/factory';
import * as jose from 'jose';

// In production, use a proper secret from environment variables
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'cosmere-chronicles-dev-secret-change-me'
);
const JWT_ISSUER = 'cosmere-server';
const JWT_EXPIRY = '7d';

export interface AuthPayload {
  userId: number;
  username: string;
}

export async function signToken(payload: AuthPayload): Promise<string> {
  return new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setExpirationTime(JWT_EXPIRY)
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<AuthPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
    });
    return {
      userId: payload.userId as number,
      username: payload.username as string,
    };
  } catch {
    return null;
  }
}

// Hono middleware that requires a valid JWT
export const requireAuth = createMiddleware<{
  Variables: { user: AuthPayload };
}>(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Token manquant' }, 401);
  }

  const token = authHeader.slice(7);
  const user = await verifyToken(token);
  if (!user) {
    return c.json({ error: 'Token invalide ou expiré' }, 401);
  }

  c.set('user', user);
  await next();
});
