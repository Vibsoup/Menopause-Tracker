import { DailySymptomLog, SYMPTOM_META, SymptomMetadata } from '../types/symptom';

export type TimeRangeKey = '7d' | '30d' | 'all';

export interface SymptomSummaryMetric {
  key: SymptomMetadata['key'];
  label: string;
  shortLabel: string;
  color: string;
  avgSeverity: number;
  maxSeverity: number;
  moderateOrSevereDays: number; // rating >= 3
  totalDays: number;
  deltaFromPrior: number | null; // comparison with previous window
}

export interface LifestyleCorrelation {
  factor: string;
  category: 'supportive' | 'trigger';
  daysPresent: number;
  avgHotFlashWith: number;
  avgHotFlashWithout: number;
  avgSleepWith: number;
  avgSleepWithout: number;
  compositeDelta: number; // difference in composite symptom severity (with - without)
  summaryText: string;
}

export interface DashboardAnalytics {
  logs: DailySymptomLog[]; // sorted ascending by date
  totalDaysLogged: number;
  overallAvgSeverity: number;
  totalHotFlashes: number;
  totalNightSweats: number;
  avgDailyVasomotor: number;
  symptomMetrics: SymptomSummaryMetric[];
  mostFrequentSymptom: SymptomSummaryMetric | null;
  nightSweatSleepInsight: {
    nightsWithSweats: number;
    avgSleepDisruptionWithSweats: number;
    avgSleepDisruptionWithoutSweats: number;
  };
  cycleSummary: {
    bleedingDaysCount: number;
    lastBleedingDate: string | null;
    daysSinceLastBleeding: number | null;
    flowBreakdown: Record<string, number>;
  };
  topMoodSubtypes: { subtype: string; count: number }[];
  correlations: LifestyleCorrelation[];
}

