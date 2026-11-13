import { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';

type ProductCategory = 'BOM PCBA' | 'Wire harness' | 'IoT';
type CostLine = { id: string; name: string; unitCost: number };
type CategoryCosts = Record<ProductCategory, CostLine[]>;

const categoryInfo: Record<ProductCategory, { subtitle: string; steps: string[] }> = {
  'BOM PCBA': {
    subtitle: 'Linh kiện, lắp ráp SMT/DIP và kiểm thử bo mạch',
    steps: ['Linh kiện BOM', 'Gia công PCB', 'Lắp ráp SMT/DIP', 'Kiểm thử & QA'],
  },
  'Wire harness': {
    subtitle: 'Dây dẫn, connector, công đoạn cắt-tuốt-bấm và kiểm tra',
    steps: ['Dây & vật tư', 'Connector / terminal', 'Cắt-tuốt-bấm dây', 'Lắp ráp & kiểm tra'],
  },
  IoT: {
    subtitle: 'Phần cứng IoT, tích hợp firmware và kiểm thử thiết bị',
    steps: ['Linh kiện điện tử', 'Module kết nối / cảm biến', 'Lắp ráp & firmware', 'Kiểm thử thiết bị'],
  },
};

const initialCosts: CategoryCosts = {
  'BOM PCBA': [
    { id: 'pcba-1', name: 'Linh kiện BOM', unitCost: 11.25 },
    { id: 'pcba-2', name: 'Gia công PCB', unitCost: 5 },
    { id: 'pcba-3', name: 'Lắp ráp SMT/DIP', unitCost: 2.5 },
    { id: 'pcba-4', name: 'Kiểm thử & QA', unitCost: 1 },
  ],
  'Wire harness': [
    { id: 'harness-1', name: 'Dây & vật tư', unitCost: 4.2 },
    { id: 'harness-2', name: 'Connector / terminal', unitCost: 2.8 },
    { id: 'harness-3', name: 'Cắt-tuốt-bấm dây', unitCost: 1.6 },
    { id: 'harness-4', name: 'Lắp ráp & kiểm tra', unitCost: 0.9 },
  ],
  IoT: [
    { id: 'iot-1', name: 'Linh kiện điện tử', unitCost: 12.5 },
    { id: 'iot-2', name: 'Module kết nối / cảm biến', unitCost: 8 },
    { id: 'iot-3', name: 'Lắp ráp & firmware', unitCost: 4.5 },
    { id: 'iot-4', name: 'Kiểm thử thiết bị', unitCost: 1.5 },
  ],
};

const currency = (value: number) => new Intl.NumberFormat('vi-VN', {
  style: 'currency', currency: 'USD', maximumFractionDigits: 2,
}).format(value);

function loadSaved<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? { ...fallback, ...JSON.parse(saved) } : fallback;
  } catch {
    return fallback;
  }
}

