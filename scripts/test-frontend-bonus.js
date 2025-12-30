// Тест фронтенда daily bonus
const BASE_URL = 'http://localhost:3000';

async function testFrontendBonus() {
  

  try {
    // Тест 1: Проверяем главную страницу
    
    const mainPageResponse = await fetch(`${BASE_URL}`);
    
    
    if (mainPageResponse.ok) {
      
      
      const html = await mainPageResponse.text();
      
      // Проверяем, есть ли Daily Bonus кнопка
      if (html.includes('Daily Bonus') || html.includes('daily-bonus') || html.includes('bonus')) {
        
      } else {
        
      }
      
      // Проверяем, есть ли React компоненты
      if (html.includes('__NEXT_DATA__')) {
        
      } else {
        
      }
      
    } else {
      
    }

    // Тест 2: Проверяем, есть ли ошибки в консоли (имитируем)
    
    
    // Тест с отсутствующим currentWeek
    const brokenData = {
      weeks: [],
      currentDay: 1,
      canClaimToday: true,
      todayReward: null
      // currentWeek отсутствует!
    };
    
    
    
    
    
    // Тест с undefined currentWeek
    const undefinedData = {
      weeks: [],
      currentWeek: undefined,
      currentDay: 1,
      canClaimToday: true,
      todayReward: null
    };
    
    
    
    

    

  } catch (error) {
    
  }
}

testFrontendBonus(); 