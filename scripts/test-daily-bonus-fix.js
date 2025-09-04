// Тест исправлений daily bonus
const BASE_URL = 'http://localhost:3000';
const TEST_TELEGRAM_ID = '610936383';

async function testDailyBonusFix() {
  ;

  try {
    // Тест 1: Проверяем GET запрос
    ;
    const getResponse = await fetch(`${BASE_URL}/api/users/${TEST_TELEGRAM_ID}/bonus`);
    const getData = await getResponse.json();
    
    ;
    if (getResponse.ok) {
      ;
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
        ;
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
        ;
      }
    } else {
      ;
    }

    // Тест 2: Проверяем POST запрос (если можно получить бонус)
    if (getResponse.ok && getData.canClaimToday) {
      ;
      const postResponse = await fetch(`${BASE_URL}/api/users/${TEST_TELEGRAM_ID}/bonus`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const postData = await postResponse.json();
      
      ;
      if (postResponse.ok) {
        ;
        ;
      } else {
        ;
      }
    } else {
      ;
    }

    ;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testDailyBonusFix(); 