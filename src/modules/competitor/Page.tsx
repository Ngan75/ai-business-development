import { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';

interface CompetitorItem {
  id: string;
  stt: string;               // STT (vd: "1", "1.1", "1.2", "2", "2.1")
  name: string;              // Tên sản phẩm / Giải pháp
  isOwnProduct: boolean;      // Đánh dấu "Sản phẩm bạn"
  mcu: string;               // Vi điều khiển (MCU)
  power: string;             // Công suất tiêu thụ (vd: "1.2W")
  leadTime: string;          // Lead Time (vd: "2 tuần")
  price: number;             // Giá bán thị trường ($)
  aiAdvantage: string;       // Đánh giá Lợi thế AI / Nhận xét
}

const initialCompetitorData: CompetitorItem[] = [
  {
    id: '1',
    stt: '1',
    name: 'Sản phẩm của chúng ta (Smart Meter V2)',
    isOwnProduct: true,
    mcu: 'STM32F407 (ARM Cortex-M4)',
    power: '1.2W',
    leadTime: '2 tuần',
    price: 32.13,
    aiAdvantage: 'Tối ưu AI BOM, giá cạnh tranh hơn 15%',
  },
  {
    id: '2',
    stt: '1.1',
    name: 'Đối thủ A - Model X1',
    isOwnProduct: false,
    mcu: 'ESP32-S3 (Dual-Core)',
    power: '1.8W',
    leadTime: '4 tuần',
    price: 38.00,
    aiAdvantage: 'Có sẵn kết nối Wi-Fi/Bluetooth',
  },
  {
    id: '3',
    stt: '1.2',
    name: 'Đối thủ B - Pro Controller',
    isOwnProduct: false,
    mcu: 'Microchip SAME54',
    power: '2.1W',
    leadTime: '6 tuần',
    price: 45.50,
    aiAdvantage: 'Thương hiệu lâu đời, độ bền công nghiệp',
  },
  {
    id: '4',
    stt: '2',
    name: 'TV SOC MEDIATEK MT9216HAAT/FBZB LFBGA 4+',
    isOwnProduct: true,
    mcu: 'MT9216 (Dua-Core)',
    power: '2.0W',
    leadTime: '1 tuần',
    price: 29.50,
    aiAdvantage: 'Wifi sẵn, giá cạnh tranh hơn 5%',
  },
  {
    id: '5',
    stt: '2.1',
    name: 'Đối thủ Zioncom - TV SOC AMLOGIC',
    isOwnProduct: false,
    mcu: 'T950R4-B5S1 B2',
    power: '1.8W',
    leadTime: '1.5 tuần',
    price: 30.00,
    aiAdvantage: 'Có sẵn kết nối Wifi, Thương hiệu lâu đời',
  },
];

// Hàm tính STT tự động chuẩn phân cấp Benchmark Matrix
const calculateNextSTT = (items: CompetitorItem[], isOwn: boolean): string => {
  if (items.length === 0) return isOwn ? '1' : '1.1';

  if (isOwn) {
    // Đếm số sản phẩm của bạn hiện tại + 1
    const ownCount = items.filter((item) => item.isOwnProduct).length;
    return String(ownCount + 1);
  } else {
    // Tìm sản phẩm của bạn ở gần cuối danh sách nhất
    let lastOwnSTT = '1';
    for (let i = items.length - 1; i >= 0; i--) {
      if (items[i].isOwnProduct) {
        lastOwnSTT = items[i].stt;
        break;
      }
    }

    // Lọc các đối thủ thuộc nhóm sản phẩm bạn đó (ví dụ: các ô bắt đầu bằng "3.")
    const subItems = items.filter(
      (item) => !item.isOwnProduct && item.stt.startsWith(`${lastOwnSTT}.`)
    );

    const nextSubNum = subItems.length + 1;
    return `${lastOwnSTT}.${nextSubNum}`;
  }
};

export default function CompetitorPage() {
  // 1. Tự động lấy dữ liệu từ LocalStorage
  const [competitors, setCompetitors] = useState<CompetitorItem[]>(() => {
    const saved = localStorage.getItem('ai_business_competitor_data');
    return saved ? JSON.parse(saved) : initialCompetitorData;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CompetitorItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [formData, setFormData] = useState({
    stt: '1.3',
    name: '',
    isOwnProduct: false,
    mcu: '',
    power: '',
    leadTime: '',
    price: '',
    aiAdvantage: '',
  });

  // Tự động lưu LocalStorage mỗi khi danh sách có sự thay đổi
  useEffect(() => {
    localStorage.setItem('ai_business_competitor_data', JSON.stringify(competitors));
  }, [competitors]);

  // --- THỐNG KÊ TỰ ĐỘNG ---
  const ownProductCount = competitors.filter((c) => c.isOwnProduct).length;
  const competitorCount = competitors.filter((c) => !c.isOwnProduct).length;

  // Format hiển thị tiền $
  const formatCurrency = (val: number | undefined | null) => {
    const num = typeof val === 'number' && !isNaN(val) ? val : Number(val) || 0;
    return '$' + num.toFixed(2);
  };

  // Làm sạch giá trị số từ Excel
  const parseExcelAmount = (val: any): number => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const cleanStr = String(val).replace(/,/g, '').replace(/\$/g, '').trim();
    const parsed = parseFloat(cleanStr);
    return isNaN(parsed) ? 0 : parsed;
  };

  // --- 1. NẠP FILE EXCEL ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data: any[] = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          alert('File Excel trống hoặc không đúng định dạng!');
          return;
        }

        const importedData: CompetitorItem[] = data.map((row, idx) => {
          const isOwn = String(row['Loại'] || row['Phân loại'] || '').toLowerCase().includes('bạn') || 
                        String(row['Tên sản phẩm / Giải pháp'] || '').toLowerCase().includes('chúng ta');

          return {
            id: Date.now().toString() + '_' + idx,
            stt: String(row['STT'] || `${idx + 1}`),
            name: String(row['Tên sản phẩm / Giải pháp'] || row['Name'] || 'Chưa có tên'),
            isOwnProduct: isOwn,
            mcu: String(row['Vi điều khiển (MCU)'] || row['MCU'] || '-'),
            power: String(row['Công suất tiêu thụ'] || row['Power'] || '-'),
            leadTime: String(row['Lead Time'] || row['LeadTime'] || '-'),
            price: parseExcelAmount(row['Giá bán thị trường'] ?? row['Price'] ?? 0),
            aiAdvantage: String(row['Đánh giá Lợi thế AI'] || row['Advantage'] || '-'),
          };
        });

        setCompetitors(importedData);
        alert(`Đã nạp thành công ${importedData.length} sản phẩm / đối thủ từ file Excel!`);
      } catch (error) {
        console.error(error);
        alert('Lỗi khi nạp file Excel!');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  // --- 2. XUẤT FILE EXCEL ĐÃ CẬP NHẬT (CÓ CHỌN ĐƯỜNG DẪN LƯU) ---
  const handleExportExcel = async () => {
    if (competitors.length === 0) {
      alert('Danh sách Ma trận so sánh hiện đang trống!');
      return;
    }

    const exportData = competitors.map((c) => ({
      'STT': c.stt,
      'Tên sản phẩm / Giải pháp': c.name,
      'Phân loại': c.isOwnProduct ? 'Sản phẩm bạn' : 'Đối thủ',
      'Vi điều khiển (MCU)': c.mcu,
      'Công suất tiêu thụ': c.power,
      'Lead Time': c.leadTime,
      'Giá bán thị trường': c.price,
      'Đánh giá Lợi thế AI': c.aiAdvantage,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Benchmark_Matrix');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    if ('showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: `So_Sanh_Doi_Thu_${new Date().toISOString().slice(0, 10)}.xlsx`,
          types: [
            {
              description: 'Excel File',
              accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
            },
          ],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        alert('Đã lưu file Ma trận So sánh thành công!');
      } catch (err: any) {
        if (err.name !== 'AbortError') console.error(err);
      }
    } else {
      XLSX.writeFile(workbook, `So_Sanh_Doi_Thu_${new Date().toISOString().slice(0, 10)}.xlsx`);
    }
  };

  // --- 3. THÊM HOẶC SỬA SẢN PHẨM / ĐỐI THỦ ---
  // Mở modal thêm/sửa
  const handleOpenModal = (itemToEdit?: CompetitorItem) => {
    if (itemToEdit) {
      setEditingItem(itemToEdit);
      setFormData({
        stt: itemToEdit.stt,
        name: itemToEdit.name,
        isOwnProduct: itemToEdit.isOwnProduct,
        mcu: itemToEdit.mcu,
        power: itemToEdit.power,
        leadTime: itemToEdit.leadTime,
        price: String(itemToEdit.price),
        aiAdvantage: itemToEdit.aiAdvantage,
      });
    } else {
      setEditingItem(null);
      // Tự động tính STT ban đầu cho trường hợp thêm mới (mặc định là Đối thủ)
      const defaultIsOwn = false;
      const initialSTT = calculateNextSTT(competitors, defaultIsOwn);

      setFormData({
        stt: initialSTT,
        name: '',
        isOwnProduct: defaultIsOwn,
        mcu: '',
        power: '1.5W',
        leadTime: '2 tuần',
        price: '',
        aiAdvantage: '',
      });
    }
    setIsModalOpen(true);
  };

  {/* Checkbox Sản phẩm bạn */}
  <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
    <input
      type="checkbox"
      id="isOwnProduct"
      checked={formData.isOwnProduct}
      onChange={(e) => {
        const checked = e.target.checked;
        // Tự động nhảy lại STT khi chọn hoặc bỏ chọn sản phẩm nội bộ
        const newSTT = editingItem
          ? formData.stt
          : calculateNextSTT(competitors, checked);

        setFormData({
          ...formData,
          isOwnProduct: checked,
          stt: newSTT,
        });
      }}
      className="w-4 h-4 text-sky-600 rounded border-slate-300 cursor-pointer"
    />
    <label htmlFor="isOwnProduct" className="font-semibold text-slate-700 cursor-pointer select-none">
      Đây là sản phẩm nội bộ của chúng ta (Đánh dấu "Sản phẩm bạn")
    </label>
  </div>

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Vui lòng nhập Tên sản phẩm / Giải pháp!');
      return;
    }

    if (editingItem) {
      // Cập nhật item đang chỉnh sửa
      setCompetitors((prev) =>
        prev.map((item) =>
          item.id === editingItem.id
            ? {
                ...item,
                stt: formData.stt,
                name: formData.name,
                isOwnProduct: formData.isOwnProduct,
                mcu: formData.mcu || '-',
                power: formData.power || '-',
                leadTime: formData.leadTime || '-',
                price: parseFloat(formData.price) || 0,
                aiAdvantage: formData.aiAdvantage || '-',
              }
            : item
        )
      );
    } else {
      // Thêm mới
      const newItem: CompetitorItem = {
        id: Date.now().toString(),
        stt: formData.stt || `${competitors.length + 1}`,
        name: formData.name,
        isOwnProduct: formData.isOwnProduct,
        mcu: formData.mcu || '-',
        power: formData.power || '-',
        leadTime: formData.leadTime || '-',
        price: parseFloat(formData.price) || 0,
        aiAdvantage: formData.aiAdvantage || '-',
      };

      setCompetitors((prev) => [...prev, newItem]);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc muốn xóa sản phẩm/đối thủ này khỏi ma trận so sánh?')) {
      setCompetitors((prev) => prev.filter((item) => item.id !== id));
    }
  };

  return (
    <div className="space-y-4 select-none">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".xlsx, .xls, .csv"
        className="hidden"
      />

      {/* Header */}
      <div className="flex justify-between items-center border-b pb-3 border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Competitor - Phân tích & So sánh Đối thủ</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            So sánh trực quan thông số kỹ thuật, giá thành và lợi thế cạnh tranh với đối thủ thị trường.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 text-xs rounded-lg font-medium transition shadow-sm flex items-center gap-1.5"
          >
            <span>📊 Nạp File Excel</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="bg-slate-700 hover:bg-slate-800 text-white px-3.5 py-1.5 text-xs rounded-lg font-medium transition shadow-sm flex items-center gap-1.5"
          >
            <span>📥 Xuất File Excel</span>
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="bg-sky-600 hover:bg-sky-700 text-white px-3.5 py-1.5 text-xs rounded-lg font-medium transition shadow-sm flex items-center gap-1.5"
          >
            <span>+ Thêm Đối thủ / Sản phẩm</span>
          </button>
        </div>
      </div>

      {/* Cards Thống Kê */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">ĐỐI THỦ THEO DÕI CHÍNH</div>
          <div className="text-2xl font-bold text-slate-800 mt-1">
            {competitorCount} <span className="text-sm font-normal text-slate-600">Doanh nghiệp</span>
          </div>
        </div>

        <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl shadow-sm">
          <div className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider">SẢN PHẨM CỦA BẠN</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">
            {ownProductCount} <span className="text-sm font-normal text-emerald-600">Sản phẩm</span>
          </div>
        </div>

        <div className="p-4 bg-sky-50/50 border border-sky-200 rounded-xl shadow-sm flex justify-between items-center">
          <div>
            <div className="text-[10px] font-semibold text-sky-700 uppercase tracking-wider">THỜI GIAN GIAO HÀNG (LEAD TIME)</div>
            <div className="text-2xl font-bold text-sky-600 mt-1">Nhanh hơn 61%</div>
          </div>
          <select className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 shadow-sm outline-none">
            <option>📊 Tất cả sản phẩm</option>
          </select>
        </div>
      </div>

      {/* Bảng Ma Trận So Sánh */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-3 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-700">
          Ma trận so sánh thông số kỹ thuật & Chi phí (Benchmark Matrix)
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 border-collapse">
            <thead className="bg-slate-50/50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-center">STT</th>
                <th className="px-4 py-3">Tên sản phẩm / Giải pháp</th>
                <th className="px-4 py-3">Vi điều khiển (MCU)</th>
                <th className="px-4 py-3 text-center">Công suất tiêu thụ</th>
                <th className="px-4 py-3 text-center">Lead Time</th>
                <th className="px-4 py-3 text-right">Giá bán thị trường</th>
                <th className="px-4 py-3">Đánh giá Lợi thế AI</th>
                <th className="px-4 py-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {competitors.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-4 py-3 font-bold text-center text-slate-800 align-middle">{item.stt}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800 align-middle">
                    <div className="flex items-center gap-2">
                      <span>{item.name}</span>
                      {item.isOwnProduct && (
                        <span className="bg-sky-100 text-sky-700 text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                          Sản phẩm bạn
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 align-middle">{item.mcu}</td>
                  <td className="px-4 py-3 text-center text-slate-600 align-middle">{item.power}</td>
                  <td className="px-4 py-3 text-center text-slate-600 align-middle">{item.leadTime}</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-800 align-middle">
                    {formatCurrency(item.price)}
                  </td>
                  <td className="px-4 py-3 text-sky-700 align-middle font-medium">{item.aiAdvantage}</td>
                  <td className="px-4 py-3 text-center align-middle">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => handleOpenModal(item)}
                        className="text-sky-600 hover:text-sky-800 text-xs px-1.5 py-1 rounded hover:bg-sky-50 transition"
                        title="Sửa thông tin"
                      >
                        ✏️ Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-500 hover:text-red-700 text-xs px-1.5 py-1 rounded hover:bg-red-50 transition"
                        title="Xóa"
                      >
                        🗑️ Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Popup Modal Thêm / Sửa Đối Thủ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="px-5 py-3.5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm">
                {editingItem ? 'Sửa thông tin Phân tích So sánh' : 'Thêm Đối thủ / Sản phẩm mới'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">STT *</label>
                  <input
                    type="text"
                    value={formData.stt}
                    onChange={(e) => setFormData({ ...formData, stt: e.target.value })}
                    placeholder="1 hoặc 1.1"
                    className="w-full px-3 py-1.5 border rounded-lg font-bold text-slate-700"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Tên sản phẩm / Giải pháp *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ví dụ: Đối thủ C - Smart Controller"
                    className="w-full px-3 py-1.5 border rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <input
                  type="checkbox"
                  id="isOwnProduct"
                  checked={formData.isOwnProduct}
                  onChange={(e) => setFormData({ ...formData, isOwnProduct: e.target.checked })}
                  className="w-4 h-4 text-sky-600 rounded border-slate-300"
                />
                <label htmlFor="isOwnProduct" className="font-semibold text-slate-700 cursor-pointer">
                  Đây là sản phẩm nội bộ của chúng ta (Đánh dấu "Sản phẩm bạn")
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Vi điều khiển (MCU)</label>
                  <input
                    type="text"
                    value={formData.mcu}
                    onChange={(e) => setFormData({ ...formData, mcu: e.target.value })}
                    placeholder="Ví dụ: STM32F407, ESP32..."
                    className="w-full px-3 py-1.5 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Công suất tiêu thụ</label>
                  <input
                    type="text"
                    value={formData.power}
                    onChange={(e) => setFormData({ ...formData, power: e.target.value })}
                    placeholder="Ví dụ: 1.2W"
                    className="w-full px-3 py-1.5 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lead Time</label>
                  <input
                    type="text"
                    value={formData.leadTime}
                    onChange={(e) => setFormData({ ...formData, leadTime: e.target.value })}
                    placeholder="Ví dụ: 2 tuần"
                    className="w-full px-3 py-1.5 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Giá bán thị trường ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="32.13"
                    className="w-full px-3 py-1.5 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Đánh giá Lợi thế AI / Nhận xét</label>
                <textarea
                  value={formData.aiAdvantage}
                  onChange={(e) => setFormData({ ...formData, aiAdvantage: e.target.value })}
                  placeholder="Ví dụ: Tối ưu AI BOM, giá cạnh tranh hơn..."
                  rows={3}
                  className="w-full px-3 py-1.5 border rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-100 text-slate-600 rounded-lg font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-sky-600 text-white rounded-lg font-medium shadow-sm hover:bg-sky-700"
                >
                  {editingItem ? 'Cập nhật' : 'Lưu sản phẩm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}