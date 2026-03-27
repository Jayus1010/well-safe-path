// Fishbone (Ishikawa) and 5-Why Analysis Types

export interface FishboneCategory {
  name: string;
  causes: string[];
}

export interface FishboneAnalysis {
  problem: string;
  categories: FishboneCategory[];
}

export interface WhyStep {
  question: string;
  answer: string;
}

export interface FiveWhyAnalysis {
  problem: string;
  whys: WhyStep[];
  rootCause: string;
  corrective: string;
  preventive: string;
}

export type InvestigationMethod = "fishbone" | "five_why";

export interface Investigation {
  method: InvestigationMethod;
  fishbone?: FishboneAnalysis;
  fiveWhy?: FiveWhyAnalysis;
  conclusion: string;
  recommendations: string[];
  completedAt?: string;
}

export const FISHBONE_DEFAULT_CATEGORIES = [
  "Man (Manusia)",
  "Machine (Mesin)",
  "Method (Metode)",
  "Material",
  "Measurement (Pengukuran)",
  "Environment (Lingkungan)",
];
