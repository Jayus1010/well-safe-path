import { useState, useMemo } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Shield, AlertTriangle, ClipboardCheck, FileKey, Car, LayoutDashboard, BarChart3 } from "lucide-react";
import NotificationBell from "./NotificationBell";
import { generateNotifications, Notification } from "@/lib/notifications";
import { hazardReports, inspections, workPermits, accidentReports } from "@/lib/k3-data";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/hazard-reports", icon: AlertTriangle, label: "Laporan Bahaya" },
  { to: "/inspections", icon: ClipboardCheck, label: "Inspeksi" },
  { to: "/work-permits", icon: FileKey, label: "Ijin Kerja" },
  { to: "/accidents", icon: Car, label: "Kecelakaan" },
  { to: "/statistics", icon: BarChart3, label: "Statistik" },
];

const AppLayout = () => {
  const initialNotifs = useMemo(() => generateNotifications(hazardReports, workPermits, accidentReports, inspections), []);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifs);

  const markRead = (id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col shrink-0">
        <div className="p-5 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-sidebar-accent-foreground">SafetyPro</h1>
              <p className="text-xs text-sidebar-foreground">K3 Management</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          <p className="text-xs text-sidebar-foreground text-center">© 2026 SafetyPro K3</p>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="flex justify-end p-3 border-b border-border">
          <NotificationBell notifications={notifications} onMarkRead={markRead} onMarkAllRead={markAllRead} />
        </div>
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
