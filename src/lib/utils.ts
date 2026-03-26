import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { MetricType, UnitType } from '@/app/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function convertToBaseUnit(
  value: number,
  unit: UnitType,
  type: MetricType
): number {
  switch (type) {
    case 'weight':
      return unit === 'lbs' ? value * 0.45359237 : value;
    case 'body_fat':
      return value;
    default:
      return unit === 'inches' ? value * 2.54 : value;
  }
}

export function convertFromBaseUnit(
  value: number,
  targetUnit: UnitType,
  type: MetricType
): number {
  let result: number;
  switch (type) {
    case 'weight':
      result = targetUnit === 'lbs' ? value / 0.45359237 : value;
      break;
    case 'body_fat':
      result = value;
      break;
    default:
      result = targetUnit === 'inches' ? value / 2.54 : value;
      break;
  }
  return Math.round(result * 100) / 100;
}

export function getMetricDisplayName(metricType: MetricType): string {
  switch (metricType) {
    case 'weight':
      return 'Weight';
    case 'body_fat':
      return 'Body Fat';
    case 'chest':
      return 'Chest';
    case 'arm':
      return 'Arm';
    case 'waist':
      return 'Waist';
    case 'hip':
      return 'Hip';
    case 'thigh':
      return 'Thigh';
    case 'calf':
      return 'Calf';
    default:
      return 'Unknown';
  }
}

export const unitSignMap = new Map<UnitType, string>([
  ['kg', 'kg'],
  ['lbs', 'lbs'],
  ['cm', 'cm'],
  ['inches', 'in'],
  ['percentage', '%'],
]);
