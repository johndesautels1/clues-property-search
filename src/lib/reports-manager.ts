/**
 * Reports Manager - localStorage-based persistence for Olivia Executive Reports
 * Handles saving, loading, and managing saved analysis reports
 */

import type { OliviaEnhancedAnalysisResult } from '@/types/olivia-enhanced';

export interface SavedReport {
  id: string;
  timestamp: number;
  title: string;
  properties: Array<{ id: string; address: string; city: string }>;
  result: OliviaEnhancedAnalysisResult;
  notes?: string;
}

const STORAGE_KEY = 'clues_saved_reports';
const MAX_REPORTS = 50; // Limit to prevent localStorage overflow

/**
 * Get all saved reports
 */
export function getSavedReports(): SavedReport[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const reports = JSON.parse(stored) as SavedReport[];
    // Sort by timestamp descending (newest first)
    return reports.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Failed to load saved reports:', error);
    return [];
  }
}

/**
 * Save a new report
 */
export function saveReport(
  title: string,
  properties: Array<{ id: string; address: string; city: string }>,
  result: OliviaEnhancedAnalysisResult,
  notes?: string
): SavedReport {
  try {
    const reports = getSavedReports();

    const newReport: SavedReport = {
      id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      title,
      properties,
      result,
      notes,
    };

    // Add to beginning and limit total count
    reports.unshift(newReport);
    if (reports.length > MAX_REPORTS) {
      reports.splice(MAX_REPORTS);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
    return newReport;
  } catch (error) {
    console.error('Failed to save report:', error);
    throw new Error('Failed to save report. Storage may be full.');
  }
}

/**
 * Get a specific report by ID
 */
export function getReportById(id: string): SavedReport | null {
  const reports = getSavedReports();
  return reports.find(r => r.id === id) || null;
}

/**
 * Delete a report
 */
export function deleteReport(id: string): boolean {
  try {
    const reports = getSavedReports();
    const filtered = reports.filter(r => r.id !== id);

    if (filtered.length === reports.length) {
      return false; // Report not found
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Failed to delete report:', error);
    return false;
  }
}

/**
 * Update report notes
 */
export function updateReportNotes(id: string, notes: string): boolean {
  try {
    const reports = getSavedReports();
    const report = reports.find(r => r.id === id);

    if (!report) return false;

    report.notes = notes;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
    return true;
  } catch (error) {
    console.error('Failed to update report notes:', error);
    return false;
  }
}

/**
 * Update report title
 */
export function updateReportTitle(id: string, title: string): boolean {
  try {
    const reports = getSavedReports();
    const report = reports.find(r => r.id === id);

    if (!report) return false;

    report.title = title;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
    return true;
  } catch (error) {
    console.error('Failed to update report title:', error);
    return false;
  }
}

/**
 * Export report as JSON
 */
export function exportReportAsJSON(report: SavedReport): void {
  const dataStr = JSON.stringify(report, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `olivia-report-${report.id}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Get storage usage info
 */
export function getStorageInfo(): { used: number; available: number; percentage: number } {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) || '';
    const used = new Blob([stored]).size;
    const available = 5 * 1024 * 1024; // ~5MB typical localStorage limit
    const percentage = (used / available) * 100;

    return { used, available, percentage };
  } catch (error) {
    return { used: 0, available: 0, percentage: 0 };
  }
}

/**
 * Clear all reports (with confirmation)
 */
export function clearAllReports(): void {
  localStorage.removeItem(STORAGE_KEY);
}
