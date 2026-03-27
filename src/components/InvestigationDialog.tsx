import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Fish, HelpCircle } from "lucide-react";
import { Investigation, FishboneAnalysis, FiveWhyAnalysis, FISHBONE_DEFAULT_CATEGORIES, InvestigationMethod } from "@/lib/investigation-types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accidentTitle: string;
  onSave: (investigation: Investigation) => void;
}

const InvestigationDialog = ({ open, onOpenChange, accidentTitle, onSave }: Props) => {
  const [method, setMethod] = useState<InvestigationMethod>("fishbone");

  // Fishbone state
  const [fishbone, setFishbone] = useState<FishboneAnalysis>({
    problem: accidentTitle,
    categories: FISHBONE_DEFAULT_CATEGORIES.map(name => ({ name, causes: [""] })),
  });

  // 5-Why state
  const [fiveWhy, setFiveWhy] = useState<FiveWhyAnalysis>({
    problem: accidentTitle,
    whys: [
      { question: "Mengapa kejadian ini terjadi?", answer: "" },
      { question: "Mengapa hal tersebut bisa terjadi?", answer: "" },
      { question: "Mengapa kondisi itu ada?", answer: "" },
      { question: "Mengapa itu tidak terdeteksi?", answer: "" },
      { question: "Mengapa pencegahan tidak efektif?", answer: "" },
    ],
    rootCause: "",
    corrective: "",
    preventive: "",
  });

  const [conclusion, setConclusion] = useState("");
  const [recommendations, setRecommendations] = useState<string[]>([""]);

  const addCause = (catIdx: number) => {
    setFishbone(prev => ({
      ...prev,
      categories: prev.categories.map((c, i) =>
        i === catIdx ? { ...c, causes: [...c.causes, ""] } : c
      ),
    }));
  };

  const updateCause = (catIdx: number, causeIdx: number, value: string) => {
    setFishbone(prev => ({
      ...prev,
      categories: prev.categories.map((c, i) =>
        i === catIdx ? { ...c, causes: c.causes.map((cs, j) => j === causeIdx ? value : cs) } : c
      ),
    }));
  };

  const removeCause = (catIdx: number, causeIdx: number) => {
    setFishbone(prev => ({
      ...prev,
      categories: prev.categories.map((c, i) =>
        i === catIdx ? { ...c, causes: c.causes.filter((_, j) => j !== causeIdx) } : c
      ),
    }));
  };

  const updateWhy = (idx: number, answer: string) => {
    setFiveWhy(prev => ({
      ...prev,
      whys: prev.whys.map((w, i) => i === idx ? { ...w, answer } : w),
    }));
  };

  const handleSave = () => {
    const investigation: Investigation = {
      method,
      conclusion,
      recommendations: recommendations.filter(r => r.trim()),
      completedAt: new Date().toISOString(),
    };
    if (method === "fishbone") {
      investigation.fishbone = {
        ...fishbone,
        categories: fishbone.categories.map(c => ({ ...c, causes: c.causes.filter(cs => cs.trim()) })),
      };
    } else {
      investigation.fiveWhy = fiveWhy;
    }
    onSave(investigation);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">Investigasi: {accidentTitle}</DialogTitle>
        </DialogHeader>

        <Tabs value={method} onValueChange={v => setMethod(v as InvestigationMethod)} className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="fishbone" className="flex items-center gap-2">
              <Fish className="w-4 h-4" /> Fishbone (Ishikawa)
            </TabsTrigger>
            <TabsTrigger value="five_why" className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4" /> 5-Why Analysis
            </TabsTrigger>
          </TabsList>

          {/* Fishbone */}
          <TabsContent value="fishbone" className="space-y-4 mt-4">
            <div>
              <Label>Problem Statement</Label>
              <Input value={fishbone.problem} onChange={e => setFishbone(p => ({ ...p, problem: e.target.value }))} className="mt-1" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {fishbone.categories.map((cat, catIdx) => (
                <Card key={catIdx} className="bg-secondary/30 border-border">
                  <CardHeader className="py-2 px-3">
                    <CardTitle className="text-sm font-semibold">{cat.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 pb-3 space-y-2">
                    {cat.causes.map((cause, causeIdx) => (
                      <div key={causeIdx} className="flex gap-1">
                        <Input
                          value={cause}
                          onChange={e => updateCause(catIdx, causeIdx, e.target.value)}
                          placeholder="Sebab..."
                          className="text-xs h-8"
                        />
                        {cat.causes.length > 1 && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeCause(catIdx, causeIdx)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button variant="ghost" size="sm" className="text-xs h-7 w-full" onClick={() => addCause(catIdx)}>
                      <Plus className="w-3 h-3 mr-1" /> Tambah sebab
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* 5-Why */}
          <TabsContent value="five_why" className="space-y-4 mt-4">
            <div>
              <Label>Problem Statement</Label>
              <Input value={fiveWhy.problem} onChange={e => setFiveWhy(p => ({ ...p, problem: e.target.value }))} className="mt-1" />
            </div>
            {fiveWhy.whys.map((w, idx) => (
              <div key={idx} className="space-y-1">
                <Label className="text-xs text-muted-foreground">Why #{idx + 1}: {w.question}</Label>
                <Textarea
                  value={w.answer}
                  onChange={e => updateWhy(idx, e.target.value)}
                  placeholder="Jawaban..."
                  className="min-h-[60px] text-sm"
                />
              </div>
            ))}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Akar Masalah (Root Cause)</Label>
                <Textarea value={fiveWhy.rootCause} onChange={e => setFiveWhy(p => ({ ...p, rootCause: e.target.value }))} className="mt-1 min-h-[60px]" />
              </div>
              <div>
                <Label>Tindakan Korektif</Label>
                <Textarea value={fiveWhy.corrective} onChange={e => setFiveWhy(p => ({ ...p, corrective: e.target.value }))} className="mt-1 min-h-[60px]" />
              </div>
            </div>
            <div>
              <Label>Tindakan Preventif</Label>
              <Textarea value={fiveWhy.preventive} onChange={e => setFiveWhy(p => ({ ...p, preventive: e.target.value }))} className="mt-1 min-h-[60px]" />
            </div>
          </TabsContent>
        </Tabs>

        {/* Common fields */}
        <div className="space-y-3 mt-4 border-t border-border pt-4">
          <div>
            <Label>Kesimpulan Investigasi</Label>
            <Textarea value={conclusion} onChange={e => setConclusion(e.target.value)} className="mt-1" placeholder="Ringkasan kesimpulan..." />
          </div>
          <div>
            <Label>Rekomendasi</Label>
            {recommendations.map((rec, idx) => (
              <div key={idx} className="flex gap-1 mt-1">
                <Input value={rec} onChange={e => setRecommendations(prev => prev.map((r, i) => i === idx ? e.target.value : r))} placeholder={`Rekomendasi ${idx + 1}`} />
                {recommendations.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={() => setRecommendations(prev => prev.filter((_, i) => i !== idx))}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button variant="ghost" size="sm" className="mt-1 text-xs" onClick={() => setRecommendations(p => [...p, ""])}>
              <Plus className="w-3 h-3 mr-1" /> Tambah rekomendasi
            </Button>
          </div>
        </div>

        <Button className="w-full mt-4" onClick={handleSave}>Simpan Hasil Investigasi</Button>
      </DialogContent>
    </Dialog>
  );
};

export default InvestigationDialog;
