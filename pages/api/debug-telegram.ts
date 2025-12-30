import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, data } = req.body;
    
    

    switch (action) {
      case 'check_telegram_webapp':
        
        res.status(200).json({
          success: true,
          message: 'Telegram WebApp data logged',
          hasTelegram: !!data.hasTelegram,
          hasUser: !!data.user,
          userData: data.user || null
        });
        break;

      case 'auth_attempt':
        
        res.status(200).json({
          success: true,
          message: 'Auth attempt logged'
        });
        break;

      case 'auth_success':
        
        res.status(200).json({
          success: true,
          message: 'Auth success logged'
        });
        break;

      case 'auth_error':
        
        res.status(200).json({
          success: true,
          message: 'Auth error logged'
        });
        break;

      case 'api_request':
        
        res.status(200).json({
          success: true,
          message: 'API request logged'
        });
        break;

      default:
        
        res.status(400).json({ error: 'Unknown action' });
    }

  } catch (error) {
    
    res.status(500).json({ error: 'Internal server error' });
  }
} 