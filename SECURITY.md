# Security policy

## Supported versions

The `main` branch receives security fixes. There are no maintained release branches yet.

## Reporting a vulnerability

Email **security@meridiansupply.co** with a description, reproduction steps and the affected
route or file. Please do not open a public issue for an exploitable bug.

You can expect an acknowledgement within 72 hours and a fix or mitigation plan within
14 days for confirmed issues.

## What the app does to stay safe

- Admin sessions are HttpOnly, SameSite=Lax cookies backed by a server-side session table.
- Passwords are hashed with scrypt (`node:crypto`), never stored or logged in plain text.
- Every admin API route is guarded server-side; the UI hides nothing that the API trusts.
- Checkout is authoritative: prices, stock, shipping and tax are recomputed from the database.
- Order and product mutations that touch stock run inside `BEGIN IMMEDIATE` transactions.
- CMS rich text is parsed into React nodes — no `dangerouslySetInnerHTML`, no script injection.
- Uploads are limited to 6 MB and to raster image MIME types; SVG uploads are rejected.
- Stripe webhooks are verified with an HMAC-SHA256 signature and a 5-minute timestamp window.
- Card data never touches this application; Stripe Checkout is a hosted redirect.

## Deployment checklist

- Change `ADMIN_PASSWORD` before the first boot (the account is created once).
- Serve over HTTPS and set `NEXT_PUBLIC_SITE_URL` to the public origin.
- Back up `data/store.db` and `public/uploads`.
- Put a rate-limiting proxy in front of `/api/auth/login` if the admin is internet-facing.
