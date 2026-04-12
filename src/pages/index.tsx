import type { NextPage } from "next";

/**
 * App dashboard page
 *
 * Displayed when merchants open the MONEI app in the Saleor Dashboard.
 * Provides configuration status and links to MONEI documentation.
 */
const IndexPage: NextPage = () => {
  const isConfigured = !!(process.env.MONEI_API_KEY && process.env.MONEI_ACCOUNT_ID);

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif", maxWidth: 600 }}>
      <h1>MONEI Payments</h1>
      <p>
        Accept Bizum, card payments, Apple Pay, and Google Pay with MONEI.
      </p>

      <h2>Status</h2>
      <ul>
        <li>
          MONEI API Key: {isConfigured ? "Configured" : "Not configured"}
        </li>
        <li>
          Environment: {process.env.MONEI_ENVIRONMENT || "test"}
        </li>
      </ul>

      <h2>Documentation</h2>
      <ul>
        <li>
          <a href="https://docs.monei.com/api" target="_blank" rel="noreferrer">
            MONEI API Reference
          </a>
        </li>
        <li>
          <a href="https://docs.monei.com/docs/monei-js/overview" target="_blank" rel="noreferrer">
            MONEI.js Overview
          </a>
        </li>
        <li>
          <a href="https://docs.saleor.io/developer/payments/payment-apps" target="_blank" rel="noreferrer">
            Saleor Payment Apps
          </a>
        </li>
      </ul>
    </div>
  );
};

export default IndexPage;
