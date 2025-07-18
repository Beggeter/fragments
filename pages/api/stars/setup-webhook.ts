import { NextApiRequest, NextApiResponse } from 'next';
import TelegramBot from 'node-telegram-bot-api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { webhookUrl } = req.body;

    if (!webhookUrl) {
      return res.status(400).json({ error: 'webhookUrl is required' });
    }

    if (!process.env.STARS_BOT_TOKEN) {
      return res.status(500).json({ error: 'STARS_BOT_TOKEN not configured' });
    }

    // Создаем бота
    const bot = new TelegramBot(process.env.STARS_BOT_TOKEN, { polling: false });

    try {
      console.log('🔗 Setting up Stars webhook:', webhookUrl);

      // Устанавливаем webhook
      const result = await bot.setWebhook(webhookUrl);

      if (result) {
        console.log('✅ Stars webhook set successfully');
        
        // Получаем информацию о webhook
        const webhookInfo = await bot.getWebhookInfo();
        
        return res.status(200).json({
          success: true,
          message: 'Webhook set successfully',
          webhookInfo
        });
      } else {
        return res.status(500).json({
          success: false,
          error: 'Failed to set webhook'
        });
      }

    } finally {
      bot.close();
    }

  } catch (error: any) {
    console.error('❌ Error setting up Stars webhook:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
} 