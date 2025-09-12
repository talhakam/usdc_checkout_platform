# Scripts

Utility and test scripts for the USDC Checkout Platform.

## How to Run/Test Scripts

1. Install dependencies (from the root):
   ```sh
   pnpm install
   ```
2. Run a script (example):
   ```sh
   pnpm ts-node scripts/testRedisUpstash.ts
   pnpm ts-node scripts/testSupabase.ts
   ```
   Or for JavaScript:
   ```sh
   node scripts/testRedisUpstash.js
   ```

## Notes
- Scripts are for testing integrations (Supabase, Upstash Redis, etc.)
- Ensure environment variables are set as required for each script.
