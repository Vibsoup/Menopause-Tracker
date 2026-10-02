import React, { useState, useEffect, useMemo } from 'react';
import {
  Download,
  RotateCcw,
  Trash2,
  Upload,
  Check,
  Printer,
  FileText,
} from 'lucide-react';
import { DailySymptomLog } from './types/symptom';
import { formatLocalDate, generateSampleLogs } from './data/sampleLogs';
import {
  TimeRangeKey,
  computeAnalytics,
  formatReadableDate,
  generatePrintableReportHTML,
} from './utils/analytics';
import { DailyLogForm } from './components/DailyLogForm';
import { SymptomCharts } from './components/SymptomCharts';
import { InsightsAndHistory } from './components/InsightsAndHistory';
import { PhysicianReportView } from './components/PhysicianReportView';
import { buildStandaloneSingleFileHTML } from './utils/standaloneBuilder';

const STORAGE_KEY = 'serene_menopause_logs_v1';

export default function App() {
  const todayStr = useMemo(() => formatLocalDate(new Date()), []);

  // Load logs from localStorage or seed with 28-day realistic sample data
  const [logs, setLogs] = useState<DailySymptomLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // fallback to sample data
    }
    const seeded = generateSampleLogs(new Date());
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    } catch {
      // ignore storage quota errors
    }
    return seeded;
  });

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [timeRange, setTimeRange] = useState<TimeRangeKey>('7d');
  const [activeSection, setActiveSection] = useState<
    'all' | 'log' | 'trends' | 'insights' | 'report'
  >('all');
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState<boolean>(false);

  // Persist logs to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    } catch {
      // ignore storage quota errors
    }
  }, [logs]);

  const loggedDatesSet = useMemo(
    () => new Set(logs.map((l) => l.date)),
    [logs]
  );

  const existingLogForSelectedDate = useMemo(
    () => logs.find((l) => l.date === selectedDate),
    [logs, selectedDate]
  );

  const analytics = useMemo(
    () => computeAnalytics(logs, timeRange),
    [logs, timeRange]
  );

  const periodLabel = useMemo(() => {
    if (timeRange === '7d') return 'Weekly Summary (Last 7 Days)';
    if (timeRange === '30d') return 'Monthly Summary (Last 30 Days)';
    return `Complete History (${logs.length} Days)`;
  }, [timeRange, logs.length]);

  const showNotice = (msg: string) => {
    setBannerNotice(msg);
    setTimeout(() => {
      setBannerNotice(null);
    }, 3800);
  };

  const handleSaveLog = (entry: DailySymptomLog) => {
    setLogs((prev) => {
      const withoutDate = prev.filter((item) => item.date !== entry.date);
      return [...withoutDate, entry].sort((a, b) =>
        a.date.localeCompare(b.date)
      );
    });
    showNotice(`Saved daily log for ${formatReadableDate(entry.date)}`);
  };

  const handleDeleteLog = (dateToDelete: string) => {
    setLogs((prev) => prev.filter((item) => item.date !== dateToDelete));
    showNotice(`Removed log entry for ${formatReadableDate(dateToDelete)}`);
  };

  const handleResetSampleData = () => {
    const fresh = generateSampleLogs(new Date());
    setLogs(fresh);
    setSelectedDate(todayStr);
    setConfirmClearAll(false);
    showNotice('Restored 28 days of sample menopause tracking data');
  };

  const handleClearAllData = () => {
    setLogs([]);
    localStorage.removeItem(STORAGE_KEY);
    setConfirmClearAll(false);
    showNotice('Cleared all local symptom logs from this browser');
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `serene-backup-${todayStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotice('Downloaded local JSON data backup');
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(String(event.target?.result || '[]'));
        if (Array.isArray(parsed)) {
          setLogs(parsed);
          showNotice(`Imported ${parsed.length} daily symptom entries`);
        }
      } catch {
        showNotice('Could not parse JSON backup file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleHeaderDownloadReport = () => {
    const doctorNotes =
      localStorage.getItem('serene_doctor_questions_v1') ||
      '1. Night sweats occur most strongly after evening wine or high-stress workdays; magnesium glycinate + cool bedroom (65°F) has helped reduce awakenings.\n2. Cycle arrived after a 47-day gap with 5 days of spotting/flow.\n3. Would like to discuss transdermal estradiol / micronized progesterone options.';
    const html = generatePrintableReportHTML(
      analytics,
      periodLabel,
      doctorNotes
    );
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `serene-physician-report-${todayStr}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setActiveSection('report');
    const reportEl = document.getElementById('section-physician-report');
    if (reportEl) {
      reportEl.scrollIntoView({ behavior: 'smooth' });
    }
    showNotice(
      'Downloaded Physician Consultation Report (.html) · Ready to print or save as PDF'
    );
  };

  const handleDownloadStandaloneSingleHTML = () => {
    const html = buildStandaloneSingleFileHTML(logs);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'serene-menopause-tracker-standalone.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotice('Downloaded complete single-file HTML application');
  };

  const navigateToSection = (
    section: 'all' | 'log' | 'trends' | 'insights' | 'report',
    elementId?: string
  ) => {
    setActiveSection(section);
    if (elementId) {
      setTimeout(() => {
        const el = document.getElementById(elementId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 40);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div id="top" className="min-h-screen flex flex-col bg-[#F7F9F8] text-[#1C2B27]">
      {/* Top Bar Contract: Strictly 3 Zones (Brand Wordmark, 4-5 Nav Links, 1-2 Actions) */}
      <header className="sticky top-0 z-30 h-14 bg-white/95 backdrop-blur-md border-b border-[#DCE5E1] px-4 sm:px-8 flex items-center justify-between no-print">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            navigateToSection('all');
          }}
          className="font-display text-xl font-semibold tracking-tight text-[#1E564B] whitespace-nowrap shrink-0"
        >
          Serene
        </a>

        {/* Zone 2: 4-5 clean text navigation links */}
        <nav
          className="hidden md:flex items-center gap-7 text-sm font-medium text-[#4A5D58]"
          aria-label="Primary navigation"
        >
          <a
            href="#section-overview"
            onClick={(e) => {
              e.preventDefault();
              navigateToSection('all');
            }}
            className={`hover:text-[#1C2B27] hover:underline underline-offset-4 transition-colors whitespace-nowrap ${
              activeSection === 'all' ? 'text-[#1E564B] font-semibold' : ''
            }`}
          >
            Overview
          </a>
          <a
            href="#section-daily-log"
            onClick={(e) => {
              e.preventDefault();
              navigateToSection('all', 'section-daily-log');
            }}
            className={`hover:text-[#1C2B27] hover:underline underline-offset-4 transition-colors whitespace-nowrap ${
              activeSection === 'log' ? 'text-[#1E564B] font-semibold' : ''
            }`}
          >
            Daily Log
          </a>
          <a
            href="#section-trends"
            onClick={(e) => {
              e.preventDefault();
              navigateToSection('all', 'section-trends');
            }}
            className={`hover:text-[#1C2B27] hover:underline underline-offset-4 transition-colors whitespace-nowrap ${
              activeSection === 'trends' ? 'text-[#1E564B] font-semibold' : ''
            }`}
          >
            Trends & Charts
          </a>
          <a
            href="#section-insights"
            onClick={(e) => {
              e.preventDefault();
              navigateToSection('all', 'section-insights');
            }}
            className={`hover:text-[#1C2B27] hover:underline underline-offset-4 transition-colors whitespace-nowrap ${
              activeSection === 'insights' ? 'text-[#1E564B] font-semibold' : ''
            }`}
          >
            Insights & History
          </a>
          <a
            href="#section-physician-report"
            onClick={(e) => {
              e.preventDefault();
              navigateToSection('report', 'section-physician-report');
            }}
            className={`hover:text-[#1C2B27] hover:underline underline-offset-4 transition-colors whitespace-nowrap ${
              activeSection === 'report' ? 'text-[#1E564B] font-semibold' : ''
            }`}
          >
            Physician Summary
          </a>
        </nav>

        {/* Zone 3: 1-2 Primary Actions */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setSelectedDate(todayStr);
              navigateToSection('all', 'section-daily-log');
            }}
            className="hidden sm:inline-flex items-center justify-center px-3.5 py-2 min-h-[38px] text-xs font-medium text-[#1E564B] bg-[#EEF6F4] hover:bg-[#DCECE8] rounded-xl transition-colors whitespace-nowrap cursor-pointer"
          >
            Log Today
          </button>
          <button
            type="button"
            onClick={handleHeaderDownloadReport}
            className="px-4 py-2 min-h-[38px] text-xs font-semibold text-white bg-[#1E564B] hover:bg-[#164239] rounded-xl flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span>Download Report</span>
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-8 py-6 sm:py-9 pb-24 md:pb-12 space-y-8">
        {/* Feedback Notification Strip */}
        {bannerNotice && (
          <div
            role="status"
            className="bg-[#1E564B] text-white px-4 py-3 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-between gap-3 no-print"
          >
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{bannerNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setBannerNotice(null)}
              className="text-xs underline opacity-85 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Section 1: Overview & Time Window Summary */}
        <section
          id="section-overview"
          className="bg-white border border-[#DCE5E1] rounded-2xl p-5 sm:p-8 no-print"
        >
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 pb-6 border-b border-[#E8EFEC]">
            <div>
              {/* Zero-Pill Metadata Discipline: Clean unboxed text with · separators */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#526660]">
                <span>100% Local Browser Storage</span>
                <span aria-hidden="true">·</span>
                <span>Private & Offline-Ready</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-num">{logs.length} total days recorded</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-semibold text-[#1C2B27] mt-2 tracking-tight">
                Personal Menopause & Symptom Journal
              </h1>
              <p className="text-sm sm:text-base text-[#4A5D58] mt-1.5 max-w-2xl">
                Track vasomotor flashes, sleep quality, cognitive clarity, and cycle shifts in under a minute each day—and export a clear clinical summary for your physician.
              </p>
            </div>

            {/* Interactive Weekly / Monthly Summary Segmented Switcher */}
            <div className="flex flex-col sm:items-end gap-2 shrink-0">
              <span className="text-xs font-medium text-[#526660]">
                Summary & Chart Window
              </span>
              <div
                className="flex items-center gap-1 p-1 bg-[#EEF3F1] rounded-xl self-start sm:self-auto"
                role="group"
                aria-label="Select summary time range"
              >
                <button
                  type="button"
                  onClick={() => setTimeRange('7d')}
                  className={`px-3.5 py-2 min-h-[38px] text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    timeRange === '7d'
                      ? 'bg-white text-[#1C2B27] shadow-xs'
                      : 'text-[#4A5D58] hover:text-[#1C2B27]'
                  }`}
                >
                  Weekly (7 Days)
                </button>
                <button
                  type="button"
                  onClick={() => setTimeRange('30d')}
                  className={`px-3.5 py-2 min-h-[38px] text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    timeRange === '30d'
                      ? 'bg-white text-[#1C2B27] shadow-xs'
                      : 'text-[#4A5D58] hover:text-[#1C2B27]'
                  }`}
                >
                  Monthly (30 Days)
                </button>
                <button
                  type="button"
                  onClick={() => setTimeRange('all')}
                  className={`px-3.5 py-2 min-h-[38px] text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    timeRange === 'all'
                      ? 'bg-white text-[#1C2B27] shadow-xs'
                      : 'text-[#4A5D58] hover:text-[#1C2B27]'
                  }`}
                >
                  All Logs
                </button>
              </div>
            </div>
          </div>

          {/* 4-Column Metric Summary Grid (Separated by hairline dividers, zero nested cards) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#E8EFEC] pt-6 gap-y-4 sm:gap-y-0">
            <div className="pr-4 sm:px-4 first:pl-0">
              <div className="text-xs text-[#526660]">
                Composite Symptom Severity
              </div>
              <div className="font-mono-num text-2xl sm:text-3xl font-semibold text-[#1C2B27] mt-1.5">
                {analytics.overallAvgSeverity.toFixed(1)}{' '}
                <span className="text-sm font-normal text-[#526660]">/ 5.0</span>
              </div>
              <div className="text-xs text-[#4A5D58] mt-1">
                {analytics.overallAvgSeverity < 2.2
                  ? 'Mild overall burden'
                  : analytics.overallAvgSeverity < 3.3
                  ? 'Moderate daily burden'
                  : 'Elevated symptom burden'}
              </div>
            </div>

            <div className="pl-4 sm:px-6">
              <div className="text-xs text-[#526660]">
                Hot Flashes & Night Sweats
              </div>
              <div className="font-mono-num text-2xl sm:text-3xl font-semibold text-[#B85D43] mt-1.5">
                {analytics.totalHotFlashes + analytics.totalNightSweats}{' '}
                <span className="text-sm font-normal text-[#526660]">
                  episodes
                </span>
              </div>
              <div className="text-xs text-[#4A5D58] mt-1 font-mono-num">
                {analytics.totalHotFlashes} day · {analytics.totalNightSweats} night ({analytics.avgDailyVasomotor}/d)
              </div>
            </div>

            <div className="pt-4 sm:pt-0 pr-4 sm:px-6">
              <div className="text-xs text-[#526660]">Most Frequent Symptom</div>
              <div className="text-lg sm:text-xl font-semibold text-[#1C2B27] mt-1.5 truncate">
                {analytics.mostFrequentSymptom
                  ? analytics.mostFrequentSymptom.shortLabel
                  : 'None'}
              </div>
              <div className="text-xs text-[#4A5D58] mt-1 font-mono-num">
                {analytics.mostFrequentSymptom
                  ? `Avg ${analytics.mostFrequentSymptom.avgSeverity.toFixed(
                      1
                    )}/5 · ${analytics.mostFrequentSymptom.moderateOrSevereDays}d ≥3`
                  : 'Log entries to track'}
              </div>
            </div>

            <div className="pt-4 sm:pt-0 pl-4 sm:pl-6">
              <div className="text-xs text-[#526660]">Cycle & Bleeding Tracker</div>
              <div className="font-mono-num text-xl sm:text-2xl font-semibold text-[#2A7B76] mt-1.5">
                {analytics.cycleSummary.lastBleedingDate
                  ? `${analytics.cycleSummary.daysSinceLastBleeding}d ago`
                  : 'None'}
              </div>
              <div className="text-xs text-[#4A5D58] mt-1 font-mono-num">
                {analytics.cycleSummary.lastBleedingDate
                  ? `Last flow: ${analytics.cycleSummary.lastBleedingDate}`
                  : 'No bleeding days logged'}
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Trend Charts (Line & Bar via Chart.js) */}
        {(activeSection === 'all' || activeSection === 'trends') && (
          <div id="section-trends" className="no-print">
            <SymptomCharts
              logs={analytics.logs}
              symptomMetrics={analytics.symptomMetrics}
              onSelectDate={(dateStr) => {
                setSelectedDate(dateStr);
                const formEl = document.getElementById('section-daily-log');
                if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
              }}
            />
          </div>
        )}

        {/* Section 3: Under-1-Minute Daily Log Form */}
        {(activeSection === 'all' || activeSection === 'log') && (
          <div id="section-daily-log" className="no-print">
            <DailyLogForm
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              existingLog={existingLogForSelectedDate}
              loggedDatesSet={loggedDatesSet}
              onSaveLog={handleSaveLog}
              onDeleteLog={handleDeleteLog}
            />
          </div>
        )}

        {/* Section 4: Highlighted Insights, Lifestyle Correlations & Searchable Log History */}
        {(activeSection === 'all' || activeSection === 'insights') && (
          <div id="section-insights" className="no-print">
            <InsightsAndHistory
              analytics={analytics}
              onEditDate={(dateStr) => {
                setSelectedDate(dateStr);
                setActiveSection('all');
                const formEl = document.getElementById('section-daily-log');
                if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
              }}
            />
          </div>
        )}

        {/* Section 5: Printable Physician Report & Data Export */}
        <div id="section-physician-report">
          <PhysicianReportView
            analytics={analytics}
            allLogs={logs}
            periodLabel={periodLabel}
          />
        </div>

        {/* Section 6: Local Privacy & Data Control Panel */}
        <section className="bg-white border border-[#DCE5E1] rounded-2xl p-5 sm:p-6 no-print">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-[#1C2B27]">
                Privacy & Local Data Control
              </h3>
              <p className="text-xs text-[#526660] mt-0.5">
                All symptom entries are stored exclusively in this browser’s{' '}
                <code className="font-mono-num text-[#1E564B]">localStorage</code>. You have full ownership to back up, restore, or erase your records at any time.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleDownloadStandaloneSingleHTML}
                className="px-3.5 py-2 min-h-[40px] text-xs font-medium text-[#1E564B] bg-[#EEF6F4] hover:bg-[#DCECE8] rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Download Single-File HTML App</span>
              </button>

              <button
                type="button"
                onClick={handleExportJSON}
                className="px-3.5 py-2 min-h-[40px] text-xs font-medium text-[#3A4D48] bg-[#F7F9F8] hover:bg-[#EEF3F1] border border-[#DCE5E1] rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Backup JSON</span>
              </button>

              <label className="px-3.5 py-2 min-h-[40px] text-xs font-medium text-[#3A4D48] bg-[#F7F9F8] hover:bg-[#EEF3F1] border border-[#DCE5E1] rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap">
                <Upload className="w-3.5 h-3.5" />
                <span>Restore JSON</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleImportJSON}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={handleResetSampleData}
                className="px-3.5 py-2 min-h-[40px] text-xs font-medium text-[#3A4D48] bg-[#F7F9F8] hover:bg-[#EEF3F1] border border-[#DCE5E1] rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reload Sample Data</span>
              </button>

              {!confirmClearAll ? (
                <button
                  type="button"
                  onClick={() => setConfirmClearAll(true)}
                  className="px-3.5 py-2 min-h-[40px] text-xs font-medium text-[#9E4731] hover:bg-[#FDF3F0] rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All Data</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 bg-[#FDF3F0] px-3 py-1.5 rounded-xl border border-[#F3D5CC]">
                  <span className="text-xs font-medium text-[#9E4731]">
                    Erase all local logs?
                  </span>
                  <button
                    type="button"
                    onClick={handleClearAllData}
                    className="px-2.5 py-1 text-xs font-semibold bg-[#9E4731] text-white rounded-lg"
                  >
                    Yes, Erase
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClearAll(false)}
                    className="px-2 py-1 text-xs text-[#526660]"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-[#DCE5E1] bg-white py-6 px-4 sm:px-8 text-xs text-[#526660] no-print mb-14 md:mb-0">
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            Serene Menopause Symptom & Wellness Tracker · Local-First Personal Health Utility
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => window.print()}
              className="hover:text-[#1C2B27] inline-flex items-center gap-1 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Clinical View</span>
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={handleHeaderDownloadReport}
              className="hover:text-[#1C2B27] underline underline-offset-2 cursor-pointer"
            >
              Download Physician Summary
            </button>
          </div>
        </div>
      </footer>

      {/* Mobile Ergonomic Bottom Navigation Bar (<= 15% sticky height cap) */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 h-14 bg-white/95 backdrop-blur-md border-t border-[#DCE5E1] grid grid-cols-4 items-center px-2 no-print"
        aria-label="Mobile navigation"
      >
        <button
          type="button"
          onClick={() => navigateToSection('all')}
          className={`min-h-[44px] flex flex-col items-center justify-center text-[11px] font-medium rounded-lg ${
            activeSection === 'all'
              ? 'text-[#1E564B] font-semibold'
              : 'text-[#4A5D58]'
          }`}
        >
          <span>Overview</span>
        </button>
        <button
          type="button"
          onClick={() => navigateToSection('all', 'section-daily-log')}
          className={`min-h-[44px] flex flex-col items-center justify-center text-[11px] font-medium rounded-lg ${
            activeSection === 'log'
              ? 'text-[#1E564B] font-semibold'
              : 'text-[#4A5D58]'
          }`}
        >
          <span>Daily Log</span>
        </button>
        <button
          type="button"
          onClick={() => navigateToSection('all', 'section-insights')}
          className={`min-h-[44px] flex flex-col items-center justify-center text-[11px] font-medium rounded-lg ${
            activeSection === 'insights'
              ? 'text-[#1E564B] font-semibold'
              : 'text-[#4A5D58]'
          }`}
        >
          <span>Insights</span>
        </button>
        <button
          type="button"
          onClick={() => navigateToSection('report', 'section-physician-report')}
          className={`min-h-[44px] flex flex-col items-center justify-center text-[11px] font-medium rounded-lg ${
            activeSection === 'report'
              ? 'text-[#1E564B] font-semibold'
              : 'text-[#4A5D58]'
          }`}
        >
          <span>Report</span>
        </button>
      </nav>
    </div>
  );
}
