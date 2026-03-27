export type Status = "open" | "in_progress" | "closed" | "pending";
export type Priority = "low" | "medium" | "high" | "critical";

export interface HazardReport {
  id: string;
  title: string;
  location: string;
  description: string;
  reportedBy: string;
  reportedAt: string;
  status: Status;
  priority: Priority;
  actions: string[];
}

export interface Inspection {
  id: string;
  title: string;
  area: string;
  inspector: string;
  date: string;
  status: Status;
  findings: number;
  score: number;
}

export interface WorkPermit {
  id: string;
  type: string;
  location: string;
  requestedBy: string;
  date: string;
  status: Status;
  approvals: { role: string; name: string; approved: boolean | null }[];
}

export interface AccidentReport {
  id: string;
  title: string;
  location: string;
  date: string;
  severity: Priority;
  status: Status;
  injuredCount: number;
  investigator: string;
  rootCause?: string;
}

export const hazardReports: HazardReport[] = [
  { id: "HZR-001", title: "Tumpahan oli di area produksi", location: "Lantai Produksi A", description: "Tumpahan oli mesin yang belum dibersihkan", reportedBy: "Ahmad Fauzi", reportedAt: "2026-03-25", status: "open", priority: "high", actions: [] },
  { id: "HZR-002", title: "Scaffolding tidak stabil", location: "Gedung B - Lt. 3", description: "Scaffolding di area konstruksi goyang", reportedBy: "Budi Santoso", reportedAt: "2026-03-24", status: "in_progress", priority: "critical", actions: ["Pemasangan penguat scaffolding"] },
  { id: "HZR-003", title: "APAR kadaluarsa", location: "Gudang Utama", description: "3 unit APAR sudah melewati masa kadaluarsa", reportedBy: "Siti Rahma", reportedAt: "2026-03-20", status: "closed", priority: "medium", actions: ["Penggantian APAR baru", "Update jadwal inspeksi"] },
  { id: "HZR-004", title: "Kabel listrik terkelupas", location: "Workshop Mekanik", description: "Kabel power supply mesin CNC terkelupas", reportedBy: "Dedi Kurniawan", reportedAt: "2026-03-26", status: "open", priority: "high", actions: [] },
  { id: "HZR-005", title: "Ventilasi tidak berfungsi", location: "Ruang Cat", description: "Sistem ventilasi di ruang pengecatan mati", reportedBy: "Rina Wati", reportedAt: "2026-03-23", status: "in_progress", priority: "critical", actions: ["Perbaikan motor exhaust fan"] },
];

export const inspections: Inspection[] = [
  { id: "INS-001", title: "Inspeksi Rutin Bulanan", area: "Area Produksi", inspector: "Ir. Hendra", date: "2026-03-25", status: "closed", findings: 3, score: 85 },
  { id: "INS-002", title: "Inspeksi K3 Listrik", area: "Panel Listrik Utama", inspector: "Bambang E.", date: "2026-03-26", status: "in_progress", findings: 5, score: 72 },
  { id: "INS-003", title: "Inspeksi APD", area: "Seluruh Area", inspector: "Dewi S.", date: "2026-03-20", status: "closed", findings: 8, score: 68 },
  { id: "INS-004", title: "Inspeksi Fire Safety", area: "Gedung A & B", inspector: "Ir. Hendra", date: "2026-03-27", status: "open", findings: 0, score: 0 },
];

export const workPermits: WorkPermit[] = [
  { id: "WP-001", type: "Hot Work Permit", location: "Area Welding B2", requestedBy: "Rudi Hartono", date: "2026-03-27", status: "pending", approvals: [
    { role: "Supervisor", name: "Agus P.", approved: true },
    { role: "Safety Officer", name: "Ir. Hendra", approved: true },
    { role: "Area Manager", name: "Pak Joko", approved: null },
  ]},
  { id: "WP-002", type: "Confined Space Entry", location: "Tank Storage T-03", requestedBy: "Eko Prasetyo", date: "2026-03-26", status: "closed", approvals: [
    { role: "Supervisor", name: "Wawan S.", approved: true },
    { role: "Safety Officer", name: "Ir. Hendra", approved: true },
    { role: "Area Manager", name: "Pak Joko", approved: true },
  ]},
  { id: "WP-003", type: "Working at Height", location: "Atap Gedung C", requestedBy: "Dani M.", date: "2026-03-27", status: "open", approvals: [
    { role: "Supervisor", name: "Agus P.", approved: null },
    { role: "Safety Officer", name: "Ir. Hendra", approved: null },
    { role: "Area Manager", name: "Pak Joko", approved: null },
  ]},
  { id: "WP-003", type: "Excavation Permit", location: "Area Parkir Baru", requestedBy: "Hadi S.", date: "2026-03-28", status: "pending", approvals: [
    { role: "Supervisor", name: "Wawan S.", approved: true },
    { role: "Safety Officer", name: "Ir. Hendra", approved: null },
    { role: "Site Manager", name: "Ir. Bambang", approved: null },
  ]},
];

export const accidentReports: AccidentReport[] = [
  { id: "ACC-001", title: "Pekerja terjatuh dari ketinggian", location: "Gedung B - Lt. 3", date: "2026-03-22", severity: "critical", status: "in_progress", injuredCount: 1, investigator: "Ir. Hendra", rootCause: "Tidak menggunakan safety harness" },
  { id: "ACC-002", title: "Luka bakar ringan saat pengelasan", location: "Workshop Welding", date: "2026-03-18", severity: "medium", status: "closed", injuredCount: 1, investigator: "Dewi S.", rootCause: "APD tidak lengkap" },
  { id: "ACC-003", title: "Near miss - forklift hampir menabrak pekerja", location: "Gudang Utama", date: "2026-03-26", severity: "high", status: "open", injuredCount: 0, investigator: "Bambang E." },
];

export const getStatusVariant = (status: Status) => {
  switch (status) {
    case "open": return "open" as const;
    case "in_progress": return "progress" as const;
    case "closed": return "closed" as const;
    case "pending": return "pending" as const;
  }
};

export const getStatusLabel = (status: Status) => {
  switch (status) {
    case "open": return "Open";
    case "in_progress": return "In Progress";
    case "closed": return "Closed";
    case "pending": return "Pending";
  }
};

export const getPriorityColor = (priority: Priority) => {
  switch (priority) {
    case "low": return "text-info";
    case "medium": return "text-warning";
    case "high": return "text-destructive";
    case "critical": return "text-destructive font-bold";
  }
};
