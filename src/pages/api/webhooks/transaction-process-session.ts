import { SaleorSyncWebhook } from "@saleor/app-sdk/handlers/next";
import type { NextApiRequest, NextApiResponse } from "next";

import { saleorApp } from "@/lib/saleor-app";
import { getMoneiClient } from "@/lib/config";
import { mapMoneiStatusToSaleorResult } from "@/lib/monei-status-mapping";

/**
 * TRANSACTION_PROCESS_SESSION webhook
 *
 * Called when the storefront invokes transactionProcess after the customer
 * completes an additional action (e.g., 3D Secure, Bizum confirmation).
 *
 * Flow:
 *   1. Previous webhook returned ACTION_REQUIRED with a redirect URL
 *   2. Customer completes the action (3DS, Bizum app, etc.)
 *   3. Storefront calls transactionProcess
 *   4. We check the MONEI payment status and return the final result
 */

const TRANSACTION_PROCESS_SESSION_SUBSCRIPTION = `
  subscription TransactionProcessSession {
    event {
      ... on TransactionProcessSession {
        action {
          amount
          currency
          actionType
        }
        sourceObject {
          ... on Checkout {
            id
          }
          ... on Order {
            id
          }
        }
        transaction {
          id
          pspReference
        }
        data
      }
    }
  }
`;

export const transactionProcessSessionWebhook = new SaleorSyncWebhook<any>({
  name: "Transaction Process Session",
  webhookPath: "api/webhooks/transaction-process-session",
  event: "TRANSACTION_PROCESS_SESSION",
  apl: saleorApp.apl,
  query: TRANSACTION_PROCESS_SESSION_SUBSCRIPTION,
});

export default transactionProcessSessionWebhook.createHandler(
  async (req: NextApiRequest, res: NextApiResponse, ctx) => {
    const { payload } = ctx;
    const event = payload;

    console.log("[MONEI] Transaction process session", JSON.stringify(event, null, 2));

    const action = event.action;
    const transaction = event.transaction;
    const data = typeof event.data === "string" ? JSON.parse(event.data || "{}") : event.data || {};

    // The pspReference is the MONEI payment ID from the initialize step
    const moneiPaymentId = data.moneiPaymentId || transaction?.pspReference;

    if (!moneiPaymentId) {
      const failureResult =
        action.actionType === "AUTHORIZATION" ? "AUTHORIZE_FAILURE" : "CHARGE_FAILURE";

      return res.status(200).json({
        result: failureResult,
        amount: action.amount,
        message: "Missing MONEI payment ID",
        data: { error: true },
      });
    }

    try {
      const client = getMoneiClient();
      const moneiPayment = await client.getPayment(moneiPaymentId);

      const transactionType = action.actionType === "AUTHORIZATION" ? "AUTH" : "SALE";
      const result = mapMoneiStatusToSaleorResult(moneiPayment.status, transactionType);

      const responseData: Record<string, unknown> = {
        moneiPaymentId: moneiPayment.id,
        moneiPaymentStatus: moneiPayment.status,
      };

      if (moneiPayment.paymentMethod) {
        responseData.paymentMethod = moneiPayment.paymentMethod;
      }

      // If still pending (e.g., Bizum timeout), return action required again
      if (moneiPayment.status === "PENDING" && moneiPayment.nextAction?.redirectUrl) {
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
      console.error("[MONEI] Error processing payment:", error);

      const failureResult =
        action.actionType === "AUTHORIZATION" ? "AUTHORIZE_FAILURE" : "CHARGE_FAILURE";

      return res.status(200).json({
        pspReference: moneiPaymentId,
        result: failureResult,
        amount: action.amount,
        message: error instanceof Error ? error.message : "Payment processing failed",
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
