import { createAppRegisterHandler } from "@saleor/app-sdk/handlers/next";

import { saleorApp } from "@/lib/saleor-app";

/**
 * Registration endpoint
 *
 * Saleor calls this endpoint during app installation to exchange auth tokens.
 * The token is persisted via the configured APL (FileAPL or UpstashAPL).
 */
export default createAppRegisterHandler({
  apl: saleorApp.apl,
  allowedSaleorUrls: [(url: string) => url.startsWith("http")], // Restrict in production
});
