import { DailySymptomLog } from '../types/symptom';

export function buildStandaloneSingleFileHTML(initialLogs: DailySymptomLog[]): string {
  const serializedLogs = JSON.stringify(initialLogs, null, 2);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Serene — Menopause Symptom & Wellness Tracker</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=JetBrains+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #F7F9F8; color: #1C2B27; }
    h1, h2, h3, .font-display { font-family: 'Fraunces', Georgia, serif; }
    .font-mono-num { font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; }
    @media print {
      .no-print { display: none !important; }
      body { background: #FFFFFF !important; }
    }
  </style>
</head>
<body class="min-h-screen flex flex-col">
  <header class="bg-white border-b border-[#DCE5E1] px-6 py-4 flex items-center justify-between no-print">
    <a href="#" class="font-display text-xl font-semibold text-[#1E564B]">Serene</a>
    <div class="flex items-center gap-3">
      <button onclick="window.print()" class="px-4 py-2 text-xs font-semibold text-white bg-[#1E564B] hover:bg-[#164239] rounded-xl cursor-pointer">
        Print / Save PDF Report
      </button>
    </div>
  </header>

  <main class="max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
    <section class="bg-white border border-[#DCE5E1] rounded-2xl p-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8EFEC] pb-4">
        <div>
          <h1 class="text-2xl font-semibold text-[#1C2B27]">Menopause Symptom & Wellness Tracker</h1>
          <p class="text-xs text-[#526660] mt-1">100% Local Browser Privacy (localStorage) · Under 1-Minute Daily Check-In</p>
        </div>
        <div class="flex items-center gap-2 no-print">
          <button id="btn-7d" onclick="setRange(7)" class="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#1E564B] text-white">7 Days</button>
          <button id="btn-30d" onclick="setRange(30)" class="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#EEF3F1] text-[#3A4D48]">30 Days</button>
        </div>
      </div>

      <div id="kpi-row" class="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6"></div>
    </section>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <section class="lg:col-span-5 bg-white border border-[#DCE5E1] rounded-2xl p-6 no-print">
        <h2 class="text-xl font-semibold text-[#1C2B27] mb-1">Daily Symptom Log</h2>
        <p class="text-xs text-[#526660] mb-4">Rate severity from 1 (None/Minimal) to 5 (Severe)</p>
        <form id="log-form" onsubmit="saveEntry(event)" class="space-y-4">
          <div>
            <label class="block text-xs font-medium text-[#3A4D48] mb-1">Date</label>
            <input type="date" id="f-date" required class="w-full border border-[#DCE5E1] rounded-xl px-3 py-2 text-sm font-mono-num" onchange="loadDateIntoForm(this.value)" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-[#3A4D48] mb-1">Hot Flashes (1-5)</label>
              <input type="number" id="f-hf" min="1" max="5" value="2" class="w-full border border-[#DCE5E1] rounded-xl px-3 py-2 text-sm font-mono-num" />
            </div>
            <div>
              <label class="block text-xs font-medium text-[#3A4D48] mb-1">Flash Count (Day / Night)</label>
              <div class="flex gap-2">
                <input type="number" id="f-hf-day" min="0" max="40" value="1" placeholder="Day" class="w-1/2 border border-[#DCE5E1] rounded-xl px-2.5 py-2 text-sm font-mono-num" />
                <input type="number" id="f-hf-night" min="0" max="20" value="0" placeholder="Night" class="w-1/2 border border-[#DCE5E1] rounded-xl px-2.5 py-2 text-sm font-mono-num" />
              </div>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-[#3A4D48] mb-1">Sleep / Insomnia (1-5)</label>
              <input type="number" id="f-sleep" min="1" max="5" value="2" class="w-full border border-[#DCE5E1] rounded-xl px-3 py-2 text-sm font-mono-num" />
            </div>
            <div>
              <label class="block text-xs font-medium text-[#3A4D48] mb-1">Mood / Brain Fog (1-5)</label>
              <input type="number" id="f-mood" min="1" max="5" value="2" class="w-full border border-[#DCE5E1] rounded-xl px-3 py-2 text-sm font-mono-num" />
            </div>
          </div>
          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-medium text-[#3A4D48] mb-1">Fatigue (1-5)</label>
              <input type="number" id="f-fatigue" min="1" max="5" value="2" class="w-full border border-[#DCE5E1] rounded-xl px-3 py-2 text-sm font-mono-num" />
            </div>
            <div>
              <label class="block text-xs font-medium text-[#3A4D48] mb-1">Joint Aches (1-5)</label>
              <input type="number" id="f-joints" min="1" max="5" value="2" class="w-full border border-[#DCE5E1] rounded-xl px-3 py-2 text-sm font-mono-num" />
            </div>
            <div>
              <label class="block text-xs font-medium text-[#3A4D48] mb-1">Cycle Flow</label>
              <select id="f-cycle" class="w-full border border-[#DCE5E1] rounded-xl px-2.5 py-2 text-sm">
                <option value="None">None</option>
                <option value="Spotting">Spotting</option>
                <option value="Light">Light</option>
                <option value="Medium">Medium</option>
                <option value="Heavy">Heavy</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-[#3A4D48] mb-1">Notes (Triggers, supplements, exercise)</label>
            <textarea id="f-notes" rows="2" class="w-full border border-[#DCE5E1] rounded-xl px-3 py-2 text-sm"></textarea>
          </div>
          <button type="submit" class="w-full py-2.5 rounded-xl bg-[#1E564B] hover:bg-[#164239] text-white font-semibold text-sm cursor-pointer">Save Daily Entry</button>
        </form>
      </section>

      <section class="lg:col-span-7 bg-white border border-[#DCE5E1] rounded-2xl p-6 space-y-6">
        <div>
          <h2 class="text-xl font-semibold text-[#1C2B27]">Symptom Severity Trends</h2>
          <div class="h-64 mt-3"><canvas id="trendChart"></canvas></div>
        </div>
        <div class="border-t border-[#E8EFEC] pt-5">
          <h3 class="text-base font-semibold text-[#1C2B27] mb-2">Recent Daily Logs</h3>
          <div class="overflow-x-auto">
            <table class="w-full text-xs text-left border-collapse">
              <thead>
                <tr class="border-b border-[#DCE5E1] text-[#526660]">
                  <th class="py-2 pr-3">Date</th>
                  <th class="py-2 px-2">Hot Flash</th>
                  <th class="py-2 px-2">Sleep</th>
                  <th class="py-2 px-2">Mood</th>
                  <th class="py-2 px-2">Fatigue</th>
                  <th class="py-2 px-2">Joints</th>
                  <th class="py-2 px-2">Cycle</th>
                  <th class="py-2 pl-2">Notes</th>
                </tr>
              </thead>
              <tbody id="log-table-body" class="divide-y divide-[#E8EFEC]"></tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  </main>

  <script>
    const STORAGE_KEY = 'serene_menopause_logs_v1';
    const SAMPLE_DATA = ${serializedLogs};
    let currentRange = 14;
    let chartInstance = null;

    function getLogs() {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_DATA));
        return SAMPLE_DATA;
      }
      try { return JSON.parse(raw); } catch { return SAMPLE_DATA; }
    }

    function setRange(days) {
      currentRange = days;
      document.getElementById('btn-7d').className = days === 7 ? 'px-3 py-1.5 text-xs font-medium rounded-lg bg-[#1E564B] text-white' : 'px-3 py-1.5 text-xs font-medium rounded-lg bg-[#EEF3F1] text-[#3A4D48]';
      document.getElementById('btn-30d').className = days === 30 ? 'px-3 py-1.5 text-xs font-medium rounded-lg bg-[#1E564B] text-white' : 'px-3 py-1.5 text-xs font-medium rounded-lg bg-[#EEF3F1] text-[#3A4D48]';
      renderAll();
    }

    function loadDateIntoForm(dateStr) {
      const logs = getLogs();
      const found = logs.find(l => l.date === dateStr);
      if (found) {
        document.getElementById('f-hf').value = found.symptoms.hotFlashes;
        document.getElementById('f-hf-day').value = found.symptoms.hotFlashCount;
        document.getElementById('f-hf-night').value = found.symptoms.nightSweatCount;
        document.getElementById('f-sleep').value = found.symptoms.sleepQuality;
        document.getElementById('f-mood').value = found.symptoms.moodChanges;
        document.getElementById('f-fatigue').value = found.symptoms.fatigue;
        document.getElementById('f-joints').value = found.symptoms.jointAches;
        document.getElementById('f-cycle').value = found.cycleFlow;
        document.getElementById('f-notes').value = found.notes || '';
      }
    }

    function saveEntry(e) {
      e.preventDefault();
      const dateStr = document.getElementById('f-date').value;
      const logs = getLogs().filter(l => l.date !== dateStr);
      logs.push({
        date: dateStr,
        symptoms: {
          hotFlashes: Number(document.getElementById('f-hf').value),
          hotFlashCount: Number(document.getElementById('f-hf-day').value),
          nightSweatCount: Number(document.getElementById('f-hf-night').value),
          sleepQuality: Number(document.getElementById('f-sleep').value),
          moodChanges: Number(document.getElementById('f-mood').value),
          moodSubtypes: [],
          fatigue: Number(document.getElementById('f-fatigue').value),
          jointAches: Number(document.getElementById('f-joints').value),
        },
        cycleFlow: document.getElementById('f-cycle').value,
        lifestyleFactors: [],
        notes: document.getElementById('f-notes').value,
        updatedAt: new Date().toISOString()
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
      renderAll();
    }

    function renderAll() {
      const all = getLogs().sort((a, b) => a.date.localeCompare(b.date));
      const slice = all.slice(-currentRange);

      const avgHF = slice.length ? (slice.reduce((a, l) => a + l.symptoms.hotFlashes, 0) / slice.length).toFixed(1) : '0.0';
      const avgSleep = slice.length ? (slice.reduce((a, l) => a + l.symptoms.sleepQuality, 0) / slice.length).toFixed(1) : '0.0';
      const totalFlashes = slice.reduce((a, l) => a + (l.symptoms.hotFlashCount || 0) + (l.symptoms.nightSweatCount || 0), 0);

      document.getElementById('kpi-row').innerHTML = \`
        <div class="p-4 rounded-xl bg-[#F7F9F8] border border-[#DCE5E1]">
          <div class="text-xs text-[#526660]">Days Logged</div>
          <div class="font-mono-num text-2xl font-semibold mt-1">\${slice.length}</div>
        </div>
        <div class="p-4 rounded-xl bg-[#F7F9F8] border border-[#DCE5E1]">
          <div class="text-xs text-[#526660]">Avg Hot Flash Severity</div>
          <div class="font-mono-num text-2xl font-semibold mt-1">\${avgHF} / 5</div>
        </div>
        <div class="p-4 rounded-xl bg-[#F7F9F8] border border-[#DCE5E1]">
          <div class="text-xs text-[#526660]">Avg Sleep Disruption</div>
          <div class="font-mono-num text-2xl font-semibold mt-1">\${avgSleep} / 5</div>
        </div>
        <div class="p-4 rounded-xl bg-[#F7F9F8] border border-[#DCE5E1]">
          <div class="text-xs text-[#526660]">Total Vasomotor Episodes</div>
          <div class="font-mono-num text-2xl font-semibold mt-1">\${totalFlashes}</div>
        </div>
      \`;

      const ctx = document.getElementById('trendChart').getContext('2d');
      if (chartInstance) chartInstance.destroy();
      chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: slice.map(l => l.date.slice(5)),
          datasets: [
            { label: 'Hot Flashes', data: slice.map(l => l.symptoms.hotFlashes), borderColor: '#B85D43', tension: 0.3 },
            { label: 'Sleep Disruption', data: slice.map(l => l.symptoms.sleepQuality), borderColor: '#5E5086', tension: 0.3 },
            { label: 'Mood & Fog', data: slice.map(l => l.symptoms.moodChanges), borderColor: '#2A7B76', tension: 0.3 }
          ]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { min: 1, max: 5 } } }
      });

      const tbody = document.getElementById('log-table-body');
      tbody.innerHTML = [...slice].reverse().map(l => \`
        <tr>
          <td class="py-2 pr-3 font-mono-num">\${l.date}</td>
          <td class="py-2 px-2 font-mono-num">\${l.symptoms.hotFlashes}/5 (\${l.symptoms.hotFlashCount}d/\${l.symptoms.nightSweatCount}n)</td>
          <td class="py-2 px-2 font-mono-num">\${l.symptoms.sleepQuality}/5</td>
          <td class="py-2 px-2 font-mono-num">\${l.symptoms.moodChanges}/5</td>
          <td class="py-2 px-2 font-mono-num">\${l.symptoms.fatigue}/5</td>
          <td class="py-2 px-2 font-mono-num">\${l.symptoms.jointAches}/5</td>
          <td class="py-2 px-2">\${l.cycleFlow}</td>
          <td class="py-2 pl-2 text-[#3A4D48]">\${l.notes || ''}</td>
        </tr>
      \`).join('');
    }

    const today = new Date().toISOString().slice(0, 10);
    document.getElementById('f-date').value = today;
    loadDateIntoForm(today);
    setRange(7);
  </script>
</body>
</html>`;
}
