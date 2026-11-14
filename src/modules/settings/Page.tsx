import { useEffect, useState } from 'react';
import { BUSINESS_DEFAULTS } from '../../lib/pricing';

type WorkspaceSettings = {
  companyName: string;
  currency: 'USD';
  quoteValidityDays: number;
  overheadPercent: number;
  marginPercent: number;
};

const SETTINGS_KEY = 'ai_sales_workspace_settings';
const DATA_KEYS = [
  'ai_business_crm_data',
  'ai_business_customers',
  'ai_business_rfq_data',
  'ai_business_bom_data',
  'ai_business_bom_columns',
  'ai_business_harness_data',
  'ai_business_harness_columns',
  'ai_sales_costs_by_category',
  'ai_sales_costs_by_category_v1',
  'ai_business_costing_data',
  'ai_sales_chat_history',
] as const;

const defaultSettings: WorkspaceSettings = {
  companyName: 'AI Business Solutions',
  currency: 'USD',
  quoteValidityDays: 30,
  overheadPercent: BUSINESS_DEFAULTS.overheadRate * 100,
  marginPercent: BUSINESS_DEFAULTS.grossMarginRate * 100,
};

function readSettings(): WorkspaceSettings {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? 'null') as Partial<WorkspaceSettings> | null;
    return {
      ...defaultSettings,
      companyName: typeof saved?.companyName === 'string' ? saved.companyName : defaultSettings.companyName,
      quoteValidityDays: Number.isInteger(saved?.quoteValidityDays) && Number(saved?.quoteValidityDays) > 0
        ? Number(saved?.quoteValidityDays)
        : defaultSettings.quoteValidityDays,
      // USD and approved pricing assumptions are fixed for the MVP; ignore stale browser values.
      currency: 'USD',
      overheadPercent: defaultSettings.overheadPercent,
      marginPercent: defaultSettings.marginPercent,
    };
  } catch {
    return defaultSettings;
  }
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<WorkspaceSettings>(readSettings);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      setError('');
    } catch {
      setError('Không thể lưu cài đặt vào bộ nhớ trình duyệt. Hãy xuất bản sao lưu dữ liệu.');
    }
  }, [settings]);

  const exportBackup = () => {
    try {
      const payload = Object.fromEntries(DATA_KEYS.flatMap((key) => {
        const value = localStorage.getItem(key);
        return value === null ? [] : [[key, JSON.parse(value) as unknown]];
      }));
      const backup = {
        format: 'ai-business-development-local-backup',
        version: 1,
        exportedAt: new Date().toISOString(),
        currency: 'USD',
        data: payload,
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ai-business-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setNotice('Đã tải bản sao lưu JSON của dữ liệu hiện có trên trình duyệt này.');
      setError('');
    } catch {
      setError('Không thể tạo bản sao lưu. Dữ liệu cục bộ có thể không hợp lệ hoặc trình duyệt đã hết dung lượng.');
    }
  };

  const clearData = () => {
    if (!window.confirm('Xóa dữ liệu CRM, khách hàng, RFQ, BOM, Harness, Costing và lịch sử chat trên trình duyệt này? Cài đặt workspace được giữ lại. Hãy xuất bản sao lưu trước.')) return;
    DATA_KEYS.forEach((key) => localStorage.removeItem(key));
    setNotice('Đã xóa dữ liệu nghiệp vụ trên thiết bị này. Tải lại các màn hình để hiển thị trạng thái trống.');
    setError('');
  };

  const resetSettings = () => {
    if (!window.confirm('Khôi phục tên doanh nghiệp và thời hạn báo giá mặc định?')) return;
    setSettings(defaultSettings);
    setNotice('Đã khôi phục cài đặt mặc định.');
    setError('');
  };

  return <div className="settings-page">
    <header className="settings-heading">
      <div className="settings-kicker"><i /> SYSTEM / WORKSPACE</div>
      <h1>Cài đặt workspace</h1>
      <p>Thiết lập thông tin báo giá và quản lý dữ liệu cục bộ của ứng dụng.</p>
    </header>

    {notice && <div className="settings-notice" role="status">{notice}<button onClick={() => setNotice('')} aria-label="Đóng thông báo">×</button></div>}
    {error && <div className="settings-error" role="alert">{error}</div>}

    <div className="settings-grid">
      <section className="settings-card">
        <div className="settings-card-title"><span>01</span><div><h2>Thông tin báo giá</h2><p>Thông tin mặc định hiển thị trong workspace.</p></div></div>
        <label>Tên doanh nghiệp<input value={settings.companyName} maxLength={120} onChange={(event) => setSettings((current) => ({ ...current, companyName: event.target.value }))} /></label>
        <div className="settings-fields">
          <label>Tiền tệ<div className="settings-locked-value">USD <span>Đã khóa cho MVP</span></div></label>
          <label>Hiệu lực báo giá (ngày)<input type="number" min="1" max="365" value={settings.quoteValidityDays} onChange={(event) => setSettings((current) => ({ ...current, quoteValidityDays: Math.min(365, Math.max(1, Number(event.target.value) || 1)) }))} /></label>
        </div>
      </section>

      <section className="settings-card">
        <div className="settings-card-title"><span>02</span><div><h2>Chính sách tính giá chính thức</h2><p>Các giá trị đã được chủ sản phẩm xác nhận; giữ nguyên đến khi có yêu cầu cập nhật.</p></div></div>
        <div className="policy-list">
          <div><span>Tiền tệ</span><strong>USD</strong></div>
          <div><span>Overhead trên chi phí trực tiếp</span><strong>{settings.overheadPercent}%</strong></div>
          <div><span>Gross margin mục tiêu trên giá bán</span><strong>{settings.marginPercent}%</strong></div>
          <div><span>Ngưỡng cảnh báo margin tối thiểu</span><strong>{BUSINESS_DEFAULTS.minimumGrossMarginRate * 100}%</strong></div>
        </div>
        <div className="settings-formula">Giá thành sản xuất = chi phí trực tiếp × (1 + overhead). Giá bán = giá thành sản xuất ÷ (1 − gross margin). Thuế, vận chuyển, NRE/tooling và hao hụt chưa tính nếu chưa nhập riêng.</div>
        <a href="/costing" className="settings-link">Mở Costing và đơn giá cơ sở chính thức →</a>
      </section>

      <section className="settings-card settings-status-card">
        <div className="settings-card-title"><span>03</span><div><h2>Tích hợp & bảo mật</h2><p>Tình trạng kết nối trong phiên bản hiện tại.</p></div></div>
        <div className="integration-row"><div><strong>AI model</strong><small>Chưa kết nối dịch vụ AI. Trợ lý hiện chạy bằng quy tắc cục bộ, không gọi model bên ngoài.</small></div><span className="status-off">Chưa kết nối</span></div>
        <div className="integration-row"><div><strong>Nhà cung cấp / tồn kho</strong><small>Chưa kết nối API trực tiếp. Giá nhập cần được người dùng xác minh.</small></div><span className="status-off">Chưa kết nối</span></div>
        <div className="security-note"><strong>Bảo mật:</strong> Không nhập API key bí mật vào frontend hoặc localStorage. Tích hợp AI/API cần backend và lưu secrets phía server.</div>
      </section>

      <section className="settings-card settings-data-card">
        <div className="settings-card-title"><span>04</span><div><h2>Dữ liệu trên thiết bị</h2><p>Dữ liệu hiện lưu trong localStorage của trình duyệt này, chưa đồng bộ với người dùng hoặc thiết bị khác.</p></div></div>
        <div className="data-actions">
          <button onClick={exportBackup} className="settings-primary">↓ Xuất bản sao lưu JSON</button>
          <button onClick={clearData} className="settings-danger">Xóa dữ liệu nghiệp vụ</button>
          <button onClick={resetSettings} className="settings-secondary">Khôi phục cài đặt mặc định</button>
        </div>
        <p className="settings-help">Bản sao lưu có thể chứa thông tin khách hàng và báo giá; lưu ở nơi an toàn. Chưa hỗ trợ khôi phục/import file JSON.</p>
      </section>
    </div>

    <style>{`
      .settings-page{max-width:1050px;margin:0 auto;padding:6px 12px 30px;color:#17241f;font-family:'DM Sans',sans-serif}.settings-heading{border-bottom:1px solid #e6ebe7;padding-bottom:20px}.settings-kicker{font:9px 'DM Mono',monospace;letter-spacing:.12em;color:#738178}.settings-kicker i{display:inline-block;width:7px;height:7px;border-radius:50%;background:#48a276;margin-right:7px}.settings-heading h1{font:700 26px 'Manrope',sans-serif;margin:12px 0 5px}.settings-heading>p{font-size:11px;color:#7f8b82;margin:0}.settings-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:16px}.settings-card{border:1px solid #e3e9e4;border-radius:8px;background:#fff;padding:16px}.settings-card-title{display:flex;gap:10px;align-items:flex-start;margin-bottom:15px}.settings-card-title>span{font:9px 'DM Mono',monospace;color:#4e8d65;border:1px solid #dce9df;background:#f4faf5;border-radius:4px;padding:4px 6px}.settings-card-title h2{font:700 13px 'Manrope',sans-serif;margin:0;color:#2d3e33}.settings-card-title p{font-size:9px;line-height:1.55;color:#89958d;margin:4px 0 0}.settings-card>label,.settings-fields label{display:block;color:#647168;font-size:9px;font-weight:600;margin:12px 0}.settings-card input{box-sizing:border-box;width:100%;margin-top:6px;padding:8px 9px;border:1px solid #e0e7e1;border-radius:5px;background:#fff;color:#35453a;font:10px 'DM Sans',sans-serif}.settings-card input:focus{outline:2px solid #d8ebdc;border-color:#65a77d}.settings-fields{display:grid;grid-template-columns:1fr 1fr;gap:10px}.settings-locked-value{display:flex;justify-content:space-between;align-items:center;margin-top:6px;padding:8px 9px;border:1px solid #e4eae5;border-radius:5px;background:#f7f9f7;color:#31483a;font-size:10px}.settings-locked-value span{color:#7b887e;font-size:8px;font-weight:400}.policy-list{border:1px solid #edf0ed;border-radius:6px;overflow:hidden}.policy-list>div{display:flex;justify-content:space-between;gap:10px;padding:9px 10px;border-bottom:1px solid #edf0ed;font-size:9px}.policy-list>div:last-child{border-bottom:0}.policy-list span{color:#77847b}.policy-list strong{color:#347b50}.settings-formula,.security-note{margin-top:11px;padding:10px;border-radius:5px;background:#f2f7f3;color:#69766d;font-size:9px;line-height:1.65}.settings-link{display:inline-block;margin-top:11px;color:#347b50;font-size:9px;font-weight:600;text-decoration:none}.settings-link:hover{text-decoration:underline}.integration-row{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:11px 0;border-bottom:1px solid #edf0ed}.integration-row>div{display:flex;flex-direction:column;gap:4px}.integration-row strong{font-size:10px;color:#405047}.integration-row small{font-size:9px;color:#87938b;line-height:1.5}.status-off{flex:none;padding:4px 7px;border-radius:20px;background:#f2f4f2;color:#7f8981;font-size:8px}.security-note{background:#fbf8ed;color:#756b4b}.settings-notice,.settings-error{display:flex;justify-content:space-between;gap:10px;margin-top:12px;padding:10px;border:1px solid #d5e8d9;border-radius:6px;background:#f2faf4;color:#34704a;font-size:9px}.settings-notice button{border:0;background:none;color:inherit;font-size:16px;cursor:pointer}.settings-error{border-color:#f0d0ce;background:#fff5f4;color:#963f39}.data-actions{display:flex;flex-wrap:wrap;gap:8px}.data-actions button{border-radius:5px;padding:8px 10px;font-size:9px;font-weight:600;cursor:pointer}.settings-primary{border:1px solid #277b56;background:#277b56;color:#fff}.settings-secondary{border:1px solid #e0e7e1;background:#fff;color:#536158}.settings-danger{border:1px solid #f0d0ce;background:#fff6f5;color:#a34842}.settings-help{font-size:8px;line-height:1.6;color:#919c94;margin:10px 0 0}@media(max-width:700px){.settings-grid{grid-template-columns:1fr}.settings-fields{grid-template-columns:1fr}.settings-card{padding:13px}}
    `}</style>
  </div>;
}
