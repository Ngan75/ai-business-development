import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import * as XLSX from 'xlsx';
import { BUSINESS_DEFAULTS, calculatePricing } from '../../lib/pricing';
import type { ProductCategory } from '../../types/domain';

type CostLine = { id: string; name: string; quantityPerUnit: number; unitCost: number };
type CostData = Record<ProductCategory, CostLine[]>;

const categories: { id: ProductCategory; label: string; description: string }[] = [
  { id: 'pcba', label: 'BOM PCBA', description: 'Linh kiện, gia công PCB, lắp ráp SMT/DIP và kiểm thử' },
  { id: 'wire_harness', label: 'Wire harness', description: 'Dây dẫn, connector, công đoạn bấm dây và kiểm tra' },
  { id: 'iot', label: 'IoT', description: 'PCBA, module kết nối, lắp ráp, firmware và kiểm thử' },
];

/** Official internal unit-cost baseline approved by the product owner. */
const officialCosts: CostData = {
  pcba: [
    { id: 'pcba-1', name: 'Linh kiện BOM (IC, passive, MCU)', quantityPerUnit: 1, unitCost: 11.25 },
    { id: 'pcba-2', name: 'Gia công PCB FR-4, 4 lớp', quantityPerUnit: 1, unitCost: 5 },
    { id: 'pcba-3', name: 'Lắp ráp SMT/DIP & vật tư phụ', quantityPerUnit: 1, unitCost: 2.5 },
    { id: 'pcba-4', name: 'Kiểm thử chức năng & QA', quantityPerUnit: 1, unitCost: 1 },
  ],
  wire_harness: [
    { id: 'harness-1', name: 'Dây điện, ống co nhiệt, băng keo', quantityPerUnit: 1, unitCost: 4.2 },
    { id: 'harness-2', name: 'Connector, housing & terminal', quantityPerUnit: 1, unitCost: 2.8 },
    { id: 'harness-3', name: 'Cắt-tuốt-bấm dây (nhân công)', quantityPerUnit: 1, unitCost: 1.6 },
    { id: 'harness-4', name: 'Lắp ráp, test thông mạch & QA', quantityPerUnit: 1, unitCost: 0.9 },
  ],
  iot: [
    { id: 'iot-1', name: 'PCBA / linh kiện điện tử', quantityPerUnit: 1, unitCost: 12.5 },
    { id: 'iot-2', name: 'Module Wi-Fi/BLE & cảm biến', quantityPerUnit: 1, unitCost: 8 },
    { id: 'iot-3', name: 'Vỏ, lắp ráp & nạp firmware', quantityPerUnit: 1, unitCost: 4.5 },
    { id: 'iot-4', name: 'Kiểm thử kết nối & QA', quantityPerUnit: 1, unitCost: 1.5 },
  ],
};

const STORAGE_KEY = 'ai_sales_costs_by_category_v1';
const money = (value: number) => new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2,
}).format(Number.isFinite(value) ? value : 0);
const safeNumber = (value: number) => Number.isFinite(value) && value >= 0 ? value : 0;
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').toLowerCase().replace(/[^a-z0-9]/g, '');

function loadCostData(): CostData {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (!saved || typeof saved !== 'object') return officialCosts;
    const data = saved as Partial<CostData>;
    return Object.fromEntries(categories.map(({ id }) => {
      const rows = data[id];
      if (!Array.isArray(rows)) return [id, officialCosts[id]];
      return [id, rows.map((row, index) => ({
        id: String(row.id ?? `${id}-${index}`),
        name: String(row.name ?? 'Khoản chi phí'),
        quantityPerUnit: safeNumber(Number(row.quantityPerUnit)),
        unitCost: safeNumber(Number(row.unitCost)),
      }))];
    })) as CostData;
  } catch {
    return officialCosts;
  }
}

