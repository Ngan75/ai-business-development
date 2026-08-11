import { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';

interface CustomerItem {
  id: string;
  code: string;         // Mã KH
  name: string;         // Tên doanh nghiệp
  industry: string;     // Lĩnh vực hoạt động
  location: string;     // Khu vực
  bomProject: string;   // Số dự án BOM
  totalValue: number;   // Tổng giá trị
  status: 'Hoạt động' | 'Mới' | 'VIP'; // Trạng thái
}

const initialCustomers: CustomerItem[] = [
  {
    id: '1',
    code: 'CUST-001',
    name: 'Công ty TNHH Toa Musen Việt Nam',
    industry: 'Thiết bị Y tế',
    location: 'Long Thành, Đồng Nai',
    bomProject: 'H-PCBA-02',
    totalValue: 30000,
    status: 'Hoạt động',
  },
  {
    id: '2',
    code: 'CUST-002',
    name: 'Công ty TNHH Điện Tử DLG Ansen',
    industry: 'Lắp ráp, Gia Công Tivi',
    location: 'KCN Cao TP.HCM',
    bomProject: 'PCBA-01',
    totalValue: 120000,
    status: 'Mới',
  },
  {
    id: '3',
    code: 'CUST-003',
    name: 'Công Ty TNHH Điện Tử SamSung HCMC CE Complex',
    industry: 'Sản xuất Thiết bị Gia dụng',
    location: 'KCN Cao TP.HCM',
    bomProject: 'H-PCBA-01',
    totalValue: 1500000,
    status: 'VIP',
  },
  {
    id: '4',
    code: 'CUST-004',
    name: 'Công ty TNHH MTV Điện tử Daeyoung Vina',
    industry: 'Sản xuất Linh kiện Điện tử',
    location: 'KCN Amata',
    bomProject: 'H-PCBA-03',
    totalValue: 450000,
    status: 'Hoạt động',
  },
];

export default function CustomerPage() {
  // Lấy dữ liệu từ localStorage để không bị mất khi tắt máy
  const [customers, setCustomers] = useState<CustomerItem[]>(() => {
    const saved = localStorage.getItem('ai_business_customers');
    return saved ? JSON.parse(saved) : initialCustomers;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    industry: '',
    location: '',
    bomProject: '',
    totalValue: '',
    status: 'Mới' as 'Hoạt động' | 'Mới' | 'VIP',
  });

  // Tự động lưu vào localStorage mỗi khi danh sách có sự thay đổi
  useEffect(() => {
    localStorage.setItem('ai_business_customers', JSON.stringify(customers));
  }, [customers]);

  // Hàm làm sạch chuỗi tiền tệ từ Excel (Ví dụ: "30,000.0" -> 30000)
  const parseExcelAmount = (val: any): number => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    
    // Chuyển về chuỗi, loại bỏ tất cả dấu phẩy, khoảng trắng và ký tự $
    const cleanStr = String(val).replace(/,/g, '').replace(/\$/g, '').trim();
    const parsed = parseFloat(cleanStr);
    return isNaN(parsed) ? 0 : parsed;
  };

  // 1. XỬ LÝ NẠP FILE EXCEL (DUY NHẤT 1 HÀM)
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

        // Đọc từng hàng từ Excel và làm sạch giá trị tiền
        const importedCustomers: CustomerItem[] = data
          .filter((row) => row['Mã KH'] || row['Tên doanh nghiệp']) // Bỏ qua hàng Tổng cộng trống ở cuối file Excel
          .map((row, idx) => {
            const rawValue = row['Tổng giá trị'] ?? row['Value'] ?? row['totalValue'] ?? 0;

            return {
              id: Date.now().toString() + '_' + idx,
              code: String(row['Mã KH'] || row['Code'] || `CUST-${String(idx + 1).padStart(3, '0')}`),
              name: String(row['Tên doanh nghiệp'] || row['Name'] || 'Chưa có tên'),
              industry: String(row['Lĩnh vực hoạt động'] || row['Industry'] || '-'),
              location: String(row['Khu vực'] || row['Location'] || '-'),
              bomProject: String(row['Số dự án BOM'] || row['BOM'] || '-'),
              totalValue: parseExcelAmount(rawValue), // 👈 Đã áp dụng hàm xử lý tiền chuẩn
              status: (['Hoạt động', 'Mới', 'VIP'].includes(row['Trạng thái']) ? row['Trạng thái'] : 'Mới') as any,
            };
          });

        setCustomers(importedCustomers);
        alert(`Đã nạp thành công ${importedCustomers.length} khách hàng!`);
      } catch (error) {
        console.error(error);
        alert('Lỗi khi đọc file Excel. Vui lòng kiểm tra lại file!');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };
  
  // Xuất file Excel và chọn vị trí lưu chỉ định trên máy tính
  const handleExportExcel = async () => {
    if (customers.length === 0) {
      alert('Danh sách khách hàng hiện đang trống!');
      return;
    }

    const exportData = customers.map((c) => ({
      'Mã KH': c.code,
      'Tên doanh nghiệp': c.name,
      'Lĩnh vực hoạt động': c.industry,
      'Khu vực': c.location,
      'Số dự án BOM': c.bomProject,
      'Tổng giá trị': c.totalValue,
      'Trạng thái': c.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'KhachHang');

   // Tạo dữ liệu dạng ArrayBuffer
   const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
   const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

   // Kiểm tra nếu trình duyệt hỗ trợ File System Access API (Chrome, Edge, Brave...)
   if ('showSaveFilePicker' in window) {
     try {
       const handle = await (window as any).showSaveFilePicker({
         suggestedName: `Danh_Sach_Khach_Hang_${new Date().toISOString().slice(0, 10)}.xlsx`,
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
       alert('Đã lưu file thành công vào thư mục bạn chọn!');
     } catch (err: any) {
       // Người dùng bấm Hủy (Cancel) hoặc không chọn vị trí
       if (err.name !== 'AbortError') {
         console.error(err);
       }
     }
   } else {
     // Tải về mặc định nếu trình duyệt không hỗ trợ API
     XLSX.writeFile(workbook, `Danh_Sach_Khach_Hang_${new Date().toISOString().slice(0, 10)}.xlsx`);
   }
 }; 

  // 3. THÊM HỒ SƠ THỦ CÔNG
  const handleOpenModal = () => {
    const nextNum = customers.length + 1;
    setFormData({
      code: `CUST-${String(nextNum).padStart(3, '0')}`,
      name: '',
      industry: '',
      location: '',
      bomProject: '',
      totalValue: '',
      status: 'Mới',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên doanh nghiệp!');
      return;
    }

    const newCustomer: CustomerItem = {
      id: Date.now().toString(),
      code: formData.code || `CUST-${Date.now().toString().slice(-3)}`,
      name: formData.name,
      industry: formData.industry || '-',
      location: formData.location || '-',
      bomProject: formData.bomProject || '-',
      totalValue: parseFloat(formData.totalValue) || 0,
      status: formData.status,
    };

    setCustomers((prev) => [...prev, newCustomer]);
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa hồ sơ này?')) {
      setCustomers((prev) => prev.filter((item) => item.id !== id));
    }
  };

  // Tính Tổng giá trị dynamic
  const totalGrandValue = customers.reduce((sum, c) => sum + (c.totalValue || 0), 0);

  // Hàm Format tiền tệ an toàn tuyệt đối
  const formatCurrency = (val: number | undefined | null) => {
    const num = typeof val === 'number' && !isNaN(val) ? val : Number(val) || 0;
    return '$' + num.toLocaleString('en-US');
  };

  return (
    <div className="space-y-4 select-none">
      {/* Input File Ẩn */}
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
          <h1 className="text-xl font-bold text-slate-800">Customer - Danh sách Khách hàng Doanh nghiệp</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý cơ sở dữ liệu đối tác, hồ sơ doanh nghiệp và lịch sử đặt hàng phần cứng.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs rounded-lg font-medium transition shadow-sm flex items-center gap-1.5"
          >
            <span>📊 Nạp File Excel</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="bg-slate-700 hover:bg-slate-800 text-white px-3 py-1.5 text-xs rounded-lg font-medium transition shadow-sm flex items-center gap-1.5"
          >
            <span>📥 Xuất File Excel</span>
          </button>

          <button
            onClick={handleOpenModal}
            className="bg-sky-600 hover:bg-sky-700 text-white px-3.5 py-1.5 text-xs rounded-lg font-medium transition shadow-sm flex items-center gap-1.5"
          >
            <span>+ Thêm Hồ sơ Khách hàng</span>
          </button>
        </div>
      </div>

      {/* Bảng Danh Sách */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 border-collapse">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Mã KH</th>
                <th className="px-4 py-3">Tên doanh nghiệp</th>
                <th className="px-4 py-3">Lĩnh vực hoạt động</th>
                <th className="px-4 py-3">Khu vực</th>
                <th className="px-4 py-3 text-center">Số dự án BOM</th>
                <th className="px-4 py-3 text-right">Tổng giá trị</th>
                <th className="px-4 py-3 text-center">Trạng thái</th>
                <th className="px-4 py-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-slate-400">
                    Chưa có dữ liệu. Vui lòng nạp File Excel hoặc Thêm Hồ sơ Khách hàng.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 font-bold text-slate-800 align-middle">{c.code}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800 align-middle">{c.name}</td>
                    <td className="px-4 py-3 text-slate-600 align-middle">{c.industry}</td>
                    <td className="px-4 py-3 text-slate-600 align-middle">{c.location}</td>
                    <td className="px-4 py-3 text-center text-slate-600 align-middle">{c.bomProject}</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-600 align-middle">
                      {formatCurrency(c.totalValue)}
                    </td>
                    <td className="px-4 py-3 text-center align-middle">
                      <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${
                        c.status === 'Hoạt động' ? 'bg-emerald-100 text-emerald-700' :
                        c.status === 'VIP' ? 'bg-amber-100 text-amber-700 font-bold' :
                        'bg-sky-100 text-sky-700'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center align-middle">
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded hover:bg-red-50 transition"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="bg-slate-50 border-t border-slate-200 font-bold text-slate-800">
              <tr>
                <td colSpan={5} className="px-4 py-3 text-right text-xs uppercase tracking-wider">
                  TỔNG CỘNG:
                </td>
                <td className="px-4 py-3 text-right text-sm text-emerald-700 font-extrabold">
                  {formatCurrency(totalGrandValue)}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Modal Thêm Khách Hàng */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="px-5 py-3.5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm">Thêm Hồ sơ Khách hàng Mới</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mã KH *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-1.5 border rounded-lg font-bold text-slate-700"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Tên Doanh nghiệp *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-1.5 border rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lĩnh vực hoạt động</label>
                  <input
                    type="text"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full px-3 py-1.5 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Khu vực</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-1.5 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Dự án BOM</label>
                  <input
                    type="text"
                    value={formData.bomProject}
                    onChange={(e) => setFormData({ ...formData, bomProject: e.target.value })}
                    className="w-full px-3 py-1.5 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tổng giá trị ($)</label>
                  <input
                    type="number"
                    value={formData.totalValue}
                    onChange={(e) => setFormData({ ...formData, totalValue: e.target.value })}
                    className="w-full px-3 py-1.5 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Trạng thái</label>
                  <select
                    value={formData.status}
                    onChange={(e: any) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-1.5 border rounded-lg bg-white"
                  >
                    <option value="Mới">Mới</option>
                    <option value="Hoạt động">Hoạt động</option>
                    <option value="VIP">VIP</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-100 rounded-lg font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-sky-600 text-white rounded-lg font-medium"
                >
                  Lưu Hồ sơ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}