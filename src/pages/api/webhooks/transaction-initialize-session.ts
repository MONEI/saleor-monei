import { SaleorSyncWebhook } from "@saleor/app-sdk/handlers/next";
import type { NextApiRequest, NextApiResponse } from "next";

import { saleorApp } from "@/lib/saleor-app";
import { getMoneiClient } from "@/lib/config";
import { mapMoneiStatusToSaleorResult } from "@/lib/monei-status-mapping";
import type { MoneiPaymentRequest } from "@/lib/monei-client";

/**
 * TRANSACTION_INITIALIZE_SESSION webhook
 *
 * Called when the storefront invokes transactionInitialize.
 * Creates a MONEI payment and returns the result to Saleor.
 *
 * Flow:
 *   1. Storefront calls transactionInitialize with payment details
 *   2. Saleor sends this webhook with checkout/order data
 *   3. We create a MONEI payment via their API
 *   4. Return result:
 *      - CHARGE_SUCCESS if payment completed immediately
 *      - CHARGE_ACTION_REQUIRED if customer action needed (3DS, redirect)
 *      - CHARGE_FAILURE if payment failed
 */

const TRANSACTION_INITIALIZE_SESSION_SUBSCRIPTION = `
  subscription TransactionInitializeSession {
    event {
      ... on TransactionInitializeSession {
        action {
          amount
          currency
          actionType
        }
        sourceObject {
          ... on Checkout {
            id
            channel {
              slug
            }
            billingAddress {
              firstName
              lastName
              streetAddress1
              streetAddress2
              city
              countryArea
              postalCode
              country {
                code
              }
            }
            shippingAddress {
              firstName
              lastName
              streetAddress1
              city
              countryArea
              postalCode
              country {
                code
              }
            }
            email
          }
          ... on Order {
            id
            channel {
              slug
            }
            billingAddress {
              firstName
              lastName
              streetAddress1
              streetAddress2
              city
              countryArea
              postalCode
              country {
                code
              }
            }
            userEmail
          }
        }
        transaction {
          id
          pspReference
        }
        data
        idempotencyKey
      }
    }
  }
`;

export const transactionInitializeSessionWebhook = new SaleorSyncWebhook<any>({
  name: "Transaction Initialize Session",
  webhookPath: "api/webhooks/transaction-initialize-session",
  event: "TRANSACTION_INITIALIZE_SESSION",
  apl: saleorApp.apl,
  query: TRANSACTION_INITIALIZE_SESSION_SUBSCRIPTION,
});

export default transactionInitializeSessionWebhook.createHandler(
  async (req: NextApiRequest, res: NextApiResponse, ctx) => {
    const { payload } = ctx;
    const event = payload;

    console.log("[MONEI] Transaction initialize session", JSON.stringify(event, null, 2));

    const action = event.action;
    const sourceObject = event.sourceObject;
    const data = typeof event.data === "string" ? JSON.parse(event.data || "{}") : event.data || {};
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Amount from Saleor is in decimal (e.g., 10.50), MONEI expects cents (1050)
    const amountInCents = Math.round(action.amount * 100);

    const transactionType = action.actionType === "AUTHORIZATION" ? "AUTH" : "SALE";

    const moneiRequest: MoneiPaymentRequest = {
      amount: amountInCents,
      currency: action.currency,
      orderId: sourceObject.id,
      transactionType,
      completeUrl: data.completeUrl || `${appUrl}/payment/complete`,
      cancelUrl: data.cancelUrl || `${appUrl}/payment/cancel`,
      callbackUrl: `${appUrl}/api/webhooks/monei-callback`,
    };

    // Map payment method from storefront data
    if (data.paymentMethod) {
      moneiRequest.paymentMethod = { type: data.paymentMethod };
    }

    // Map customer details
    const email = sourceObject.email || sourceObject.userEmail;
    const billing = sourceObject.billingAddress;

    if (email || billing) {
      moneiRequest.customer = {
        email,
        name: billing ? `${billing.firstName} ${billing.lastName}`.trim() : undefined,
      };
    }

    if (billing) {
      moneiRequest.billingDetails = {
        name: `${billing.firstName} ${billing.lastName}`.trim(),
        email,
        address: {
          line1: billing.streetAddress1,
          line2: billing.streetAddress2,
          city: billing.city,
          state: billing.countryArea,
          zip: billing.postalCode,
          country: billing.country?.code,
        },
      };
    }

    const shipping = sourceObject.shippingAddress;
    if (shipping) {
      moneiRequest.shippingDetails = {
        name: `${shipping.firstName} ${shipping.lastName}`.trim(),
        address: {
          line1: shipping.streetAddress1,
          city: shipping.city,
          state: shipping.countryArea,
          zip: shipping.postalCode,
          country: shipping.country?.code,
        },
      };
    }

    try {
      const client = getMoneiClient();
      const moneiPayment = await client.createPayment(moneiRequest);

      const result = mapMoneiStatusToSaleorResult(moneiPayment.status, transactionType);

      // Build response data for the storefront
      const responseData: Record<string, unknown> = {
        moneiPaymentId: moneiPayment.id,
        moneiPaymentStatus: moneiPayment.status,
      };

      // If 3DS or redirect needed, include the URL
      if (moneiPayment.nextAction?.redirectUrl) {
        responseData.redirectUrl = moneiPayment.nextAction.redirectUrl;
      }

      return res.status(200).json({
        pspReference: moneiPayment.id,
        result,
        amount: action.amount,
        data: responseData,
        message: moneiPayment.statusMessage,
      });
    } catch (error) {
      console.error("[MONEI] Error creating payment:", error);

      const failureResult =
        transactionType === "AUTH" ? "AUTHORIZE_FAILURE" : "CHARGE_FAILURE";

      return res.status(200).json({
        result: failureResult,
        amount: action.amount,
        message: error instanceof Error ? error.message : "Payment creation failed",
        data: { error: true },
      });
    }
  }
);

export const config = {
  api: {
    bodyParser: false,
  },
};
