export interface ShardPack {
  amount: number;
  price: number;
  label?: string;
  labelType?: string;
  icon: string;
}

export interface ShardPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  pack: ShardPack;
  userId?: number;
  onSuccess: () => void;
}

// Типы для системы платежей Telegram Stars
export interface TelegramInvoice {
  title: string;
  description: string;
  payload: string;
  currency: string;
  prices: TelegramLabeledPrice[];
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

export interface TelegramLabeledPrice {
  label: string;
  amount: number; // в копейках для валют или в минимальных единицах для Telegram Stars
}

export interface PaymentItem {
  type: 'shards' | 'booster' | 'subscription';
  itemId: string;
  quantity?: number;
  metadata?: Record<string, any>;
}

export interface CreateInvoiceRequest {
  userId: number;
  item: PaymentItem;
  telegramChatId: number;
}

export interface CreateInvoiceResponse {
  success: boolean;
  invoiceLink?: string;
  error?: string;
}

export interface PaymentPayload {
  userId: number;
  itemType: 'shards' | 'booster' | 'subscription';
  itemId: string;
  quantity?: number;
  amount: number; // количество валюты/товара для начисления
  price: number; // цена в Telegram Stars
  metadata?: Record<string, any>;
}

export interface BoosterItem {
  id: string;
  name: string;
  icon: string;
  price: number;
  description?: string;
}
