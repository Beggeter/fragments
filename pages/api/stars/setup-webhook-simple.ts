import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Разрешаем только POST запросы
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed. Use POST with botToken and webhookUrl in body.' 
    });
  }

  try {
    const { botToken, webhookUrl } = req.body;

    // Проверяем обязательные параметры
    if (!botToken) {
      return res.status(400).json({ error: 'botToken is required' });
    }

    if (!webhookUrl) {
      return res.status(400).json({ error: 'webhookUrl is required' });
    }

    console.log('🔗 Setting up webhook:', { webhookUrl, botToken: botToken.substring(0, 10) + '...' });

    // Отправляем запрос к Telegram API для настройки webhook
    const response = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['pre_checkout_query', 'successful_payment']
      })
    });

    const data = await response.json();

    if (data.ok) {
      console.log('✅ Webhook set successfully');

      // Получаем дополнительную информацию о webhook
      const infoResponse = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
      const infoData = await infoResponse.json();

      return res.status(200).json({
        success: true,
        message: 'Webhook set successfully',
        webhookUrl,
        webhookInfo: infoData.ok ? infoData.result : null
      });

    } else {
      console.error('❌ Failed to set webhook:', data);
      return res.status(400).json({
        success: false,
        error: data.description || 'Failed to set webhook',
        telegramError: data
      });
    }

  } catch (error: any) {
    console.error('❌ Error setting up webhook:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
} 