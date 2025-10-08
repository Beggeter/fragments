// Используем встроенный fetch (Node.js 18+)

const BASE_URL = 'http://localhost:3000';
const TEST_TELEGRAM_ID = '123456789'; // Замените на реальный telegram ID для тестирования

async function testDailyBonusAPI() {
  

  try {
    // Тест 1: GET - получение состояния бонусов
    
    const getResponse = await fetch(`${BASE_URL}/api/users/${TEST_TELEGRAM_ID}/bonus`);
    const getData = await getResponse.json();
    
    
    
    

    if (getResponse.ok && getData.canClaimToday) {
      // Тест 2: POST - получение бонуса (только если можно получить сегодня)
      
      const postResponse = await fetch(`${BASE_URL}/api/users/${TEST_TELEGRAM_ID}/bonus`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const postData = await postResponse.json();
      
      
      
      

      // Тест 3: Повторная попытка получить бонус (должна вернуть ошибку)
      
      const postResponse2 = await fetch(`${BASE_URL}/api/users/${TEST_TELEGRAM_ID}/bonus`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const postData2 = await postResponse2.json();
      
      
      
    } else {
      
    }

    // Тест 4: GET после получения бонуса
    
    const getResponse2 = await fetch(`${BASE_URL}/api/users/${TEST_TELEGRAM_ID}/bonus`);
    const getData2 = await getResponse2.json();
    
    
    

  } catch (error) {
    
  }
}

// Проверяем, что сервер запущен
async function checkServer() {
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    if (response.ok) {
      
      return true;
    }
  } catch (error) {
    
    
    return false;
  }
}

async function main() {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await testDailyBonusAPI();
  }
}

main(); 