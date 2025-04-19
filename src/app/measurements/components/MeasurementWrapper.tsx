'use client';

import { useState } from 'react';
import { MetricType, metricConfigs, UnitType } from '../types';
import { MeasurementForm } from './MeasurementForm';
import { MeasurementChart } from './MeasurementChart';
import { MeasurementHistory } from './MeasurementHistory';
import { convertFromBaseUnit } from '../utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type DbMeasurement = {
  id: string;
  userId: string;
  metricType: MetricType;
  metricValue: number;
  originalValue: number;
  originalUnit: UnitType;
  createdAt: string;
  updatedAt: string;
};

type MeasurementWrapperProps = {
  initialMetric: MetricType;
  measurements: DbMeasurement[];
  userPreferences: {
    metricType: MetricType;
    unit: UnitType;
  }[];
  targets: {
    metricType: MetricType;
    value: number;
    unit: UnitType;
  }[];
};

export function MeasurementWrapper({
  initialMetric,
  measurements,
  userPreferences = [],
  targets = [],
}: MeasurementWrapperProps) {
  const [selectedMetric, setSelectedMetric] =
    useState<MetricType>(initialMetric);

  const getPreferredUnit = (metricType: MetricType): UnitType => {
    if (metricType === 'body_fat') return 'percentage';
    const pref = userPreferences.find((p) => p.metricType === metricType);
    return pref?.unit || metricConfigs[metricType].units[0];
  };

  const formatMeasurements = (measurements: DbMeasurement[]) => {
    return measurements
      .filter((m) => m.metricType === selectedMetric)
      .map((m) => {
        const preferredUnit = getPreferredUnit(selectedMetric);
        const convertedValue = convertFromBaseUnit(
          m.metricValue,
          preferredUnit,
          selectedMetric
        );

        return {
          id: m.id,
          date: new Date(m.createdAt).toLocaleDateString(),
          value: Number(convertedValue.toFixed(1)),
          unit:
            preferredUnit === 'percentage' ? '%' : preferredUnit.toLowerCase(),
          type: selectedMetric,
        };
      });
  };

  // Add function to get and convert target value
  const getTargetValue = () => {
    const target = targets.find((t) => t.metricType === selectedMetric);
    if (!target) return undefined;

    const preferredUnit = getPreferredUnit(selectedMetric);
    if (target.unit === preferredUnit) return target.value;

    return convertFromBaseUnit(target.value, preferredUnit, selectedMetric);
  };

  return (
    <div>
      <div className='flex flex-col gap-4 md:flex-row md:justify-between md:items-center mb-8'>
        <h1 className='text-3xl font-bold'>Measurement Tracker</h1>
        <Select
          value={selectedMetric}
          onValueChange={(value: MetricType) => setSelectedMetric(value)}
        >
          <SelectTrigger className='w-full md:w-[180px]'>
            <SelectValue placeholder='Select measurement type' />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(metricConfigs).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className='grid gap-8 md:grid-cols-2'>
        <div>
          <h2 className='text-2xl font-semibold mb-4'>Add New Entry</h2>
          <MeasurementForm
            selectedMetric={selectedMetric}
            userPreferences={userPreferences}
          />
        </div>

        <div>
          <h2 className='text-2xl font-semibold mb-4'>Progress Chart</h2>
          <MeasurementChart
            entries={formatMeasurements(measurements)}
            selectedMetric={selectedMetric}
            target={getTargetValue()}
          />
        </div>
      </div>

      <div className='mt-8'>
        <h2 className='text-2xl font-semibold mb-4'>
          {metricConfigs[selectedMetric].label} History
        </h2>
        <div className='overflow-x-auto'>
          <MeasurementHistory entries={formatMeasurements(measurements)} />
        </div>
      </div>
    </div>
  );
}
