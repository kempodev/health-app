'use client';

import { useState } from 'react';
import { MetricType, metricConfigs, UnitType } from '../types';
import { MeasurementForm } from './MeasurementForm';
import { MeasurementChart } from './MeasurementChart';
import { MeasurementHistory } from './MeasurementHistory';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DbMeasurement {
  id: string;
  userId: string;
  metricType: MetricType;
  metricValue: number;
  originalValue: number;
  originalUnit: UnitType;
  recordedAt: string;
  createdAt: string;
  updatedAt: string;
}

interface MeasurementWrapperProps {
  initialMetric: MetricType;
  measurements: DbMeasurement[];
  userPreferences: {
    metricType: MetricType;
    unit: UnitType;
  }[];
}

export function MeasurementWrapper({
  initialMetric,
  measurements,
  userPreferences = [],
}: MeasurementWrapperProps) {
  const [selectedMetric, setSelectedMetric] =
    useState<MetricType>(initialMetric);

  return (
    <div>
      <div className='flex justify-between items-center mb-8'>
        <h1 className='text-3xl font-bold'>Measurement Tracker</h1>
        <Select
          value={selectedMetric}
          onValueChange={(value: MetricType) => setSelectedMetric(value)}
        >
          <SelectTrigger className='w-[180px]'>
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
            entries={measurements
              .filter((m) => m.metricType === selectedMetric)
              .map((m) => ({
                date: new Date(m.recordedAt).toLocaleDateString(),
                value: m.metricValue,
                unit: m.originalUnit.toLowerCase(),
                type: selectedMetric,
              }))}
            selectedMetric={selectedMetric}
          />
        </div>
      </div>

      <div className='mt-8'>
        <h2 className='text-2xl font-semibold mb-4'>
          {metricConfigs[selectedMetric].label} History
        </h2>
        <div className='overflow-x-auto'>
          <MeasurementHistory
            entries={measurements
              .filter((m) => m.metricType === selectedMetric)
              .map((m) => ({
                date: new Date(m.recordedAt).toLocaleDateString(),
                value: m.metricValue,
                unit: m.originalUnit.toLowerCase(),
                type: selectedMetric,
              }))}
          />
        </div>
      </div>
    </div>
  );
}
