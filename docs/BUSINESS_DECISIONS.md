# Business decisions — initial operating defaults

**Status:** Approved as the initial product baseline by the product owner on 2026-11-14. These choices supersede open questions about currency and initial pricing assumptions in `PRD.md`, `DATABASE_SCHEMA.md`, and `API_CONTRACT.md`. They can be changed later through an explicitly approved product-policy revision.

## Decisions

1. **Currency:** USD only for the MVP. UI, API, costing, exports, and database records use USD. Do not silently convert prices from another currency. If a source file contains another currency, require an explicit conversion outside this MVP or reject/flag the import; never label a non-USD number as USD.
2. **Overhead default:** 8%, applied to direct cost for the initial estimate.
3. **Pricing method:** Gross margin on selling price, not markup. Default gross margin is 25%.
4. **Margin floor:** 20% gross margin. A price below this floor must be visibly flagged and requires manager approval before customer issue. Until approval workflow is implemented, treat every customer quote as a draft requiring manual review.
5. **Calculation:** `overhead = direct_cost × 8%`; `manufacturing_cost = direct_cost + overhead`; `selling_price = manufacturing_cost ÷ (1 − gross_margin_rate)`; `profit_per_unit = selling_price − manufacturing_cost`; `order_total = selling_price × order_quantity`.
6. **Excluded by default:** VAT/tax, freight, duties, payment charges, NRE/tooling, yield/scrap, and FX are not included unless separately entered and explicitly shown. Do not imply they are included in the unit price.
7. **Defaults are not actual company quotes:** Sample costs remain illustrative synthetic inputs. They must be replaced with current supplier quotes, labor rates, and validated process assumptions before a customer quotation is issued.
8. **AI / savings:** Current cost-saving suggestions are heuristic estimates, not market research or AI-verified savings. User review and confirmation are required.

## Reference values for checking calculations

Using the illustrative direct costs already in the Costing prototype and the defaults above:

| Category | Direct cost / unit | Overhead (8%) | Manufacturing cost | Selling price at 25% gross margin |
| --- | ---: | ---: | ---: | ---: |
| BOM PCBA | $19.75 | $1.58 | $21.33 | $28.44 |
| Wire harness | $9.50 | $0.76 | $10.26 | $13.68 |
| IoT | $26.50 | $2.12 | $28.62 | $38.16 |

These are arithmetic examples using synthetic sample data, not market prices or an approved customer quotation. UI/export rounding is to two decimal places; preserve full precision in the calculation and backend records.

## Implementation constraints

- USD-only is a deliberate MVP constraint. The schema may retain a currency column for clarity/interoperability, but MVP writes must validate it is `USD`.
- API monetary values are decimal strings with `currency: "USD"`; server-side decimal arithmetic is authoritative when a backend exists.
- The current frontend prototype stores data in browser localStorage and cannot provide multi-user persistence, audit, or enforced approval. It is not production-ready for issuing customer quotes.
- Any later change to margin, overhead, tax, currency, or approval defaults should be effective-dated and must not mutate already-issued quote snapshots.
