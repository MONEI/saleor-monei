<p align="center">
  <a href="https://monei.com">
    <img src="https://assets.monei.com/images/logo.svg" alt="MONEI" width="200" />
  </a>
</p>

<h3 align="center">MONEI Payment App for Saleor</h3>

<p align="center">
  Accept Bizum, card payments, Apple Pay, and Google Pay in your Saleor store.
  <br />
  <a href="https://docs.monei.com"><strong>Documentation &rarr;</strong></a>
  <br />
  <br />
  <a href="https://github.com/MONEI/saleor-monei/actions/workflows/ci.yml"><img src="https://github.com/MONEI/saleor-monei/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT" /></a>
  <a href="https://github.com/MONEI/saleor-monei/releases"><img src="https://img.shields.io/github/v/release/MONEI/saleor-monei?include_prereleases&label=version" alt="Version" /></a>
</p>

---

## Overview

[MONEI](https://monei.com) is a Payment Institution licensed by the Banco de Espa&ntilde;a (reg. #6911), providing API-first payment infrastructure for online and in-store commerce across Spain and Europe.

This [Saleor App](https://docs.saleor.io/developer/extending/apps/overview) integrates MONEI as a payment gateway, following the [Saleor payment app architecture](https://docs.saleor.io/developer/extending/apps/building-payment-app) and communicating via synchronous webhooks.

### Supported payment methods

| Method | Integration | Capture | Refund | Cancel |
|:-------|:------------|:-------:|:------:|:------:|
| Card (Visa, Mastercard, Amex) | MONEI.js secure iframe | Manual / Auto | &#x2713; | &#x2713; |
| Bizum | Redirect | Auto | &#x2713; | &#x2713; |
| Apple Pay | MONEI.js component | Auto | &#x2713; | &#x2713; |
| Google Pay | MONEI.js component | Auto | &#x2713; | &#x2713; |

### Why MONEI?

- **Multi-acquirer routing** &mdash; intelligent routing across multiple acquirers for optimal authorization rates
- **Scheme tokenization** &mdash; network tokens via Visa and Mastercard for higher approval rates and lower fraud
- **Native Bizum** &mdash; the only Saleor payment app offering direct Bizum acquiring, Spain's dominant mobile payment method (28M+ users)
- **PCI DSS compliant** &mdash; card data handled via MONEI.js secure iframes, keeping your store out of PCI scope
- **One integration, multiple methods** &mdash; cards, Bizum, Apple Pay, and Google Pay through a single app

---

## Architecture

```
Storefront                Saleor                   This App                 MONEI API
    |                       |                         |                        |
    |-- paymentGatewayInit ->|                         |                        |
    |                       |-- GATEWAY_INIT_SESSION ->|                        |
    |                       |<- payment methods -------|                        |
    |<- methods ------------|                         |                        |
    |                       |                         |                        |
    |-- transactionInit ---->|                         |                        |
    |                       |-- TX_INIT_SESSION ------>|-- create payment ----->|
    |                       |                         |<- payment + redirect --|
    |                       |<- result + redirect ----|                        |
    |<- redirect ------------|                         |                        |
    |                       |                         |                        |
    |-- transactionProcess ->|                         |                        |
    |                       |-- TX_PROCESS_SESSION --->|-- get payment -------->|
    |                       |                         |<- final status --------|
    |                       |<- final result ---------|                        |
    |<- confirmation --------|                         |                        |
```

The app handles three Saleor synchronous webhooks:

| Webhook | Purpose |
|:--------|:--------|
| `PAYMENT_GATEWAY_INITIALIZE_SESSION` | Returns available payment methods and MONEI.js configuration |
| `TRANSACTION_INITIALIZE_SESSION` | Creates a MONEI payment and returns the result or redirect URL |
| `TRANSACTION_PROCESS_SESSION` | Checks payment status after customer action (3D Secure, Bizum) |

---

## Quick start

### Prerequisites

- **Node.js** 18.17+ (LTS recommended)
- **MONEI account** &mdash; [sign up at monei.com](https://monei.com) and get your API Key from [Dashboard &rarr; Settings &rarr; API Access](https://dashboard.monei.com/settings/api)
- **Saleor** 3.13+ (Cloud or self-hosted)

### 1. Clone and configure

```bash
git clone https://github.com/MONEI/saleor-monei.git
cd saleor-monei
cp .env.example .env
```

Edit `.env` with your MONEI credentials:

```env
MONEI_API_KEY=your_api_key
MONEI_ACCOUNT_ID=your_account_id
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Install and run

```bash
npm install
npm run dev
```

### 3. Install in Saleor

1. Open **Saleor Dashboard &rarr; Apps &rarr; Install External App**
2. Enter your manifest URL: `http://localhost:3000/api/manifest`
3. The app registers its webhooks automatically

---

## Configuration

| Variable | Description | Required | Default |
|:---------|:------------|:--------:|:--------|
| `MONEI_API_KEY` | API key from [MONEI Dashboard](https://dashboard.monei.com/settings/api) | Yes | &mdash; |
| `MONEI_ACCOUNT_ID` | Merchant account ID | Yes | &mdash; |
| `MONEI_WEBHOOK_SECRET` | HMAC key for webhook signature verification | No | &mdash; |
| `MONEI_ENVIRONMENT` | `test` or `live` | No | `test` |
| `APL` | Auth persistence layer: `file` (dev) or `upstash` (prod) | No | `file` |
| `NEXT_PUBLIC_APP_URL` | Public URL where this app is hosted | Yes | &mdash; |

---

## Deployment

Deploy to [Vercel](https://vercel.com), [Railway](https://railway.app), or any platform that supports Next.js.

```bash
npm run build
npm start
```

For production multi-tenant deployments, set `APL=upstash` and configure [Upstash Redis](https://upstash.com) for auth token storage.

---

## Development

```bash
npm run dev       # Start dev server
npm run lint      # Lint with ESLint
npm run build     # Production build
npm test          # Run tests
```

### Project structure

```
src/
  lib/
    monei-client.ts          # MONEI Payments API client
    monei-status-mapping.ts  # MONEI -> Saleor status mapping
    config.ts                # Environment config with Zod validation
    saleor-app.ts            # Saleor auth persistence layer
  pages/
    api/
      manifest.ts            # App manifest (metadata + webhooks)
      register.ts            # App installation handler
      webhooks/
        payment-gateway-initialize-session.ts
        transaction-initialize-session.ts
        transaction-process-session.ts
    index.tsx                # Dashboard configuration page
```

---

## Documentation

| Resource | Link |
|:---------|:-----|
| MONEI API Reference | [docs.monei.com/api](https://docs.monei.com/api) |
| MONEI.js Overview | [docs.monei.com/docs/monei-js/overview](https://docs.monei.com/docs/monei-js/overview) |
| Saleor Payment Apps | [docs.saleor.io/developer/payments/payment-apps](https://docs.saleor.io/developer/payments/payment-apps) |
| Building a Payment App | [docs.saleor.io/developer/extending/apps/building-payment-app](https://docs.saleor.io/developer/extending/apps/building-payment-app) |

---

<p align="center">
  <strong>MONEI Digital Payments, S.L.</strong><br />
  Passeig de Gr&agrave;cia, 19, 08007 Barcelona, Spain<br />
  Banco de Espa&ntilde;a reg. #6911<br /><br />
  <a href="https://monei.com">Website</a> &middot;
  <a href="https://docs.monei.com">API Docs</a> &middot;
  <a href="https://support.monei.com">Support</a> &middot;
  <a href="https://www.linkedin.com/company/monei-digital-payments/">LinkedIn</a>
</p>

<p align="center">
  <a href="./LICENSE">MIT License</a> &copy; 2026 MONEI
</p>
