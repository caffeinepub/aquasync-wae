/**
 * Rule-based water quality insight engine for AquaSync WAE.
 * No AI/LLM — pure threshold logic.
 */

import type { Mode, Volume } from "../types/dispenser";

export interface WaterInsight {
  tdsLabel: string;
  phLabel: string;
  combined: string;
  purityPercent: number;
}

export interface ParsedCommand {
  mode?: Mode;
  volume?: Volume;
}

/** Get TDS quality label */
function tdsLabel(tds: number): string {
  if (tds < 50) return "Ultra-pure water detected";
  if (tds < 150) return "Excellent quality";
  if (tds < 300) return "Good quality";
  return "Consider filter maintenance";
}

/** Get pH quality label */
function phLabel(ph: number): string {
  if (ph < 6.5) return "Slightly acidic";
  if (ph < 7.5) return "Optimal pH balance";
  if (ph < 8.5) return "Slightly alkaline";
  return "High alkalinity detected";
}

/** Combined water quality purity percent (0-100) */
function purityPercent(tds: number): number {
  if (tds < 50) return 98;
  if (tds < 150) return 92;
  if (tds < 300) return 80;
  return 60;
}

/** Get combined insight string */
function combinedInsight(tds: number, ph: number): string {
  const td = tdsLabel(tds);
  const ph_ = phLabel(ph);
  if (tds < 50 && ph >= 6.5 && ph < 7.5) {
    return "Pristine water — ideal for drinking and sensitive equipment.";
  }
  if (tds < 150 && ph >= 6.5 && ph < 7.5) {
    return "Water quality is excellent. All filtration stages operating optimally.";
  }
  if (tds >= 300) {
    return "TDS levels elevated. Schedule filter cartridge replacement soon.";
  }
  if (ph < 6.5) {
    return "pH slightly low. Check RO membrane for wear.";
  }
  if (ph >= 8.5) {
    return "High alkalinity. Consider a pH-neutralizing post-filter stage.";
  }
  return `${td}. ${ph_}. System running within normal parameters.`;
}

export function getWaterInsight(tds: number, ph: number): WaterInsight {
  return {
    tdsLabel: tdsLabel(tds),
    phLabel: phLabel(ph),
    combined: combinedInsight(tds, ph),
    purityPercent: purityPercent(tds),
  };
}

/**
 * Keyword-based command parser.
 * Reads natural language keywords from text input and maps to mode + volume.
 */
export function parseKeywordCommand(input: string): ParsedCommand {
  const lower = input.toLowerCase();
  const result: ParsedCommand = {};

  // Mode detection
  if (
    lower.includes("hot") ||
    lower.includes("warm") ||
    lower.includes("tea") ||
    lower.includes("coffee")
  ) {
    result.mode = "HOT";
  } else if (
    lower.includes("cold") ||
    lower.includes("ice") ||
    lower.includes("chill")
  ) {
    result.mode = "COLD";
  } else if (
    lower.includes("ambient") ||
    lower.includes("room") ||
    lower.includes("normal")
  ) {
    result.mode = "AMBIENT";
  }

  // Volume detection
  if (
    lower.includes("large") ||
    lower.includes("bottle") ||
    lower.includes("liter") ||
    lower.includes("litre") ||
    lower.includes("1000")
  ) {
    result.volume = 1000;
  } else if (
    lower.includes("medium") ||
    lower.includes("glass") ||
    lower.includes("500")
  ) {
    result.volume = 500;
  } else if (
    lower.includes("small") ||
    lower.includes("cup") ||
    lower.includes("300")
  ) {
    result.volume = 300;
  } else if (
    lower.includes("tiny") ||
    lower.includes("shot") ||
    lower.includes("150")
  ) {
    result.volume = 150;
  }

  return result;
}
