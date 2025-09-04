// Тест исправления проблемы с бустером whirlwind в daily bonus
const BASE_URL = 'http://localhost:3000';
const TEST_TELEGRAM_ID = '610936383';

async function testWhirlwindFix() {
  ;

  try {
    // Тест 1: Проверяем API daily bonus
    ;
    const response = await fetch(`${BASE_URL}/api/users/${TEST_TELEGRAM_ID}/bonus`);
    const data = await response.json();
    
    ;
    ;
    
    if (data.weeks && data.weeks.length > 0) {
      ;
      
      // Проверяем, есть ли бустер whirlwind в конфигурации
      const hasWhirlwind = data.weeks.some(week => 
        week.days.some(day => 
          day.regular.name === 'whirlwind' || day.premium.name === 'whirlwind'
        )
      );
      
      if (hasWhirlwind) {
        ;
      } else {
        ;
      }
    } else {
      ;
    }

    // Тест 2: Проверяем бустеры в базе данных
    ;
    const boostersResponse = await fetch(`${BASE_URL}/api/users/${TEST_TELEGRAM_ID}/boosters`);
    const boostersData = await boostersResponse.json();
    
    ;
    
    if (boostersData.availableBoosters) {
      const whirlwindBooster = boostersData.availableBoosters.find(b => b.name === 'whirlwind');
      if (whirlwindBooster) {
        ;
      } else {
        ;
        ;
      }
    } else {
      ;
    }

    // Тест 3: Симулируем получение daily bonus
    ;
    
    const testReward = {
      type: 'booster',
      name: 'whirlwind',
      quantity: 1
    };
    
    ;
    ;

    ;
    ;
    ;
    ;
    ;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testWhirlwindFix(); 