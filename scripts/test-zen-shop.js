const BASE_URL = 'http://localhost:3000';

async function testZenShop() {
  ;

  try {
    // Тест 1: Проверяем создание ZEN инвойса
    ;
    const invoiceResponse = await fetch(`${BASE_URL}/api/payment/create-invoice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 610936383, // Test user ID
        item: {
          type: 'subscription',
          itemId: 'month',
          price: 50
        }
      })
    });

    const invoiceData = await invoiceResponse.json();
    ;

    if (invoiceData.success) {
      ;
    } else {
      ;
    }

    // Тест 2: Проверяем webhook обработку подписок
    ;
    const webhookResponse = await fetch(`${BASE_URL}/api/telegram-webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        update_id: 123456789,
        message: {
          successful_payment: {
            currency: "XTR",
            total_amount: 5000,
            invoice_payload: JSON.stringify({
              u: 610936383,
              t: 'subscription',
              i: 'month',
              p: 50
            }),
            telegram_payment_charge_id: "charge_test_123",
            provider_payment_charge_id: "provider_test_123"
          }
        }
      })
    });

    const webhookData = await webhookResponse.json();
    ;

    if (webhookData.ok) {
      ;
    } else {
      ;
    }

    // Тест 3: Проверяем статус пользователя после покупки
    ;
    const userResponse = await fetch(`${BASE_URL}/api/users/610936383`);
    const userData = await userResponse.json();
    ;

    if (userData.hasZenSubscription) {
      ;
    } else {
      ;
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testZenShop(); 