'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  Check,
  MoreVertical,
  Pencil,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { WeeklySchedule } from '../types';
import { setActiveSchedule } from '../actions';
import DeleteScheduleDialog from './DeleteScheduleDialog';

type ScheduleListProps = {
  schedules: WeeklySchedule[];
};

export default function ScheduleList({ schedules }: ScheduleListProps) {
  if (schedules.length === 0) {
    return (
      <div className='text-center py-12 text-muted-foreground'>
        <CalendarDays className='h-12 w-12 mx-auto mb-4 opacity-50' />
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
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
      {schedules.map((schedule) => (
        <ScheduleCard
          key={schedule.id}
          schedule={schedule}
          onSetActive={handleSetActive}
        />
      ))}
    </div>
  );
}

function ScheduleCard({
  schedule,
  onSetActive,
}: {
  schedule: WeeklySchedule;
  onSetActive: (id: string, name: string) => void;
}) {
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  return (
    <Card className={schedule.is_active ? 'border-primary' : ''}>
      <CardHeader className='pb-2'>
        <div className='flex items-start justify-between gap-2'>
          <div className='flex items-center gap-2'>
            <CardTitle className='text-base'>{schedule.name}</CardTitle>
            {schedule.is_active && (
              <Badge variant='default' className='text-xs'>
                Active
              </Badge>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='icon' className='h-8 w-8 shrink-0'>
                <MoreVertical className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' sideOffset={16}>
              <DropdownMenuItem asChild>
                <Link href={`/schedules/${schedule.id}`}>
                  <Pencil className='h-4 w-4 mr-2' />
                  Edit
                </Link>
              </DropdownMenuItem>
              {!schedule.is_active && (
                <DropdownMenuItem
                  onClick={() => onSetActive(schedule.id, schedule.name)}
                >
                  <Check className='h-4 w-4 mr-2' />
                  Set Active
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                className='text-destructive focus:text-destructive'
                onSelect={() => setDeleteOpen(true)}
              >
                <Trash2 className='h-4 w-4 mr-2' />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <p className='text-xs text-muted-foreground'>
          Updated {new Date(schedule.updated_at).toLocaleDateString()}
        </p>
      </CardContent>
      <DeleteScheduleDialog
        scheduleId={schedule.id}
        scheduleName={schedule.name}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </Card>
  );
}
