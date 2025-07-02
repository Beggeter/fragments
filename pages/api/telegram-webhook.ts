import { NextApiRequest, NextApiResponse } from 'next';
import { UserService } from '@/lib/db/services';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const update = req.body;
    const payment = update?.message?.successful_payment;
    if (!payment) return res.status(200).json({ ok: true }); // не платеж
    // Парсим payload: userId:42;shards:1000
    const payload = payment.invoice_payload;
    const match = payload.match(/userId:(\d+);shards:(\d+)/);
    if (!match) return res.status(400).json({ error: 'Invalid payload' });
    const userId = parseInt(match[1], 10);
    const shards = parseInt(match[2], 10);
    // Начисляем осколки
    const user = await UserService.getUserById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await UserService.updateUser(userId, { currency: user.currency + shards });
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'Server error' });
  }
} 