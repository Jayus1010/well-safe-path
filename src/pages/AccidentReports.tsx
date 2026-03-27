import { useState } from "react";
import { Car, Plus, MapPin, User, Calendar, Users, AlertTriangle, FileDown, Fish, HelpCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
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
      classificationData: {
        classification: form.get("classification") as AccidentClassification,
        injuryType: form.get("injuryType") as InjuryType,
        bodyPart: form.get("bodyPart") as BodyPart,
        cause: form.get("cause") as AccidentCause,
        agent: form.get("agent") as AgentOfAccident,
        lostWorkDays: parseInt(form.get("lostWorkDays") as string) || 0,
      },
    };
    setReports(prev => [newReport, ...prev]);
    setDialogOpen(false);
    toast({ title: "Laporan kecelakaan dibuat", description: `${newReport.id} memerlukan investigasi` });
  };

  const handleSaveInvestigation = (investigation: Investigation) => {
    if (!investigationTarget) return;
    setReports(prev => prev.map(r =>
      r.id === investigationTarget.id ? { ...r, investigation, rootCause: investigation.conclusion } : r
    ));
    setInvestigationTarget(null);
    toast({ title: "Investigasi disimpan", description: `Hasil analisis ${investigation.method === "fishbone" ? "Fishbone" : "5-Why"} berhasil disimpan` });
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Car className="w-7 h-7 text-destructive" />
            Investigasi Kecelakaan
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Laporan, klasifikasi, dan investigasi kecelakaan kerja</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => exportAccidentReportsPDF(reports)}>
            <FileDown className="w-4 h-4 mr-2" />PDF
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" />Laporkan Kecelakaan</Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Laporan Kecelakaan Baru</DialogTitle></DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4">
                <div><Label>Judul Kejadian</Label><Input name="title" required className="mt-1" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Lokasi</Label><Input name="location" required className="mt-1" /></div>
                  <div><Label>Tanggal</Label><Input name="date" type="date" required className="mt-1" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Jumlah Korban</Label><Input name="injuredCount" type="number" min="0" defaultValue="0" className="mt-1" /></div>
                  <div><Label>Investigator</Label><Input name="investigator" required className="mt-1" /></div>
                </div>
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

                {/* Classification Section */}
                <div className="border-t border-border pt-4">
                  <h4 className="font-semibold text-sm mb-3">Klasifikasi Kecelakaan (PP 50/2012 & ILO)</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Klasifikasi</Label>
                      <Select name="classification" defaultValue="sedang">
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(classificationLabels).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Jenis Cedera (ILO)</Label>
                      <Select name="injuryType" defaultValue="luka_gores">
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(injuryTypeLabels).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Bagian Tubuh</Label>
                      <Select name="bodyPart" defaultValue="tangan">
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(bodyPartLabels).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Penyebab</Label>
                      <Select name="cause" defaultValue="unsafe_act">
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(causeLabels).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Agen Kecelakaan (ILO)</Label>
                      <Select name="agent" defaultValue="mesin">
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(agentLabels).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Hari Kerja Hilang</Label>
                      <Input name="lostWorkDays" type="number" min="0" defaultValue="0" className="mt-1" />
                    </div>
                  </div>
                </div>

                <Button type="submit" className="w-full">Simpan Laporan</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

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
                    {report.classificationData && (
                      <Badge variant={getClassificationBadgeVariant(report.classificationData.classification)}>
                        {classificationLabels[report.classificationData.classification]}
                      </Badge>
                    )}
                    {report.investigation && (
                      <Badge variant="closed" className="text-xs">
                        {report.investigation.method === "fishbone" ? <Fish className="w-3 h-3 mr-1 inline" /> : <HelpCircle className="w-3 h-3 mr-1 inline" />}
                        {report.investigation.method === "fishbone" ? "Fishbone" : "5-Why"}
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-semibold text-base">{report.title}</h3>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{report.location}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{report.date}</span>
                    <span className="flex items-center gap-1"><User className="w-3 h-3" />{report.investigator}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{report.injuredCount} korban</span>
                  </div>
                </div>
                {report.status !== "closed" && (
                  <div className="flex gap-2 ml-4 flex-wrap" onClick={e => e.stopPropagation()}>
                    {report.status === "open" && (
                      <Button size="sm" variant="secondary" onClick={() => handleStatusChange(report.id, "in_progress")}>
                        Investigasi
                      </Button>
                    )}
                    {report.status === "in_progress" && !report.investigation && (
                      <Button size="sm" variant="secondary" onClick={() => setInvestigationTarget(report)}>
                        <Fish className="w-3 h-3 mr-1" />Analisis
                      </Button>
                    )}
                    {report.status === "in_progress" && report.investigation && (
                      <Button size="sm" onClick={() => handleStatusChange(report.id, "closed")}>
                        Tutup Kasus
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {selectedReport?.id === report.id && (
                <div className="mt-4 pt-4 border-t border-border space-y-4">
                  {/* Status progress */}
                  <div>
                    <p className="text-sm font-medium mb-2">Status Investigasi</p>
                    <div className="flex items-center gap-2">
                      {["open", "in_progress", "closed"].map((s, i) => (
                        <div key={s} className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            (s === "open" && ["open", "in_progress", "closed"].includes(report.status)) ||
                            (s === "in_progress" && ["in_progress", "closed"].includes(report.status)) ||
                            (s === "closed" && report.status === "closed")
                              ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                          }`}>{i + 1}</div>
                          {i < 2 && <div className={`w-12 h-0.5 ${
                            (s === "open" && ["in_progress", "closed"].includes(report.status)) ||
                            (s === "in_progress" && report.status === "closed") ? "bg-primary" : "bg-secondary"
                          }`} />}
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-6 mt-1 text-xs text-muted-foreground">
                      <span>Lapor</span><span className="ml-4">Investigasi</span><span className="ml-2">Selesai</span>
                    </div>
                  </div>

                  {/* Classification details */}
                  {report.classificationData && (
                    <div className="bg-secondary/30 rounded-lg p-3">
                      <p className="text-sm font-medium mb-2">Klasifikasi (PP 50/2012 & ILO)</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                        <div><span className="text-muted-foreground">Klasifikasi:</span> <span className="font-medium">{classificationLabels[report.classificationData.classification]}</span></div>
                        <div><span className="text-muted-foreground">Cedera:</span> <span className="font-medium">{injuryTypeLabels[report.classificationData.injuryType]}</span></div>
                        <div><span className="text-muted-foreground">Bagian Tubuh:</span> <span className="font-medium">{bodyPartLabels[report.classificationData.bodyPart]}</span></div>
                        <div><span className="text-muted-foreground">Penyebab:</span> <span className="font-medium">{causeLabels[report.classificationData.cause]}</span></div>
                        <div><span className="text-muted-foreground">Agen:</span> <span className="font-medium">{agentLabels[report.classificationData.agent]}</span></div>
                        <div><span className="text-muted-foreground">Hari Hilang:</span> <span className="font-medium">{report.classificationData.lostWorkDays} hari</span></div>
                      </div>
                    </div>
                  )}

                  {/* Investigation results */}
                  {report.investigation && (
                    <div className="bg-secondary/30 rounded-lg p-3">
                      <p className="text-sm font-medium mb-2">
                        Hasil Investigasi ({report.investigation.method === "fishbone" ? "Fishbone / Ishikawa" : "5-Why Analysis"})
                      </p>
                      {report.investigation.method === "fishbone" && report.investigation.fishbone && (
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">Problem: {report.investigation.fishbone.problem}</p>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {report.investigation.fishbone.categories.filter(c => c.causes.length > 0).map(cat => (
                              <div key={cat.name} className="text-xs">
                                <p className="font-medium text-primary">{cat.name}</p>
                                <ul className="list-disc list-inside text-muted-foreground">
                                  {cat.causes.map((c, i) => <li key={i}>{c}</li>)}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {report.investigation.method === "five_why" && report.investigation.fiveWhy && (
                        <div className="space-y-2 text-xs">
                          {report.investigation.fiveWhy.whys.filter(w => w.answer).map((w, i) => (
                            <div key={i}><span className="text-primary font-medium">Why #{i + 1}:</span> <span className="text-muted-foreground">{w.answer}</span></div>
                          ))}
                          <div><span className="font-medium">Root Cause:</span> <span className="text-muted-foreground">{report.investigation.fiveWhy.rootCause}</span></div>
                          <div><span className="font-medium">Korektif:</span> <span className="text-muted-foreground">{report.investigation.fiveWhy.corrective}</span></div>
                          <div><span className="font-medium">Preventif:</span> <span className="text-muted-foreground">{report.investigation.fiveWhy.preventive}</span></div>
                        </div>
                      )}
                      <div className="mt-2 text-xs">
                        <p className="font-medium">Kesimpulan:</p>
                        <p className="text-muted-foreground">{report.investigation.conclusion}</p>
                      </div>
                      {report.investigation.recommendations && report.investigation.recommendations.length > 0 && (
                        <div className="mt-2 text-xs">
                          <p className="font-medium">Rekomendasi:</p>
                          <ul className="list-disc list-inside text-muted-foreground">
                            {report.investigation.recommendations.map((r, i) => <li key={i}>{r}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {report.rootCause && !report.investigation && (
                    <div>
                      <p className="text-sm font-medium">Root Cause</p>
                      <p className="text-sm text-muted-foreground mt-1">{report.rootCause}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

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
