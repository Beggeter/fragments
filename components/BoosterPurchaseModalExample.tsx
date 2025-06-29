import React, { useState } from "react";
import BoosterPurchaseModal from "./BoosterPurchaseModal";

// Пример использования модального окна
const BoosterPurchaseModalExample: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [playerBalance, setPlayerBalance] = useState(500);

  const exampleBooster = {
    id: "bomb",
    name: "Bomb",
    icon: "/boosters/bomb.svg",
    price: 60,
    description: "Мощный взрыв! Уничтожает все блоки в зоне 3×3, открывая новые комбинации.",
  };

  const handlePurchase = (quantity: number) => {
    const totalCost = quantity * exampleBooster.price;
    setPlayerBalance(prev => prev - totalCost);
    alert(`Куплено ${quantity} бустеров ${exampleBooster.name} за ${totalCost} кристаллов!`);
    setIsModalOpen(false);
  };

  return (
    <div className="p-8">
      <div className="mb-4">
        <h2 className="text-2xl font-bold mb-2">Баланс: {playerBalance} кристаллов</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-3 bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-2xl font-bold hover:from-orange-500 hover:to-orange-600"
        >
          Купить бустер
        </button>
      </div>

      <BoosterPurchaseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handlePurchase}
        booster={exampleBooster}
        playerBalance={playerBalance}
      />
    </div>
  );
};

export default BoosterPurchaseModalExample; 