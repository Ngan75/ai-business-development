# Pricing policy — MVP defaults

**Approved product baseline:** USD-only currency and initial costing rules, confirmed by the product owner on 2026-11-14. This document resolves the initial policy decisions for MVP and supersedes any conflicting open questions or examples in the PRD, logical schema, API contract, wireframes, and prototype UI. Changes later require an explicit policy revision and must not alter issued quote snapshots.

## Currency

- USD is the only supported currency for MVP across costing, RFQ estimates, quotes, API writes, and exports.
- Persist and return `currency: "USD"` for monetary values. Backend money values use decimal arithmetic and decimal-string API serialization.
- Do not silently convert foreign currency. Imports with an explicit non-USD currency are rejected with a row-level message. A file without a currency column is interpreted as USD and the user is told before import.
- Supporting additional currencies requires an approved FX source, conversion timestamp, rounding rules, and immutable quote snapshots; this is not in MVP.

## Initial pricing defaults

| Setting | Default | Rule |
| --- | ---: | --- |
| Overhead | 8% | Applied to direct unit cost |
| Pricing method | Gross margin | Margin is a percentage of selling price, not markup on cost |
| Gross margin | 25% | Initial target margin |
| Minimum gross margin | 20% | Below this, warn and require manager review/approval before issue |
| Order quantity | 1,000 PCS | Sample UI default only; replace with RFQ quantity |

Formulas:

```text
direct_cost_per_unit = sum(quantity_per_unit × unit_cost)
overhead_per_unit = direct_cost_per_unit × overhead_rate
manufacturing_cost_per_unit = direct_cost_per_unit + overhead_per_unit
selling_price_per_unit = manufacturing_cost_per_unit / (1 - gross_margin_rate)
profit_per_unit = selling_price_per_unit - manufacturing_cost_per_unit
order_total = selling_price_per_unit × order_quantity
```

Validate nonnegative costs/quantities, overhead rate in `[0, 1]`, and gross margin in `[0, 1)`. Values below the minimum margin are estimates only until reviewed. UI rounding is two USD decimals; authoritative backend calculations retain decimal precision and apply the quote rounding policy.

## Charges not included unless explicitly entered

VAT/sales tax, freight, duties, payment fees, tooling/NRE, yield/scrap, and FX are excluded by default. If added, show them as separate cost or quote lines and preserve whether the unit price includes them.

## Example calculations

These are synthetic sample manufacturing inputs only—not supplier market prices or a customer offer.

| Category | Direct cost | 8% overhead | Manufacturing cost | Price at 25% margin |
| --- | ---: | ---: | ---: | ---: |
| BOM PCBA | $19.75 | $1.58 | $21.33 | $28.44 |
| Wire harness | $9.50 | $0.76 | $10.26 | $13.68 |
| IoT | $26.50 | $2.12 | $28.62 | $38.16 |

## Product and technical safeguards

- All prototype sample prices are clearly marked synthetic and must be replaced with current supplier quotes, labor rates, yields, and validated process assumptions before customer use.
- Savings hints based on local rules are estimates, not AI-verified savings or guaranteed savings.
- Until backend authentication, audit, approvals, and immutable quote revisions exist, the frontend is a prototype and must not be used to issue binding quotes.
- `src/lib/pricing.ts` is the current frontend preview calculator. Server-side decimal calculation will be authoritative when the backend is implemented.
- The Costing screen imports Excel/CSV into only the currently selected category and replaces its current cost lines only after the whole import validates. Explicit foreign-currency values are rejected; currency-less imports are treated as USD.

## Follow-up implementation

- Enforce USD at backend request validation and in PostgreSQL constraints.
- Persist policy changes with effective dates; snapshot policy and calculations on quote issue.
- Add unit tests for formula examples, invalid rates, negative values, rounding and import behavior when a test runner is introduced.
- Ensure quote issuance workflow checks the 20% minimum margin and requires an authorized manager approval for exceptions.