export default function CostingPage() {
  const [category, setCategory] = useState<ProductCategory>('pcba');
  const [costData, setCostData] = useState<CostData>(loadCostData);
  const [orderQuantity, setOrderQuantity] = useState(BUSINESS_DEFAULTS.defaultOrderQuantity);
  const [overheadPercent, setOverheadPercent] = useState(BUSINESS_DEFAULTS.overheadRate * 100);
  const [marginPercent, setMarginPercent] = useState(BUSINESS_DEFAULTS.grossMarginRate * 100);
  const [projectName, setProjectName] = useState('Dự án mẫu');
  const [notice, setNotice] = useState('');
  const [fileError, setFileError] = useState('');

  const lines = costData[category];
  const directCost = useMemo(() => lines.reduce(
    (sum, line) => sum + safeNumber(line.quantityPerUnit) * safeNumber(line.unitCost), 0,
  ), [lines]);
  const pricing = calculatePricing({
    directCost,
    orderQuantity: safeNumber(orderQuantity),
    overheadRate: safeNumber(overheadPercent) / 100,
    grossMarginRate: Math.min(99, safeNumber(marginPercent)) / 100,
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(costData));
    } catch {
      setNotice('Không lưu được dữ liệu vào trình duyệt. Hãy xuất Excel để lưu bản sao.');
    }
  }, [costData]);

  const updateLine = (id: string, field: 'name' | 'quantityPerUnit' | 'unitCost', value: string) => {
    setCostData((previous) => ({
      ...previous,
      [category]: previous[category].map((line) => line.id !== id ? line : {
        ...line,
        [field]: field === 'name' ? value : safeNumber(Number(value)),
      }),
    }));
  };
  const addLine = () => setCostData((previous) => ({
    ...previous,
    [category]: [...previous[category], { id: `${category}-${Date.now()}`, name: 'Chi phí mới', quantityPerUnit: 1, unitCost: 0 }],
  }));
  const deleteLine = (id: string) => setCostData((previous) => ({
    ...previous,
    [category]: previous[category].filter((line) => line.id !== id),
  }));

  const importExcel = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileError('');
    setNotice('');
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error('Dung lượng file tối đa là 10 MB.');
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!sheet) throw new Error('Không tìm thấy sheet dữ liệu.');
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
      if (!rows.length) throw new Error('Sheet đầu tiên không có dữ liệu.');
      const headers = Object.keys(rows[0]);
      const findHeader = (aliases: string[]) => headers.find((header) => aliases.some((alias) => normalize(header).includes(alias)));
      const nameKey = findHeader(['item', 'description', 'partname', 'hangmuc', 'tenlinhkien']);
      const quantityKey = findHeader(['quantity', 'qty', 'soluong', 'dinhmuc']);
      const unitCostKey = findHeader(['unitcost', 'unitprice', 'dongia', 'giadonvi', 'chiphidonvi']);
      const currencyKey = findHeader(['currency', 'tiente', 'matiente']);
      if (!nameKey || !unitCostKey) throw new Error('Cần có cột Item/Description và Unit Cost/Đơn giá.');
      const imported = rows.flatMap((row, index) => {
        const sourceCurrency = currencyKey ? String(row[currencyKey] ?? '').trim().toUpperCase() : 'USD';
        const rawCost = String(row[unitCostKey] ?? '').replace(/[$,\s]/g, '');
        const rawQuantity = quantityKey ? String(row[quantityKey] ?? '').replace(/[,\s]/g, '') : '1';
        const unitCost = Number(rawCost);
        const quantityPerUnit = Number(rawQuantity);
        const name = String(row[nameKey] ?? '').trim();
        if (!name && !rawCost) return [];
        if (sourceCurrency && sourceCurrency !== 'USD') throw new Error(`Dòng ${index + 2}: chỉ nhận dữ liệu USD, phát hiện ${sourceCurrency}.`);
        if (!name || !Number.isFinite(unitCost) || unitCost < 0 || !Number.isFinite(quantityPerUnit) || quantityPerUnit < 0) {
          throw new Error(`Dòng ${index + 2}: tên, số lượng hoặc đơn giá không hợp lệ.`);
        }
        return [{ id: `${category}-import-${Date.now()}-${index}`, name, quantityPerUnit, unitCost }];
      });
      if (!imported.length) throw new Error('Không có dòng chi phí hợp lệ.');
      setCostData((previous) => ({ ...previous, [category]: imported }));
      setNotice(`Đã nhập ${imported.length} dòng USD vào ${categories.find((item) => item.id === category)?.label}. Chỉ danh mục này được thay thế.`);
    } catch (error) {
      setFileError(error instanceof Error ? error.message : 'Không thể đọc file.');
    } finally {
      event.target.value = '';
    }
  };

  const exportExcel = () => {
    const selectedCategory = categories.find((item) => item.id === category)!;
    const rows = [
      { 'Dự án / khách hàng': projectName, 'Phân loại': selectedCategory.label, 'Tiền tệ': 'USD', 'Sản lượng': orderQuantity },
      ...lines.map((line) => ({ 'Hạng mục': line.name, 'Định mức / SP': line.quantityPerUnit, 'Đơn giá (USD)': line.unitCost, 'Thành tiền (USD / SP)': line.quantityPerUnit * line.unitCost })),
      { 'Hạng mục': 'Tổng chi phí trực tiếp', 'Thành tiền (USD / SP)': pricing.directCostPerUnit },
      { 'Hạng mục': `Chi phí chung (${overheadPercent}%)`, 'Thành tiền (USD / SP)': pricing.overheadPerUnit },
      { 'Hạng mục': 'Giá thành sản xuất / SP', 'Thành tiền (USD / SP)': pricing.manufacturingCostPerUnit },
      { 'Hạng mục': `Lợi nhuận (gross margin ${marginPercent}%)`, 'Thành tiền (USD / SP)': pricing.profitPerUnit },
      { 'Hạng mục': 'Giá bán gợi ý / SP', 'Thành tiền (USD / SP)': pricing.sellingPricePerUnit },
      { 'Hạng mục': 'Tổng đơn hàng (USD)', 'Thành tiền (USD / SP)': pricing.orderTotal },
    ];
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Costing_USD');
    XLSX.writeFile(workbook, `Costing-${category}-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };
  const restoreOfficialCosts = () => {
    if (!window.confirm('Khôi phục đơn giá cơ sở chính thức cho cả ba danh mục? Các thay đổi riêng của anh sẽ bị thay thế.')) return;
    setCostData(officialCosts);
    setOrderQuantity(BUSINESS_DEFAULTS.defaultOrderQuantity);
    setOverheadPercent(BUSINESS_DEFAULTS.overheadRate * 100);
    setMarginPercent(BUSINESS_DEFAULTS.grossMarginRate * 100);
    setProjectName('Dự án mẫu');
    setNotice('Đã khôi phục đơn giá cơ sở chính thức và quy tắc giá mặc định.');
  };

  return (
    <div className="space-y-5 p-4 md:p-6 bg-slate-50 min-h-screen print:bg-white print:p-0">
      <style>{`@media print { .no-print { display:none !important } .print-card { break-inside:avoid; box-shadow:none !important } }`}</style>
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between border-b border-slate-200 pb-4">
        <div>
          <p className="text-[10px] tracking-[.18em] font-semibold text-emerald-700">AI SALES DEVELOPMENT / PRICING</p>
          <h1 className="text-2xl font-bold text-slate-800 mt-2">Tính giá gia công & báo giá</h1>
          <p className="text-sm text-slate-500 mt-1">Tính chi phí và giá bán USD cho BOM PCBA, Wire harness và IoT.</p>
        </div>
        <div className="flex flex-wrap gap-2 no-print">
          <label className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">↑ Nhập Excel<input type="file" accept=".xlsx,.xls,.csv" onChange={importExcel} className="hidden" /></label>
          <button onClick={() => window.print()} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">Xuất PDF</button>
          <button onClick={exportExcel} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-800">↓ Xuất Excel</button>
        </div>
      </header>

      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs leading-relaxed text-emerald-950">
        <strong>ĐƠN GIÁ CƠ SỞ CHÍNH THỨC · USD.</strong> Các khoản chi phí BOM PCBA, Wire harness và IoT dưới đây được chủ sản phẩm xác nhận làm cơ sở chính thức hiện hành. Khi anh yêu cầu cập nhật, em sẽ áp dụng bộ giá mới; giá bán được tính riêng theo overhead và gross margin đang chọn.
      </div>
      {(notice || fileError) && <div role={fileError ? 'alert' : 'status'} className={`flex items-start justify-between gap-3 rounded-lg border p-3 text-xs ${fileError ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
        <span>{fileError || notice}</span><button aria-label="Đóng thông báo" className="text-lg leading-none" onClick={() => { setNotice(''); setFileError(''); }}>×</button>
      </div>}

      <section>
        <div className="mb-2 text-[10px] font-semibold tracking-wider text-slate-500">01 / CHỌN NHÓM SẢN PHẨM</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3" role="tablist" aria-label="Phân loại sản phẩm">
          {categories.map((item) => <button key={item.id} role="tab" aria-selected={category === item.id} onClick={() => setCategory(item.id)} className={`rounded-xl border p-4 text-left transition ${category === item.id ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-200' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
            <span className="block font-bold text-slate-800">{item.label}</span><span className="mt-1 block text-xs text-slate-500">{item.description}</span>
          </button>)}
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,.8fr)] gap-4">
        <section className="print-card rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
            <div><p className="text-[10px] font-semibold tracking-wider text-slate-500">02 / COST BREAKDOWN · USD / SẢN PHẨM</p><h2 className="mt-1 font-bold text-slate-800">{categories.find((item) => item.id === category)?.label}</h2></div>
            <button onClick={addLine} className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 no-print">+ Thêm khoản mục</button>
          </div>
          <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-xs">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500"><tr><th className="px-3 py-3">Hạng mục</th><th className="px-3 py-3">Định mức / SP</th><th className="px-3 py-3">Đơn giá USD</th><th className="px-3 py-3 text-right">Thành tiền / SP</th><th className="px-2 py-3 no-print"><span className="sr-only">Thao tác</span></th></tr></thead>
            <tbody className="divide-y divide-slate-100">{lines.map((line) => <tr key={line.id}>
              <td className="px-3 py-2"><input aria-label="Tên hạng mục" className="w-full rounded border border-transparent px-2 py-1.5 hover:border-slate-200 focus:border-emerald-400 focus:outline-none" value={line.name} onChange={(event) => updateLine(line.id, 'name', event.target.value)} /></td>
              <td className="px-3 py-2"><input aria-label={`Định mức ${line.name}`} type="number" min="0" step="0.01" className="w-24 rounded border border-slate-200 px-2 py-1.5" value={line.quantityPerUnit} onChange={(event) => updateLine(line.id, 'quantityPerUnit', event.target.value)} /></td>
              <td className="px-3 py-2"><div className="flex w-28 items-center rounded border border-slate-200 px-2"><span className="text-slate-400">$</span><input aria-label={`Đơn giá ${line.name} USD`} type="number" min="0" step="0.01" className="w-full px-1 py-1.5 outline-none" value={line.unitCost} onChange={(event) => updateLine(line.id, 'unitCost', event.target.value)} /></div></td>
              <td className="px-3 py-2 text-right font-semibold text-slate-700">{money(line.quantityPerUnit * line.unitCost)}</td>
              <td className="px-2 py-2 no-print"><button aria-label={`Xóa ${line.name}`} onClick={() => deleteLine(line.id)} className="rounded px-2 text-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600">×</button></td>
            </tr>)}</tbody>
            <tfoot className="border-t border-slate-200 bg-slate-50 font-bold"><tr><td colSpan={3} className="px-3 py-3 text-slate-600">TỔNG CHI PHÍ TRỰC TIẾP / SP</td><td className="px-3 py-3 text-right text-emerald-700">{money(pricing.directCostPerUnit)}</td><td /></tr></tfoot>
          </table></div>
        </section>

        <aside className="print-card rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-semibold tracking-wider text-slate-500">03 / THÔNG SỐ BÁO GIÁ</p>
          <label className="mt-4 block text-xs font-medium text-slate-600">Dự án / khách hàng<input className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={projectName} onChange={(event) => setProjectName(event.target.value)} /></label>
          <label className="mt-3 block text-xs font-medium text-slate-600">Sản lượng đặt hàng (PCS)<input type="number" min="0" step="1" className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={orderQuantity} onChange={(event) => setOrderQuantity(safeNumber(Number(event.target.value)))} /></label>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="block text-xs font-medium text-slate-600">Overhead (%)<input type="number" min="0" max="100" step="0.1" className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={overheadPercent} onChange={(event) => setOverheadPercent(Math.min(100, safeNumber(Number(event.target.value))))} /></label>
            <label className="block text-xs font-medium text-slate-600">Gross margin (%)<input type="number" min="0" max="99" step="0.1" className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={marginPercent} onChange={(event) => setMarginPercent(Math.min(99, safeNumber(Number(event.target.value))))} /></label>
          </div>
          <div className="mt-4 rounded-lg bg-slate-50 p-3 text-[11px] leading-5 text-slate-600">Chi phí sản xuất = chi phí trực tiếp + overhead.<br />Giá bán = chi phí sản xuất ÷ (1 − gross margin).</div>
          {pricing.belowMinimumMargin && <p role="alert" className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">Margin dưới mức tối thiểu {BUSINESS_DEFAULTS.minimumGrossMarginRate * 100}%. Cần quản lý rà soát trước khi phát hành báo giá.</p>}
          <button onClick={restoreOfficialCosts} className="mt-4 text-xs font-medium text-slate-500 underline underline-offset-2 no-print">Khôi phục đơn giá cơ sở chính thức</button>
        </aside>
      </div>

      <section className="print-card rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-[10px] font-semibold tracking-wider text-slate-500">04 / KẾT QUẢ TÍNH GIÁ</p><h2 className="mt-1 font-bold text-slate-800">{categories.find((item) => item.id === category)?.label} · USD</h2></div><span className="text-xs text-slate-500">{safeNumber(orderQuantity).toLocaleString('en-US')} sản phẩm</span></div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <article className="rounded-lg border border-slate-200 p-3"><p className="text-[10px] font-semibold text-slate-500">CHI PHÍ TRỰC TIẾP / SP</p><strong className="mt-2 block text-xl text-slate-800">{money(pricing.directCostPerUnit)}</strong></article>
          <article className="rounded-lg border border-slate-200 p-3"><p className="text-[10px] font-semibold text-slate-500">GIÁ THÀNH SẢN XUẤT / SP</p><strong className="mt-2 block text-xl text-slate-800">{money(pricing.manufacturingCostPerUnit)}</strong><small className="text-slate-500">Overhead {money(pricing.overheadPerUnit)}</small></article>
          <article className="rounded-lg border border-slate-200 p-3"><p className="text-[10px] font-semibold text-slate-500">LỢI NHUẬN / SP</p><strong className="mt-2 block text-xl text-sky-700">{money(pricing.profitPerUnit)}</strong><small className="text-slate-500">Gross margin {marginPercent}%</small></article>
          <article className="rounded-lg border border-emerald-200 bg-emerald-50 p-3"><p className="text-[10px] font-semibold text-emerald-800">GIÁ BÁN GỢI Ý / SP</p><strong className="mt-2 block text-xl text-emerald-800">{money(pricing.sellingPricePerUnit)}</strong><small className="text-emerald-800">Chưa gồm thuế/phí ngoài</small></article>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-900 px-4 py-3 text-white"><span className="text-xs">TỔNG GIÁ TRỊ ĐƠN HÀNG · {projectName || 'Chưa đặt tên dự án'}</span><strong className="text-lg text-emerald-200">{money(pricing.orderTotal)}</strong></div>
        <p className="mt-3 text-[10px] leading-relaxed text-slate-500">Đơn giá cơ sở do chủ sản phẩm xác nhận. Giá bán là kết quả tính theo giả định đang chọn; thuế, vận chuyển, NRE/tooling và hao hụt chưa gồm nếu chưa nhập riêng.</p>
      </section>
    </div>
  );
}
