import { MetricType, UnitType } from '@prisma/client';

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
  switch (type) {
    case 'weight':
      return targetUnit === 'lbs' ? value / 0.45359237 : value;
    case 'body_fat':
      return value;
    default:
      return targetUnit === 'inches' ? value / 2.54 : value;
  }
}
