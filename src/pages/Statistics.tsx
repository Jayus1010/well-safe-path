import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, PieChart as PieIcon, BarChart3, Activity } from "lucide-react";
import { hazardReports, inspections, workPermits, accidentReports } from "@/lib/k3-data";

const CHART_COLORS = ["hsl(38, 92%, 50%)", "hsl(199, 89%, 48%)", "hsl(142, 71%, 45%)", "hsl(0, 72%, 51%)", "hsl(280, 65%, 60%)"];

const statusData = [
  { name: "Open", bahaya: hazardReports.filter(r => r.status === "open").length, kecelakaan: accidentReports.filter(r => r.status === "open").length },
  { name: "In Progress", bahaya: hazardReports.filter(r => r.status === "in_progress").length, kecelakaan: accidentReports.filter(r => r.status === "in_progress").length },
  { name: "Closed", bahaya: hazardReports.filter(r => r.status === "closed").length, kecelakaan: accidentReports.filter(r => r.status === "closed").length },
];

const priorityData = [
  { name: "Low", value: hazardReports.filter(r => r.priority === "low").length },
  { name: "Medium", value: hazardReports.filter(r => r.priority === "medium").length },
  { name: "High", value: hazardReports.filter(r => r.priority === "high").length },
  { name: "Critical", value: hazardReports.filter(r => r.priority === "critical").length },
].filter(d => d.value > 0);

const inspectionScores = inspections.filter(i => i.score > 0).map(i => ({
  name: i.id,
  skor: i.score,
  temuan: i.findings,
}));

const monthlyTrend = [
  { bulan: "Jan", bahaya: 3, kecelakaan: 1, inspeksi: 2 },
  { bulan: "Feb", bahaya: 5, kecelakaan: 2, inspeksi: 3 },
  { bulan: "Mar", bahaya: hazardReports.length, kecelakaan: accidentReports.length, inspeksi: inspections.length },
];

const permitTypeData = (() => {
  const counts: Record<string, number> = {};
  workPermits.forEach(p => { counts[p.type] = (counts[p.type] || 0) + 1; });
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
})();

const severityTrend = [
  { bulan: "Jan", ringan: 1, sedang: 0, berat: 0 },
  { bulan: "Feb", ringan: 0, sedang: 1, berat: 1 },
  { bulan: "Mar", ringan: accidentReports.filter(a => a.severity === "low" || a.severity === "medium").length, sedang: accidentReports.filter(a => a.severity === "high").length, berat: accidentReports.filter(a => a.severity === "critical").length },
];

const Statistics = () => {
  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="w-7 h-7 text-primary" />
          Statistik K3
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Analisis dan visualisasi data keselamatan kerja</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Insiden", value: hazardReports.length + accidentReports.length, color: "text-warning" },
          { label: "Rata-rata Skor Inspeksi", value: `${Math.round(inspections.filter(i => i.score > 0).reduce((s, i) => s + i.score, 0) / inspections.filter(i => i.score > 0).length)}%`, color: "text-success" },
          { label: "Ijin Kerja Aktif", value: workPermits.filter(p => p.status !== "closed").length, color: "text-info" },
          { label: "Kasus Terbuka", value: accidentReports.filter(a => a.status !== "closed").length + hazardReports.filter(h => h.status !== "closed").length, color: "text-destructive" },
        ].map(s => (
          <Card key={s.label} className="glass-card">
            <CardContent className="p-4 text-center">
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Activity className="w-5 h-5 text-primary" />Tren Bulanan</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={monthlyTrend}>
                <defs>
                  <linearGradient id="gradBahaya" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradKecelakaan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(216, 20%, 25%)" />
                <XAxis dataKey="bulan" stroke="hsl(215, 15%, 55%)" fontSize={12} />
                <YAxis stroke="hsl(215, 15%, 55%)" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(216, 25%, 15%)", border: "1px solid hsl(216, 20%, 25%)", borderRadius: "8px", color: "hsl(210, 40%, 96%)" }} />
                <Legend />
                <Area type="monotone" dataKey="bahaya" stroke="hsl(38, 92%, 50%)" fill="url(#gradBahaya)" strokeWidth={2} />
                <Area type="monotone" dataKey="kecelakaan" stroke="hsl(0, 72%, 51%)" fill="url(#gradKecelakaan)" strokeWidth={2} />
                <Area type="monotone" dataKey="inspeksi" stroke="hsl(199, 89%, 48%)" fill="hsl(199, 89%, 48%)" fillOpacity={0.1} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><BarChart3 className="w-5 h-5 text-info" />Distribusi Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(216, 20%, 25%)" />
                <XAxis dataKey="name" stroke="hsl(215, 15%, 55%)" fontSize={12} />
                <YAxis stroke="hsl(215, 15%, 55%)" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(216, 25%, 15%)", border: "1px solid hsl(216, 20%, 25%)", borderRadius: "8px", color: "hsl(210, 40%, 96%)" }} />
                <Legend />
                <Bar dataKey="bahaya" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="kecelakaan" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><PieIcon className="w-5 h-5 text-warning" />Distribusi Prioritas Bahaya</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={priorityData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {priorityData.map((_, index) => (
                    <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "hsl(216, 25%, 15%)", border: "1px solid hsl(216, 20%, 25%)", borderRadius: "8px", color: "hsl(210, 40%, 96%)" }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Inspection Scores */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><BarChart3 className="w-5 h-5 text-success" />Skor Inspeksi</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={inspectionScores}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(216, 20%, 25%)" />
                <XAxis dataKey="name" stroke="hsl(215, 15%, 55%)" fontSize={12} />
                <YAxis stroke="hsl(215, 15%, 55%)" fontSize={12} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(216, 25%, 15%)", border: "1px solid hsl(216, 20%, 25%)", borderRadius: "8px", color: "hsl(210, 40%, 96%)" }} />
                <Bar dataKey="skor" radius={[4, 4, 0, 0]}>
                  {inspectionScores.map((entry, index) => (
                    <Cell key={index} fill={entry.skor >= 80 ? "hsl(142, 71%, 45%)" : entry.skor >= 60 ? "hsl(38, 92%, 50%)" : "hsl(0, 72%, 51%)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Permit Types */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><PieIcon className="w-5 h-5 text-primary" />Jenis Ijin Kerja</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={permitTypeData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {permitTypeData.map((_, index) => (
                    <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "hsl(216, 25%, 15%)", border: "1px solid hsl(216, 20%, 25%)", borderRadius: "8px", color: "hsl(210, 40%, 96%)" }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Severity Trend */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Activity className="w-5 h-5 text-destructive" />Tren Severity Kecelakaan</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={severityTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(216, 20%, 25%)" />
                <XAxis dataKey="bulan" stroke="hsl(215, 15%, 55%)" fontSize={12} />
                <YAxis stroke="hsl(215, 15%, 55%)" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(216, 25%, 15%)", border: "1px solid hsl(216, 20%, 25%)", borderRadius: "8px", color: "hsl(210, 40%, 96%)" }} />
                <Legend />
                <Line type="monotone" dataKey="ringan" stroke="hsl(199, 89%, 48%)" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="sedang" stroke="hsl(38, 92%, 50%)" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="berat" stroke="hsl(0, 72%, 51%)" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Statistics;
