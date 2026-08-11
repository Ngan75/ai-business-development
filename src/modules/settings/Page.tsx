export default function SettingsPage() {
    return (
      <div className="space-y-6 max-w-4xl">
        <div className="border-b pb-4 border-slate-200">
          <h1 className="text-2xl font-bold text-slate-800">Settings - Cấu hình Hệ thống & AI Key</h1>
          <p className="text-sm text-slate-500 mt-1">Quản lý tích hợp API OpenAI/Claude, nhà cung cấp linh kiện và thông tin doanh nghiệp.</p>
        </div>
  
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-lg border-b pb-2">1. Tích hợp AI Engine</h3>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">OpenAI API Key (Tối ưu BOM & Chat)</label>
            <input 
              type="password" 
              defaultValue="sk-proj-1234567890abcdefghijklmnopqrstuvwxyz" 
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mô hình AI mặc định</label>
            <select className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm">
              <option>GPT-4o (Khuyên dùng cho BOM & DFM)</option>
              <option>Claude 3.5 Sonnet</option>
            </select>
          </div>
        </div>
  
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-lg border-b pb-2">2. Kết nối API Nhà cung cấp</h3>
          <div className="flex justify-between items-center py-2">
            <div>
              <div className="font-semibold text-slate-800">Digi-Key API Integration</div>
              <div className="text-xs text-slate-500">Tra cứu tồn kho thực tế và đơn giá số lượng lớn</div>
            </div>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 font-medium rounded-full text-xs">Đã kết nối</span>
          </div>
          <div className="flex justify-between items-center py-2 border-t">
            <div>
              <div className="font-semibold text-slate-800">Mouser Electronics API</div>
              <div className="text-xs text-slate-500">Tự động cập nhật linh kiện thay thế</div>
            </div>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 font-medium rounded-full text-xs">Đã kết nối</span>
          </div>
        </div>
  
        <button className="bg-sky-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-sky-700 transition">
          Lưu thay đổi cài đặt
        </button>
      </div>
    );
  }