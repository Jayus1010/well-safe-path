import { useState } from "react";
import { Car, Plus, MapPin, User, Calendar, Users, AlertTriangle, FileDown, Fish, HelpCircle, FileText, CheckCircle, XCircle, Edit3, Camera } from "lucide-react";
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
import { exportAccidentReportsPDF } from "@/lib/pdf-export";
import InvestigationDialog from "@/components/InvestigationDialog";

// Definisi Status Baru sesuai standar Approval
type EnhancedStatus = "draft" | "pending_approval" | "open" | "in_progress" | "closed" | "rejected";

interface ExtendedAccident {
  id: string;
  title: string;
  location: string;
  date: string;
  severity: "low" | "medium" | "high" | "critical";
  status: EnhancedStatus;
  injuredCount: number;
  victimName?: string; // Nama Korban
  victimPhoto?: string; // URL Foto Identitas
  description?: string;
  rejectionNote?: string; // Alasan jika ditolak
  investigator: string;
  investigation?: any;
  classificationData?: any;
}

const AccidentReports = () => {
  const [reports, setReports] = useLocalStorage<ExtendedAccident[]>("k3-accidents-v2", []);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ExtendedAccident | null>(null);
  const [investigationTarget, setInvestigationTarget] = useState<ExtendedAccident | null>(null);
  const { toast } = useToast();

  // 1. Fungsi Simpan Draft
  const handleSaveDraft = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const newReport: ExtendedAccident = {
      id: `ACC-DRAFT-${Date.now().toString().slice(-4)}`,
      title: form.get("title") as string,
      location: form.get("location") as string,
      date: form.get("date") as string,
      severity: form.get("severity") as any,
      status: "draft",
      victimName: form.get("victimName") as string,
      injuredCount: parseInt(form.get("injuredCount") as string) || 0,
      investigator: form.get("investigator") as string,
      description: form.get("description") as string,
    };
    setReports(prev => [newReport, ...prev]);
    setDialogOpen(false);
    toast({ title: "Draft Tersimpan", description: "Laporan masih dalam status draft dan belum dipublikasi." });
  };

  // 2. Alur Approval
  const updateStatus = (id: string, newStatus: EnhancedStatus, note?: string) => {
    setReports(prev => prev.map(r => 
      r.id === id ? { ...r, status: newStatus, rejectionNote: note || r.rejectionNote } : r
    ));
    toast({ title: `Status: ${newStatus.replace('_', ' ')}`, description: `Update berhasil untuk ${id}` });
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Car className="w-7 h-7 text-destructive" />
            Governance: Accident Reporting
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Alur: Draft → Submit → Approve (HSE Manager) → Investigation</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportAccidentReportsPDF(reports as any)}>
            <FileDown className="w-4 h-4 mr-2" />Export Data
          </Button>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-destructive hover:bg-destructive/90"><Plus className="w-4 h-4 mr-2" />Buat Laporan Baru</Button>
            </DialogTrigger>
            <DialogContent className="bg-card max-w-lg">
              <DialogHeader><DialogTitle>Formulir Laporan Kejadian (Awal)</DialogTitle></DialogHeader>
              <form onSubmit={handleSaveDraft} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nama Korban</Label>
                    <Input name="victimName" placeholder="Nama Lengkap" required />
                  </div>
                  <div className="space-y-2">
                    <Label>Foto Identitas (Optional)</Label>
                    <div className="flex items-center gap-2">
                       <Button type="button" variant="secondary" size="sm" className="w-full">
                         <Camera className="w-4 h-4 mr-2" /> Upload Foto
                       </Button>
                    </div>
                  </div>
                </div>
                <div><Label>Judul Insiden</Label><Input name="title" required /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Lokasi</Label><Input name="location" required /></div>
                  <div><Label>Waktu</Label><Input name="date" type="datetime-local" required /></div>
                </div>
                <div>
                   <Label>Kronologi</Label>
                   <Textarea name="description" className="h-20" placeholder="Jelaskan apa yang terjadi..." />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">Simpan sebagai Draft</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4">
        {reports.map(report => (
          <Card key={report.id} className={`glass-card border-l-4 ${
            report.status === 'draft' ? 'border-l-slate-500' : 
            report.status === 'pending_approval' ? 'border-l-yellow-500' : 'border-l-green-500'
          }`}>
            <CardContent className="p-5">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{report.id}</Badge>
                    <Badge className={
                      report.status === 'pending_approval' ? 'bg-yellow-600' : 
                      report.status === 'rejected' ? 'bg-red-600' : 'bg-blue-600'
                    }>{report.status.replace('_', ' ')}</Badge>
                  </div>
                  <h3 className="font-bold text-lg">{report.title}</h3>
                  <p className="text-sm text-muted-foreground flex items
