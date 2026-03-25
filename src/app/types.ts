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
