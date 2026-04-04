'use client';

import * as React from 'react';
import Link from 'next/link';
import { CheckCircle, CircleDot, ClipboardList, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import type { WorkoutLog } from '../types';
import { deleteWorkoutLog } from '../actions';

type WorkoutLogListProps = {
  logs: WorkoutLog[];
};

export default function WorkoutLogList({ logs }: WorkoutLogListProps) {
  const [deleteLog, setDeleteLog] = React.useState<WorkoutLog | null>(null);

  if (logs.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No workout logs yet. Start a workout to begin tracking.</p>
      </div>
    );
  }

  const handleDelete = async () => {
    if (!deleteLog) return;
    const result = await deleteWorkoutLog(deleteLog.id);
    if (!result.success) toast.error(result.error);
    else toast.success('Log deleted');
  };

  return (
    <>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Workout</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead className="w-5"></TableHead>
          <TableHead className="w-10"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.map((log) => {
          const duration =
            log.completed_at
              ? `${Math.round((new Date(log.completed_at).getTime() - new Date(log.started_at).getTime()) / 60000)} min`
              : '-';

          return (
            <TableRow key={log.id}>
              <TableCell className="text-sm">
                {new Date(log.started_at).toLocaleDateString()}
              </TableCell>
              <TableCell className="max-w-[120px]">
                <Link
                  href={`/workout-logs/${log.id}`}
                  className="text-sm font-medium hover:underline truncate block"
                >
                  {log.name}
                </Link>
              </TableCell>
              <TableCell className="text-sm">{duration}</TableCell>
              <TableCell className="pr-0">
                {log.completed_at ? (
                  <CheckCircle className="h-4 w-4 text-primary" />
                ) : (
                  <CircleDot className="h-4 w-4 text-muted-foreground" />
                )}
              </TableCell>
              <TableCell>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => setDeleteLog(log)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
    <ConfirmDialog
      title='Delete Workout Log'
      description={`Delete the log for "${deleteLog?.name}"? This action cannot be undone.`}
      open={!!deleteLog}
      onOpenChange={(open) => { if (!open) setDeleteLog(null); }}
      onConfirm={handleDelete}
    />
    </>
  );
}
