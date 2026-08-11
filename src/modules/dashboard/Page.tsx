export default function DashboardPage() {
    const stats = [
      { title: 'Tổng dự án BOM', value: '24', change: '+12% tháng này', color: 'bg-sky-50 text-sky-700 border-sky-200' },
      { title: 'Yêu cầu báo giá (RFQ)', value: '18', change: '4 yêu cầu mới', color: 'bg-amber-50 text-amber-700 border-amber-200' },
      { title: 'Tỷ lệ tối ưu chi phí', value: '14.2%', change: 'Tiết kiệm ~$12,500', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      { title: 'Cảnh báo chuỗi cung ứng', value: '3', change: 'Linh kiện khan hiếm', color: 'bg-rose-50 text-rose-700 border-rose-200' },
    ];
  
    const recentActivities = [
      { id: 1, action: 'Tải lên BOM dự án "Smart Meter V2"', time: '10 phút trước', user: 'Ngan Dinh' },
      { id: 2, action: 'AI phân tích tối ưu 5 linh kiện PCB', time: '1 giờ trước', user: 'System AI' },
      { id: 3, action: 'Gửi báo giá RFQ tới nhà cung cấp Arrow', time: '3 giờ trước', user: 'Minh Tran' },
      { id: 4, action: 'Cập nhật giá mới cho STM32F407', time: '5 giờ trước', user: 'System AI' },
    ];
  
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-4 border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Dashboard - Tổng quan hệ thống</h1>
            <p className="text-sm text-slate-500 mt-1">Theo dõi hoạt động phân tích BOM, báo giá RFQ và gợi ý từ AI.</p>
          </div>
          <button className="bg-sky-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-sky-700 transition">
            + Tạo dự án mới
          </button>
        </div>
  
        {/* Thẻ thống kê chính */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {stats.map((item, idx) => (
            <div key={idx} className={`p-4 rounded-xl border ${item.color}`}>
              <div className="text-xs font-semibold uppercase opacity-80">{item.title}</div>
              <div className="text-3xl font-bold mt-2">{item.value}</div>
              <div className="text-xs mt-1 opacity-90">{item.change}</div>
            </div>
          ))}
        </div>
  
        {/* Bảng hoạt động gần đây & Lối tắt AI */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cột trái: Hoạt động gần đây */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 font-semibold text-slate-800 bg-slate-50">
              Hoạt động gần đây
            </div>
            <div className="divide-y divide-slate-100">
              {recentActivities.map((act) => (
                <div key={act.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{act.action}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Thực hiện bởi: {act.user}</p>
                  </div>
                  <span className="text-xs text-slate-400">{act.time}</span>
                </div>
              ))}
            </div>
          </div>
  
          {/* Cột phải: Gợi ý nhanh từ AI */}
          <div className="bg-slate-900 text-white rounded-xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">⚡</span>
                <h3 className="font-bold text-lg">AI Insights</h3>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                Hệ thống phát hiện **3 linh kiện MCU** trong dự án hiện tại có giá biến động giảm 5% trong tuần này.
              </p>
              <div className="mt-4 p-3 bg-slate-800/80 rounded-lg border border-slate-700 text-xs text-slate-300">
                💡 Khuyên dùng: Tiến hành gửi RFQ ngay để chốt mức giá ưu đãi từ nhà cung cấp.
              </div>
            </div>
            <button className="mt-6 w-full bg-sky-500 hover:bg-sky-600 text-white py-2.5 rounded-lg font-medium text-sm transition">
              Xem phân tích chi tiết
            </button>
          </div>
        </div>
      </div>
    );
  }