'use client';

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
import { toast } from 'sonner';
import { DataTable } from './data-table';

interface MeasurementHistoryProps {
  entries: MeasurementEntry[];
}

export function MeasurementHistory({ entries }: MeasurementHistoryProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    try {
      setLoading(id);
      const result = await deleteMeasurement(id);
      if (!result.success) {
        toast.error(result.error);
      }
    } finally {
      setLoading(null);
    }
  };

  // columns definition here
  const columns = [
    {
      accessorKey: 'date',
      header: 'Date',
    },
    {
      accessorKey: 'value',
      header: 'Value',
      cell: function ValueCell({
        row,
      }: {
        row: { getValue: (key: string) => number };
      }) {
        const value = row.getValue('value') as number;
        return <span>{value.toFixed(1)}</span>;
      },
    },
    {
      accessorKey: 'unit',
      header: 'Unit',
    },
    {
      id: 'actions',
      cell: function ActionsCell({
        row,
      }: {
        row: { original: MeasurementEntry };
      }) {
        const entry = row.original;
        return (
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
                  Are you sure you want to delete this measurement? This action
                  cannot be undone.
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
        );
      },
    },
  ];

  return <DataTable columns={columns} data={entries} />;
}
