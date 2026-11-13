import { useEffect, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';

type ProductCategory = 'BOM PCBA' | 'Wire harness' | 'IoT';
type CostLine = { id: string; name: string; quantity: number; unitCost: number };
type CategoryCosts = Record<ProductCategory, CostLine[]>;
type Recommendation = { id: string; title: string; detail: string; lineId: string; reduction: number };

const categoryInfo: Record<ProductCategory, { subtitle: string; steps: string[] }> = {
  'BOM PCBA': { subtitle: 'Linh kiện, lắp ráp SMT/DIP và kiểm thử bo mạch', steps: ['Linh kiện BOM', 'Gia công PCB', 'Lắp ráp SMT/DIP', 'Kiểm thử & QA'] },
  'Wire harness': { subtitle: 'Dây dẫn, connector, công đoạn cắt-tuốt-bấm và kiểm tra', steps: ['Dây & vật tư', 'Connector / terminal', 'Cắt-tuốt-bấm dây', 'Lắp ráp & kiểm tra'] },
  IoT: { subtitle: 'Phần cứng IoT, tích hợp firmware và kiểm thử thiết bị', steps: ['Linh kiện điện tử', 'Module kết nối / cảm biến', 'Lắp ráp & firmware', 'Kiểm thử thiết bị'] },
};

const initialCosts: CategoryCosts = {
  'BOM PCBA': [
    { id: 'pcba-1', name: 'Linh kiện BOM', quantity: 1, unitCost: 11.25 },
    { id: 'pcba-2', name: 'Gia công PCB', quantity: 1, unitCost: 5 },
    { id: 'pcba-3', name: 'Lắp ráp SMT/DIP', quantity: 1, unitCost: 2.5 },
    { id: 'pcba-4', name: 'Kiểm thử & QA', quantity: 1, unitCost: 1 },
  ],
  'Wire harness': [
    { id: 'harness-1', name: 'Dây & vật tư', quantity: 1, unitCost: 4.2 },
    { id: 'harness-2', name: 'Connector / terminal', quantity: 1, unitCost: 2.8 },
    { id: 'harness-3', name: 'Cắt-tuốt-bấm dây', quantity: 1, unitCost: 1.6 },
    { id: 'harness-4', name: 'Lắp ráp & kiểm tra', quantity: 1, unitCost: 0.9 },
  ],
  IoT: [
    { id: 'iot-1', name: 'Linh kiện điện tử', quantity: 1, unitCost: 12.5 },
    { id: 'iot-2', name: 'Module kết nối / cảm biến', quantity: 1, unitCost: 8 },
    { id: 'iot-3', name: 'Lắp ráp & firmware', quantity: 1, unitCost: 4.5 },
    { id: 'iot-4', name: 'Kiểm thử thiết bị', quantity: 1, unitCost: 1.5 },
  ],
};

const currency = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(Number.isFinite(value) ? value : 0);
const itemTotal = (line: CostLine) => Math.max(0, Number(line.quantity) || 0) * Math.max(0, Number(line.unitCost) || 0);

function loadCosts(): CategoryCosts {
  try {
    const saved = localStorage.getItem('ai_sales_costs_by_category');
    if (!saved) return initialCosts;
    const parsed = JSON.parse(saved) as Partial<CategoryCosts>;
    return Object.fromEntries((Object.keys(initialCosts) as ProductCategory[]).map((category) => {
      const rows = parsed[category];
      const normalized = Array.isArray(rows) ? rows.map((row) => ({
        id: String(row.id ?? `${category}-${Math.random()}`),
        name: String(row.name ?? 'Hạng mục'),
        quantity: Math.max(0, Number(row.quantity) || 1),
        unitCost: Math.max(0, Number(row.unitCost) || 0),
      })) : initialCosts[category];
      return [category, normalized];
    })) as CategoryCosts;
  } catch {
    return initialCosts;
  }
}

const normalizedHeader = (value: unknown) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/đ/g, 'd').replace(/[^a-z0-9]/g, '');
const findColumn = (headers: string[], aliases: string[]) => headers.find((header) => aliases.some((alias) => normalizedHeader(header).includes(alias)));

