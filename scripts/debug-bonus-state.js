// Отладка состояния бонусов
const BASE_URL = 'http://localhost:3000';
const TEST_TELEGRAM_ID = '610936383';

async function debugBonusState() {
  console.log('🔍 Debugging Bonus State...\n');

  try {
    const response = await fetch(`${BASE_URL}/api/users/${TEST_TELEGRAM_ID}/bonus`);
    const data = await response.json();
    
    console.log('Full API Response:');
    console.log(JSON.stringify(data, null, 2));
    
    console.log('\nChecking specific fields:');
    console.log('currentWeek:', data.currentWeek);
    console.log('currentDay:', data.currentDay);
    console.log('canClaimToday:', data.canClaimToday);
    console.log('todayReward:', data.todayReward);
    console.log('weeks length:', data.weeks?.length);
    
    console.log('\nChecking if currentWeek is undefined:', data.currentWeek === undefined);
    console.log('Checking if currentWeek is null:', data.currentWeek === null);
    console.log('Type of currentWeek:', typeof data.currentWeek);

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugBonusState(); 