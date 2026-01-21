import crypto from 'crypto';

// iPaymu API Configuration
const IPAYMU_VA = process.env.IPAYMU_VA || '';
const IPAYMU_API_KEY = process.env.IPAYMU_API_KEY || '';
const IPAYMU_URL = process.env.IPAYMU_URL || 'https://sandbox.ipaymu.com/api/v2'; // Use sandbox for testing

interface IPaymuPaymentRequest {
  name: string;
  phone: string;
  email: string;
  amount: number;
  notifyUrl: string;
  returnUrl: string;
  cancelUrl: string;
  referenceId: string;
  product: string;
  qty: number;
  price: number;
  description: string;
}

interface IPaymuPaymentResponse {
  Status: number;
  Message: string;
  Data: {
    SessionId: string;
    TransactionId: number;
    Url: string;
  };
}

interface IPaymuDirectPaymentRequest {
  name: string;
  phone: string;
  email: string;
  amount: number;
  notifyUrl: string;
  returnUrl: string;
  cancelUrl: string;
  referenceId: string;
  product: string;
  qty: number;
  price: number;
  description: string;
  paymentMethod: 'va' | 'qris' | 'cstore' | 'cod';
  paymentChannel: string; // bca, mandiri, bni, etc for VA; qris for QRIS; indomaret/alfamart for cstore
}

interface IPaymuDirectPaymentResponse {
  Status: number;
  Message: string;
  Data: {
    SessionId: string;
    TransactionId: number;
    ReferenceId: string;
    Via: string;
    Channel: string;
    PaymentNo: string; // VA number or QRIS code
    PaymentName: string;
    Total: number;
    Fee: number;
    Expired: string;
    QrImage?: string; // For QRIS payments
  };
}

/**
 * Generate signature for iPaymu API
 */
function generateSignature(body: string, method: string = 'POST'): string {
  const bodyHash = crypto.createHash('sha256').update(body).digest('hex').toLowerCase();
  const stringToSign = `${method}:${IPAYMU_VA}:${bodyHash}:${IPAYMU_API_KEY}`;
  const signature = crypto.createHmac('sha256', IPAYMU_API_KEY).update(stringToSign).digest('hex');
  return signature;
}

/**
 * Create payment request to iPaymu (Redirect Payment API)
 */
export async function createPayment(params: IPaymuPaymentRequest): Promise<IPaymuPaymentResponse> {
  const body = JSON.stringify({
    name: params.name,
    phone: params.phone,
    email: params.email,
    amount: params.amount,
    notifyUrl: params.notifyUrl,
    returnUrl: params.returnUrl,
    cancelUrl: params.cancelUrl,
    referenceId: params.referenceId,
    product: [params.product],
    qty: [params.qty],
    price: [params.price],
    description: [params.description],
    buyerName: params.name,
    buyerPhone: params.phone,
    buyerEmail: params.email,
  });

  const signature = generateSignature(body);
  const timestamp = Math.floor(Date.now() / 1000).toString();

  const response = await fetch(`${IPAYMU_URL}/payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'va': IPAYMU_VA,
      'signature': signature,
      'timestamp': timestamp,
    },
    body: body,
  });

  const result = await response.json() as IPaymuPaymentResponse;
  return result;
}

/**
 * Create direct payment request to iPaymu (Direct Payment API)
 */
export async function createDirectPayment(params: IPaymuDirectPaymentRequest): Promise<IPaymuDirectPaymentResponse> {
  const body = JSON.stringify({
    name: params.name,
    phone: params.phone,
    email: params.email,
    amount: params.amount,
    notifyUrl: params.notifyUrl,
    returnUrl: params.returnUrl,
    cancelUrl: params.cancelUrl,
    referenceId: params.referenceId,
    product: [params.product],
    qty: [params.qty],
    price: [params.price],
    description: [params.description],
    buyerName: params.name,
    buyerPhone: params.phone,
    buyerEmail: params.email,
    paymentMethod: params.paymentMethod,
    paymentChannel: params.paymentChannel,
  });

  const signature = generateSignature(body);
  const timestamp = Math.floor(Date.now() / 1000).toString();

  const response = await fetch(`${IPAYMU_URL}/payment/direct`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'va': IPAYMU_VA,
      'signature': signature,
      'timestamp': timestamp,
    },
    body: body,
  });

  const result = await response.json() as IPaymuDirectPaymentResponse;
  return result;
}

/**
 * Verify callback signature from iPaymu
 */
export function verifyCallbackSignature(
  trxId: string,
  status: string,
  receivedSignature: string
): boolean {
  // iPaymu callback signature format: sha256(trx_id + status + api_key)
  const stringToSign = `${trxId}${status}${IPAYMU_API_KEY}`;
  const expectedSignature = crypto.createHash('sha256').update(stringToSign).digest('hex');
  return expectedSignature === receivedSignature;
}

/**
 * Check if iPaymu is configured
 */
export function isIPaymuConfigured(): boolean {
  return !!(IPAYMU_VA && IPAYMU_API_KEY);
}

/**
 * Get iPaymu configuration status
 */
export function getIPaymuConfig() {
  return {
    isConfigured: isIPaymuConfigured(),
    va: IPAYMU_VA ? '***' + IPAYMU_VA.slice(-4) : 'Not set',
    apiKey: IPAYMU_API_KEY ? '***' + IPAYMU_API_KEY.slice(-4) : 'Not set',
    url: IPAYMU_URL,
  };
}

