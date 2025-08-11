import type { RedisClientType } from 'redis';

let client: RedisClientType | null = null;
let connecting = false;

export async function getRedis(): Promise<RedisClientType | null> {
  if (client) return client;
  if (connecting) return null;
  connecting = true;
  try {
    const { createClient } = await import('redis');
    const url = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
    const c = createClient({ url });
    c.on('error', () => {});
    await c.connect();
    client = c;
    return client;
  } catch (_) {
    return null;
  } finally {
    connecting = false;
  }
}

export function leaderboardKey(mode: 'classic' | 'zen') {
  return `leaderboard:${mode}`;
}

export function userPositionKey(userId: number, mode: 'classic' | 'zen') {
  return `leaderboard:pos:${mode}:${userId}`;
}


