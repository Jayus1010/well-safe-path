import { useState, useRef } from "react";
import { Car, Plus, MapPin, User, Calendar, Users, AlertTriangle, Printer, Fish, HelpCircle, FileText, CheckCircle, XCircle, Edit3, Eye, Camera, Briefcase, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { useToast } from "@/hooks/use-toast";
import { exportAccidentReportsPDF } from "@/lib/pdf-export"; // Fungsi cetak Anda
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
  victimPhoto?: string; // Menyimpan data foto (Base64)
  description?: string;
  rejectionNote?: string;
  investigator: string;
  investigation?: any;
}

const AccidentReports = () => {
  const [reports, setReports] = useLocalStorage<ExtendedAccident[]>("k3-accidents-v2", []);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ExtendedAccident | null>(null);
  const [reviewTarget, setReviewTarget] = useState<ExtendedAccident | null>(null);
  const [investigationTarget, setInvestigationTarget] = useState<ExtendedAccident | null>(null);
  const [tempPhoto, setTempPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Fungsi Handle Upload Foto (Preview)
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
    } else {
      const newReport: ExtendedAccident = {
        id: `ACC-${Date.now().toString().slice(-4)}`,
        ...data as ExtendedAccident,
        status: "draft",
      };
      setReports(prev => [newReport, ...prev]);
      setDialogOpen(false);
    }
    setTempPhoto(null);
    toast({ title: "Draft Berhasil Disimpan" });
  };

  const updateStatus = (id: string, newStatus: EnhancedStatus, note?: string) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, status: newStatus, rejectionNote: note || r.rejectionNote } : r));
    setReviewTarget(null);
    toast({ title: "Status Diperbarui" });
  };

  // Fungsi Cetak Khusus Laporan Final
  const handlePrintFinal = (report: ExtendedAccident) => {
    exportAccidentReportsPDF([report as any]);
    toast({ title: "Mengunduh PDF...", description: `Laporan ${report.id} sedang diproses.` });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Car className="w-7 h-7 text-destructive" />
            HSE Accident Management
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Siklus Hidup Laporan: Draft → Approval → Investigasi → Closed</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-destructive hover:bg-destructive/90">
          <Plus className="w-4 h-4 mr-2" /> Buat Laporan (Draft)
        </Button>
      </div>

      <div className="grid gap-4">
        {reports.map(report => (
          <Card key={report.id} className={`glass-card border-l-4 ${
            report.status === 'closed' ? 'border-l-blue-600' : 'border-l-slate-400'
          }`}>
            <CardContent className="p-5">
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  {/* Tampilan Foto Korban di List (jika ada) */}
                  <div className="w-16 h-16 rounded-lg bg-secondary flex items-center justify-center overflow-hidden border">
                    {report.victimPhoto ? (
                      <img src={report.victimPhoto} alt="Victim" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{report.id}</Badge>
                      <Badge>{report.status.toUpperCase()}</Badge>
                      <Badge variant="secondary">{report.victimStatus?.toUpperCase()}</Badge>
                    </div>
                    <h3 className="font-bold text-lg">{report.title}</h3>
                    <p className="text-xs text-muted-foreground italic">{report.location} | {report.date}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {report.status === 'closed' && (
                    <Button variant="outline" size="sm" onClick={() => handlePrintFinal(report)} className="text-blue-600 border-blue-600">
                      <Printer className="w-4 h-4 mr-1" /> Cetak PDF Final
                    </Button>
                  )}
                  {report.status === 'draft' && (
                    <Button size="sm" onClick={() => updateStatus(report.id, "pending_approval")}>Submit Approval</Button>
                  )}
                  {report.status === 'pending_approval' && (
                    <Button size="sm" className="bg-yellow-600" onClick={() => setReviewTarget(report)}><Eye className="w-4 h-4 mr-1"/> Review</Button>
                  )}
                  {report.status === 'open' && (
                    <Button size="sm" variant="secondary" onClick={() => setInvestigationTarget(report)}><Fish className="w-4 h-4 mr-1"/> Investigasi</Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* FORM MODAL DENGAN UPLOAD FOTO */}
      <Dialog open={dialogOpen || !!editTarget} onOpenChange={(open) => { setDialogOpen(open); if(!open) {setEditTarget(null); setTempPhoto(null);} }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Data Kejadian Awal</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="flex items-center gap-6 p-4 bg-secondary/20 rounded-lg">
              <div className="w-24 h-24 rounded-full bg-background border-2 border-dashed flex items-center justify-center overflow-hidden relative group">
                {tempPhoto || editTarget?.victimPhoto ? (
                  <img src={tempPhoto || editTarget?.victimPhoto} className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-8 h-8 text-muted-foreground" />
                )}
                <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" accept="image/*" />
                <div onClick={() => fileInputRef.current?.click()} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] cursor-pointer transition-opacity">
                  Ganti Foto
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <Label>Nama Lengkap Korban</Label>
                <Input name="victimName" defaultValue={editTarget?.victimName} placeholder="Sesuai ID Card" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Status Korban</Label>
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
                    <SelectItem value="low">P3K</SelectItem>
                    <SelectItem value="medium">Medical Treatment</SelectItem>
                    <SelectItem value="high">LTI</SelectItem>
                    <SelectItem value="critical">Fatality</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div><Label>Lokasi</Label><Input name="location" defaultValue={editTarget?.location} required /></div>
              <div><Label>Waktu</Label><Input name="date" type="datetime-local" defaultValue={editTarget?.date} required /></div>
            </div>
            <div><Label>Kronologi</Label><Textarea name="description" defaultValue={editTarget?.description} className="h-20" /></div>
            <Button type="submit" className="w-full">Simpan Draft Laporan</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL REVIEW & MODAL INVESTIGASI (Sama seperti sebelumnya) */}
      <Dialog open={!!reviewTarget} onOpenChange={() => setReviewTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Approval Manager</DialogTitle></DialogHeader>
          {reviewTarget && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg border flex gap-4">
                <div className="w-12 h-12 rounded bg-slate-200 overflow-hidden">
                   {reviewTarget.victimPhoto && <img src={reviewTarget.victimPhoto} className="w-full h-full object-cover" />}
                </div>
                <div>
                  <p className="text-sm font-bold">{reviewTarget.victimName}</p>
                  <p className="text-xs text-muted-foreground">{reviewTarget.title}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1 bg-green-600" onClick={() => updateStatus(reviewTarget.id, "open")}>Approve</Button>
                <Button variant="destructive" className="flex-1" onClick={() => {
                  const note = prompt("Alasan Reject:");
                  if(note) updateStatus(reviewTarget.id, "rejected", note);
                }}>Reject</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {investigationTarget && (
        <InvestigationDialog
          open={!!investigationTarget}
          onOpenChange={(open) => { if (!open) setInvestigationTarget(null); }}
          accidentTitle={investigationTarget.title}
          onSave={(inv) => {
            setReports(prev => prev.map(r => r.id === investigationTarget.id ? { ...r, investigation: inv, status: "in_progress" } : r));
            setInvestigationTarget(null);
            toast({ title: "Investigasi Disimpan", description: "Laporan siap ditutup (Closed)." });
          }}
        />
      )}
    </div>
  );
};

export default AccidentReports;
