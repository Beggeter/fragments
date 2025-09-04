// Тест daily bonus с авторизацией
const BASE_URL = 'http://localhost:3000';
const TEST_TELEGRAM_ID = '610936383';

async function testDailyBonusWithAuth() {
  ;

  try {
    // Тест 1: Проверяем GET запрос БЕЗ авторизации
    ;
    const getResponseNoAuth = await fetch(`${BASE_URL}/api/users/${TEST_TELEGRAM_ID}/bonus`);
    const getDataNoAuth = await getResponseNoAuth.json();
    
    ;
    if (getResponseNoAuth.ok) {
      ;
    } else {
      ;
    }

    // Тест 2: Проверяем GET запрос С авторизацией
    ;
    const getResponseWithAuth = await fetch(`${BASE_URL}/api/users/${TEST_TELEGRAM_ID}/bonus`, {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    const getDataWithAuth = await getResponseWithAuth.json();
    
    ;
    if (getResponseWithAuth.ok) {
      ;
    } else {
      ;
    }

    // Тест 3: Проверяем структуру данных
    if (getResponseNoAuth.ok) {
      ;
      ;
      
      // Проверяем, что все необходимые поля присутствуют
      const requiredFields = ['weeks', 'currentWeek', 'currentDay', 'canClaimToday'];
      const missingFields = requiredFields.filter(field => !(field in getDataNoAuth));
      
      if (missingFields.length === 0) {
        ;
      } else {
        ;
      }
    }

    ;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testDailyBonusWithAuth(); 