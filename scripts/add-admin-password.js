const fs = require('fs');

// Читаем пароль из файла
const passwordData = fs.readFileSync('admin-password.txt', 'utf8');
const passwordMatch = passwordData.match(/Password: (\d+)/);
const expiresMatch = passwordData.match(/Expires: (.+)/);

if (!passwordMatch || !expiresMatch) {
  console.error('❌ Не удалось прочитать пароль из файла');
  process.exit(1);
}

const password = passwordMatch[1];
const expiresAt = new Date(expiresMatch[1]);

console.log('🔐 Добавляем пароль в активные:', { password, expiresAt: expiresAt.toISOString() });

// Отправляем запрос на сервер для генерации пароля
const https = require('https');
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/admin/generate-password',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  }
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('✅ Пароль добавлен на сервер');
    console.log('📝 Ответ сервера:', data);
  });
});

req.on('error', (err) => {
  console.error('❌ Ошибка при добавлении пароля:', err.message);
});

req.end(); 