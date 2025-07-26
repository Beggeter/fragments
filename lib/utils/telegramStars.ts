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
    if (typeof window === 'undefined') {
      throw new Error('Not in browser environment');
    }

    console.log('💎 Creating shards invoice:', {
      userId,
      packAmount,
      packPrice
    });

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

    console.log('📄 Invoice created, opening with URL:', data.invoice_url);

    // 2. Открываем инвойс через TMA SDK v3
    const { invoice } = await import('@telegram-apps/sdk');
    
    // Проверяем поддержку
    if (!invoice.isSupported()) {
      throw new Error('Invoice API not supported');
    }

    // 3. Открываем инвойс с URL
    const status = await invoice.open(data.invoice_url, 'url');
    
    console.log('💰 Payment status:', status);
    
    // 4. Обрабатываем результат
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
    if (typeof window === 'undefined') {
      throw new Error('Not in browser environment');
    }

    console.log('🚀 Creating booster invoice:', {
      userId,
      boosterId,
      boosterName,
      quantity,
      unitPrice
    });

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

    console.log('📄 Invoice created, opening with URL:', data.invoice_url);

    // 2. Открываем инвойс через TMA SDK v3
    const { invoice } = await import('@telegram-apps/sdk');
    
    // Проверяем поддержку
    if (!invoice.isSupported()) {
      throw new Error('Invoice API not supported');
    }

    // 3. Открываем инвойс с URL
    const status = await invoice.open(data.invoice_url, 'url');
    
    console.log('💰 Payment status:', status);
    
    // 4. Обрабатываем результат
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