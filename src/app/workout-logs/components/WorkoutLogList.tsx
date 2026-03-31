'use client';

import Link from 'next/link';
import { ClipboardList, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { WorkoutLog } from '../types';
import { deleteWorkoutLog } from '../actions';

type WorkoutLogListProps = {
  logs: WorkoutLog[];
};

export default function WorkoutLogList({ logs }: WorkoutLogListProps) {
  if (logs.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No workout logs yet. Start a workout to begin tracking.</p>
      </div>
    );
  }

  const handleDelete = async (id: string) => {
    const result = await deleteWorkoutLog(id);
    if (!result.success) toast.error(result.error);
    else toast.success('Log deleted');
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Workout</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead>Status</TableHead>
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
              <TableCell>
                <Link
                  href={`/workout-logs/${log.id}`}
                  className="text-sm font-medium hover:underline"
                >
                  {log.name}
                </Link>
              </TableCell>
              <TableCell className="text-sm">{duration}</TableCell>
              <TableCell>
                {log.completed_at ? (
                  <Badge variant="default" className="text-xs">Completed</Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">In Progress</Badge>
                )}
              </TableCell>
              <TableCell>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(log.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
