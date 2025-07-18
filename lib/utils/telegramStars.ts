/**
 * Утилиты для работы с Telegram Stars API на фронтенде
 */

// Проверяем, что мы в Telegram WebApp
export const isTelegramWebApp = (): boolean => {
  return typeof window !== 'undefined' && !!window.Telegram?.WebApp;
};

// Получаем Telegram WebApp объект
export const getTelegramWebApp = () => {
  if (!isTelegramWebApp()) {
    throw new Error('Telegram WebApp not available');
  }
  return window.Telegram.WebApp;
};

// Получаем ID пользователя из Telegram WebApp
export const getTelegramUserId = (): number | null => {
  try {
    const webApp = getTelegramWebApp();
    return webApp.initDataUnsafe?.user?.id || null;
  } catch (error) {
    console.error('Failed to get Telegram user ID:', error);
    return null;
  }
};

// Получаем данные пользователя из Telegram WebApp
export const getTelegramUser = () => {
  try {
    const webApp = getTelegramWebApp();
    return webApp.initDataUnsafe?.user || null;
  } catch (error) {
    console.error('Failed to get Telegram user:', error);
    return null;
  }
};

// Интерфейс для инвойса Telegram Stars
export interface TelegramStarsInvoice {
  title: string;
  description: string;
  payload: string;
  currency: string;
  prices: TelegramStarsPrice[];
  max_tip_amount?: number;
  suggested_tip_amounts?: number[];
  start_parameter?: string;
  provider_data?: string;
  photo_url?: string;
  photo_size?: number;
  photo_width?: number;
  photo_height?: number;
  need_name?: boolean;
  need_phone_number?: boolean;
  need_email?: boolean;
  need_shipping_address?: boolean;
  send_phone_number_to_provider?: boolean;
  send_email_to_provider?: boolean;
  is_flexible?: boolean;
}

export interface TelegramStarsPrice {
  label: string;
  amount: number; // в минимальных единицах (копейках)
}

// Создает инвойс через Telegram Stars API
export const createTelegramStarsInvoice = async (
  invoice: TelegramStarsInvoice
): Promise<{ success: boolean; error?: string }> => {
  try {
    const webApp = getTelegramWebApp();
    
    // Проверяем, что MainButton доступен
    if (!webApp.MainButton) {
      throw new Error('MainButton not available in this Telegram WebApp version');
    }

    // Создаем инвойс через Telegram Stars API
    const result = await webApp.MainButton.showInvoice(invoice);
    
    if (result) {
      console.log('✅ Telegram Stars invoice opened successfully');
      return { success: true };
    } else {
      throw new Error('Failed to open invoice');
    }

  } catch (error: any) {
    console.error('❌ Error creating Telegram Stars invoice:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to create invoice' 
    };
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

    const invoice: TelegramStarsInvoice = {
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

    const invoice: TelegramStarsInvoice = {
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

// Показывает уведомление в Telegram WebApp
export const showTelegramAlert = (message: string): void => {
  try {
    const webApp = getTelegramWebApp();
    if (webApp.showAlert) {
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
    if (webApp.showConfirm) {
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