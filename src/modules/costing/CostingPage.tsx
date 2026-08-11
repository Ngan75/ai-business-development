import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

interface CostItem {
  id: string;
  category: string;
  initialCost: number;
  optimizedCost: number;
  note: string;
}

const initialCostingData: CostItem[] = [
  {
    id: '1',
    category: 'Chi phí Linh kiện (BOM)',
    initialCost: 11.25,
    optimizedCost: 10.29,
    note: 'AI gợi ý thay thế 1 linh kiện MCU tương đương',
  },
  {
    id: '2',
    category: 'Chi phí Mạch in (PCB 4-Layer)',
    initialCost: 5.00,
    optimizedCost: 4.50,
    note: 'Tối ưu số lượng ghép bản in (Panelization)',
  },
  {
    id: '3',
    category: 'Chi phí Bấm dây (Harness)',
    initialCost: 4.80,
    optimizedCost: 4.50,
    note: 'Chuẩn hóa mã Connector tiết kiệm vật liệu',
  },
  {
    id: '4',
    category: 'Chi phí Lắp ráp & Hàn SMT/DIP',
    initialCost: 2.50,
    optimizedCost: 2.20,
    note: 'Tối ưu số lượng pad hàn và quy trình SMT',
  },
  {
    id: '5',
    category: 'Chi phí Kiểm thử (Testing & QA)',
    initialCost: 1.00,
    optimizedCost: 1.00,
    note: 'Sử dụng Jig kiểm tra tự động hàng loạt',
  },
];

