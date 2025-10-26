import { MetricType, UnitType } from '@/app/types';

export type MeasurementEntry = {
  id: string;
  date: string;
  value: number;
  metricValue?: number;
  type: MetricType;
  unit: UnitType;
};
