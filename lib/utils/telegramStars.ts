/**
 * Простые утилиты для работы с Telegram Stars API
 */

// Проверяем, что мы в Telegram WebApp
export const isTelegramWebApp = (): boolean => {
  return typeof window !== 'undefined' && !!(window as any).Telegram?.WebApp;
};

// Получаем Telegram WebApp объект
export const getTelegramWebApp = () => {
  if (!isTelegramWebApp()) {
    throw new Error('Telegram WebApp not available');
  }
  return (window as any).Telegram.WebApp;
};

// Получаем ID пользователя из Telegram WebApp
export const getTelegramUserId = (): number | null => {
  try {
    const webApp = getTelegramWebApp();
    return webApp?.initDataUnsafe?.user?.id || null;
  } catch (error) {
    console.error('Failed to get Telegram user ID:', error);
    return null;
  }
};

// Получаем данные пользователя из Telegram WebApp
export const getTelegramUser = () => {
  try {
    const webApp = getTelegramWebApp();
    return webApp?.initDataUnsafe?.user || null;
  } catch (error) {
    console.error('Failed to get Telegram user:', error);
    return null;
  }
};

// Форматирует цену для Telegram Stars (в минимальных единицах)
export const formatStarsPrice = (price: number): number => {
  // 1 Star = 100 минимальных единиц
  return Math.round(price * 100);
};

// Создает compact payload для экономии места
export const createCompactPayload = (data: Record<string, any>): string => {
  const compactData: Record<string, any> = {};
  
  // Маппинг длинных ключей на короткие
  const keyMapping: Record<string, string> = {
    userId: 'u',
    itemType: 't',
    itemId: 'i',
    quantity: 'q',
    amount: 'a',
    price: 'p',
    metadata: 'm'
  };

  for (const [key, value] of Object.entries(data)) {
    const shortKey = keyMapping[key] || key;
    compactData[shortKey] = value;
  }

  return JSON.stringify(compactData);
};

// Проверяет размер payload
export const validatePayloadSize = (payload: string, maxSize: number = 128): boolean => {
  const size = new Blob([payload]).size;
  return size <= maxSize;
};

// Fallback: создает инвойс через бота (старый метод)
export const createInvoiceViaBot = async (
  invoice: any
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('🔄 Using fallback method: creating invoice via bot');
    
    const response = await fetch('/api/payment/create-invoice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invoice)
    });

    const data = await response.json();

    if (response.ok && data.success) {
      console.log('✅ Invoice created via bot successfully');
      return { success: true };
    } else {
      throw new Error(data.error || 'Failed to create invoice via bot');
    }

  } catch (error: any) {
    console.error('❌ Error creating invoice via bot:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to create invoice via bot' 
    };
  }
};

// Создает инвойс для покупки осколков
export const createShardsInvoice = async (
  userId: number,
  packAmount: number,
  packPrice: number
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Создаем compact payload
    const payload = createCompactPayload({
      userId,
      itemType: 'shards',
      itemId: packAmount.toString(),
      amount: packAmount,
      price: packPrice
    });

    // Проверяем размер payload
    if (!validatePayloadSize(payload)) {
      throw new Error(`Payload too large: ${new Blob([payload]).size} bytes (max 128)`);
    }

    const invoice = {
      title: `Пакет осколков (${packAmount})`,
      description: `Пополните баланс на ${packAmount} осколков`,
      payload,
      currency: 'XTR', // Telegram Stars
      prices: [{
        label: `${packAmount} осколков`,
        amount: formatStarsPrice(packPrice)
      }],
      need_name: false,
      need_phone_number: false,
      need_email: false,
      need_shipping_address: false,
      is_flexible: false
    };

    return await createTelegramStarsInvoice(invoice);

  } catch (error: any) {
    console.error('❌ Error creating shards invoice:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to create shards invoice' 
    };
  }
};