export default function CostingPage() {
  const [category, setCategory] = useState<ProductCategory>('BOM PCBA');
  const [costsByCategory, setCostsByCategory] = useState<CategoryCosts>(() =>
    loadSaved('ai_sales_costs_by_category', initialCosts),
  );
  const [quantity, setQuantity] = useState(1000);
  const [overheadPercent, setOverheadPercent] = useState(8);
  const [marginPercent, setMarginPercent] = useState(25);
  const [projectName, setProjectName] = useState('Dự án mới');

  useEffect(() => {
    localStorage.setItem('ai_sales_costs_by_category', JSON.stringify(costsByCategory));
  }, [costsByCategory]);

  const costLines = costsByCategory[category] ?? [];
  const materialAndProcessing = costLines.reduce((sum, line) => sum + (Number(line.unitCost) || 0), 0);
  const overhead = materialAndProcessing * (Number(overheadPercent) || 0) / 100;
  const manufacturingCost = materialAndProcessing + overhead;
  const margin = Math.min(Math.max(Number(marginPercent) || 0, 0), 99.99) / 100;
  const sellingPrice = manufacturingCost / (1 - margin);
  const profitPerUnit = sellingPrice - manufacturingCost;
  const projectTotal = useMemo(() => sellingPrice * (Number(quantity) || 0), [sellingPrice, quantity]);

  const updateLine = (id: string, field: 'name' | 'unitCost', value: string) => {
    setCostsByCategory((previous) => ({
      ...previous,
      [category]: previous[category].map((line) => line.id === id
        ? { ...line, [field]: field === 'unitCost' ? Math.max(0, Number(value) || 0) : value }
        : line),
    }));
  };

  const addLine = () => {
    setCostsByCategory((previous) => ({
      ...previous,
      [category]: [...previous[category], { id: `${Date.now()}`, name: 'Chi phí mới', unitCost: 0 }],
    }));
  };

  const removeLine = (id: string) => {
    setCostsByCategory((previous) => ({
      ...previous,
      [category]: previous[category].filter((line) => line.id !== id),
    }));
  };

  const exportExcel = () => {
    const rows = [
      { 'Dự án': projectName, 'Phân loại': category, 'Sản lượng': quantity },
      ...costLines.map((line) => ({ 'Hạng mục': line.name, 'Đơn giá USD/SP': line.unitCost })),
      { 'Hạng mục': 'Tổng vật tư & gia công', 'Đơn giá USD/SP': materialAndProcessing },
      { 'Hạng mục': `Chi phí chung (${overheadPercent}%)`, 'Đơn giá USD/SP': overhead },
      { 'Hạng mục': 'Giá thành sản xuất / SP', 'Đơn giá USD/SP': manufacturingCost },
      { 'Hạng mục': `Biên lợi nhuận (${marginPercent}%)`, 'Đơn giá USD/SP': profitPerUnit },
      { 'Hạng mục': 'Giá bán đề xuất / SP', 'Đơn giá USD/SP': sellingPrice },
      { 'Hạng mục': 'Tổng giá trị đơn hàng', 'Đơn giá USD/SP': projectTotal },
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
  };

  return (
    <div className="costing-page">
      <header className="page-heading">
        <div>
          <div className="eyebrow"><span className="eyebrow-dot" /> AI SALES DEVELOPMENT <span className="eyebrow-separator">/</span> COSTING</div>
          <h1>Tính giá gia công & báo giá</h1>
          <p>Phân loại sản phẩm, xây dựng giá thành sản xuất và giá bán theo cấu trúc chi phí thực tế.</p>
        </div>
        <div className="heading-actions">
          <button className="button button-secondary" onClick={() => window.print()}>Xuất PDF</button>
          <button className="button button-primary" onClick={exportExcel}>↓ &nbsp; Xuất Excel</button>
        </div>
      </header>

      <section className="category-section">
        <div className="section-label">01 <span>CHỌN HẠNG MỤC SẢN PHẨM</span></div>
        <div className="category-tabs" role="tablist" aria-label="Phân loại sản phẩm">
          {(Object.keys(categoryInfo) as ProductCategory[]).map((item, index) => (
            <button
              key={item}
              role="tab"
              aria-selected={category === item}
              className={`category-tab ${category === item ? 'category-tab-active' : ''}`}
              onClick={() => setCategory(item)}
            >
              <span className="category-number">0{index + 1}</span>
              <span className="category-copy"><strong>{item}</strong><small>{categoryInfo[item].subtitle}</small></span>
              <span className="tab-arrow">↗</span>
            </button>
          ))}
        </div>
      </section>

      <div className="costing-grid">
        <section className="panel cost-panel">
          <div className="panel-heading">
            <div><div className="section-label">02 <span>CẤU TRÚC CHI PHÍ</span></div><h2>{category} <span className="muted-title">/ USD mỗi sản phẩm</span></h2></div>
            <button className="text-button" onClick={addLine}>＋ Thêm hạng mục</button>
          </div>
          <div className="cost-table-wrap">
            <table className="cost-table">
              <thead><tr><th>HẠNG MỤC</th><th>ĐƠN GIÁ / SP</th><th aria-label="Xóa" /></tr></thead>
              <tbody>
                {costLines.map((line, index) => (
                  <tr key={line.id}>
                    <td><span className="row-index">{String(index + 1).padStart(2, '0')}</span><input aria-label="Tên hạng mục" value={line.name} onChange={(event) => updateLine(line.id, 'name', event.target.value)} /></td>
                    <td><div className="money-input"><span>$</span><input aria-label={`Chi phí ${line.name}`} type="number" min="0" step="0.01" value={line.unitCost} onChange={(event) => updateLine(line.id, 'unitCost', event.target.value)} /></div></td>
                    <td><button className="remove-button" aria-label={`Xóa ${line.name}`} onClick={() => removeLine(line.id)}>×</button></td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr><td>Tổng vật tư & gia công</td><td colSpan={2}>{currency(materialAndProcessing)} <span className="per-unit">/ SP</span></td></tr></tfoot>
            </table>
          </div>
          <div className="formula-note"><span className="info-mark">i</span><span>{categoryInfo[category].steps.join(' · ')}</span></div>
        </section>

        <aside className="panel settings-panel">
          <div className="section-label">03 <span>THÔNG SỐ BÁO GIÁ</span></div>
          <label className="field-label">Tên dự án / khách hàng<input className="form-input" value={projectName} onChange={(event) => setProjectName(event.target.value)} /></label>
          <label className="field-label">Sản lượng đặt hàng <span className="unit-label">PCS</span><input className="form-input" type="number" min="1" value={quantity} onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))} /></label>
          <div className="split-fields">
            <label className="field-label">Chi phí chung<input className="form-input" type="number" min="0" max="100" value={overheadPercent} onChange={(event) => setOverheadPercent(Math.max(0, Number(event.target.value) || 0))} /><span className="field-suffix">%</span></label>
            <label className="field-label">Biên lợi nhuận<input className="form-input" type="number" min="0" max="99" value={marginPercent} onChange={(event) => setMarginPercent(Math.min(99, Math.max(0, Number(event.target.value) || 0)))} /><span className="field-suffix">%</span></label>
          </div>
          <div className="calculation-hint">Giá bán = Giá thành sản xuất ÷ (1 − biên lợi nhuận)</div>
          <button className="reset-button" onClick={reset}>↺ &nbsp; Khôi phục thông số mẫu</button>
        </aside>
      </div>

      <section className="results-section">
        <div className="results-heading"><div className="section-label">04 <span>KẾT QUẢ TÍNH GIÁ</span></div><span className="result-category">{category} <i /> {Number(quantity).toLocaleString('vi-VN')} PCS</span></div>
        <div className="result-cards">
          <article className="result-card"><span className="result-label">GIÁ THÀNH SẢN XUẤT / SP</span><strong>{currency(manufacturingCost)}</strong><small>Vật tư & gia công + chi phí chung</small></article>
          <article className="result-card"><span className="result-label">LỢI NHUẬN / SP</span><strong>{currency(profitPerUnit)}</strong><small>Biên lợi nhuận mục tiêu {marginPercent}%</small></article>
          <article className="result-card result-card-featured"><span className="result-label">GIÁ BÁN ĐỀ XUẤT / SP</span><strong>{currency(sellingPrice)}</strong><small>Giá chưa bao gồm thuế và vận chuyển</small></article>
          <article className="result-card result-card-total"><span className="result-label">TỔNG GIÁ TRỊ ĐƠN HÀNG</span><strong>{currency(projectTotal)}</strong><small>{Number(quantity).toLocaleString('vi-VN')} sản phẩm · {projectName || 'Dự án mới'}</small></article>
        </div>
        <p className="disclaimer">* Chi phí mẫu chỉ để minh họa. Hãy cập nhật theo BOM, báo giá nhà cung cấp, quy trình gia công và chính sách thương mại thực tế trước khi gửi khách hàng. Dữ liệu được lưu trên trình duyệt này.</p>
      </section>
    </div>
  );
}
