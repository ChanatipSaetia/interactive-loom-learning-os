# Steering Notes

## Active directives (remove when resolved)
- E2E readiness: Ensure Playwright can run headless against the dev server. Before running `npm run test:e2e`, run `npx playwright install chromium` once and start the dev server with `npm run dev` or configure `playwright.config.ts` webServer. (Owner: dev)

## Notes
- Current progress log shows work completed through US-3. Stories US-4..US-11 are pending implementation. No failing infrastructure observed in logs; the loop is waiting on feature implementation rather than CI/infrastructure.
- Recommended next command to start local iteration: `npm run dev` (in one terminal) then in another terminal `npm run test:e2e` after `npx playwright install chromium`.
