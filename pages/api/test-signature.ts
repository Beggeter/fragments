import { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { testData, botToken } = req.body;
    
    console.log('🧪 TEST SIGNATURE: Testing with data:', testData);
    
    // Создаем строку для проверки
    const dataCheckString = Object.keys(testData)
      .filter(key => {
        const value = testData[key];
        return key !== 'hash' && value !== undefined && value !== null && value !== '';
      })
      .sort()
      .map(key => `${key}=${testData[key]}`)
      .join('\n');

    console.log('📝 TEST SIGNATURE: Data check string:', dataCheckString);

    // Создаем секретный ключ
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    
    // Вычисляем хеш
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    
    const result = {
      calculatedHash,
      receivedHash: testData.hash,
      isValid: calculatedHash === testData.hash,
      dataCheckString,
      secretKeyLength: secretKey.length
    };

    console.log('🔐 TEST SIGNATURE: Result:', result);
    
    res.status(200).json(result);

  } catch (error) {
    console.error('💥 TEST SIGNATURE: Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 