import { useState } from "react";
import { Car, Plus, MapPin, User, Calendar, Users, AlertTriangle, FileDown, Fish, HelpCircle, FileText, CheckCircle, XCircle, Edit3, Eye, Camera, Briefcase, Lock } from "lucide-react";
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
import InvestigationDialog from "@/components/InvestigationDialog"; // Komponen investigasi dikembalikan

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
  investigation?: any; // Data hasil Fishbone/5-Why
}

const AccidentReports = () => {
  const [reports, setReports] = useLocalStorage<ExtendedAccident[]>("k3-accidents-v2", []);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ExtendedAccident | null>(null);
  const [reviewTarget, setReviewTarget] = useState<ExtendedAccident | null>(null);
  const [investigationTarget, setInvestigationTarget] = useState<ExtendedAccident | null>(null);
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
      toast({ title: "Draft Diperbarui" });
    } else {
      const newReport: ExtendedAccident = {
        id: `ACC-${Date.now().toString().slice(-4)}`,
        ...data as ExtendedAccident,
        status: "draft",
      };
      setReports(prev => [newReport, ...prev]);
      setDialogOpen(false);
      toast({ title: "Draft Disimpan" });
    }
  };

  const updateStatus = (id: string, newStatus: EnhancedStatus, note?: string) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, status: newStatus, rejectionNote: note || r.rejectionNote } : r));
    setReviewTarget(null);
    toast({ title: "Status Update", description: `Kini berstatus ${newStatus}` });
  };

  const handleSaveInvestigation = (investigation: any) => {
    if (!investigationTarget) return;
    setReports(prev => prev.map(r => 
      r.id === investigationTarget.id ? { ...r, investigation, status: "in_progress" } : r
    ));
    setInvestigationTarget(null);
    toast({ title: "Investigasi Disimpan", description: "Sekarang Anda bisa menutup kasus ini secara final." });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Car className="w-7 h-7 text-destructive" />
            HSE Accident Management
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Alur: Draft → Approve → Investigasi → Closed</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-destructive hover:bg-destructive/90">
          <Plus className="w-4 h-4 mr-2" /> Lapor Baru (Draft)
        </Button>
      </div>

      <div className="grid gap-4">
        {reports.map(report => (
          <Card key={report.id} className={`glass-card border-l-4 ${
            report.status === 'draft' ? 'border-l-slate-400' : 
            report.status === 'pending_approval' ? 'border-l-yellow-500' : 
            report.status === 'rejected' ? 'border-l-red-500' : 
            report.status === 'closed' ? 'border-l-blue-600' : 'border-l-green-500'
          }`}>
            <CardContent className="p-5">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{report.id}</Badge>
                    <Badge className={report.status === 'pending_approval' ? 'bg-yellow-600' : report.status === 'closed' ? 'bg-blue-600' : 'bg-green-600'}>
                      {report.status.toUpperCase()}
                    </Badge>
                    <Badge variant="secondary">{report.victimStatus?.toUpperCase()}</Badge>
                  </div>
                  <h3 className="font-bold text-lg">{report.title}</h3>
                  <div className="text-xs text-muted-foreground flex gap-4">
                    <span className="flex items-center gap-1"><User className="w-3 h-3"/> {report.victimName}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/> {report.location}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {/* TOMBOL BERDASARKAN STATUS */}
                  {(report.status === 'draft' || report.status === 'rejected') && (
                    <Button size="sm" onClick={() => updateStatus(report.id, "pending_approval")}>Submit Approval</Button>
                  )}
                  {report.status === 'pending_approval' && (
                    <Button size="sm" className="bg-yellow-600" onClick={() => setReviewTarget(report)}><Eye className="w-4 h-4 mr-1"/> Review</Button>
                  )}
                  {report.status === 'open' && (
                    <Button size="sm" variant="secondary" onClick={() => setInvestigationTarget(report)}><Fish className="w-4 h-4 mr-1"/> Mulai Investigasi</Button>
                  )}
                  {report.status === 'in_progress' && (
                    <Button size="sm" className="bg-blue-600 text-white" onClick={() => updateStatus(report.id, "closed")}>Tutup Kasus (Final)</Button>
                  )}
                  {report.status === 'closed' && (
                    <Badge variant="outline" className="text-blue-600 border-blue-600"><Lock className="w-3 h-3 mr-1"/> Data Terkunci</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* FORM INPUT DRAFT */}
      <Dialog open={dialogOpen || !!editTarget} onOpenChange={(open) => { setDialogOpen(open); if(!open) setEditTarget(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Data Kejadian Awal</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Nama Korban</Label><Input name="victimName" defaultValue={editTarget?.victimName} required /></div>
              <div>
                <Label>Foto Identitas Korban</Label>
                <div className="mt-1 flex items-center justify-center border-2 border-dashed h-10 rounded-md text-xs text-muted-foreground cursor-pointer hover:bg-slate-50">
                  <Camera className="w-4 h-4 mr-2"/> Upload Photo
                </div>
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
                    <SelectItem value="low">P3K</SelectItem>
                    <SelectItem value="medium">Medical Treatment</SelectItem>
                    <SelectItem value="high">LTI / Cacat</SelectItem>
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
            <Button type="submit" className="w-full">Simpan sebagai Draft</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL REVIEW MANAGER */}
      <Dialog open={!!reviewTarget} onOpenChange={() => setReviewTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Review Approval</DialogTitle></DialogHeader>
          {reviewTarget && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-md">
                <p className="text-sm"><strong>Kronologi:</strong> {reviewTarget.description}</p>
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

      {/* MODAL INVESTIGASI (Closing Mechanism) */}
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
