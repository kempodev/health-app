'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from '@/components/ui/chart';
import { MeasurementEntry, MetricType, metricConfigs } from '../types';

interface MeasurementChartProps {
  entries: MeasurementEntry[];
  selectedMetric: MetricType;
}

export function MeasurementChart({
  entries,
  selectedMetric,
}: MeasurementChartProps) {
  return (
    <div className='h-[300px]'>
      <ResponsiveContainer width='100%' height='100%'>
        <LineChart data={entries}>
          <CartesianGrid strokeDasharray='3 3' />
          <XAxis dataKey='date' />
          <YAxis />
          <Tooltip
            formatter={(value, name) => {
              const entry = entries.find((e) => e.metricValue === value);
              return [
                `${entry?.value} ${entry?.unit}`,
                metricConfigs[selectedMetric].label,
              ];
            }}
          />
          <Line type='monotone' dataKey='metricValue' stroke='#8884d8' />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
