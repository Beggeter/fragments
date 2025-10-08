// Тест daily bonus с тестовым пользователем для админов
const BASE_URL = 'http://localhost:3000';
const TEST_TELEGRAM_ID = '610936383';

async function testDailyBonusAdmin() {
  

  try {
    // Тест 0: Сбрасываем состояние бонуса
    
    const resetResponse = await fetch(`${BASE_URL}/api/admin/reset-test-bonus`, {
      method: 'POST'
    });
    
    if (resetResponse.ok) {
      
    } else {
      
    }

    // Тест 1: Проверяем API daily bonus без авторизации
    
    const response = await fetch(`${BASE_URL}/api/users/${TEST_TELEGRAM_ID}/bonus`);
    const data = await response.json();
    
    
    
    
    if (data.weeks && data.weeks.length > 0) {
      
      
      
      
    } else {
      
    }

    // Тест 2: Проверяем получение бонуса
    
    const claimResponse = await fetch(`${BASE_URL}/api/users/${TEST_TELEGRAM_ID}/bonus`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const claimData = await claimResponse.json();
    
    

    if (claimData.success) {
      
    } else {
      
    }

    // Тест 3: Проверяем обновленное состояние
    
    const updatedResponse = await fetch(`${BASE_URL}/api/users/${TEST_TELEGRAM_ID}/bonus`);
    const updatedData = await updatedResponse.json();
    
    
    

    
    
    
    
    

  } catch (error) {
    
  }
}

testDailyBonusAdmin(); 