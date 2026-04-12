# MONEI Payment App for Saleor

[![CI](https://github.com/MONEI/saleor-monei/actions/workflows/ci.yml/badge.svg)](https://github.com/MONEI/saleor-monei/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A [Saleor App](https://docs.saleor.io/developer/extending/apps/overview) that integrates [MONEI](https://monei.com) as a payment gateway, enabling merchants to accept Bizum, card payments, Apple Pay, and Google Pay through Saleor Commerce.

## Overview

[MONEI](https://monei.com) is a Payment Institution licensed by the Banco de España (reg. #6911), providing API-first payment infrastructure for online and in-store commerce across Spain and Europe.

This app follows the [Saleor payment app architecture](https://docs.saleor.io/developer/extending/apps/building-payment-app) and communicates with Saleor via synchronous webhooks.

### Supported payment methods

| Method | Type | Capture | Refund | Cancel |
|--------|------|---------|--------|--------|
| Card (Visa, Mastercard) | MONEI.js component | Manual / Auto | Yes | Yes |
| Bizum | Redirect | Auto | Yes | Yes |
| Apple Pay | MONEI.js component | Auto | Yes | Yes |
| Google Pay | MONEI.js component | Auto | Yes | Yes |

### Key features

- **Multi-acquirer routing** — intelligent routing across Comercia/CaixaBank, GetNet/Santander, and Shift4/Finaro for optimal authorization rates
- **Bizum** — native Bizum acquiring, Spain's dominant mobile payment method (28M+ users)
- **PCI DSS compliant** — card data handled via MONEI.js secure iframes, reducing merchant PCI scope

## Architecture

The app is a Next.js application that handles three Saleor synchronous webhooks:

| Webhook | Purpose |
|---------|---------|
| `PAYMENT_GATEWAY_INITIALIZE_SESSION` | Returns available payment methods and MONEI.js config |
| `TRANSACTION_INITIALIZE_SESSION` | Creates a MONEI payment and returns the result |
| `TRANSACTION_PROCESS_SESSION` | Checks payment status after customer action (3DS, Bizum) |

## Prerequisites

### 1. MONEI account

[Sign up at monei.com](https://monei.com) and obtain your API Key and Account ID from [MONEI Dashboard → Settings → API Access](https://dashboard.monei.com/settings/api).

### 2. Saleor Cloud or self-hosted instance

Saleor 3.13+ with the App SDK support.

## Getting started

### 1. Environment setup

```bash
cp .env.example .env
```

Edit `.env` with your MONEI credentials and app URL.

### 2. Install and run

```bash
npm install
npm run dev
```

The app runs at `http://localhost:3000`.

### 3. Install in Saleor Dashboard

1. Open Saleor Dashboard → Apps → Install External App
2. Enter your app URL: `http://localhost:3000/api/manifest`
3. The app registers its webhooks automatically

### 4. Run tests

```bash
npm test
```

## Configuration

| Variable | Description | Required |
|----------|-------------|----------|
| `MONEI_API_KEY` | MONEI API key from [Dashboard](https://dashboard.monei.com/settings/api) | Yes |
| `MONEI_ACCOUNT_ID` | MONEI merchant account ID | Yes |
| `MONEI_WEBHOOK_SECRET` | HMAC key for webhook signature verification | No |
| `MONEI_ENVIRONMENT` | `test` or `live` (default: `test`) | No |
| `APL` | Auth persistence: `file` (dev) or `upstash` (prod) | No |
| `NEXT_PUBLIC_APP_URL` | Public URL of this app | Yes |

## Deployment

Deploy to Vercel or any platform that supports Next.js:

```bash
npm run build
npm start
```

For production, use `APL=upstash` with Upstash Redis for multi-tenant auth storage.

## Documentation

- [MONEI API Reference](https://docs.monei.com/api)
- [MONEI.js Overview](https://docs.monei.com/docs/monei-js/overview)
- [Saleor Payment Apps](https://docs.saleor.io/developer/payments/payment-apps)
- [Building a Payment App](https://docs.saleor.io/developer/extending/apps/building-payment-app)

## Creator

**MONEI Digital Payments, S.L.**
Passeig de Gracia, 19, 08007 Barcelona, Spain
Banco de España reg. #6911

- Website: [monei.com](https://monei.com)
- API Docs: [docs.monei.com](https://docs.monei.com)
- Support: [support.monei.com](https://support.monei.com)

## License

[MIT](./LICENSE)
