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
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { deleteMeasurement } from '../actions';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface MeasurementHistoryProps {
  entries: MeasurementEntry[];
}

export function MeasurementHistory({ entries }: MeasurementHistoryProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    try {
      setLoading(id);
      const result = await deleteMeasurement(id);
      if (result.error) {
        console.error(result.error);
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Value</TableHead>
          <TableHead>Unit</TableHead>
          <TableHead className='w-[50px]'></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries
          .sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          )
          .map((entry) => (
            <TableRow key={entry.id}>
              <TableCell>{entry.date}</TableCell>
              <TableCell>{entry.value.toFixed(1)}</TableCell>
              <TableCell>{entry.unit}</TableCell>
              <TableCell>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant='ghost'
                      className='cursor-pointer'
                      size='icon'
                      disabled={loading === entry.id}
                    >
                      <Trash2 className='h-4 w-4 text-destructive' />
                      <span className='sr-only'>Delete measurement</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Measurement</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this measurement? This
                        action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className='cursor-pointer'>
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(entry.id)}
                        className='bg-destructive hover:bg-destructive/90 cursor-pointer'
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))}
      </TableBody>
    </Table>
  );
}
