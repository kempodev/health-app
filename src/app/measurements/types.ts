import { MetricType, UnitType } from '@/app/types';

export type MeasurementEntry = {
  id: string;
  shortDate: string;
  rawDate: string | Date;
  value: number;
  metricValue?: number;
  type: MetricType;
  unit: UnitType;
};
