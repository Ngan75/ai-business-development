import { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';

interface CrmItem {
  id: string;
  code: string;           // Mã KH
  name: string;           // Tên doanh nghiệp
  industry: string;       // Lĩnh vực
  location: string;       // Khu vực
  contactPerson: string;  // Người đại diện
  dealValue: number;      // Giá trị thương vụ ($)
  stage: string;          // Giai đoạn
  rating: 'Thành công' | 'Tiềm năng cao' | 'Đang xử lý' | 'Tiềm năng'; // Đánh giá
}

const initialCrmData: CrmItem[] = [
  {
    id: '1',
    code: 'CUST-001',
    name: 'Công ty TNHH Toa Musen Việt Nam',
    industry: 'Thiết bị Y tế',
    location: 'Long Thành, Đồng Nai',
    contactPerson: 'Mr.Trung',
    dealValue: 30000,
    stage: 'Sản xuất mẫu',
    rating: 'Thành công',
  },
  {
    id: '2',
    code: 'CUST-002',
    name: 'Công ty TNHH Điện Tử DLG Ansen',
    industry: 'Lắp ráp, Gia Công Tivi',
    location: 'KCN Cao TP.HCM',
    contactPerson: 'Mr.Sìn',
    dealValue: 80000,
    stage: 'Báo giá, chờ Audit',
    rating: 'Tiềm năng cao',
  },
  {
    id: '3',
    code: 'CUST-003',
    name: 'Công ty TNHH Điện Tử Regza Việt Nam',
    industry: 'Sản xuất Tivi',
    location: 'KCN Long Thành, Đồng Nai',
    contactPerson: 'Mr.Leo',
    dealValue: 500000,
    stage: 'Gửi báo giá BOM',
    rating: 'Đang xử lý',
  },
  {
    id: '4',
    code: 'CUST-004',
    name: 'Công ty TNHH Điện Gia Dụng Midea Việt Nam',
    industry: 'Sản xuất Điện tử Tiêu dùng',
    location: 'KCN VSIP, TPHCM',
    contactPerson: 'Trần Thị Tuyết',
    dealValue: 50000,
    stage: 'Thăm quan',
    rating: 'Tiềm năng',
  },
  {
    id: '5',
    code: 'CUST-005',
    name: 'Công Ty TNHH Estec Việt Nam',
    industry: 'Sản xuất Loa',
    location: 'KCN VSIP, TPHCM',
    contactPerson: 'Mr.Phi',
    dealValue: 100000,
    stage: 'Thăm quan',
    rating: 'Tiềm năng',
  },
];

export default function CrmPage() {
  // 1. Tự động đọc dữ liệu từ LocalStorage để không bị mất khi bật lại ứng dụng
  const [crmList, setCrmList] = useState<CrmItem[]>(() => {
    const saved = localStorage.getItem('ai_business_crm_data');
    return saved ? JSON.parse(saved) : initialCrmData;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    industry: '',
    location: '',
    contactPerson: '',
    dealValue: '',
    stage: '',
    rating: 'Tiềm năng' as CrmItem['rating'],
  });

  // Tự động lưu dữ liệu vào LocalStorage mỗi khi có bất kỳ thay đổi nào
  useEffect(() => {
    localStorage.setItem('ai_business_crm_data', JSON.stringify(crmList));
  }, [crmList]);

  // --- TÍNH TOÁN THỐNG KÊ TỰ ĐỘNG ---
  const totalPipeline = crmList.reduce((sum, item) => sum + (item.dealValue || 0), 0);
  const successContract = crmList
    .filter((item) => item.rating === 'Thành công')
    .reduce((sum, item) => sum + (item.dealValue || 0), 0);
  const activeCount = crmList.length;

  // Format hiển thị tiền $
  const formatCurrency = (val: number | undefined | null) => {
    const num = typeof val === 'number' && !isNaN(val) ? val : Number(val) || 0;
    return '$' + num.toLocaleString('en-US');
  };

  // Làm sạch tiền tệ từ Excel (Xóa dấu phẩy, dấu $)
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

        const importedData: CrmItem[] = data
          .filter((row) => row['Mã KH'] || row['Tên doanh nghiệp']) // Bỏ qua hàng Tổng Cộng
          .map((row, idx) => {
            // Đọc linh hoạt tên cột: "Giá trị thương mại" hoặc "Giá trị thương vụ"
            const rawValue = row['Giá trị thương mại'] ?? row['Giá trị thương vụ'] ?? row['DealValue'] ?? 0;

            return {
              id: Date.now().toString() + '_' + idx,
              code: String(row['Mã KH'] || row['Code'] || `CUST-${String(idx + 1).padStart(3, '0')}`),
              name: String(row['Tên doanh nghiệp'] || row['Name'] || 'Chưa có tên'),
              industry: String(row['Lĩnh vực'] || row['Industry'] || '-'),
              location: String(row['Khu vực'] || row['Location'] || '-'),
              contactPerson: String(row['Người đại diện'] || row['Contact'] || '-'),
              dealValue: parseExcelAmount(rawValue),
              stage: String(row['Giai đoạn'] || row['Stage'] || 'Tư vấn ban đầu'),
              rating: (['Thành công', 'Tiềm năng cao', 'Đang xử lý', 'Tiềm năng'].includes(row['Đánh giá'])
                ? row['Đánh giá']
                : 'Tiềm năng') as any,
            };
          });

        setCrmList(importedData);
        alert(`Đã nạp thành công ${importedData.length} cơ hội CRM từ file Excel!`);
      } catch (error) {
        console.error(error);
        alert('Lỗi khi nạp file Excel!');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  // --- 2. XUẤT FILE EXCEL ĐÃ CẬP NHẬT (LỰA CHỌN VỊ TRÍ LƯU FILE) ---
  const handleExportExcel = async () => {
    if (crmList.length === 0) {
      alert('Danh sách CRM hiện đang trống!');
      return;
    }

    const exportData = crmList.map((c) => ({
      'Mã KH': c.code,
      'Tên doanh nghiệp': c.name,
      'Người đại diện': c.contactPerson,
      'Lĩnh vực': c.industry,
      'Khu vực': c.location,
      'Giá trị thương mại': c.dealValue,
      'Giai đoạn': c.stage,
      'Đánh giá': c.rating,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'CRM_Data');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    // Sử dụng File System Access API cho phép chọn đường dẫn file lưu
    if ('showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: `Danh_Sach_CRM_${new Date().toISOString().slice(0, 10)}.xlsx`,
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
        alert('Đã lưu file CRM cập nhật thành công!');
      } catch (err: any) {
        if (err.name !== 'AbortError') console.error(err);
      }
    } else {
      XLSX.writeFile(workbook, `Danh_Sach_CRM_${new Date().toISOString().slice(0, 10)}.xlsx`);
    }
  };

  // --- 3. THÊM KHÁCH HÀNG THỦ CÔNG ---
  const handleOpenModal = () => {
    const nextNum = crmList.length + 1;
    setFormData({
      code: `CUST-${String(nextNum).padStart(3, '0')}`,
      name: '',
      industry: '',
      location: '',
      contactPerson: '',
      dealValue: '',
      stage: 'Tư vấn ban đầu',
      rating: 'Tiềm năng',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Vui lòng nhập Tên doanh nghiệp!');
      return;
    }

    const newItem: CrmItem = {
      id: Date.now().toString(),
      code: formData.code || `CUST-${Date.now().toString().slice(-3)}`,
      name: formData.name,
      industry: formData.industry || '-',
      location: formData.location || '-',
      contactPerson: formData.contactPerson || '-',
      dealValue: parseFloat(formData.dealValue) || 0,
      stage: formData.stage || 'Tư vấn ban đầu',
      rating: formData.rating,
    };

    setCrmList((prev) => [...prev, newItem]);
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc muốn xóa khách hàng CRM này?')) {
      setCrmList((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const renderRatingBadge = (rating: CrmItem['rating']) => {
    switch (rating) {
      case 'Thành công':
        return <span className="bg-emerald-100 text-emerald-700 text-[11px] px-2.5 py-0.5 rounded-full font-medium">Thành công</span>;
      case 'Tiềm năng cao':
        return <span className="bg-amber-100 text-amber-800 text-[11px] px-2.5 py-0.5 rounded-full font-bold">Tiềm năng cao</span>;
      case 'Đang xử lý':
        return <span className="bg-sky-100 text-sky-700 text-[11px] px-2.5 py-0.5 rounded-full font-medium">Đang xử lý</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 text-[11px] px-2.5 py-0.5 rounded-full font-medium">Tiềm năng</span>;
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
          <h1 className="text-xl font-bold text-slate-800">CRM - Quản lý Khách hàng & Cơ hội Bán hàng</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi tiến độ hợp đồng, giá trị thương vụ và thông tin liên hệ khách hàng.
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
            <span>+ Thêm Khách hàng Mới</span>
          </button>
        </div>
      </div>

      {/* Cards Thống Kê */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">TỔNG GIÁ TRỊ CƠ HỘI (PIPELINE)</div>
          <div className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(totalPipeline)}</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">HỢP ĐỒNG THÀNH CÔNG</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(successContract)}</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="text-[10px] font-semibold text-sky-600 uppercase tracking-wider">KHÁCH HÀNG ĐANG CHĂM SÓC</div>
          <div className="text-2xl font-bold text-sky-600 mt-1">
            {activeCount} <span className="text-sm font-normal text-sky-600">Doanh nghiệp</span>
          </div>
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
                <th className="px-4 py-3">Lĩnh vực</th>
                <th className="px-4 py-3">Khu vực</th>
                <th className="px-4 py-3 text-center">Người đại diện</th>
                <th className="px-4 py-3 text-right">Giá trị thương vụ</th>
                <th className="px-4 py-3 text-center">Giai đoạn</th>
                <th className="px-4 py-3 text-center">Đánh giá</th>
                <th className="px-4 py-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {crmList.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-4 py-3 font-bold text-slate-800 align-middle">{item.code}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800 align-middle">{item.name}</td>
                  <td className="px-4 py-3 text-slate-600 align-middle">{item.industry}</td>
                  <td className="px-4 py-3 text-slate-600 align-middle">{item.location}</td>
                  <td className="px-4 py-3 text-center text-slate-700 align-middle font-medium">{item.contactPerson}</td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-600 align-middle">
                    {formatCurrency(item.dealValue)}
                  </td>
                  <td className="px-4 py-3 text-center text-slate-600 align-middle">{item.stage}</td>
                  <td className="px-4 py-3 text-center align-middle">{renderRatingBadge(item.rating)}</td>
                  <td className="px-4 py-3 text-center align-middle">
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded hover:bg-red-50 transition"
                      title="Xóa khách hàng"
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

      {/* Popup Modal Thêm Khách Hàng */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="px-5 py-3.5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm">Thêm Khách hàng & Cơ hội CRM Mới</h3>
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
                    placeholder="Ví dụ: Công ty TNHH ABB"
                    className="w-full px-3 py-1.5 border rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lĩnh vực</label>
                  <input
                    type="text"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    placeholder="Ví dụ: Loa Tivi..."
                    className="w-full px-3 py-1.5 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Khu vực</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Ví dụ: KCN Trời Xanh"
                    className="w-full px-3 py-1.5 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Người đại diện</label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="Ví dụ: Mr.God"
                    className="w-full px-3 py-1.5 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Giá trị thương vụ ($)</label>
                  <input
                    type="number"
                    value={formData.dealValue}
                    onChange={(e) => setFormData({ ...formData, dealValue: e.target.value })}
                    placeholder="100000"
                    className="w-full px-3 py-1.5 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Giai đoạn</label>
                  <input
                    type="text"
                    value={formData.stage}
                    onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                    placeholder="Tư vấn ban đầu"
                    className="w-full px-3 py-1.5 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Đánh giá</label>
                  <select
                    value={formData.rating}
                    onChange={(e: any) => setFormData({ ...formData, rating: e.target.value })}
                    className="w-full px-3 py-1.5 border rounded-lg bg-white"
                  >
                    <option value="Tiềm năng">Tiềm năng</option>
                    <option value="Đang xử lý">Đang xử lý</option>
                    <option value="Tiềm năng cao">Tiềm năng cao</option>
                    <option value="Thành công">Thành công</option>
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
                  Lưu Khách hàng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}