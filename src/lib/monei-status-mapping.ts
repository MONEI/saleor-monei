import type { MoneiPaymentStatus } from "./monei-client";

/**
 * Saleor transaction result types
 * See: https://docs.saleor.io/developer/extending/webhooks/synchronous-events/transaction
 */
export type TransactionResult =
  | "CHARGE_SUCCESS"
  | "CHARGE_FAILURE"
  | "CHARGE_REQUEST"
  | "CHARGE_ACTION_REQUIRED"
  | "AUTHORIZE_SUCCESS"
  | "AUTHORIZE_FAILURE"
  | "AUTHORIZE_REQUEST"
  | "AUTHORIZE_ACTION_REQUIRED"
  | "CANCEL_SUCCESS"
  | "CANCEL_FAILURE"
  | "REFUND_SUCCESS"
  | "REFUND_FAILURE";

/**
 * Maps MONEI payment status to Saleor transaction result
 */
export function mapMoneiStatusToSaleorResult(
  status: MoneiPaymentStatus,
  transactionType: "SALE" | "AUTH" = "SALE"
): TransactionResult {
  switch (status) {
    case "SUCCEEDED":
      return transactionType === "AUTH" ? "AUTHORIZE_SUCCESS" : "CHARGE_SUCCESS";
    case "AUTHORIZED":
      return "AUTHORIZE_SUCCESS";
    case "FAILED":
      return transactionType === "AUTH" ? "AUTHORIZE_FAILURE" : "CHARGE_FAILURE";
    case "CANCELED":
      return "CANCEL_SUCCESS";
    case "EXPIRED":
      return transactionType === "AUTH" ? "AUTHORIZE_FAILURE" : "CHARGE_FAILURE";
    case "PENDING":
      return transactionType === "AUTH"
        ? "AUTHORIZE_ACTION_REQUIRED"
        : "CHARGE_ACTION_REQUIRED";
    case "REFUNDED":
    case "PARTIALLY_REFUNDED":
      return "REFUND_SUCCESS";
    default:
      return "CHARGE_FAILURE";
  }
}
