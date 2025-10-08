const { UserService } = require('../lib/db/services');

async function checkUserRole() {
  try {
    const user = await UserService.getUserByTelegramId('610936383');
    
    
  } catch (error) {
    
  }
}

checkUserRole(); 