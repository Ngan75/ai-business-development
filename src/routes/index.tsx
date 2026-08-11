import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';

// Import tất cả các trang
import DashboardPage from '../modules/dashboard/Page';
import CRMPage from '../modules/crm/Page';
import CustomerPage from '../modules/customer/Page';
import RFQPage from '../modules/rfq/Page';
import BOMAIPage from '../modules/bom-ai/Page';
import PCBAIPage from '../modules/pcb-ai/Page';
import HarnessAIPage from '../modules/harness-ai/Page';
import AIChatPage from '../modules/ai-chat/Page';
import CostingPage from '../modules/costing/CostingPage'; // Nếu file bạn tạo tên là CostingPage.tsx
// HOẶC nếu file bạn đặt tên là Page.tsx thì dùng dòng dưới:
// import CostingPage from '../modules/costing/Page'; 
import SupplierPage from '../modules/supplier/Page';
import CompetitorPage from '../modules/competitor/Page';
import SettingsPage from '../modules/settings/Page';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        path: '/',
        element: <Navigate to="/dashboard" replace />,
      },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'crm', element: <CRMPage /> },
      { path: 'customer', element: <CustomerPage /> },
      { path: 'rfq', element: <RFQPage /> },
      { path: 'bom-ai', element: <BOMAIPage /> },
      { path: 'pcb-ai', element: <PCBAIPage /> },
      { path: 'harness-ai', element: <HarnessAIPage /> },
      { path: 'ai-chat', element: <AIChatPage /> },
      { path: 'costing', element: <CostingPage /> },
      { path: 'supplier', element: <SupplierPage /> },
      { path: 'competitor', element: <CompetitorPage /> },
      { path: 'settings', element: <SettingsPage /> },
      {
        path: '*',
        element: <div className="p-4 text-slate-500">Module đang được phát triển...</div>,
      },
    ],
  },
]);