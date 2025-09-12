# USDC Checkout Platform

This is a monorepo for the USDC Checkout Platform, built with Next.js, TurboRepo, pnpm workspaces, Supabase, and Upstash Redis.

## Structure
- `apps/web`: Next.js frontend application
- `packages/`: Shared code and libraries
- `scripts/`: Utility and test scripts

## Build & Run
1. Install dependencies:
   ```sh
   pnpm install
   ```
2. Build all apps/packages:
   ```sh
   pnpm run build
   ```
3. Run the Next.js app:
   ```sh
   pnpm --filter web dev
   ```
4. Run tests:
   ```sh
   pnpm test
   ```

## Notes
- CI runs build and test jobs on all branches except `main`.
- Deployment is handled via Vercel on the `main` branch.
