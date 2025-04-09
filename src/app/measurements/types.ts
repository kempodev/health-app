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

export interface MeasurementEntry {
  id: string;
  date: string;
  value: number;
  metricValue?: number;
  type: MetricType;
  unit: string;
}

export const metricConfigs: Record<
  MetricType,
  { units: UnitType[]; label: string }
> = {
  weight: { units: ['kg', 'lbs'], label: 'Weight' },
  body_fat: { units: ['percentage'], label: 'Body Fat' },
  chest: { units: ['cm', 'inches'], label: 'Chest' },
  arm: { units: ['cm', 'inches'], label: 'Arm' },
  waist: { units: ['cm', 'inches'], label: 'Waist' },
  hip: { units: ['cm', 'inches'], label: 'Hip' },
  thigh: { units: ['cm', 'inches'], label: 'Thigh' },
  calf: { units: ['cm', 'inches'], label: 'Calf' },
};

export type ActionResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};
