'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';

type ExerciseNoteSheetProps = {
  exerciseName: string;
  initialNote: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (note: string) => void;
};

export default function ExerciseNoteSheet({
  exerciseName,
  initialNote,
  open,
  onOpenChange,
  onSave,
}: ExerciseNoteSheetProps) {
  const [draft, setDraft] = React.useState(initialNote);

  React.useEffect(() => {
    if (open) setDraft(initialNote);
  }, [open, initialNote]);

  const handleSave = () => {
    onSave(draft);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side='bottom'
        className='h-auto max-h-[90vh] p-4 space-y-4'
      >
        <SheetTitle className='text-base font-semibold mt-2 pr-8'>
          Note · {exerciseName}
        </SheetTitle>

        <Textarea
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder='e.g. Increase reps next time, form felt good'
          rows={6}
        />

        <div className='flex gap-2 justify-end'>
          <Button variant='ghost' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
