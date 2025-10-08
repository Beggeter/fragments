// Отладка состояния бонусов
const BASE_URL = 'http://localhost:3000';
const TEST_TELEGRAM_ID = '610936383';

async function debugBonusState() {
  

  try {
    const response = await fetch(`${BASE_URL}/api/users/${TEST_TELEGRAM_ID}/bonus`);
    const data = await response.json();
    
    
    
    
    
    
    
    
    
    
    
    
    
    

  } catch (error) {
    
  }
}

debugBonusState(); 