// Создает инвойс для покупки бустера
export const createBoosterInvoice = async (
  userId: number,
  boosterId: string,
  boosterName: string,
  quantity: number,
  unitPrice: number
): Promise<{ success: boolean; error?: string }> => {
  try {
    const totalPrice = unitPrice * quantity;

    // Создаем compact payload
    const payload = createCompactPayload({
      userId,
      itemType: 'booster',
      itemId: boosterId,
      quantity,
      amount: quantity,
      price: totalPrice
    });

    // Проверяем размер payload
    if (!validatePayloadSize(payload)) {
      throw new Error(`Payload too large: ${new Blob([payload]).size} bytes (max 128)`);
    }

    const invoice = {
      title: `${boosterName} ${quantity > 1 ? `x${quantity}` : ''}`,
      description: `Покупка бустера ${boosterName}${quantity > 1 ? ` в количестве ${quantity} шт.` : ''}`,
      payload,
      currency: 'XTR',
      prices: [{
        label: `${boosterName}${quantity > 1 ? ` x${quantity}` : ''}`,
        amount: formatStarsPrice(totalPrice)
      }],
      need_name: false,
      need_phone_number: false,
      need_email: false,
      need_shipping_address: false,
      is_flexible: false
    };

    return await createTelegramStarsInvoice(invoice);

  } catch (error: any) {
    console.error('❌ Error creating booster invoice:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to create booster invoice' 
    };
  }
};

// Создает инвойс через Telegram Stars API
export const createTelegramStarsInvoice = async (
  invoice: any
): Promise<{ success: boolean; error?: string }> => {
  try {
    const webApp = getTelegramWebApp();
    
    // Проверяем, что mainButton доступен
    if (!webApp?.mainButton) {
      throw new Error('mainButton not available in this Telegram WebApp version');
    }

    // Проверяем версию Telegram WebApp
    const version = webApp.version || '6.0';
    const isVersionSupported = webApp.isVersionAtLeast && webApp.isVersionAtLeast('7.0');
    
    console.log('📱 Telegram WebApp version:', version);
    console.log('🔍 Stars API supported:', isVersionSupported);

    // Проверяем, доступен ли метод showInvoice
    if (!webApp.mainButton.showInvoice) {
      console.warn('⚠️ Stars API not available, trying fallback method');
      return await createInvoiceViaBot(invoice);
    }

    // Создаем инвойс через Telegram Stars API
    const result = await webApp.mainButton.showInvoice(invoice);
    
    if (result) {
      console.log('✅ Telegram Stars invoice opened successfully');
      return { success: true };
    } else {
      throw new Error('Failed to open invoice');
    }

  } catch (error: any) {
    console.error('❌ Error creating Telegram Stars invoice:', error);
    
    // Если Stars API недоступен, пробуем fallback
    if (error.message.includes('showInvoice') || error.message.includes('not available')) {
      console.log('🔄 Trying fallback method...');
      return await createInvoiceViaBot(invoice);
    }
    
    return { 
      success: false, 
      error: error.message || 'Failed to create invoice' 
    };
  }
};

// Показывает уведомление в Telegram WebApp
export const showTelegramAlert = (message: string): void => {
  try {
    const webApp = getTelegramWebApp();
    if (webApp?.showAlert) {
      webApp.showAlert(message);
    } else {
      console.warn('showAlert not available in this WebApp version');
    }
  } catch (error) {
    console.error('Failed to show Telegram alert:', error);
  }
};

// Показывает подтверждение в Telegram WebApp
export const showTelegramConfirm = (
  message: string,
  callback: (confirmed: boolean) => void
): void => {
  try {
    const webApp = getTelegramWebApp();
    if (webApp?.showConfirm) {
      webApp.showConfirm(message, callback);
    } else {
      console.warn('showConfirm not available in this WebApp version');
      // Fallback к обычному confirm
      const confirmed = window.confirm(message);
      callback(confirmed);
    }
  } catch (error) {
    console.error('Failed to show Telegram confirm:', error);
    // Fallback к обычному confirm
    const confirmed = window.confirm(message);
    callback(confirmed);
  }
}; 