import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import {
  CycleFlowType,
  CYCLE_FLOW_OPTIONS,
  DailySymptomLog,
  LIFESTYLE_FACTORS,
  MOOD_SUBTYPES,
  SeverityRating,
  SYMPTOM_META,
} from '../types/symptom';
import { formatLocalDate } from '../data/sampleLogs';
import { formatFullDate } from '../utils/analytics';

interface DailyLogFormProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  existingLog?: DailySymptomLog;
  loggedDatesSet: Set<string>;
  onSaveLog: (log: DailySymptomLog) => void;
  onDeleteLog?: (date: string) => void;
}

const SEVERITY_STEPS: SeverityRating[] = [1, 2, 3, 4, 5];

export const DailyLogForm: React.FC<DailyLogFormProps> = ({
  selectedDate,
  onDateChange,
  existingLog,
  loggedDatesSet,
  onSaveLog,
  onDeleteLog,
}) => {
  const todayStr = formatLocalDate(new Date());

  const [hotFlashes, setHotFlashes] = useState<SeverityRating>(1);
  const [hotFlashCount, setHotFlashCount] = useState<number>(0);
  const [nightSweatCount, setNightSweatCount] = useState<number>(0);
  const [sleepQuality, setSleepQuality] = useState<SeverityRating>(1);
  const [moodChanges, setMoodChanges] = useState<SeverityRating>(1);
  const [moodSubtypes, setMoodSubtypes] = useState<string[]>([]);
  const [fatigue, setFatigue] = useState<SeverityRating>(1);
  const [jointAches, setJointAches] = useState<SeverityRating>(1);
  const [cycleFlow, setCycleFlow] = useState<CycleFlowType>('None');
  const [lifestyleFactors, setLifestyleFactors] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);

  // Sync form state whenever selectedDate or existingLog changes
  useEffect(() => {
    setConfirmDelete(false);
    if (existingLog) {
      setHotFlashes(existingLog.symptoms.hotFlashes);
      setHotFlashCount(existingLog.symptoms.hotFlashCount);
      setNightSweatCount(existingLog.symptoms.nightSweatCount);
      setSleepQuality(existingLog.symptoms.sleepQuality);
      setMoodChanges(existingLog.symptoms.moodChanges);
      setMoodSubtypes(existingLog.symptoms.moodSubtypes || []);
      setFatigue(existingLog.symptoms.fatigue);
      setJointAches(existingLog.symptoms.jointAches);
      setCycleFlow(existingLog.cycleFlow);
      setLifestyleFactors(existingLog.lifestyleFactors || []);
      setNotes(existingLog.notes || '');
    } else {
      setHotFlashes(1);
      setHotFlashCount(0);
      setNightSweatCount(0);
      setSleepQuality(1);
      setMoodChanges(1);
      setMoodSubtypes([]);
      setFatigue(1);
      setJointAches(1);
      setCycleFlow('None');
      setLifestyleFactors([]);
      setNotes('');
    }
  }, [selectedDate, existingLog]);

  // Generate 7-day quick strip ending today
  const quickDates = React.useMemo(() => {
    const list: { dateStr: string; dayName: string; dayNum: string; isToday: boolean }[] = [];
    const base = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(base);
      d.setDate(d.getDate() - i);
      const dStr = formatLocalDate(d);
      list.push({
        dateStr: dStr,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: String(d.getDate()),
        isToday: dStr === todayStr,
      });
    }
    return list;
  }, [todayStr]);

  const shiftDate = (deltaDays: number) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const current = new Date(y, m - 1, d);
    current.setDate(current.getDate() + deltaDays);
    const nextStr = formatLocalDate(current);
    if (nextStr <= todayStr) {
      onDateChange(nextStr);
    }
  };

  const handleHotFlashSeverityChange = (rating: SeverityRating) => {
    setHotFlashes(rating);
    if (rating === 1) {
      setHotFlashCount(0);
      setNightSweatCount(0);
    } else if (hotFlashCount === 0 && nightSweatCount === 0) {
      // Helpful default episode count when rating > 1 so user saves taps
      setHotFlashCount(rating - 1);
    }
  };

  const toggleMoodSubtype = (subtype: string) => {
    setMoodSubtypes((prev) => {
      const next = prev.includes(subtype)
        ? prev.filter((item) => item !== subtype)
        : [...prev, subtype];
      if (next.length > 0 && moodChanges === 1) {
        setMoodChanges(2);
      }
      return next;
    });
  };

  const toggleLifestyleFactor = (factor: string) => {
    setLifestyleFactors((prev) =>
      prev.includes(factor) ? prev.filter((f) => f !== factor) : [...prev, factor]
    );
  };

  const handleSetAllCalm = () => {
    setHotFlashes(1);
    setHotFlashCount(0);
    setNightSweatCount(0);
    setSleepQuality(1);
    setMoodChanges(1);
    setMoodSubtypes([]);
    setFatigue(1);
    setJointAches(1);
    setCycleFlow('None');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const entry: DailySymptomLog = {
      date: selectedDate,
      symptoms: {
        hotFlashes,
        hotFlashCount,
        nightSweatCount,
        sleepQuality,
        moodChanges,
        moodSubtypes,
        fatigue,
        jointAches,
      },
      cycleFlow,
      lifestyleFactors,
      notes: notes.trim(),
      updatedAt: new Date().toISOString(),
    };
    onSaveLog(entry);
    setSaveFeedback(
      `Saved entry for ${formatFullDate(selectedDate)}`
    );
    setTimeout(() => {
      setSaveFeedback(null);
    }, 3500);
  };

  const getSymptomValue = (key: (typeof SYMPTOM_META)[number]['key']): SeverityRating => {
    switch (key) {
      case 'hotFlashes':
        return hotFlashes;
      case 'sleepQuality':
        return sleepQuality;
      case 'moodChanges':
        return moodChanges;
      case 'fatigue':
        return fatigue;
      case 'jointAches':
        return jointAches;
    }
  };

  const setSymptomValue = (
    key: (typeof SYMPTOM_META)[number]['key'],
    val: SeverityRating
  ) => {
    switch (key) {
      case 'hotFlashes':
        handleHotFlashSeverityChange(val);
        break;
      case 'sleepQuality':
        setSleepQuality(val);
        break;
      case 'moodChanges':
        setMoodChanges(val);
        break;
      case 'fatigue':
        setFatigue(val);
        break;
      case 'jointAches':
        setJointAches(val);
        break;
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-[#DCE5E1] rounded-2xl p-5 sm:p-8"
      aria-label="Daily symptom log form"
    >
      {/* Top Header & Date Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-[#E8EFEC]">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#526660]">
            <span>Daily Check-In</span>
            <span aria-hidden="true">·</span>
            <span>Under 60 seconds</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-num">
              {existingLog ? 'Entry recorded' : 'New entry'}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-semibold text-[#1C2B27] mt-1">
            {formatFullDate(selectedDate)}
          </h2>
        </div>

        {/* Date Picker Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-[#EEF3F1] rounded-xl p-1">
            <button
              type="button"
              onClick={() => shiftDate(-1)}
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-[#3A4D48] hover:bg-white hover:text-[#1C2B27] transition-colors"
              aria-label="Previous day"
              title="Previous day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <label className="relative flex items-center gap-2 px-3 py-1.5 cursor-pointer text-sm font-medium text-[#1C2B27]">
              <Calendar className="w-4 h-4 text-[#1E564B] shrink-0" />
              <input
                type="date"
                value={selectedDate}
                max={todayStr}
                onChange={(e) => {
                  if (e.target.value) onDateChange(e.target.value);
                }}
                className="bg-transparent font-mono-num text-sm text-[#1C2B27] focus:outline-none cursor-pointer"
                aria-label="Select log date"
              />
            </label>
            <button
              type="button"
              onClick={() => shiftDate(1)}
              disabled={selectedDate >= todayStr}
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-[#3A4D48] hover:bg-white hover:text-[#1C2B27] disabled:opacity-35 disabled:pointer-events-none transition-colors"
              aria-label="Next day"
              title="Next day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {selectedDate !== todayStr && (
            <button
              type="button"
              onClick={() => onDateChange(todayStr)}
              className="px-3.5 py-2 min-h-[42px] text-xs font-medium text-[#1E564B] bg-[#EEF6F4] hover:bg-[#DCECE8] rounded-xl transition-colors whitespace-nowrap"
            >
              Jump to Today
            </button>
          )}
        </div>
      </div>

      {/* 7-Day Horizontal Quick Date Scroller */}
      <div className="py-4 border-b border-[#E8EFEC] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {quickDates.map((qd) => {
            const isSelected = qd.dateStr === selectedDate;
            const hasEntry = loggedDatesSet.has(qd.dateStr);
            return (
              <button
                key={qd.dateStr}
                type="button"
                onClick={() => onDateChange(qd.dateStr)}
                className={`min-h-[48px] min-w-[54px] px-3 py-1.5 rounded-xl flex flex-col items-center justify-center transition-colors shrink-0 ${
                  isSelected
                    ? 'bg-[#1E564B] text-white'
                    : 'bg-[#F7F9F8] text-[#3A4D48] hover:bg-[#EEF3F1]'
                }`}
              >
                <span className="text-[11px] font-medium opacity-85">
                  {qd.isToday ? 'Today' : qd.dayName}
                </span>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="font-mono-num text-sm font-semibold">
                    {qd.dayNum}
                  </span>
                  {hasEntry && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected ? 'bg-[#A7F3D0]' : 'bg-[#1E564B]'
                      }`}
                      title="Logged"
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleSetAllCalm}
          className="self-start sm:self-auto px-3.5 py-2 min-h-[40px] text-xs font-medium text-[#3A4D48] hover:text-[#1C2B27] bg-[#F7F9F8] hover:bg-[#EEF3F1] rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset All to Calm (1/5)</span>
        </button>
      </div>

      {/* Core Symptoms Checklist (1 to 5 Scale) */}
      <div className="divide-y divide-[#E8EFEC]">
        {SYMPTOM_META.map((meta, index) => {
          const currentVal = getSymptomValue(meta.key);
          return (
            <div key={meta.key} className="py-6">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="max-w-md">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono-num text-xs font-medium text-[#526660]">
                      0{index + 1}.
                    </span>
                    <h3 className="text-base sm:text-lg font-semibold text-[#1C2B27]">
                      {meta.label}
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-[#526660] mt-1">
                    {meta.description}
                  </p>
                </div>

                {/* 1 to 5 Severity Selector Buttons */}
                <div
                  className="grid grid-cols-5 gap-1.5 sm:gap-2 w-full md:w-[440px] shrink-0"
                  role="radiogroup"
                  aria-label={`${meta.label} severity from 1 to 5`}
                >
                  {SEVERITY_STEPS.map((step) => {
                    const isSelected = currentVal === step;
                    return (
                      <button
                        key={step}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => setSymptomValue(meta.key, step)}
                        className={`min-h-[56px] px-1.5 py-2 rounded-xl border text-center flex flex-col items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-[#1E564B] border-[#1E564B] text-white shadow-xs'
                            : 'bg-[#F7F9F8] border-[#DCE5E1] text-[#1C2B27] hover:bg-[#EEF3F1]'
                        }`}
                      >
                        <span className="font-mono-num text-base font-semibold leading-none">
                          {step}
                        </span>
                        <span
                          className={`text-[10px] sm:text-[11px] mt-1 leading-tight line-clamp-1 ${
                            isSelected ? 'text-[#E2F1EE] font-medium' : 'text-[#526660]'
                          }`}
                        >
                          {meta.scaleLabels[step]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Conditional Sub-Controls for Hot Flashes & Night Sweats Frequency Counter */}
              {meta.key === 'hotFlashes' && (
                <div className="mt-4 pt-4 border-t border-[#F0F4F2] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FAFBFB] px-4 py-3.5 rounded-xl">
                  <div>
                    <span className="text-xs font-semibold text-[#1C2B27]">
                      Vasomotor Episode Frequency Counter
                    </span>
                    <p className="text-xs text-[#526660] mt-0.5">
                      Log exact counts of daytime hot flashes and nighttime sweat awakenings
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                    {/* Daytime Hot Flashes Stepper */}
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-medium text-[#3A4D48]">
                        Daytime Flashes:
                      </span>
                      <div className="flex items-center bg-white border border-[#DCE5E1] rounded-xl">
                        <button
                          type="button"
                          onClick={() =>
                            setHotFlashCount((c) => Math.max(0, c - 1))
                          }
                          className="min-h-[40px] min-w-[40px] flex items-center justify-center text-[#3A4D48] hover:text-[#1C2B27] hover:bg-[#F7F9F8] rounded-l-xl transition-colors"
                          aria-label="Decrease daytime hot flashes"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-mono-num text-sm font-semibold px-3 min-w-[36px] text-center text-[#1C2B27]">
                          {hotFlashCount}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setHotFlashCount((c) => c + 1);
                            if (hotFlashes === 1) setHotFlashes(2);
                          }}
                          className="min-h-[40px] min-w-[40px] flex items-center justify-center text-[#3A4D48] hover:text-[#1C2B27] hover:bg-[#F7F9F8] rounded-r-xl transition-colors"
                          aria-label="Increase daytime hot flashes"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Night Sweats Stepper */}
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-medium text-[#3A4D48]">
                        Night Sweats:
                      </span>
                      <div className="flex items-center bg-white border border-[#DCE5E1] rounded-xl">
                        <button
                          type="button"
                          onClick={() =>
                            setNightSweatCount((c) => Math.max(0, c - 1))
                          }
                          className="min-h-[40px] min-w-[40px] flex items-center justify-center text-[#3A4D48] hover:text-[#1C2B27] hover:bg-[#F7F9F8] rounded-l-xl transition-colors"
                          aria-label="Decrease night sweats"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-mono-num text-sm font-semibold px-3 min-w-[36px] text-center text-[#1C2B27]">
                          {nightSweatCount}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setNightSweatCount((c) => c + 1);
                            if (hotFlashes === 1) setHotFlashes(2);
                          }}
                          className="min-h-[40px] min-w-[40px] flex items-center justify-center text-[#3A4D48] hover:text-[#1C2B27] hover:bg-[#F7F9F8] rounded-r-xl transition-colors"
                          aria-label="Increase night sweats"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-Symptom Toggles for Mood Changes & Brain Fog */}
              {meta.key === 'moodChanges' && (
                <div className="mt-4 pt-3 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-[#526660] mr-1">
                    Specific cognitive or mood facets:
                  </span>
                  {MOOD_SUBTYPES.map((subtype) => {
                    const active = moodSubtypes.includes(subtype);
                    return (
                      <button
                        key={subtype}
                        type="button"
                        aria-pressed={active}
                        onClick={() => toggleMoodSubtype(subtype)}
                        className={`px-3 py-1.5 min-h-[36px] text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
                          active
                            ? 'bg-[#2A7B76] border-[#2A7B76] text-white'
                            : 'bg-[#F7F9F8] border-[#DCE5E1] text-[#3A4D48] hover:bg-[#EEF3F1]'
                        }`}
                      >
                        {subtype}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* 06. Cycle / Bleeding Updates */}
        <div className="py-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="max-w-md">
              <div className="flex items-baseline gap-2">
                <span className="font-mono-num text-xs font-medium text-[#526660]">
                  06.
                </span>
                <h3 className="text-base sm:text-lg font-semibold text-[#1C2B27]">
                  Cycle & Bleeding Updates
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-[#526660] mt-1">
                Track cycle regularity, spotting, or flow volume to identify perimenopause stage transitions.
              </p>
            </div>

            <div
              className="grid grid-cols-2 sm:grid-cols-5 gap-2 w-full md:w-[440px] shrink-0"
              role="radiogroup"
              aria-label="Cycle bleeding flow type"
            >
              {CYCLE_FLOW_OPTIONS.map((opt) => {
                const isSelected = cycleFlow === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setCycleFlow(opt.value)}
                    className={`min-h-[54px] px-2.5 py-2 rounded-xl border text-center flex flex-col items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-[#1E564B] border-[#1E564B] text-white shadow-xs'
                        : 'bg-[#F7F9F8] border-[#DCE5E1] text-[#1C2B27] hover:bg-[#EEF3F1]'
                    }`}
                  >
                    <span className="text-xs font-semibold leading-tight whitespace-nowrap">
                      {opt.label}
                    </span>
                    <span
                      className={`text-[10px] mt-1 line-clamp-1 ${
                        isSelected ? 'text-[#D5E6E1]' : 'text-[#526660]'
                      }`}
                    >
                      {opt.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 07. Lifestyle Factors & Custom Notes */}
        <div className="py-6">
          <div className="flex items-baseline gap-2">
            <span className="font-mono-num text-xs font-medium text-[#526660]">
              07.
            </span>
            <h3 className="text-base sm:text-lg font-semibold text-[#1C2B27]">
              Lifestyle Factors, Triggers & Daily Notes
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-[#526660] mt-1">
            Tap any factors present today to uncover personal symptom correlations, and add custom context below.
          </p>

          {/* Interactive Lifestyle Toggles */}
          <div className="mt-4 flex flex-wrap gap-2">
            {LIFESTYLE_FACTORS.map((item) => {
              const active = lifestyleFactors.includes(item.label);
              return (
                <button
                  key={item.label}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleLifestyleFactor(item.label)}
                  className={`px-3 py-2 min-h-[40px] text-xs font-medium rounded-xl border transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                    active
                      ? item.category === 'supportive'
                        ? 'bg-[#1E564B] border-[#1E564B] text-white'
                        : 'bg-[#9E4731] border-[#9E4731] text-white'
                      : 'bg-[#F7F9F8] border-[#DCE5E1] text-[#3A4D48] hover:bg-[#EEF3F1]'
                  }`}
                >
                  {active && <Check className="w-3.5 h-3.5 shrink-0" />}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Notes Textarea */}
          <div className="mt-5">
            <label
              htmlFor="daily-notes-input"
              className="block text-xs font-medium text-[#3A4D48] mb-2"
            >
              Custom Notes (Supplements, exercise, dietary triggers, stressors, or questions for your doctor)
            </label>
            <textarea
              id="daily-notes-input"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Took 300mg magnesium glycinate before bed; afternoon espresso triggered a 3 PM hot flash; ask OB/GYN about transdermal estradiol options..."
              className="w-full rounded-xl border border-[#DCE5E1] bg-[#F7F9F8] focus:bg-white px-4 py-3 text-sm text-[#1C2B27] placeholder:text-[#6E827C] focus:outline-none focus:ring-2 focus:ring-[#1E564B] transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Form Footer / Save Actions */}
      <div className="pt-6 border-t border-[#E8EFEC] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {saveFeedback ? (
            <div
              role="status"
              className="flex items-center gap-2 text-sm font-medium text-[#1E564B]"
            >
              <Check className="w-4 h-4 shrink-0" />
              <span>{saveFeedback}</span>
            </div>
          ) : (
            <span className="text-xs text-[#526660]">
              Stored privately in your browser’s local storage · Zero cloud transmission
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {existingLog && onDeleteLog && (
            <>
              {!confirmDelete ? (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="px-4 py-2.5 min-h-[44px] text-xs font-medium text-[#9E4731] hover:bg-[#FDF3F0] rounded-xl transition-colors whitespace-nowrap"
                >
                  Delete Entry
                </button>
              ) : (
                <div className="flex items-center gap-2 bg-[#FDF3F0] px-3 py-1.5 rounded-xl border border-[#F3D5CC]">
                  <span className="text-xs text-[#9E4731] font-medium">
                    Remove {selectedDate}?
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteLog(selectedDate);
                      setConfirmDelete(false);
                    }}
                    className="px-2.5 py-1 text-xs font-semibold bg-[#9E4731] text-white rounded-lg"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="px-2 py-1 text-xs text-[#526660]"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </>
          )}

          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-3 min-h-[48px] rounded-xl bg-[#1E564B] hover:bg-[#164239] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Check className="w-4 h-4" />
            <span>{existingLog ? 'Update Daily Log' : 'Save Daily Log'}</span>
          </button>
        </div>
      </div>
    </form>
  );
};
