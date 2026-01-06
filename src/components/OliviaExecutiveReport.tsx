/**
 * OLIVIA EXECUTIVE PROPERTY APPRAISAL REPORT
 * World-class executive appraisal with HeyGen avatar integration
 *
 * Features:
 * - HeyGen avatar video (Olivia speaks)
 * - Executive Summary
 * - Key Findings
 * - 23 Section-by-Section Analysis
 * - Multi-LLM Market Forecast
 * - Decision Tree Recommendations
 * - Interactive Q&A
 * - Call to Action
 */

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Play, Pause, Volume2, VolumeX, Maximize2, Minimize2,
  Trophy, TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  Info, MessageCircle, Send, ChevronDown, ChevronRight,
  Star, Award, Target, Calendar, Brain, Sparkles, Zap,
  Phone, Mail, Video, FileText, ArrowRight, ExternalLink,
  DollarSign, Home, MapPin, Shield, CloudRain, GraduationCap,
  Receipt, Wrench, TreePine, Navigation, Car, Building, Waves,
  Users, Scale, FileCheck, Save, Download
} from 'lucide-react';
import type { OliviaEnhancedAnalysisResult, SectionAnalysis, KeyFinding } from '@/types/olivia-enhanced';
import { saveReport, exportReportAsJSON } from '@/lib/reports-manager';

interface OliviaExecutiveReportProps {
  result: OliviaEnhancedAnalysisResult;
  properties: Array<{ id: string; address: string; city: string }>;
  onClose: () => void;
}

// Section icons mapping (23 sections A-W)
const SECTION_ICONS: Record<string, any> = {
  'Address & Identity': MapPin,
  'Pricing & Value': DollarSign,
  'Property Basics': Home,
  'HOA & Taxes': Receipt,
  'Structure & Systems': Wrench,
  'Interior Features': Home,
  'Exterior Features': TreePine,
  'Permits & Renovations': FileCheck,
  'Assigned Schools': GraduationCap,
  'Location Scores': Navigation,
  'Distances & Amenities': MapPin,
  'Safety & Crime': Shield,
  'Market & Investment': TrendingUp,
  'Utilities & Connectivity': Zap,
  'Environment & Risk': CloudRain,
  'Additional Features': Star,
  'Parking Details': Car,
  'Building Details': Building,
  'Legal & Compliance': Scale,
  'Waterfront': Waves,
  'Leasing & Rentals': FileText,
  'Community & Features': Users,
  'Market Performance': TrendingUp,  // Section W - fields 169-181
};

