import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!botToken) {
      return res.status(200).json({
        success: false,
        error: 'Bot token not configured',
        hasToken: false
      });
    }

    // Проверяем формат токена (должен быть в формате 1234567890:ABCdefGHIjklMNOpqrsTUVwxyz)
    const tokenParts = botToken.split(':');
    const isValidFormat = tokenParts.length === 2 && 
                         tokenParts[0].length >= 8 && 
                         tokenParts[1].length >= 20;

    // Проверяем доступность бота через Telegram API
    let botInfo = null;
    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
      if (response.ok) {
        botInfo = await response.json();
      }
    } catch (error) {
      console.error('Error checking bot:', error);
    }

    const result = {
      success: true,
      hasToken: true,
      tokenLength: botToken.length,
      tokenFormat: isValidFormat ? 'valid' : 'invalid',
      tokenStart: botToken.substring(0, 10) + '...',
      tokenEnd: '...' + botToken.substring(botToken.length - 10),
      botInfo: botInfo?.ok ? {
        id: botInfo.result.id,
        name: botInfo.result.first_name,
        username: botInfo.result.username,
        canJoinGroups: botInfo.result.can_join_groups,
        canReadAllGroupMessages: botInfo.result.can_read_all_group_messages,
        supportsInlineQueries: botInfo.result.supports_inline_queries
      } : null,
      botApiResponse: botInfo
    };

    ;
    
    res.status(200).json(result);

  } catch (error) {
    console.error('💥 BOT TOKEN TEST: Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 