import { Outlet, Link, useLocation } from 'react-router-dom';

export function MainLayout() {
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'CRM', path: '/crm' },
    { name: 'Customer', path: '/customer' },
    { name: 'RFQ', path: '/rfq' },
    { name: 'BOM AI', path: '/bom-ai' },
    { name: 'PCB AI', path: '/pcb-ai' },
    { name: 'Harness AI', path: '/harness-ai' },
    { name: 'AI Chat', path: '/ai-chat' },
    { name: 'Costing', path: '/costing' },
    { name: 'Supplier', path: '/supplier' },
    { name: 'Competitor', path: '/competitor' },
    { name: 'Settings', path: '/settings' },
  ];

  return (
    <div className="flex h-screen bg-slate-100 font-sans">
      {/* Sidebar màu tối */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col justify-between p-4 shrink-0 shadow-lg">
        <div>
          <div className="text-xl font-bold text-sky-400 px-3 py-2 mb-4 tracking-wide">
            AI Business
          </div>
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}