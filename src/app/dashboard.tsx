'use client';
import dynamic from 'next/dynamic';
const DashboardShell = dynamic(() => import('@/components/dashboard/DashboardShell'), { ssr: false });
export default function Dashboard(props: { isDark: boolean; toggleTheme: () => void; onLogout: () => void }) {
  return <DashboardShell {...props} />;
}
