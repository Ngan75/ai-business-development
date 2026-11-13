# AI Sales Development

A React + TypeScript + Vite prototype for a hardware sales-development workflow with 12 navigation areas: Dashboard, CRM, Customer, RFQ, BOM AI, PCB AI, Harness AI, AI Chat, Costing, Supplier, Competitor and Settings.

## Run locally

```bash
npm install
npm run dev
```

Run `npm run build` to type-check and create the production bundle, and `npm run lint` for Oxlint.

## Costing workflow

The Costing module supports BOM PCBA, Wire harness and IoT; editable per-product quantities and costs; overhead and gross-margin-based selling price; browser-local persistence; Excel/CSV import and Excel export; and browser print-to-PDF.

Excel import reads the first worksheet and expects a description/item column, a unit cost/price column, and optionally a quantity column. Imported rows replace the current rows in the selected product category. A 10 MB file-size limit is applied. Sample values are illustrative and should be replaced with verified supplier and manufacturing costs.

The cost optimizer is a local, rule-based prototype that estimates possible savings for process-related rows. It is not connected to an AI model, supplier pricing, live inventory or market data. The chat assistant likewise uses local rules and workspace data; it is not an AI model. Review estimates with manufacturing and procurement before applying or quoting. Business data currently resides in the browser's local storage and is not shared across devices or users.

## Current limitations and production readiness

Several areas still use sample data or prototype behavior. Production deployment requires a secured backend, authentication and authorization, shared database, audit trail, validated integrations, and automated tests. Never place private API keys in frontend code or browser storage. Settings and dashboard values are stored/read locally and do not provide team-wide configuration or synchronization.
