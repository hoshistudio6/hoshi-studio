# Hoshi Studio

A self-contained storefront for Hoshi Studio, with a local product catalogue, cart and checkout capture, plus an admin dashboard for products and orders.

## Run locally

This project needs Node.js 18 or later and has no external packages to install.

```powershell
node server.js
```

Then visit `http://localhost:3000`. The studio dashboard is at `http://localhost:3000/login.html`.

The starter admin password is `hoshi-admin`. Set a strong password before deployment:

```powershell
$env:ADMIN_PASSWORD = "your-strong-password"
node server.js
```

## What is included

- Responsive editorial storefront, category filters, product cards, cart, newsletter acknowledgement, and checkout form.
- Orders written to `data/orders.json` and manageable products in `data/products.json`.
- Cookie-protected studio dashboard for creating, editing, hiding, deleting products, and viewing orders.
- UPI, card and COD checkout options are represented in the customer journey. The checkout currently records orders as `Payment pending`; it does **not** charge customers.

## Production checklist

This lightweight setup is ideal for a prototype or small private deployment. Before accepting real orders/payments:

1. Replace JSON storage with a managed database such as PostgreSQL/Supabase, including backups and migrations.
2. Integrate Razorpay (best fit for UPI/India) or Stripe Checkout on the server. Create the payment order server-side, verify the provider webhook signature, and mark the corresponding order as paid only after that verification.
3. Move sessions to a persistent secure store, use HTTPS, set `Secure` cookies, hash administrator credentials, and add rate limiting.
4. Store product images in an image host/CDN and configure the production `PORT` and `ADMIN_PASSWORD` as secret environment variables.

For a quick demo deployment, deploy to any Node-compatible host (Render, Railway, Fly.io, or a VPS), run `node server.js`, and set `ADMIN_PASSWORD` in its secrets/settings.
