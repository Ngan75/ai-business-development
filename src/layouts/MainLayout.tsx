import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Activity, Bot, Boxes, Building2, Cable, ChartNoAxesCombined, ChevronLeft, ChevronRight, Cpu, Factory, FileText, LayoutDashboard, Menu, PackageSearch, Settings, Users, X } from 'lucide-react';

const menuItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, group: 'WORKSPACE' },
  { name: 'CRM', path: '/crm', icon: Users, group: 'WORKSPACE' },
  { name: 'Customer', path: '/customer', icon: Building2, group: 'WORKSPACE' },
  { name: 'RFQ', path: '/rfq', icon: FileText, group: 'WORKSPACE' },
  { name: 'BOM AI', path: '/bom-ai', icon: Boxes, group: 'ENGINEERING' },
  { name: 'PCB AI', path: '/pcb-ai', icon: Cpu, group: 'ENGINEERING' },
  { name: 'Harness AI', path: '/harness-ai', icon: Cable, group: 'ENGINEERING' },
  { name: 'AI Chat', path: '/ai-chat', icon: Bot, group: 'TOOLS' },
  { name: 'Costing', path: '/costing', icon: ChartNoAxesCombined, group: 'TOOLS' },
  { name: 'Supplier', path: '/supplier', icon: PackageSearch, group: 'TOOLS' },
  { name: 'Competitor', path: '/competitor', icon: Activity, group: 'TOOLS' },
  { name: 'Settings', path: '/settings', icon: Settings, group: 'SYSTEM' },
];

export function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const currentPage = menuItems.find((item) => location.pathname === item.path)?.name ?? 'AI Sales Development';
  const groups = [...new Set(menuItems.map((item) => item.group))];

  return (
    <div className={`app-shell ${collapsed ? 'app-shell-collapsed' : ''}`}>
      {mobileOpen && <button className="sidebar-backdrop" aria-label="Đóng menu" onClick={() => setMobileOpen(false)} />}
      <aside className={`app-sidebar ${mobileOpen ? 'app-sidebar-mobile-open' : ''}`}>
        <div className="brand-row">
          <div className="brand-mark"><Factory size={19} strokeWidth={2.2} /></div>
          {!collapsed && <div className="brand-name">AI <span>SALES</span><small>DEVELOPMENT PLATFORM</small></div>}
          <button className="mobile-close" aria-label="Đóng menu" onClick={() => setMobileOpen(false)}><X size={18} /></button>
        </div>
        <div className="workspace-chip"><span className="workspace-avatar">N</span>{!collapsed && <><span className="workspace-copy"><strong>Ngan75 Workspace</strong><small>Manufacturing</small></span><ChevronRight size={14} /></>}</div>
        <nav className="app-nav" aria-label="Điều hướng chính">
          {groups.map((group) => <div className="nav-group" key={group}>
            {!collapsed && <div className="nav-group-label">{group}</div>}
            {menuItems.filter((item) => item.group === group).map(({ name, path, icon: Icon }) => <NavLink key={path} to={path} title={collapsed ? name : undefined} onClick={() => setMobileOpen(false)} className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}>
              <Icon size={17} strokeWidth={1.8} /><span>{name}</span>{name === 'Costing' && !collapsed && <span className="nav-tag">NEW</span>}
            </NavLink>)}
          </div>)}
        </nav>
        <div className="sidebar-bottom"><div className="user-avatar">ND</div>{!collapsed && <div className="user-copy"><strong>Ngan Dinh</strong><small>Sales engineer</small></div>}{!collapsed && <span className="online-dot" title="Đang hoạt động" />}</div>
      </aside>
      <div className="app-main">
        <header className="app-topbar"><button className="mobile-menu-button" aria-label="Mở menu" onClick={() => setMobileOpen(true)}><Menu size={19} /></button><div className="breadcrumb"><span>Workspace</span><ChevronRight size={14} /><strong>{currentPage}</strong></div><div className="topbar-right"><span className="system-status"><i /> Local workspace</span><button className="collapse-button" title={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'} aria-label={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'} onClick={() => setCollapsed(!collapsed)}>{collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}</button></div></header>
        <main className="app-content"><Outlet /></main>
        <footer className="app-footer"><span>AI Sales Development</span><span>Prototype · dữ liệu lưu trên thiết bị hiện tại</span></footer>
      </div>
    </div>
  );
}