export function OliviaExecutiveReport({ result, properties, onClose }: OliviaExecutiveReportProps) {
  // Video player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<HTMLDivElement>(null);

  // Navigation state
  const [activeSection, setActiveSection] = useState<number | null>(null);
  const [showTranscript, setShowTranscript] = useState(true);

  // Q&A state
  const [qaQuestion, setQaQuestion] = useState('');
  const [qaHistory, setQaHistory] = useState(result.qaState?.conversationHistory || []);

  // Save state
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [reportSaved, setReportSaved] = useState(false);
  const [saveTitle, setSaveTitle] = useState(
    properties.map(p => p.address.split(',')[0]).join(' vs ') + ' - Analysis'
  );
  const [saveNotes, setSaveNotes] = useState('');

  // Handle save report
  const handleSaveReport = () => {
    try {
      saveReport(saveTitle, properties, result, saveNotes);
      setReportSaved(true);
      setShowSaveDialog(false);
      // Show success message briefly
      setTimeout(() => {
        const msg = document.createElement('div');
        msg.className = 'fixed top-4 right-4 z-[100] glass-card border border-quantum-green/30 px-6 py-3 rounded-xl text-quantum-green font-medium animate-fade-in';
        msg.textContent = '✓ Report saved successfully!';
        document.body.appendChild(msg);
        setTimeout(() => {
          msg.remove();
        }, 3000);
      }, 100);
    } catch (error) {
      alert('Failed to save report. Storage may be full.');
    }
  };

  // Handle close with confirmation if not saved
  const handleClose = () => {
    if (!reportSaved) {
      setShowCloseConfirm(true);
    } else {
      onClose();
    }
  };

  // Get property address helper
  const getPropertyAddress = (propertyId: string) => {
    const prop = properties.find(p => p.id === propertyId);
    return prop ? `${prop.address}, ${prop.city}` : 'Unknown Property';
  };

  // Grade color helper
  const getGradeColor = (grade: string | undefined) => {
    if (!grade) return 'text-gray-400';
    if (grade.startsWith('A')) return 'text-quantum-green';
    if (grade.startsWith('B')) return 'text-quantum-cyan';
    if (grade.startsWith('C')) return 'text-quantum-orange';
    return 'text-quantum-red';
  };

  // Grade background helper
  const getGradeBg = (grade: string | undefined) => {
    if (!grade) return 'from-gray-500/20 to-gray-500/5';
    if (grade.startsWith('A')) return 'from-quantum-green/20 to-quantum-green/5';
    if (grade.startsWith('B')) return 'from-quantum-cyan/20 to-quantum-cyan/5';
    if (grade.startsWith('C')) return 'from-quantum-orange/20 to-quantum-orange/5';
    return 'from-quantum-red/20 to-quantum-red/5';
  };

  // Finding icon helper
  const getFindingIcon = (category: KeyFinding['category']) => {
    switch (category) {
      case 'strength': return <CheckCircle className="w-5 h-5 text-quantum-green" />;
      case 'opportunity': return <TrendingUp className="w-5 h-5 text-quantum-cyan" />;
      case 'concern': return <Info className="w-5 h-5 text-quantum-orange" />;
      case 'risk': return <AlertTriangle className="w-5 h-5 text-quantum-red" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm"
    >
      <div className="min-h-screen px-4 py-8">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="max-w-7xl mx-auto"
        >
          {/* ============================================================
              HEADER
          ============================================================ */}
          <div className="relative glass-card border border-quantum-purple/30 rounded-2xl overflow-hidden mb-6">
            {/* Animated background */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0 bg-grid-quantum" />
            </div>

            <div className="relative z-10 flex items-center justify-between px-6 py-5">
              <div className="flex items-center gap-4">
                <motion.img
                  src="/clues-icon.svg"
                  className="w-14 h-14 filter drop-shadow-glow-cyan"
                  initial={{ rotate: -180, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: "spring", duration: 0.8 }}
                />
                <div>
                  <h1 className="font-orbitron text-2xl font-bold text-gradient-quantum">
                    Executive Property Appraisal
                  </h1>
                  <p className="text-sm text-quantum-cyan flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Olivia's Comprehensive 181-Field Intelligence Report
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Export JSON Button */}
                <button
                  onClick={() => exportReportAsJSON({ id: `temp_${Date.now()}`, timestamp: Date.now(), title: saveTitle, properties, result })}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 rounded-lg transition-all"
                  title="Export as JSON"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm">Export</span>
                </button>
                {/* Save Button */}
                <button
                  onClick={() => setShowSaveDialog(true)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    reportSaved
                      ? 'bg-quantum-green/20 text-quantum-green border border-quantum-green/30'
                      : 'bg-quantum-cyan/20 text-quantum-cyan border border-quantum-cyan/30 hover:bg-quantum-cyan/30'
                  }`}
                  title={reportSaved ? 'Report saved' : 'Save report'}
                >
                  <Save className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm font-medium">
                    {reportSaved ? 'Saved' : 'Save'}
                  </span>
                </button>
                {/* Close Button */}
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-all duration-200 hover:rotate-90"
                  title="Close report"
                >
                  <X className="w-6 h-6 text-gray-400 hover:text-white" />
                </button>
              </div>
            </div>
          </div>

          {/* ============================================================
              HEYGEN AVATAR SECTION
          ============================================================ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Video Player (Left - 2 columns) */}
            <div className="lg:col-span-2">
              <div className="glass-card p-6 border border-quantum-purple/30 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-quantum-purple to-quantum-cyan flex items-center justify-center">
                      <span className="text-xl font-bold">O</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Olivia's Video Analysis</h3>
                      <p className="text-xs text-gray-400">Your Personal Property Advisor</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsFullscreen(!isFullscreen)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Video Container */}
                <div ref={videoRef} className="relative aspect-video bg-black/50 rounded-xl overflow-hidden mb-4">
                  {/* HeyGen video embed will go here */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-r from-quantum-purple to-quantum-cyan flex items-center justify-center mx-auto mb-4">
                        <Video className="w-12 h-12" />
                      </div>
                      <p className="text-white font-semibold mb-2">HeyGen Avatar Integration</p>
                      <p className="text-sm text-gray-400 mb-4">Olivia will guide you through your property analysis</p>
                      <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="px-6 py-3 bg-gradient-to-r from-quantum-purple to-quantum-cyan rounded-xl font-semibold hover:opacity-90 transition-all"
                      >
                        <Play className="w-5 h-5 inline mr-2" />
                        Start Video Analysis
                      </button>
                    </div>
                  </div>

                  {/* Video Controls (bottom overlay) */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                      >
                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                      </button>

                      <div className="flex-1 mx-4">
                        <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                          <div className="h-full w-1/3 bg-quantum-cyan rounded-full" />
                        </div>
                      </div>

                      <button
                        onClick={() => setIsMuted(!isMuted)}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                      >
                        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Live Transcript Toggle */}
                <button
                  onClick={() => setShowTranscript(!showTranscript)}
                  className="w-full flex items-center justify-between px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <span className="text-sm text-gray-400">Live Transcript</span>
                  {showTranscript ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>

                {/* Transcript */}
                <AnimatePresence>
                  {showTranscript && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-4 p-4 bg-black/30 rounded-xl max-h-40 overflow-y-auto"
                    >
                      <p className="text-sm text-gray-300 leading-relaxed italic">
                        "{result.verbalAnalysis?.executiveSummary || 'Generating executive summary...'}"
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Investment Grade Card (Right - 1 column) */}
            <div className="lg:col-span-1">
              <div className={`glass-card p-6 border-2 border-quantum-green/40 rounded-2xl bg-gradient-to-br ${getGradeBg(result.investmentGrade?.overallGrade || 'N/A')}`}>
                <div className="flex items-center gap-2 mb-4">
                  <Award className="w-6 h-6 text-quantum-green" />
                  <h3 className="font-semibold text-white">Investment Grade</h3>
                </div>

                <div className="text-center mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                    className={`text-6xl font-bold ${getGradeColor(result.investmentGrade?.overallGrade || 'N/A')} mb-2`}
                  >
                    {result.investmentGrade?.overallGrade || 'N/A'}
                  </motion.div>
                  <div className="text-2xl font-semibold text-white mb-1">
                    {result.investmentGrade?.overallScore || 0}/100
                  </div>
                  <div className="text-sm text-gray-400">
                    {result.investmentGrade?.confidence || 0}% Confidence
                  </div>
                </div>

                {/* Component Scores */}
                <div className="space-y-3">
                  {[
                    { label: 'Value', score: result.investmentGrade?.valueScore || 0, color: 'quantum-green' },
                    { label: 'Location', score: result.investmentGrade?.locationScore || 0, color: 'quantum-cyan' },
                    { label: 'Condition', score: result.investmentGrade?.conditionScore || 0, color: 'quantum-purple' },
                    { label: 'Investment', score: result.investmentGrade?.investmentScore || 0, color: 'quantum-blue' },
                    { label: 'Risk', score: 100 - (result.investmentGrade?.riskScore || 0), color: 'quantum-orange' },
                  ].map((item, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">{item.label}</span>
                        <span className="text-white font-medium">{item.score}/100</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${item.score}%` }}
                          transition={{ duration: 1, delay: 0.5 + (idx * 0.1) }}
                          className={`h-full bg-${item.color} rounded-full`}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-sm text-gray-300 mt-4 p-3 bg-black/20 rounded-lg">
                  {result.investmentGrade?.summary || 'Analyzing investment grade...'}
                </p>
              </div>
            </div>
          </div>

          {/* ============================================================
              EXECUTIVE SUMMARY
          ============================================================ */}
          <div className="glass-card p-6 border border-white/10 rounded-2xl mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Brain className="w-6 h-6 text-quantum-purple" />
              <h2 className="text-xl font-bold text-white">Executive Summary</h2>
            </div>

            <div className="bg-gradient-to-r from-quantum-purple/10 via-quantum-cyan/10 to-transparent p-5 rounded-xl border border-quantum-purple/20">
              <p className="text-gray-200 leading-relaxed mb-4">
                {result.verbalAnalysis?.comparisonInsights || 'Analyzing comparison insights...'}
              </p>

              {/* Top Recommendation */}
              <div className="flex items-start gap-4 p-4 bg-quantum-green/10 border-l-4 border-quantum-green rounded-lg">
                <Trophy className="w-6 h-6 text-quantum-green flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <p className="text-sm text-quantum-green font-semibold mb-1">Olivia's Top Recommendation</p>
                  <p className="text-lg font-bold text-white mb-2">
                    {result.verbalAnalysis?.topRecommendation?.propertyId
                      ? getPropertyAddress(result.verbalAnalysis.topRecommendation.propertyId)
                      : 'Analyzing properties...'}
                  </p>
                  <p className="text-sm text-gray-300 mb-2">
                    {result.verbalAnalysis?.topRecommendation?.reasoning || 'Generating recommendation...'}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-gray-400">Confidence:</div>
                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden max-w-[200px]">
                      <div
                        className="h-full bg-quantum-green rounded-full"
                        style={{ width: `${result.verbalAnalysis?.topRecommendation?.confidence || 0}%` }}
                      />
                    </div>
                    <div className="text-xs font-semibold text-quantum-green">
                      {result.verbalAnalysis?.topRecommendation?.confidence || 0}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================
              KEY FINDINGS (Top 6-8 Insights)
          ============================================================ */}
          <div className="glass-card p-6 border border-white/10 rounded-2xl mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Star className="w-6 h-6 text-quantum-cyan" />
              <h2 className="text-xl font-bold text-white">Key Findings</h2>
              <span className="text-sm text-gray-400">
                ({result.keyFindings?.length || 0} critical insights from 181-field analysis)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(result.keyFindings || []).map((finding, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`p-4 rounded-xl border ${
                    finding.category === 'strength'
                      ? 'bg-quantum-green/5 border-quantum-green/30'
                      : finding.category === 'opportunity'
                      ? 'bg-quantum-cyan/5 border-quantum-cyan/30'
                      : finding.category === 'concern'
                      ? 'bg-quantum-orange/5 border-quantum-orange/30'
                      : 'bg-quantum-red/5 border-quantum-red/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {getFindingIcon(finding.category)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-white">{finding.title}</h4>
                        <span className={`text-xs px-2 py-1 rounded ${
                          finding.impact === 'high'
                            ? 'bg-quantum-red/20 text-quantum-red'
                            : finding.impact === 'medium'
                            ? 'bg-quantum-orange/20 text-quantum-orange'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {finding.impact.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 mb-2">{finding.description}</p>
                      <div className="text-xs text-gray-500">
                        Based on {finding.fields?.length || 0} data points
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* ============================================================
              SECTION-BY-SECTION ANALYSIS (23 Sections)
          ============================================================ */}
          <div className="glass-card p-6 border border-white/10 rounded-2xl mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-quantum-purple" />
                <h2 className="text-xl font-bold text-white">Detailed Section Analysis</h2>
              </div>
              <span className="text-sm text-gray-400">22 Categories • 181 Fields</span>
            </div>

            <div className="space-y-3">
              {(result.sectionAnalysis || []).map((section, idx) => {
                const Icon = SECTION_ICONS[section.sectionName] || FileText;
                const isActive = activeSection === idx;

                return (
                  <div key={idx}>
                    {/* Section Header */}
                    <button
                      onClick={() => setActiveSection(isActive ? null : idx)}
                      className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-transparent hover:border-quantum-cyan/30"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getGradeBg(section.grade)} flex items-center justify-center`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>

                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-white">{section.sectionName}</span>
                            <span className={`text-sm font-bold ${getGradeColor(section.grade)}`}>
                              {section.grade}
                            </span>
                            <span className="text-xs text-gray-400">
                              {section.score}/100
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {section.fieldsWithData || 0}/{section.fieldCount || 0} fields • {section.completeness || 0}% complete
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          {/* Quick visual indicator */}
                          <div className="w-16 h-8 bg-white/10 rounded overflow-hidden">
                            <div
                              className={`h-full bg-gradient-to-r from-quantum-cyan to-quantum-purple`}
                              style={{ width: `${section.score}%` }}
                            />
                          </div>

                          {isActive ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                        </div>
                      </div>
                    </button>

                    {/* Section Details (Expandable) */}
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-6 bg-black/20 rounded-b-xl border-x border-b border-white/5">
                            {/* Key Findings for this section */}
                            <div className="grid md:grid-cols-2 gap-6 mb-6">
                              {/* Strengths */}
                              <div>
                                <h4 className="text-sm font-semibold text-quantum-green mb-3 flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4" />
                                  Strengths
                                </h4>
                                <ul className="space-y-2">
                                  {(section.strengths || []).map((strength, i) => (
                                    <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                      <span className="text-quantum-green">+</span>
                                      {strength}
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              {/* Concerns */}
                              <div>
                                <h4 className="text-sm font-semibold text-quantum-orange mb-3 flex items-center gap-2">
                                  <AlertTriangle className="w-4 h-4" />
                                  Concerns
                                </h4>
                                <ul className="space-y-2">
                                  {(section.concerns || []).map((concern, i) => (
                                    <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                      <span className="text-quantum-orange">−</span>
                                      {concern}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>

                            {/* Summary Visual (One per section) */}
                            <div className="p-4 bg-gradient-to-r from-quantum-purple/10 to-quantum-cyan/10 rounded-xl border border-quantum-purple/20">
                              <div className="text-center">
                                <p className="text-sm text-quantum-cyan mb-2">Section Summary Visual</p>
                                <div className="h-32 flex items-center justify-center text-gray-500">
                                  [Stunning {section.visualData.type} chart visualization]
                                </div>
                              </div>
                            </div>

                            {/* Navigate to detailed charts button */}
                            <button className="w-full mt-4 px-4 py-2 bg-quantum-cyan/20 hover:bg-quantum-cyan/30 rounded-lg text-sm text-quantum-cyan font-medium transition-colors flex items-center justify-center gap-2">
                              <ExternalLink className="w-4 h-4" />
                              View Detailed Charts & Data in Compare Page
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ============================================================
              PROPERTY RANKINGS
          ============================================================ */}
          <div className="glass-card p-6 border border-white/10 rounded-2xl mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Trophy className="w-6 h-6 text-quantum-green" />
              <h2 className="text-xl font-bold text-white">Property Rankings</h2>
            </div>

            <div className="space-y-4">
              {(result.propertyRankings || []).map((ranking, idx) => (
                <motion.div
                  key={ranking.propertyId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`p-5 rounded-xl ${
                    ranking.rank === 1
                      ? 'bg-gradient-to-r from-quantum-green/20 to-quantum-green/5 border-2 border-quantum-green/40'
                      : 'bg-white/5 border border-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold ${
                        ranking.rank === 1
                          ? 'bg-quantum-green/30 text-quantum-green'
                          : ranking.rank === 2
                          ? 'bg-gray-400/30 text-gray-400'
                          : 'bg-amber-700/30 text-amber-700'
                      }`}>
                        #{ranking.rank}
                      </div>
                      <div>
                        <h4 className="font-semibold text-white text-lg">
                          {getPropertyAddress(ranking.propertyId)}
                        </h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className={`text-lg font-bold ${getGradeColor(ranking.grade)}`}>
                            {ranking.grade}
                          </span>
                          <span className="text-sm text-gray-400">
                            Score: {ranking.overallScore}/100
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pros and Cons */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-quantum-green/10 border border-quantum-green/20 rounded-lg p-3">
                      <h5 className="text-xs font-semibold text-quantum-green mb-2">STRENGTHS</h5>
                      <ul className="space-y-1">
                        {(ranking.pros || []).map((pro, i) => (
                          <li key={i} className="text-sm text-gray-300">+ {pro}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-quantum-red/10 border border-quantum-red/20 rounded-lg p-3">
                      <h5 className="text-xs font-semibold text-quantum-red mb-2">CONSIDERATIONS</h5>
                      <ul className="space-y-1">
                        {(ranking.cons || []).map((con, i) => (
                          <li key={i} className="text-sm text-gray-300">− {con}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* ============================================================
              MULTI-LLM MARKET FORECAST
          ============================================================ */}
          <div className="glass-card p-6 border border-quantum-cyan/30 rounded-2xl mb-6 bg-gradient-to-br from-quantum-cyan/5 to-transparent">
            <div className="flex items-center gap-3 mb-4">
              <Brain className="w-6 h-6 text-quantum-cyan" />
              <h2 className="text-xl font-bold text-white">Multi-LLM Market Forecast</h2>
              <span className="text-xs px-2 py-1 bg-quantum-cyan/20 text-quantum-cyan rounded">
                Powered by {result.marketForecast?.llmSources?.length || 0} AI Models
              </span>
            </div>

            <p className="text-sm text-gray-400 mb-6">
              Consensus forecast generated by: {(result.marketForecast?.llmSources || []).map(s => s.toUpperCase()).join(', ')}
            </p>

            {/* Appreciation Forecast */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: '1 Year', value: result.marketForecast?.appreciationForecast?.year1 || 0 },
                { label: '3 Years', value: result.marketForecast?.appreciationForecast?.year3 || 0 },
                { label: '5 Years', value: result.marketForecast?.appreciationForecast?.year5 || 0 },
                { label: '10 Years', value: result.marketForecast?.appreciationForecast?.year10 || 0 },
              ].map((forecast, idx) => (
                <div key={idx} className="p-4 bg-white/5 rounded-xl text-center">
                  <div className="text-2xl font-bold text-quantum-cyan mb-1">
                    +{forecast.value.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-400">{forecast.label}</div>
                </div>
              ))}
            </div>

            {/* Market Trends */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-black/20 rounded-xl">
                <h4 className="text-sm font-semibold text-white mb-3">Market Trends</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Price Direction:</span>
                    <span className="text-white font-medium">{result.marketForecast?.marketTrends?.priceDirection || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Demand Level:</span>
                    <span className="text-white font-medium">{result.marketForecast?.marketTrends?.demandLevel || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Inventory:</span>
                    <span className="text-white font-medium">{result.marketForecast?.marketTrends?.inventoryLevel || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Days on Market:</span>
                    <span className="text-white font-medium">{result.marketForecast?.marketTrends?.daysOnMarketTrend || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-black/20 rounded-xl">
                <h4 className="text-sm font-semibold text-white mb-3">Opportunities</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Near-Term (1-3 years)</p>
                    <ul className="space-y-1">
                      {(result.marketForecast?.marketOpportunities?.nearTerm || []).slice(0, 2).map((opp, i) => (
                        <li key={i} className="text-sm text-gray-300">• {opp}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Long-Term (5+ years)</p>
                    <ul className="space-y-1">
                      {(result.marketForecast?.marketOpportunities?.longTerm || []).slice(0, 2).map((opp, i) => (
                        <li key={i} className="text-sm text-gray-300">• {opp}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Market Risks */}
            <div className="p-4 bg-quantum-orange/10 border border-quantum-orange/20 rounded-xl">
              <h4 className="text-sm font-semibold text-quantum-orange mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Risk Factors to Monitor
              </h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Economic Risks:</p>
                  <ul className="space-y-1">
                    {(result.marketForecast?.marketRisks?.economicRisks || []).slice(0, 2).map((risk, i) => (
                      <li key={i} className="text-gray-300">• {risk}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Climate Risks:</p>
                  <ul className="space-y-1">
                    {(result.marketForecast?.marketRisks?.climateRisks || []).slice(0, 2).map((risk, i) => (
                      <li key={i} className="text-gray-300">• {risk}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-4 text-xs text-gray-500 text-center">
              Forecast generated: {result.marketForecast?.forecastDate || 'N/A'} • Data Quality: {result.marketForecast?.dataQuality || 'N/A'}
            </div>
          </div>

          {/* ============================================================
              DECISION TREE RECOMMENDATIONS
          ============================================================ */}
          <div className="glass-card p-6 border border-white/10 rounded-2xl mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Target className="w-6 h-6 text-quantum-purple" />
              <h2 className="text-xl font-bold text-white">Tailored Recommendations</h2>
            </div>

            <div className="space-y-4">
              {(result.decisionRecommendations || []).map((rec, idx) => (
                <div key={idx} className="p-5 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-white capitalize">
                      For {rec.buyerProfile.replace('-', ' ')} Buyers
                    </h3>
                    <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                      rec.recommendation.action === 'highly-recommend'
                        ? 'bg-quantum-green/20 text-quantum-green'
                        : rec.recommendation.action === 'recommend'
                        ? 'bg-quantum-cyan/20 text-quantum-cyan'
                        : rec.recommendation.action === 'consider'
                        ? 'bg-quantum-purple/20 text-quantum-purple'
                        : rec.recommendation.action === 'proceed-with-caution'
                        ? 'bg-quantum-orange/20 text-quantum-orange'
                        : 'bg-quantum-red/20 text-quantum-red'
                    }`}>
                      {rec.recommendation.action.replace('-', ' ').toUpperCase()}
                    </span>
                  </div>

                  <p className="text-gray-300 mb-4">{rec.recommendation.reasoning}</p>

                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Financial Analysis */}
                    <div className="p-3 bg-black/20 rounded-lg">
                      <h4 className="text-xs font-semibold text-quantum-cyan mb-2">FINANCIAL SNAPSHOT</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Upfront Costs:</span>
                          <span className="text-white">${rec.financialAnalysis.upfrontCosts.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Monthly Costs:</span>
                          <span className="text-white">${rec.financialAnalysis.monthlyCosts.toLocaleString()}</span>
                        </div>
                        {rec.financialAnalysis.expectedROI && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Expected ROI:</span>
                            <span className="text-quantum-green">{rec.financialAnalysis.expectedROI}%</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Immediate Actions */}
                    <div className="p-3 bg-black/20 rounded-lg">
                      <h4 className="text-xs font-semibold text-quantum-purple mb-2">IMMEDIATE ACTIONS</h4>
                      <ul className="space-y-1 text-sm">
                        {(rec.immediateActions || []).slice(0, 3).map((action, i) => (
                          <li key={i} className="text-gray-300">• {action}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ============================================================
              INTERACTIVE Q&A WITH OLIVIA
          ============================================================ */}
          <div className="glass-card p-6 border border-quantum-purple/30 rounded-2xl mb-6">
            <div className="flex items-center gap-3 mb-4">
              <MessageCircle className="w-6 h-6 text-quantum-purple" />
              <h2 className="text-xl font-bold text-white">Ask Olivia Anything</h2>
            </div>

            {/* Chat History */}
            <div className="mb-4 max-h-60 overflow-y-auto space-y-3">
              {qaHistory.map((qa, idx) => (
                <div key={idx} className="space-y-2">
                  {/* Question */}
                  <div className="flex justify-end">
                    <div className="max-w-[80%] p-3 bg-quantum-cyan/20 rounded-xl">
                      <p className="text-sm text-white">{qa.question}</p>
                    </div>
                  </div>

                  {/* Answer */}
                  <div className="flex justify-start">
                    <div className="max-w-[80%] p-3 bg-white/5 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-quantum-purple to-quantum-cyan flex items-center justify-center text-xs font-bold">
                          O
                        </div>
                        <span className="text-xs text-quantum-purple font-medium">Olivia</span>
                      </div>
                      <p className="text-sm text-gray-300">{qa.answer}</p>
                      {qa.relatedCharts && qa.relatedCharts.length > 0 && (
                        <button className="mt-2 text-xs text-quantum-cyan hover:underline flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" />
                          View related chart
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Suggested Questions */}
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2">Suggested questions:</p>
              <div className="flex flex-wrap gap-2">
                {(result.qaState?.suggestedQuestions || []).slice(0, 3).map((question, idx) => (
                  <button
                    key={idx}
                    onClick={() => setQaQuestion(question)}
                    className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={qaQuestion}
                onChange={(e) => setQaQuestion(e.target.value)}
                placeholder="Ask Olivia about any aspect of these properties..."
                className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-quantum-purple/50"
              />
              <button className="px-6 py-3 bg-gradient-to-r from-quantum-purple to-quantum-cyan rounded-xl font-semibold hover:opacity-90 transition-all">
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* ============================================================
              CALL TO ACTION & NEXT STEPS
          ============================================================ */}
          <div className="glass-card p-6 border-2 border-quantum-cyan/30 rounded-2xl bg-gradient-to-br from-quantum-cyan/10 via-quantum-purple/10 to-transparent">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="w-6 h-6 text-quantum-cyan" />
              <h2 className="text-xl font-bold text-white">Ready to Take Action?</h2>
            </div>

            <p className="text-gray-300 mb-6">
              {result.callToAction?.primaryAction || 'Analyzing your next steps...'}
            </p>

            {/* Action Buttons */}
            <div className="grid sm:grid-cols-3 gap-3 mb-6">
              <button className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-quantum-cyan to-quantum-blue text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-quantum-cyan/30 transition-all">
                <Phone className="w-4 h-4" />
                Schedule Call
              </button>
              <button className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-quantum-purple to-quantum-pink text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-quantum-purple/30 transition-all">
                <Mail className="w-4 h-4" />
                Email Report
              </button>
              <button className="flex items-center justify-center gap-2 px-4 py-3 bg-white/10 border border-white/20 text-white rounded-xl font-semibold hover:bg-white/20 transition-all">
                <Video className="w-4 h-4" />
                Watch Tour
              </button>
            </div>

            {/* Next Steps */}
            <div className="p-4 bg-black/20 rounded-xl">
              <h3 className="text-sm font-semibold text-white mb-3">Your Next Steps:</h3>
              <div className="space-y-2">
                {(result.callToAction?.nextSteps || []).map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-quantum-cyan/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-quantum-cyan">{idx + 1}</span>
                    </div>
                    <p className="text-sm text-gray-300">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ============================================================
              CLUES BRANDING FOOTER
          ============================================================ */}
          <div className="glass-card p-6 border border-white/10 rounded-2xl text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <img src="/clues-icon.svg" className="w-8 h-8" alt="CLUES" />
              <span className="font-orbitron font-bold text-xl text-gradient-quantum">
                CLUES™ Property Intelligence
              </span>
            </div>
            <p className="text-sm text-gray-400 mb-2">
              Analysis powered by Olivia AI • Comprehensive 181-Field Evaluation
            </p>
            <p className="text-xs text-gray-600">
              © 2025 CLUES™ • Comprehensive Location Utility & Evaluation System
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Report ID: {result.analysisId} • Generated: {result.timestamp}
            </p>
          </div>
        </motion.div>
      </div>

      {/* ============================================================
          SAVE DIALOG
      ============================================================ */}
      <AnimatePresence>
        {showSaveDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowSaveDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card border border-quantum-cyan/30 rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-quantum-cyan/20 flex items-center justify-center">
                  <Save className="w-6 h-6 text-quantum-cyan" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Save Report</h3>
                  <p className="text-sm text-gray-400">Save this analysis for later</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Report Title
                  </label>
                  <input
                    type="text"
                    value={saveTitle}
                    onChange={(e) => setSaveTitle(e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-quantum-cyan/50"
                    placeholder="Enter report title..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={saveNotes}
                    onChange={(e) => setSaveNotes(e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-quantum-cyan/50 resize-none"
                    rows={3}
                    placeholder="Add notes about this analysis..."
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleSaveReport}
                    className="flex-1 px-4 py-2 bg-quantum-cyan/20 text-quantum-cyan border border-quantum-cyan/30 rounded-lg hover:bg-quantum-cyan/30 transition-all font-medium"
                  >
                    Save Report
                  </button>
                  <button
                    onClick={() => setShowSaveDialog(false)}
                    className="flex-1 px-4 py-2 bg-white/5 text-gray-400 border border-white/10 rounded-lg hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================
          CLOSE CONFIRMATION DIALOG
      ============================================================ */}
      <AnimatePresence>
        {showCloseConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowCloseConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card border border-yellow-500/30 rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Unsaved Report</h3>
                  <p className="text-sm text-gray-400">You haven't saved this analysis yet</p>
                </div>
              </div>

              <p className="text-gray-300 mb-6">
                This comprehensive analysis took time to generate. Would you like to save it before closing?
              </p>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    setShowCloseConfirm(false);
                    setShowSaveDialog(true);
                  }}
                  className="px-4 py-2 bg-quantum-cyan/20 text-quantum-cyan border border-quantum-cyan/30 rounded-lg hover:bg-quantum-cyan/30 transition-all font-medium"
                >
                  Save & Close
                </button>
                <button
                  onClick={() => {
                    setShowCloseConfirm(false);
                    onClose();
                  }}
                  className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-all"
                >
                  Close Without Saving
                </button>
                <button
                  onClick={() => setShowCloseConfirm(false)}
                  className="px-4 py-2 bg-white/5 text-gray-400 border border-white/10 rounded-lg hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
