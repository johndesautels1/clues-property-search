/**
 * Saved Reports Page - View and manage saved Olivia Executive Reports
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Download, Trash2, Eye, Calendar, MapPin,
  Edit2, Save, X, AlertTriangle, Search, Filter,
  Clock, Star, ArrowUpDown
} from 'lucide-react';
import {
  getSavedReports,
  deleteReport,
  updateReportTitle,
  updateReportNotes,
  exportReportAsJSON,
  getStorageInfo,
  type SavedReport
} from '@/lib/reports-manager';
import { OliviaExecutiveReport } from '@/components/OliviaExecutiveReport';

type SortBy = 'newest' | 'oldest' | 'title';

export default function SavedReports() {
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<SavedReport | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('newest');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [storageInfo, setStorageInfo] = useState(getStorageInfo());

  // Load reports on mount
  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = () => {
    const loaded = getSavedReports();
    setReports(loaded);
    setStorageInfo(getStorageInfo());
  };

  // Filter and sort reports
  const filteredReports = reports
    .filter(report => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        report.title.toLowerCase().includes(query) ||
        report.properties.some(p =>
          p.address.toLowerCase().includes(query) ||
          p.city.toLowerCase().includes(query)
        )
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return a.timestamp - b.timestamp;
        case 'title':
          return a.title.localeCompare(b.title);
        case 'newest':
        default:
          return b.timestamp - a.timestamp;
      }
    });

  const handleDelete = (id: string) => {
    if (deleteReport(id)) {
      loadReports();
      setShowDeleteConfirm(null);
    }
  };

  const handleStartEdit = (report: SavedReport) => {
    setEditingId(report.id);
    setEditTitle(report.title);
    setEditNotes(report.notes || '');
  };

  const handleSaveEdit = (id: string) => {
    updateReportTitle(id, editTitle);
    updateReportNotes(id, editNotes);
    setEditingId(null);
    loadReports();
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditNotes('');
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatStorageSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <motion.div
      className="px-4 py-6 md:px-8 md:py-10 max-w-7xl mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-orbitron text-2xl md:text-3xl font-bold text-gradient-quantum mb-2">
          Saved Olivia Reports
        </h1>
        <p className="text-gray-400">
          View, manage, and export your saved property analysis reports
        </p>
      </div>

      {/* Storage Info Bar */}
      <div className="glass-card p-4 mb-6 border border-white/10 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Storage Usage</span>
          <span className="text-sm text-gray-300">
            {formatStorageSize(storageInfo.used)} / {formatStorageSize(storageInfo.available)}
          </span>
        </div>
        <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              storageInfo.percentage > 80 ? 'bg-red-500' :
              storageInfo.percentage > 60 ? 'bg-yellow-500' :
              'bg-quantum-cyan'
            }`}
            style={{ width: `${Math.min(storageInfo.percentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search reports by title or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-quantum-cyan/50"
          />
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortBy)}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-quantum-cyan/50"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="title">By Title</option>
        </select>
      </div>

      {/* Reports Grid */}
      {filteredReports.length === 0 ? (
        <div className="glass-card p-12 text-center border border-white/10 rounded-2xl">
          <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">
            {searchQuery ? 'No reports found' : 'No saved reports yet'}
          </h3>
          <p className="text-gray-500">
            {searchQuery
              ? 'Try adjusting your search query'
              : 'Generate an Olivia analysis and save it to see it here'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReports.map((report) => (
            <motion.div
              key={report.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-card p-5 border border-white/10 rounded-xl hover:border-quantum-cyan/30 transition-all"
            >
              {editingId === report.id ? (
                /* Edit Mode */
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-quantum-cyan/50"
                    placeholder="Report title..."
                  />
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-quantum-cyan/50 resize-none"
                    rows={3}
                    placeholder="Notes..."
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveEdit(report.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-quantum-green/20 text-quantum-green border border-quantum-green/30 rounded-lg hover:bg-quantum-green/30 transition-all"
                    >
                      <Save className="w-4 h-4" />
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/5 text-gray-400 border border-white/10 rounded-lg hover:bg-white/10 transition-all"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* View Mode */
                <>
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-white flex-1 line-clamp-2">
                      {report.title}
                    </h3>
                    <Star className="w-5 h-5 text-quantum-cyan flex-shrink-0 ml-2" />
                  </div>

                  {/* Timestamp */}
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(report.timestamp)}
                  </div>

                  {/* Properties */}
                  <div className="space-y-1 mb-4">
                    {report.properties.map((prop, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <MapPin className="w-3.5 h-3.5 text-gray-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-300 line-clamp-1">
                          {prop.address}, {prop.city}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Notes */}
                  {report.notes && (
                    <p className="text-xs text-gray-400 mb-4 line-clamp-2 italic">
                      "{report.notes}"
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedReport(report)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-quantum-cyan/20 text-quantum-cyan border border-quantum-cyan/30 rounded-lg hover:bg-quantum-cyan/30 transition-all"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    <button
                      onClick={() => handleStartEdit(report)}
                      className="p-2 bg-white/5 text-gray-400 border border-white/10 rounded-lg hover:bg-white/10 hover:text-white transition-all"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => exportReportAsJSON(report)}
                      className="p-2 bg-white/5 text-gray-400 border border-white/10 rounded-lg hover:bg-white/10 hover:text-white transition-all"
                      title="Export JSON"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(report.id)}
                      className="p-2 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-all"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Delete Confirmation */}
                  {showDeleteConfirm === report.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
                    >
                      <div className="flex items-start gap-2 mb-3">
                        <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                        <p className="text-sm text-red-300">
                          Are you sure? This cannot be undone.
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDelete(report.id)}
                          className="flex-1 px-3 py-1.5 bg-red-500/20 text-red-400 border border-red-500/40 rounded-lg hover:bg-red-500/30 transition-all text-sm font-medium"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(null)}
                          className="flex-1 px-3 py-1.5 bg-white/5 text-gray-400 border border-white/10 rounded-lg hover:bg-white/10 transition-all text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  )}
                </>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* View Selected Report Modal */}
      <AnimatePresence>
        {selectedReport && (
          <OliviaExecutiveReport
            result={selectedReport.result}
            properties={selectedReport.properties}
            onClose={() => setSelectedReport(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
