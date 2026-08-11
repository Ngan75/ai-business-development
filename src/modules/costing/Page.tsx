import { useState } from 'react';

const mockCostBreakdown = [
  { category: 'Chi phí Linh kiện (BOM)', rawCost: '$11.25', optimizedCost: '$10.29', note: 'AI gợi ý thay thế 1 linh kiện MCU' },
  { category: 'Chi phí Mạch in (PCB 4-Layer)', rawCost: '$5.00', optimizedCost: '$4.50', note: 'Tối ưu số lượng ghép bản in (Panelization)' },
  { category: 'Chi phí Bấm dây (Harness)', rawCost: '$4.80', optimizedCost: '$4.50', note: 'Chuẩn hóa mã Connector' },
  { category: 'Chi phí Lắp ráp & Hàn SMT/DIP', rawCost: '$2.50', optimizedCost: '$2.20', note: 'Tối ưu số lượng pad hàn' },
  { category: 'Chi phí Kiểm thử (Testing & QA)', rawCost: '$1.00', optimizedCost: '$1.00', note: 'Sử dụng jig kiểm tra tự động' },
];

export default function CostingPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-4 border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Costing - Tính toán & Báo giá Tổng hợp</h1>
          <p className="text-sm text-slate-500 mt-1">Tổng hợp toàn bộ chi phí sản xuất phần cứng và dự toán biên lợi nhuận cho dự án.</p>
        </div>
        <button className="bg-sky-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-sky-700 transition">
          + Xuất Báo giá Khách hàng (Quotation)
        </button>
      </div>

      {/* Thẻ Thống kê Costing */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase">Tổng chi phí gốc (BO)</div>
          <div className="text-2xl font-bold text-slate-800 mt-1">$24.55 / SP</div>
        </div>
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl shadow-sm">
          <div className="text-xs font-semibold text-emerald-600 uppercase">Chi phí sau AI Tối ưu</div>
          <div className="text-2xl font-bold text-emerald-800 mt-1">$22.49 / SP</div>
          <div className="text-xs text-emerald-600 mt-1">Tiết kiệm ~8.4%</div>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase">Mức Lợi nhuận (Margin 30%)</div>
          <div className="text-2xl font-bold text-sky-600 mt-1">+$9.64 / SP</div>
        </div>
        <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl shadow-sm">
          <div className="text-xs font-semibold text-sky-600 uppercase">Giá bán đề xuất</div>
          <div className="text-2xl font-bold text-sky-900 mt-1">$32.13 / SP</div>
        </div>
      </div>

      {/* Bảng Bóc tách Chi phí */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 font-semibold text-slate-800 bg-slate-50">
          Chi tiết cơ cấu chi phí sản xuất (Hardware Cost Structure)
        </div>
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
            <tr>
              <th className="p-3.5">Hạng mục chi phí</th>
              <th className="p-3.5">Chi phí ban đầu</th>
              <th className="p-3.5">Chi phí sau tối ưu AI</th>
              <th className="p-3.5">Ghi chú & Tối ưu</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {mockCostBreakdown.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50 transition">
                <td className="p-3.5 font-medium text-slate-900">{item.category}</td>
                <td className="p-3.5 text-slate-500 line-through">{item.rawCost}</td>
                <td className="p-3.5 font-bold text-emerald-600">{item.optimizedCost}</td>
                <td className="p-3.5 text-xs text-slate-600">{item.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}