export default function CostingPage() {
  const [category, setCategory] = useState<ProductCategory>('BOM PCBA');
  const [costsByCategory, setCostsByCategory] = useState<CategoryCosts>(loadCosts);
  const [quantity, setQuantity] = useState(1000);
  const [overheadPercent, setOverheadPercent] = useState(8);
  const [marginPercent, setMarginPercent] = useState(25);
  const [projectName, setProjectName] = useState('Dự án mới');
  const [importMessage, setImportMessage] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try { localStorage.setItem('ai_sales_costs_by_category', JSON.stringify(costsByCategory)); } catch { setImportMessage('Không thể lưu thêm dữ liệu. Có thể bộ nhớ trình duyệt đã đầy.'); }
  }, [costsByCategory]);

  const costLines = costsByCategory[category] ?? [];
  const materialAndProcessing = costLines.reduce((sum, line) => sum + itemTotal(line), 0);
  const overhead = materialAndProcessing * Math.max(0, Number(overheadPercent) || 0) / 100;
  const manufacturingCost = materialAndProcessing + overhead;
  const margin = Math.min(Math.max(Number(marginPercent) || 0, 0), 99) / 100;
  const sellingPrice = manufacturingCost / (1 - margin);
  const profitPerUnit = sellingPrice - manufacturingCost;
  const projectTotal = useMemo(() => sellingPrice * Math.max(0, Number(quantity) || 0), [sellingPrice, quantity]);

  // Local rule-based ideas, not a connected AI model. Suggestions are estimates and require human review.
  const recommendations = useMemo<Recommendation[]>(() => {
    const processWords = /gia công|lắp ráp|smt|dip|kiểm thử|qa|cắt|tuốt|bấm|firmware|assembly|testing|labor/i;
    return costLines.filter((line) => processWords.test(line.name) && itemTotal(line) > 0).map((line) => {
      const rate = category === 'Wire harness' ? 0.07 : category === 'BOM PCBA' ? 0.06 : 0.05;
      return {
        id: line.id,
        title: `Rà soát công đoạn: ${line.name}`,
        detail: `Ước tính thử nghiệm giảm ${(rate * 100).toFixed(0)}% bằng cách xem lại thời gian chu kỳ, ghép lô hoặc điểm kiểm tra. Cần xác nhận với bộ phận sản xuất.`,
        lineId: line.id,
        reduction: rate,
      };
    });
  }, [category, costLines]);
  const estimatedSavings = recommendations.reduce((sum, item) => {
    const line = costLines.find((candidate) => candidate.id === item.lineId);
    return sum + (line ? itemTotal(line) * item.reduction : 0);
  }, 0);

  const updateLine = (id: string, field: 'name' | 'quantity' | 'unitCost', value: string) => {
    setCostsByCategory((previous) => ({ ...previous, [category]: previous[category].map((line) => line.id === id
      ? { ...line, [field]: field === 'name' ? value : Math.max(0, Number(value) || 0) }
      : line) }));
  };
  const addLine = () => setCostsByCategory((previous) => ({ ...previous, [category]: [...previous[category], { id: `${Date.now()}`, name: 'Chi phí mới', quantity: 1, unitCost: 0 }] }));
  const removeLine = (id: string) => setCostsByCategory((previous) => ({ ...previous, [category]: previous[category].filter((line) => line.id !== id) }));

  const importExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImportMessage('');
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error('File vượt quá giới hạn 10 MB.');
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
      if (!rows.length) throw new Error('Không tìm thấy dữ liệu trong sheet đầu tiên.');
      const headers = Object.keys(rows[0]);
      const nameCol = findColumn(headers, ['itemname', 'partname', 'description', 'item', 'component', 'hạngmục', 'tenhangmuc', 'tênlinhkiện', 'tenlinhkien', 'mãlinhkiện', 'malinhkien']);
      const priceCol = findColumn(headers, ['unitcost', 'unitprice', 'price', 'cost', 'dongia', 'giadonvi', 'chiphidonvi', 'giavnd', 'giausd']);
      const qtyCol = findColumn(headers, ['quantity', 'qty', 'soluong', 'sl']);
      if (!nameCol || !priceCol) throw new Error('Thiếu cột tên hạng mục hoặc đơn giá. Hãy dùng mẫu cột: Item / Description, Qty, Unit Cost.');
      const imported: CostLine[] = rows.flatMap((row, index) => {
        const name = String(row[nameCol] ?? '').trim();
        const rawPrice = Number(String(row[priceCol] ?? '').replace(/[,\s$]/g, ''));
        const rawQty = qtyCol ? Number(String(row[qtyCol] ?? '').replace(/[,\s]/g, '')) : 1;
        if (!name || !Number.isFinite(rawPrice) || rawPrice < 0) return [];
        return [{ id: `import-${Date.now()}-${index}`, name, quantity: Number.isFinite(rawQty) && rawQty > 0 ? rawQty : 1, unitCost: rawPrice }];
      });
      if (!imported.length) throw new Error('Không có dòng hợp lệ. Kiểm tra tên hạng mục và giá trị đơn giá.');
      setCostsByCategory((previous) => ({ ...previous, [category]: imported }));
      setImportMessage(`Đã nhập ${imported.length} dòng vào danh mục ${category}. Chi phí mẫu hiện tại của danh mục đã được thay thế.`);
    } catch (error) {
      setImportMessage(error instanceof Error ? error.message : 'Không thể đọc file. Vui lòng kiểm tra định dạng Excel/CSV.');
    } finally {
      event.target.value = '';
    }
  };

  const applyRecommendations = () => {
    if (!recommendations.length) return;
    setCostsByCategory((previous) => ({ ...previous, [category]: previous[category].map((line) => {
      const idea = recommendations.find((item) => item.lineId === line.id);
      return idea ? { ...line, unitCost: Math.round(line.unitCost * (1 - idea.reduction) * 100) / 100 } : line;
    }) }));
    setImportMessage('Đã áp dụng mức giảm ước tính vào các dòng công đoạn. Vui lòng xác nhận lại với báo giá thực tế.');
  };

  const exportExcel = () => {
    const rows = [
      { 'Dự án': projectName, 'Phân loại': category, 'Sản lượng đặt hàng': quantity },
      ...costLines.map((line) => ({ 'Hạng mục': line.name, 'Số lượng / SP': line.quantity, 'Đơn giá USD': line.unitCost, 'Thành tiền USD / SP': itemTotal(line) })),
      { 'Hạng mục': 'Tổng vật tư & gia công', 'Thành tiền USD / SP': materialAndProcessing },
      { 'Hạng mục': `Chi phí chung (${overheadPercent}%)`, 'Thành tiền USD / SP': overhead },
      { 'Hạng mục': 'Giá thành sản xuất / SP', 'Thành tiền USD / SP': manufacturingCost },
      { 'Hạng mục': `Lợi nhuận (margin ${marginPercent}%)`, 'Thành tiền USD / SP': profitPerUnit },
      { 'Hạng mục': 'Giá bán đề xuất / SP', 'Thành tiền USD / SP': sellingPrice },
      { 'Hạng mục': 'Tổng giá trị đơn hàng', 'Thành tiền USD / SP': projectTotal },
    ];
    const sheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, 'Báo giá');
    XLSX.writeFile(workbook, `Bao-gia-${category.replaceAll(' ', '-')}.xlsx`);
  };
  const reset = () => {
    setCostsByCategory(initialCosts);
    setOverheadPercent(8);
    setMarginPercent(25);
    setQuantity(1000);
    setProjectName('Dự án mới');
    setImportMessage('Đã khôi phục dữ liệu mẫu cho cả ba danh mục.');
  };

  return (
    <div className="costing-page">
      <header className="page-heading">
        <div>
          <div className="eyebrow"><span className="eyebrow-dot" /> AI SALES DEVELOPMENT <span className="eyebrow-separator">/</span> COSTING</div>
          <h1>Tính giá gia công & báo giá</h1>
          <p>Phân loại sản phẩm, nhập BOM và tính giá thành sản xuất, giá bán theo cấu trúc chi phí.</p>
        </div>
        <div className="heading-actions">
          <input ref={fileInput} className="visually-hidden" type="file" accept=".xlsx,.xls,.csv" onChange={importExcel} />
          <button className="button button-secondary" onClick={() => fileInput.current?.click()}>↑ &nbsp; Nhập Excel</button>
          <button className="button button-secondary" onClick={() => window.print()}>Xuất PDF</button>
          <button className="button button-primary" onClick={exportExcel}>↓ &nbsp; Xuất Excel</button>
        </div>
      </header>

      {importMessage && <div className="notice" role="status">{importMessage}<button aria-label="Đóng thông báo" onClick={() => setImportMessage('')}>×</button></div>}
      <section className="category-section">
        <div className="section-label">01 <span>CHỌN HẠNG MỤC SẢN PHẨM</span></div>
        <div className="category-tabs" role="tablist" aria-label="Phân loại sản phẩm">
          {(Object.keys(categoryInfo) as ProductCategory[]).map((item, index) => (
            <button key={item} role="tab" aria-selected={category === item} className={`category-tab ${category === item ? 'category-tab-active' : ''}`} onClick={() => setCategory(item)}>
              <span className="category-number">0{index + 1}</span><span className="category-copy"><strong>{item}</strong><small>{categoryInfo[item].subtitle}</small></span><span className="tab-arrow">↗</span>
            </button>
          ))}
        </div>
      </section>

      <div className="costing-grid">
        <section className="panel cost-panel">
          <div className="panel-heading"><div><div className="section-label">02 <span>CẤU TRÚC CHI PHÍ</span></div><h2>{category} <span className="muted-title">/ USD mỗi sản phẩm</span></h2></div><button className="text-button" onClick={addLine}>＋ Thêm hạng mục</button></div>
          <div className="cost-table-wrap"><table className="cost-table">
            <thead><tr><th>HẠNG MỤC</th><th>SỐ LƯỢNG</th><th>ĐƠN GIÁ</th><th>THÀNH TIỀN</th><th aria-label="Xóa" /></tr></thead>
            <tbody>{costLines.map((line, index) => <tr key={line.id}>
              <td><span className="row-index">{String(index + 1).padStart(2, '0')}</span><input aria-label="Tên hạng mục" value={line.name} onChange={(event) => updateLine(line.id, 'name', event.target.value)} /></td>
              <td><input aria-label={`Số lượng ${line.name}`} type="number" min="0" step="0.01" value={line.quantity} onChange={(event) => updateLine(line.id, 'quantity', event.target.value)} /></td>
              <td><div className="money-input"><span>$</span><input aria-label={`Đơn giá ${line.name}`} type="number" min="0" step="0.01" value={line.unitCost} onChange={(event) => updateLine(line.id, 'unitCost', event.target.value)} /></div></td>
              <td className="line-total">{currency(itemTotal(line))}</td><td><button className="remove-button" aria-label={`Xóa ${line.name}`} onClick={() => removeLine(line.id)}>×</button></td>
            </tr>)}</tbody>
            <tfoot><tr><td colSpan={3}>Tổng vật tư & gia công</td><td colSpan={2}>{currency(materialAndProcessing)} <span className="per-unit">/ SP</span></td></tr></tfoot>
          </table></div>
          <div className="formula-note"><span className="info-mark">i</span><span>{categoryInfo[category].steps.join(' · ')}</span></div>
        </section>

        <aside className="panel settings-panel">
          <div className="section-label">03 <span>THÔNG SỐ BÁO GIÁ</span></div>
          <label className="field-label">Tên dự án / khách hàng<input className="form-input" value={projectName} onChange={(event) => setProjectName(event.target.value)} /></label>
          <label className="field-label">Sản lượng đặt hàng <span className="unit-label">PCS</span><input className="form-input" type="number" min="1" value={quantity} onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))} /></label>
          <div className="split-fields">
            <label className="field-label">Chi phí chung<input className="form-input" type="number" min="0" max="100" value={overheadPercent} onChange={(event) => setOverheadPercent(Math.min(100, Math.max(0, Number(event.target.value) || 0)))} /><span className="field-suffix">%</span></label>
            <label className="field-label">Biên lợi nhuận<input className="form-input" type="number" min="0" max="99" value={marginPercent} onChange={(event) => setMarginPercent(Math.min(99, Math.max(0, Number(event.target.value) || 0)))} /><span className="field-suffix">%</span></label>
          </div>
          <div className="calculation-hint">Giá bán = Giá thành sản xuất ÷ (1 − biên lợi nhuận). Margin được tính trên giá bán.</div>
          <button className="reset-button" onClick={reset}>↺ &nbsp; Khôi phục thông số mẫu</button>
        </aside>
      </div>

      <section className="optimizer-panel panel">
        <div className="optimizer-heading"><div><div className="section-label">AI <span>GỢI Ý RÀ SOÁT CHI PHÍ</span></div><h2>Trợ lý tối ưu sản xuất</h2></div><span className="prototype-badge">GỢI Ý THEO QUY TẮC · CẦN XÁC NHẬN</span></div>
        <p className="optimizer-description">Phân tích cục bộ các tên công đoạn và đưa ra mức tiết kiệm thử nghiệm. Không kết nối mô hình AI, dữ liệu thị trường hay nhà cung cấp; hãy xác minh bằng dữ liệu thực tế.</p>
        {recommendations.length ? <>
          <div className="recommendation-list">{recommendations.map((idea) => <article className="recommendation" key={idea.id}><span className="recommendation-icon">↗</span><div><strong>{idea.title}</strong><p>{idea.detail}</p></div><span className="saving-tag">-{(idea.reduction * 100).toFixed(0)}%</span></article>)}</div>
          <div className="optimizer-footer"><span>Tiết kiệm ước tính tối đa <strong>{currency(estimatedSavings)} / SP</strong></span><button className="button button-secondary" onClick={applyRecommendations}>Áp dụng mức ước tính</button></div>
        </> : <p className="empty-recommendation">Chưa có gợi ý cho các dòng hiện tại. Thêm chi phí công đoạn như lắp ráp, gia công hoặc kiểm thử để rà soát.</p>}
      </section>

      <section className="results-section">
        <div className="results-heading"><div className="section-label">04 <span>KẾT QUẢ TÍNH GIÁ</span></div><span className="result-category">{category} <i /> {Number(quantity).toLocaleString('vi-VN')} PCS</span></div>
        <div className="result-cards">
          <article className="result-card"><span className="result-label">GIÁ THÀNH SẢN XUẤT / SP</span><strong>{currency(manufacturingCost)}</strong><small>Vật tư & gia công + chi phí chung</small></article>
          <article className="result-card"><span className="result-label">LỢI NHUẬN / SP</span><strong>{currency(profitPerUnit)}</strong><small>Biên lợi nhuận mục tiêu {marginPercent}%</small></article>
          <article className="result-card result-card-featured"><span className="result-label">GIÁ BÁN ĐỀ XUẤT / SP</span><strong>{currency(sellingPrice)}</strong><small>Chưa gồm thuế và vận chuyển</small></article>
          <article className="result-card result-card-total"><span className="result-label">TỔNG GIÁ TRỊ ĐƠN HÀNG</span><strong>{currency(projectTotal)}</strong><small>{Number(quantity).toLocaleString('vi-VN')} sản phẩm · {projectName || 'Dự án mới'}</small></article>
        </div>
        <p className="disclaimer">* Chi phí mẫu chỉ để minh họa. Cập nhật theo BOM, báo giá nhà cung cấp, quy trình gia công và chính sách thương mại thực tế trước khi gửi khách hàng. Dữ liệu chi phí lưu cục bộ trên trình duyệt này.</p>
      </section>
    </div>
  );
}
