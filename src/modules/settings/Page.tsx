import { useEffect, useState } from 'react';

type WorkspaceSettings = { companyName: string; currency: 'USD' | 'VND'; quoteValidityDays: number; overheadPercent: number; marginPercent: number };
const defaultSettings: WorkspaceSettings = { companyName: 'AI Business Solutions', currency: 'USD', quoteValidityDays: 30, overheadPercent: 8, marginPercent: 25 };
function readSettings(): WorkspaceSettings {
  try {
    const saved = JSON.parse(localStorage.getItem('ai_sales_workspace_settings') ?? 'null') as Partial<WorkspaceSettings> | null;
    return { ...defaultSettings, ...(saved ?? {}) };
  } catch { return defaultSettings; }
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<WorkspaceSettings>(readSettings);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    try { localStorage.setItem('ai_sales_workspace_settings', JSON.stringify(settings)); }
    catch { setNotice('Không thể lưu cài đặt vào bộ nhớ trình duyệt.'); }
  }, [settings]);
  const update = <K extends keyof WorkspaceSettings>(key: K, value: WorkspaceSettings[K]) => setSettings((current) => ({ ...current, [key]: value }));
  const clearData = () => {
    if (!window.confirm('Thao tác này sẽ xóa dữ liệu CRM, khách hàng, RFQ, BOM, Harness và Costing trên trình duyệt này. Bạn đã xuất bản sao lưu chưa?')) return;
    ['ai_business_crm_data', 'ai_business_customers', 'ai_business_rfq_data', 'ai_business_bom_data', 'ai_business_bom_columns', 'ai_business_harness_data', 'ai_business_harness_columns', 'ai_business_harness_widths', 'ai_business_costing_data', 'ai_sales_costs_by_category'].forEach((key) => localStorage.removeItem(key));
    setNotice('Đã xóa dữ liệu ứng dụng trên thiết bị này. Tải lại trang để các màn hình cập nhật.');
  };
  const resetSettings = () => { setSettings(defaultSettings); setNotice('Đã khôi phục thông số mặc định.'); };

  return <div className="settings-page">
    <header className="settings-heading"><div><div className="settings-kicker"><i /> SYSTEM / WORKSPACE</div><h1>Cài đặt workspace</h1><p>Quản lý thông tin báo giá và các thông số mặc định trên thiết bị này.</p></div></header>
    {notice && <div className="settings-notice" role="status">{notice}<button onClick={() => setNotice('')} aria-label="Đóng thông báo">×</button></div>}
    <div className="settings-grid">
      <section className="settings-card"><div className="settings-card-title"><span>01</span><div><h2>Thông tin báo giá</h2><p>Thông tin hiển thị trong workspace; chưa tự động phát hành chứng từ.</p></div></div>
        <label>Tên doanh nghiệp<input value={settings.companyName} onChange={(event) => update('companyName', event.target.value)} /></label>
        <div className="settings-fields"><label>Đơn vị tiền tệ mặc định<select value={settings.currency} onChange={(event) => update('currency', event.target.value as WorkspaceSettings['currency'])}><option value="USD">USD — Đô la Mỹ</option><option value="VND">VND — Việt Nam đồng</option></select></label><label>Hiệu lực báo giá (ngày)<input type="number" min="1" max="365" value={settings.quoteValidityDays} onChange={(event) => update('quoteValidityDays', Math.min(365, Math.max(1, Number(event.target.value) || 1)))} /></label></div>
      </section>
      <section className="settings-card"><div className="settings-card-title"><span>02</span><div><h2>Thông số Costing mặc định</h2><p>Áp dụng khi tạo báo giá mới; có thể điều chỉnh trong module Costing.</p></div></div>
        <div className="settings-fields"><label>Chi phí chung (%)<input type="number" min="0" max="100" value={settings.overheadPercent} onChange={(event) => update('overheadPercent', Math.min(100, Math.max(0, Number(event.target.value) || 0)))} /></label><label>Biên lợi nhuận mục tiêu (%)<input type="number" min="0" max="99" value={settings.marginPercent} onChange={(event) => update('marginPercent', Math.min(99, Math.max(0, Number(event.target.value) || 0)))} /></label></div>
        <div className="settings-formula">Giá bán gợi ý = Giá thành sản xuất ÷ (1 − margin). Thông số được lưu tự động trên trình duyệt này.</div>
      </section>
      <section className="settings-card settings-status-card"><div className="settings-card-title"><span>03</span><div><h2>Tích hợp & bảo mật</h2><p>Tình trạng thực tế của bản prototype.</p></div></div>
        <div className="integration-row"><div><strong>AI model</strong><small>Chưa kết nối dịch vụ AI. Gợi ý Costing hiện chạy theo quy tắc cục bộ.</small></div><span className="integration-badge">Chưa cấu hình</span></div>
        <div className="integration-row"><div><strong>Nhà cung cấp / tồn kho</strong><small>Chưa kết nối API trực tiếp. Dữ liệu nhập cần được xác minh.</small></div><span className="integration-badge">Chưa kết nối</span></div>
        <div className="security-note"><strong>Bảo mật:</strong> Không nhập API key bí mật vào frontend hoặc Local Storage. Muốn tích hợp AI/API, cần backend bảo mật để giữ khóa và xác thực yêu cầu.</div>
      </section>
      <section className="settings-card settings-data-card"><div className="settings-card-title"><span>04</span><div><h2>Dữ liệu trên thiết bị</h2><p>Dữ liệu ứng dụng hiện lưu cục bộ, không đồng bộ giữa người dùng hay trình duyệt.</p></div></div>
        <div className="data-actions"><a href="/costing" className="settings-link">Mở Costing để xuất báo giá →</a><button onClick={resetSettings}>Khôi phục cài đặt mặc định</button><button className="danger-button" onClick={clearData}>Xóa dữ liệu ứng dụng trên thiết bị</button></div>
      </section>
    </div>
    <style>{`
      .settings-page{max-width:1050px;margin:0 auto;padding:6px 12px;color:#17241f}.settings-heading{border-bottom:1px solid #e6ebe7;padding-bottom:22px}.settings-kicker{font:9px 'DM Mono',monospace;color:#849087;letter-spacing:.1em}.settings-kicker i{display:inline-block;width:7px;height:7px;border-radius:50%;background:#39a576;margin-right:7px}.settings-heading h1{font:700 29px 'Manrope',sans-serif;letter-spacing:-.04em;margin:12px 0 6px}.settings-heading p{font-size:12px;color:#7d8981;margin:0}.settings-notice{display:flex;justify-content:space-between;padding:10px;margin:12px 0;background:#f1faf4;border:1px solid #d5e9d9;border-radius:7px;color:#326849;font-size:10px}.settings-notice button{border:0;background:transparent;color:inherit;font-size:17px}.settings-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:16px}.settings-card{background:white;border:1px solid #e6ebe7;border-radius:9px;padding:18px}.settings-card-title{display:flex;gap:11px;align-items:flex-start;margin-bottom:19px}.settings-card-title>span{font:10px 'DM Mono',monospace;color:#a0aaa3;padding-top:2px}.settings-card-title h2{font:700 14px 'Manrope',sans-serif;color:#2c3b32;margin:0 0 5px}.settings-card-title p{font-size:9px;color:#89958d;line-height:1.5;margin:0}.settings-card label{position:relative;display:block;color:#67746c;font-size:10px;font-weight:600;margin-bottom:13px}.settings-card input,.settings-card select{display:block;width:100%;margin-top:7px;border:1px solid #e1e8e2;border-radius:6px;background:#fff;color:#34443a;padding:9px 10px;font:11px 'DM Sans',sans-serif;outline:none}.settings-card input:focus,.settings-card select:focus{border-color:#56a27a;box-shadow:0 0 0 2px #e8f4ec}.settings-fields{display:grid;grid-template-columns:1fr 1fr;gap:10px}.settings-formula,.security-note{border-radius:6px;background:#f5f8f5;padding:10px;color:#77847c;font-size:9px;line-height:1.6}.settings-status-card,.settings-data-card{min-height:180px}.integration-row{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 0;border-top:1px solid #eef1ee}.integration-row>div{display:flex;flex-direction:column;gap:4px}.integration-row strong{font-size:10px;color:#425147}.integration-row small{font-size:9px;color:#89948c;line-height:1.5}.integration-badge{white-space:nowrap;border:1px solid #eadfbe;border-radius:20px;padding:4px 7px;background:#fbf8ed;color:#8b7540;font:8px 'DM Mono',monospace}.security-note{margin-top:8px}.data-actions{display:flex;flex-wrap:wrap;gap:9px}.data-actions button,.settings-link{border:1px solid #e1e8e2;border-radius:6px;padding:8px 10px;background:white;color:#56645b;text-decoration:none;font-size:9px}.settings-link{color:#307b54}.data-actions .danger-button{color:#a44949;border-color:#ecd8d8}.data-actions button:hover,.settings-link:hover{background:#f7faf7}@media(max-width:700px){.settings-page{padding:0}.settings-grid{grid-template-columns:1fr}.settings-heading h1{font-size:25px}.settings-fields{gap:8px}.settings-card{padding:15px}}
    `}</style>
  </div>;
}
