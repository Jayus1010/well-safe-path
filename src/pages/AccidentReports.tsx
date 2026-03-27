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

// Definisi Struktur Data yang Lengkap
interface ExtendedAccident {
  id: string;
  title: string;
  location: string;
  date: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "draft" | "pending_approval" | "open" | "in_progress" | "closed" | "rejected";
  injuredCount: number;
  victimName: string;
  victimStatus: "karyawan" | "kontraktor" | "tamu";
  victimPhoto?: string;
  description: string;
  investigator: string;
  rejectionNote?: string;
  investigation?: {
    method: string;
    conclusion: string;
    recommendations: string[];
  };
}

const AccidentReports = () => {
  // Menggunakan key 'v5' untuk memastikan data lama yang rusak tidak terbawa
  const [reports, setReports] = useLocalStorage<ExtendedAccident[]>("k3-accidents-v5", []);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ExtendedAccident | null>(null);
  const [reviewTarget, setReviewTarget] = useState<ExtendedAccident | null>(null);
  const [investigationTarget, setInvestigationTarget] = useState<ExtendedAccident | null>(null);
  const [tempPhoto, setTempPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const data = {
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
      setReports(prev => prev.map(r => r.id === editTarget.id ? { ...r, ...data, status: "draft" } : r));
      setEditTarget(null);
    } else {
      const newReport = { id: `ACC-${Date.now().toString().slice(-4)}`, ...data, status: "draft" } as ExtendedAccident;
      setReports(prev => [newReport, ...prev]);
    }
    setDialogOpen(false);
    setTempPhoto(null);
    toast({ title: "Draft Berhasil Disimpan" });
  };

  const updateStatus = (id: string, newStatus: any, note?: string) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, status: newStatus, rejectionNote: note || r.rejectionNote } : r));
    setReviewTarget(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Car className="text-destructive" /> Laporan Investigasi</h1>
        <Button onClick={() => { setEditTarget(null); setDialogOpen(true); }} className="bg-destructive"><Plus className="w-4 h-4 mr-2" /> Lapor Baru</Button>
      </div>

      <div className="grid gap-4">
        {reports.map(report => (
          <Card key={report.id} className="border-l-4">
            <CardContent className="p-5 flex justify-between items-center">
              <div>
                <div className="flex gap-2 items-center mb-1">
                  <Badge variant="outline">{report.id}</Badge>
                  <Badge>{report.status.toUpperCase()}</Badge>
                </div>
                <h3 className="font-bold">{report.title || "Tanpa Judul"}</h3>
                <p className="text-xs text-muted-foreground">{report.victimName} | {report.location} | Inv: {report.investigator}</p>
              </div>
              <div className="flex gap-2">
                {(report.status === 'draft' || report.status === 'rejected') && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => { setEditTarget(report); setDialogOpen(true); }}>Edit</Button>
                    <Button size="sm" onClick={() => updateStatus(report.id, "pending_approval")}>Submit</Button>
                  </>
                )}
                {report.status === 'open' && (
                   <Button size="sm" onClick={() => setInvestigationTarget(report)}>Investigasi</Button>
                )}
                {report.status === 'closed' && (
                  <Button size="sm" variant="outline" onClick={() => exportAccidentReportsPDF([report as any])}><Printer className="w-4 h-4 mr-1"/> Cetak</Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* MODAL FORM */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>{editTarget ? "Edit Draft" : "Laporan Baru"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div><Label>Judul Laporan</Label><Input name="title" defaultValue={editTarget?.title} required /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Nama Korban</Label><Input name="victimName" defaultValue={editTarget?.victimName} required /></div>
              <div><Label>Nama Investigator/Pelapor</Label><Input name="investigator" defaultValue={editTarget?.investigator} required /></div>
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

      {/* INVESTIGASI DIALOG */}
      {investigationTarget && (
        <InvestigationDialog
          open={!!investigationTarget}
          onOpenChange={(open) => { if (!open) setInvestigationTarget(null); }}
          accidentTitle={investigationTarget.title}
          onSave={(inv) => {
             setReports(prev => prev.map(r => r.id === investigationTarget.id ? { ...r, investigation: inv, status: "closed" } : r));
             setInvestigationTarget(null);
          }}
        />
      )}
    </div>
  );
};

export default AccidentReports;
