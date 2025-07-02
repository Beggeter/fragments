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
