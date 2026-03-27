import { useState } from "react";
import { Car, Plus, MapPin, User, Calendar, Users, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AccidentReport, Status, Priority, getStatusVariant, getStatusLabel, getPriorityColor } from "@/lib/k3-data";
import { accidentReports as initialReports } from "@/lib/k3-data";
import { useToast } from "@/hooks/use-toast";

const AccidentReports = () => {
  const [reports, setReports] = useState<AccidentReport[]>(initialReports);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<AccidentReport | null>(null);
  const { toast } = useToast();

  const handleStatusChange = (id: string, newStatus: Status) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    toast({ title: "Status diperbarui", description: `Kasus ${id} diubah ke ${getStatusLabel(newStatus)}` });
  };

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const newReport: AccidentReport = {
      id: `ACC-${String(reports.length + 1).padStart(3, "0")}`,
      title: form.get("title") as string,
      location: form.get("location") as string,
      date: form.get("date") as string,
      severity: form.get("severity") as Priority,
      status: "open",
      injuredCount: parseInt(form.get("injuredCount") as string) || 0,
      investigator: form.get("investigator") as string,
    };
    setReports(prev => [newReport, ...prev]);
    setDialogOpen(false);
    toast({ title: "Laporan kecelakaan dibuat", description: `${newReport.id} memerlukan investigasi` });
  };

  const handleAddRootCause = (id: string) => {
    const cause = prompt("Masukkan root cause analysis:");
    if (cause) {
      setReports(prev => prev.map(r => r.id === id ? { ...r, rootCause: cause } : r));
      toast({ title: "Root cause ditambahkan" });
    }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Car className="w-7 h-7 text-destructive" />
            Investigasi Kecelakaan
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Laporan dan investigasi kecelakaan kerja</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Laporkan Kecelakaan</Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle>Laporan Kecelakaan Baru</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div><Label>Judul Kejadian</Label><Input name="title" required className="mt-1" /></div>
              <div><Label>Lokasi</Label><Input name="location" required className="mt-1" /></div>
              <div><Label>Tanggal</Label><Input name="date" type="date" required className="mt-1" /></div>
              <div><Label>Jumlah Korban</Label><Input name="injuredCount" type="number" min="0" defaultValue="0" className="mt-1" /></div>
              <div><Label>Investigator</Label><Input name="investigator" required className="mt-1" /></div>
              <div>
                <Label>Severity</Label>
                <Select name="severity" defaultValue="medium">
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

      <div className="grid gap-4">
        {reports.map(report => (
          <Card key={report.id} className="glass-card hover:border-primary/30 transition-colors cursor-pointer"
            onClick={() => setSelectedReport(selectedReport?.id === report.id ? null : report)}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-mono text-muted-foreground">{report.id}</span>
                    <Badge variant={getStatusVariant(report.status)}>{getStatusLabel(report.status)}</Badge>
                    <span className={`text-xs font-semibold uppercase ${getPriorityColor(report.severity)}`}>
                      <AlertTriangle className="w-3 h-3 inline mr-1" />{report.severity}
                    </span>
                  </div>
                  <h3 className="font-semibold text-base">{report.title}</h3>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{report.location}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{report.date}</span>
                    <span className="flex items-center gap-1"><User className="w-3 h-3" />{report.investigator}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{report.injuredCount} korban</span>
                  </div>
                </div>
                {report.status !== "closed" && (
                  <div className="flex gap-2 ml-4" onClick={e => e.stopPropagation()}>
                    {report.status === "open" && (
                      <Button size="sm" variant="secondary" onClick={() => handleStatusChange(report.id, "in_progress")}>
                        Investigasi
                      </Button>
                    )}
                    {report.status === "in_progress" && !report.rootCause && (
                      <Button size="sm" variant="secondary" onClick={() => handleAddRootCause(report.id)}>
                        Root Cause
                      </Button>
                    )}
                    {report.status === "in_progress" && report.rootCause && (
                      <Button size="sm" onClick={() => handleStatusChange(report.id, "closed")}>
                        Tutup Kasus
                      </Button>
                    )}
                  </div>
                )}
              </div>
              {selectedReport?.id === report.id && (
                <div className="mt-4 pt-4 border-t border-border space-y-3">
                  <div>
                    <p className="text-sm font-medium">Status Investigasi</p>
                    <div className="flex items-center gap-2 mt-2">
                      {["open", "in_progress", "closed"].map((s, i) => (
                        <div key={s} className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            (s === "open" && ["open", "in_progress", "closed"].includes(report.status)) ||
                            (s === "in_progress" && ["in_progress", "closed"].includes(report.status)) ||
                            (s === "closed" && report.status === "closed")
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-muted-foreground"
                          }`}>{i + 1}</div>
                          {i < 2 && <div className={`w-12 h-0.5 ${
                            (s === "open" && ["in_progress", "closed"].includes(report.status)) ||
                            (s === "in_progress" && report.status === "closed")
                              ? "bg-primary" : "bg-secondary"
                          }`} />}
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-6 mt-1 text-xs text-muted-foreground">
                      <span>Lapor</span><span className="ml-4">Investigasi</span><span className="ml-2">Selesai</span>
                    </div>
                  </div>
                  {report.rootCause && (
                    <div>
                      <p className="text-sm font-medium">Root Cause Analysis</p>
                      <p className="text-sm text-muted-foreground mt-1">{report.rootCause}</p>
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

export default AccidentReports;
