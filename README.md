# Zari Lane — e-commerce storefront

Full-stack ethnic-wear store (lehenga cholis, sarees): catalogue, search, filters, variants, bag, coupons,
phone-OTP login, addresses, shipping methods, Cashfree payments (online / advance + COD / COD), Twilio Verify OTP,
order confirmation, order tracking and a small admin for order status.

**Stack:** Next.js 15 (App Router) · React 19 · Tailwind CSS 4 · Prisma 6 (SQLite dev / Postgres prod) · Zod · jose (JWT sessions) · Cashfree · Twilio Verify.

## Quick start

```bash
npm install                 # also runs `prisma generate`
cp .env.example .env        # then set AUTH_SECRET (see below)
npx prisma migrate deploy   # creates prisma/dev.db
npm run seed                # 32 products, 7 collections, coupons, shipping methods, reviews
npm run dev                 # http://localhost:3000
npm test                    # pricing + signature self-checks
```

Generate an `AUTH_SECRET`: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### Logging in during development
Login is mobile number + OTP. With `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` and `TWILIO_VERIFY_SID` set, Twilio Verify
sends and checks the SMS (a Twilio trial account only texts verified numbers; Indian numbers need DLT registration for live use).
Without them, outside production, the OTP is shown under the OTP box ("Dev mode OTP") and printed in the server console as
`[otp] <phone>: <code>`. In production Twilio is required. `ADMIN_PHONES` numbers can open `/admin`.

## Payments (Cashfree)

| Mode | When | Behaviour |
|---|---|---|
| **Cashfree** | `CASHFREE_APP_ID` + `CASHFREE_SECRET_KEY` set | Real Cashfree Checkout (`CASHFREE_ENV=sandbox` for test keys, `production` for live) |
| **Simulator** | no keys, `NODE_ENV!=production` (or `PAYMENT_SIMULATOR=true`) | Local checkout modal with Success / Failure; issues an HMAC signature that the server verifies |

Flow: `POST /api/checkout/order` (server re-prices the cart, creates the order + Cashfree order) → Checkout opens →
`POST /api/payments/verify` asks Cashfree for the order's successful payment (amount must match) → order `CONFIRMED`, stock decremented, bag cleared.
Failures / dismissals → `POST /api/payments/failed` → order `PAYMENT_FAILED`, retry from the order page (`/api/payments/retry`).

**Webhook** (safety net if the customer closes the tab after paying): Cashfree Dashboard → Developers → Webhooks →
URL `https://<your-domain>/api/webhooks/cashfree`, events Payment Success, Payment Failed, Payment User Dropped.
The signature (`x-webhook-signature` over `x-webhook-timestamp + body`, keyed by `CASHFREE_SECRET_KEY`) and amount are verified; processing is idempotent.

Duplicate protection: per-click idempotency key (unique in DB, concurrent duplicates return the same order),
unpaid orders for an identical cart are reused, and `markPaid` is idempotent across verify + webhook.

Pricing rules (`src/lib/pricing.ts`): Pay Online = extra 20% off (max ₹150); Pay ₹149 advance + rest COD = extra ₹50 off;
**Buy 2 Get 1 Free** (automatic): in every group of 3 items in the bag the cheapest is free; prices stay unchanged and it is applied before coupons and the online/advance discount;
coupons `SALE10` (2 items, ₹2449+, 10% up to ₹200) and `SALE20` (3 items, ₹3699+, 20% up to ₹250); Standard delivery free, Express ₹149.

## Routes

| Page | Path |
|---|---|
| Home | `/` |
| Collection (filters, sort, infinite scroll) | `/:slug/collection/:id` |
| Product (variants, gallery, offers) | `/:slug/catalogue/:productId/:sku` |
| Search (typeahead) | `/search?q=` |
| Bag | `/bag` |
| Checkout (Login → Address → Payment) | `/checkout` |
| Orders / order detail + tracking | `/orders`, `/orders/:id` |
| Saved addresses | `/addresses` |
| Reviews | `/reviews` |
| Policies | `/about-us`, `/return-policy`, `/terms-and-conditions`, `/privacy-policy`, `/shipping-policy` |
| Admin (order status) | `/admin` |

