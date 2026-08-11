import { useState } from 'react';

const mockPCBRules = [
  { id: 1, check: 'Trace Width / Clearance (Khả năng dẫn dòng)', result: 'Đạt (Min 6mil)', status: 'Pass', note: 'Phù hợp tiêu chuẩn sản xuất tiêu chuẩn' },
  { id: 2, check: 'Via Hole Size (Kích thước lỗ khoan)', result: 'Cảnh báo (0.2mm)', status: 'Warning', note: 'Có thể tăng chi phí khoan micro-via' },
  { id: 3, check: 'Copper Layer Thickness (Độ dày đồng)', result: '1 oz (35um)', status: 'Pass', note: 'Chuẩn công nghiệp' },
  { id: 4, check: 'Solder Mask Clearance', result: 'Đạt chuẩn', status: 'Pass', note: 'Không tràn lớp phủ hàn' },
];

export default function PCBAIPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-4 border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">PCB AI - Phân tích DFM & Chi phí PCB</h1>
          <p className="text-sm text-slate-500 mt-1">Tải lên file Gerber/CAD để AI tự động kiểm tra lỗi thiết kế mạch và dự toán chi phí gia công.</p>
        </div>
        <button className="bg-sky-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-sky-700 transition">
          + Xuất Báo cáo DFM
        </button>
      </div>

      {/* Khu vực Upload Gerber */}
      <div className="border-2 border-dashed border-sky-300 rounded-xl p-6 text-center bg-sky-50/50 hover:bg-sky-50 transition cursor-pointer">
        <div className="text-sky-800 font-semibold">Kéo thả file Gerber (.zip, .rar, .cam) vào đây để phân tích DFM</div>
        <div className="text-xs text-slate-400 mt-1">Hỗ trợ Gerber X2, ODB++, Altium Designer, KiCad, EAGLE</div>
      </div>

      {/* Thẻ Thống kê PCB */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase">Kích thước PCB dự toán</div>
          <div className="text-2xl font-bold text-slate-800 mt-1">100 x 80 mm</div>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase">Số lớp mạch (Layers)</div>
          <div className="text-2xl font-bold text-sky-600 mt-1">4 Layers (FR4)</div>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase">Giá gia công mẫu (Proto)</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">$25.00 / 5 PCBs</div>
        </div>
      </div>

      {/* Bảng Kiểm tra Lỗi DFM từ AI */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 font-semibold text-slate-800 bg-slate-50">
          Kết quả kiểm tra quy chuẩn DFM (Design for Manufacturing)
        </div>
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
            <tr>
              <th className="p-3.5">Hạng mục kiểm tra</th>
              <th className="p-3.5">Thông số bóc tách</th>
              <th className="p-3.5">Đánh giá AI</th>
              <th className="p-3.5">Khuyến nghị kỹ thuật</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {mockPCBRules.map((rule) => (
              <tr key={rule.id} className="hover:bg-slate-50 transition">
                <td className="p-3.5 font-medium text-slate-900">{rule.check}</td>
                <td className="p-3.5">{rule.result}</td>
                <td className="p-3.5">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    rule.status === 'Pass' 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {rule.status === 'Pass' ? 'Đạt chuẩn' : 'Cần lưu ý'}
                  </span>
                </td>
                <td className="p-3.5 text-xs text-slate-600">{rule.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}