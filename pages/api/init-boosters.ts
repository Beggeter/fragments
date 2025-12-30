import { NextApiRequest, NextApiResponse } from 'next';
import { BoosterService } from '@/lib/db/services';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Только в dev режиме
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ error: 'Only available in development' });
  }

  try {
    
    await BoosterService.initializeDefaultBoosters();
    
    
    return res.status(200).json({ 
      success: true, 
      message: 'Default boosters initialized successfully' 
    });
  } catch (error) {
    
    return res.status(500).json({ 
      error: 'Failed to initialize boosters',
      details: error
    });
  }
} 