/**
 * CLUES Property Dashboard - Fee Normalizer Module
 *
 * Handles fee frequency normalization and bidirectional conversion
 * between monthly/annual fees for HOA and Condo fees.
 *
 * Created: 2025-01-05
 *
 * Replaces the old convertToAnnualHOA() with a more comprehensive solution:
 * - Bidirectional conversion (annual ↔ monthly)
 * - More frequency types (Semi-Annual, Biweekly)
 * - Condo detection helper
 */

export type FeeFrequency =
  | "Monthly"
  | "Quarterly"
  | "Semi-Annual"
  | "Annually"
  | "Weekly"
  | "Biweekly"
  | "Unknown";

/**
 * Normalize free-form frequency strings to standard FeeFrequency type
 */
export function normalizeFeeFrequency(input?: string): FeeFrequency {
  if (!input) return "Unknown";
  const s = input.trim().toLowerCase();

  if (s.includes("month")) return "Monthly";
  if (s.includes("quarter") || s.includes("qtr")) return "Quarterly";
  if (s.includes("semi") || s.includes("biannual") || s.includes("twice")) return "Semi-Annual";
  if (s.includes("biweek")) return "Biweekly";
  if (s.includes("week")) return "Weekly";
  if (s.includes("year") || s.includes("annual")) return "Annually";

  return "Unknown";
}

/**
 * Convert a fee to annual based on its frequency
 */
export function annualizeFee(fee: number, freq: FeeFrequency): number | null {
  if (!Number.isFinite(fee)) return null;
  switch (freq) {
    case "Monthly": return fee * 12;
    case "Quarterly": return fee * 4;
    case "Semi-Annual": return fee * 2;
    case "Annually": return fee;
    case "Weekly": return fee * 52;
    case "Biweekly": return fee * 26;
    default: return null;
  }
}

/**
 * Convert a fee to monthly based on its frequency
 */
export function monthlyizeFee(fee: number, freq: FeeFrequency): number | null {
  if (!Number.isFinite(fee)) return null;
  switch (freq) {
    case "Monthly": return fee;
    case "Quarterly": return fee / 3;
    case "Semi-Annual": return fee / 6;
    case "Annually": return fee / 12;
    case "Weekly": return (fee * 52) / 12;
    case "Biweekly": return (fee * 26) / 12;
    default: return null;
  }
}

/**
 * Check if a property type is condo-like (Condo, Co-op, etc.)
 */
export function isCondoLike(propertyType?: string): boolean {
  if (!propertyType) return false;
  const t = propertyType.toLowerCase();
  return t.includes("condo") || t.includes("condominium") || t.includes("co-op") || t.includes("coop");
}

// ============================================
// SPECIAL SALE TYPE NORMALIZER
// ============================================

export type SpecialSaleType =
  | "REO"
  | "Short Sale"
  | "Auction"
  | "Probate"
  | "Estate"
  | "Relocation"
  | "Bank Owned"
  | "None"
  | "Unknown";

/**
 * Normalize special sale type strings to standard SpecialSaleType
 */
export function normalizeSpecialSaleType(input?: string): SpecialSaleType {
  if (!input) return "Unknown";
  const s = input.toLowerCase();

  if (s.includes("reo") || s.includes("bank owned")) return "Bank Owned";
  if (s.includes("short")) return "Short Sale";
  if (s.includes("auction")) return "Auction";
  if (s.includes("probate")) return "Probate";
  if (s.includes("estate")) return "Estate";
  if (s.includes("relocation")) return "Relocation";
  if (s.includes("none") || s.includes("standard")) return "None";

  return "Unknown";
}

// ============================================
// PDF POST-PARSE FEE NORMALIZER
// ============================================

/**
 * Normalize fees after PDF extraction
 * - Computes missing monthly ↔ annual conversions
 * - Sums HOA + Condo annual fees into canonical Field 31
 */
export function normalizeFeesFromPdf(out: Record<string, any>): Record<string, any> {
  const freq = normalizeFeeFrequency(out['31E_fee_frequency_primary']);
  const monthly = out['31A_hoa_fee_monthly'];
  const annual = out['31B_hoa_fee_annual'];

  // If monthly exists but annual missing → compute annual
  if (monthly != null && annual == null) {
    const a = annualizeFee(Number(monthly), freq === "Unknown" ? "Monthly" : freq);
    out['31B_hoa_fee_annual'] = a;
  }

  // If annual exists but monthly missing → compute monthly
  if (annual != null && monthly == null) {
    const m = monthlyizeFee(Number(annual), freq === "Unknown" ? "Annually" : freq);
    out['31A_hoa_fee_monthly'] = m;
  }

  // Canonical Field 31 (annualized total)
  const hoaAnnual = Number(out['31B_hoa_fee_annual'] ?? 0);
  const condoAnnual = Number(out['31D_condo_fee_annual'] ?? 0);
  out['31_association_fee'] = hoaAnnual + condoAnnual;

  return out;
}
