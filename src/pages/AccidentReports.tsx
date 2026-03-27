import { useState, useRef } from "react";
import { Car, Plus, MapPin, User, Calendar, Users, AlertTriangle, Printer, Fish, HelpCircle, FileText, CheckCircle, XCircle, Edit3, Eye, Camera, Briefcase, Lock, Send } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { useToast } from "@/hooks/use-toast";
import { exportAccidentReportsPDF } from "@/lib/pdf-export";
import InvestigationDialog from "@/components/InvestigationDialog";

type EnhancedStatus = "draft" | "pending_approval" | "open" | "in_progress" | "closed" | "rejected";
type VictimStatus = "karyawan" | "kontraktor" | "tamu";

interface ExtendedAccident {
  id: string;
  title: string;
  location: string;
  date: string;
  severity: "low" | "medium" | "high" | "critical";
  status: EnhancedStatus;
  injuredCount: number;
  victimName?: string;
  victimStatus: VictimStatus;
  victimPhoto?: string;
  description?: string;
  rejectionNote?: string;
  investigator: string;
  investigation?: any;
}

const AccidentReports = () => {
  const [reports, setReports] = useLocalStorage<ExtendedAccident[]>("k3-accidents-v3", []);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ExtendedAccident | null>(null);
  const [reviewTarget, setReviewTarget] = useState<ExtendedAccident | null>(null);
  const [investigationTarget, setInvestigationTarget] = useState<ExtendedAccident | null>(null);
  const [tempPhoto, setTempPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Handling Photo Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setTempPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Create or Update Report
  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const data: Partial<ExtendedAccident> = {
      title: form.get("title") as string,
      location: form.get("location") as string,
      date: form.get("date") as string,
      severity: form.get("severity") as any,
      victimName: form.get("victimName") as string,
      victimStatus: form.get("victimStatus") as VictimStatus,
      injuredCount: parseInt(form.get("injuredCount") as string) || 0,
      investigator: form.get("investigator") as string,
      description: form.get("description") as string,
      victimPhoto: tempPhoto || editTarget?.victimPhoto,
    };

    if (editTarget) {
      setReports(prev => prev.map(r => r.id === editTarget.id ? { ...r, ...data, status: "draft" } : r));
      setEditTarget(null);
      toast({ title: "Draft Diperbarui" });
    } else {
      const newReport: ExtendedAccident = {
        id: `ACC-${Date.now().toString().slice(-4)}`,
        ...data as ExtendedAccident,
        status: "draft",
      };
      setReports(prev => [newReport, ...prev]);
      setDialogOpen(false);
      toast({ title: "Draft Baru Berhasil Dibuat" });
    }
    setTempPhoto(null);
  };

  const updateStatus = (id: string, newStatus: EnhancedStatus, note?: string) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, status: newStatus, rejectionNote: note || r.rejectionNote } : r));
    setReviewTarget(null);
    toast({ title: `Status Update: ${newStatus.toUpperCase()}` });
  };

  const handleSaveInvestigation = (inv: any) => {
    if (!investigationTarget) return;
    if (!inv || Object.keys(inv).length === 0) {
      toast({ title: "Gagal", description: "Data investigasi tidak boleh kosong!", variant: "destructive" });
      return;
    }
    setReports(prev => prev.map(r => r.id === investigationTarget.id ? { ...r, investigation: inv, status: "in_progress" } : r));
    setInvestigationTarget(null);
    toast({ title: "Investigasi Disimpan", description: "Status sekarang In Progress. Silakan tutup jika sudah final." });
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Car className="w-7 h-7 text-destructive" />
            HSE Accident Governance
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Workflow: Draft → Approve → Investigasi → Closed (Final)</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-destructive hover:bg-destructive/90">
          <Plus className="w-4 h-4 mr-2" /> Lapor Baru (Draft)
        </Button>
      </div>

      <div className="grid gap-4">
        {reports.map(report => (
          <Card key={report.id} className={`glass-card border-l-4 ${
            report.status === 'closed' ? 'border-l-blue-600' : 
            report.status === 'pending_approval' ? 'border-l-yellow-500' :
            report.status === 'rejected' ? 'border-l-red-500' : 'border-l-slate-400'
          }`}>
            <CardContent className="p-5">
              <div className="flex justify-between items-start gap-4">
                <div className="flex gap-4 flex-1">
                  <div className="w-16 h-16 rounded bg-slate-100 flex-shrink-0 border overflow-hidden">
                    {report.victimPhoto ? <img src={report.victimPhoto} className="w-full h-full object-cover" /> : <User className="w-full h-full p-3 text-slate-300" />}
                  </div>
                  <div className="space-y-1">
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="outline">{report.id}</Badge>
                      <Badge className={report.status === 'closed' ? 'bg-blue-600' : report.status === 'pending_approval' ? 'bg-yellow-600' : 'bg-slate-600'}>{report.status.toUpperCase()}</Badge>
                      <Badge variant="secondary">{report.victimStatus?.toUpperCase()}</Badge>
                    </div>
                    <h3 className="font-bold text-lg">{report.title}</h3>
                    <p className="text-xs text-muted-foreground">{report.location} • {report.date} • {report.victimName}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 items-end">
                  {/* ACTIONS */}
                  {(report.status === 'draft' || report.status === 'rejected') && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEditTarget(report)}><Edit3 className="w-4 h-4 mr-1"/> Edit</Button>
                      <Button size="sm" onClick={() => updateStatus(report.id, "pending_approval")}><Send className="w-4 h-4 mr-1"/> Submit</Button>
                    </div>
                  )}
                  {report.status === 'pending_approval' && (
                    <Button size="sm" className="bg-yellow-600" onClick={() => setReviewTarget(report)}><Eye className="w-4 h-4 mr-1"/> Review & Approve</Button>
                  )}
                  {report.status === 'open' && (
                    <Button size="sm" variant="secondary" onClick={() => setInvestigationTarget(report)}><Fish className="w-4 h-4 mr-1"/> Investigasi</Button>
                  )}
                  {report.status === 'in_progress' && (
                    <Button size="sm" className="bg-blue-600" onClick={() => updateStatus(report.id, "closed")}><CheckCircle className="w-4 h-4 mr-1"/> Tutup Kasus (Final)</Button>
                  )}
                  {report.status === 'closed' && (
                    <Button size="sm" variant="outline" className="border-blue-600 text-blue-600" onClick={() => exportAccidentReportsPDF([report as any])}>
                      <Printer className="w-4 h-4 mr-1"/> Cetak Laporan Final
                    </Button>
                  )}
                </div>
              </div>
              {report.status === 'rejected' && (
                <div className="mt-3 p-2 bg-red-50 text-[11px] text-red-600 border border-red-100 rounded">
                  <strong>Alasan Reject:</strong> {report.rejectionNote}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* FORM DIALOG (CREATE & EDIT) */}
      <Dialog open={dialogOpen || !!editTarget} onOpenChange={(open) => { setDialogOpen(open); if(!open) {setEditTarget(null); setTempPhoto(null);} }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editTarget ? `Edit Draft: ${editTarget.id}` : "Laporan Kejadian Baru"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="flex gap-4 items-center p-4 bg-slate-50 rounded-lg">
              <div className="w-20 h-20 rounded-full bg-white border-2 border-dashed flex items-center justify-center overflow-hidden relative group">
                {tempPhoto || editTarget?.victimPhoto ? <img src={tempPhoto || editTarget?.victimPhoto} className="w-full h-full object-cover" /> : <Camera className="w-6 h-6 text-slate-300" />}
                <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" accept="image/*" />
                <div onClick={() => fileInputRef.current?.click()} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[8px] text-white cursor-pointer transition-opacity">UPLOAD</div>
              </div>
              <div className="flex-1">
                <Label>Nama Korban</Label>
                <Input name="victimName" defaultValue={editTarget?.victimName} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Status Hubungan Kerja</Label>
                <Select name="victimStatus" defaultValue={editTarget?.victimStatus || "karyawan"}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="karyawan">Karyawan</SelectItem>
                    <SelectItem value="kontraktor">Kontraktor</SelectItem>
                    <SelectItem value="tamu">Tamu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Severity</Label>
                <Select name="severity" defaultValue={editTarget?.severity || "medium"}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">P3K (First Aid)</SelectItem>
                    <SelectItem value="medium">Medical Treatment</SelectItem>
                    <SelectItem value="high">LTI (Lost Time Injury)</SelectItem>
                    <SelectItem value="critical">Fatality</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Lokasi</Label><Input name="location" defaultValue={editTarget?.location} required /></div>
              <div><Label>Waktu Kejadian</Label><Input name="date" type="datetime-local" defaultValue={editTarget?.date} required /></div>
            </div>
            <div><Label>Kronologi</Label><Textarea name="description" defaultValue={editTarget?.description} className="h-20" /></div>
            <div><Label>Pelapor (HSE)</Label><Input name="investigator" defaultValue={editTarget?.investigator} required /></div>
            <Button type="submit" className="w-full">{editTarget ? "Update Draft" : "Simpan Draft"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* REVIEW DIALOG */}
      <Dialog open={!!reviewTarget} onOpenChange={() => setReviewTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Approval Laporan: {reviewTarget?.id}</DialogTitle></DialogHeader>
          {reviewTarget && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded border">
                <p className="text-sm font-bold">Kronologi Kejadian:</p>
                <p className="text-sm italic mt-1 text-slate-600">"{reviewTarget.description}"</p>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1 bg-green-600" onClick={() => updateStatus(reviewTarget.id, "open")}>Approve</Button>
                <Button variant="destructive" className="flex-1" onClick={() => {
                  const msg = prompt("Alasan Penolakan:");
                  if(msg) updateStatus(reviewTarget.id, "rejected", msg);
                }}>Reject</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* INVESTIGATION DIALOG */}
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
