import { useEffect, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';

type ProductCategory = 'BOM PCBA' | 'Wire harness' | 'IoT';
type CostLine = { id: string; name: string; quantity: number; unitCost: number };
type CategoryCosts = Record<ProductCategory, CostLine[]>;
type WorkspaceSettings = { overheadPercent?: number; marginPercent?: number; currency?: string };
type Recommendation = { id: string; title: string; detail: string; reduction: number };

const categories: ProductCategory[] = ['BOM PCBA', 'Wire harness', 'IoT'];
const categoryInfo: Record<ProductCategory, { subtitle: string; steps: string[] }> = {
  'BOM PCBA': { subtitle: 'Linh kiện, gia công bo mạch, lắp ráp SMT/DIP và kiểm thử', steps: ['Linh kiện điện tử', 'Gia công PCB FR-4', 'SMT/DIP & vật tư phụ', 'Kiểm thử chức năng'] },
  'Wire harness': { subtitle: 'Dây dẫn, connector, cắt-tuốt-bấm, lắp ráp và kiểm tra', steps: ['Dây điện & vật tư', 'Connector / terminal', 'Cắt-tuốt-bấm dây', 'Lắp ráp & kiểm tra điện'] },
  IoT: { subtitle: 'Thiết bị IoT, module kết nối, firmware và kiểm thử', steps: ['Linh kiện điện tử', 'Module / cảm biến', 'Lắp ráp & firmware', 'Kiểm thử thiết bị'] },
};

// Illustrative company assumptions in USD per finished unit; replace with verified supplier quotes and labor rates.
const sampleCosts: CategoryCosts = {
  'BOM PCBA': [
    { id: 'pcba-1', name: 'Linh kiện BOM (IC, passive, MCU)', quantity: 1, unitCost: 11.25 },
    { id: 'pcba-2', name: 'Gia công PCB FR-4, 4 lớp', quantity: 1, unitCost: 5.00 },
    { id: 'pcba-3', name: 'Lắp ráp SMT/DIP & vật tư phụ', quantity: 1, unitCost: 2.50 },
    { id: 'pcba-4', name: 'Kiểm thử chức năng & QA', quantity: 1, unitCost: 1.00 },
  ],
  'Wire harness': [
    { id: 'harness-1', name: 'Dây điện, ống co nhiệt, băng keo', quantity: 1, unitCost: 4.20 },
    { id: 'harness-2', name: 'Connector, housing & terminal', quantity: 1, unitCost: 2.80 },
    { id: 'harness-3', name: 'Cắt-tuốt-bấm dây (nhân công)', quantity: 1, unitCost: 1.60 },
    { id: 'harness-4', name: 'Lắp ráp, test thông mạch & QA', quantity: 1, unitCost: 0.90 },
  ],
  IoT: [
    { id: 'iot-1', name: 'PCBA / linh kiện điện tử', quantity: 1, unitCost: 12.50 },
    { id: 'iot-2', name: 'Module Wi-Fi/BLE & cảm biến', quantity: 1, unitCost: 8.00 },
    { id: 'iot-3', name: 'Vỏ, lắp ráp & nạp firmware', quantity: 1, unitCost: 4.50 },
    { id: 'iot-4', name: 'Kiểm thử kết nối & QA', quantity: 1, unitCost: 1.50 },
  ],
};
const currency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(Number.isFinite(value) ? value : 0);
const lineTotal = (line: CostLine) => Math.max(0, Number(line.quantity) || 0) * Math.max(0, Number(line.unitCost) || 0);

function loadCosts(): CategoryCosts {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem('ai_sales_costs_by_category') ?? 'null');
    if (!parsed || typeof parsed !== 'object') return sampleCosts;
    const saved = parsed as Partial<CategoryCosts>;
    return Object.fromEntries(categories.map((category) => {
      const rows = saved[category];
      const normalized = Array.isArray(rows) ? rows.map((row, index) => ({
        id: String(row.id ?? `${category}-${index}`),
        name: String(row.name ?? 'Hạng mục'),
        quantity: Math.max(0, Number(row.quantity) || 0),
        unitCost: Math.max(0, Number(row.unitCost) || 0),
      })) : sampleCosts[category];
      return [category, normalized];
    })) as CategoryCosts;
  } catch { return sampleCosts; }
}
function readSettings(): WorkspaceSettings {
  try { return JSON.parse(localStorage.getItem('ai_sales_workspace_settings') ?? '{}') as WorkspaceSettings; } catch { return {}; }
}
const normalize = (value: unknown) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').toLowerCase().replace(/[^a-z0-9]/g, '');
const findColumn = (headers: string[], aliases: string[]) => headers.find((header) => aliases.some((alias) => normalize(header).includes(alias)));

