# web (Next.js app)

This folder contains the Next.js application for the USDC Checkout Platform.

Tech highlights
- Next.js (App Router)
- React 18 (server + client components)
- Tailwind CSS for styling
- Wagmi + RainbowKit for wallet/connect
- viem / ethers for contract interactions
- @tanstack/react-query (v5) for client caching

## Prerequisites
- Node 18+ (recommended)
- pnpm (this monorepo uses pnpm; npm/yarn also work)

## Quick start

Install dependencies (run from repository root or inside `apps/web`):

```bash
pnpm install
```

Run the dev server:

```bash
pnpm --filter ./apps/web dev
```

Build for production:

```bash
pnpm --filter ./apps/web build
pnpm --filter ./apps/web start
```

Open http://localhost:3000 in your browser.

## Available scripts (in `apps/web/package.json`)

- `dev` — start Next.js in development
- `build` — compile the app for production
- `start` — run compiled app
- `lint` — run ESLint
- `test` — run Jest tests

## Optional / developer dependencies

The project scaffolds a few pages that rely on additional UI/validation libraries. Install them if you plan to use those features:

- react-hook-form + zod (forms and validation)
- @hookform/resolvers (zod integration for react-hook-form)
- framer-motion (animation)
- shadcn/ui or your preferred component library (optional)

Example (inside `apps/web`):

```bash
pnpm add react-hook-form zod @hookform/resolvers framer-motion
```

Note: the starter `package.json` already includes wagmi, rainbowkit, viem, ethers, and react-query. If you add UI libraries, keep versions compatible with React 18 / Next.js 14.

## Project structure (important files)

- `app/layout.tsx` — top-level site layout (server component)
- `app/providers.tsx` — client-only provider wrapper (Wagmi, React Query, RainbowKit)
- `app/page.tsx` — root page (server component that mounts client `HomeClient`)
- `components/` — UI components (Header, WalletConnectButton, HomeClient)
- `src/wagmi-config.ts` — wagmi config and chains
- `public/deployments.json` — deployed contract addresses used by the app

## Common gotchas / Troubleshooting

- Hydration mismatch ("Hydration failed because the initial UI does not match...")
  - Cause: rendering client-only providers or wallet UI on the server boundary. Fix: keep layout/header as server components and wrap only client components with `app/providers.tsx`.

- React Query error ("No QueryClient set, use QueryClientProvider to set one")
  - Cause: using React Query hooks without a `QueryClientProvider`. Fix: ensure `providers.tsx` mounts a `QueryClientProvider` and that any component using `useQuery`/`useMutation` is rendered under it.

- Wagmi error ("useConfig must be used within WagmiProvider")
  - Cause: using wagmi hooks (`useAccount`, `usePublicClient`, `useWalletClient`, etc.) outside of a `WagmiProvider`. Fix: move wagmi hooks into client components and render them under the `Providers` wrapper.

- Missing module errors for forms (e.g. `react-hook-form`, `zod`) after adding pages
  - Cause: the new pages import optional libraries that are not installed. Install the packages listed above in the Optional section.

## Deploy

This repo is configured for static/SSR builds using Next.js. Deploy to Vercel for the smoothest experience, or use your preferred Node host. Make sure to set any required environment variables on the host.

## Contributing

If you add features that require new packages, please update `apps/web/package.json` and the monorepo install instructions in the root README.
