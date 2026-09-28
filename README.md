# Zari Lane — e-commerce storefront

Full-stack ethnic-wear store (lehenga cholis, sarees): catalogue, search, filters, variants, bag, coupons,
phone-OTP login, addresses, shipping methods, Razorpay payments (online / advance + COD / COD),
order confirmation, order tracking and a small admin for order status.

**Stack:** Next.js 15 (App Router) · React 19 · Tailwind CSS 4 · Prisma 6 (SQLite dev / Postgres prod) · Zod · jose (JWT sessions) · Razorpay.

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
Login is WhatsApp/SMS-number + OTP. In development the OTP is shown under the OTP box ("Dev mode OTP")
and printed in the server console as `[otp] <phone>: <code>`. `ADMIN_PHONES` numbers can open `/admin`.

## Payments (Razorpay)

| Mode | When | Behaviour |
|---|---|---|
| **Razorpay** | `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` set | Real Razorpay Checkout (use `rzp_test_…` keys for sandbox) |
| **Simulator** | no keys, `NODE_ENV!=production` (or `PAYMENT_SIMULATOR=true`) | Local Razorpay-like modal with Success / Failure; issues a real HMAC signature that the server verifies |

Flow: `POST /api/checkout/order` (server re-prices the cart, creates the order + Razorpay order) → Checkout opens →
`POST /api/payments/verify` checks `HMAC_SHA256(order_id|payment_id, key_secret)` → order `CONFIRMED`, stock decremented, bag cleared.
Failures / dismissals → `POST /api/payments/failed` → order `PAYMENT_FAILED`, retry from the order page (`/api/payments/retry`).

**Webhook** (safety net if the customer closes the tab after paying): Razorpay Dashboard → Settings → Webhooks →
URL `https://<your-domain>/api/webhooks/razorpay`, events `payment.captured`, `order.paid`, `payment.failed`,
secret = `RAZORPAY_WEBHOOK_SECRET`. Signature and amount are verified; processing is idempotent.

Duplicate protection: per-click idempotency key (unique in DB, concurrent duplicates return the same order),
unpaid orders for an identical cart are reused, and `markPaid` is idempotent across verify + webhook.

Pricing rules (`src/lib/pricing.ts`): Pay Online = extra 20% off (max ₹150); Pay ₹149 advance + rest COD = extra ₹50 off;
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
src/lib/           db, auth (OTP + JWT), cart, catalog, pricing, orders, razorpay, validation, art (SVG product art)
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

### Vercel + Postgres (recommended)
1. In `prisma/schema.prisma` set `provider = "postgresql"`, delete `prisma/migrations`, run
   `npx prisma migrate dev --name init` against a Postgres `DATABASE_URL` (Neon, Supabase, RDS…) and commit the new migration.
2. Import the repo in Vercel. Env vars: `DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_SITE_URL`,
   `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `ADMIN_PHONES`.
3. Build command: `prisma migrate deploy && next build`. Seed once: `DATABASE_URL=… npm run seed`.
4. Add the Razorpay webhook pointing at the deployed URL.

### Docker / VPS (SQLite)
```bash
docker build -t zarilane .
docker run -p 3000:3000 --env-file .env -v zarilane-data:/app/data -e DATABASE_URL=file:/app/data/prod.db zarilane
```
The container runs `prisma migrate deploy` on start; seed once with
`docker exec <id> npx tsx prisma/seed.ts`.

### Before going live
- Plug an SMS/WhatsApp OTP provider into `issueOtp` in `src/lib/auth.ts` (it only logs today).
- Use live Razorpay keys and keep `PAYMENT_SIMULATOR` unset.
- Stock is decremented on confirmation (no reservation during checkout) — see the `ponytail:` note in `src/lib/orders.ts`.
