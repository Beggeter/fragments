// Тест daily bonus с авторизацией
const BASE_URL = 'http://localhost:3000';
const TEST_TELEGRAM_ID = '610936383';

async function testDailyBonusWithAuth() {
  console.log('🧪 Testing Daily Bonus with Authorization...\n');

  try {
    // Тест 1: Проверяем GET запрос БЕЗ авторизации
    console.log('1. Testing GET /api/users/[telegramId]/bonus WITHOUT auth');
    const getResponseNoAuth = await fetch(`${BASE_URL}/api/users/${TEST_TELEGRAM_ID}/bonus`);
    const getDataNoAuth = await getResponseNoAuth.json();
    
    console.log('Status:', getResponseNoAuth.status);
    if (getResponseNoAuth.ok) {
      console.log('✅ GET request WITHOUT auth successful');
    } else {
      console.log('❌ GET request WITHOUT auth failed:', getDataNoAuth.error);
    }

    // Тест 2: Проверяем GET запрос С авторизацией
    console.log('\n2. Testing GET /api/users/[telegramId]/bonus WITH auth');
    const getResponseWithAuth = await fetch(`${BASE_URL}/api/users/${TEST_TELEGRAM_ID}/bonus`, {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });
    const getDataWithAuth = await getResponseWithAuth.json();
    
    console.log('Status:', getResponseWithAuth.status);
    if (getResponseWithAuth.ok) {
      console.log('✅ GET request WITH auth successful');
    } else {
      console.log('❌ GET request WITH auth failed:', getDataWithAuth.error);
    }

    // Тест 3: Проверяем структуру данных
    if (getResponseNoAuth.ok) {
      console.log('\n3. Checking data structure...');
      console.log('Full response:', JSON.stringify(getDataNoAuth, null, 2));
      
      // Проверяем, что все необходимые поля присутствуют
      const requiredFields = ['weeks', 'currentWeek', 'currentDay', 'canClaimToday'];
      const missingFields = requiredFields.filter(field => !(field in getDataNoAuth));
      
      if (missingFields.length === 0) {
        console.log('✅ All required fields present');
      } else {
        console.log('❌ Missing fields:', missingFields);
      }
    }

    console.log('\n🎉 Daily Bonus Auth test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testDailyBonusWithAuth(); 