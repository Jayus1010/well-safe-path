import { useState } from "react";
import { ClipboardCheck, Plus, User, Calendar, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Inspection, getStatusVariant, getStatusLabel } from "@/lib/k3-data";
import { inspections as initialInspections } from "@/lib/k3-data";
import { useToast } from "@/hooks/use-toast";

const Inspections = () => {
  const [inspections, setInspections] = useState<Inspection[]>(initialInspections);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const newInsp: Inspection = {
      id: `INS-${String(inspections.length + 1).padStart(3, "0")}`,
      title: form.get("title") as string,
      area: form.get("area") as string,
      inspector: form.get("inspector") as string,
      date: form.get("date") as string,
      status: "open",
      findings: 0,
      score: 0,
    };
    setInspections(prev => [newInsp, ...prev]);
    setDialogOpen(false);
    toast({ title: "Inspeksi dijadwalkan", description: `${newInsp.id} berhasil dibuat` });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    if (score > 0) return "text-destructive";
    return "text-muted-foreground";
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardCheck className="w-7 h-7 text-info" />
            Inspeksi K3
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Jadwal dan laporan inspeksi</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Jadwalkan Inspeksi</Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle>Inspeksi Baru</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div><Label>Judul Inspeksi</Label><Input name="title" required className="mt-1" /></div>
              <div><Label>Area</Label><Input name="area" required className="mt-1" /></div>
              <div><Label>Inspektor</Label><Input name="inspector" required className="mt-1" /></div>
              <div><Label>Tanggal</Label><Input name="date" type="date" required className="mt-1" /></div>
              <Button type="submit" className="w-full">Simpan</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {inspections.map(insp => (
          <Card key={insp.id} className="glass-card">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="text-xs font-mono text-muted-foreground">{insp.id}</span>
                  <h3 className="font-semibold mt-1">{insp.title}</h3>
                </div>
                <Badge variant={getStatusVariant(insp.status)}>{getStatusLabel(insp.status)}</Badge>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{insp.area}</span>
                <span className="flex items-center gap-1"><User className="w-3 h-3" />{insp.inspector}</span>
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{insp.date}</span>
              </div>
              {insp.score > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Skor Inspeksi</span>
                    <span className={`font-bold ${getScoreColor(insp.score)}`}>{insp.score}%</span>
                  </div>
                  <Progress value={insp.score} className="h-2" />
                  <p className="text-xs text-muted-foreground">{insp.findings} temuan ditemukan</p>
                </div>
              )}
              {insp.score === 0 && (
                <p className="text-sm text-muted-foreground italic">Belum dilaksanakan</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Inspections;
