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
  doc.text("SafetyPro K3 - PT Santosa Agrindo", 14, 16);

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

// ... (Fungsi exportHazardReportsPDF, exportInspectionsPDF, exportWorkPermitsPDF tetap sama)

export function exportAccidentReportsPDF(reports: any[]) {
  const doc = new jsPDF();
  addHeader(doc, "Laporan Investigasi Kecelakaan (Final)");

  autoTable(doc, {
    startY: 42,
    head: [["ID", "Judul Laporan", "Lokasi", "Waktu", "Severity", "Status", "Korban (Status)", "Investigator"]],
    body: reports.map(r => [
      r.id || "-",
      r.title || "TIDAK ADA JUDUL", // Memperbaiki bug 'null' 
      r.location || "-",
      r.date || "-",
      r.severity || "-",
      r.status?.toUpperCase() || "-",
      `${r.victimName || "N/A"} (${r.victimStatus || "-"})`, // Memperbaiki bug korban '0' 
      r.investigator || "N/A" // Memperbaiki investigator kosong 
    ]),
    theme: "grid",
    headStyles: { fillColor: COLORS.primary, textColor: COLORS.dark, fontStyle: "bold", fontSize: 8 },
    bodyStyles: { fontSize: 7 },
    alternateRowStyles: { fillColor: [240, 240, 245] },
  });

  // Bagian Detail Investigasi (Root Cause Analysis)
  let yPos = (doc as any).lastAutoTable?.finalY + 15 || 120;
  reports.forEach(r => {
    if (r.investigation) {
      if (yPos > 230) {
        doc.addPage();
        yPos = 40; // Menyesuaikan header halaman baru
      }

      // Garis Pemisah antar laporan
      doc.setDrawColor(...COLORS.primary);
      doc.line(14, yPos - 5, 196, yPos - 5);

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...COLORS.dark);
      doc.text(`HASIL ANALISIS: ${r.id} - ${r.title || "Insiden"}`, 14, yPos);
      yPos += 8;

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(`Metode Analisis:`, 14, yPos);
      doc.setFont("helvetica", "normal");
      doc.text(r.investigation.method === "fishbone" ? "Fishbone (Ishikawa)" : "5-Why Analysis", 45, yPos);
      yPos += 6;

      // Box untuk Kesimpulan/Akar Masalah
      doc.setFillColor(245, 245, 250);
      doc.rect(14, yPos, 182, 15, "F");
      doc.setFont("helvetica", "bold");
      doc.text("Kesimpulan / Akar Masalah:", 18, yPos + 6);
      doc.setFont("helvetica", "italic");
      doc.text(r.investigation.conclusion || "Belum ada kesimpulan.", 18, yPos + 11, { maxWidth: 170 });
      yPos += 22;

      if (r.investigation.recommendations?.length) {
        doc.setFont("helvetica", "bold");
        doc.text("Tindakan Korektif & Preventif (Rekomendasi):", 14, yPos);
        yPos += 6;
        doc.setFont("helvetica", "normal");
        r.investigation.recommendations.forEach((rec: string, idx: number) => {
          doc.text(`${idx + 1}. ${rec}`, 18, yPos, { maxWidth: 175 });
          yPos += 6;
        });
      }
      yPos += 10;
    }
  });

  addFooter(doc);
  doc.save(`Laporan_Investigasi_${new Date().getTime()}.pdf`);
}
