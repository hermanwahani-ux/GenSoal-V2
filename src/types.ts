export type QuestionType =
  | 'Pilihan Ganda'
  | 'PG Kompleks'
  | 'Benar / Salah'
  | 'Menjodohkan'
  | 'Isian Singkat'
  | 'Uraian / Esai';

export interface MatchingPair {
  left: string;
  right: string;
}

export interface QuestionStimulus {
  type: 'Gambar Ilustrasi' | 'Infografis' | 'Grafik / Diagram' | 'Tabel Data' | 'Peta';
  title?: string;
  description: string;
  // Dynamic fields for custom rendered visual elements
  tableHeaders?: string[];
  tableRows?: string[][];
  chartData?: { label: string; value: number }[];
  petaCoordinates?: string; // custom representation for maps
}

export interface Question {
  id: string;
  type: QuestionType;
  questionText: string;
  stimulus?: QuestionStimulus;
  options?: string[]; // For Pilihan Ganda (A, B, C, D, etc.) or PG Kompleks
  correctAnswer: string | string[] | { [key: string]: string }; // Answers can vary based on types
  matchingPairs?: MatchingPair[]; // Specifically for Menjodohkan
  explanation: string; // Pembahasan lengkap dalam bahasa Indonesia
  points: number; // Point weight for scoring
}

export interface GeneratorConfig {
  subject: string;
  fase: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  topic: string;
  format: QuestionType;
  count: number;
  difficulty: 'Mudah' | 'Sedang' | 'Sulit' | 'Campuran';
  bloomLevel: string; // e.g., "C3 - Menerapkan"
  useVisual: boolean;
  visualType: 'Gambar Ilustrasi' | 'Infografis' | 'Grafik / Diagram' | 'Tabel Data' | 'Peta';
  isMixedFormat?: boolean;
  mixedFormats?: { [key in QuestionType]?: number };
  visualCount?: number | 'Semua';
}
