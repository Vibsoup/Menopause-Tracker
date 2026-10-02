import React, { useEffect, useRef, useState } from 'react';
import {
  Chart,
  LineController,
  BarController,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Filler,
  ChartConfiguration,
} from 'chart.js';
import { DailySymptomLog, SYMPTOM_META, SymptomMetadata } from '../types/symptom';
import { SymptomSummaryMetric, formatReadableDate } from '../utils/analytics';

Chart.register(
  LineController,
  BarController,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Filler
);

interface SymptomChartsProps {
  logs: DailySymptomLog[];
  symptomMetrics: SymptomSummaryMetric[];
  onSelectDate?: (dateStr: string) => void;
}

type LineFilterKey = 'all' | SymptomMetadata['key'];
type BarModeKey = 'vasomotor_episodes' | 'domain_averages';

export const SymptomCharts: React.FC<SymptomChartsProps> = ({
  logs,
  symptomMetrics,
  onSelectDate,
}) => {
  const [lineFilter, setLineFilter] = useState<LineFilterKey>('all');
  const [barMode, setBarMode] = useState<BarModeKey>('vasomotor_episodes');

  const lineCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lineChartInstance = useRef<Chart | null>(null);

  const barCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const barChartInstance = useRef<Chart | null>(null);

  // Render Line Chart (Symptom Severity Trajectory)
  useEffect(() => {
    if (!lineCanvasRef.current) return;
    if (lineChartInstance.current) {
      lineChartInstance.current.destroy();
      lineChartInstance.current = null;
    }

    if (logs.length === 0) return;

    const labels = logs.map((l) => {
      const [, m, d] = l.date.split('-');
      return `${Number(m)}/${Number(d)}`;
    });

    const filteredMeta =
      lineFilter === 'all'
        ? SYMPTOM_META
        : SYMPTOM_META.filter((m) => m.key === lineFilter);

    const datasets = filteredMeta.map((meta) => {
      const isSingle = lineFilter !== 'all';
      return {
        label: meta.shortLabel,
        data: logs.map((l) => l.symptoms[meta.key]),
        borderColor: meta.color,
        backgroundColor: isSingle ? `${meta.color}1F` : meta.color,
        borderWidth: isSingle ? 2.5 : 2,
        pointRadius: logs.length > 14 ? 2.5 : 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#FFFFFF',
        pointBorderColor: meta.color,
        pointBorderWidth: 2,
        tension: 0.32,
        fill: isSingle,
      };
    });

    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels,
        datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        onClick: (_event, elements) => {
          if (elements.length > 0 && onSelectDate) {
            const idx = elements[0].index;
            if (logs[idx]) {
              onSelectDate(logs[idx].date);
            }
          }
        },
        plugins: {
          legend: {
            display: lineFilter === 'all',
            position: 'bottom',
            labels: {
              usePointStyle: true,
              boxWidth: 8,
              padding: 16,
              color: '#3A4D48',
              font: {
                family: "'Plus Jakarta Sans', sans-serif",
                size: 12,
                weight: 500,
              },
            },
          },
          tooltip: {
            backgroundColor: '#1C2B27',
            titleColor: '#F7F9F8',
            bodyColor: '#E4ECE9',
            padding: 12,
            cornerRadius: 8,
            titleFont: {
              family: "'Plus Jakarta Sans', sans-serif",
              size: 12,
              weight: 600,
            },
            bodyFont: {
              family: "'JetBrains Mono', monospace",
              size: 12,
            },
            callbacks: {
              title: (items) => {
                if (!items.length) return '';
                const idx = items[0].dataIndex;
                return logs[idx] ? formatReadableDate(logs[idx].date) : '';
              },
              label: (ctx) => {
                const val = ctx.parsed.y as number;
                const scaleMap: Record<number, string> = {
                  1: 'Minimal',
                  2: 'Mild',
                  3: 'Moderate',
                  4: 'Significant',
                  5: 'Severe',
                };
                return ` ${ctx.dataset.label}: ${val}/5 (${scaleMap[val] || ''})`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              color: '#526660',
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 10,
              font: {
                family: "'JetBrains Mono', monospace",
                size: 11,
              },
            },
          },
          y: {
            min: 1,
            max: 5,
            ticks: {
              stepSize: 1,
              color: '#526660',
              font: {
                family: "'JetBrains Mono', monospace",
                size: 11,
              },
              callback: (value) => {
                const labelsMap: Record<number, string> = {
                  1: '1 · None',
                  2: '2 · Mild',
                  3: '3 · Mod',
                  4: '4 · High',
                  5: '5 · Sev',
                };
                return labelsMap[Number(value)] || value;
              },
            },
            grid: {
              color: '#E8EFEC',
            },
          },
        },
      },
    };

    lineChartInstance.current = new Chart(lineCanvasRef.current, config);

    return () => {
      if (lineChartInstance.current) {
        lineChartInstance.current.destroy();
        lineChartInstance.current = null;
      }
    };
  }, [logs, lineFilter, onSelectDate]);

  // Render Bar Chart (Vasomotor Episodes OR Category Averages)
  useEffect(() => {
    if (!barCanvasRef.current) return;
    if (barChartInstance.current) {
      barChartInstance.current.destroy();
      barChartInstance.current = null;
    }

    if (logs.length === 0) return;

    if (barMode === 'vasomotor_episodes') {
      const labels = logs.map((l) => {
        const [, m, d] = l.date.split('-');
        return `${Number(m)}/${Number(d)}`;
      });

      const config: ChartConfiguration<'bar'> = {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Daytime Hot Flashes',
              data: logs.map((l) => l.symptoms.hotFlashCount),
              backgroundColor: '#B85D43',
              borderRadius: 4,
            },
            {
              label: 'Night Sweats',
              data: logs.map((l) => l.symptoms.nightSweatCount),
              backgroundColor: '#5E5086',
              borderRadius: 4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false,
          },
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                usePointStyle: true,
                boxWidth: 8,
                padding: 16,
                color: '#3A4D48',
                font: {
                  family: "'Plus Jakarta Sans', sans-serif",
                  size: 12,
                  weight: 500,
                },
              },
            },
            tooltip: {
              backgroundColor: '#1C2B27',
              padding: 12,
              cornerRadius: 8,
              titleFont: {
                family: "'Plus Jakarta Sans', sans-serif",
                size: 12,
                weight: 600,
              },
              bodyFont: {
                family: "'JetBrains Mono', monospace",
                size: 12,
              },
              callbacks: {
                title: (items) => {
                  if (!items.length) return '';
                  const idx = items[0].dataIndex;
                  return logs[idx] ? formatReadableDate(logs[idx].date) : '';
                },
                footer: (items) => {
                  const total = items.reduce((sum, item) => sum + (item.parsed.y || 0), 0);
                  return `Total Episodes: ${total}`;
                },
              },
            },
          },
          scales: {
            x: {
              stacked: true,
              grid: { display: false },
              ticks: {
                color: '#526660',
                maxRotation: 0,
                autoSkip: true,
                maxTicksLimit: 10,
                font: {
                  family: "'JetBrains Mono', monospace",
                  size: 11,
                },
              },
            },
            y: {
              stacked: true,
              beginAtZero: true,
              ticks: {
                stepSize: 1,
                color: '#526660',
                font: {
                  family: "'JetBrains Mono', monospace",
                  size: 11,
                },
              },
              grid: {
                color: '#E8EFEC',
              },
            },
          },
        },
      };

      barChartInstance.current = new Chart(barCanvasRef.current, config);
    } else {
      // Domain averages bar chart
      const labels = symptomMetrics.map((m) => m.shortLabel);
      const data = symptomMetrics.map((m) => m.avgSeverity);
      const colors = symptomMetrics.map((m) => m.color);

      const config: ChartConfiguration<'bar'> = {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Mean Severity (1–5 Scale)',
              data,
              backgroundColor: colors,
              borderRadius: 6,
              barThickness: 32,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              backgroundColor: '#1C2B27',
              padding: 12,
              cornerRadius: 8,
              bodyFont: {
                family: "'JetBrains Mono', monospace",
                size: 12,
              },
              callbacks: {
                label: (ctx) => {
                  const metric = symptomMetrics[ctx.dataIndex];
                  return [
                    ` Mean Severity: ${ctx.parsed.y?.toFixed(2)} / 5.0`,
                    ` Moderate/Severe Days (≥3): ${metric?.moderateOrSevereDays || 0} days`,
                  ];
                },
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: {
                color: '#3A4D48',
                font: {
                  family: "'Plus Jakarta Sans', sans-serif",
                  size: 11,
                  weight: 500,
                },
              },
            },
            y: {
              min: 0,
              max: 5,
              ticks: {
                stepSize: 1,
                color: '#526660',
                font: {
                  family: "'JetBrains Mono', monospace",
                  size: 11,
                },
              },
              grid: {
                color: '#E8EFEC',
              },
            },
          },
        },
      };

      barChartInstance.current = new Chart(barCanvasRef.current, config);
    }

    return () => {
      if (barChartInstance.current) {
        barChartInstance.current.destroy();
        barChartInstance.current = null;
      }
    };
  }, [logs, barMode, symptomMetrics]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Chart 1: Symptom Severity Over Time (Line Chart) */}
      <section className="lg:col-span-7 bg-white border border-[#DCE5E1] rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E8EFEC]">
          <div>
            <h3 className="text-lg font-semibold text-[#1C2B27]">
              Symptom Severity Trajectory
            </h3>
            <p className="text-xs text-[#526660] mt-0.5">
              Daily ratings on a 1 (None) to 5 (Severe) clinical scale · Click any point to inspect date
            </p>
          </div>
          <div
            className="flex items-center gap-1 p-1 bg-[#EEF3F1] rounded-lg overflow-x-auto"
            role="group"
            aria-label="Filter symptom series"
          >
            <button
              type="button"
              onClick={() => setLineFilter('all')}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 min-h-[34px] ${
                lineFilter === 'all'
                  ? 'bg-white text-[#1C2B27] shadow-xs'
                  : 'text-[#4A5D58] hover:text-[#1C2B27]'
              }`}
            >
              All 5 Domains
            </button>
            {SYMPTOM_META.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setLineFilter(m.key)}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 min-h-[34px] ${
                  lineFilter === m.key
                    ? 'bg-white text-[#1C2B27] shadow-xs'
                    : 'text-[#4A5D58] hover:text-[#1C2B27]'
                }`}
              >
                {m.shortLabel}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 h-[280px] sm:h-[310px] w-full relative">
          {logs.length > 0 ? (
            <canvas ref={lineCanvasRef} aria-label="Symptom severity line chart" />
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-[#526660]">
              No symptom logs recorded in this date range.
            </div>
          )}
        </div>
      </section>

      {/* Chart 2: Vasomotor Episode Frequency & Domain Breakdown (Bar Chart) */}
      <section className="lg:col-span-5 bg-white border border-[#DCE5E1] rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E8EFEC]">
          <div>
            <h3 className="text-lg font-semibold text-[#1C2B27]">
              {barMode === 'vasomotor_episodes'
                ? 'Vasomotor Episode Frequency'
                : 'Mean Severity by Domain'}
            </h3>
            <p className="text-xs text-[#526660] mt-0.5">
              {barMode === 'vasomotor_episodes'
                ? 'Daily daytime hot flashes vs. nighttime sweat episodes'
                : 'Average 1–5 severity score across tracked symptom domains'}
            </p>
          </div>
          <div
            className="flex items-center gap-1 p-1 bg-[#EEF3F1] rounded-lg self-start"
            role="group"
            aria-label="Switch bar chart metric"
          >
            <button
              type="button"
              onClick={() => setBarMode('vasomotor_episodes')}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 min-h-[34px] ${
                barMode === 'vasomotor_episodes'
                  ? 'bg-white text-[#1C2B27] shadow-xs'
                  : 'text-[#4A5D58] hover:text-[#1C2B27]'
              }`}
            >
              Flash Counts
            </button>
            <button
              type="button"
              onClick={() => setBarMode('domain_averages')}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 min-h-[34px] ${
                barMode === 'domain_averages'
                  ? 'bg-white text-[#1C2B27] shadow-xs'
                  : 'text-[#4A5D58] hover:text-[#1C2B27]'
              }`}
            >
              Domain Averages
            </button>
          </div>
        </div>

        <div className="mt-5 h-[280px] sm:h-[310px] w-full relative">
          {logs.length > 0 ? (
            <canvas ref={barCanvasRef} aria-label="Symptom comparison bar chart" />
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-[#526660]">
              No symptom logs recorded in this date range.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
