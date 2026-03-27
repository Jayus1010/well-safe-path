import { AlertTriangle, ClipboardCheck, FileKey, Car, TrendingUp, ShieldAlert, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { hazardReports, inspections, workPermits, accidentReports, getStatusVariant, getStatusLabel } from "@/lib/k3-data";

const statCards = [
  {
    title: "Laporan Bahaya",
    icon: AlertTriangle,
    value: hazardReports.length,
    open: hazardReports.filter(r => r.status === "open").length,
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
  {
    title: "Inspeksi",
    icon: ClipboardCheck,
    value: inspections.length,
    open: inspections.filter(r => r.status !== "closed").length,
    color: "text-info",
    bgColor: "bg-info/10",
  },
  {
    title: "Ijin Kerja",
    icon: FileKey,
    value: workPermits.length,
    open: workPermits.filter(r => r.status === "pending").length,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    title: "Kecelakaan",
    icon: Car,
    value: accidentReports.length,
    open: accidentReports.filter(r => r.status !== "closed").length,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
  },
];

const Dashboard = () => {
  const recentItems = [
    ...hazardReports.map(h => ({ ...h, type: "Bahaya" as const, date: h.reportedAt })),
    ...accidentReports.map(a => ({ ...a, type: "Kecelakaan" as const })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Dashboard K3</h1>
        <p className="text-muted-foreground text-sm mt-1">Ringkasan keselamatan dan kesehatan kerja</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="glass-card">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    <span className={stat.color}>{stat.open} aktif</span>
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Aktivitas Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentItems.map((item) => (
              <div key={item.id + item.type} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.type} • {item.date}</p>
                </div>
                <Badge variant={getStatusVariant(item.status)}>{getStatusLabel(item.status)}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Safety Score */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-success" />
              Skor Keselamatan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-6">
              <div className="relative w-40 h-40">
                <svg className="w-40 h-40 -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" fill="none" strokeWidth="10" className="stroke-secondary" />
                  <circle cx="60" cy="60" r="50" fill="none" strokeWidth="10" className="stroke-success" strokeDasharray={`${75 * 3.14} ${100 * 3.14}`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-success">75%</span>
                  <span className="text-xs text-muted-foreground">Baik</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="text-center p-3 rounded-lg bg-secondary/50">
                <ShieldAlert className="w-5 h-5 text-warning mx-auto mb-1" />
                <p className="text-lg font-bold">{hazardReports.filter(h => h.status === "open").length}</p>
                <p className="text-xs text-muted-foreground">Bahaya Aktif</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-secondary/50">
                <CheckCircle2 className="w-5 h-5 text-success mx-auto mb-1" />
                <p className="text-lg font-bold">{inspections.filter(i => i.status === "closed").length}</p>
                <p className="text-xs text-muted-foreground">Inspeksi Selesai</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-secondary/50">
                <Clock className="w-5 h-5 text-info mx-auto mb-1" />
                <p className="text-lg font-bold">{workPermits.filter(w => w.status === "pending").length}</p>
                <p className="text-xs text-muted-foreground">Ijin Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
