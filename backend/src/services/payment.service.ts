import midtransClient from 'midtrans-client';
import { env } from '../config/env';

const snap = new midtransClient.Snap({
  isProduction: env.MIDTRANS_IS_PRODUCTION,
  serverKey: env.MIDTRANS_SERVER_KEY || 'dummy-key',
  clientKey: env.MIDTRANS_CLIENT_KEY || 'dummy-key',
});

const coreApi = new midtransClient.CoreApi({
  isProduction: env.MIDTRANS_IS_PRODUCTION,
  serverKey: env.MIDTRANS_SERVER_KEY || 'dummy-key',
  clientKey: env.MIDTRANS_CLIENT_KEY || 'dummy-key',
});

export const createQrisTransaction = async (
  orderId: string,
  amount: number
): Promise<{ qrUrl: string; externalId: string }> => {
  if (!env.MIDTRANS_SERVER_KEY) {
    if (env.NODE_ENV !== 'development') {
      throw new Error('MIDTRANS_SERVER_KEY is required outside development');
    }

    // Return mock QRIS transaction for local development/demo
    console.log(`⚠️ MIDTRANS_SERVER_KEY is not configured. Using Mock QRIS payment for order: ${orderId}`);
    
    // Generate a beautiful mock QR code utilizing the public QR Server API, customized with our brand's accent color (#ff6b5a)
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&color=ff6b5a&data=MOCK-PAYMENT-${orderId}`;
    
    return {
      qrUrl,
      externalId: `MOCK-${orderId}-${Date.now()}`,
    };
  }

  const parameter = {
    payment_type: 'gopay', // Midtrans uses gopay for QRIS
    transaction_details: {
      order_id: orderId,
      gross_amount: amount,
    },
  };

  const response = await coreApi.charge(parameter);

  // Extract QR URL from the response
  const qrUrl = response.actions?.find(
    (action: any) => action.name === 'generate-qr-code'
  )?.url || '';

  return {
    qrUrl,
    externalId: response.transaction_id,
  };
};

export const checkTransactionStatus = async (
  externalId: string
): Promise<string> => {
  if (externalId.startsWith('MOCK-')) {
    if (env.NODE_ENV !== 'development') {
      throw new Error('Mock payment IDs are only valid in development');
    }

    // Automatically transition to paid status after 5 seconds to simulate a real payment workflow
    const parts = externalId.split('-');
    const timestampStr = parts[parts.length - 1];
    const timestamp = parseInt(timestampStr, 10);
    if (!isNaN(timestamp)) {
      const elapsed = Date.now() - timestamp;
      if (env.NODE_ENV === 'development' && elapsed > 5000) {
        return 'paid';
      }
    }
    return 'pending';
  }

  try {
    const response = await coreApi.transaction.status(externalId);
    const status = response.transaction_status;

    switch (status) {
      case 'capture':
      case 'settlement':
        return 'paid';
      case 'pending':
        return 'pending';
      case 'deny':
      case 'cancel':
        return 'failed';
      case 'expire':
        return 'expired';
      default:
        return 'pending';
    }
  } catch (error) {
    console.error('Error checking transaction status:', error);
    return 'pending';
  }
};
