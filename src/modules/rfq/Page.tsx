import { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';

interface RfqItem {
  id: string;
  code: string;         // Mã RFQ
  project: string;      // Dự án
  supplier: string;     // Nhà cung cấp
  itemCount: string;    // Số linh kiện (vd: "14 mã", "1 BOM")
  totalValue: number;   // Tổng giá trị ($)
  sendDate: string;     // Ngày gửi
  status: 'Đã thành công' | 'NG (giá cao)' | 'Đang xử lý' | 'Đã báo giá' | 'Chuẩn bị báo giá'; // Trạng thái
}

const initialRfqData: RfqItem[] = [
  {
    id: '1',
    code: 'RFQ-2026-001',
    project: 'Medical Harness',
    supplier: 'Toa Musen',
    itemCount: '14 mã',
    totalValue: 15000,
    sendDate: '28 / Jan / 2026',
    status: 'Đã thành công',
  },
  {
    id: '2',
    code: 'RFQ-2026-002',
    project: 'Wire harnneses TV',
    supplier: 'Regza',
    itemCount: '4 mã',
    totalValue: 25000,
    sendDate: '03 / Mar / 2026',
    status: 'NG (giá cao)',
  },
  {
    id: '3',
    code: 'RFQ-2026-003',
    project: 'Safety-Earth Wire Harness',
    supplier: 'Toa Musen',
    itemCount: '2 mã',
    totalValue: 5000,
    sendDate: '07 / Apr / 2026',
    status: 'NG (giá cao)',
  },
  {
    id: '4',
    code: 'RFQ-2026-004',
    project: 'Control Chair PCBA',
    supplier: 'Toa Musen',
    itemCount: '1 BOM',
    totalValue: 66000,
    sendDate: '07 / Apr / 2026',
    status: 'Đang xử lý',
  },
  {
    id: '5',
    code: 'RFQ-2026-005',
    project: 'PCBA TV 24inch',
    supplier: 'DLG Ansen',
    itemCount: '1 BOM',
    totalValue: 20400,
    sendDate: '11 / May / 2026',
    status: 'Đã báo giá',
  },
  {
    id: '6',
    code: 'RFQ-2026-006',
    project: 'PCBA TV 40inch',
    supplier: 'DLG Ansen',
    itemCount: '1 BOM',
    totalValue: 73500,
    sendDate: '23 / Jul / 2026',
    status: 'Đã báo giá',
  },
  {
    id: '7',
    code: 'RFQ-2026-007',
    project: 'PCBA TV',
    supplier: 'Regza',
    itemCount: '3 BOM',
    totalValue: 150000,
    sendDate: '07 / Aug / 2026',
    status: 'Chuẩn bị báo giá',
  },
];

export default function RfqPage() {
  // Lấy dữ liệu từ LocalStorage để không bị mất khi tắt máy
  const [rfqList, setRfqList] = useState<RfqItem[]>(() => {
    const saved = localStorage.getItem('ai_business_rfq_data');
    return saved ? JSON.parse(saved) : initialRfqData;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tất cả trạng thái');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    project: '',
    supplier: '',
    itemCount: '1 BOM',
    totalValue: '',
    sendDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, ' / '),
    status: 'Đang xử lý' as RfqItem['status'],
  });

  // Tự động lưu dữ liệu vào LocalStorage mỗi khi danh sách thay đổi
  useEffect(() => {
    localStorage.setItem('ai_business_rfq_data', JSON.stringify(rfqList));
  }, [rfqList]);

  // Format tiền tệ ($15,000)
  const formatCurrency = (val: number | undefined | null) => {
    const num = typeof val === 'number' && !isNaN(val) ? val : Number(val) || 0;
    return '$' + num.toLocaleString('en-US');
  };

  // Hàm xử lý chuỗi tiền từ Excel (Xóa dấu phẩy, ký tự $)
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

        const importedData: RfqItem[] = data
          .filter((row) => row['Mã RFQ'] || row['Dự án']) // Bỏ hàng Tổng cộng
          .map((row, idx) => ({
            id: Date.now().toString() + '_' + idx,
            code: String(row['Mã RFQ'] || row['Code'] || `RFQ-2026-${String(idx + 1).padStart(3, '0')}`),
            project: String(row['Dự án'] || row['Project'] || '-'),
            supplier: String(row['Nhà cung cấp'] || row['Supplier'] || '-'),
            itemCount: String(row['Số linh kiện'] || row['Items'] || '1 BOM'),
            totalValue: parseExcelAmount(row['Tổng giá trị'] ?? row['Value'] ?? 0),
            sendDate: String(row['Ngày gửi'] || row['Date'] || '-'),
            status: (['Đã thành công', 'NG (giá cao)', 'Đang xử lý', 'Đã báo giá', 'Chuẩn bị báo giá'].includes(row['Trạng thái'])
              ? row['Trạng thái']
              : 'Đang xử lý') as any,
          }));

        setRfqList(importedData);
        alert(`Đã nạp thành công ${importedData.length} yêu cầu RFQ!`);
      } catch (error) {
        console.error(error);
        alert('Lỗi khi nạp file Excel!');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  // --- 2. XUẤT FILE EXCEL ĐÃ CẬP NHẬT ---
  const handleExportExcel = async () => {
    if (rfqList.length === 0) {
      alert('Danh sách RFQ hiện đang trống!');
      return;
    }

    const exportData = rfqList.map((c) => ({
      'Mã RFQ': c.code,
      'Dự án': c.project,
      'Nhà cung cấp': c.supplier,
      'Số linh kiện': c.itemCount,
      'Tổng giá trị': c.totalValue,
      'Ngày gửi': c.sendDate,
      'Trạng thái': c.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'RFQ_Data');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    if ('showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: `Danh_Sach_RFQ_${new Date().toISOString().slice(0, 10)}.xlsx`,
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
        alert('Đã lưu file RFQ thành công!');
      } catch (err: any) {
        if (err.name !== 'AbortError') console.error(err);
      }
    } else {
      XLSX.writeFile(workbook, `Danh_Sach_RFQ_${new Date().toISOString().slice(0, 10)}.xlsx`);
    }
  };

  // --- 3. THÊM RFQ MỚI ---
  const handleOpenModal = () => {
    const nextNum = rfqList.length + 1;
    setFormData({
      code: `RFQ-2026-${String(nextNum).padStart(3, '0')}`,
      project: '',
      supplier: '',
      itemCount: '1 BOM',
      totalValue: '',
      sendDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, ' / '),
      status: 'Đang xử lý',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.project.trim()) {
      alert('Vui lòng nhập Tên dự án!');
      return;
    }

    const newItem: RfqItem = {
      id: Date.now().toString(),
      code: formData.code || `RFQ-2026-${Date.now().toString().slice(-3)}`,
      project: formData.project,
      supplier: formData.supplier || '-',
      itemCount: formData.itemCount || '1 BOM',
      totalValue: parseFloat(formData.totalValue) || 0,
      sendDate: formData.sendDate,
      status: formData.status,
    };

    setRfqList((prev) => [...prev, newItem]);
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc muốn xóa yêu cầu RFQ này?')) {
      setRfqList((prev) => prev.filter((item) => item.id !== id));
    }
  };

  // Lọc dữ liệu theo Tìm kiếm và Trạng thái
  const filteredRfqList = rfqList.filter((item) => {
    const matchesSearch =
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'Tất cả trạng thái' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Tính Tổng cộng giá trị dynamic
  const totalGrandValue = filteredRfqList.reduce((sum, item) => sum + (item.totalValue || 0), 0);

  // Badge trạng thái chuẩn theo giao diện ảnh
  const renderStatusBadge = (status: RfqItem['status']) => {
    switch (status) {
      case 'Đã thành công':
        return <span className="bg-emerald-100 text-emerald-700 text-[11px] px-2.5 py-0.5 rounded-full font-medium">Đã thành công</span>;
      case 'NG (giá cao)':
        return <span className="bg-rose-100 text-rose-700 text-[11px] px-2.5 py-0.5 rounded-full font-medium">NG (giá cao)</span>;
      case 'Đang xử lý':
        return <span className="bg-pink-100 text-pink-700 text-[11px] px-2.5 py-0.5 rounded-full font-medium">Đang xử lý</span>;
      case 'Đã báo giá':
        return <span className="bg-emerald-100 text-emerald-700 text-[11px] px-2.5 py-0.5 rounded-full font-medium">Đã báo giá</span>;
      case 'Chuẩn bị báo giá':
        return <span className="bg-amber-100 text-amber-800 text-[11px] px-2.5 py-0.5 rounded-full font-medium">Chuẩn bị báo giá</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 text-[11px] px-2.5 py-0.5 rounded-full font-medium">{status}</span>;
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
          <h1 className="text-xl font-bold text-slate-800">RFQ - Quản lý Yêu cầu Báo giá</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tạo, gửi và theo dõi phản hồi giá từ các nhà cung cấp linh kiện.
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
            <span>+ Tạo Yêu cầu RFQ mới</span>
          </button>
        </div>
      </div>

      {/* Thanh Tìm Kiếm & Lọc */}
      <div className="flex gap-3 items-center">
        <div className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 flex items-center shadow-sm">
          <span className="text-slate-400 mr-2">🔍</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo Mã RFQ, Tên dự án, Nhà cung cấp..."
            className="w-full text-xs outline-none bg-transparent text-slate-700"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 shadow-sm outline-none"
        >
          <option value="Tất cả trạng thái">Tất cả trạng thái</option>
          <option value="Đã thành công">Đã thành công</option>
          <option value="NG (giá cao)">NG (giá cao)</option>
          <option value="Đang xử lý">Đang xử lý</option>
          <option value="Đã báo giá">Đã báo giá</option>
          <option value="Chuẩn bị báo giá">Chuẩn bị báo giá</option>
        </select>
      </div>

      {/* Bảng Danh Sách RFQ */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 border-collapse">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Mã RFQ</th>
                <th className="px-4 py-3">Dự án</th>
                <th className="px-4 py-3">Nhà cung cấp</th>
                <th className="px-4 py-3 text-center">Số linh kiện</th>
                <th className="px-4 py-3 text-right">Tổng giá trị</th>
                <th className="px-4 py-3 text-center">Ngày gửi</th>
                <th className="px-4 py-3 text-center">Trạng thái</th>
                <th className="px-4 py-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRfqList.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-4 py-3 font-bold text-sky-600 align-middle">{item.code}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800 align-middle">{item.project}</td>
                  <td className="px-4 py-3 text-slate-600 align-middle">{item.supplier}</td>
                  <td className="px-4 py-3 text-center text-slate-600 align-middle">{item.itemCount}</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-800 align-middle">
                    {formatCurrency(item.totalValue)}
                  </td>
                  <td className="px-4 py-3 text-center text-slate-600 align-middle">{item.sendDate}</td>
                  <td className="px-4 py-3 text-center align-middle">{renderStatusBadge(item.status)}</td>
                  <td className="px-4 py-3 text-center align-middle">
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded hover:bg-red-50 transition"
                      title="Xóa yêu cầu RFQ"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 border-t border-slate-200 font-bold text-slate-800">
              <tr>
                <td colSpan={4} className="px-4 py-3 text-right text-xs uppercase tracking-wider">
                  TỔNG CỘNG:
                </td>
                <td className="px-4 py-3 text-right text-sm text-emerald-600 font-extrabold">
                  {formatCurrency(totalGrandValue)}
                </td>
                <td colSpan={3}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Popup Modal Tạo RFQ Mới */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="px-5 py-3.5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 text-sm">Tạo Yêu cầu Báo giá (RFQ) Mới</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mã RFQ *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-1.5 border rounded-lg font-bold text-slate-700"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Dự án *</label>
                  <input
                    type="text"
                    value={formData.project}
                    onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                    placeholder="Ví dụ: PCBA TV 55inch"
                    className="w-full px-3 py-1.5 border rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nhà cung cấp</label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    placeholder="Ví dụ: Toa Musen, Regza..."
                    className="w-full px-3 py-1.5 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Số linh kiện</label>
                  <input
                    type="text"
                    value={formData.itemCount}
                    onChange={(e) => setFormData({ ...formData, itemCount: e.target.value })}
                    placeholder="Ví dụ: 1 BOM, 5 mã"
                    className="w-full px-3 py-1.5 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tổng giá trị ($)</label>
                  <input
                    type="number"
                    value={formData.totalValue}
                    onChange={(e) => setFormData({ ...formData, totalValue: e.target.value })}
                    placeholder="150000"
                    className="w-full px-3 py-1.5 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ngày gửi</label>
                  <input
                    type="text"
                    value={formData.sendDate}
                    onChange={(e) => setFormData({ ...formData, sendDate: e.target.value })}
                    className="w-full px-3 py-1.5 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Trạng thái</label>
                <select
                  value={formData.status}
                  onChange={(e: any) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-1.5 border rounded-lg bg-white"
                >
                  <option value="Đang xử lý">Đang xử lý</option>
                  <option value="Chuẩn bị báo giá">Chuẩn bị báo giá</option>
                  <option value="Đã báo giá">Đã báo giá</option>
                  <option value="Đã thành công">Đã thành công</option>
                  <option value="NG (giá cao)">NG (giá cao)</option>
                </select>
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
                  Lưu RFQ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}