import { NextApiRequest, NextApiResponse } from 'next';
import { UserService } from '@/lib/db/services';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { userId, amount, price, test } = req.body;
  if (!userId || !amount) {
    return res.status(400).json({ error: 'userId and amount required' });
  }
  try {
    // Начисляем осколки пользователю
    const user = await UserService.getUserById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await UserService.updateUser(userId, { currency: user.currency + amount });
    return res.status(200).json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: 'Server error' });
  }
} 