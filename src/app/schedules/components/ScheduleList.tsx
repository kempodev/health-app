'use client';

import Link from 'next/link';
import { CalendarDays, Check } from 'lucide-react';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { WeeklySchedule } from '../types';
import { setActiveSchedule } from '../actions';
import DeleteScheduleDialog from './DeleteScheduleDialog';

type ScheduleListProps = {
  schedules: WeeklySchedule[];
};

export default function ScheduleList({ schedules }: ScheduleListProps) {
  if (schedules.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No schedules yet. Create your first weekly schedule.</p>
      </div>
    );
  }

  const handleSetActive = async (id: string, name: string) => {
    const result = await setActiveSchedule(id);
    if (!result.success) {
      toast.error(result.error);
    } else {
      toast.success(`"${name}" is now active`);
    }
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {schedules.map((schedule) => (
        <Card
          key={schedule.id}
          className={schedule.is_active ? 'border-primary' : ''}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">
                <Link
                  href={`/schedules/${schedule.id}`}
                  className="hover:underline"
                >
                  {schedule.name}
                </Link>
              </CardTitle>
              {schedule.is_active && (
                <Badge variant="default" className="text-xs">
                  Active
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="pb-2">
            <p className="text-xs text-muted-foreground">
              Updated {new Date(schedule.updated_at).toLocaleDateString()}
            </p>
          </CardContent>
          <CardFooter className="gap-1">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/schedules/${schedule.id}`}>Edit</Link>
            </Button>
            {!schedule.is_active && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSetActive(schedule.id, schedule.name)}
              >
                <Check className="h-4 w-4 mr-1" />
                Set Active
              </Button>
            )}
            <DeleteScheduleDialog
              scheduleId={schedule.id}
              scheduleName={schedule.name}
            />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
