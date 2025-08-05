const BASE_URL = 'http://localhost:3000';

async function testZenShop() {
  console.log('🧪 Testing ZEN Shop functionality...\n');

  try {
    // Тест 1: Проверяем создание ZEN инвойса
    console.log('1. Testing ZEN invoice creation...');
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
    console.log('Invoice response:', invoiceData);

    if (invoiceData.success) {
      console.log('✅ ZEN invoice creation works!');
    } else {
      console.log('❌ ZEN invoice creation failed:', invoiceData.error);
    }

    // Тест 2: Проверяем webhook обработку подписок
    console.log('\n2. Testing subscription webhook processing...');
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
    console.log('Webhook response:', webhookData);

    if (webhookData.ok) {
      console.log('✅ ZEN subscription webhook processing works!');
    } else {
      console.log('❌ ZEN subscription webhook processing failed:', webhookData.error);
    }

    // Тест 3: Проверяем статус пользователя после покупки
    console.log('\n3. Testing user subscription status...');
    const userResponse = await fetch(`${BASE_URL}/api/users/610936383`);
    const userData = await userResponse.json();
    console.log('User data:', userData);

    if (userData.hasZenSubscription) {
      console.log('✅ User has ZEN subscription!');
    } else {
      console.log('ℹ️ User does not have ZEN subscription (expected for test)');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testZenShop(); 