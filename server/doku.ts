import crypto from 'crypto';

// DOKU Snap API Configuration
const DOKU_CLIENT_ID = process.env.DOKU_CLIENT_ID || '';
const DOKU_SECRET_KEY = process.env.DOKU_SECRET_KEY || '';
const DOKU_BASE_URL = process.env.DOKU_BASE_URL || 'https://api-sandbox.doku.com'; // Use sandbox for testing

interface DokuPaymentRequest {
  name: string;
  phone: string;
  email: string;
  amount: number;
  referenceId: string;
  description: string;
  paymentMethod?: 'VIRTUAL_ACCOUNT_BANK' | 'QRIS' | 'EMONEY' | 'CREDIT_CARD';
  paymentChannel?: string; // BCA, MANDIRI, BNI, BRI, etc
}

interface DokuPaymentResponse {
  response_code: string;
  response_message: string;
  virtual_account_info?: {
    virtual_account_number: string;
    how_to_pay_page: string;
    how_to_pay_api: string;
    expired_date: string;
    channel_code: string;
    bank_name: string;
  };
  qris_info?: {
    qr_content: string;
    expired_date: string;
  };
  order: {
    invoice_number: string;
    amount: number;
  };
}

/**
 * Generate signature for DOKU Snap API
 */
function generateSignature(
  clientId: string,
  requestId: string,
  requestTimestamp: string,
  requestTarget: string,
  digest: string,
  secretKey: string
): string {
  const componentSignature = `Client-Id:${clientId}\nRequest-Id:${requestId}\nRequest-Timestamp:${requestTimestamp}\nRequest-Target:${requestTarget}\nDigest:${digest}`;
  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(componentSignature)
    .digest('base64');
  
  return `HMACSHA256=${signature}`;
}

/**
 * Generate digest (SHA-256 hash of request body)
 */
function generateDigest(body: string): string {
  const hash = crypto.createHash('sha256').update(body, 'utf8').digest('base64');
  return `SHA-256=${hash}`;
}

/**
 * Generate request ID (UUID v4)
 */
function generateRequestId(): string {
  return crypto.randomUUID();
}

/**
 * Generate timestamp in ISO 8601 format
 */
function generateTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Create Virtual Account payment via DOKU Snap
 */
export async function createVirtualAccountPayment(params: DokuPaymentRequest): Promise<DokuPaymentResponse> {
  const requestId = generateRequestId();
  const requestTimestamp = generateTimestamp();
  const requestTarget = '/checkout/v1/payment';

  const body = JSON.stringify({
    order: {
      invoice_number: params.referenceId,
      amount: params.amount,
    },
    payment: {
      payment_method_types: [params.paymentMethod || 'VIRTUAL_ACCOUNT_BANK'],
    },
    virtual_account_info: {
      channel_code: params.paymentChannel || 'BCA',
      virtual_account_name: params.name,
    },
    customer: {
      name: params.name,
      email: params.email,
      phone: params.phone,
    },
    additional_info: {
      order_detail: [
        {
          name: params.description,
          price: params.amount,
          quantity: 1,
        },
      ],
    },
  });

  const digest = generateDigest(body);
  const signature = generateSignature(
    DOKU_CLIENT_ID,
    requestId,
    requestTimestamp,
    requestTarget,
    digest,
    DOKU_SECRET_KEY
  );

  const response = await fetch(`${DOKU_BASE_URL}${requestTarget}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Client-Id': DOKU_CLIENT_ID,
      'Request-Id': requestId,
      'Request-Timestamp': requestTimestamp,
      'Signature': signature,
      'Digest': digest,
    },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DOKU API Error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

/**
 * Create QRIS payment via DOKU Snap
 */
export async function createQRISPayment(params: DokuPaymentRequest): Promise<DokuPaymentResponse> {
  const requestId = generateRequestId();
  const requestTimestamp = generateTimestamp();
  const requestTarget = '/checkout/v1/payment';

  const body = JSON.stringify({
    order: {
      invoice_number: params.referenceId,
      amount: params.amount,
    },
    payment: {
      payment_method_types: ['QRIS'],
    },
    customer: {
      name: params.name,
      email: params.email,
      phone: params.phone,
    },
    additional_info: {
      order_detail: [
        {
          name: params.description,
          price: params.amount,
          quantity: 1,
        },
      ],
    },
  });

  const digest = generateDigest(body);
  const signature = generateSignature(
    DOKU_CLIENT_ID,
    requestId,
    requestTimestamp,
    requestTarget,
    digest,
    DOKU_SECRET_KEY
  );

  const response = await fetch(`${DOKU_BASE_URL}${requestTarget}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Client-Id': DOKU_CLIENT_ID,
      'Request-Id': requestId,
      'Request-Timestamp': requestTimestamp,
      'Signature': signature,
      'Digest': digest,
    },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DOKU API Error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

/**
 * Check if DOKU is configured
 */
export function isDokuConfigured(): boolean {
  return !!(DOKU_CLIENT_ID && DOKU_SECRET_KEY);
}

/**
 * Get DOKU configuration status
 */
export function getDokuConfig() {
  return {
    isConfigured: isDokuConfigured(),
    clientId: DOKU_CLIENT_ID ? '***' + DOKU_CLIENT_ID.slice(-4) : 'Not set',
    baseUrl: DOKU_BASE_URL,
  };
}

/**
 * Verify DOKU webhook signature
 */
export function verifyWebhookSignature(
  requestId: string,
  requestTimestamp: string,
  requestTarget: string,
  digest: string,
  receivedSignature: string
): boolean {
  const expectedSignature = generateSignature(
    DOKU_CLIENT_ID,
    requestId,
    requestTimestamp,
    requestTarget,
    digest,
    DOKU_SECRET_KEY
  );

  return receivedSignature === expectedSignature;
}


