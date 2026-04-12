import { FileAPL, UpstashAPL } from "@saleor/app-sdk/APL";
import { SaleorApp } from "@saleor/app-sdk/saleor-app";

/**
 * Auth Persistence Layer (APL)
 *
 * Stores Saleor auth tokens for multi-tenancy support.
 * - FileAPL: Local development (stores tokens in a JSON file)
 * - UpstashAPL: Production (stores tokens in Upstash Redis)
 */
function getAPL() {
  if (process.env.APL === "upstash") {
    return new UpstashAPL();
  }
  return new FileAPL();
}

export const saleorApp = new SaleorApp({
  apl: getAPL(),
});
