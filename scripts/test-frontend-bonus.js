// Тест фронтенда daily bonus
const BASE_URL = 'http://localhost:3000';

async function testFrontendBonus() {
  console.log('🧪 Testing Frontend Daily Bonus...\n');

  try {
    // Тест 1: Проверяем главную страницу
    console.log('1. Testing main page...');
    const mainPageResponse = await fetch(`${BASE_URL}`);
    
    console.log('Status:', mainPageResponse.status);
    if (mainPageResponse.ok) {
      console.log('✅ Main page loads successfully');
      
      const html = await mainPageResponse.text();
      
      // Проверяем, есть ли Daily Bonus кнопка
      if (html.includes('Daily Bonus') || html.includes('daily-bonus') || html.includes('bonus')) {
        console.log('✅ Daily Bonus button found in HTML');
      } else {
        console.log('❌ Daily Bonus button not found in HTML');
      }
      
      // Проверяем, есть ли React компоненты
      if (html.includes('__NEXT_DATA__')) {
        console.log('✅ Next.js app detected');
      } else {
        console.log('❌ Next.js app not detected');
      }
      
    } else {
      console.log('❌ Main page failed to load');
    }

    // Тест 2: Проверяем, есть ли ошибки в консоли (имитируем)
    console.log('\n2. Simulating frontend error scenarios...');
    
    // Тест с отсутствующим currentWeek
    const brokenData = {
      weeks: [],
      currentDay: 1,
      canClaimToday: true,
      todayReward: null
      // currentWeek отсутствует!
    };
    
    console.log('Testing with missing currentWeek:', brokenData);
    console.log('currentWeek value:', brokenData.currentWeek);
    console.log('Type of currentWeek:', typeof brokenData.currentWeek);
    
    // Тест с undefined currentWeek
    const undefinedData = {
      weeks: [],
      currentWeek: undefined,
      currentDay: 1,
      canClaimToday: true,
      todayReward: null
    };
    
    console.log('Testing with undefined currentWeek:', undefinedData);
    console.log('currentWeek value:', undefinedData.currentWeek);
    console.log('Type of currentWeek:', typeof undefinedData.currentWeek);

    console.log('\n🎉 Frontend test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFrontendBonus(); 