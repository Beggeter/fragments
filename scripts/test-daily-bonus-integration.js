// Тест интеграции ежедневных бонусов
const BASE_URL = 'http://localhost:3000';
const TEST_TELEGRAM_ID = '123456789';

async function testIntegration() {
  ;

  try {
    // Тест 1: Проверяем, что сервер запущен
    ;
    const healthResponse = await fetch(`${BASE_URL}`);
    if (healthResponse.ok) {
      ;
    } else {
      ;
      return;
    }

    // Тест 2: Проверяем API бонусов
    ;
    const bonusResponse = await fetch(`${BASE_URL}/api/users/${TEST_TELEGRAM_ID}/bonus`);
    const bonusData = await bonusResponse.json();
    
    ;
    if (bonusResponse.ok) {
      ;
      ;
      ;
      ;
    } else {
      ;
    }

    // Тест 3: Проверяем фронтенд (если доступен)
    ;
    try {
      const frontendResponse = await fetch(`${BASE_URL}`);
      if (frontendResponse.ok) {
        ;
      } else {
        ;
      }
    } catch (error) {
      ;
    }

    ;
    ;
    ;
    ;
    ;
    ;

  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
  }
}

testIntegration(); 