export default function CostingPage() {
  const [costList] = useState<CostItem[]>(() => {
    const saved = localStorage.getItem('ai_business_costing_data');
    return saved ? JSON.parse(saved) : initialCostingData;
  });

  useEffect(() => {
    localStorage.setItem('ai_business_costing_data', JSON.stringify(costList));
  }, [costList]);

  const totalInitialCost = costList.reduce((sum, item) => sum + item.initialCost, 0);
  const totalOptimizedCost = costList.reduce((sum, item) => sum + item.optimizedCost, 0);
  const marginAmount = 6.75;
  const suggestedPrice = totalOptimizedCost + marginAmount;

  const formatCurrency = (val: number) => '$' + val.toFixed(2);

  // --- 1. XUẤT PDF CHUẨN (Dùng Native Browser Print) ---
  const handleExportPDF = () => {
    window.print();
  };

  // --- 2. // --- HÀM XUẤT EXCEL CHO PHÉP CHỌN THƯ MỤC LƯU FILE ---
  const handleExportExcel = async () => {
    try {
      const exportData = costList.map((c) => ({
        'Hạng mục chi phí': c.category,
        'Chi phí ban đầu ($)': c.initialCost,
        'Chi phí sau tối ưu AI ($)': c.optimizedCost,
        'Ghi chú & Tối ưu': c.note,
      }));

      exportData.push({
        'Hạng mục chi phí': 'TỔNG CỘNG ĐƠN GIÁ',
        'Chi phí ban đầu ($)': totalInitialCost,
        'Chi phí sau tối ưu AI ($)': totalOptimizedCost,
        'Ghi chú & Tối ưu': `Giá bán đề xuất: ${formatCurrency(suggestedPrice)} / SP`,
      });

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Quotation');

      // Tạo nhị phân file Excel
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      // Kiểm tra trình duyệt có hỗ trợ mở cửa sổ chọn thư mục Save As hay không
      if ('showSaveFilePicker' in window) {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: `Bao_Gia_Khach_Hang_QT-2026-0810.xlsx`,
          types: [
            {
              description: 'Excel File',
              accept: {
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
              },
            },
          ],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
      } else {
        // Fallback tải xuống mặc định nếu trình duyệt cũ
        XLSX.writeFile(workbook, `Bao_Gia_Khach_Hang_QT-2026-0810.xlsx`);
      }
    } catch (error: any) {
      // Người dùng bấm "Hủy" cửa sổ chọn file thì không làm gì
      if (error.name !== 'AbortError') {
        console.error(error);
        alert('Có lỗi xảy ra khi xuất file Excel!');
      }
    }
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen space-y-5 select-none print:p-0 print:bg-white">
      {/* Style ẩn Sidebar và chỉ in phần báo giá */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #print-quotation-container, #print-quotation-container * {
            visibility: visible !important;
          }
          #print-quotation-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
            border: none !important;
            box-shadow: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header & Nút thao tác (Sẽ tự động ẩn khi xuất PDF) */}
      <div className="flex justify-between items-center border-b pb-3 border-slate-200 no-print">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Costing - Tính toán & Báo giá Tổng hợp</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tổng hợp toàn bộ chi phí sản xuất phần cứng và dự toán biên lợi nhuận cho dự án.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleExportExcel}
            className="bg-slate-700 hover:bg-slate-800 text-white font-medium text-xs px-3.5 py-2 rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>📊 Xuất Excel</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs px-4 py-2 rounded-lg shadow-sm transition flex items-center gap-2 cursor-pointer"
          >
            <span>📄</span>
            + Xuất Báo giá Khách hàng (PDF)
          </button>
        </div>
      </div>

      {/* KHỐI NỘI DUNG BÁO GIÁ */}
      <div
        id="print-quotation-container"
        className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6"
      >
        <div className="flex justify-between items-start pb-4 border-b border-sky-600">
          <div>
            <h2 className="text-xl font-black text-sky-600 uppercase tracking-tight">AI BUSINESS SOLUTIONS</h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5">Hệ thống Tối ưu Phần cứng & Quản lý Sản xuất AI</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Tầng 8, Tòa nhà Công nghệ, TP. HCM | Hotline: 1900 6868</p>
          </div>
          <div className="text-right">
            <h3 className="text-lg font-extrabold text-slate-800 uppercase">BÁO GIÁ DỰ ÁN</h3>
            <p className="text-xs font-bold text-sky-600 mt-0.5">Mã: QT-2026-0810</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Ngày lập: 10/8/2026</p>
          </div>
        </div>

        {/* 4 Thẻ Thống Kê */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 print:grid-cols-4">
          <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-xl">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">TỔNG CHI PHÍ GỐC (BOM)</div>
            <div className="text-2xl font-bold text-slate-800 mt-2">{formatCurrency(totalInitialCost)} / SP</div>
          </div>

          <div className="p-4 bg-emerald-50/40 border border-emerald-200 rounded-xl">
            <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">CHI PHÍ SAU AI TỐI ƯU</div>
            <div className="text-2xl font-bold text-emerald-600 mt-2">{formatCurrency(totalOptimizedCost)} / SP</div>
            <div className="text-[11px] font-semibold text-emerald-600 mt-1">Tiết kiệm ~8.4%</div>
          </div>

          <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-xl">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">MỨC LỢI NHUẬN (MARGIN 30%)</div>
            <div className="text-2xl font-bold text-sky-600 mt-2">+{formatCurrency(marginAmount)} / SP</div>
          </div>

          <div className="p-4 bg-sky-50/40 border border-sky-200 rounded-xl">
            <div className="text-[10px] font-bold text-sky-700 uppercase tracking-wider">GIÁ BÁN ĐỀ XUẤT</div>
            <div className="text-2xl font-bold text-sky-600 mt-2">{formatCurrency(suggestedPrice)} / SP</div>
          </div>
        </div>

        {/* Bảng Chi Tiết */}
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="p-3 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-700">
            Chi tiết cơ cấu chi phí sản xuất (Hardware Cost Structure)
          </div>

          <table className="w-full text-left text-xs text-slate-700 border-collapse">
            <thead className="bg-slate-950 text-white font-bold">
              <tr>
                <th className="px-4 py-3">Hạng mục chi phí</th>
                <th className="px-4 py-3 text-right">Chi phí ban đầu</th>
                <th className="px-4 py-3 text-right">Chi phí sau tối ưu AI</th>
                <th className="px-4 py-3">Ghi chú & Tối ưu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {costList.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition">
                  <td className="px-4 py-3 font-semibold text-slate-800 align-middle">{item.category}</td>
                  <td className="px-4 py-3 text-right text-slate-400 line-through align-middle">
                    {formatCurrency(item.initialCost)}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-600 align-middle">
                    {formatCurrency(item.optimizedCost)}
                  </td>
                  <td className="px-4 py-3 text-slate-600 align-middle">{item.note}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 font-bold text-slate-800 border-t border-slate-200">
              <tr>
                <td className="px-4 py-3 text-center uppercase">TỔNG CỘNG ĐƠN GIÁ:</td>
                <td className="px-4 py-3 text-right text-slate-400 line-through">{formatCurrency(totalInitialCost)}</td>
                <td className="px-4 py-3 text-right text-emerald-600 font-extrabold text-sm">{formatCurrency(totalOptimizedCost)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}