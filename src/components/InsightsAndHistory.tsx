import React, { useState, useMemo } from 'react';
import { Search, Edit3 } from 'lucide-react';
import { DailySymptomLog } from '../types/symptom';
import { DashboardAnalytics, formatReadableDate } from '../utils/analytics';

interface InsightsAndHistoryProps {
  analytics: DashboardAnalytics;
  onEditDate: (dateStr: string) => void;
}

type HistoryFilterMode = 'all' | 'bleeding' | 'high_severity';

export const InsightsAndHistory: React.FC<InsightsAndHistoryProps> = ({
  analytics,
  onEditDate,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [historyFilter, setHistoryFilter] = useState<HistoryFilterMode>('all');

  const filteredHistory = useMemo(() => {
    const reversed = [...analytics.logs].sort((a, b) =>
      b.date.localeCompare(a.date)
    );
    return reversed.filter((log) => {
      if (historyFilter === 'bleeding' && log.cycleFlow === 'None') {
        return false;
      }
      if (historyFilter === 'high_severity') {
        const maxVal = Math.max(
          log.symptoms.hotFlashes,
          log.symptoms.sleepQuality,
          log.symptoms.moodChanges,
          log.symptoms.fatigue,
          log.symptoms.jointAches
        );
        if (maxVal < 4) return false;
      }

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const inNotes = (log.notes || '').toLowerCase().includes(q);
      const inFactors = (log.lifestyleFactors || []).some((f) =>
        f.toLowerCase().includes(q)
      );
      const inSubtypes = (log.symptoms.moodSubtypes || []).some((s) =>
        s.toLowerCase().includes(q)
      );
      const inFlow = log.cycleFlow.toLowerCase().includes(q);
      const inDate = log.date.includes(q);
      return inNotes || inFactors || inSubtypes || inFlow || inDate;
    });
  }, [analytics.logs, searchQuery, historyFilter]);

  return (
    <div className="space-y-6">
      {/* Highlighted Insights & Lifestyle Correlations Container */}
      <section className="bg-white border border-[#DCE5E1] rounded-2xl p-5 sm:p-6">
        <div className="pb-4 border-b border-[#E8EFEC] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold text-[#1C2B27]">
              Highlighted Insights & Lifestyle Correlations
            </h3>
            <p className="text-xs text-[#526660] mt-0.5">
              Patterns automatically identified from your symptom ratings, vasomotor counts, and logged lifestyle notes
            </p>
          </div>
          <div className="text-xs text-[#526660] font-mono-num">
            {analytics.totalDaysLogged} days analyzed
          </div>
        </div>

        {/* 3 Core Pattern Highlights separated by hairline dividers */}
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#E8EFEC] py-5 border-b border-[#E8EFEC]">
          {/* Insight 1: Dominant Symptom */}
          <div className="pb-4 md:pb-0 md:pr-6">
            <div className="text-xs text-[#526660] flex items-center gap-1.5">
              <span>Primary Symptom Focus</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-num">
                {analytics.mostFrequentSymptom
                  ? `${analytics.mostFrequentSymptom.moderateOrSevereDays}d ≥3`
                  : '0d'}
              </span>
            </div>
            <h4 className="text-base font-semibold text-[#1C2B27] mt-1">
              {analytics.mostFrequentSymptom
                ? analytics.mostFrequentSymptom.label
                : 'No symptoms recorded'}
            </h4>
            <p className="text-xs text-[#3A4D48] mt-1.5 leading-relaxed">
              {analytics.mostFrequentSymptom ? (
                <>
                  Averaged{' '}
                  <strong className="font-mono-num text-[#1C2B27]">
                    {analytics.mostFrequentSymptom.avgSeverity.toFixed(1)}/5.0
                  </strong>{' '}
                  across the window, reaching moderate-to-severe intensity on{' '}
                  <strong className="font-mono-num text-[#1C2B27]">
                    {analytics.mostFrequentSymptom.moderateOrSevereDays} of{' '}
                    {analytics.totalDaysLogged}
                  </strong>{' '}
                  logged days.
                </>
              ) : (
                'Log daily entries to reveal your most frequent symptom pattern.'
              )}
            </p>
          </div>

          {/* Insight 2: Vasomotor & Sleep Connection */}
          <div className="py-4 md:py-0 md:px-6">
            <div className="text-xs text-[#526660] flex items-center gap-1.5">
              <span>Sleep & Night Sweat Link</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-num">
                {analytics.nightSweatSleepInsight.nightsWithSweats} nights affected
              </span>
            </div>
            <h4 className="text-base font-semibold text-[#1C2B27] mt-1">
              Nighttime Thermoregulation Impact
            </h4>
            <p className="text-xs text-[#3A4D48] mt-1.5 leading-relaxed">
              On nights with night sweats, sleep disruption averaged{' '}
              <strong className="font-mono-num text-[#9E4731]">
                {analytics.nightSweatSleepInsight.avgSleepDisruptionWithSweats}/5.0
              </strong>
              , compared to{' '}
              <strong className="font-mono-num text-[#1E564B]">
                {analytics.nightSweatSleepInsight.avgSleepDisruptionWithoutSweats}/5.0
              </strong>{' '}
              on sweat-free nights.
            </p>
          </div>

          {/* Insight 3: Cycle & Cognitive Summary */}
          <div className="pt-4 md:pt-0 md:pl-6">
            <div className="text-xs text-[#526660] flex items-center gap-1.5">
              <span>Cycle & Cognitive Notes</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-num">
                {analytics.cycleSummary.bleedingDaysCount} flow days in window
              </span>
            </div>
            <h4 className="text-base font-semibold text-[#1C2B27] mt-1">
              {analytics.cycleSummary.lastBleedingDate
                ? `${analytics.cycleSummary.daysSinceLastBleeding} Days Since Last Flow`
                : 'No Recent Bleeding Recorded'}
            </h4>
            <p className="text-xs text-[#3A4D48] mt-1.5 leading-relaxed">
              {analytics.topMoodSubtypes.length > 0 ? (
                <>
                  Most frequent cognitive/mood tags:{' '}
                  <strong className="text-[#1C2B27]">
                    {analytics.topMoodSubtypes
                      .slice(0, 3)
                      .map((m) => `${m.subtype} (${m.count}d)`)
                      .join(' · ')}
                  </strong>
                  .
                </>
              ) : (
                'Select specific mood facets during daily check-ins to track brain fog and anxiety shifts.'
              )}
            </p>
          </div>
        </div>

        {/* Lifestyle Factor Correlation Table */}
        <div className="pt-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-[#1C2B27]">
              Lifestyle & Trigger Correlation Analysis
            </h4>
            <span className="text-xs text-[#526660]">
              Compares days with factor vs. days without factor
            </span>
          </div>

          {analytics.correlations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#DCE5E1] text-[#526660]">
                    <th className="py-2 pr-4 font-semibold">Logged Factor</th>
                    <th className="py-2 px-3 font-semibold">Type</th>
                    <th className="py-2 px-3 font-semibold text-right">
                      Days Logged
                    </th>
                    <th className="py-2 px-3 font-semibold text-right">
                      Hot Flash Avg (With vs Without)
                    </th>
                    <th className="py-2 px-3 font-semibold text-right">
                      Sleep Avg (With vs Without)
                    </th>
                    <th className="py-2 pl-3 font-semibold text-right">
                      Overall Severity Shift
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8EFEC]">
                  {analytics.correlations.map((c) => (
                    <tr key={c.factor} className="hover:bg-[#F7F9F8]">
                      <td className="py-2.5 pr-4 font-medium text-[#1C2B27]">
                        {c.factor}
                      </td>
                      <td className="py-2.5 px-3 text-[#4A5D58]">
                        {c.category === 'supportive'
                          ? 'Supportive habit'
                          : 'Potential trigger'}
                      </td>
                      <td className="py-2.5 px-3 font-mono-num text-right text-[#3A4D48]">
                        {c.daysPresent}d
                      </td>
                      <td className="py-2.5 px-3 font-mono-num text-right text-[#3A4D48]">
                        {c.avgHotFlashWith.toFixed(1)} vs{' '}
                        {c.avgHotFlashWithout.toFixed(1)}
                      </td>
                      <td className="py-2.5 px-3 font-mono-num text-right text-[#3A4D48]">
                        {c.avgSleepWith.toFixed(1)} vs{' '}
                        {c.avgSleepWithout.toFixed(1)}
                      </td>
                      <td className="py-2.5 pl-3 font-mono-num text-right font-semibold">
                        {c.compositeDelta <= -0.15 ? (
                          <span className="text-[#1E564B]">
                            {c.compositeDelta.toFixed(2)} pts (Calmer)
                          </span>
                        ) : c.compositeDelta >= 0.15 ? (
                          <span className="text-[#9E4731]">
                            +{c.compositeDelta.toFixed(2)} pts (Higher)
                          </span>
                        ) : (
                          <span className="text-[#526660]">
                            {c.compositeDelta > 0 ? '+' : ''}
                            {c.compositeDelta.toFixed(2)} pts (Neutral)
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-[#526660]">
              Log at least 4 days with lifestyle factors to calculate comparative correlations.
            </p>
          )}
        </div>
      </section>

      {/* Searchable Daily Log History Table */}
      <section className="bg-white border border-[#DCE5E1] rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E8EFEC]">
          <div>
            <h3 className="text-lg font-semibold text-[#1C2B27]">
              Recorded Daily Entries & Notes
            </h3>
            <p className="text-xs text-[#526660] mt-0.5">
              Search by trigger, supplement, or symptom note · Click Edit on any date to modify
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Search input */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#526660] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes, magnesium, wine..."
                className="pl-9 pr-3 py-2 min-h-[38px] w-full sm:w-60 text-xs rounded-xl border border-[#DCE5E1] bg-[#F7F9F8] focus:bg-white text-[#1C2B27] placeholder:text-[#6E827C] focus:outline-none focus:ring-2 focus:ring-[#1E564B]"
                aria-label="Search daily logs"
              />
            </div>

            {/* Segmented Filter */}
            <div
              className="flex items-center gap-1 p-1 bg-[#EEF3F1] rounded-lg"
              role="group"
              aria-label="Filter log history"
            >
              <button
                type="button"
                onClick={() => setHistoryFilter('all')}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap min-h-[32px] ${
                  historyFilter === 'all'
                    ? 'bg-white text-[#1C2B27] shadow-xs'
                    : 'text-[#4A5D58] hover:text-[#1C2B27]'
                }`}
              >
                All ({analytics.logs.length})
              </button>
              <button
                type="button"
                onClick={() => setHistoryFilter('high_severity')}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap min-h-[32px] ${
                  historyFilter === 'high_severity'
                    ? 'bg-white text-[#1C2B27] shadow-xs'
                    : 'text-[#4A5D58] hover:text-[#1C2B27]'
                }`}
              >
                Peak Days (≥4)
              </button>
              <button
                type="button"
                onClick={() => setHistoryFilter('bleeding')}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap min-h-[32px] ${
                  historyFilter === 'bleeding'
                    ? 'bg-white text-[#1C2B27] shadow-xs'
                    : 'text-[#4A5D58] hover:text-[#1C2B27]'
                }`}
              >
                Cycle Flow
              </button>
            </div>
          </div>
        </div>

        {filteredHistory.length > 0 ? (
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-[#DCE5E1] text-[#526660]">
                  <th className="py-2.5 pr-3 font-semibold">Date</th>
                  <th className="py-2.5 px-2 font-semibold text-right">
                    Hot Flashes
                  </th>
                  <th className="py-2.5 px-2 font-semibold text-right">
                    Episodes
                  </th>
                  <th className="py-2.5 px-2 font-semibold text-right">Sleep</th>
                  <th className="py-2.5 px-2 font-semibold text-right">Mood</th>
                  <th className="py-2.5 px-2 font-semibold text-right">Fatigue</th>
                  <th className="py-2.5 px-2 font-semibold text-right">Joints</th>
                  <th className="py-2.5 px-3 font-semibold">Cycle</th>
                  <th className="py-2.5 px-3 font-semibold">
                    Factors & Notes
                  </th>
                  <th className="py-2.5 pl-2 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8EFEC]">
                {filteredHistory.map((log) => (
                  <tr
                    key={log.date}
                    className="hover:bg-[#F7F9F8] transition-colors align-top"
                  >
                    <td className="py-3 pr-3 whitespace-nowrap">
                      <div className="font-mono-num font-semibold text-[#1C2B27]">
                        {log.date}
                      </div>
                      <div className="text-[11px] text-[#526660]">
                        {formatReadableDate(log.date)}
                      </div>
                    </td>
                    <td className="py-3 px-2 font-mono-num text-right font-medium text-[#1C2B27]">
                      {log.symptoms.hotFlashes}/5
                    </td>
                    <td className="py-3 px-2 font-mono-num text-right whitespace-nowrap text-[#4A5D58]">
                      {log.symptoms.hotFlashCount}d · {log.symptoms.nightSweatCount}n
                    </td>
                    <td className="py-3 px-2 font-mono-num text-right text-[#1C2B27]">
                      {log.symptoms.sleepQuality}/5
                    </td>
                    <td className="py-3 px-2 font-mono-num text-right text-[#1C2B27]">
                      {log.symptoms.moodChanges}/5
                    </td>
                    <td className="py-3 px-2 font-mono-num text-right text-[#1C2B27]">
                      {log.symptoms.fatigue}/5
                    </td>
                    <td className="py-3 px-2 font-mono-num text-right text-[#1C2B27]">
                      {log.symptoms.jointAches}/5
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-[#1C2B27]">
                      {log.cycleFlow}
                    </td>
                    <td className="py-3 px-3 max-w-md">
                      {/* Zero-Pill Metadata Discipline: Clean unboxed text with · separators */}
                      {((log.lifestyleFactors && log.lifestyleFactors.length > 0) ||
                        (log.symptoms.moodSubtypes &&
                          log.symptoms.moodSubtypes.length > 0)) && (
                        <div className="text-[11px] text-[#1E564B] font-medium mb-1">
                          {[
                            ...(log.lifestyleFactors || []),
                            ...(log.symptoms.moodSubtypes || []),
                          ].join(' · ')}
                        </div>
                      )}
                      {log.notes ? (
                        <p className="text-xs text-[#3A4D48] leading-relaxed">
                          {log.notes}
                        </p>
                      ) : (
                        <span className="text-xs text-[#6E827C] italic">
                          No written note
                        </span>
                      )}
                    </td>
                    <td className="py-3 pl-2 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onEditDate(log.date)}
                        className="px-2.5 py-1.5 min-h-[34px] text-xs font-medium text-[#1E564B] hover:bg-[#EEF6F4] rounded-lg inline-flex items-center gap-1 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-10 text-center">
            <p className="text-sm text-[#4A5D58]">
              No daily logs match your current filter or search query.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setHistoryFilter('all');
              }}
              className="mt-3 px-4 py-2 text-xs font-medium text-[#1E564B] bg-[#EEF6F4] rounded-xl"
            >
              Reset Filters
            </button>
          </div>
        )}
      </section>
    </div>
  );
};
