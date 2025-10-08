import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });
  try {
    const payload = req.body;
    // Just log to server stdout; on prod pm2 captures this
    
  } catch (e) {
    // ignore
  }
  res.status(200).json({ ok: true });
}

