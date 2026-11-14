# Implementation status and completion plan

**Updated:** 2026-11-14. This is a status summary based on the repository source, not a claim that the full business platform is production-ready.

## Completed in the current repository

- React + TypeScript + Vite frontend shell and 12 routed menu entries.
- Product requirement, logical PostgreSQL schema, REST API contract, wireframes, and sprint roadmap documentation.
- USD-only initial pricing decisions recorded in `docs/PRICING_POLICY.md`.
- Official internal cost baseline for BOM PCBA, Wire harness, and IoT and the pricing preview calculator in `src/modules/costing/CostingPage.tsx` and `src/lib/pricing.ts`.
- Costing UI supports category selection, cost lines, quantity, overhead/gross-margin inputs, cost calculation, local browser persistence, Excel import/export and browser print.
- The current official unit-cost baseline should remain unchanged until the product owner requests new prices. Price changes should update source values and policy documentation together.

## Not complete / not production-ready

- The app does not have a backend API, database migrations, login, organization isolation, or server-enforced authorization.
- Browser localStorage is per-browser and editable; it is not a shared or audited source of truth.
- No approval workflow or immutable, versioned quote issuance is connected to Costing. The page calculates a preview and browser print only.
- Most other menus remain prototype/demo screens; visible mock data, mock AI responses and provider status are not proof of real integrations.
- There is no automated test script in `package.json`, and this status update does not claim that build or lint has passed.
- No current supplier API, ERP, email service, or AI provider is wired as a verified production integration.

## Recommended completion sequence

### Phase 1 — Verify the existing frontend

1. Run `npm ci`, `npm run build`, and `npm run lint` in CI; fix compile/lint issues.
2. Add tests for pricing formulas and validation, Excel import, localStorage migration, and exports.
3. Ensure official prices are clearly separated from per-project estimates and show a warning whenever users customize/import project costs.
4. Remove hard-coded fake API credentials and any false “connected” integration indicators from demo screens.

**Exit criteria:** green CI; baseline values/formulas checked against policy; sample/demo status clearly communicated.

### Phase 2 — Secure persistent foundation

1. Choose backend hosting, authentication provider, PostgreSQL and private object storage.
2. Implement tenant/user/role and server-side authorization before customer or cost data APIs.
3. Add database migrations, audit log, input validation, backup, and file access controls.
4. Enforce USD and decimal-money validation server-side; never trust client-calculated totals.

**Exit criteria:** users can only access authorized tenant records; changes are auditable and recoverable.

### Phase 3 — MVP business workflow

1. Customer/contact and CRM opportunity CRUD.
2. RFQ creation, status history, private attachments and deadline tracking.
3. BOM revisions and supplier quotations with source/date/currency/validity.
4. Costing revisions for the three official categories; preserve approved baseline and per-project overrides distinctly.
5. Quote draft, manager approval below margin floor, immutable quote revisions, PDF/Excel snapshot exports.

**Exit criteria:** complete Customer → RFQ → BOM/Supplier → Costing → Approval → Quote lifecycle with integration tests.

### Phase 4 — Remaining menus and guarded AI

1. Build Dashboard metrics from authorized production data.
2. Complete PCB AI, Harness AI, Supplier and Competitor workflows with real sources and clear assumptions.
3. Add AI gateway on backend with permission-scoped retrieval, usage controls, citations and human review.
4. Add monitoring, accessibility, performance review, incident and support procedures.

**Exit criteria:** user acceptance testing, security review, verified integration ownership, rollback and operational runbooks.

## Product-owner decisions already set

- Currency: USD only for MVP.
- Overhead default: 8% of direct cost.
- Price method: 25% gross margin on selling price, not markup.
- Minimum gross margin: 20%, flagged for manager review.
- Official baseline prices are in `docs/PRICING_POLICY.md`; do not change unless the owner explicitly requests it.
- Taxes, freight, duties, payment fees, NRE/tooling, yield/scrap and FX are excluded unless itemized.

## Change control for official prices

When the owner requests new prices, update all of these in one reviewed change: the official baseline in Costing source, the example/calculation table in `docs/PRICING_POLICY.md`, and any affected tests. Do not silently change existing approved/issued quote snapshots when a backend is added.
