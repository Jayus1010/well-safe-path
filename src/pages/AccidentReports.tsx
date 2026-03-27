import { useState } from "react";
import { Car, Plus, MapPin, User, Calendar, Users, AlertTriangle, FileDown, Fish, HelpCircle, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; // Import Textarea untuk kronologi
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AccidentReport, Status, Priority, getStatusVariant, getStatusLabel, getPriorityColor } from "@/lib/k3-data";
import { accidentReports as initialReports } from "@/lib/k3-data";
import { AccidentClassificationData, classificationLabels, injuryTypeLabels, bodyPartLabels, causeLabels, agentLabels, getClassificationBadgeVariant, InjuryType, BodyPart, AccidentCause, AgentOfAccident, AccidentClassification } from "@/lib/k3-classification";
import { Investigation } from "@/lib/investigation-types";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { useToast } from "@/hooks/use-toast";
import { exportAccidentReportsPDF } from "@/lib/pdf-export";
import InvestigationDialog from "@/components/InvestigationDialog";

interface ExtendedAccident extends AccidentReport {
  description?: string; // Tambahan field deskripsi awal
  classificationData?: AccidentClassificationData;
  investigation?: Investigation;
}

const AccidentReports = () => {
  const [reports, setReports] = useLocalStorage<ExtendedAccident[]>("k3-accidents", initialReports);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ExtendedAccident | null>(null);
  const [investigationTarget, setInvestigationTarget] = useState<ExtendedAccident | null>(null);
  const { toast } = useToast();

  const handleStatusChange = (id: string, newStatus: Status) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    toast({ title: "Status diperbarui", description: `Kasus ${id} diubah ke ${getStatusLabel(newStatus)}` });
  };

  // HANDLER LAPORAN AWAL (Flash Report) - Data minimalis
  const handleAddInitialReport = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const newReport: ExtendedAccident = {
      id: `ACC-${String(reports.length + 1).padStart(3, "0")}`,
      title: form.get("title") as string,
      location: form.get("location") as string,
      date: form.get("date") as string,
      severity: form.get("severity") as Priority,
      status: "open",
      injuredCount: parseInt(form.get("injuredCount") as string) || 0,
      investigator: form.get("investigator") as string,
      description: form.get("description") as string,
      // Klasifikasi dikosongkan dulu, diisi saat investigasi
    };
    setReports(prev => [newReport, ...prev]);
    setDialogOpen(false);
    toast({ title: "Laporan Awal Diterima", description: `Segera lakukan investigasi untuk ${newReport.id}` });
  };

  // HANDLER SIMPAN DATA FINAL (Investigasi + Klasifikasi)
  const handleSaveInvestigation = (investigation: Investigation) => {
    if (!investigationTarget) return;
    
    // Di sini kita bisa menambahkan logika untuk mengisi classificationData secara otomatis atau manual
    setReports(prev => prev.map(r =>
      r.id === investigationTarget.id ? { 
        ...r, 
        investigation, 
        rootCause: investigation.conclusion,
        // Contoh default data final (bisa dikembangkan dengan form input tambahan)
        classificationData: r.classificationData || {
          classification: "sedang",
          injuryType: "luka_gores",
          bodyPart: "tangan",
          cause: "unsafe_act",
          agent: "mesin",
          lostWorkDays: 0,
        }
      } : r
    ));
    setInvestigationTarget(null);
    toast({ title: "Investigasi & Data Final Disimpan", description: `Kasus siap ditinjau untuk penutupan.` });
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Car className="w-7 h-7 text-destructive" />
            Laporan & Investigasi Kecelakaan
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Alur: Laporan Awal (Flash Report) → Investigasi → Data Final</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => exportAccidentReportsPDF(reports)}>
            <FileDown className="w-4 h-4 mr-2" />Export PDF
          </Button>
          
          {/* DIALOG LAPORAN AWAL (FLASH REPORT) */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-destructive hover:bg-destructive/90"><Plus className="w-4 h-4 mr-2" />Lapor Kejadian (Flash)</Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-lg">
              <DialogHeader><DialogTitle>Flash Report - Laporan Awal Kecelakaan</DialogTitle></DialogHeader>
              <form onSubmit={handleAddInitialReport} className="space-y-4">
                <div><Label>Judul Kejadian / Judul Kecelakaan</Label><Input name="title" placeholder="Contoh: Terjepit mesin conveyor" required className="mt-1" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Lokasi Kejadian</Label><Input name="location" required className="mt-1" /></div>
                  <div><Label>Tanggal & Waktu</Label><Input name="date" type="datetime-local" required className="mt-1" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Jumlah Korban</Label><Input name="injuredCount" type="number" min="0" defaultValue="0" className="mt-1" /></div>
                  <div><Label>Pelapor Awal</Label><Input name="investigator" placeholder="Nama Pelapor" required className="mt-1" /></div>
                </div>
                <div>
                  <Label>Estimasi Keparahan Awal</Label>
                  <Select name="severity" defaultValue="medium">
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low (P3K)</SelectItem>
                      <SelectItem value="medium">Medium (Rawat Jalan)</SelectItem>
                      <SelectItem value="high">High (Cacat/Rawat Inap)</SelectItem>
                      <SelectItem value="critical">Critical (Fatality)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Kronologi Singkat Kejadian</Label>
                  <Textarea name="description" placeholder="Ceritakan singkat kronologi kejadian di lapangan..." className="mt-1 h-24" />
                </div>
                <div className="bg-secondary/20 p-3 rounded-md text-[10px] text-muted-foreground italic">
                  *Data investigasi mendalam (Root Cause, Hari Hilang, Klasifikasi ILO) dilakukan pada tahap selanjutnya.
                </div>
                <Button type="submit" className="w-full">Kirim Laporan Awal</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* LIST LAPORAN */}
      <div className="grid gap-4">
        {reports.map(report => (
          <Card key={report.id} className="glass-card hover:border-primary/30 transition-colors cursor-pointer"
            onClick={() => setSelectedReport(selectedReport?.id === report.id ? null : report)}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs font-mono text-muted-foreground">{report.id}</span>
                    <Badge variant={getStatusVariant(report.status)}>{getStatusLabel(report.status)}</Badge>
                    <span className={`text-xs font-semibold uppercase ${getPriorityColor(report.severity)}`}>
                      <AlertTriangle className="w-3 h-3 inline mr-1" />{report.severity}
                    </span>
                    {report.investigation && <Badge className="bg-blue-600">Investigasi Selesai</Badge>}
                  </div>
                  <h3 className="font-semibold text-lg">{report.title}</h3>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{report.location}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{report.date}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{report.injuredCount} Korban</span>
                  </div>
                </div>

                {/* TOMBOL AKSI BERDASARKAN STATUS */}
                <div className="flex gap-2 ml-4" onClick={e => e.stopPropagation()}>
                  {report.status === "open" && (
                    <Button size="sm" variant="outline" className="border-primary text-primary" onClick={() => handleStatusChange(report.id, "in_progress")}>
                      Mulai Investigasi
                    </Button>
                  )}
                  {report.status === "in_progress" && !report.investigation && (
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => setInvestigationTarget(report)}>
                      <Fish className="w-3 h-3 mr-1" />Analisis Root Cause
                    </Button>
                  )}
                  {report.status === "in_progress" && report.investigation && (
                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleStatusChange(report.id, "closed")}>
                      Tutup Kasus (Final)
                    </Button>
                  )}
                </div>
              </div>

              {/* DETAIL EXPANSION */}
              {selectedReport?.id === report.id && (
                <div className="mt-4 pt-4 border-t border-border space-y-4 animate-in slide-in-from-top-2">
                  
                  {/* Kronologi Awal */}
                  <div className="bg-secondary/10 p-3 rounded-lg border-l-4 border-destructive">
                    <p className="text-sm font-bold flex items-center gap-1"><FileText className="w-4 h-4" /> Kronologi Awal:</p>
                    <p className="text-sm text-muted-foreground mt-1">{report.description || "Tidak ada deskripsi tambahan."}</p>
                  </div>

                  {/* Jika sudah ada data investigasi, tampilkan Klasifikasi K3 */}
                  {report.classificationData && (
                    <div className="bg-secondary/30 rounded-lg p-3">
                      <p className="text-sm font-semibold mb-2">Data Final (PP 50/2012 & ILO)</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                        <div className="bg-background p-2 rounded shadow-sm"><span className="text-muted-foreground block">Klasifikasi:</span> <b>{classificationLabels[report.classificationData.classification]}</b></div>
                        <div className="bg-background p-2 rounded shadow-sm"><span className="text-muted-foreground block">Jenis Cedera:</span> <b>{injuryTypeLabels[report.classificationData.injuryType]}</b></div>
                        <div className="bg-background p-2 rounded shadow-sm"><span className="text-muted-foreground block">Bagian Tubuh:</span> <b>{bodyPartLabels[report.classificationData.bodyPart]}</b></div>
                        <div className="bg-background p-2 rounded shadow-sm"><span className="text-muted-foreground block">Agen Penyebab:</span> <b>{agentLabels[report.classificationData.agent]}</b></div>
                        <div className="bg-background p-2 rounded shadow-sm text-destructive"><span className="text-muted-foreground block">Hari Hilang:</span> <b>{report.classificationData.lostWorkDays} Hari</b></div>
                      </div>
                    </div>
                  )}

                  {/* Hasil Analisis Root Cause */}
                  {report.investigation && (
                    <div className="bg-blue-50/10 border border-blue-500/30 rounded-lg p-3">
                      <p className="text-sm font-bold text-blue-400 mb-2 flex items-center gap-2">
                        {report.investigation.method === "fishbone" ? <Fish className="w-4 h-4"/> : <HelpCircle className="w-4 h-4"/>}
                        Hasil Analisis {report.investigation.method === "fishbone" ? "Fishbone" : "5-Why"}
                      </p>
                      <p className="text-xs font-medium">Akar Masalah:</p>
                      <p className="text-sm italic text-muted-foreground">"{report.investigation.conclusion}"</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* MODAL INVESTIGASI (Fishbone/5-Why) */}
      {investigationTarget && (
        <InvestigationDialog
          open={!!investigationTarget}
          onOpenChange={(open) => { if (!open) setInvestigationTarget(null); }}
          accidentTitle={investigationTarget.title}
          onSave={handleSaveInvestigation}
        />
      )}
    </div>
  );
};

export default AccidentReports;
