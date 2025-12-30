// Финальный тест исправлений
const BASE_URL = 'http://localhost:3000';
const TEST_TELEGRAM_ID = '610936383';

async function testFinalFix() {
  

  try {
    // Тест 1: Проверяем API
    
    const response = await fetch(`${BASE_URL}/api/users/${TEST_TELEGRAM_ID}/bonus`);
    const data = await response.json();
    
    
    
    
    
    
    // Проверяем, что все поля присутствуют
    const requiredFields = ['weeks', 'currentWeek', 'currentDay', 'canClaimToday'];
    const missingFields = requiredFields.filter(field => !(field in data));
    
    if (missingFields.length === 0) {
      
    } else {
      
    }

    // Тест 2: Симулируем проблемные данные
    
    
    const problematicData = {
      weeks: data.weeks,
      currentDay: data.currentDay,
      canClaimToday: data.canClaimToday,
      todayReward: data.todayReward
      // currentWeek отсутствует!
    };
    
    
    
    
    

    // Тест 3: Проверяем логику компонента
    
    
    const currentWeek = problematicData.currentWeek ?? 1;
    const currentWeekData = data.weeks.find(w => w.week === currentWeek);
    
    
    
    
    if (currentWeekData) {
      
    } else {
      
    }

    
    
    
    
    

  } catch (error) {
    
  }
}

testFinalFix(); 