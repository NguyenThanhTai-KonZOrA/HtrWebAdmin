import DashboardLayout from '../components/layout/DashboardLayout';
import NotificationManager from '../components/NotificationManager';
import type { ReactNode } from "react";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <DashboardLayout>
      {children}
      <NotificationManager />
    </DashboardLayout>
  );
}
