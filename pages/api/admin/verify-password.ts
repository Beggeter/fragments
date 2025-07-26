import { NextApiRequest, NextApiResponse } from 'next';

// В реальном приложении пароли должны храниться в базе данных
// Здесь используем простой in-memory подход для демонстрации
const activePasswords = new Map<string, { expiresAt: Date }>();

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  // Проверяем, есть ли активный пароль
  const activePassword = activePasswords.get(password);
  
  if (!activePassword) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  // Проверяем, не истек ли срок действия
  if (new Date() > activePassword.expiresAt) {
    activePasswords.delete(password);
    return res.status(401).json({ error: 'Password expired' });
  }

  // Генерируем токен для админа (в реальном приложении используйте JWT)
  const adminToken = `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  res.status(200).json({ 
    success: true,
    adminToken,
    expiresAt: activePassword.expiresAt.toISOString()
  });
}

// Функция для добавления активного пароля (вызывается из generate-password)
export function addActivePassword(password: string, expiresAt: Date) {
  activePasswords.set(password, { expiresAt });
  
  // Очищаем истекшие пароли
  for (const [pwd, data] of activePasswords.entries()) {
    if (new Date() > data.expiresAt) {
      activePasswords.delete(pwd);
    }
  }
} 