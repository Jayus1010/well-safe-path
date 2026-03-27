import { useState } from "react";
import { Car, Plus, MapPin, User, Calendar, Users, AlertTriangle, FileDown, Fish, HelpCircle, FileText, CheckCircle, XCircle, Camera } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { useToast } from "@/hooks/use-toast";

type EnhancedStatus = "draft" | "pending_approval" | "open" | "in_progress" | "closed" | "rejected";

interface ExtendedAccident {
  id: string;
  title: string;
  location: string;
  date: string;
  severity: string;
  status: EnhancedStatus;
  injuredCount: number;
  victimName?: string;
  description?: string;
  rejectionNote?: string;
  investigator: string;
}

const AccidentReports = () => {
  const [reports, setReports] = useLocalStorage<ExtendedAccident[]>("k3-accidents-v2", []);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleSaveDraft = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const newReport: ExtendedAccident = {
      id: `ACC-DRAFT-${Date.now().toString().slice(-4)}`,
      title: form.get("title") as string,
      location: form.get("location") as string,
      date: form.get("date") as string,
      severity: form.get("severity") as string,
      status: "draft",
      victimName: form.get("victimName") as string,
      injuredCount: parseInt(form.get("injuredCount") as string) || 0,
      investigator: form.get("investigator") as string,
      description: form.get("description") as string,
    };
    setReports(prev => [newReport, ...prev]);
    setDialogOpen(false);
    toast({ title: "Draft Tersimpan", description: "Laporan masuk dalam antrean draft." });
  };

  const updateStatus = (id: string, newStatus: EnhancedStatus, note?: string) => {
    setReports(prev => prev.map(r => 
      r.id === id ? { ...r, status: newStatus, rejectionNote: note || r.rejectionNote } : r
    ));
    toast({ title: "Status Diperbarui", description: `Laporan ${id} kini: ${newStatus}` });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Car className="w-7 h-7 text-destructive" />
            Accident Reporting Governance
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Status: Draft → Pending → Approved</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-destructive hover:bg-destructive/90"><Plus className="w-4 h-4 mr-2" />Lapor Kejadian</Button>
          </DialogTrigger>
          <DialogContent className="bg-card">
            <DialogHeader><DialogTitle>Laporan Kecelakaan (Awal)</DialogTitle></DialogHeader>
            <form onSubmit={handleSaveDraft} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Nama Korban</Label><Input name="victimName" required /></div>
                <div><Label>Jumlah Korban</Label><Input name="injuredCount" type="number" defaultValue="1" /></div>
              </div>
              <div><Label>Judul Insiden</Label><Input name="title" required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Lokasi</Label><Input name="location" required /></div>
                <div><Label>Waktu</Label><Input name="date" type="datetime-local" required /></div>
              </div>
              <div><Label>Kronologi</Label><Input name="description" placeholder="Ceritakan singkat..." /></div>
              <div><Label>Pelapor</Label><Input name="investigator" required /></div>
              <Button type="submit" className="w-full">Simpan Draft</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {reports.map(report => (
          <Card key={report.id} className="glass-card">
            <CardContent className="p-5">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{report.id}</Badge>
                    <Badge>{report.status}</Badge>
                  </div>
                  <h3 className="font-bold text-lg">{report.title}</h3>
                  <p className="text-sm text-muted-foreground italic">{report.location} - {report.date}</p>
                </div>
                <div className="flex gap-2">
                  {report.status === 'draft' && (
                    <Button size="sm" onClick={() => updateStatus(report.id, "pending_approval")}>Submit Approval</Button>
                  )}
                  {report.status === 'pending_approval' && (
                    <>
                      <Button size="sm" className="bg-green-600" onClick={() => updateStatus(report.id, "open")}>Approve</Button>
                      <Button size="sm" variant="destructive" onClick={() => updateStatus(report.id, "rejected", "Ditolak karena data tidak lengkap")}>Reject</Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AccidentReports;
