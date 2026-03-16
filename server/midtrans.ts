import crypto from 'crypto';

// Midtrans Production Configuration
const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || 'Mid-server-7BW1Qn7VDbm3UBmThQRz0OyO';
const MIDTRANS_CLIENT_KEY = process.env.MIDTRANS_CLIENT_KEY || 'Mid-client-qrm31AWXMvysNEiz';
const MIDTRANS_MERCHANT_ID = process.env.MIDTRANS_MERCHANT_ID || 'M342243687';
const MIDTRANS_BASE_URL = 'https://api.midtrans.com';
const MIDTRANS_SNAP_URL = 'https://app.midtrans.com/snap/v1/transactions';

// Auth header: Basic base64(SERVER_KEY:)
function getAuthHeader(): string {
  const encoded = Buffer.from(`${MIDTRANS_SERVER_KEY}:`).toString('base64');
  return `Basic ${encoded}`;
}

interface MidtransChargeParams {
  orderId: string;
  grossAmount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  itemName: string;
}

interface MidtransVAResponse {
  status_code: string;
  status_message: string;
  transaction_id: string;
  order_id: string;
  gross_amount: string;
  payment_type: string;
  transaction_status: string;
  expiry_time: string;
  va_numbers?: Array<{ bank: string; va_number: string }>;
  bill_key?: string;
  biller_code?: string;
}

interface MidtransQRISResponse {
  status_code: string;
  status_message: string;
  transaction_id: string;
  order_id: string;
  gross_amount: string;
  payment_type: string;
  transaction_status: string;
  expiry_time: string;
  qr_string?: string;
  actions?: Array<{ name: string; method: string; url: string }>;
}

const BANK_NAMES: Record<string, string> = {
  bni: 'BNI Virtual Account',
  bri: 'BRI Virtual Account',
  mandiri: 'Mandiri Virtual Account',
  permata: 'Permata Virtual Account',
  cimb: 'CIMB Niaga Virtual Account',
};

/**
 * Create Virtual Account payment via Midtrans Core API
 * Supported banks: bni, bri, mandiri, permata, cimb
 */
export async function createVAPayment(
  bank: string,
  params: MidtransChargeParams
): Promise<{ vaNumber: string; bankName: string; expiryTime: string; transactionId: string }> {
  const payload: Record<string, any> = {
    payment_type: 'bank_transfer',
    transaction_details: {
      order_id: params.orderId,
      gross_amount: params.grossAmount,
    },
    bank_transfer: {
      bank: bank.toLowerCase(),
    },
    customer_details: {
      first_name: params.customerName,
      email: params.customerEmail,
      phone: params.customerPhone,
    },
    item_details: [
      {
        id: params.orderId,
        price: params.grossAmount,
        quantity: 1,
        name: params.itemName.substring(0, 50),
      },
    ],
  };

  const response = await fetch(`${MIDTRANS_BASE_URL}/v2/charge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': getAuthHeader(),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Midtrans VA Error: ${response.status} - ${errText}`);
  }

  const result = await response.json() as MidtransVAResponse;
  console.log('[Midtrans VA] Response:', result);

  if (result.status_code !== '201') {
    throw new Error(`Midtrans VA Error: ${result.status_message}`);
  }

  let vaNumber = '';
  if (result.va_numbers && result.va_numbers.length > 0) {
    vaNumber = result.va_numbers[0].va_number;
  } else if (result.bill_key) {
    // Mandiri echannel fallback
    vaNumber = `${result.biller_code}-${result.bill_key}`;
  }

  return {
    vaNumber,
    bankName: BANK_NAMES[bank.toLowerCase()] || `${bank.toUpperCase()} Virtual Account`,
    expiryTime: result.expiry_time,
    transactionId: result.transaction_id,
  };
}

/**
 * Create QRIS payment via Midtrans Core API (GoPay Dynamic QRIS)
 */
export async function createQRISPayment(
  params: MidtransChargeParams
): Promise<{ qrCodeUrl: string; expiryTime: string; transactionId: string }> {
  const payload = {
    payment_type: 'qris',
    transaction_details: {
      order_id: params.orderId,
      gross_amount: params.grossAmount,
    },
    qris: {
      acquirer: 'gopay',
    },
    customer_details: {
      first_name: params.customerName,
      email: params.customerEmail,
      phone: params.customerPhone,
    },
    item_details: [
      {
        id: params.orderId,
        price: params.grossAmount,
        quantity: 1,
        name: params.itemName.substring(0, 50),
      },
    ],
  };

  const response = await fetch(`${MIDTRANS_BASE_URL}/v2/charge`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': getAuthHeader(),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Midtrans QRIS Error: ${response.status} - ${errText}`);
  }

  const result = await response.json() as MidtransQRISResponse;
  console.log('[Midtrans QRIS] Response:', result);

  if (result.status_code !== '201') {
    throw new Error(`Midtrans QRIS Error: ${result.status_message}`);
  }

  // Get QR code image URL from actions array
  const qrAction = result.actions?.find(a => a.name === 'generate-qr-code');
  const qrCodeUrl = qrAction?.url || '';

  return {
    qrCodeUrl,
    expiryTime: result.expiry_time,
    transactionId: result.transaction_id,
  };
}

/**
 * Verify Midtrans notification signature
 * SHA512(order_id + status_code + gross_amount + server_key)
 */
export function verifyMidtransSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  receivedSignature: string
): boolean {
  const stringToSign = `${orderId}${statusCode}${grossAmount}${MIDTRANS_SERVER_KEY}`;
  const expected = crypto.createHash('sha512').update(stringToSign).digest('hex');
  return expected === receivedSignature;
}

