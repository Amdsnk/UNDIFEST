import crypto from 'crypto';

// DOKU Snap API Configuration (Production)
const DOKU_CLIENT_ID = process.env.DOKU_CLIENT_ID || '';
const DOKU_SECRET_KEY = process.env.DOKU_SECRET_KEY || '';
const DOKU_SHARED_KEY = process.env.DOKU_SHARED_KEY || '';
const DOKU_PRIVATE_KEY = process.env.DOKU_PRIVATE_KEY || '';
const DOKU_BASE_URL = process.env.DOKU_BASE_URL || 'https://api.doku.com';

// Cache for B2B access token
let cachedAccessToken: string | null = null;
let tokenExpiresAt: number = 0;

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
 * Generate Asymmetric Signature for B2B Access Token (SHA256withRSA)
 * Formula: SHA256withRSA(Private_Key, stringToSign)
 * stringToSign = client_ID + "|" + X-TIMESTAMP
 */
function generateAsymmetricSignature(clientId: string, timestamp: string): string {
  const stringToSign = `${clientId}|${timestamp}`;

  const sign = crypto.createSign('SHA256');
  sign.update(stringToSign);
  sign.end();

  const signature = sign.sign(DOKU_PRIVATE_KEY, 'base64');
  return signature;
}

/**
 * Generate Digest (SHA-256 base64 hash of request body)
 * Based on DOKU documentation: https://dashboard.doku.com/docs/docs/technical-references/generate-signature/
 */
function generateDigest(requestBody: string): string {
  const hash = crypto.createHash('sha256')
    .update(requestBody, 'utf8')
    .digest('base64');
  return hash;
}

/**
 * Generate Symmetric Signature for Payment Request (HMAC SHA256)
 * Based on DOKU documentation: https://dashboard.doku.com/docs/docs/technical-references/generate-signature/
 *
 * Component Signature format:
 * Client-Id:value
 * Request-Id:value
 * Request-Timestamp:value
 * Request-Target:value
 * Digest:value
 */
function generateSymmetricSignature(
  clientId: string,
  requestId: string,
  requestTimestamp: string,
  requestTarget: string,
  digest: string,
  secretKey: string
): string {
  // Prepare Signature Component
  const componentSignature =
    `Client-Id:${clientId}\n` +
    `Request-Id:${requestId}\n` +
    `Request-Timestamp:${requestTimestamp}\n` +
    `Request-Target:${requestTarget}\n` +
    `Digest:${digest}`;

  console.log('[DOKU] Component Signature:\n', componentSignature);

  // Calculate HMAC-SHA256 base64
  const signature = crypto.createHmac('sha256', secretKey)
    .update(componentSignature)
    .digest('base64');

  // Prepend with algorithm info
  return `HMACSHA256=${signature}`;
}

/**
 * Generate timestamp in ISO 8601 format with timezone offset
 * Format: 2020-12-21T14:56:11+07:00
 */
