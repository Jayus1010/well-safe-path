import { useState } from "react";
import { FileKey, Plus, MapPin, User, Calendar, CheckCircle2, XCircle, Clock, FileDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WorkPermit, getStatusVariant, getStatusLabel } from "@/lib/k3-data";
import { workPermits as initialPermits } from "@/lib/k3-data";
import { useLocalStorage } from "@/lib/useLocalStorage";
import { useToast } from "@/hooks/use-toast";
import { exportWorkPermitsPDF } from "@/lib/pdf-export";

const WorkPermits = () => {
  const [permits, setPermits] = useLocalStorage<WorkPermit[]>("k3-permits", initialPermits);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleApprove = (permitId: string, role: string) => {
    setPermits(prev => prev.map(p => {
      if (p.id !== permitId) return p;
      const newApprovals = p.approvals.map(a => a.role === role ? { ...a, approved: true } : a);
      const allApproved = newApprovals.every(a => a.approved === true);
      return { ...p, approvals: newApprovals, status: allApproved ? "closed" as const : "pending" as const };
    }));
    toast({ title: "Approval diberikan", description: `${role} menyetujui permit ${permitId}` });
  };

  const handleReject = (permitId: string, role: string) => {
    setPermits(prev => prev.map(p => {
      if (p.id !== permitId) return p;
      const newApprovals = p.approvals.map(a => a.role === role ? { ...a, approved: false } : a);
      return { ...p, approvals: newApprovals, status: "open" as const };
    }));
    toast({ title: "Approval ditolak", variant: "destructive" });
  };

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const newPermit: WorkPermit = {
      id: `WP-${String(permits.length + 1).padStart(3, "0")}`,
      type: form.get("type") as string,
      location: form.get("location") as string,
      requestedBy: form.get("requestedBy") as string,
      date: form.get("date") as string || new Date().toISOString().split("T")[0],
      status: "open",
      approvals: [
        { role: "Supervisor", name: "-", approved: null },
        { role: "Safety Officer", name: "-", approved: null },
        { role: "Area Manager", name: "-", approved: null },
      ],
    };
    setPermits(prev => [newPermit, ...prev]);
    setDialogOpen(false);
    toast({ title: "Ijin kerja dibuat", description: `${newPermit.id} menunggu approval` });
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileKey className="w-7 h-7 text-primary" />
            Ijin Kerja
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Kelola ijin kerja dan approval</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => exportWorkPermitsPDF(permits)}>
            <FileDown className="w-4 h-4 mr-2" />PDF
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" />Buat Ijin Kerja</Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader><DialogTitle>Ijin Kerja Baru</DialogTitle></DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <Label>Jenis Pekerjaan</Label>
                  <Select name="type" defaultValue="Hot Work Permit">
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Hot Work Permit">Hot Work Permit</SelectItem>
                      <SelectItem value="Confined Space Entry">Confined Space Entry</SelectItem>
                      <SelectItem value="Working at Height">Working at Height</SelectItem>
                      <SelectItem value="Excavation Permit">Excavation Permit</SelectItem>
                      <SelectItem value="Electrical Work">Electrical Work</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Lokasi</Label><Input name="location" required className="mt-1" /></div>
                <div><Label>Pemohon</Label><Input name="requestedBy" required className="mt-1" /></div>
                <div><Label>Tanggal</Label><Input name="date" type="date" required className="mt-1" /></div>
                <Button type="submit" className="w-full">Ajukan Ijin</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4">
        {permits.map((permit, idx) => (
          <Card key={`${permit.id}-${idx}`} className="glass-card">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-mono text-muted-foreground">{permit.id}</span>
                    <Badge variant={getStatusVariant(permit.status)}>{getStatusLabel(permit.status)}</Badge>
                  </div>
                  <h3 className="font-semibold text-base">{permit.type}</h3>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{permit.location}</span>
                    <span className="flex items-center gap-1"><User className="w-3 h-3" />{permit.requestedBy}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{permit.date}</span>
                  </div>
                </div>
              </div>
              <div className="border-t border-border pt-4">
                <p className="text-sm font-medium mb-3">Approval Flow</p>
                <div className="flex gap-4">
                  {permit.approvals.map((approval) => (
                    <div key={approval.role} className="flex-1 p-3 rounded-lg bg-secondary/50 text-center">
                      <div className="flex items-center justify-center mb-2">
                        {approval.approved === true && <CheckCircle2 className="w-6 h-6 text-success" />}
                        {approval.approved === false && <XCircle className="w-6 h-6 text-destructive" />}
                        {approval.approved === null && <Clock className="w-6 h-6 text-muted-foreground" />}
                      </div>
                      <p className="text-xs font-medium">{approval.role}</p>
                      <p className="text-xs text-muted-foreground">{approval.name}</p>
                      {approval.approved === null && permit.status !== "closed" && (
                        <div className="flex gap-1 mt-2">
                          <Button size="sm" variant="secondary" className="text-xs h-7 flex-1"
                            onClick={() => handleApprove(permit.id, approval.role)}>✓</Button>
                          <Button size="sm" variant="secondary" className="text-xs h-7 flex-1"
                            onClick={() => handleReject(permit.id, approval.role)}>✗</Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default WorkPermits;
