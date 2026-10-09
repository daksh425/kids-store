# BrightBuds: printables that help little minds bloom

An MVP of the "Kids Digital Products Platform" plan: a store for printable kids e-books, colouring books, activity books,
worksheets and learning packs, with Razorpay payments, secure downloads and an admin dashboard.

Stack: Next.js 16 (App Router) · Tailwind CSS 4 · PostgreSQL + Prisma 7 · Razorpay · Nodemailer.

## Run it locally

Needs Node 20+ and PostgreSQL (this machine uses Homebrew Postgres on port 5433).

```bash
npm install
cp .env.example .env        # then edit DATABASE_URL, ADMIN_PASSWORD, SESSION_SECRET
createdb kids_store         # or any name that matches DATABASE_URL
npm run setup               # applies migrations and seeds 23 sample products with real PDFs
npm run dev                 # http://localhost:3100
```

- Store: http://localhost:3100
- Admin: http://localhost:3100/admin (password is `ADMIN_PASSWORD` in `.env`)

`npm run db:reset` wipes the database (orders included) and re-seeds. `npm run db:studio` opens a table browser.

## Payments (Razorpay)

With no keys in `.env`, checkout runs in **demo mode**: a simulated payment screen that goes through the same
server-side signature check as a real payment. Demo mode is impossible in a production build; without keys a
production build refuses paid orders.

To use real Razorpay **Test Mode**:

1. Razorpay Dashboard → switch to Test Mode → Account & Settings → API Keys → Generate key.
2. Put them in `.env` as `RAZORPAY_KEY_ID` (starts `rzp_test_`) and `RAZORPAY_KEY_SECRET`, then restart `npm run dev`.
3. Pay with Razorpay's test cards or test UPI ID from their docs.
4. Optional, once deployed on a public URL: add a webhook to `https://<your-domain>/api/razorpay/webhook` for
   `payment.captured` and `order.paid`, and put its secret in `RAZORPAY_WEBHOOK_SECRET`. This marks orders paid even
   if the customer closes the tab before the browser reports back.

The key secret is only read in `src/lib/razorpay.ts`, which is server-only. An order becomes PAID only after the
HMAC signature check passes (`/api/checkout/verify` or the webhook).

## How the flow works

1. Visitor → home → category → product page → Buy now / Add to cart.
2. Checkout collects name, email, phone. The server re-prices the cart from the database (never trusts the browser),
   applies any coupon, creates the order and a Razorpay order.
3. Razorpay Checkout opens; on success the server verifies the signature, marks the order PAID and issues one download
   token per product.
4. The order page shows Download buttons; the confirmation email has the same links.
5. `/download/<token>` is the only way files leave the server: the token must belong to a paid order, be unexpired and
   have downloads left (`DOWNLOAD_LIMIT`, `DOWNLOAD_EXPIRY_DAYS`). Files live in `storage/`, never in `public/`.
6. Customers see past orders under **My orders**: orders placed in that browser show automatically; on another device
   they request a one-time email sign-in link.

Free resources (price ₹0) use the same checkout, minus payment, so every freebie builds your email list.

## Grown-up Reads (novels)

A separate section at `/grown-ups`, kept out of every kids page, menu and listing. Its first title is
**Billionaire Fake Fiancée**, with its own landing page at `/grown-ups/billionaire-fake-fiancee` and a free Chapter One
reader at `/sample/billionaire-fake-fiancee`.

- Manuscript: `prisma/seed/books/billionaire-fake-fiancee/*.md` (one file per chapter; `*italic*`, `**bold**`, `* * *`).
- Typesetter: `prisma/seed/book/typeset.ts` builds the 6×9" book (cover, front matter, contents, chapters, back cover)
  and the free sample. `npm run db:seed` regenerates both after you edit the text.
- Fonts: `prisma/seed/fonts` (Libre Baskerville, Abril Fatface, Great Vibes; SIL Open Font License, licences included).
- Store cover image: `prisma/seed/assets/billionaire-fake-fiancee-cover.jpg`, a render of page 1. Re-render it if you
  change the cover design.
- Landing page copy (characters, tropes, FAQs): `src/content/billionaire-fake-fiancee.ts`.

## Admin

Dashboard (sales, 14-day revenue, funnel from product views to downloads, top products) · Products (add/edit, PDF and
cover upload, category, age, price, sale price, status) · Orders (search, payment details, resend email) · Customers
(order history) · Downloads (limits, activity log, reset or reissue a link) · Coupons (percent or flat, minimum order,
max uses, expiry, enable/disable) · Emails (everything sent, or saved when SMTP isn't configured) · Messages (contact
form).

## Email

Without `SMTP_HOST`, emails aren't sent; they're saved and shown in Admin → Emails, and the "My orders" sign-in link is
shown on screen in development. Fill in the `SMTP_*` values (any provider, e.g. Resend, Brevo, Amazon SES, Gmail app
password) to deliver them.

## Before going live

- Replace the seeded sample products, covers and PDFs with your own (Admin → Products).
- Have the Terms, Privacy and Refund pages reviewed; they're starting templates.
- Set a strong `ADMIN_PASSWORD` and `SESSION_SECRET`, set `APP_URL` to your domain, add live Razorpay keys only after
  testing and completing Razorpay onboarding.
- `storage/` holds the product files: back it up, or move files to object storage (S3, R2) when you deploy to a host
  without a persistent disk.

## Project layout

```
prisma/schema.prisma        database tables (users, products, orders, order_items, downloads, coupons, events…)
prisma/seed.ts, seed/       sample catalogue + generators for the sample PDFs and covers
src/app/(store)/            storefront pages
src/app/admin/              admin dashboard (login in (auth), everything else in (panel))
src/app/api/                checkout, verify, webhook, cart quote, analytics
src/app/download/[token]    secure file delivery
src/lib/                    orders, razorpay, sessions, email, storage, catalogue
```
