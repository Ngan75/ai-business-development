import { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';

interface SupplierItem {
  id: string;
  code: string;            // Mã NCC
  name: string;            // Tên nhà cung cấp
  country: string;         // Quốc gia
  mainCategory: string;    // Lĩnh vực chính
  leadTime: string;        // Thời gian giao (vd: "3 - 5 ngày")
  rating: string;          // Đánh giá (vd: "4.9/5")
  apiStatus: 'Kết nối API' | 'Thủ công'; // Trạng thái API
}

const initialSuppliers: SupplierItem[] = [
  {
    id: '1',
    code: 'SUP-001',
    name: 'Digi-Key Electronics',
    country: 'Mỹ',
    mainCategory: 'Chủ động / Đa dạng',
    leadTime: '3 - 5 ngày',
    rating: '4.9/5',
    apiStatus: 'Kết nối API',
  },
  {
    id: '2',
    code: 'SUP-002',
    name: 'Mouser Electronics',
    country: 'Mỹ',
    mainCategory: 'Linh kiện bán dẫn',
    leadTime: '3 - 5 ngày',
    rating: '4.8/5',
    apiStatus: 'Kết nối API',
  },
  {
    id: '3',
    code: 'SUP-003',
    name: 'Arrow Electronics',
    country: 'Singapore',
    mainCategory: 'Số lượng lớn (Bulk)',
    leadTime: '7 - 10 ngày',
    rating: '4.6/5',
    apiStatus: 'Kết nối API',
  },
  {
    id: '4',
    code: 'SUP-004',
    name: 'LCSC Electronics',
    country: 'Trung Quốc',
    mainCategory: 'Linh kiện giá rẻ / SMD',
    leadTime: '5 - 7 ngày',
    rating: '4.5/5',
    apiStatus: 'Thủ công',
  },
];

export default function SupplierPage() {
  // Lấy dữ liệu từ LocalStorage
  const [suppliers, setSuppliers] = useState<SupplierItem[]>(() => {
    const saved = localStorage.getItem('ai_business_supplier_data');
    return saved ? JSON.parse(saved) : initialSuppliers;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    country: '',
    mainCategory: '',
    leadTime: '3 - 5 ngày',
    rating: '4.5/5',
    apiStatus: 'Kết nối API' as SupplierItem['apiStatus'],
  });

  // Tự động lưu LocalStorage mỗi khi danh sách thay đổi
  useEffect(() => {
    localStorage.setItem('ai_business_supplier_data', JSON.stringify(suppliers));
  }, [suppliers]);

  // --- TÍNH THỐNG KÊ TỰ ĐỘNG ---
  const totalCount = suppliers.length;
  const apiOnlineCount = suppliers.filter((s) => s.apiStatus === 'Kết nối API').length;

  // Tính thời gian giao trung bình
  const avgLeadTime = (() => {
    if (suppliers.length === 0) return 0;
    let totalDays = 0;
    let validCount = 0;

    suppliers.forEach((s) => {
      // Tìm các con số trong chuỗi "3 - 5 ngày" -> lấy trung bình (3+5)/2 = 4
      const matches = s.leadTime.match(/\d+/g);
      if (matches && matches.length > 0) {
        const nums = matches.map(Number);
        const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
        totalDays += avg;
        validCount++;
      }
    });

    return validCount > 0 ? (totalDays / validCount).toFixed(1) : 0;
  })();

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

        const importedData: SupplierItem[] = data
          .filter((row) => row['Mã NCC'] || row['Tên nhà cung cấp'])
          .map((row, idx) => ({
            id: Date.now().toString() + '_' + idx,
            code: String(row['Mã NCC'] || row['Code'] || `SUP-${String(idx + 1).padStart(3, '0')}`),
            name: String(row['Tên nhà cung cấp'] || row['Name'] || 'Chưa có tên'),
            country: String(row['Quốc gia'] || row['Country'] || '-'),
            mainCategory: String(row['Lĩnh vực chính'] || row['Category'] || '-'),
            leadTime: String(row['Thời gian giao'] || row['LeadTime'] || '3 - 5 ngày'),
            rating: String(row['Đánh giá'] || row['Rating'] || '4.5/5'),
            apiStatus: row['Trạng thái API'] === 'Kết nối API' ? 'Kết nối API' : 'Thủ công',
          }));

        setSuppliers(importedData);
        alert(`Đã nạp thành công ${importedData.length} Nhà cung cấp!`);
      } catch (error) {
        console.error(error);
        alert('Lỗi khi nạp file Excel!');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  // --- 2. XUẤT FILE EXCEL (CÓ CHỌN VỊ TRÍ LƯU FILE) ---
  const handleExportExcel = async () => {
    if (suppliers.length === 0) {
      alert('Danh sách Nhà cung cấp hiện đang trống!');
      return;
    }

    const exportData = suppliers.map((c) => ({
      'Mã NCC': c.code,
      'Tên nhà cung cấp': c.name,
      'Quốc gia': c.country,
      'Lĩnh vực chính': c.mainCategory,
      'Thời gian giao': c.leadTime,
      'Đánh giá': c.rating,
      'Trạng thái API': c.apiStatus,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Suppliers');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    if ('showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: `Danh_Sach_Nha_Cung_Cap_${new Date().toISOString().slice(0, 10)}.xlsx`,
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
        alert('Đã lưu file Nhà cung cấp thành công!');
      } catch (err: any) {
        if (err.name !== 'AbortError') console.error(err);
      }
    } else {
      XLSX.writeFile(workbook, `Danh_Sach_Nha_Cung_Cap_${new Date().toISOString().slice(0, 10)}.xlsx`);
    }
  };

  // --- 3. THÊM NHÀ CUNG CẤP MỚI ---
  const handleOpenModal = () => {
    const nextNum = suppliers.length + 1;
    setFormData({
      code: `SUP-${String(nextNum).padStart(3, '0')}`,
      name: '',
      country: '',
      mainCategory: '',
      leadTime: '3 - 5 ngày',
      rating: '4.5/5',
      apiStatus: 'Kết nối API',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Vui lòng nhập Tên nhà cung cấp!');
      return;
    }

    const newItem: SupplierItem = {
      id: Date.now().toString(),
      code: formData.code || `SUP-${Date.now().toString().slice(-3)}`,
      name: formData.name,
      country: formData.country || '-',
      mainCategory: formData.mainCategory || '-',
      leadTime: formData.leadTime || '3 - 5 ngày',
      rating: formData.rating || '4.5/5',
      apiStatus: formData.apiStatus,
    };

    setSuppliers((prev) => [...prev, newItem]);
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc muốn xóa Nhà cung cấp này?')) {
      setSuppliers((prev) => prev.filter((item) => item.id !== id));
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
          <h1 className="text-xl font-bold text-slate-800">Supplier - Quản lý Nhà cung cấp</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Danh mục nhà cung cấp linh kiện điện tử, tích hợp API tra cứu tồn kho thực tế.
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
            onClick={handleOpenModal}
            className="bg-sky-600 hover:bg-sky-700 text-white px-3.5 py-1.5 text-xs rounded-lg font-medium transition shadow-sm flex items-center gap-1.5"
          >
            <span>+ Thêm Nhà cung cấp</span>
          </button>
        </div>
      </div>

      {/* Dynamic Cards Thống Kê */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">ĐỐI TÁC CHIẾN LƯỢC</div>
          <div className="text-2xl font-bold text-slate-800 mt-1">
            {totalCount} <span className="text-sm font-normal text-slate-600">Nhà cung cấp</span>
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">TÍCH HỢP API TRỰC TIẾP</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {apiOnlineCount} <span className="text-sm font-semibold text-emerald-600">API Online</span>
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="text-[10px] font-semibold text-sky-600 uppercase tracking-wider">THỜI GIAN GIAO TRUNG BÌNH</div>
          <div className="text-2xl font-bold text-sky-600 mt-1">
            {avgLeadTime} <span className="text-sm font-semibold text-sky-600">Ngày</span>
          </div>
        </div>
      </div>

      {/* Bảng Danh Sách Supplier */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 border-collapse">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Mã NCC</th>
                <th className="px-4 py-3">Tên nhà cung cấp</th>
                <th className="px-4 py-3">Quốc gia</th>
                <th className="px-4 py-3">Lĩnh vực chính</th>
                <th className="px-4 py-3 text-center">Thời gian giao</th>
                <th className="px-4 py-3 text-center">Đánh giá</th>
                <th className="px-4 py-3 text-center">Trạng thái API</th>
                <th className="px-4 py-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {suppliers.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-4 py-3 font-bold text-slate-800 align-middle">{item.code}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800 align-middle">{item.name}</td>
                  <td className="px-4 py-3 text-slate-600 align-middle">{item.country}</td>
                  <td className="px-4 py-3 text-slate-600 align-middle">{item.mainCategory}</td>
                  <td className="px-4 py-3 text-center text-slate-600 align-middle">{item.leadTime}</td>
                  <td className="px-4 py-3 text-center align-middle font-bold text-amber-500">
                    ⭐ {item.rating}
                  </td>
                  <td className="px-4 py-3 text-center align-middle">
                    <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${
                      item.apiStatus === 'Kết nối API' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {item.apiStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center align-middle">
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded hover:bg-red-50 transition"
                      title="Xóa nhà cung cấp"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Thêm Nhà Cung Cấp Mới */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="px-5 py-3.5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm">Thêm Nhà Cung Cấp Mới</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mã NCC *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-1.5 border rounded-lg font-bold text-slate-700"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Tên Nhà cung cấp *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ví dụ: Future Electronics"
                    className="w-full px-3 py-1.5 border rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Quốc gia</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="Ví dụ: Nhật Bản, Mỹ, Đài Loan"
                    className="w-full px-3 py-1.5 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lĩnh vực chính</label>
                  <input
                    type="text"
                    value={formData.mainCategory}
                    onChange={(e) => setFormData({ ...formData, mainCategory: e.target.value })}
                    placeholder="Ví dụ: Chip vi điều khiển"
                    className="w-full px-3 py-1.5 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Thời gian giao</label>
                  <input
                    type="text"
                    value={formData.leadTime}
                    onChange={(e) => setFormData({ ...formData, leadTime: e.target.value })}
                    placeholder="3 - 5 ngày"
                    className="w-full px-3 py-1.5 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Đánh giá</label>
                  <input
                    type="text"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                    placeholder="4.8/5"
                    className="w-full px-3 py-1.5 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Trạng thái API</label>
                  <select
                    value={formData.apiStatus}
                    onChange={(e: any) => setFormData({ ...formData, apiStatus: e.target.value })}
                    className="w-full px-3 py-1.5 border rounded-lg bg-white"
                  >
                    <option value="Kết nối API">Kết nối API</option>
                    <option value="Thủ công">Thủ công</option>
                  </select>
                </div>
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
                  Lưu Nhà cung cấp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}