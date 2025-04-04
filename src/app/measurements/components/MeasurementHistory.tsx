'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MeasurementEntry } from '../types';

interface MeasurementHistoryProps {
  entries: MeasurementEntry[];
}

export function MeasurementHistory({ entries }: MeasurementHistoryProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Value</TableHead>
          <TableHead>Unit</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries
          .sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          )
          .map((entry, index) => (
            <TableRow key={index}>
              <TableCell>{entry.date}</TableCell>
              <TableCell>{entry.value.toFixed(1)}</TableCell>
              <TableCell>{entry.unit}</TableCell>
            </TableRow>
          ))}
      </TableBody>
    </Table>
  );
}
