import { SaleorSyncWebhook } from "@saleor/app-sdk/handlers/next";
import type { NextApiRequest, NextApiResponse } from "next";

import { saleorApp } from "@/lib/saleor-app";
import { SUPPORTED_PAYMENT_METHODS } from "@/lib/config";

/**
 * PAYMENT_GATEWAY_INITIALIZE_SESSION webhook
 *
 * Called when the storefront invokes paymentGatewayInitialize.
 * Returns available payment methods and any configuration the frontend
 * needs to render payment UI (e.g., MONEI account ID for MONEI.js).
 *
 * Flow: Storefront -> Saleor -> This webhook -> Response with payment methods
 */

const PAYMENT_GATEWAY_INITIALIZE_SESSION_SUBSCRIPTION = `
  subscription PaymentGatewayInitializeSession {
    event {
      ... on PaymentGatewayInitializeSession {
        sourceObject {
          ... on Checkout {
            id
            totalPrice {
              gross {
                amount
                currency
              }
            }
          }
          ... on Order {
            id
            total {
              gross {
                amount
                currency
              }
            }
          }
        }
        data
      }
    }
  }
`;

export const paymentGatewayInitializeSessionWebhook = new SaleorSyncWebhook<any>({
  name: "Payment Gateway Initialize Session",
  webhookPath: "api/webhooks/payment-gateway-initialize-session",
  event: "PAYMENT_GATEWAY_INITIALIZE_SESSION",
  apl: saleorApp.apl,
  query: PAYMENT_GATEWAY_INITIALIZE_SESSION_SUBSCRIPTION,
});

export default paymentGatewayInitializeSessionWebhook.createHandler(
  async (req: NextApiRequest, res: NextApiResponse, ctx) => {
    const { payload } = ctx;

    console.log("[MONEI] Payment gateway initialize session", JSON.stringify(payload, null, 2));

    const moneiAccountId = process.env.MONEI_ACCOUNT_ID || "";

    // Return available payment methods and MONEI.js configuration
    return res.status(200).json({
      data: {
        paymentMethods: SUPPORTED_PAYMENT_METHODS.map((method) => ({
          id: method,
          name: getPaymentMethodName(method),
          type: method,
        })),
        moneiAccountId,
        moneiEnvironment: process.env.MONEI_ENVIRONMENT || "test",
      },
    });
  }
);

function getPaymentMethodName(method: string): string {
  const names: Record<string, string> = {
    card: "Credit / Debit Card",
    bizum: "Bizum",
    applePay: "Apple Pay",
    googlePay: "Google Pay",
  };
  return names[method] || method;
}

export const config = {
  api: {
    bodyParser: false,
  },
};
