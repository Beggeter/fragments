// Используем встроенный fetch (Node.js 18+)

const BASE_URL = 'http://localhost:3000';
const TEST_TELEGRAM_ID = '123456789'; // Замените на реальный telegram ID для тестирования

async function testDailyBonusAPI() {
  console.log('🧪 Testing Daily Bonus API...\n');

  try {
    // Тест 1: GET - получение состояния бонусов
    console.log('1. Testing GET /api/users/[telegramId]/bonus');
    const getResponse = await fetch(`${BASE_URL}/api/users/${TEST_TELEGRAM_ID}/bonus`);
    const getData = await getResponse.json();
    
    console.log('Status:', getResponse.status);
    console.log('Response:', JSON.stringify(getData, null, 2));
    console.log('');

    if (getResponse.ok && getData.canClaimToday) {
      // Тест 2: POST - получение бонуса (только если можно получить сегодня)
      console.log('2. Testing POST /api/users/[telegramId]/bonus');
      const postResponse = await fetch(`${BASE_URL}/api/users/${TEST_TELEGRAM_ID}/bonus`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const postData = await postResponse.json();
      
      console.log('Status:', postResponse.status);
      console.log('Response:', JSON.stringify(postData, null, 2));
      console.log('');

      // Тест 3: Повторная попытка получить бонус (должна вернуть ошибку)
      console.log('3. Testing POST again (should fail)');
      const postResponse2 = await fetch(`${BASE_URL}/api/users/${TEST_TELEGRAM_ID}/bonus`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const postData2 = await postResponse2.json();
      
      console.log('Status:', postResponse2.status);
      console.log('Response:', JSON.stringify(postData2, null, 2));
    } else {
      console.log('2. Skipping POST test - cannot claim bonus today');
    }

    // Тест 4: GET после получения бонуса
    console.log('\n4. Testing GET after claiming bonus');
    const getResponse2 = await fetch(`${BASE_URL}/api/users/${TEST_TELEGRAM_ID}/bonus`);
    const getData2 = await getResponse2.json();
    
    console.log('Status:', getResponse2.status);
    console.log('Response:', JSON.stringify(getData2, null, 2));

  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }
}

// Проверяем, что сервер запущен
async function checkServer() {
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    if (response.ok) {
      console.log('✅ Server is running');
      return true;
    }
  } catch (error) {
    console.log('❌ Server is not running. Please start the development server first:');
    console.log('   npm run dev');
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