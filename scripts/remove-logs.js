const fs = require('fs');
const path = require('path');

// Файлы, которые нужно очистить от логов
const filesToClean = [
  'app/page.tsx',
  'components/GameBoard.tsx',
  'components/ShopScreen.tsx',
  'components/TelegramLogin.tsx',
  'components/LeaderboardScreen.tsx',
  'hooks/useUser.ts',
  'hooks/useGameSave.ts',
  'hooks/useGameLogger.ts',
  'hooks/useAdminAuth.ts',
  'lib/utils/logger.ts',
  'lib/db/services/currencyService.ts',
  'lib/core/blockGenerator.ts'
];

// Файлы API, которые нужно очистить от логов (оставляем только console.error)
const apiFilesToClean = [
  'pages/api/auth/telegram.ts',
  'pages/api/admin/auth/telegram.ts',
  'pages/api/users/[telegramId]/game.ts',
  'pages/api/users/[telegramId]/game-sync.ts',
  'pages/api/users/[telegramId]/boosters.ts',
  'pages/api/users/[telegramId]/currency.ts',
  'pages/api/telegram.ts',
  'pages/api/telegram-webhook.ts',
  'pages/api/leaderboard.ts',
  'pages/api/payment/create-invoice.ts'
];

function removeConsoleLogs(content) {
  // Удаляем console.log строки
  content = content.replace(/^\s*console\.log\([^)]*\);?\s*$/gm, '');
  // Удаляем многострочные console.log
  content = content.replace(/^\s*console\.log\([\s\S]*?\);?\s*$/gm, '');
  // Удаляем console.log с комментариями
  content = content.replace(/^\s*\/\/.*console\.log.*$/gm, '');
  return content;
}

function removeConsoleLogsKeepErrors(content) {
  // Удаляем только console.log, оставляем console.error
  content = content.replace(/^\s*console\.log\([^)]*\);?\s*$/gm, '');
  content = content.replace(/^\s*console\.log\([\s\S]*?\);?\s*$/gm, '');
  return content;
}

function cleanFile(filePath) {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    if (!fs.existsSync(fullPath)) {
      console.log(`File not found: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    const originalContent = content;

    if (apiFilesToClean.includes(filePath)) {
      content = removeConsoleLogsKeepErrors(content);
    } else {
      content = removeConsoleLogs(content);
    }

    // Удаляем пустые строки
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');

    if (content !== originalContent) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ Cleaned: ${filePath}`);
    } else {
      console.log(`⏭️  No changes: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error cleaning ${filePath}:`, error.message);
  }
}

console.log('🧹 Starting log cleanup...\n');

// Очищаем основные файлы
filesToClean.forEach(cleanFile);

console.log('\n🔧 Cleaning API files (keeping console.error)...\n');

// Очищаем API файлы
apiFilesToClean.forEach(cleanFile);

console.log('\n✅ Log cleanup completed!'); 