function generateTimestamp(): string {
  const now = new Date();

  // Get timezone offset in minutes
  const timezoneOffset = -now.getTimezoneOffset();
  const offsetHours = Math.floor(Math.abs(timezoneOffset) / 60);
  const offsetMinutes = Math.abs(timezoneOffset) % 60;
  const offsetSign = timezoneOffset >= 0 ? '+' : '-';

  // Format: YYYY-MM-DDTHH:mm:ss+HH:MM
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  const offset = `${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMinutes).padStart(2, '0')}`;

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offset}`;
}

/**
 * Get B2B Access Token
 * Uses Asymmetric Signature (SHA256withRSA)
 */
async function getAccessToken(): Promise<string> {
  // Return cached token if still valid
  if (cachedAccessToken && Date.now() < tokenExpiresAt) {
    return cachedAccessToken;
  }

  const timestamp = generateTimestamp();
  const signature = generateAsymmetricSignature(DOKU_CLIENT_ID, timestamp);

  const response = await fetch(`${DOKU_BASE_URL}/authorization/v1/access-token/b2b`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CLIENT-KEY': DOKU_CLIENT_ID,
      'X-TIMESTAMP': timestamp,
      'X-SIGNATURE': signature,
    },
    body: JSON.stringify({
      grantType: 'client_credentials',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DOKU B2B Token Error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();

  // Cache token (expires in ~900 seconds = 15 minutes, we cache for 14 minutes)
  cachedAccessToken = result.accessToken;
  tokenExpiresAt = Date.now() + (14 * 60 * 1000); // 14 minutes

  return result.accessToken;
}

/**
 * Create Virtual Account payment via DOKU Snap
 */
export async function createVirtualAccountPayment(params: DokuPaymentRequest): Promise<DokuPaymentResponse> {
  // Get B2B access token
  const accessToken = await getAccessToken();

  const timestamp = generateTimestamp();
  const endpointUrl = '/checkout/v1/payment';

  // Try different channel code formats
  // Format 1: Uppercase without space
  const channelCodeMap: Record<string, string> = {
    'BNI': 'BNIVA',
    'BRI': 'BRIVA',
    'MANDIRI': 'MANDIRIVA',
    'PERMATA': 'PERMATAVA',
    'CIMB': 'CIMBVA',
    'BCA': 'BCAVA',
    'DANAMON': 'DANAMONVA',
  };

  const channelCode = channelCodeMap[params.paymentChannel || 'BCA'] || params.paymentChannel || 'BCAVA';

  console.log('[DOKU] Original channel:', params.paymentChannel);
  console.log('[DOKU] Trying format:', channelCode);

  const body = JSON.stringify({
    order: {
      invoice_number: params.referenceId,
      amount: params.amount,
    },
    payment: {
      payment_method_types: [params.paymentMethod || 'VIRTUAL_ACCOUNT_BANK'],
    },
    virtual_account_info: {
      channel_code: channelCode,
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

  const requestId = crypto.randomUUID();

  // Generate Digest
  const digest = generateDigest(body);

  // Generate symmetric signature
  const signature = generateSymmetricSignature(
    DOKU_CLIENT_ID,
    requestId,
    timestamp,
    endpointUrl,
    digest,
    DOKU_SECRET_KEY
  );

  const response = await fetch(`${DOKU_BASE_URL}${endpointUrl}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'Client-Id': DOKU_CLIENT_ID,
      'Request-Id': requestId,
      'Request-Timestamp': timestamp,
      'Request-Target': endpointUrl,
      'Signature': signature,
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
  // Get B2B access token
  const accessToken = await getAccessToken();

  const timestamp = generateTimestamp();
  const endpointUrl = '/checkout/v1/payment';

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

  const requestId = crypto.randomUUID();

  // Generate Digest
  const digest = generateDigest(body);

  // Generate symmetric signature
  const signature = generateSymmetricSignature(
    DOKU_CLIENT_ID,
    requestId,
    timestamp,
    endpointUrl,
    digest,
    DOKU_SECRET_KEY
  );

  const response = await fetch(`${DOKU_BASE_URL}${endpointUrl}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'Client-Id': DOKU_CLIENT_ID,
      'Request-Id': requestId,
      'Request-Timestamp': timestamp,
      'Request-Target': endpointUrl,
      'Signature': signature,
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
  return !!(DOKU_CLIENT_ID && DOKU_SECRET_KEY && DOKU_PRIVATE_KEY);
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
 * Verify DOKU webhook signature (Symmetric Signature)
 */
export function verifyWebhookSignature(
  clientId: string,
  requestId: string,
  requestTimestamp: string,
  requestTarget: string,
  requestBody: string,
  receivedSignature: string
): boolean {
  const digest = generateDigest(requestBody);
  const expectedSignature = generateSymmetricSignature(
    clientId,
    requestId,
    requestTimestamp,
    requestTarget,
    digest,
    DOKU_SECRET_KEY
  );

  return receivedSignature === expectedSignature;
}


