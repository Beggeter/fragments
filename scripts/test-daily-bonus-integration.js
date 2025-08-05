// Тест интеграции ежедневных бонусов
const BASE_URL = 'http://localhost:3000';
const TEST_TELEGRAM_ID = '123456789';

async function testIntegration() {
  console.log('🧪 Testing Daily Bonus Integration...\n');

  try {
    // Тест 1: Проверяем, что сервер запущен
    console.log('1. Checking if server is running...');
    const healthResponse = await fetch(`${BASE_URL}`);
    if (healthResponse.ok) {
      console.log('✅ Server is running');
    } else {
      console.log('❌ Server is not responding');
      return;
    }

    // Тест 2: Проверяем API бонусов
    console.log('\n2. Testing bonus API...');
    const bonusResponse = await fetch(`${BASE_URL}/api/users/${TEST_TELEGRAM_ID}/bonus`);
    const bonusData = await bonusResponse.json();
    
    console.log('Status:', bonusResponse.status);
    if (bonusResponse.ok) {
      console.log('✅ Bonus API is working');
      console.log('Current week:', bonusData.state.currentWeek);
      console.log('Current day:', bonusData.state.currentDay);
      console.log('Can claim today:', bonusData.state.canClaimToday);
    } else {
      console.log('❌ Bonus API error:', bonusData.error);
    }

    // Тест 3: Проверяем фронтенд (если доступен)
    console.log('\n3. Testing frontend...');
    try {
      const frontendResponse = await fetch(`${BASE_URL}`);
      if (frontendResponse.ok) {
        console.log('✅ Frontend is accessible');
      } else {
        console.log('❌ Frontend is not accessible');
      }
    } catch (error) {
      console.log('❌ Frontend error:', error.message);
    }

    console.log('\n🎉 Integration test completed!');
    console.log('\nNext steps:');
    console.log('1. Open http://localhost:3000 in your browser');
    console.log('2. Click on "Daily Bonus" button');
    console.log('3. Test claiming bonuses');
    console.log('4. Test Zen subscription flow');

  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
  }
}

testIntegration(); 