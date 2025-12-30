const fs = require('fs');

// Читаем пароль из файла
const passwordData = fs.readFileSync('admin-password.txt', 'utf8');
const passwordMatch = passwordData.match(/Password: (\d+)/);
const expiresMatch = passwordData.match(/Expires: (.+)/);

if (!passwordMatch || !expiresMatch) {
  
  process.exit(1);
}

const password = passwordMatch[1];
const expiresAt = new Date(expiresMatch[1]);



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
    
    
  });
});

req.on('error', (err) => {
  
});

req.end(); 