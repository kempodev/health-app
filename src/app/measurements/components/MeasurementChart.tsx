'use client';

import {
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { MeasurementEntry, MetricType } from '../types';

interface MeasurementChartProps {
  entries: MeasurementEntry[];
  selectedMetric: MetricType;
}

export function MeasurementChart({
  entries,
  selectedMetric,
}: MeasurementChartProps) {
  const chartConfig = {
    value: {
      label: selectedMetric,
      color: 'hsl(var(--chart-1))',
    },
  } satisfies ChartConfig;
  if (entries.length === 0) {
    return (
      <div className='flex items-center justify-center h-[200px] text-gray-500'>
        No data available
      </div>
    );
  }
  return (
    <ChartContainer config={chartConfig} className='min-h-[200px] w-full'>
      <LineChart
        accessibilityLayer
        data={entries.toReversed()}
        margin={{
          top: 20,
          right: 20,
          left: 20,
          bottom: 20,
        }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey='date'
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          // tickFormatter={(value) => value.slice(0, 3)}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={12}
          unit={entries[0].unit}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator='line' />}
        />
        <Line
          dataKey='value'
          type='linear'
          stroke='var(--chart-3)'
          strokeWidth={2}
          dot={{
            fill: 'var(--chart-3)',
          }}
          activeDot={{
            r: 6,
          }}
        >
          <LabelList
            position='top'
            offset={12}
            className='fill-foreground'
            fontSize={12}
            formatter={(value: number) => value.toFixed(1)}
          />
        </Line>
      </LineChart>
    </ChartContainer>
  );
}
