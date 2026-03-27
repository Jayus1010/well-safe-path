import { useState } from "react";
import { AlertTriangle, Plus, MapPin, User, Calendar, FileDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { HazardReport, Status, Priority, getStatusVariant, getStatusLabel, getPriorityColor } from "@/lib/k3-data";
import { hazardReports as initialReports } from "@/lib/k3-data";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { useToast } from "@/hooks/use-toast";
import { exportHazardReportsPDF } from "@/lib/pdf-export";

const HazardReports = () => {
  const [reports, setReports] = useLocalStorage<HazardReport[]>("k3-hazards", initialReports);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<HazardReport | null>(null);
  const { toast } = useToast();

  const filtered = filterStatus === "all" ? reports : reports.filter(r => r.status === filterStatus);

  const handleStatusChange = (id: string, newStatus: Status) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    toast({ title: "Status diperbarui", description: `Laporan ${id} diubah ke ${getStatusLabel(newStatus)}` });
  };

  const handleAddReport = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const newReport: HazardReport = {
      id: `HZR-${String(reports.length + 1).padStart(3, "0")}`,
      title: form.get("title") as string,
      location: form.get("location") as string,
      description: form.get("description") as string,
      reportedBy: form.get("reportedBy") as string,
      reportedAt: new Date().toISOString().split("T")[0],
      status: "open",
      priority: form.get("priority") as Priority,
      actions: [],
    };
    setReports(prev => [newReport, ...prev]);
    setDialogOpen(false);
    toast({ title: "Laporan ditambahkan", description: `${newReport.id} berhasil dibuat` });
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="w-7 h-7 text-warning" />
            Laporan Kondisi Bahaya
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Kelola laporan bahaya sampai ditutup</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => exportHazardReportsPDF(reports)}>
            <FileDown className="w-4 h-4 mr-2" />PDF
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" />Buat Laporan</Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader><DialogTitle>Laporan Bahaya Baru</DialogTitle></DialogHeader>
              <form onSubmit={handleAddReport} className="space-y-4">
                <div><Label>Judul</Label><Input name="title" required className="mt-1" /></div>
                <div><Label>Lokasi</Label><Input name="location" required className="mt-1" /></div>
                <div><Label>Deskripsi</Label><Textarea name="description" required className="mt-1" /></div>
                <div><Label>Dilaporkan oleh</Label><Input name="reportedBy" required className="mt-1" /></div>
                <div>
                  <Label>Prioritas</Label>
                  <Select name="priority" defaultValue="medium">
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">Simpan Laporan</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["all", "open", "in_progress", "closed"].map(s => (
          <Button key={s} variant={filterStatus === s ? "default" : "secondary"} size="sm"
            onClick={() => setFilterStatus(s)}>
            {s === "all" ? "Semua" : getStatusLabel(s as Status)}
          </Button>
        ))}
      </div>

      <div className="grid gap-4">
        {filtered.map(report => (
          <Card key={report.id} className="glass-card hover:border-primary/30 transition-colors cursor-pointer"
            onClick={() => setSelectedReport(selectedReport?.id === report.id ? null : report)}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="text-xs font-mono text-muted-foreground">{report.id}</span>
                    <Badge variant={getStatusVariant(report.status)}>{getStatusLabel(report.status)}</Badge>
                    <span className={`text-xs font-semibold uppercase ${getPriorityColor(report.priority)}`}>{report.priority}</span>
                  </div>
                  <h3 className="font-semibold text-base">{report.title}</h3>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{report.location}</span>
                    <span className="flex items-center gap-1"><User className="w-3 h-3" />{report.reportedBy}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{report.reportedAt}</span>
                  </div>
                </div>
                {report.status !== "closed" && (
                  <div className="flex gap-2 ml-4" onClick={e => e.stopPropagation()}>
                    {report.status === "open" && (
                      <Button size="sm" variant="secondary" onClick={() => handleStatusChange(report.id, "in_progress")}>Proses</Button>
                    )}
                    {report.status === "in_progress" && (
                      <Button size="sm" onClick={() => handleStatusChange(report.id, "closed")}>Tutup</Button>
                    )}
                  </div>
                )}
              </div>
              {selectedReport?.id === report.id && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-2">{report.description}</p>
                  {report.actions.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-1">Tindakan:</p>
                      <ul className="list-disc list-inside text-sm text-muted-foreground">
                        {report.actions.map((a, i) => <li key={i}>{a}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default HazardReports;
