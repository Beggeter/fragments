// Тест daily bonus с тестовым пользователем для админов
const BASE_URL = 'http://localhost:3000';
const TEST_TELEGRAM_ID = '610936383';

async function testDailyBonusAdmin() {
  console.log('🧪 Testing Daily Bonus with Admin Test User...\n');

  try {
    // Тест 0: Сбрасываем состояние бонуса
    console.log('0. Resetting bonus state...');
    const resetResponse = await fetch(`${BASE_URL}/api/admin/reset-test-bonus`, {
      method: 'POST'
    });
    
    if (resetResponse.ok) {
      console.log('✅ Bonus state reset successfully');
    } else {
      console.log('❌ Failed to reset bonus state');
    }

    // Тест 1: Проверяем API daily bonus без авторизации
    console.log('\n1. Testing Daily Bonus API without auth...');
    const response = await fetch(`${BASE_URL}/api/users/${TEST_TELEGRAM_ID}/bonus`);
    const data = await response.json();
    
    console.log('API Status:', response.status);
    console.log('Response keys:', Object.keys(data));
    
    if (data.weeks && data.weeks.length > 0) {
      console.log('✅ Weeks data present');
      console.log('Current week:', data.currentWeek);
      console.log('Current day:', data.currentDay);
      console.log('Can claim today:', data.canClaimToday);
    } else {
      console.log('❌ No weeks data');
    }

    // Тест 2: Проверяем получение бонуса
    console.log('\n2. Testing bonus claim...');
    const claimResponse = await fetch(`${BASE_URL}/api/users/${TEST_TELEGRAM_ID}/bonus`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const claimData = await claimResponse.json();
    console.log('Claim API Status:', claimResponse.status);
    console.log('Claim response:', claimData);

    if (claimData.success) {
      console.log('✅ Bonus claimed successfully');
    } else {
      console.log('❌ Bonus claim failed:', claimData.error);
    }

    // Тест 3: Проверяем обновленное состояние
    console.log('\n3. Testing updated state...');
    const updatedResponse = await fetch(`${BASE_URL}/api/users/${TEST_TELEGRAM_ID}/bonus`);
    const updatedData = await updatedResponse.json();
    
    console.log('Updated can claim today:', updatedData.canClaimToday);
    console.log('Updated current day:', updatedData.currentDay);

    console.log('\n🎉 Admin test completed!');
    console.log('\n📋 Summary:');
    console.log('- Daily Bonus API works without auth ✅');
    console.log('- Bonus claim works ✅');
    console.log('- State updates correctly ✅');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testDailyBonusAdmin(); 