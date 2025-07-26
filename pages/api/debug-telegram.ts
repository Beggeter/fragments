import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, data } = req.body;
    
    console.log('🔍 DEBUG TELEGRAM API:', {
      action,
      timestamp: new Date().toISOString(),
      data: data || 'No data provided'
    });

    switch (action) {
      case 'check_telegram_webapp':
        console.log('📱 Checking Telegram WebApp data:', data);
        res.status(200).json({
          success: true,
          message: 'Telegram WebApp data logged',
          hasTelegram: !!data.hasTelegram,
          hasUser: !!data.user,
          userData: data.user || null
        });
        break;

      case 'auth_attempt':
        console.log('🔐 Auth attempt:', {
          telegramId: data.telegramId,
          firstName: data.firstName,
          hasHash: !!data.hash
        });
        res.status(200).json({
          success: true,
          message: 'Auth attempt logged'
        });
        break;

      case 'auth_success':
        console.log('✅ Auth success:', {
          telegramId: data.telegramId,
          userId: data.userId,
          sessionToken: data.sessionToken ? 'Present' : 'Missing'
        });
        res.status(200).json({
          success: true,
          message: 'Auth success logged'
        });
        break;

      case 'auth_error':
        console.log('❌ Auth error:', {
          error: data.error,
          telegramId: data.telegramId,
          details: data.details
        });
        res.status(200).json({
          success: true,
          message: 'Auth error logged'
        });
        break;

      case 'api_request':
        console.log('📡 API request:', {
          endpoint: data.endpoint,
          method: data.method,
          status: data.status,
          response: data.response
        });
        res.status(200).json({
          success: true,
          message: 'API request logged'
        });
        break;

      default:
        console.log('❓ Unknown debug action:', action);
        res.status(400).json({ error: 'Unknown action' });
    }

  } catch (error) {
    console.error('💥 Debug API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 