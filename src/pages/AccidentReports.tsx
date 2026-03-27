import { useState, useRef } from "react";
import { Car, Plus, MapPin, User, Calendar, AlertTriangle, Printer, Fish, HelpCircle, CheckCircle, Edit3, Eye, Camera, Send, FileText, ClipboardCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { useToast } from "@/hooks/use-toast";
import { exportAccidentReportsPDF } from "@/lib/pdf-export";
import InvestigationDialog from "@/components/InvestigationDialog";

type EnhancedStatus = "draft" | "pending_approval" | "open" | "in_progress" | "closed" | "rejected";

interface ExtendedAccident {
  id: string;
  title: string;
  location: string;
  date: string;
  severity: "low" | "medium" | "high" | "critical";
  status: EnhancedStatus;
  injuredCount: number;
  victimName: string;
  victimStatus: "karyawan" | "kontraktor" | "tamu";
  victimPhoto?: string;
  description: string;
  rejectionNote?: string;
  investigator: string;
  investigation?: {
    method: "fishbone" | "five_why";
    conclusion: string;
    recommendations: string[];
    fiveWhy?: { whys: { why: string; answer: string }[]; rootCause: string; corrective: string; preventive: string; };
    fishbone?: { problem: string; categories: { name: string; causes: string[] }[] };
  };
}

const AccidentReports = () => {
  const [reports, setReports] = useLocalStorage<ExtendedAccident[]>("k3-accidents-v4", []);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ExtendedAccident | null>(null);
  const [reviewTarget, setReviewTarget] = useState<ExtendedAccident | null>(null);
  const [investigationTarget, setInvestigationTarget] = useState<ExtendedAccident | null>(null);
  const [tempPhoto, setTempPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setTempPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const reportData = {
      title: form.get("title") as string,
      location: form.get("location") as string,
      date: form.get("date") as string,
      severity: form.get("severity") as any,
      victimName: form.get("victimName") as string,
      victimStatus: form.get("victimStatus") as any,
      injuredCount: parseInt(form.get("injuredCount") as string) || 0,
      investigator: form.get("investigator") as string,
      description: form.get("description") as string,
      victimPhoto: tempPhoto || editTarget?.victimPhoto || "",
    };

    if (editTarget) {
      setReports(prev => prev.map(r => r.id === editTarget.id ? { ...r, ...reportData, status: "draft" } : r));
      setEditTarget(null);
    } else {
      const newReport = { id: `ACC-${Date.now().toString().slice(-4)}`, ...reportData, status: "draft" } as ExtendedAccident;
      setReports(prev => [newReport, ...prev]);
      setDialogOpen(false);
    }
    setTempPhoto(null);
    toast({ title: "Berhasil!", description: "Laporan tersimpan di Draft." });
  };

  const updateStatus = (id: string, newStatus: EnhancedStatus, note?: string) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, status: newStatus, rejectionNote: note || r.rejectionNote } : r));
    setReviewTarget(null);
    toast({ title: "Status Diperbarui" });
  };

  // LOGIKA VALIDASI INVESTIGASI (Agar tidak bisa asal klik simpan)
  const handleSaveInvestigation = (inv: any) => {
    if (!investigationTarget) return;
    
    // Validasi Logika: Apakah kesimpulan/conclusion ada isinya?
    if (!inv || !inv.conclusion || inv.conclusion.trim().length < 5) {
      toast({ 
        title: "Investigasi Ditolak!", 
        description: "Akar masalah (Conclusion) wajib diisi sebelum disimpan.", 
        variant: "destructive" 
      });
      return; 
    }

    setReports(prev => prev.map(r => 
      r.id === investigationTarget.id ? { ...r, investigation: inv, status: "in_progress" } : r
    ));
    setInvestigationTarget(null);
    toast({ title: "Investigasi Berhasil", description: "Data investigasi kini telah masuk ke sistem." });
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Car className="text-destructive" /> HSE Accident Reports</h1>
        <Button onClick={() => { setEditTarget(null); setTempPhoto(null); setDialogOpen(true); }} className="bg-destructive hover:bg-destructive/90">
          <Plus className="w-4 h-4 mr-2" /> Lapor Baru
        </Button>
      </div>

      <div className="grid gap-4">
        {reports.map(report => (
          <Card key={report.id} className={`border-l-4 ${report.status === 'closed' ? 'border-l-blue-600' : 'border-l-slate-400'}`}>
            <CardContent className="p-5 space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  <div className="w-14 h-14 rounded-full border bg-slate-50 overflow-hidden flex-shrink-0">
                    {report.victimPhoto ? <img src={report.victimPhoto} className="w-full h-full object-cover" /> : <User className="w-full h-full p-3 text-slate-300" />}
                  </div>
                  <div>
                    <div className="flex gap-2 items-center mb-1">
                      <Badge variant="outline" className="text-[10px]">{report.id}</Badge>
                      <Badge className={report.status === 'closed' ? 'bg-blue-600' : 'bg-slate-500'}>{report.status.toUpperCase()}</Badge>
                    </div>
                    <h3 className="font-bold">{report.title}</h3>
                    <p className="text-xs text-muted-foreground">{report.victimName} ({report.victimStatus}) | {report.location}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {(report.status === 'draft' || report.status === 'rejected') && (
                    <Button size="sm" onClick={() => updateStatus(report.id, "pending_approval")}><Send className="w-3 h-3 mr-1"/> Submit</Button>
                  )}
                  {report.status === 'pending_approval' && (
                    <Button size="sm" className="bg-yellow-600" onClick={() => setReviewTarget(report)}><Eye className="w-3 h-3 mr-1"/> Review</Button>
                  )}
                  {report.status === 'open' && (
                    <Button size="sm" variant="secondary" onClick={() => setInvestigationTarget(report)}><Fish className="w-3 h-3 mr-1"/> Investigasi</Button>
                  )}
                  {report.status === 'in_progress' && (
                    <Button size="sm" className="bg-blue-600" onClick={() => updateStatus(report.id, "closed")}><CheckCircle className="w-3 h-3 mr-1"/> Close Kasus</Button>
                  )}
                  {report.status === 'closed' && (
                    <Button size="sm" variant="outline" onClick={() => exportAccidentReportsPDF([report as any])}><Printer className="w-3 h-3 mr-1"/> PDF</Button>
                  )}
                </div>
              </div>

              {/* TAMPILAN HASIL INVESTIGASI (Ini yang sebelumnya hilang) */}
              {report.investigation && (
                <div className="bg-blue-50/30 border border-blue-100 p-3 rounded-lg space-y-2">
                  <p className="text-xs font-bold flex items-center gap-1 text-blue-700">
                    <ClipboardCheck className="w-3 h-3" /> HASIL INVESTIGASI ({report.investigation.method.toUpperCase()}):
                  </p>
                  <div className="text-xs space-y-1">
                    <p><strong>Akar Masalah:</strong> {report.investigation.conclusion}</p>
                    {report.investigation.recommendations && (
                      <p><strong>Rekomendasi:</strong> {report.investigation.recommendations.join(", ")}</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* FORM DIALOG */}
      <Dialog open={dialogOpen || !!editTarget} onOpenChange={(open) => { setDialogOpen(open); if(!open) setEditTarget(null); }}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>{editTarget ? "Edit Laporan" : "Laporan Baru"}</DialogTitle></DialogHeader>
          <form key={editTarget?.id || "new"} onSubmit={handleSave} className="space-y-4">
            <div className="flex gap-4 items-center bg-slate-50 p-3 rounded">
               <div className="w-16 h-16 bg-white border-2 border-dashed rounded-full flex items-center justify-center relative overflow-hidden group">
                  {tempPhoto || editTarget?.victimPhoto ? <img src={tempPhoto || editTarget?.victimPhoto} className="w-full h-full object-cover" /> : <Camera className="text-slate-300" />}
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                  <div onClick={() => fileInputRef.current?.click()} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[8px] text-white cursor-pointer">UPLOAD</div>
               </div>
               <div className="flex-1"><Label>Nama Korban</Label><Input name="victimName" defaultValue={editTarget?.victimName} required /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <Label>Status</Label>
                  <Select name="victimStatus" defaultValue={editTarget?.victimStatus || "karyawan"}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="karyawan">Karyawan</SelectItem><SelectItem value="kontraktor">Kontraktor</SelectItem><SelectItem value="tamu">Tamu</SelectItem></SelectContent>
                  </Select>
               </div>
               <div>
                  <Label>Severity</Label>
                  <Select name="severity" defaultValue={editTarget?.severity || "medium"}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="low">P3K</SelectItem><SelectItem value="medium">Medical</SelectItem><SelectItem value="high">LTI</SelectItem></SelectContent>
                  </Select>
               </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div><Label>Lokasi</Label><Input name="location" defaultValue={editTarget?.location} required /></div>
               <div><Label>Waktu</Label><Input name="date" type="datetime-local" defaultValue={editTarget?.date} required /></div>
            </div>
            <div><Label>Kronologi</Label><Textarea name="description" defaultValue={editTarget?.description} required /></div>
            <Button type="submit" className="w-full">Simpan Draft</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL REVIEW */}
      <Dialog open={!!reviewTarget} onOpenChange={() => setReviewTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Approval Laporan</DialogTitle></DialogHeader>
          {reviewTarget && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded border text-sm italic">"{reviewTarget.description}"</div>
              <div className="flex gap-2">
                <Button className="flex-1 bg-green-600" onClick={() => updateStatus(reviewTarget.id, "open")}>Approve</Button>
                <Button variant="destructive" className="flex-1" onClick={() => {
                  const msg = prompt("Alasan Reject:");
                  if(msg) updateStatus(reviewTarget.id, "rejected", msg);
                }}>Reject</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* INVESTIGASI DIALOG */}
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
