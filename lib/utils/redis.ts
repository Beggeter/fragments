let client: any = null;
let connecting = false;

export async function getRedis(): Promise<any | null> {
  if (client) return client;
  if (connecting) return null;
  connecting = true;
  try {
    const { createClient } = await import('redis');
    const url = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
    const c: any = createClient({ url });
    c.on('error', () => {});
    // Оборачиваем connect таймаутом, чтобы не блокировать рендер/ответы
    const connectWithTimeout = new Promise<void>((resolve, reject) => {
      const to = setTimeout(() => reject(new Error('redis_connect_timeout')), 120);
      c.connect().then(() => { clearTimeout(to); resolve(); }).catch((e: any) => { clearTimeout(to); reject(e); });
    });
    await connectWithTimeout;
    client = c;
    return client;
  } catch (_) {
    return null;
  } finally {
    connecting = false;
  }
}

export async function redisGetWithTimeout<T = any>(key: string, ex = 100): Promise<T | null> {
  try {
    const r = await getRedis();
    if (!r) return null;
    const p = r.get(key);
    const t = new Promise((_, reject) => setTimeout(() => reject(new Error('redis_get_timeout')), ex));
    const res = await Promise.race([p, t]) as string | null;
    return res ? JSON.parse(res) as T : null;
  } catch {
    return null;
  }
}

export async function redisSetWithTimeout(key: string, value: any, ttlSec = 60, ex = 100): Promise<void> {
  try {
    const r = await getRedis();
    if (!r) return;
    const p = r.set(key, JSON.stringify(value), { EX: ttlSec });
    const t = new Promise((_, reject) => setTimeout(() => reject(new Error('redis_set_timeout')), ex));
    await Promise.race([p, t]);
  } catch {
    // swallow
  }
}

export function leaderboardKey(mode: 'classic' | 'zen') {
  return `leaderboard:${mode}`;
}

export function userPositionKey(userId: number, mode: 'classic' | 'zen') {
  return `leaderboard:pos:${mode}:${userId}`;
}