/**
 * Check if Midtrans is configured
 */
export function isMidtransConfigured(): boolean {
  return !!MIDTRANS_SERVER_KEY;
}

/**
 * Get Midtrans configuration status
 */
export function getMidtransConfig() {
  return {
    isConfigured: isMidtransConfigured(),
    merchantId: MIDTRANS_MERCHANT_ID,
    clientKey: MIDTRANS_CLIENT_KEY ? '***' + MIDTRANS_CLIENT_KEY.slice(-4) : 'Not set',
    serverKey: MIDTRANS_SERVER_KEY ? '***' + MIDTRANS_SERVER_KEY.slice(-4) : 'Not set',
    environment: 'production',
  };
}

/**
 * Create Midtrans Snap transaction (hosted payment page)
 * More reliable than Core API - uses channels already active in dashboard
 */
export async function createSnapTransaction(params: {
  orderId: string;
  grossAmount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  itemName: string;
  enabledPayments?: string[];
  finishUrl?: string;
  errorUrl?: string;
  pendingUrl?: string;
}): Promise<{ token: string; redirectUrl: string }> {
  const payload: Record<string, any> = {
    transaction_details: {
      order_id: params.orderId,
      gross_amount: params.grossAmount,
    },
    customer_details: {
      first_name: params.customerName,
      email: params.customerEmail,
      phone: params.customerPhone,
    },
    item_details: [
      {
        id: params.orderId,
        price: params.grossAmount,
        quantity: 1,
        name: params.itemName.substring(0, 50),
      },
    ],
  };

  if (params.enabledPayments && params.enabledPayments.length > 0) {
    payload.enabled_payments = params.enabledPayments;
  }

  if (params.finishUrl || params.errorUrl || params.pendingUrl) {
    payload.callbacks = {};
    if (params.finishUrl) payload.callbacks.finish = params.finishUrl;
    if (params.errorUrl) payload.callbacks.error = params.errorUrl;
    if (params.pendingUrl) payload.callbacks.pending = params.pendingUrl;
  }

  const response = await fetch(MIDTRANS_SNAP_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': getAuthHeader(),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Midtrans Snap Error: ${response.status} - ${errText}`);
  }

  const result = await response.json() as { token?: string; redirect_url?: string; status_message?: string };
  console.log('[Midtrans Snap] Response:', result);

  if (!result.token) {
    throw new Error(`Midtrans Snap Error: ${result.status_message || 'Failed to create snap transaction'}`);
  }

  return {
    token: result.token,
    redirectUrl: result.redirect_url || `https://app.midtrans.com/snap/v2/vtweb/${result.token}`,
  };
}

/**
 * Create Midtrans Payment Link (for QRIS - avoids Snap app detection issue)
 * Returns a payment-links URL that shows QR code directly without app detection
 */
export async function createPaymentLink(params: {
  orderId: string;
  grossAmount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  itemName: string;
  enabledPayments?: string[];
  finishUrl?: string;
  errorUrl?: string;
  pendingUrl?: string;
}): Promise<{ paymentUrl: string }> {
  const payload: Record<string, any> = {
    transaction_details: {
      order_id: params.orderId,
      gross_amount: params.grossAmount,
      payment_link_id: params.orderId,
    },
    customer_details: {
      first_name: params.customerName,
      email: params.customerEmail,
      phone: params.customerPhone,
    },
    item_details: [
      {
        id: params.orderId,
        price: params.grossAmount,
        quantity: 1,
        name: params.itemName.substring(0, 50),
      },
    ],
    usage_limit: 1,
  };

  if (params.enabledPayments && params.enabledPayments.length > 0) {
    payload.enabled_payments = params.enabledPayments;
  }

  if (params.finishUrl || params.errorUrl || params.pendingUrl) {
    payload.callbacks = {};
    if (params.finishUrl) payload.callbacks.finish = params.finishUrl;
    if (params.errorUrl) payload.callbacks.error = params.errorUrl;
    if (params.pendingUrl) payload.callbacks.pending = params.pendingUrl;
  }

  const response = await fetch(`${MIDTRANS_BASE_URL}/v1/payment-links`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': getAuthHeader(),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Midtrans Payment Link Error: ${response.status} - ${errText}`);
  }

  const result = await response.json() as { payment_url?: string; status_message?: string };
  console.log('[Midtrans Payment Link] Response:', result);

  if (!result.payment_url) {
    throw new Error(`Midtrans Payment Link Error: ${result.status_message || 'Failed to create payment link'}`);
  }

  return { paymentUrl: result.payment_url };
}

/**
 * Check Midtrans transaction status directly from Midtrans API
 * Used to verify payment status when webhook hasn't arrived yet
 */
export async function checkMidtransTransactionStatus(orderId: string): Promise<{
  transactionStatus: string;
  fraudStatus?: string;
  paymentType?: string;
  grossAmount?: string;
} | null> {
  try {
    const response = await fetch(`${MIDTRANS_BASE_URL}/v2/${orderId}/status`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': getAuthHeader(),
      },
    });

    if (!response.ok) {
      console.error(`[Midtrans Status] HTTP error ${response.status} for order ${orderId}`);
      return null;
    }

    const result = await response.json() as {
      transaction_status?: string;
      fraud_status?: string;
      payment_type?: string;
      gross_amount?: string;
      status_code?: string;
    };

    if (result.status_code === '404') {
      return null;
    }

    return {
      transactionStatus: result.transaction_status || 'pending',
      fraudStatus: result.fraud_status,
      paymentType: result.payment_type,
      grossAmount: result.gross_amount,
    };
  } catch (error) {
    console.error('[Midtrans Status] Error checking transaction status:', error);
    return null;
  }
}

