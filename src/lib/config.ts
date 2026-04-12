import { z } from "zod";

const envSchema = z.object({
  MONEI_API_KEY: z.string().min(1, "MONEI_API_KEY is required"),
  MONEI_ACCOUNT_ID: z.string().min(1, "MONEI_ACCOUNT_ID is required"),
  MONEI_WEBHOOK_SECRET: z.string().default(""),
  MONEI_ENVIRONMENT: z.enum(["test", "live"]).default("test"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
});

export type Config = z.infer<typeof envSchema>;

let config: Config | null = null;

export function getConfig(): Config {
  if (!config) {
    config = envSchema.parse(process.env);
  }
  return config;
}

export function getMoneiClient() {
  const { MoneiClient } = require("./monei-client");
  return new MoneiClient(getConfig().MONEI_API_KEY) as import("./monei-client").MoneiClient;
}

/**
 * Supported payment methods for this app
 */
export const SUPPORTED_PAYMENT_METHODS = ["card", "bizum", "applePay", "googlePay"] as const;

export type SupportedPaymentMethod = (typeof SUPPORTED_PAYMENT_METHODS)[number];
