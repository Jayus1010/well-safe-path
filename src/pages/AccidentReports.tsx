import { useState } from "react";
import { Car, Plus, MapPin, User, Calendar, Users, AlertTriangle, FileDown, Fish, HelpCircle, FileText, CheckCircle, XCircle, Edit3, Eye, Camera, Briefcase } from "lucide-react";
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
  description?: string;
  rejectionNote?: string;
  investigator: string;
}

const AccidentReports = () => {
  const [reports, setReports] = useLocalStorage<ExtendedAccident[]>("k3-accidents-v2", []);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ExtendedAccident | null>(null);
  const [reviewTarget, setReviewTarget] = useState<ExtendedAccident | null>(null);
  const { toast } = useToast();

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
    };

    if (editTarget) {
      setReports(prev => prev.map(r => r.id === editTarget.id ? { ...r, ...data, status: "draft" } : r));
      setEditTarget(null);
      toast({ title: "Draft Diperbarui", description: "Perubahan data korban berhasil disimpan." });
    } else {
      const newReport: ExtendedAccident = {
        id: `ACC-${Date.now().toString().slice(-4)}`,
        ...data as ExtendedAccident,
        status: "draft",
      };
      setReports(prev => [newReport, ...prev]);
      setDialogOpen(false);
      toast({ title: "Draft Berhasil", description: "Laporan baru disimpan sebagai draft." });
    }
  };

  const updateStatus = (id: string, newStatus: EnhancedStatus, note?: string) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, status: newStatus, rejectionNote: note || r.rejectionNote } : r));
    setReviewTarget(null);
    toast({ title: "Status Diperbarui", description: `Kasus ${id} sekarang berstatus ${newStatus}` });
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Car className="w-7 h-7 text-destructive" />
            HSE Accident Governance
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Manajemen Laporan: Draft → Review Manager → Approved</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-destructive hover:bg-destructive/90">
          <Plus className="w-4 h-4 mr-2" /> Buat Laporan (Draft)
        </Button>
      </div>

      <div className="grid gap-4">
        {reports.map(report => (
          <Card key={report.id} className={`glass-card border-l-4 ${
            report.status === 'draft' ? 'border-l-slate-400' : 
            report.status === 'pending_approval' ? 'border-l-yellow-500' : 
            report.status === 'rejected' ? 'border-l-red-500' : 'border-l-green-500'
          }`}>
            <CardContent className="p-5">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="font-mono">{report.id}</Badge>
                    <Badge className={report.status === 'pending_approval' ? 'bg-yellow-600' : report.status === 'rejected' ? 'bg-red-600' : 'bg-blue-600'}>
                      {report.status.toUpperCase()}
                    </Badge>
                    <Badge variant="secondary" className="bg-slate-200 text-slate-800">
                      <Briefcase className="w-3 h-3 mr-1" /> {report.victimStatus?.toUpperCase()}
                    </Badge>
                  </div>
                  <h3 className="font-bold text-lg">{report.title}</h3>
                  <div className="text-xs text-muted-foreground flex gap-4">
                    <span className="flex items-center gap-1"><User className="w-3 h-3"/> {report.victimName}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/> {report.location}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> {report.date}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {(report.status === 'draft' || report.status === 'rejected') && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => setEditTarget(report)}><Edit3 className="w-4 h-4 mr-1"/> Edit</Button>
                      <Button size="sm" onClick={() => updateStatus(report.id, "pending_approval")}>Submit</Button>
                    </>
                  )}
                  {report.status === 'pending_approval' && (
                    <Button size="sm" className="bg-yellow-600" onClick={() => setReviewTarget(report)}><Eye className="w-4 h-4 mr-1"/> Review & Approve</Button>
                  )}
                </div>
              </div>
              {report.status === 'rejected' && (
                <div className="mt-3 p-2 bg-destructive/10 border border-destructive/20 rounded text-xs text-destructive">
                  <strong>Alasan Penolakan:</strong> {report.rejectionNote}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* FORM MODAL: DRAFT & EDIT */}
      <Dialog open={dialogOpen || !!editTarget} onOpenChange={(open) => { setDialogOpen(open); if(!open) setEditTarget(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editTarget ? "Edit Laporan" : "Laporan Kejadian Baru"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nama Korban</Label>
                <Input name="victimName" defaultValue={editTarget?.victimName} required />
              </div>
              <div className="space-y-2">
                <Label>Status Korban</Label>
                <Select name="victimStatus" defaultValue={editTarget?.victimStatus || "karyawan"}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="karyawan">Karyawan Tetap/PKWT</SelectItem>
                    <SelectItem value="kontraktor">Kontraktor / Vendor</SelectItem>
                    <SelectItem value="tamu">Tamu / Pengunjung</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Judul Insiden</Label><Input name="title" defaultValue={editTarget?.title} required /></div>
              <div>
                <Label>Severity (Keparahan)</Label>
                <Select name="severity" defaultValue={editTarget?.severity || "medium"}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low (P3K)</SelectItem>
                    <SelectItem value="medium">Medium (Medical Treatment)</SelectItem>
                    <SelectItem value="high">High (LTI/Lost Work Day)</SelectItem>
                    <SelectItem value="critical">Critical (Fatality)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Lokasi Kejadian</Label><Input name="location" defaultValue={editTarget?.location} required /></div>
              <div><Label>Waktu</Label><Input name="date" type="datetime-local" defaultValue={editTarget?.date} required /></div>
            </div>
            <div><Label>Deskripsi/Kronologi</Label><Textarea name="description" defaultValue={editTarget?.description} className="h-24" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Jumlah Korban</Label><Input name="injuredCount" type="number" defaultValue={editTarget?.injuredCount || 1} /></div>
              <div><Label>Nama Pelapor (HSE)</Label><Input name="investigator" defaultValue={editTarget?.investigator} required /></div>
            </div>
            <Button type="submit" className="w-full">{editTarget ? "Perbarui Draft" : "Simpan Draft Laporan"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL REVIEW: UNTUK MANAGER */}
      <Dialog open={!!reviewTarget} onOpenChange={() => setReviewTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Verifikasi Laporan Manager</DialogTitle></DialogHeader>
          {reviewTarget && (
            <div className="space-y-4">
              <div className="bg-secondary/30 p-4 rounded-md space-y-1">
                <p className="text-sm font-bold">{reviewTarget.title}</p>
                <p className="text-xs text-muted-foreground">Lokasi: {reviewTarget.location}</p>
                <p className="text-xs"><strong>Status Korban:</strong> {reviewTarget.victimStatus.toUpperCase()}</p>
                <p className="text-xs mt-2 italic text-slate-600">"{reviewTarget.description}"</p>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1 bg-green-600" onClick={() => updateStatus(reviewTarget.id, "open")}>Setujui (Approve)</Button>
                <Button variant="destructive" className="flex-1" onClick={() => {
                  const note = prompt("Masukkan Alasan Penolakan:");
                  if(note) updateStatus(reviewTarget.id, "rejected", note);
                }}>Tolak (Reject)</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccidentReports;
