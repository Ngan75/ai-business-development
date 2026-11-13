## Sample manufacturing cost assumptions

The Costing module starts with illustrative per-unit estimates (USD) for three product categories. These are sample scenarios for a contract manufacturer, not market quotes:

| Category | Direct cost | Example items |
| --- | ---: | --- |
| BOM PCBA | $19.75 / board | Components $11.25, 4-layer PCB fabrication $5.00, SMT/DIP assembly $2.50, functional test/QA $1.00 |
| Wire harness | $9.50 / harness | Wire/materials $4.20, connectors/terminals $2.80, cut-strip-crimp labor $1.60, assembly/electrical test $0.90 |
| IoT | $26.50 / device | Electronics $12.50, connectivity/sensor module $8.00, enclosure/assembly/firmware $4.50, device test/QA $1.50 |

Default quotation assumptions are 8% overhead on direct costs and 25% gross margin on the selling price. The price formula is `selling price = (direct cost × (1 + overhead rate)) / (1 - margin rate)`. Under these assumptions, the illustrative selling prices are approximately $28.44 per PCBA, $13.68 per harness, and $38.16 per IoT device, before taxes, freight, duties, or other unlisted charges. Quantities default to one per BOM row and 1,000 order units.

All figures are synthetic placeholders for demonstrating the workflow. Replace them with actual BOMs, supplier quotations, labor rates, yields, tooling/NRE, scrap, currency conversion, taxes, and delivery terms before using any customer quote. The local rule-based cost-savings suggestions are estimates only and are not AI-generated or guaranteed.

Excel import expects item/description, quantity (optional), and unit-cost columns in the first worksheet. Import replaces rows only in the selected category. Data is saved in this browser's local storage; it is not synchronized or backed up automatically.

## Build and lint

```bash
npm run build
npm run lint
```