## Project layout

```
prisma/            schema, migrations, seed
src/lib/           db, auth (OTP + JWT), cart, catalog, pricing, orders, cashfree, validation, art (SVG product art)
src/app/api/       route handlers (auth, cart, coupon, products, search, addresses, checkout, payments, webhooks, admin)
src/app/(shop)/    pages with full header/footer
src/app/(flow)/    bag / checkout / account pages with the compact header
src/components/    UI (Store context, Listing, ProductDetail, Checkout, usePayment, …)
```

Product and banner images are generated SVG artwork (`/img/...`) until you import your own media.

## Importing your product photos & videos

```bash
npm run import -- path/to/folder            # add products
npm run import -- path/to/folder --replace  # also remove the demo products (ones never ordered)
```

`folder/products.csv` (header row required):

| column | example |
|---|---|
| name | `Wine Dola Silk Patola Lehenga Choli` |
| type | `Lehenga Choli` / `Saree` |
| color | `WINE` (used by the Colour filter) |
| price, mrp | `1599`, `2899` |
| sizes | `FREE SIZE:25` or `S:10\|M:10\|L:5` (size:stock) |
| description | free text (quote it if it has commas/newlines) |
| images | `wine/1.jpg\|wine/2.jpg` (relative to the folder) |
| collections | `LEHENGA CHOLI\|TOP SELLER` |

Videos in `folder/videos/*.mp4` are copied to `public/media/videos/` and play in the two home-page video blocks.
Images are copied into `public/media/products/`; commit that folder (or move it to object storage) when deploying.

## Deployment

### Render + Postgres (recommended)
`prisma/schema.prisma` already targets `postgresql`; the build command (`prisma db push && next build`)
pushes the schema to whatever `DATABASE_URL` is set at build time — no migration files to manage for a
single-environment deploy.

`render.yaml` in the repo root defines the web service + Postgres DB as a Render **Blueprint**:

1. Dashboard → **New → Blueprint** → pick this repo. Render provisions the `zarilane-db` Postgres
   instance and the `zarilane` web service, and wires `DATABASE_URL` automatically.
2. Fill in the env vars marked `sync: false` in `render.yaml`: `NEXT_PUBLIC_SITE_URL` (your
   `*.onrender.com` URL, known after the first deploy), `ADMIN_PHONES`, and either real
   `CASHFREE_APP_ID`/`CASHFREE_SECRET_KEY` (and `CASHFREE_ENV`), `TWILIO_ACCOUNT_SID`/`TWILIO_AUTH_TOKEN`/`TWILIO_VERIFY_SID`,
   or leave `PAYMENT_SIMULATOR` at its default `"true"` to use the built-in payment simulator (login needs Twilio in production). `AUTH_SECRET` is generated for you.
3. Deploy. Seed once from your machine: `DATABASE_URL=<the Render Postgres external URL> npm run seed`.
4. If using real Cashfree keys, add the webhook pointing at the deployed URL.

(No blueprint? Create the Postgres instance and web service by hand instead — build command
`npm run build`, start command `npm start` — and set the same env vars.)

> If you outgrow a single environment (staging + prod, multiple devs), switch back to tracked
> migrations: `npx prisma migrate dev --name init` and `prisma migrate deploy` in the build command.

### Docker / VPS (SQLite)
```bash
docker build -t zarilane .
docker run -p 3000:3000 --env-file .env -v zarilane-data:/app/data -e DATABASE_URL=file:/app/data/prod.db zarilane
```
The container runs `prisma migrate deploy` on start; seed once with
`docker exec <id> npx tsx prisma/seed.ts`.

### Before going live
- Set the Twilio Verify vars (and complete DLT registration for Indian SMS).
- Use live Cashfree keys with `CASHFREE_ENV=production` and remove `PAYMENT_SIMULATOR`.
- Stock is decremented on confirmation (no reservation during checkout) — see the `ponytail:` note in `src/lib/orders.ts`.
