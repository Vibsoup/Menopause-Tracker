import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Printer, Check } from 'lucide-react';
import { DailySymptomLog } from '../types/symptom';
import {
  DashboardAnalytics,
  formatReadableDate,
  generateCSVExport,
  generatePrintableReportHTML,
} from '../utils/analytics';
import { buildStandaloneSingleFileHTML } from '../utils/standaloneBuilder';

interface PhysicianReportViewProps {
  analytics: DashboardAnalytics;
  allLogs: DailySymptomLog[];
  periodLabel: string;
}

export const PhysicianReportView: React.FC<PhysicianReportViewProps> = ({
  analytics,
  allLogs,
  periodLabel,
}) => {
  const [doctorNotes, setDoctorNotes] = useState<string>(() => {
    return (
      localStorage.getItem('serene_doctor_questions_v1') ||
      '1. Night sweats occur most strongly after evening wine or high-stress workdays; magnesium glycinate + cool bedroom (65°F) has helped reduce awakenings.\n2. Cycle arrived after a 47-day gap with 5 days of spotting/flow.\n3. Would like to discuss transdermal estradiol / micronized progesterone options and bone density baseline screening.'
    );
  });
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);

  const handleDoctorNotesChange = (val: string) => {
    setDoctorNotes(val);
    localStorage.setItem('serene_doctor_questions_v1', val);
  };

  const triggerFileDownload = (
    content: string,
    filename: string,
    mimeType: string,
    statusLabel: string
  ) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadStatus(statusLabel);
    setTimeout(() => setDownloadStatus(null), 3500);
  };

  const handleDownloadPrintableHTML = () => {
    const html = generatePrintableReportHTML(analytics, periodLabel, doctorNotes);
    const todayStr = new Date().toISOString().slice(0, 10);
    triggerFileDownload(
      html,
      `serene-physician-report-${todayStr}.html`,
      'text/html;charset=utf-8',
      'Downloaded PDF-ready Physician Report (.html)'
    );
  };

  const handleDownloadCSV = () => {
    const csv = generateCSVExport(analytics.logs);
    const todayStr = new Date().toISOString().slice(0, 10);
    triggerFileDownload(
      csv,
      `serene-symptom-logs-${todayStr}.csv`,
      'text/csv;charset=utf-8',
      'Downloaded Clinical Symptom Logs (.csv)'
    );
  };

  const handleDownloadStandaloneApp = () => {
    const standalone = buildStandaloneSingleFileHTML(allLogs);
    triggerFileDownload(
      standalone,
      'serene-menopause-tracker-standalone.html',
      'text/html;charset=utf-8',
      'Downloaded Single-File Standalone HTML App'
    );
  };

  const handlePrintPage = () => {
    window.print();
  };

  const dateSpan =
    analytics.logs.length > 0
      ? `${formatReadableDate(analytics.logs[0].date)} – ${formatReadableDate(
          analytics.logs[analytics.logs.length - 1].date
        )}`
      : 'No logs in window';

  const recentLogs = [...analytics.logs].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6">
      {/* Action Toolbar (Hidden when printing) */}
      <section className="bg-white border border-[#DCE5E1] rounded-2xl p-5 sm:p-6 no-print">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-[#1C2B27]">
              Physician Consultation Summary & Report Export
            </h2>
            <p className="text-xs sm:text-sm text-[#526660] mt-1">
              Formatted for OB/GYN, endocrinology, or Menopause Society certified practitioner consultations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleDownloadPrintableHTML}
              className="px-4 py-2.5 min-h-[44px] rounded-xl bg-[#1E564B] hover:bg-[#164239] text-white text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>Download Report (.html)</span>
            </button>

            <button
              type="button"
              onClick={handlePrintPage}
              className="px-4 py-2.5 min-h-[44px] rounded-xl bg-[#EEF3F1] hover:bg-[#DCE5E1] text-[#1C2B27] text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Printer className="w-4 h-4 shrink-0" />
              <span>Print / Save as PDF</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadCSV}
              className="px-3.5 py-2.5 min-h-[44px] rounded-xl border border-[#DCE5E1] bg-white hover:bg-[#F7F9F8] text-[#3A4D48] text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              <FileSpreadsheet className="w-4 h-4 shrink-0" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadStandaloneApp}
              className="px-3.5 py-2.5 min-h-[44px] rounded-xl border border-[#DCE5E1] bg-white hover:bg-[#F7F9F8] text-[#3A4D48] text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span>Standalone HTML App</span>
            </button>
          </div>
        </div>

        {downloadStatus && (
          <div
            role="status"
            className="mt-4 pt-3 border-t border-[#E8EFEC] flex items-center gap-2 text-xs font-medium text-[#1E564B]"
          >
            <Check className="w-4 h-4 shrink-0" />
            <span>{downloadStatus}</span>
          </div>
        )}
      </section>

      {/* Printable Clinical Brief Document */}
      <article className="bg-white border border-[#DCE5E1] rounded-2xl p-6 sm:p-10">
        {/* Clinical Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b-2 border-[#1E564B]">
          <div>
            <div className="text-xs text-[#526660] flex items-center gap-2">
              <span>Patient-Generated Health Data Summary</span>
              <span aria-hidden="true">·</span>
              <span>Confidential Clinical Brief</span>
            </div>
            <h3 className="text-2xl font-semibold text-[#1C2B27] mt-1">
              Menopause & Perimenopause Symptom Report
            </h3>
            <p className="text-xs text-[#4A5D58] mt-1">
              Reporting Window: <strong>{periodLabel}</strong> ({dateSpan})
            </p>
          </div>

          <div className="text-xs text-[#4A5D58] sm:text-right font-mono-num space-y-1">
            <div>Generated: {new Date().toISOString().slice(0, 10)}</div>
            <div>Total Days Logged: {analytics.totalDaysLogged} days</div>
            <div>
              Composite Severity: {analytics.overallAvgSeverity.toFixed(2)} / 5.0
            </div>
          </div>
        </div>

        {/* High-Level Clinical KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 py-6 border-b border-[#E8EFEC]">
          <div>
            <div className="text-xs text-[#526660]">Composite Severity Index</div>
            <div className="font-mono-num text-2xl font-semibold text-[#1C2B27] mt-1">
              {analytics.overallAvgSeverity.toFixed(1)}{' '}
              <span className="text-sm font-normal text-[#526660]">/ 5.0</span>
            </div>
            <div className="text-[11px] text-[#526660] mt-0.5">
              Mean across 5 core domains
            </div>
          </div>

          <div>
            <div className="text-xs text-[#526660]">Vasomotor Episode Load</div>
            <div className="font-mono-num text-2xl font-semibold text-[#1C2B27] mt-1">
              {analytics.totalHotFlashes + analytics.totalNightSweats}{' '}
              <span className="text-sm font-normal text-[#526660]">
                ({analytics.avgDailyVasomotor}/day)
              </span>
            </div>
            <div className="text-[11px] text-[#526660] mt-0.5 font-mono-num">
              {analytics.totalHotFlashes} daytime · {analytics.totalNightSweats} night sweats
            </div>
          </div>

          <div>
            <div className="text-xs text-[#526660]">Primary Symptom Burden</div>
            <div className="text-lg font-semibold text-[#1C2B27] mt-1 truncate">
              {analytics.mostFrequentSymptom?.shortLabel || 'None'}
            </div>
            <div className="text-[11px] text-[#526660] mt-0.5 font-mono-num">
              {analytics.mostFrequentSymptom
                ? `Avg ${analytics.mostFrequentSymptom.avgSeverity}/5 · ${analytics.mostFrequentSymptom.moderateOrSevereDays}d ≥3`
                : 'No data'}
            </div>
          </div>

          <div>
            <div className="text-xs text-[#526660]">Cycle & Bleeding Status</div>
            <div className="font-mono-num text-lg font-semibold text-[#1C2B27] mt-1">
              {analytics.cycleSummary.lastBleedingDate
                ? `${analytics.cycleSummary.daysSinceLastBleeding}d since flow`
                : 'No flow logged'}
            </div>
            <div className="text-[11px] text-[#526660] mt-0.5 font-mono-num">
              {analytics.cycleSummary.lastBleedingDate
                ? `Last: ${analytics.cycleSummary.lastBleedingDate} (${analytics.cycleSummary.bleedingDaysCount}d in window)`
                : '0 bleeding days'}
            </div>
          </div>
        </div>

        {/* Editable Patient Notes / Questions for Doctor */}
        <div className="py-6 border-b border-[#E8EFEC]">
          <label
            htmlFor="doctor-consultation-notes"
            className="block text-sm font-semibold text-[#1C2B27] mb-1"
          >
            Patient Priorities & Questions for Physician Consultation
          </label>
          <p className="text-xs text-[#526660] mb-3 no-print">
            Customize your notes below—they are included automatically when you print or download this report.
          </p>
          <textarea
            id="doctor-consultation-notes"
            rows={3}
            value={doctorNotes}
            onChange={(e) => handleDoctorNotesChange(e.target.value)}
            className="w-full rounded-xl border border-[#DCE5E1] bg-[#F7F9F8] focus:bg-white px-4 py-3 text-sm text-[#1C2B27] focus:outline-none focus:ring-2 focus:ring-[#1E564B]"
          />
        </div>

        {/* Section 1: Symptom Severity Table */}
        <div className="py-6 border-b border-[#E8EFEC] print-break-inside-avoid">
          <h4 className="text-base font-semibold text-[#1C2B27] mb-3">
            1. Quantitative Symptom Domain Summary (1 = Minimal to 5 = Severe)
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-[#DCE5E1] text-[#4A5D58]">
                  <th className="py-2.5 pr-4 font-semibold">Symptom Domain</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Mean Score</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Peak Score</th>
                  <th className="py-2.5 px-3 font-semibold text-right">
                    Moderate/Severe Days (≥3)
                  </th>
                  <th className="py-2.5 pl-3 font-semibold text-right">
                    Period Trend
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8EFEC]">
                {analytics.symptomMetrics.map((m) => {
                  const pct =
                    m.totalDays > 0
                      ? Math.round((m.moderateOrSevereDays / m.totalDays) * 100)
                      : 0;
                  return (
                    <tr key={m.key} className="hover:bg-[#F7F9F8]">
                      <td className="py-3 pr-4 font-medium text-[#1C2B27]">
                        {m.label}
                      </td>
                      <td className="py-3 px-3 font-mono-num text-right font-semibold text-[#1C2B27]">
                        {m.avgSeverity.toFixed(2)} / 5.0
                      </td>
                      <td className="py-3 px-3 font-mono-num text-right text-[#3A4D48]">
                        {m.maxSeverity} / 5
                      </td>
                      <td className="py-3 px-3 font-mono-num text-right text-[#3A4D48]">
                        {m.moderateOrSevereDays} of {m.totalDays}d ({pct}%)
                      </td>
                      <td className="py-3 pl-3 font-mono-num text-right">
                        {m.deltaFromPrior === null ? (
                          <span className="text-[#526660]">—</span>
                        ) : m.deltaFromPrior <= -0.15 ? (
                          <span className="text-[#1E564B]">
                            {m.deltaFromPrior.toFixed(2)} (Improving)
                          </span>
                        ) : m.deltaFromPrior >= 0.15 ? (
                          <span className="text-[#9E4731]">
                            +{m.deltaFromPrior.toFixed(2)} (Elevated)
                          </span>
                        ) : (
                          <span className="text-[#526660]">Stable</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 2: Observed Correlations & Clinical Insights */}
        <div className="py-6 border-b border-[#E8EFEC] print-break-inside-avoid">
          <h4 className="text-base font-semibold text-[#1C2B27] mb-3">
            2. Observed Trigger & Lifestyle Correlations
          </h4>
          <ul className="space-y-2.5 text-xs sm:text-sm text-[#3A4D48]">
            <li>
              <strong className="text-[#1C2B27]">
                Night Sweats vs. Sleep Quality:
              </strong>{' '}
              Night sweats were recorded on{' '}
              <span className="font-mono-num font-semibold">
                {analytics.nightSweatSleepInsight.nightsWithSweats}
              </span>{' '}
              of{' '}
              <span className="font-mono-num">
                {analytics.totalDaysLogged}
              </span>{' '}
              nights. Mean sleep disruption rose to{' '}
              <span className="font-mono-num font-semibold">
                {analytics.nightSweatSleepInsight.avgSleepDisruptionWithSweats}/5
              </span>{' '}
              on nights with sweats vs.{' '}
              <span className="font-mono-num font-semibold">
                {analytics.nightSweatSleepInsight.avgSleepDisruptionWithoutSweats}/5
              </span>{' '}
              on nights without sweats.
            </li>
            {analytics.topMoodSubtypes.length > 0 && (
              <li>
                <strong className="text-[#1C2B27]">
                  Predominant Cognitive & Mood Presentations:
                </strong>{' '}
                {analytics.topMoodSubtypes
                  .map((item) => `${item.subtype} (${item.count}d)`)
                  .join(' · ')}
              </li>
            )}
            {analytics.correlations.slice(0, 4).map((corr) => (
              <li key={corr.factor}>
                <strong className="text-[#1C2B27]">
                  {corr.factor} ({corr.daysPresent} days):
                </strong>{' '}
                {corr.summaryText}
              </li>
            ))}
          </ul>
        </div>

        {/* Section 3: Chronological Daily Log Table */}
        <div className="pt-6">
          <h4 className="text-base font-semibold text-[#1C2B27] mb-3">
            3. Chronological Daily Symptom & Cycle Log ({recentLogs.length} Entries)
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-[#DCE5E1] text-[#4A5D58]">
                  <th className="py-2.5 pr-3 font-semibold">Date</th>
                  <th className="py-2.5 px-2 font-semibold text-right">
                    Hot Flash
                  </th>
                  <th className="py-2.5 px-2 font-semibold text-right">
                    Day / Night
                  </th>
                  <th className="py-2.5 px-2 font-semibold text-right">Sleep</th>
                  <th className="py-2.5 px-2 font-semibold text-right">Mood</th>
                  <th className="py-2.5 px-2 font-semibold text-right">Fatigue</th>
                  <th className="py-2.5 px-2 font-semibold text-right">Joints</th>
                  <th className="py-2.5 px-3 font-semibold">Cycle Flow</th>
                  <th className="py-2.5 pl-3 font-semibold">
                    Factors & Daily Notes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8EFEC]">
                {recentLogs.map((log) => (
                  <tr key={log.date} className="hover:bg-[#F7F9F8] align-top">
                    <td className="py-2.5 pr-3 font-mono-num whitespace-nowrap font-medium text-[#1C2B27]">
                      {log.date}
                    </td>
                    <td className="py-2.5 px-2 font-mono-num text-right">
                      {log.symptoms.hotFlashes}/5
                    </td>
                    <td className="py-2.5 px-2 font-mono-num text-right whitespace-nowrap text-[#4A5D58]">
                      {log.symptoms.hotFlashCount}d · {log.symptoms.nightSweatCount}n
                    </td>
                    <td className="py-2.5 px-2 font-mono-num text-right">
                      {log.symptoms.sleepQuality}/5
                    </td>
                    <td className="py-2.5 px-2 font-mono-num text-right">
                      {log.symptoms.moodChanges}/5
                    </td>
                    <td className="py-2.5 px-2 font-mono-num text-right">
                      {log.symptoms.fatigue}/5
                    </td>
                    <td className="py-2.5 px-2 font-mono-num text-right">
                      {log.symptoms.jointAches}/5
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-[#1C2B27]">
                      {log.cycleFlow}
                    </td>
                    <td className="py-2.5 pl-3 text-[#3A4D48] max-w-md">
                      {log.lifestyleFactors && log.lifestyleFactors.length > 0 && (
                        <div className="text-[11px] text-[#1E564B] font-medium mb-0.5">
                          {log.lifestyleFactors.join(' · ')}
                        </div>
                      )}
                      {log.notes && <div>{log.notes}</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </article>
    </div>
  );
};
