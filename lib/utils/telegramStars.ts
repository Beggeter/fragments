/**
 * Утилиты для работы с Telegram Stars API (TMA SDK v3)
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

// Показывает уведомление в Telegram WebApp
export const showTelegramAlert = (message: string): void => {
  try {
    const webApp = getTelegramWebApp();
    if (webApp?.showAlert) {
      webApp.showAlert(message);
    } else {
      
    }
  } catch (error) {
    
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
      
      // Fallback - всегда подтверждаем
      callback(true);
    }
  } catch (error) {
    
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
    if (typeof window === 'undefined') {
      throw new Error('Not in browser environment');
    }

    

    // 1. Создаем инвойс на сервере
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
    
    if (!data.success || !data.invoice_url) {
      throw new Error(data.error || 'Failed to create invoice');
    }

    

    // 2. Открываем инвойс через TMA SDK v3
    const { invoice } = await import('@telegram-apps/sdk');
    
    // Проверяем поддержку
    if (!invoice.isSupported()) {
      throw new Error('Invoice API not supported');
    }

    // 3. Открываем инвойс с URL
    const status = await invoice.open(data.invoice_url, 'url');
    
    
    
    // 4. Обрабатываем результат
    if (status === 'paid') {
      
      return { success: true };
    } else if (status === 'cancelled') {
      
      return { success: false, error: 'Payment cancelled' };
    } else {
      
      return { success: false, error: `Payment failed: ${status}` };
    }

  } catch (error: any) {
    
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
    if (typeof window === 'undefined') {
      throw new Error('Not in browser environment');
    }

    

    // 1. Создаем инвойс на сервере
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
    
    if (!data.success || !data.invoice_url) {
      throw new Error(data.error || 'Failed to create invoice');
    }

    

    // 2. Открываем инвойс через TMA SDK v3
    const { invoice } = await import('@telegram-apps/sdk');
    
    // Проверяем поддержку
    if (!invoice.isSupported()) {
      throw new Error('Invoice API not supported');
    }

    // 3. Открываем инвойс с URL
    const status = await invoice.open(data.invoice_url, 'url');
    
    
    
    // 4. Обрабатываем результат
    if (status === 'paid') {
      
      return { success: true };
    } else if (status === 'cancelled') {
      
      return { success: false, error: 'Payment cancelled' };
    } else {
      
      return { success: false, error: `Payment failed: ${status}` };
    }

  } catch (error: any) {
    
    return { 
      success: false, 
      error: error.message || 'Failed to create invoice' 
    };
  }
};

// Создает инвойс для покупки ZEN подписки
export const createZenInvoice = async (
  userId: number,
  subscriptionPeriod: string,
  priceStars: number
): Promise<{ success: boolean; error?: string }> => {
  try {
    if (typeof window === 'undefined') {
      throw new Error('Not in browser environment');
    }

    

    // 1. Создаем инвойс на сервере
    const response = await fetch('/api/payment/create-invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        item: { 
          type: 'subscription', 
          itemId: subscriptionPeriod,
          price: priceStars
        }
      })
    });

    const data = await response.json();
    
    if (!data.success || !data.invoice_url) {
      throw new Error(data.error || 'Failed to create invoice');
    }

    

    // 2. Открываем инвойс через TMA SDK v3
    const { invoice } = await import('@telegram-apps/sdk');
    
    // Проверяем поддержку
    if (!invoice.isSupported()) {
      throw new Error('Invoice API not supported');
    }

    // 3. Открываем инвойс с URL
    const status = await invoice.open(data.invoice_url, 'url');
    
    
    
    // 4. Обрабатываем результат
    if (status === 'paid') {
      
      return { success: true };
    } else if (status === 'cancelled') {
      
      return { success: false, error: 'Payment cancelled' };
    } else {
      
      return { success: false, error: `Payment failed: ${status}` };
    }

  } catch (error: any) {
    
    return { 
      success: false, 
      error: error.message || 'Failed to create ZEN invoice' 
    };
  }
}; 