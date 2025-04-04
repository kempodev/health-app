'use client';

import type React from 'react';
import { useState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from '@/components/ui/chart';
import { addMeasurement, getMeasurements } from './actions';

interface MeasurementEntry {
  date: string;
  value: number;
  metricValue?: number; // Added optional metricValue for chart
  type: MetricType;
  unit: string;
}

type MetricType =
  | 'weight'
  | 'body_fat'
  | 'chest'
  | 'arm'
  | 'waist'
  | 'hip'
  | 'thigh'
  | 'calf';

type UnitType = 'kg' | 'lbs' | 'percentage' | 'cm' | 'inches';

const metricConfigs: Record<MetricType, { units: UnitType[]; label: string }> =
  {
    weight: { units: ['kg', 'lbs'], label: 'Weight' },
    body_fat: { units: ['percentage'], label: 'Body Fat' },
    chest: { units: ['cm', 'inches'], label: 'Chest' },
    arm: { units: ['cm', 'inches'], label: 'Arm' },
    waist: { units: ['cm', 'inches'], label: 'Waist' },
    hip: { units: ['cm', 'inches'], label: 'Hip' },
    thigh: { units: ['cm', 'inches'], label: 'Thigh' },
    calf: { units: ['cm', 'inches'], label: 'Calf' },
  };

export default function MeasurementTracker() {
  const [entries, setEntries] = useState<MeasurementEntry[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('weight');
  const [selectedUnit, setSelectedUnit] = useState<UnitType>('kg');
  const { pending } = useFormStatus();

  useEffect(() => {
    async function loadMeasurements() {
      try {
        const measurements = await getMeasurements();
        setEntries(
          measurements.map((m) => ({
            date: m.recordedAt.toISOString().split('T')[0],
            value: m.originalValue, // Changed from m.metricValue
            metricValue: m.metricValue, // Keep metric value for chart
            type: m.metricType,
            unit: m.originalUnit.toLowerCase(),
          }))
        );
      } catch (error) {
        console.error('Failed to load measurements:', error);
      }
    }

    loadMeasurements();
  }, []);

  useEffect(() => {
    setSelectedUnit(metricConfigs[selectedMetric].units[0]);
  }, [selectedMetric]);

  const filteredEntries = entries.filter(
    (entry) => entry.type === selectedMetric
  );

  async function handleFormAction(formData: FormData) {
    await addMeasurement(formData);
  }

  return (
    <div className='container mx-auto px-4 py-8'>
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
          <form action={handleFormAction} className='space-y-4'>
            <input type='hidden' name='metricType' value={selectedMetric} />
            <input type='hidden' name='unit' value={selectedUnit} />

            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='value'>
                  {metricConfigs[selectedMetric].label}
                </Label>
                <Input
                  id='value'
                  name='value'
                  type='number'
                  step='0.1'
                  required
                  placeholder={`Enter ${metricConfigs[
                    selectedMetric
                  ].label.toLowerCase()}`}
                />
              </div>
              <div>
                <Label htmlFor='unit'>Unit</Label>
                <Select
                  value={selectedUnit}
                  onValueChange={(value: UnitType) => setSelectedUnit(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {metricConfigs[selectedMetric].units.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor='date'>Date</Label>
              <Input
                id='date'
                name='date'
                type='date'
                required
                defaultValue={new Date().toISOString().split('T')[0]}
              />
            </div>
            <Button type='submit' disabled={pending}>
              {pending ? 'Adding...' : 'Add Entry'}
            </Button>
          </form>
        </div>

        <div>
          <h2 className='text-2xl font-semibold mb-4'>Progress Chart</h2>
          <div className='h-[300px]'>
            <ResponsiveContainer width='100%' height='100%'>
              <LineChart data={filteredEntries}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='date' />
                <YAxis />
                <Tooltip />
                <Line type='monotone' dataKey='metricValue' stroke='#8884d8' />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className='mt-8'>
        <h2 className='text-2xl font-semibold mb-4'>
          {metricConfigs[selectedMetric].label} History
        </h2>
        <div className='overflow-x-auto'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Unit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries
                .sort(
                  (a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                )
                .map((entry, index) => (
                  <TableRow key={index}>
                    <TableCell>{entry.date}</TableCell>
                    <TableCell>{entry.value}</TableCell>
                    <TableCell>{entry.unit}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
