# Next implementation slice: Settings consistency and local backup

## Scope delivered

- Settings now presents USD as a locked MVP currency and displays the official overhead, target gross margin, and minimum-margin warning from shared pricing defaults.
- Stale browser settings cannot switch the MVP currency to VND or override the approved costing defaults.
- Quote validity and company display name remain editable and stored locally.
- Settings explicitly indicates AI and supplier APIs are not connected in this prototype; it avoids presenting demo statuses as live integrations.
- Added a JSON export of the app data keys currently stored in this browser and an explicit, confirmed clear-data action. Workspace settings are retained when business data is cleared.
- The backup export includes only recognized application keys, identifies its format/version/export time, and does not implement restore. Treat exported customer and quote data as sensitive.

## Verification status

This update is source-level only. Build/lint/tests have not been run in the current GitHub editing environment. The repository has no configured automated unit-test script. Run `npm run build` and `npm run lint` in CI or a local checkout before release.

## Remaining work

- Add an automated test runner and tests for price calculations, import parsing, settings validation, backup, and data clearing.
- Decide whether project-level costing overrides should be persisted separately from the official baseline; current prototype edits are local to the browser.
- Implement backend authentication, database persistence, tenant/role authorization, audit, approvals, and immutable quote issuance before production customer use.
- Build the remaining prototype modules against real business APIs and remove any mock-only assumptions.
