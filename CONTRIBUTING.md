# Contributing

Thanks for taking the time to improve Meridian Commerce. This project aims to stay small
enough to read in an afternoon, so the bar for new dependencies and abstractions is high.

## Setup

```bash
git clone https://github.com/daxjain789/e-commerce.git
cd e-commerce
cp .env.example .env.local
npm install
npm run dev
```

## Before opening a pull request

Run all three checks locally — CI runs the same commands:

```bash
npm run typecheck
npm run lint
npm run build
```

Then click through the flow you changed in a browser at desktop **and** mobile widths,
including the admin panel. UI changes are reviewed visually, not just by diff.

## Guidelines

- **Money is integer cents.** Never introduce floating-point arithmetic for prices or totals.
- **The server owns the numbers.** The checkout API recalculates subtotal, shipping, tax and
  total from the database; never trust client-submitted prices.
- **Block types are declarative.** Add a block by extending `src/lib/blocks.ts` and the
  renderer in `src/components/store/blocks.tsx`; the admin editor picks it up automatically.
- **No `dangerouslySetInnerHTML` on CMS content.** Rich text is parsed by `src/lib/richtext.tsx`.
- **Keep the storefront accessible**: labelled controls, keyboard-reachable menus, visible focus.
- **One concern per PR**, with a short description of the user-visible change and screenshots
  for anything visual.
- New runtime dependencies need a justification in the PR description.

## Commit messages

Short imperative subject line ("Add order search by email"), then a body explaining the
*why* when it is not obvious. Reference the issue number when there is one.

## Adding a payment provider

See [`docs/PAYMENTS.md`](docs/PAYMENTS.md). Providers that require storing card data will not
be merged — use a hosted checkout.
