import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownRight, ArrowRight, ArrowUpRight, Boxes, BriefcaseBusiness, Cable, ChartNoAxesCombined, FileText, Plus, Sparkles } from 'lucide-react';

type StoredRow = Record<string, unknown>;
const readRows = (key: string): StoredRow[] => {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? '[]');
    return Array.isArray(value) ? value.filter((row): row is StoredRow => Boolean(row) && typeof row === 'object') : [];
  } catch { return []; }
};
const money = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

export default function DashboardPage() {
  const [crm] = useState(() => readRows('ai_business_crm_data'));
  const [customers] = useState(() => readRows('ai_business_customers'));
  const [rfqs] = useState(() => readRows('ai_business_rfq_data'));
  const [bom] = useState(() => readRows('ai_business_bom_data'));
  const [harness] = useState(() => readRows('ai_business_harness_data'));
  const pipeline = crm.reduce((sum, item) => sum + (Number(item.dealValue) || 0), 0);
  const openRfqs = rfqs.filter((item) => !['Đã thành công', 'NG (giá cao)'].includes(String(item.status))).length;
  const stats = [
    { label: 'CƠ HỘI BÁN HÀNG', value: String(crm.length), note: `Pipeline ${money(pipeline)}`, icon: BriefcaseBusiness, tone: 'green' },
    { label: 'KHÁCH HÀNG', value: String(customers.length), note: 'Hồ sơ lưu trên thiết bị', icon: BriefcaseBusiness, tone: 'blue' },
    { label: 'RFQ ĐANG MỞ', value: String(openRfqs), note: `${rfqs.length} yêu cầu tổng cộng`, icon: FileText, tone: 'amber' },
    { label: 'DÒNG VẬT TƯ ĐÃ TẢI', value: (bom.length + harness.length).toLocaleString('vi-VN'), note: `${bom.length} BOM · ${harness.length} Harness`, icon: Boxes, tone: 'purple' },
  ];
  const shortcuts = useMemo(() => [
    { title: 'Tính giá gia công', description: 'BOM PCBA, Wire harness và IoT', path: '/costing', icon: ChartNoAxesCombined },
    { title: 'Phân tích BOM', description: 'Tải danh sách linh kiện để xử lý', path: '/bom-ai', icon: Boxes },
    { title: 'Báo giá RFQ', description: 'Theo dõi phản hồi từ nhà cung cấp', path: '/rfq', icon: FileText },
    { title: 'Phân tích Harness', description: 'Kiểm tra vật tư bó dây điện', path: '/harness-ai', icon: Cable },
  ], []);

  return (
    <div className="dashboard-page">
      <header className="dashboard-heading">
        <div><div className="dashboard-kicker"><span /> SALES WORKSPACE / OVERVIEW</div><h1>Tổng quan kinh doanh</h1><p>Theo dõi cơ hội bán hàng, yêu cầu báo giá và hoạt động phân tích sản phẩm.</p></div>
        <Link className="dashboard-create" to="/costing"><Plus size={15} /> Tạo báo giá</Link>
      </header>
      <section className="dashboard-stat-grid" aria-label="Chỉ số hệ thống">
        {stats.map(({ label, value, note, icon: Icon, tone }) => <article className={`dashboard-stat stat-${tone}`} key={label}>
          <div className="stat-top"><span>{label}</span><Icon size={16} /></div><strong>{value}</strong><small>{note}</small>
        </article>)}
      </section>
      <div className="dashboard-content-grid">
        <section className="dashboard-card">
          <div className="dashboard-card-head"><div><div className="dashboard-kicker">WORKFLOW</div><h2>Lối tắt công việc</h2></div><Sparkles size={17} /></div>
          <div className="shortcut-grid">{shortcuts.map(({ title, description, path, icon: Icon }) => <Link className="shortcut-link" to={path} key={path}>
            <span className="shortcut-icon"><Icon size={17} /></span><span className="shortcut-copy"><strong>{title}</strong><small>{description}</small></span><ArrowRight size={15} />
          </Link>)}</div>
        </section>
        <section className="dashboard-card dashboard-insight">
          <div className="insight-orb"><Sparkles size={20} /></div><div className="dashboard-kicker">GỢI Ý QUY TRÌNH</div><h2>Bắt đầu từ dữ liệu thực tế</h2>
          <p>Nhập BOM hoặc bảng chi phí vào Costing để tính giá thành, chi phí chung và giá bán theo biên lợi nhuận mục tiêu.</p>
          <Link to="/costing" className="insight-link">Mở Costing <ArrowUpRight size={14} /></Link>
          <div className="insight-note"><ArrowDownRight size={14} /> Các chỉ số ở đây được đọc từ dữ liệu lưu trên trình duyệt này; chưa đồng bộ với người dùng hoặc thiết bị khác.</div>
        </section>
      </div>
      <section className="dashboard-data-note"><strong>Ghi chú dữ liệu</strong><span>Đây là số liệu thực tế trong Local Storage của trình duyệt hiện tại. Các màn hình có thể hiển thị dữ liệu mẫu nếu chưa được nhập hoặc thay đổi.</span><Link to="/settings">Cấu hình workspace <ArrowRight size={13} /></Link></section>
      <style>{`
        .dashboard-page{max-width:1440px;margin:0 auto;padding:6px 12px;color:#17241f}.dashboard-heading{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;padding:0 0 23px;border-bottom:1px solid #e6ebe7}.dashboard-kicker{display:flex;align-items:center;gap:7px;color:#87938b;font:9px 'DM Mono',monospace;letter-spacing:.09em}.dashboard-kicker>span{width:7px;height:7px;background:#39a576;border-radius:50%}.dashboard-heading h1{font:700 29px 'Manrope',sans-serif;letter-spacing:-.04em;margin:12px 0 6px}.dashboard-heading p{margin:0;color:#7c8880;font-size:12px}.dashboard-create{display:flex;align-items:center;gap:7px;background:#237b57;color:white;text-decoration:none;padding:9px 13px;border-radius:7px;font-size:11px;font-weight:600}.dashboard-stat-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:11px;margin:18px 0}.dashboard-stat{background:white;border:1px solid #e6ebe7;border-radius:9px;padding:14px 15px;min-width:0}.stat-top{display:flex;align-items:center;justify-content:space-between;color:#86928a;font:8px 'DM Mono',monospace;letter-spacing:.06em}.stat-green .stat-top svg{color:#31805a}.stat-blue .stat-top svg{color:#5085b8}.stat-amber .stat-top svg{color:#ba8b33}.stat-purple .stat-top svg{color:#8e72b4}.dashboard-stat>strong{display:block;color:#23352b;font:700 25px 'Manrope',sans-serif;margin:11px 0 3px}.dashboard-stat>small{font-size:9px;color:#8a958e}.dashboard-content-grid{display:grid;grid-template-columns:1.55fr 1fr;gap:12px}.dashboard-card{background:white;border:1px solid #e6ebe7;border-radius:9px;padding:18px}.dashboard-card-head{display:flex;justify-content:space-between;align-items:center;color:#3d805c}.dashboard-card h2{color:#26372e;font:700 15px 'Manrope',sans-serif;margin:8px 0 0}.shortcut-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:16px}.shortcut-link{display:flex;align-items:center;gap:9px;border:1px solid #edf1ed;border-radius:7px;padding:11px;color:#839087;text-decoration:none}.shortcut-link:hover{border-color:#b8d7c3;background:#f8fbf8}.shortcut-icon{width:29px;height:29px;display:grid;place-items:center;flex:0 0 auto;background:#eef6f0;color:#37805a;border-radius:6px}.shortcut-copy{display:flex;flex-direction:column;gap:4px;flex:1;min-width:0}.shortcut-copy strong{color:#34443a;font-size:10px}.shortcut-copy small{color:#89958d;font-size:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.dashboard-insight{position:relative;background:#1d3026;color:white;overflow:hidden}.dashboard-insight .dashboard-kicker{color:#9cb7a5}.insight-orb{width:38px;height:38px;border-radius:10px;display:grid;place-items:center;background:#2c6548;color:#a6e2bb;margin-bottom:15px}.dashboard-insight h2{font-size:17px;color:white;margin-top:10px}.dashboard-insight>p{font-size:10px;line-height:1.7;color:#c1d0c6;margin:9px 0 12px}.insight-link{display:inline-flex;align-items:center;gap:5px;color:#9be0b2;text-decoration:none;font-size:10px;font-weight:600}.insight-note{display:flex;gap:7px;align-items:flex-start;color:#9cb1a3;font-size:8px;line-height:1.6;border-top:1px solid #3c5145;margin-top:15px;padding-top:12px}.insight-note svg{flex:0 0 auto}.dashboard-data-note{display:flex;align-items:center;gap:12px;margin-top:12px;padding:12px 14px;background:#f0f5f1;border-radius:7px;color:#758078;font-size:9px}.dashboard-data-note strong{color:#425449;white-space:nowrap}.dashboard-data-note span{flex:1}.dashboard-data-note a{display:flex;align-items:center;gap:5px;color:#337b55;text-decoration:none;white-space:nowrap;font-weight:600}
        @media(max-width:850px){.dashboard-stat-grid{grid-template-columns:repeat(2,1fr)}.dashboard-content-grid{grid-template-columns:1fr}.dashboard-data-note{align-items:flex-start;flex-wrap:wrap}.dashboard-data-note span{flex-basis:100%;order:3}}
        @media(max-width:520px){.dashboard-page{padding:0}.dashboard-heading{align-items:flex-start;flex-direction:column}.dashboard-heading h1{font-size:24px}.dashboard-stat{padding:12px}.dashboard-stat>strong{font-size:21px}.shortcut-grid{grid-template-columns:1fr}.dashboard-data-note a{white-space:normal}}
      `}</style>
    </div>
  );
}
