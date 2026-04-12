import { createManifestHandler } from "@saleor/app-sdk/handlers/next";
import type { AppManifest } from "@saleor/app-sdk/types";

import { paymentGatewayInitializeSessionWebhook } from "./webhooks/payment-gateway-initialize-session";
import { transactionInitializeSessionWebhook } from "./webhooks/transaction-initialize-session";
import { transactionProcessSessionWebhook } from "./webhooks/transaction-process-session";

/**
 * Saleor App Manifest
 *
 * Describes the app metadata, permissions, and registered webhooks.
 * Saleor fetches this manifest when installing the app.
 */
export default createManifestHandler({
  async manifestFactory({ appBaseUrl }): Promise<AppManifest> {
    return {
      id: "saleor.app.monei",
      version: "0.1.0",
      name: "MONEI Payments",
      about:
        "Accept Bizum, card payments, Apple Pay, and Google Pay with MONEI — Spain's leading payment platform.",
      permissions: ["HANDLE_PAYMENTS"],
      appUrl: appBaseUrl,
      tokenTargetUrl: `${appBaseUrl}/api/register`,
      webhooks: [
        paymentGatewayInitializeSessionWebhook.getWebhookManifest(appBaseUrl),
        transactionInitializeSessionWebhook.getWebhookManifest(appBaseUrl),
        transactionProcessSessionWebhook.getWebhookManifest(appBaseUrl),
      ],
      extensions: [],
      author: "MONEI Digital Payments, S.L.",
      brand: {
        logo: {
          default: `${appBaseUrl}/logo.png`,
        },
      },
    };
  },
});
