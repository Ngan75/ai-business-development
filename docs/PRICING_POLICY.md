# Pricing policy — approved official baseline

**Status:** Approved by the product owner. This is the official current pricing baseline for the application, effective 2026-11-14. Keep it unchanged unless the owner explicitly requests a price or policy update. This policy supersedes older prototype/sample wording in other documents and screens.

## Official unit-cost baseline (USD)

These approved values are the official internal unit-cost baseline currently used by Costing. They are not a claim that the amounts have been independently audited against supplier market quotations. Do not label them as temporary sample prices. The owner will request updates when changes are required.

| Category | Cost item | Official cost / unit |
| --- | --- | ---: |
| BOM PCBA | Components (IC, passive, MCU) | $11.25 |
| BOM PCBA | PCB FR-4 fabrication, 4 layers | $5.00 |
| BOM PCBA | SMT/DIP assembly and consumables | $2.50 |
| BOM PCBA | Functional test and QA | $1.00 |
| **BOM PCBA** | **Direct cost total** | **$19.75** |
| Wire harness | Wire, heat shrink, tape | $4.20 |
| Wire harness | Connector, housing and terminal | $2.80 |
| Wire harness | Cut/strip/crimp labor | $1.60 |
| Wire harness | Assembly, continuity test and QA | $0.90 |
| **Wire harness** | **Direct cost total** | **$9.50** |
| IoT | PCBA / electronic components | $12.50 |
| IoT | Wi-Fi/BLE module and sensors | $8.00 |
| IoT | Enclosure, assembly and firmware loading | $4.50 |
| IoT | Connectivity test and QA | $1.50 |
| **IoT** | **Direct cost total** | **$26.50** |

## Official initial pricing rules

| Setting | Approved value | Rule |
| --- | ---: | --- |
| Currency | USD only | Do not silently convert foreign currency |
| Overhead | 8% | Applied to direct unit cost |
| Pricing method | Gross margin | Margin is a percentage of selling price, not markup on cost |
| Target gross margin | 25% | Used for the suggested selling price by default |
| Minimum gross margin | 20% | Below this, warn and require manager review/approval before issue |
| Default order quantity | 1,000 PCS | Initial UI default; replace with actual RFQ quantity |

```text
direct_cost_per_unit = sum(quantity_per_unit × unit_cost)
overhead_per_unit = direct_cost_per_unit × overhead_rate
manufacturing_cost_per_unit = direct_cost_per_unit + overhead_per_unit
selling_price_per_unit = manufacturing_cost_per_unit / (1 - gross_margin_rate)
profit_per_unit = selling_price_per_unit - manufacturing_cost_per_unit
order_total = selling_price_per_unit × order_quantity
```

Validate nonnegative costs/quantities, overhead rate in `[0, 1]`, and gross margin in `[0, 1)`. Values below the minimum margin require manager review. UI displays two USD decimals; authoritative backend calculations should retain decimal precision and apply the quote rounding policy.

## Calculated baseline price references

These values are calculated from the approved direct costs and approved default rules. They are suggested selling prices, not separate manually entered costs.

| Category | Direct cost | Overhead (8%) | Manufacturing cost | Suggested sell price (25% gross margin) |
| --- | ---: | ---: | ---: | ---: |
| BOM PCBA | $19.75 | $1.58 | $21.33 | $28.44 |
| Wire harness | $9.50 | $0.76 | $10.26 | $13.68 |
| IoT | $26.50 | $2.12 | $28.62 | $38.16 |

## Exclusions and import behavior

VAT/sales tax, freight, duties, payment fees, tooling/NRE, yield/scrap, and FX are excluded unless separately entered and displayed. USD is the only supported currency for MVP. Explicit non-USD currency in imported files is rejected; a file without a currency column is interpreted as USD and the application identifies the imported values as USD.

## Operational safeguards

- Costing is a frontend prototype using browser localStorage; it is not a shared, audited, multi-user source of truth.
- The official baseline applies on initial load and when the user explicitly chooses “restore official costs.” Locally saved user edits remain in that browser until restored or changed.
- Issued customer quotations require a backend with authentication, audit, approvals and immutable quote revisions. The current UI does not issue binding quotes.
- `src/lib/pricing.ts` calculates the frontend preview. Once a backend exists, server-side decimal arithmetic must be authoritative.
- Keep the official amounts unchanged unless the product owner explicitly requests a price update. Any approved change should update this policy and the application baseline together.
