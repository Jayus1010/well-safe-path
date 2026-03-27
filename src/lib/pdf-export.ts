import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const COLORS = {
  primary: [218, 165, 32] as [number, number, number],
  dark: [26, 35, 50] as [number, number, number],
  text: [230, 230, 240] as [number, number, number],
  muted: [140, 145, 160] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

function addHeader(doc: jsPDF, title: string) {
  doc.setFillColor(...COLORS.dark);
  doc.rect(0, 0, 210, 35, "F");
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 32, 210, 3, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...COLORS.white);
  doc.text("SafetyPro K3", 14, 16);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.muted);
  doc.text(title, 14, 24);

  doc.setFontSize(8);
  doc.text(`Dicetak: ${new Date().toLocaleDateString("id-ID")}`, 196, 24, { align: "right" });
}

function addFooter(doc: jsPDF) {
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.muted);
    doc.text(`SafetyPro K3 — Halaman ${i} dari ${pages}`, 105, 290, { align: "center" });
  }
}

export function exportHazardReportsPDF(reports: any[]) {
  const doc = new jsPDF();
  addHeader(doc, "Laporan Kondisi Bahaya");

  autoTable(doc, {
    startY: 42,
    head: [["ID", "Judul", "Lokasi", "Pelapor", "Tanggal", "Status", "Prioritas"]],
    body: reports.map(r => [r.id, r.title, r.location, r.reportedBy, r.reportedAt, r.status, r.priority]),
    theme: "grid",
    headStyles: { fillColor: COLORS.primary, textColor: COLORS.dark, fontStyle: "bold", fontSize: 8 },
    bodyStyles: { fontSize: 7 },
    alternateRowStyles: { fillColor: [240, 240, 245] },
  });

  addFooter(doc);
  doc.save("laporan-bahaya.pdf");
}

export function exportInspectionsPDF(inspections: any[]) {
  const doc = new jsPDF();
  addHeader(doc, "Laporan Inspeksi K3");

  autoTable(doc, {
    startY: 42,
    head: [["ID", "Judul", "Area", "Inspektor", "Tanggal", "Status", "Temuan", "Skor"]],
    body: inspections.map(i => [i.id, i.title, i.area, i.inspector, i.date, i.status, i.findings, `${i.score}%`]),
    theme: "grid",
    headStyles: { fillColor: COLORS.primary, textColor: COLORS.dark, fontStyle: "bold", fontSize: 8 },
    bodyStyles: { fontSize: 7 },
    alternateRowStyles: { fillColor: [240, 240, 245] },
  });

  addFooter(doc);
  doc.save("laporan-inspeksi.pdf");
}

export function exportWorkPermitsPDF(permits: any[]) {
  const doc = new jsPDF();
  addHeader(doc, "Laporan Ijin Kerja");

  autoTable(doc, {
    startY: 42,
    head: [["ID", "Jenis", "Lokasi", "Pemohon", "Tanggal", "Status", "Approvals"]],
    body: permits.map(p => [
      p.id, p.type, p.location, p.requestedBy, p.date, p.status,
      p.approvals.map((a: any) => `${a.role}: ${a.approved === true ? "✓" : a.approved === false ? "✗" : "—"}`).join(", ")
    ]),
    theme: "grid",
    headStyles: { fillColor: COLORS.primary, textColor: COLORS.dark, fontStyle: "bold", fontSize: 8 },
    bodyStyles: { fontSize: 7 },
    alternateRowStyles: { fillColor: [240, 240, 245] },
    columnStyles: { 6: { cellWidth: 50 } },
  });

  addFooter(doc);
  doc.save("laporan-ijin-kerja.pdf");
}

export function exportAccidentReportsPDF(reports: any[]) {
  const doc = new jsPDF();
  addHeader(doc, "Laporan Investigasi Kecelakaan");

  autoTable(doc, {
    startY: 42,
    head: [["ID", "Judul", "Lokasi", "Tanggal", "Severity", "Status", "Korban", "Investigator", "Klasifikasi"]],
    body: reports.map(r => [
      r.id, r.title, r.location, r.date, r.severity, r.status,
      r.injuredCount, r.investigator, r.classificationData?.classification || "-"
    ]),
    theme: "grid",
    headStyles: { fillColor: COLORS.primary, textColor: COLORS.dark, fontStyle: "bold", fontSize: 8 },
    bodyStyles: { fontSize: 7 },
    alternateRowStyles: { fillColor: [240, 240, 245] },
  });

  // Detail investigations
  let yPos = (doc as any).lastAutoTable?.finalY + 15 || 120;
  reports.forEach(r => {
    if (r.investigation) {
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...COLORS.dark);
      doc.text(`${r.id} - ${r.title}`, 14, yPos);
      yPos += 6;

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(`Metode: ${r.investigation.method === "fishbone" ? "Fishbone (Ishikawa)" : "5-Why Analysis"}`, 14, yPos);
      yPos += 5;
      doc.text(`Kesimpulan: ${r.investigation.conclusion}`, 14, yPos, { maxWidth: 180 });
      yPos += 10;

      if (r.investigation.recommendations?.length) {
        doc.text("Rekomendasi:", 14, yPos);
        yPos += 5;
        r.investigation.recommendations.forEach((rec: string) => {
          doc.text(`• ${rec}`, 18, yPos, { maxWidth: 175 });
          yPos += 5;
        });
      }
      yPos += 8;
    }
  });

  addFooter(doc);
  doc.save("laporan-kecelakaan.pdf");
}
