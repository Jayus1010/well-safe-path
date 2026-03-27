// Klasifikasi Kecelakaan berdasarkan PP No. 50/2012, Permenaker & ILO Standards

export type AccidentClassification = "ringan" | "sedang" | "berat" | "fatal";
export type InjuryType = "luka_gores" | "luka_bakar" | "patah_tulang" | "amputasi" | "keracunan" | "sesak_nafas" | "luka_tusuk" | "terjepit" | "lainnya";
export type BodyPart = "kepala" | "mata" | "tangan" | "kaki" | "badan" | "punggung" | "jari" | "multiple" | "lainnya";
export type AccidentCause = "unsafe_act" | "unsafe_condition" | "management_failure";
export type AgentOfAccident = "mesin" | "kendaraan" | "bahan_kimia" | "listrik" | "ketinggian" | "material" | "alat_tangan" | "lingkungan" | "lainnya";

export interface AccidentClassificationData {
  classification: AccidentClassification;
  injuryType: InjuryType;
  bodyPart: BodyPart;
  cause: AccidentCause;
  agent: AgentOfAccident;
  lostWorkDays: number;
}

export const classificationLabels: Record<AccidentClassification, string> = {
  ringan: "Ringan",
  sedang: "Sedang",
  berat: "Berat",
  fatal: "Fatal / Meninggal",
};

export const classificationDescriptions: Record<AccidentClassification, string> = {
  ringan: "Luka ringan, tidak kehilangan hari kerja (PP 50/2012 Pasal 1)",
  sedang: "Kehilangan hari kerja < 3 hari (Permenaker No. 3/1998)",
  berat: "Kehilangan hari kerja ≥ 3 hari, cacat sementara/tetap",
  fatal: "Kecelakaan yang mengakibatkan kematian",
};

export const injuryTypeLabels: Record<InjuryType, string> = {
  luka_gores: "Luka Gores / Lecet",
  luka_bakar: "Luka Bakar",
  patah_tulang: "Patah Tulang",
  amputasi: "Amputasi",
  keracunan: "Keracunan",
  sesak_nafas: "Gangguan Pernafasan",
  luka_tusuk: "Luka Tusuk / Sayat",
  terjepit: "Terjepit / Terhimpit",
  lainnya: "Lainnya",
};

export const bodyPartLabels: Record<BodyPart, string> = {
  kepala: "Kepala",
  mata: "Mata",
  tangan: "Tangan / Lengan",
  kaki: "Kaki",
  badan: "Badan / Dada",
  punggung: "Punggung",
  jari: "Jari",
  multiple: "Multiple / Beberapa bagian",
  lainnya: "Lainnya",
};

export const causeLabels: Record<AccidentCause, string> = {
  unsafe_act: "Tindakan Tidak Aman (Unsafe Act)",
  unsafe_condition: "Kondisi Tidak Aman (Unsafe Condition)",
  management_failure: "Kegagalan Manajemen",
};

export const agentLabels: Record<AgentOfAccident, string> = {
  mesin: "Mesin / Peralatan",
  kendaraan: "Kendaraan",
  bahan_kimia: "Bahan Kimia",
  listrik: "Listrik",
  ketinggian: "Ketinggian",
  material: "Material / Bahan",
  alat_tangan: "Alat Tangan",
  lingkungan: "Lingkungan Kerja",
  lainnya: "Lainnya",
};

export const getClassificationColor = (c: AccidentClassification) => {
  switch (c) {
    case "ringan": return "text-info";
    case "sedang": return "text-warning";
    case "berat": return "text-destructive";
    case "fatal": return "text-destructive font-bold";
  }
};

export const getClassificationBadgeVariant = (c: AccidentClassification) => {
  switch (c) {
    case "ringan": return "pending" as const;
    case "sedang": return "progress" as const;
    case "berat": return "open" as const;
    case "fatal": return "open" as const;
  }
};
