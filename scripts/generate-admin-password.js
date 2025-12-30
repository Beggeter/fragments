const crypto = require('crypto');

// Генерируем случайный 6-значный пароль
const password = Math.floor(100000 + Math.random() * 900000).toString();
const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 часов







// Сохраняем в файл для удобства
const fs = require('fs');
fs.writeFileSync('admin-password.txt', `Password: ${password}\nExpires: ${expiresAt.toISOString()}\n`);
 