export function filterLogsByRange(
  allLogs: DailySymptomLog[],
  range: TimeRangeKey,
  referenceDateStr?: string
): DailySymptomLog[] {
  const sorted = [...allLogs].sort((a, b) => a.date.localeCompare(b.date));
  if (range === 'all' || sorted.length === 0) return sorted;

  const days = range === '7d' ? 7 : 30;
  const refDate = referenceDateStr
    ? new Date(referenceDateStr + 'T12:00:00')
    : new Date();
  const cutoff = new Date(refDate);
  cutoff.setDate(cutoff.getDate() - (days - 1));
  const cutoffStr = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, '0')}-${String(cutoff.getDate()).padStart(2, '0')}`;

  return sorted.filter((log) => log.date >= cutoffStr);
}

export function computeAnalytics(
  allLogs: DailySymptomLog[],
  range: TimeRangeKey
): DashboardAnalytics {
  const logs = filterLogsByRange(allLogs, range);
  const totalDaysLogged = logs.length;

  if (totalDaysLogged === 0) {
    return {
      logs: [],
      totalDaysLogged: 0,
      overallAvgSeverity: 0,
      totalHotFlashes: 0,
      totalNightSweats: 0,
      avgDailyVasomotor: 0,
      symptomMetrics: SYMPTOM_META.map((m) => ({
        key: m.key,
        label: m.label,
        shortLabel: m.shortLabel,
        color: m.color,
        avgSeverity: 0,
        maxSeverity: 0,
        moderateOrSevereDays: 0,
        totalDays: 0,
        deltaFromPrior: null,
      })),
      mostFrequentSymptom: null,
      nightSweatSleepInsight: {
        nightsWithSweats: 0,
        avgSleepDisruptionWithSweats: 0,
        avgSleepDisruptionWithoutSweats: 0,
      },
      cycleSummary: {
        bleedingDaysCount: 0,
        lastBleedingDate: null,
        daysSinceLastBleeding: null,
        flowBreakdown: {},
      },
      topMoodSubtypes: [],
      correlations: [],
    };
  }

  // Compute symptom metrics
  const symptomMetrics: SymptomSummaryMetric[] = SYMPTOM_META.map((meta) => {
    const values = logs.map((l) => l.symptoms[meta.key]);
    const sum = values.reduce((acc, v) => acc + v, 0);
    const avgSeverity = Number((sum / totalDaysLogged).toFixed(2));
    const maxSeverity = Math.max(...values);
    const moderateOrSevereDays = values.filter((v) => v >= 3).length;

    // Compare first half vs second half of window if >= 4 logs
    let deltaFromPrior: number | null = null;
    if (logs.length >= 4) {
      const mid = Math.floor(logs.length / 2);
      const firstHalf = values.slice(0, mid);
      const secondHalf = values.slice(mid);
      const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
      deltaFromPrior = Number((avgSecond - avgFirst).toFixed(2));
    }

    return {
      key: meta.key,
      label: meta.label,
      shortLabel: meta.shortLabel,
      color: meta.color,
      avgSeverity,
      maxSeverity,
      moderateOrSevereDays,
      totalDays: totalDaysLogged,
      deltaFromPrior,
    };
  });

  const overallAvgSeverity = Number(
    (
      symptomMetrics.reduce((acc, m) => acc + m.avgSeverity, 0) /
      symptomMetrics.length
    ).toFixed(2)
  );

  const totalHotFlashes = logs.reduce((acc, l) => acc + (l.symptoms.hotFlashCount || 0), 0);
  const totalNightSweats = logs.reduce((acc, l) => acc + (l.symptoms.nightSweatCount || 0), 0);
  const avgDailyVasomotor = Number(
    ((totalHotFlashes + totalNightSweats) / totalDaysLogged).toFixed(1)
  );

  // Most prominent symptom sorted by moderateOrSevereDays then avgSeverity
  const sortedSymptoms = [...symptomMetrics].sort((a, b) => {
    if (b.moderateOrSevereDays !== a.moderateOrSevereDays) {
      return b.moderateOrSevereDays - a.moderateOrSevereDays;
    }
    return b.avgSeverity - a.avgSeverity;
  });
  const mostFrequentSymptom = sortedSymptoms[0] || null;

  // Night sweat vs sleep disruption
  const withSweats = logs.filter((l) => l.symptoms.nightSweatCount > 0);
  const withoutSweats = logs.filter((l) => l.symptoms.nightSweatCount === 0);
  const avgSleepWith =
    withSweats.length > 0
      ? Number(
          (
            withSweats.reduce((a, l) => a + l.symptoms.sleepQuality, 0) /
            withSweats.length
          ).toFixed(1)
        )
      : 0;
  const avgSleepWithout =
    withoutSweats.length > 0
      ? Number(
          (
            withoutSweats.reduce((a, l) => a + l.symptoms.sleepQuality, 0) /
            withoutSweats.length
          ).toFixed(1)
        )
      : 0;

  // Cycle summary across ALL logs for accurate last bleeding date, and window logs for breakdown
  const allSorted = [...allLogs].sort((a, b) => a.date.localeCompare(b.date));
  const allBleedingLogs = allSorted.filter((l) => l.cycleFlow !== 'None');
  const lastBleedingDate =
    allBleedingLogs.length > 0
      ? allBleedingLogs[allBleedingLogs.length - 1].date
      : null;

  let daysSinceLastBleeding: number | null = null;
  if (lastBleedingDate) {
    const today = new Date();
    const lastDate = new Date(lastBleedingDate + 'T12:00:00');
    const diffMs = today.getTime() - lastDate.getTime();
    daysSinceLastBleeding = Math.max(0, Math.floor(diffMs / (1000 * 3600 * 24)));
  }

  const flowBreakdown: Record<string, number> = {};
  let bleedingDaysCount = 0;
  logs.forEach((l) => {
    if (l.cycleFlow !== 'None') {
      bleedingDaysCount++;
      flowBreakdown[l.cycleFlow] = (flowBreakdown[l.cycleFlow] || 0) + 1;
    }
  });

  // Top mood subtypes
  const subtypeCounts: Record<string, number> = {};
  logs.forEach((l) => {
    (l.symptoms.moodSubtypes || []).forEach((st) => {
      subtypeCounts[st] = (subtypeCounts[st] || 0) + 1;
    });
  });
  const topMoodSubtypes = Object.entries(subtypeCounts)
    .map(([subtype, count]) => ({ subtype, count }))
    .sort((a, b) => b.count - a.count);

  // Lifestyle correlations
  const factorSet = new Set<string>();
  logs.forEach((l) => {
    (l.lifestyleFactors || []).forEach((f) => factorSet.add(f));
  });

  const triggerNames = new Set([
    'Caffeine (2+ cups)',
    'Evening wine / alcohol',
    'High work stress',
    'Spicy or late meal',
  ]);

  const correlations: LifestyleCorrelation[] = [];
  factorSet.forEach((factor) => {
    const withFactor = logs.filter((l) => (l.lifestyleFactors || []).includes(factor));
    const withoutFactor = logs.filter((l) => !(l.lifestyleFactors || []).includes(factor));
    if (withFactor.length >= 2 && withoutFactor.length >= 2) {
      const avgHFWith =
        withFactor.reduce((a, l) => a + l.symptoms.hotFlashes, 0) / withFactor.length;
      const avgHFWithout =
        withoutFactor.reduce((a, l) => a + l.symptoms.hotFlashes, 0) / withoutFactor.length;

      const avgSleepFWith =
        withFactor.reduce((a, l) => a + l.symptoms.sleepQuality, 0) / withFactor.length;
      const avgSleepFWithout =
        withoutFactor.reduce((a, l) => a + l.symptoms.sleepQuality, 0) / withoutFactor.length;

      const compWith =
        withFactor.reduce(
          (a, l) =>
            a +
            (l.symptoms.hotFlashes +
              l.symptoms.sleepQuality +
              l.symptoms.moodChanges +
              l.symptoms.fatigue +
              l.symptoms.jointAches) /
              5,
          0
        ) / withFactor.length;

      const compWithout =
        withoutFactor.reduce(
          (a, l) =>
            a +
            (l.symptoms.hotFlashes +
              l.symptoms.sleepQuality +
              l.symptoms.moodChanges +
              l.symptoms.fatigue +
              l.symptoms.jointAches) /
              5,
          0
        ) / withoutFactor.length;

      const compositeDelta = Number((compWith - compWithout).toFixed(2));
      const category = triggerNames.has(factor) ? 'trigger' : 'supportive';

      let summaryText = '';
      if (compositeDelta > 0.25) {
        summaryText = `Associated with +${compositeDelta.toFixed(1)} pts higher overall symptom severity (Sleep avg ${avgSleepFWith.toFixed(1)}/5 vs ${avgSleepFWithout.toFixed(1)}/5).`;
      } else if (compositeDelta < -0.2) {
        summaryText = `Associated with ${Math.abs(compositeDelta).toFixed(1)} pts lower overall symptom severity (Sleep avg ${avgSleepFWith.toFixed(1)}/5 vs ${avgSleepFWithout.toFixed(1)}/5).`;
      } else {
        summaryText = `Logged on ${withFactor.length} days; symptom averages remained steady (${compWith.toFixed(1)}/5).`;
      }

      correlations.push({
        factor,
        category,
        daysPresent: withFactor.length,
        avgHotFlashWith: Number(avgHFWith.toFixed(1)),
        avgHotFlashWithout: Number(avgHFWithout.toFixed(1)),
        avgSleepWith: Number(avgSleepFWith.toFixed(1)),
        avgSleepWithout: Number(avgSleepFWithout.toFixed(1)),
        compositeDelta,
        summaryText,
      });
    }
  });

  correlations.sort((a, b) => Math.abs(b.compositeDelta) - Math.abs(a.compositeDelta));

  return {
    logs,
    totalDaysLogged,
    overallAvgSeverity,
    totalHotFlashes,
    totalNightSweats,
    avgDailyVasomotor,
    symptomMetrics,
    mostFrequentSymptom,
    nightSweatSleepInsight: {
      nightsWithSweats: withSweats.length,
      avgSleepDisruptionWithSweats: avgSleepWith,
      avgSleepDisruptionWithoutSweats: avgSleepWithout,
    },
    cycleSummary: {
      bleedingDaysCount,
      lastBleedingDate,
      daysSinceLastBleeding,
      flowBreakdown,
    },
    topMoodSubtypes,
    correlations,
  };
}

export function formatReadableDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  return dateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function formatFullDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  return dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function generateCSVExport(logs: DailySymptomLog[]): string {
  const headers = [
    'Date',
    'Hot Flashes Severity (1-5)',
    'Daytime Hot Flash Count',
    'Night Sweat Count',
    'Sleep Disruption (1-5)',
    'Mood Changes (1-5)',
    'Mood Subtypes',
    'Fatigue (1-5)',
    'Joint/Muscle Aches (1-5)',
    'Cycle / Bleeding Flow',
    'Lifestyle & Triggers',
    'Daily Notes',
  ];

  const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date));
  const rows = sorted.map((l) => [
    l.date,
    l.symptoms.hotFlashes,
    l.symptoms.hotFlashCount,
    l.symptoms.nightSweatCount,
    l.symptoms.sleepQuality,
    l.symptoms.moodChanges,
    `"${(l.symptoms.moodSubtypes || []).join('; ').replace(/"/g, '""')}"`,
    l.symptoms.fatigue,
    l.symptoms.jointAches,
    l.cycleFlow,
    `"${(l.lifestyleFactors || []).join('; ').replace(/"/g, '""')}"`,
    `"${(l.notes || '').replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function generatePrintableReportHTML(
  analytics: DashboardAnalytics,
  periodLabel: string,
  patientNotesForDoctor: string
): string {
  const generatedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const dateSpan =
    analytics.logs.length > 0
      ? `${formatReadableDate(analytics.logs[0].date)} – ${formatReadableDate(
          analytics.logs[analytics.logs.length - 1].date
        )}`
      : 'No logs recorded';

  const recentLogs = [...analytics.logs].sort((a, b) => b.date.localeCompare(a.date));

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Clinical Menopause Symptom Report — ${generatedDate}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1C2B27;
      background: #FFFFFF;
      margin: 0;
      padding: 32px 40px;
      line-height: 1.45;
      font-size: 13px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #1E564B;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    h1 {
      font-family: Georgia, serif;
      font-size: 22px;
      margin: 0 0 4px 0;
      color: #1E564B;
    }
    h2 {
      font-family: Georgia, serif;
      font-size: 15px;
      margin: 22px 0 10px 0;
      color: #1E564B;
      border-bottom: 1px solid #DCE5E1;
      padding-bottom: 4px;
    }
    .meta {
      color: #4A5D58;
      font-size: 12px;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }
    .kpi-box {
      border: 1px solid #DCE5E1;
      border-radius: 6px;
      padding: 10px 12px;
      background: #F7F9F8;
    }
    .kpi-label {
      font-size: 11px;
      color: #4A5D58;
      margin-bottom: 4px;
    }
    .kpi-val {
      font-family: monospace;
      font-size: 18px;
      font-weight: 700;
      color: #1C2B27;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 18px;
      font-size: 12px;
    }
    th, td {
      border: 1px solid #DCE5E1;
      padding: 7px 9px;
      text-align: left;
      vertical-align: top;
    }
    th {
      background: #EEF3F1;
      font-weight: 600;
      color: #1C2B27;
    }
    .num {
      font-family: monospace;
      text-align: right;
    }
    .notes-box {
      border: 1px solid #DCE5E1;
      background: #FBFDFC;
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 18px;
    }
    .print-bar {
      background: #EEF3F1;
      padding: 10px 16px;
      border-radius: 6px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .btn {
      background: #1E564B;
      color: #fff;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
    }
    @media print {
      .print-bar { display: none !important; }
      body { padding: 12px; }
    }
  </style>
</head>
<body>
  <div class="print-bar">
    <span><strong>Physician Consultation Summary</strong> · Ready to print or save as PDF from your browser.</span>
    <button class="btn" onclick="window.print()">Print / Save as PDF</button>
  </div>

  <div class="header">
    <div>
      <h1>Menopause & Perimenopause Clinical Symptom Summary</h1>
      <div class="meta">Generated via Serene Local Health Tracker · Reporting Window: <strong>${periodLabel}</strong> (${dateSpan})</div>
    </div>
    <div class="meta" style="text-align: right;">
      <div>Report Date: <strong>${generatedDate}</strong></div>
      <div>Days Logged: <strong>${analytics.totalDaysLogged} days</strong></div>
    </div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-box">
      <div class="kpi-label">Composite Symptom Index</div>
      <div class="kpi-val">${analytics.overallAvgSeverity.toFixed(1)} / 5.0</div>
    </div>
    <div class="kpi-box">
      <div class="kpi-label">Vasomotor Episodes (Total)</div>
      <div class="kpi-val">${analytics.totalHotFlashes + analytics.totalNightSweats} (${analytics.avgDailyVasomotor}/day)</div>
    </div>
    <div class="kpi-box">
      <div class="kpi-label">DayFlashes / NightSweats</div>
      <div class="kpi-val">${analytics.totalHotFlashes} day · ${analytics.totalNightSweats} night</div>
    </div>
    <div class="kpi-box">
      <div class="kpi-label">Last Recorded Bleeding</div>
      <div class="kpi-val">${
        analytics.cycleSummary.lastBleedingDate
          ? `${analytics.cycleSummary.lastBleedingDate} (${analytics.cycleSummary.daysSinceLastBleeding}d ago)`
          : 'None recorded'
      }</div>
    </div>
  </div>

  ${
    patientNotesForDoctor.trim()
      ? `<h2>Patient Questions & Priorities for Consultation</h2>
         <div class="notes-box">${patientNotesForDoctor.replace(/\n/g, '<br/>')}</div>`
      : ''
  }

  <h2>1. Core Symptom Severity Summary (1 = None/Minimal to 5 = Severe)</h2>
  <table>
    <thead>
      <tr>
        <th>Symptom Domain</th>
        <th class="num">Mean Severity (1–5)</th>
        <th class="num">Peak Severity</th>
        <th class="num">Moderate-to-Severe Days (≥3)</th>
        <th class="num">% of Days Affected (≥3)</th>
      </tr>
    </thead>
    <tbody>
      ${analytics.symptomMetrics
        .map(
          (m) => `<tr>
        <td><strong>${m.label}</strong></td>
        <td class="num">${m.avgSeverity.toFixed(2)} / 5.0</td>
        <td class="num">${m.maxSeverity} / 5</td>
        <td class="num">${m.moderateOrSevereDays} of ${m.totalDays} days</td>
        <td class="num">${
          m.totalDays > 0 ? Math.round((m.moderateOrSevereDays / m.totalDays) * 100) : 0
        }%</td>
      </tr>`
        )
        .join('')}
    </tbody>
  </table>

  <h2>2. Observed Clinical Insights & Lifestyle Correlations</h2>
  <div class="notes-box">
    <p style="margin: 0 0 6px 0;">• <strong>Primary Symptom Burden:</strong> ${
      analytics.mostFrequentSymptom
        ? `${analytics.mostFrequentSymptom.label} averaged ${analytics.mostFrequentSymptom.avgSeverity}/5.0 across the period, reaching moderate-to-severe intensity (≥3) on ${analytics.mostFrequentSymptom.moderateOrSevereDays} of ${analytics.totalDaysLogged} recorded days.`
        : 'Insufficient data.'
    }</p>
    <p style="margin: 0 0 6px 0;">• <strong>Vasomotor & Sleep Interaction:</strong> Night sweats occurred on ${
      analytics.nightSweatSleepInsight.nightsWithSweats
    } of ${
    analytics.totalDaysLogged
  } nights. Average sleep disruption was <strong>${
    analytics.nightSweatSleepInsight.avgSleepDisruptionWithSweats
  }/5</strong> on nights with night sweats compared to <strong>${
    analytics.nightSweatSleepInsight.avgSleepDisruptionWithoutSweats
  }/5</strong> on sweat-free nights.</p>
    ${analytics.correlations
      .slice(0, 4)
      .map(
        (c) =>
          `<p style="margin: 0 0 6px 0;">• <strong>${c.factor} (${c.daysPresent} days):</strong> ${c.summaryText}</p>`
      )
      .join('')}
  </div>

  <h2>3. Chronological Daily Symptom Log</h2>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th class="num">Hot Flash (1-5)</th>
        <th class="num">Day / Night Count</th>
        <th class="num">Sleep (1-5)</th>
        <th class="num">Mood (1-5)</th>
        <th class="num">Fatigue (1-5)</th>
        <th class="num">Joints (1-5)</th>
        <th>Cycle Flow</th>
        <th>Notes & Triggers</th>
      </tr>
    </thead>
    <tbody>
      ${recentLogs
        .map(
          (l) => `<tr>
        <td style="white-space: nowrap; font-family: monospace;">${l.date}</td>
        <td class="num">${l.symptoms.hotFlashes}</td>
        <td class="num">${l.symptoms.hotFlashCount}d / ${l.symptoms.nightSweatCount}n</td>
        <td class="num">${l.symptoms.sleepQuality}</td>
        <td class="num">${l.symptoms.moodChanges}</td>
        <td class="num">${l.symptoms.fatigue}</td>
        <td class="num">${l.symptoms.jointAches}</td>
        <td>${l.cycleFlow}</td>
        <td>${
          l.lifestyleFactors && l.lifestyleFactors.length > 0
            ? `<em>[${l.lifestyleFactors.join(', ')}]</em> `
            : ''
        }${l.notes || ''}</td>
      </tr>`
        )
        .join('')}
    </tbody>
  </table>
</body>
</html>`;
}
