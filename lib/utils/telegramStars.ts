/**
 * Простые утилиты для работы с Telegram Stars API
 */

// Проверяем, запущено ли приложение в Telegram WebApp
export const isTelegramWebApp = (): boolean => {
  return typeof window !== 'undefined' && !!(window as any).Telegram?.WebApp;
};

// Получаем объект Telegram WebApp
export const getTelegramWebApp = () => {
  if (typeof window === 'undefined') return null;
  return (window as any).Telegram?.WebApp || null;
};

// Получаем Telegram User ID
export const getTelegramUserId = (): number | null => {
  const webApp = getTelegramWebApp();
  return webApp?.initDataUnsafe?.user?.id || null;
};

// Получаем данные пользователя Telegram
export const getTelegramUser = () => {
  const webApp = getTelegramWebApp();
  return webApp?.initDataUnsafe?.user || null;
};

// Форматирует цену для Telegram Stars (в копейках)
export const formatStarsPrice = (price: number): number => {
  return Math.round(price * 100); // Конвертируем в копейки
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
  return new Blob([payload]).size <= maxSize;
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
      // Fallback - всегда подтверждаем
      callback(true);
    }
  } catch (error) {
    console.error('Failed to show Telegram confirm:', error);
    callback(true);
  }
};

// Создает инвойс для покупки осколков
export const createShardsInvoice = async (
  userId: number,
  packAmount: number,
  packPrice: number
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Проверяем поддержку инвойсов
    if (typeof window === 'undefined') {
      throw new Error('Not in browser environment');
    }

    // Динамически импортируем SDK
    const { invoice } = await import('@telegram-apps/sdk');
    
    if (!invoice.isSupported()) {
      throw new Error('Invoices not supported in this Telegram version');
    }

    console.log('💎 Creating shards invoice:', {
      userId,
      packAmount,
      packPrice
    });

    // Создаем инвойс на сервере
    const response = await fetch('/api/payment/create-invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        item: { 
          type: 'shards', 
          itemId: packAmount.toString() 
        }
      })
    });

    const data = await response.json();
    
    if (!data.success || !data.invoiceSlug) {
      throw new Error(data.error || 'Failed to create invoice');
    }

    console.log('📄 Invoice created, opening with slug:', data.invoiceSlug);

    // Открываем инвойс через SDK
    const status = await invoice.open(data.invoiceSlug);
    
    console.log('💰 Payment status:', status);
    
    if (status === 'paid') {
      console.log('✅ Payment successful');
      return { success: true };
    } else if (status === 'cancelled') {
      console.log('❌ Payment cancelled by user');
      return { success: false, error: 'Payment cancelled' };
    } else {
      console.log('❌ Payment failed:', status);
      return { success: false, error: `Payment failed: ${status}` };
    }

  } catch (error: any) {
    console.error('❌ Error creating shards invoice:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to create invoice' 
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
    // Проверяем поддержку инвойсов
    if (typeof window === 'undefined') {
      throw new Error('Not in browser environment');
    }

    // Динамически импортируем SDK
    const { invoice } = await import('@telegram-apps/sdk');
    
    if (!invoice.isSupported()) {
      throw new Error('Invoices not supported in this Telegram version');
    }

    console.log('🚀 Creating booster invoice:', {
      userId,
      boosterId,
      boosterName,
      quantity,
      unitPrice
    });

    // Создаем инвойс на сервере
    const response = await fetch('/api/payment/create-invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        item: { 
          type: 'booster', 
          itemId: boosterId,
          quantity 
        }
      })
    });

    const data = await response.json();
    
    if (!data.success || !data.invoiceSlug) {
      throw new Error(data.error || 'Failed to create invoice');
    }

    console.log('📄 Invoice created, opening with slug:', data.invoiceSlug);

    // Открываем инвойс через SDK
    const status = await invoice.open(data.invoiceSlug);
    
    console.log('💰 Payment status:', status);
    
    if (status === 'paid') {
      console.log('✅ Payment successful');
      return { success: true };
    } else if (status === 'cancelled') {
      console.log('❌ Payment cancelled by user');
      return { success: false, error: 'Payment cancelled' };
    } else {
      console.log('❌ Payment failed:', status);
      return { success: false, error: `Payment failed: ${status}` };
    }

  } catch (error: any) {
    console.error('❌ Error creating booster invoice:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to create invoice' 
    };
  }
}; 