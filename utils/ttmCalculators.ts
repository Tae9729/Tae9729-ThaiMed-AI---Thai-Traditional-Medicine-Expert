
import { TTMElement, TTMAgeGroup, TTMSeason } from '../types';

/**
 * Calculates Thatu Chao Ruean (Birth Element)
 * Simplified TTM logic for demonstration
 */
export const getBirthElement = (birthDate: string): TTMElement => {
  const date = new Date(birthDate);
  const month = date.getMonth(); // 0-11

  // Thai Traditional Medicine Birth Element Logic (approximate)
  if (month >= 9 && month <= 11) return TTMElement.EARTH; // Oct - Dec
  if (month >= 6 && month <= 8) return TTMElement.WATER;  // July - Sept
  if (month >= 3 && month <= 5) return TTMElement.WIND;   // April - June
  return TTMElement.FIRE; // Jan - March
};

/**
 * Calculates TTM Age Group
 */
export const getAgeGroup = (birthDate: string): TTMAgeGroup => {
  const age = new Date().getFullYear() - new Date(birthDate).getFullYear();
  if (age <= 16) return TTMAgeGroup.PATHOM;
  if (age <= 32) return TTMAgeGroup.MATCHIMA;
  return TTMAgeGroup.PATCHIM;
};

/**
 * Determines TTM Season (Utu) based on date
 */
export const getCurrentTTMSeason = (): TTMSeason => {
  const month = new Date().getMonth();
  // Hot: Feb 16 - June 15
  if (month >= 1 && month <= 5) return TTMSeason.KIMHANTA;
  // Rainy: June 16 - Oct 15
  if (month >= 5 && month <= 9) return TTMSeason.WASANTA;
  // Cold: Oct 16 - Feb 15
  return TTMSeason.HIMANTA;
};

/**
 * Gets Kala Samutthan (Time of Day factor)
 */
export const getKalaFactor = (timeStr?: string): string => {
  const hour = timeStr ? parseInt(timeStr.split(':')[0]) : new Date().getHours();
  
  if ((hour >= 6 && hour < 10) || (hour >= 18 && hour < 22)) return "Semha (Water) period";
  if ((hour >= 10 && hour < 14) || (hour >= 22 || hour < 2)) return "Pitta (Fire) period";
  return "Wata (Wind) period";
};