export default function CostingPage() {
  const [category, setCategory] = useState<ProductCategory>('BOM PCBA');
  const [costsByCategory, setCostsByCategory] = useState<CategoryCosts>(loadCosts);
  const [quantity, setQuantity] = useState(1000);
  const [overheadPercent, setOverheadPercent] = useState(() => Math.max(0, Number(readSettings().overheadPercent ?? 8)));
  const [marginPercent, setMarginPercent] = useState(() => Math.min(99, Math.max(0, Number(readSettings().marginPercent ?? 25))));
  const [projectName, setProjectName] = useState('Dự án mẫu');
  const [message, setMessage] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try { localStorage.setItem('ai_sales_costs_by_category', JSON.stringify(costsByCategory)); }
    catch { setMessage('Không thể lưu dữ liệu. Có thể bộ nhớ trình duyệt đã đầy.'); }
  }, [costsByCategory]);

  const lines = costsByCategory[category];
  const directCost = lines.reduce((sum, line) => sum + lineTotal(line), 0);
  const overhead = directCost * Math.max(0, Number(overheadPercent) || 0) / 100;
  const manufacturingCost = directCost + overhead;
  const marginRate = Math.min(99, Math.max(0, Number(marginPercent) || 0)) / 100;
  const sellingPrice = manufacturingCost / (1 - marginRate);
  const profit = sellingPrice - manufacturingCost;
  const orderTotal = sellingPrice * Math.max(0, Number(quantity) || 0);

  const recommendations = useMemo<Recommendation[]>(() => {
    const process = /gia công|lắp ráp|smt|dip|kiểm thử|qa|cắt|tuốt|bấm|firmware|test|nhân công/i;
    const reduction = category === 'Wire harness' ? 0.07 : category === 'BOM PCBA' ? 0.06 : 0.05;
    return lines.filter((line) => process.test(line.name) && lineTotal(line) > 0).map((line) => ({
      id: line.id,
      title: line.name,
      detail: `Ước tính rà soát tiết kiệm ${(reduction * 100).toFixed(0)}% qua chu kỳ, ghép lô hoặc điểm kiểm tra; cần xác nhận với sản xuất.`,
      reduction,
    }));
  }, [category, lines]);
  const savings = recommendations.reduce((sum, idea) => {
    const line = lines.find((candidate) => candidate.id === idea.id);
    return sum + (line ? lineTotal(line) * idea.reduction : 0);
  }, 0);

  const updateLine = (id: string, field: 'name' | 'quantity' | 'unitCost', value: string) => {
    setCostsByCategory((previous) => ({ ...previous, [category]: previous[category].map((line) => line.id !== id ? line : {
      ...line,
      [field]: field === 'name' ? value : Math.max(0, Number(value) || 0),
    }) }));
  };
  const addLine = () => setCostsByCategory((previous) => ({ ...previous, [category]: [...previous[category], { id: `line-${Date.now()}`, name: 'Chi phí mới', quantity: 1, unitCost: 0 }] }));
  const deleteLine = (id: string) => setCostsByCategory((previous) => ({ ...previous, [category]: previous[category].filter((line) => line.id !== id) }));

  const importExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setMessage('');
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error('Dung lượng file tối đa là 10 MB.');
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!sheet) throw new Error('Không tìm thấy sheet dữ liệu.');
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
      if (!rows.length) throw new Error('Sheet đầu tiên không có dữ liệu.');
      const headers = Object.keys(rows[0]);
      const nameCol = findColumn(headers, ['item', 'description', 'partname', 'component', 'hangmuc', 'tenlinhkien', 'costname']);
      const priceCol = findColumn(headers, ['unitcost', 'unitprice', 'price', 'cost', 'dongia', 'giadonvi', 'chiphidonvi']);
      const qtyCol = findColumn(headers, ['quantity', 'qty', 'soluong', 'sl']);
      if (!nameCol || !priceCol) throw new Error('Thiếu cột tên hạng mục hoặc đơn giá. Dùng tiêu đề Item/Description, Qty, Unit Cost.');
      const imported = rows.flatMap((row, index) => {
        const name = String(row[nameCol] ?? '').trim();
        const price = Number(String(row[priceCol] ?? '').replace(/[,$\s]/g, ''));
        const qty = qtyCol ? Number(String(row[qtyCol] ?? '').replace(/[,\s]/g, '')) : 1;
        if (!name || !Number.isFinite(price) || price < 0) return [];
        return [{ id: `import-${Date.now()}-${index}`, name, quantity: Number.isFinite(qty) && qty >= 0 ? qty : 1, unitCost: price }];
      });
      if (!imported.length) throw new Error('Không có dòng hợp lệ để nhập.');
      setCostsByCategory((previous) => ({ ...previous, [category]: imported }));
      setMessage(`Đã nhập ${imported.length} dòng vào ${category}; chi phí mẫu của danh mục này đã được thay thế.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Không đọc được file Excel/CSV.');
    } finally { event.target.value = ''; }
  };

  const applyRecommendations = () => {
    setCostsByCategory((previous) => ({ ...previous, [category]: previous[category].map((line) => {
      const suggestion = recommendations.find((item) => item.id === line.id);
      return suggestion ? { ...line, unitCost: Math.round(line.unitCost * (1 - suggestion.reduction) * 100) / 100 } : line;
    }) }));
    setMessage('Đã áp dụng mức giảm ước tính; hãy xác minh lại với bộ phận sản xuất và nhà cung cấp.');
  };
  const exportExcel = () => {
    const rows = [
      { 'Dự án / khách hàng': projectName, 'Phân loại': category, 'Sản lượng đặt hàng (PCS)': quantity },
      ...lines.map((line) => ({ 'Hạng mục': line.name, 'Số lượng / SP': line.quantity, 'Đơn giá USD': line.unitCost, 'Thành tiền USD / SP': lineTotal(line) })),
      { 'Hạng mục': 'Tổng vật tư & gia công', 'Thành tiền USD / SP': directCost },
      { 'Hạng mục': `Chi phí chung (${overheadPercent}%)`, 'Thành tiền USD / SP': overhead },
      { 'Hạng mục': 'Giá thành sản xuất / SP', 'Thành tiền USD / SP': manufacturingCost },
      { 'Hạng mục': `Lợi nhuận (margin ${marginPercent}%)`, 'Thành tiền USD / SP': profit },
      { 'Hạng mục': 'Giá bán gợi ý / SP', 'Thành tiền USD / SP': sellingPrice },
      { 'Hạng mục': 'Tổng giá trị đơn hàng', 'Thành tiền USD / SP': orderTotal },
    ];
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Bao_gia');
    XLSX.writeFile(workbook, `Bao-gia-${category.replaceAll(' ', '-')}.xlsx`);
  };
  const reset = () => {
    if (!window.confirm('Khôi phục chi phí mẫu cho cả BOM PCBA, Wire harness và IoT?')) return;
    setCostsByCategory(sampleCosts);
    setOverheadPercent(8);
    setMarginPercent(25);
    setQuantity(1000);
    setProjectName('Dự án mẫu');
    setMessage('Đã khôi phục dữ liệu giả định cho ba danh mục.');
  };

  return <main className="costing-page">
    <header className="cost-heading"><div><div className="cost-eyebrow"><i /> AI SALES DEVELOPMENT / COSTING</div><h1>Tính giá gia công & báo giá</h1><p>Chọn loại sản phẩm, quản lý từng khoản chi phí và ước tính giá bán theo margin.</p></div><div className="cost-actions">
      <input ref={fileInput} className="cost-file-input" type="file" accept=".xlsx,.xls,.csv" onChange={importExcel} />
      <button className="cost-button secondary" onClick={() => fileInput.current?.click()}>↑ Nhập Excel</button><button className="cost-button secondary" onClick={() => window.print()}>Xuất PDF</button><button className="cost-button primary" onClick={exportExcel}>↓ Xuất Excel</button>
    </div></header>
    <div className="sample-warning"><strong>DỮ LIỆU GIẢ ĐỊNH:</strong> ví dụ minh họa cho một công ty gia công/sản xuất, đơn vị USD trên mỗi thành phẩm. Cần thay bằng báo giá vật tư, nhân công, tỷ giá và quy trình thực tế trước khi gửi khách hàng.</div>
    {message && <div className="cost-notice" role="status">{message}<button aria-label="Đóng thông báo" onClick={() => setMessage('')}>×</button></div>}
    <section className="cost-category"><div className="cost-section-label">01 <span>CHỌN NHÓM SẢN PHẨM</span></div><div className="cost-tabs" role="tablist" aria-label="Phân loại sản phẩm">
      {categories.map((item, index) => <button key={item} role="tab" aria-selected={category === item} className={`cost-tab ${category === item ? 'selected' : ''}`} onClick={() => setCategory(item)}><span className="tab-index">0{index + 1}</span><span className="tab-copy"><strong>{item}</strong><small>{categoryInfo[item].subtitle}</small></span><span className="tab-arrow">↗</span></button>)}
    </div></section>
    <div className="cost-main-grid"><section className="cost-panel"><div className="cost-panel-heading"><div><div className="cost-section-label">02 <span>CẤU TRÚC CHI PHÍ / USD MỖI SẢN PHẨM</span></div><h2>{category} <small>Chi phí vật tư & gia công trực tiếp</small></h2></div><button className="add-line" onClick={addLine}>+ Thêm khoản mục</button></div>
      <div className="cost-table-scroll"><table className="cost-table"><thead><tr><th>HẠNG MỤC</th><th>SỐ LƯỢNG</th><th>ĐƠN GIÁ USD</th><th>THÀNH TIỀN / SP</th><th><span className="visually-hidden">Thao tác</span></th></tr></thead><tbody>
        {lines.map((line, index) => <tr key={line.id}><td><span className="line-index">{String(index + 1).padStart(2, '0')}</span><input aria-label="Tên hạng mục" value={line.name} onChange={(event) => updateLine(line.id, 'name', event.target.value)} /></td><td><input aria-label={`Số lượng ${line.name}`} type="number" min="0" step="0.01" value={line.quantity} onChange={(event) => updateLine(line.id, 'quantity', event.target.value)} /></td><td><div className="unit-price"><span>$</span><input aria-label={`Đơn giá ${line.name}`} type="number" min="0" step="0.01" value={line.unitCost} onChange={(event) => updateLine(line.id, 'unitCost', event.target.value)} /></div></td><td className="line-amount">{currency(lineTotal(line))}</td><td><button className="delete-line" aria-label={`Xóa ${line.name}`} onClick={() => deleteLine(line.id)}>×</button></td></tr>)}
      </tbody><tfoot><tr><td colSpan={3}>TỔNG VẬT TƯ & GIA CÔNG TRỰC TIẾP</td><td colSpan={2}>{currency(directCost)} <small>/ SP</small></td></tr></tfoot></table></div>
      <div className="process-note"><span>i</span>{categoryInfo[category].steps.join(' · ')}</div>
    </section>
    <aside className="cost-panel quote-panel"><div className="cost-section-label">03 <span>THÔNG SỐ BÁO GIÁ</span></div><label className="cost-field">Dự án / khách hàng<input value={projectName} onChange={(event) => setProjectName(event.target.value)} /></label><label className="cost-field">Sản lượng đặt hàng <small>PCS</small><input type="number" min="1" value={quantity} onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))} /></label>
      <div className="cost-input-pair"><label className="cost-field">Chi phí chung (%)<input type="number" min="0" max="100" value={overheadPercent} onChange={(event) => setOverheadPercent(Math.min(100, Math.max(0, Number(event.target.value) || 0)))} /></label><label className="cost-field">Margin (%)<input type="number" min="0" max="99" value={marginPercent} onChange={(event) => setMarginPercent(Math.min(99, Math.max(0, Number(event.target.value) || 0)))} /></label></div>
      <div className="cost-formula">Giá thành SX = trực tiếp + chi phí chung<br />Giá bán = giá thành SX ÷ (1 − margin)</div><button className="reset-samples" onClick={reset}>↺ Khôi phục dữ liệu mẫu</button>
    </aside></div>
    <section className="optimizer-panel"><div className="optimizer-title"><div><div className="cost-section-label">04 <span>GỢI Ý RÀ SOÁT CHI PHÍ</span></div><h2>Rà soát công đoạn sản xuất</h2></div><span className="rule-chip">QUY TẮC THAM KHẢO</span></div><p>Đề xuất cục bộ dựa trên tên công đoạn; đây không phải phân tích AI, không tự động lấy giá thị trường và không đảm bảo mức tiết kiệm.</p>
      {recommendations.length ? <><div className="recommendation-list">{recommendations.map((idea) => <article key={idea.id}><span>↗</span><div><strong>{idea.title}</strong><small>{idea.detail}</small></div></article>)}</div><div className="optimizer-footer"><span>Tiết kiệm thử nghiệm tối đa <strong>{currency(savings)} / SP</strong></span><button className="cost-button secondary" onClick={applyRecommendations}>Áp dụng thử mức giảm</button></div></> : <div className="no-recommendations">Chưa có gợi ý. Thêm khoản mục lắp ráp, gia công, cắt/bấm hoặc kiểm thử để rà soát.</div>}
    </section>
    <section className="cost-results"><div className="result-header"><div className="cost-section-label">05 <span>KẾT QUẢ TÍNH GIÁ</span></div><span>{category} <i /> {Number(quantity).toLocaleString('vi-VN')} PCS</span></div><div className="result-grid">
      <article><small>CHI PHÍ VẬT TƯ & GIA CÔNG / SP</small><strong>{currency(directCost)}</strong><span>Chi phí trực tiếp</span></article><article><small>GIÁ THÀNH SẢN XUẤT / SP</small><strong>{currency(manufacturingCost)}</strong><span>Đã gồm {overheadPercent}% chi phí chung</span></article><article><small>LỢI NHUẬN / SP</small><strong>{currency(profit)}</strong><span>Margin mục tiêu {marginPercent}% trên giá bán</span></article><article className="featured-result"><small>GIÁ BÁN GỢI Ý / SP</small><strong>{currency(sellingPrice)}</strong><span>Chưa gồm thuế, vận chuyển, phí khác</span></article></div><div className="order-total"><span>TỔNG GIÁ TRỊ ĐƠN HÀNG · {projectName || 'Chưa đặt tên dự án'}</span><strong>{currency(orderTotal)}</strong></div><p className="cost-disclaimer">Số liệu giả định để minh họa, không phải báo giá có hiệu lực. Cập nhật theo định mức, sản lượng, tỷ giá, thuế và báo giá nhà cung cấp trước khi thương thảo.</p></section>
    <style>{`
      .costing-page{max-width:1450px;margin:0 auto;padding:5px 12px 30px;color:#203128;font-family:'DM Sans',sans-serif}.cost-heading{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;padding:0 0 20px;border-bottom:1px solid #e4eae5}.cost-eyebrow,.cost-section-label{font:9px 'DM Mono',monospace;letter-spacing:.1em;color:#89968d}.cost-eyebrow i{display:inline-block;width:7px;height:7px;border-radius:50%;background:#48a276;margin-right:7px}.cost-heading h1{font:700 28px 'Manrope',sans-serif;letter-spacing:-.04em;margin:12px 0 5px;color:#203229}.cost-heading p{font-size:11px;color:#7f8b82;margin:0}.cost-actions{display:flex;gap:7px}.cost-file-input,.visually-hidden{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}.cost-button{border:1px solid #e0e7e1;border-radius:6px;padding:8px 11px;font-size:9px;font-weight:600;cursor:pointer}.cost-button.secondary{background:#fff;color:#526158}.cost-button.primary{background:#277b56;border-color:#277b56;color:white}.sample-warning{margin-top:13px;border:1px solid #ecdfb9;background:#fbf8ed;border-radius:7px;padding:10px 12px;color:#746b4c;font-size:9px;line-height:1.55}.sample-warning strong{color:#8b6e2d}.cost-notice{display:flex;justify-content:space-between;gap:10px;margin-top:10px;padding:9px 11px;border:1px solid #d5e8d9;border-radius:6px;background:#f2faf4;color:#34704a;font-size:9px}.cost-notice button{border:0;background:none;color:inherit;font-size:16px;cursor:pointer}.cost-category{margin:18px 0 12px}.cost-section-label{display:flex;align-items:center;gap:9px;font-size:8px}.cost-section-label span{color:#78877d}.cost-tabs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin-top:9px}.cost-tab{display:flex;align-items:center;gap:10px;min-width:0;text-align:left;background:white;border:1px solid #e3e9e4;border-radius:8px;padding:12px;cursor:pointer}.cost-tab.selected{border-color:#69a982;box-shadow:0 0 0 2px #eaf5ed;background:#fbfdfb}.tab-index{align-self:flex-start;color:#9aa69d;font:9px 'DM Mono',monospace}.tab-copy{display:flex;flex-direction:column;gap:4px;flex:1;min-width:0}.tab-copy strong{font:700 11px 'Manrope',sans-serif;color:#314239}.tab-copy small{color:#88948c;font-size:8px;line-height:1.45}.tab-arrow{color:#52916a}.cost-main-grid{display:grid;grid-template-columns:1.7fr .8fr;gap:11px}.cost-panel,.optimizer-panel,.cost-results{background:#fff;border:1px solid #e3e9e4;border-radius:8px}.cost-panel{padding:15px}.cost-panel-heading,.optimizer-title,.result-header{display:flex;justify-content:space-between;align-items:center;gap:12px}.cost-panel-heading h2,.optimizer-title h2{font:700 14px 'Manrope',sans-serif;color:#2c3c32;margin:8px 0 0}.cost-panel-heading h2 small{font:9px 'DM Sans',sans-serif;color:#89958d;margin-left:5px}.add-line{border:1px solid #dce8df;border-radius:5px;background:#f5faf6;padding:7px 9px;color:#377b52;font-size:9px;white-space:nowrap;cursor:pointer}.cost-table-scroll{overflow:auto;margin-top:13px}.cost-table{border-collapse:collapse;width:100%;min-width:510px;font-size:9px}.cost-table th{padding:9px 7px;text-align:left;color:#849087;background:#f7f9f7;font:8px 'DM Mono',monospace;letter-spacing:.03em}.cost-table td{padding:8px 6px;border-bottom:1px solid #eef1ee}.cost-table td:first-child{min-width:180px}.line-index{display:inline-block;width:24px;color:#9ba69e;font:8px 'DM Mono',monospace}.cost-table input{width:100%;min-width:48px;box-sizing:border-box;border:1px solid transparent;background:transparent;border-radius:4px;padding:6px;color:#445248;font:9px 'DM Sans',sans-serif}.cost-table input:hover,.cost-table input:focus{border-color:#dbe5dc;background:white;outline:none}.unit-price{display:flex;align-items:center;border:1px solid #edf0ed;border-radius:4px;padding-left:6px;color:#89958d}.unit-price input{border:0}.line-amount{font-weight:700;color:#42594a;white-space:nowrap}.delete-line{border:0;background:transparent;color:#a6afa8;font-size:16px;cursor:pointer}.delete-line:hover{color:#b24c4c}.cost-table tfoot td{border:0;background:#f5f8f5;padding:11px 8px;color:#46584c;font:700 9px 'DM Mono',monospace}.cost-table tfoot td:last-child{text-align:right;color:#28794f;font-size:11px;white-space:nowrap}.cost-table tfoot small{font:8px 'DM Sans',sans-serif;color:#849087}.process-note{display:flex;gap:8px;align-items:center;margin-top:11px;padding:9px 10px;background:#f7faf7;border-radius:5px;color:#7d8a81;font-size:8px}.process-note span{display:grid;place-items:center;width:14px;height:14px;border:1px solid #abb8ad;border-radius:50%;font:9px serif}.quote-panel{background:#f9fbf9}.quote-panel>.cost-section-label{margin-bottom:14px}.cost-field{display:block;color:#68756c;font-size:9px;font-weight:600;margin-bottom:12px}.cost-field small{float:right;color:#98a39b;font-weight:400}.cost-field input{display:block;box-sizing:border-box;width:100%;margin-top:6px;padding:8px 9px;border:1px solid #e0e7e1;border-radius:5px;background:#fff;color:#35453a;font:10px 'DM Sans',sans-serif;outline:none}.cost-field input:focus{border-color:#65a77d}.cost-input-pair{display:grid;grid-template-columns:1fr 1fr;gap:9px}.cost-formula{padding:9px;border-radius:5px;background:#eef5ef;color:#728177;font-size:8px;line-height:1.8}.reset-samples{margin-top:12px;border:0;background:none;color:#64816d;font-size:9px;cursor:pointer}.optimizer-panel{margin-top:12px;padding:15px}.rule-chip{border:1px solid #eadfbe;border-radius:20px;padding:5px 8px;background:#fbf8ed;color:#8b7540;font:8px 'DM Mono',monospace;white-space:nowrap}.optimizer-panel>p{font-size:9px;color:#808c83;line-height:1.6;margin:9px 0}.recommendation-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.recommendation-list article{display:flex;gap:8px;padding:9px;border:1px solid #edf0ed;border-radius:5px}.recommendation-list article>span{color:#41845c}.recommendation-list article div{display:flex;flex-direction:column;gap:4px}.recommendation-list strong{font-size:9px;color:#435248}.recommendation-list small{font-size:8px;color:#87938b;line-height:1.5}.optimizer-footer{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:10px;padding-top:10px;border-top:1px solid #eef1ee;color:#78857c;font-size:9px}.optimizer-footer strong{color:#378054}.no-recommendations{padding:11px;background:#f8faf8;border-radius:5px;color:#839087;font-size:9px}.cost-results{margin-top:12px;padding:15px}.result-header>span{color:#428158;font-size:9px}.result-header>span i{display:inline-block;width:5px;height:5px;border-radius:50%;background:#58aa76;margin:0 5px}.result-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:12px}.result-grid article{display:flex;flex-direction:column;gap:7px;padding:12px;border:1px solid #e9eeea;border-radius:6px}.result-grid article small{color:#8a958d;font:8px 'DM Mono',monospace;line-height:1.5}.result-grid article strong{font:700 18px 'Manrope',sans-serif;color:#34473a}.result-grid article span{color:#8a958d;font-size:8px}.result-grid .featured-result{border-color:#b9d9c2;background:#f2faf4}.result-grid .featured-result strong{color:#277b50}.order-total{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:9px;padding:11px 12px;background:#24392d;border-radius:6px;color:#d9e8dc}.order-total span{font:8px 'DM Mono',monospace;letter-spacing:.04em}.order-total strong{font:700 16px 'Manrope',sans-serif;color:#a9e3b9}.cost-disclaimer{margin:9px 0 0;color:#939e96;font-size:8px;line-height:1.6}@media(max-width:900px){.cost-main-grid{grid-template-columns:1fr}.quote-panel{display:grid;grid-template-columns:1fr 1fr;column-gap:12px}.quote-panel>.cost-section-label,.cost-formula,.reset-samples{grid-column:1/-1}.quote-panel>.cost-section-label{margin-bottom:0}}@media(max-width:620px){.costing-page{padding:0 0 20px}.cost-heading{align-items:flex-start;flex-direction:column}.cost-heading h1{font-size:23px}.cost-actions{width:100%;flex-wrap:wrap}.cost-button{flex:1}.cost-tabs{grid-template-columns:1fr}.cost-tab{padding:10px}.cost-panel,.optimizer-panel,.cost-results{padding:11px}.cost-panel-heading h2 small{display:block;margin:4px 0 0}.recommendation-list{grid-template-columns:1fr}.result-grid{grid-template-columns:1fr 1fr}.result-grid article strong{font-size:16px}.quote-panel{display:block}.order-total{align-items:flex-start;flex-direction:column}.result-header{align-items:flex-start}.rule-chip{font-size:7px}}@media print{body *{visibility:hidden!important}.costing-page,.costing-page *{visibility:visible!important}.costing-page{position:absolute;inset:0;width:100%;max-width:none;padding:0}.cost-actions,.cost-category,.add-line,.delete-line,.optimizer-panel,.reset-samples,.cost-notice{display:none!important}.cost-main-grid{grid-template-columns:1.5fr 1fr}.cost-table input,.cost-field input{border:0;padding:2px}.cost-results,.cost-panel{break-inside:avoid}.cost-disclaimer{color:#555}}
    `}</style>
  </main>;
}
