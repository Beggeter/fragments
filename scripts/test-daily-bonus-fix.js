// Тест исправлений daily bonus
const BASE_URL = 'http://localhost:3000';
const TEST_TELEGRAM_ID = '610936383';

async function testDailyBonusFix() {
  console.log('🧪 Testing Daily Bonus Fix...\n');

  try {
    // Тест 1: Проверяем GET запрос
    console.log('1. Testing GET /api/users/[telegramId]/bonus');
    const getResponse = await fetch(`${BASE_URL}/api/users/${TEST_TELEGRAM_ID}/bonus`);
    const getData = await getResponse.json();
    
    console.log('Status:', getResponse.status);
    if (getResponse.ok) {
      console.log('✅ GET request successful');
      console.log('Response structure:', {
        hasWeeks: !!getData.weeks,
        hasCurrentWeek: typeof getData.currentWeek === 'number',
        hasCurrentDay: typeof getData.currentDay === 'number',
        hasCanClaimToday: typeof getData.canClaimToday === 'boolean',
        weeksLength: getData.weeks?.length || 0,
        firstWeekDays: getData.weeks?.[0]?.days?.length || 0
      });
      
      // Проверяем структуру данных
      if (getData.weeks && Array.isArray(getData.weeks)) {
        console.log('✅ Weeks array is valid');
        if (getData.weeks.length > 0) {
          const firstWeek = getData.weeks[0];
          console.log('First week structure:', {
            week: firstWeek.week,
            daysLength: firstWeek.days?.length || 0,
            firstDay: firstWeek.days?.[0] ? {
              day: firstWeek.days[0].day,
              regularType: firstWeek.days[0].regular?.type,
              premiumType: firstWeek.days[0].premium?.type
            } : null
          });
        }
      } else {
        console.log('❌ Weeks array is invalid');
      }
    } else {
      console.log('❌ GET request failed:', getData.error);
    }

    // Тест 2: Проверяем POST запрос (если можно получить бонус)
    if (getResponse.ok && getData.canClaimToday) {
      console.log('\n2. Testing POST /api/users/[telegramId]/bonus');
      const postResponse = await fetch(`${BASE_URL}/api/users/${TEST_TELEGRAM_ID}/bonus`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const postData = await postResponse.json();
      
      console.log('Status:', postResponse.status);
      if (postResponse.ok) {
        console.log('✅ POST request successful');
        console.log('Response:', postData);
      } else {
        console.log('❌ POST request failed:', postData.error);
      }
    } else {
      console.log('\n2. Skipping POST test - cannot claim bonus today');
    }

    console.log('\n🎉 Daily Bonus Fix test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testDailyBonusFix(); 