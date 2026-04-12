/**
 * MONEI API Client for Saleor Payment App
 *
 * Handles all communication with the MONEI Payments API.
 * Uses MONEI REST API v1: https://docs.monei.com/api
 */

export interface MoneiPaymentRequest {
  amount: number;
  currency: string;
  orderId: string;
  description?: string;
  customer?: {
    email?: string;
    name?: string;
    phone?: string;
  };
  billingDetails?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      zip?: string;
      country?: string;
    };
  };
  shippingDetails?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      zip?: string;
      country?: string;
    };
  };
  paymentMethod?: {
    type?: string;
  };
  callbackUrl?: string;
  completeUrl?: string;
  cancelUrl?: string;
  sessionDetails?: Record<string, string>;
  transactionType?: "SALE" | "AUTH";
}

export interface MoneiPaymentResponse {
  id: string;
  amount: number;
  currency: string;
  orderId: string;
  status: MoneiPaymentStatus;
  statusCode?: string;
  statusMessage?: string;
  nextAction?: {
    type: string;
    redirectUrl?: string;
    mustRedirect?: boolean;
  };
  paymentMethod?: {
    type: string;
    card?: {
      brand: string;
      last4: string;
      expMonth: number;
      expYear: number;
    };
    bizum?: {
      phoneNumber?: string;
    };
  };
  createdAt: string;
  updatedAt: string;
  livemode: boolean;
}

export type MoneiPaymentStatus =
  | "PENDING"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELED"
  | "AUTHORIZED"
  | "EXPIRED"
  | "PARTIALLY_REFUNDED"
  | "REFUNDED";

export interface MoneiCaptureRequest {
  amount?: number;
}

export interface MoneiRefundRequest {
  amount?: number;
  reason?: string;
}

export interface MoneiRefundResponse {
  id: string;
  paymentId: string;
  amount: number;
  currency: string;
  status: string;
  reason?: string;
  createdAt: string;
}

export class MoneiClient {
  private apiKey: string;
  private baseUrl = "https://api.monei.com/v1";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: Record<string, unknown>
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      Authorization: this.apiKey,
      "Content-Type": "application/json",
    };

    const options: RequestInit = { method, headers };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`MONEI API error ${response.status}: ${errorBody}`);
    }

    return (await response.json()) as T;
  }

  async createPayment(params: MoneiPaymentRequest): Promise<MoneiPaymentResponse> {
    return this.request<MoneiPaymentResponse>(
      "POST",
      "/payments",
      params as unknown as Record<string, unknown>
    );
  }

  async getPayment(paymentId: string): Promise<MoneiPaymentResponse> {
    return this.request<MoneiPaymentResponse>("GET", `/payments/${paymentId}`);
  }

  async capturePayment(
    paymentId: string,
    params?: MoneiCaptureRequest
  ): Promise<MoneiPaymentResponse> {
    return this.request<MoneiPaymentResponse>(
      "POST",
      `/payments/${paymentId}/capture`,
      params as unknown as Record<string, unknown>
    );
  }

  async cancelPayment(paymentId: string): Promise<MoneiPaymentResponse> {
    return this.request<MoneiPaymentResponse>("POST", `/payments/${paymentId}/cancel`);
  }

  async refundPayment(
    paymentId: string,
    params?: MoneiRefundRequest
  ): Promise<MoneiRefundResponse> {
    return this.request<MoneiRefundResponse>(
      "POST",
      `/payments/${paymentId}/refund`,
      params as unknown as Record<string, unknown>
    );
  }

  verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
    const crypto = require("crypto");
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body, "utf8")
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }
}
