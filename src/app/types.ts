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
