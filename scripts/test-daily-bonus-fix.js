// Тест исправлений daily bonus
const BASE_URL = 'http://localhost:3000';
const TEST_TELEGRAM_ID = '610936383';

async function testDailyBonusFix() {
  

  try {
    // Тест 1: Проверяем GET запрос
    
    const getResponse = await fetch(`${BASE_URL}/api/users/${TEST_TELEGRAM_ID}/bonus`);
    const getData = await getResponse.json();
    
    
    if (getResponse.ok) {
      
      
      
      // Проверяем структуру данных
      if (getData.weeks && Array.isArray(getData.weeks)) {
        
        if (getData.weeks.length > 0) {
          const firstWeek = getData.weeks[0];
          
        }
      } else {
        
      }
    } else {
      
    }

    // Тест 2: Проверяем POST запрос (если можно получить бонус)
    if (getResponse.ok && getData.canClaimToday) {
      
      const postResponse = await fetch(`${BASE_URL}/api/users/${TEST_TELEGRAM_ID}/bonus`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const postData = await postResponse.json();
      
      
      if (postResponse.ok) {
        
        
      } else {
        
      }
    } else {
      
    }

    

  } catch (error) {
    
  }
}

testDailyBonusFix(); 