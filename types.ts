
export type Language = 'th' | 'en';

export enum TTMElement {
  EARTH = 'Din (Earth)',
  WATER = 'Nam (Water)',
  WIND = 'Lom (Wind)',
  FIRE = 'Fai (Fire)'
}

export enum TTMAgeGroup {
  PATHOM = 'Pathom Wai (0-16 years)',
  MATCHIMA = 'Matchima Wai (16-32 years)',
  PATCHIM = 'Patchim Wai (32+ years)'
}

export enum TTMSeason {
  HIMANTA = 'Himanta (Cold/Dry)',
  KIMHANTA = 'Kimhanta (Hot)',
  WASANTA = 'Wasanta (Rainy)'
}

export interface UserProfile {
  name: string;
  birthDate: string;
  gender: string;
  elementChaoRuean: TTMElement;
}

export interface SymptomRecord {
  symptoms: string[];
  onset: string; // Time of day
  customNotes: string;
}

export interface WeatherData {
  temp: number;
  condition: string;
  season: TTMSeason;
}

export interface DiagnosisResult {
  summary: string;
  imbalance: 'Pitta' | 'Wata' | 'Semha' | 'Mixed';
  logic: string;
  recommendations: {
    food: string[];
    lifestyle: string[];
    herbs: string[];
  };
}
