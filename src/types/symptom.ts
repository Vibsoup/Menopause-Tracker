export type SeverityRating = 1 | 2 | 3 | 4 | 5;

export type CycleFlowType = 'None' | 'Spotting' | 'Light' | 'Medium' | 'Heavy';

export interface DailySymptomLog {
  date: string; // YYYY-MM-DD
  symptoms: {
    hotFlashes: SeverityRating;
    hotFlashCount: number; // Daytime episodes
    nightSweatCount: number; // Nighttime episodes
    sleepQuality: SeverityRating; // 1 = Restful, 5 = Severe insomnia
    moodChanges: SeverityRating; // 1 = Steady/Clear, 5 = Severe mood/fog
    moodSubtypes: string[]; // e.g., ['Brain Fog', 'Anxiety', 'Irritability']
    fatigue: SeverityRating; // 1 = Energized, 5 = Severe fatigue
    jointAches: SeverityRating; // 1 = None, 5 = Severe joint/muscle ache
  };
  cycleFlow: CycleFlowType;
  lifestyleFactors: string[];
  notes: string;
  updatedAt: string;
}

export interface SymptomMetadata {
  key: 'hotFlashes' | 'sleepQuality' | 'moodChanges' | 'fatigue' | 'jointAches';
  label: string;
  shortLabel: string;
  description: string;
  color: string;
  bgTint: string;
  scaleLabels: Record<SeverityRating, string>;
}

export const SYMPTOM_META: SymptomMetadata[] = [
  {
    key: 'hotFlashes',
    label: 'Hot Flashes & Night Sweats',
    shortLabel: 'Hot Flashes',
    description: 'Vasomotor warmth, flushing, daytime flashes, and nighttime perspiration.',
    color: '#B85D43',
    bgTint: '#FDF3F0',
    scaleLabels: {
      1: 'None',
      2: 'Mild warmth',
      3: 'Moderate',
      4: 'Intense',
      5: 'Severe',
    },
  },
  {
    key: 'sleepQuality',
    label: 'Sleep Quality & Insomnia',
    shortLabel: 'Sleep Disruption',
    description: 'Difficulty falling asleep, early waking, or fragmented rest.',
    color: '#5E5086',
    bgTint: '#F4F2F8',
    scaleLabels: {
      1: 'Restful',
      2: 'Light waking',
      3: 'Restless',
      4: 'Fragmented',
      5: 'Severe insomnia',
    },
  },
  {
    key: 'moodChanges',
    label: 'Mood Changes & Brain Fog',
    shortLabel: 'Mood & Fog',
    description: 'Anxiety, sudden irritability, word-finding difficulty, or mental haziness.',
    color: '#2A7B76',
    bgTint: '#EEF6F5',
    scaleLabels: {
      1: 'Steady & clear',
      2: 'Mild haziness',
      3: 'Noticeable shift',
      4: 'High anxiety/fog',
      5: 'Overwhelming',
    },
  },
  {
    key: 'fatigue',
    label: 'Fatigue & Energy Levels',
    shortLabel: 'Fatigue',
    description: 'Physical exhaustion, afternoon slumps, or low stamina despite rest.',
    color: '#8C6B3F',
    bgTint: '#FBF7F0',
    scaleLabels: {
      1: 'Energized',
      2: 'Afternoon dip',
      3: 'Low stamina',
      4: 'Exhausted',
      5: 'Depleted',
    },
  },
  {
    key: 'jointAches',
    label: 'Joint & Muscle Aches',
    shortLabel: 'Joint Aches',
    description: 'Morning stiffness in hands, knees, shoulders, or generalized muscle soreness.',
    color: '#3B6E5C',
    bgTint: '#EFF5F2',
    scaleLabels: {
      1: 'Comfortable',
      2: 'Mild stiffness',
      3: 'Moderate ache',
      4: 'Persistent pain',
      5: 'Severe soreness',
    },
  },
];

export const MOOD_SUBTYPES = [
  'Brain Fog',
  'Anxiety',
  'Irritability',
  'Low Motivation',
  'Word-Finding Delay',
  'Emotional Sensitivity',
];

export const CYCLE_FLOW_OPTIONS: { value: CycleFlowType; label: string; desc: string }[] = [
  { value: 'None', label: 'None', desc: 'No bleeding today' },
  { value: 'Spotting', label: 'Spotting', desc: 'Trace or light pink/brown' },
  { value: 'Light', label: 'Light Flow', desc: 'Minimal pad/liner needed' },
  { value: 'Medium', label: 'Moderate Flow', desc: 'Standard regular flow' },
  { value: 'Heavy', label: 'Heavy Flow', desc: 'Frequent changes or clots' },
];

export const LIFESTYLE_FACTORS: { label: string; category: 'supportive' | 'trigger' }[] = [
  { label: 'Magnesium glycinate', category: 'supportive' },
  { label: 'Morning walk / cardio', category: 'supportive' },
  { label: 'Strength training', category: 'supportive' },
  { label: 'Cool bedroom (65°F)', category: 'supportive' },
  { label: 'Breathwork / yoga', category: 'supportive' },
  { label: 'Hydration 2L+', category: 'supportive' },
  { label: 'Caffeine (2+ cups)', category: 'trigger' },
  { label: 'Evening wine / alcohol', category: 'trigger' },
  { label: 'High work stress', category: 'trigger' },
  { label: 'Spicy or late meal', category: 'trigger' },
];
