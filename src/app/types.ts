import { getMetricDisplayName } from '@/lib/utils';

export type MetricType =
  | 'weight'
  | 'body_fat'
  | 'chest'
  | 'arm'
  | 'waist'
  | 'hip'
  | 'thigh'
  | 'calf';

export type UnitType = 'kg' | 'lbs' | 'percentage' | 'cm' | 'inches';

export type ActionResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

// Exercise data types (from exercises.json)
export type Exercise = {
  id: string;
  name: string;
  force: 'pull' | 'push' | 'static' | null;
  level: 'beginner' | 'intermediate' | 'expert';
  mechanic: 'compound' | 'isolation' | null;
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  category: string;
  images: string[];
};

export type MuscleGroup =
  | 'abdominals'
  | 'abductors'
  | 'adductors'
  | 'biceps'
  | 'calves'
  | 'chest'
  | 'forearms'
  | 'glutes'
  | 'hamstrings'
  | 'lats'
  | 'lower back'
  | 'middle back'
  | 'neck'
  | 'quadriceps'
  | 'shoulders'
  | 'traps'
  | 'triceps';

export type ExerciseCategory =
  | 'strength'
  | 'cardio'
  | 'stretching'
  | 'powerlifting'
  | 'olympic weightlifting'
  | 'plyometrics'
  | 'strongman';

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const DAY_LABELS: Record<DayOfWeek, string> = {
  0: 'Monday',
  1: 'Tuesday',
  2: 'Wednesday',
  3: 'Thursday',
  4: 'Friday',
  5: 'Saturday',
  6: 'Sunday',
};

export type Measurement = {
  id: string;
  user_id: string;
  metric_type: MetricType;
  metric_value: number;
  original_value: number;
  original_unit: UnitType;
  created_at: string;
};

export type MeasurementTarget = {
  id: string;
  user_id: string;
  metric_type: MetricType;
  value: number;
  unit: UnitType;
};

export type UserPreference = {
  metric_type: MetricType;
  unit: UnitType;
};

export const metricConfigs: Record<
  MetricType,
  { units: UnitType[]; label: string }
> = {
  weight: { units: ['kg', 'lbs'], label: getMetricDisplayName('weight') },
  body_fat: { units: ['percentage'], label: getMetricDisplayName('body_fat') },
  chest: { units: ['cm', 'inches'], label: getMetricDisplayName('chest') },
  arm: { units: ['cm', 'inches'], label: getMetricDisplayName('arm') },
  waist: { units: ['cm', 'inches'], label: getMetricDisplayName('waist') },
  hip: { units: ['cm', 'inches'], label: getMetricDisplayName('hip') },
  thigh: { units: ['cm', 'inches'], label: getMetricDisplayName('thigh') },
  calf: { units: ['cm', 'inches'], label: getMetricDisplayName('calf') },
};
