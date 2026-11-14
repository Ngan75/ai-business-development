# AI Sales Development

Prototype web app for business development, RFQ handling, and manufacturing cost estimation for BOM PCBA, Wire harness, and IoT.

## Run locally

```bash
npm install
npm run dev
```

Production build and lint commands:

```bash
npm run build
npm run lint
```

## Costing baseline

The product owner has approved USD as the MVP currency and the following official internal cost baseline. These amounts are stored in the Costing source and pricing policy; keep them unchanged unless the owner explicitly requests a price update.

| Category | Direct cost / unit | Default selling price / unit* |
| --- | ---: | ---: |
| BOM PCBA | $19.75 | $28.44 |
| Wire harness | $9.50 | $13.68 |
| IoT | $26.50 | $38.16 |

*Calculated with 8% overhead applied to direct cost and 25% gross margin on selling price. Minimum gross margin is 20%; a lower value is flagged for manager review. Tax, freight, duties, payment charges, NRE/tooling, yield/scrap, and FX are excluded unless entered separately. See [the approved pricing policy](docs/PRICING_POLICY.md) for line-item values and formulas.

## Product documents

- [PRD and acceptance criteria](docs/PRD.md)
- [Approved pricing policy](docs/PRICING_POLICY.md)
- [Business decisions](docs/BUSINESS_DECISIONS.md)
- [Database schema proposal](docs/DATABASE_SCHEMA.md)
- [API contract proposal](docs/API_CONTRACT.md)
- [Delivery roadmap](docs/ROADMAP.md)
- [12-menu wireframes](docs/WIREFRAMES.md)
- [Implementation status and remaining work](docs/IMPLEMENTATION_STATUS.md)

## Current limitations

This repository is currently a frontend prototype. Costing state is stored in this browser's localStorage; there is no shared backend, authentication, server-enforced role/approval, database, audit trail, or immutable issued-quote workflow yet. A PDF printed from the browser is a preview, not a binding issued quote. Verify current supplier costs and customer terms before external use.

All supplier and AI integrations shown in other prototype screens must be treated as demonstration UI unless backed by a real, authorized service. Do not put provider secrets in frontend code or browser storage.
