'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { XIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import type { Exercise } from '@/app/types';
import { getExerciseImageUrl } from '@/lib/exercises';

type ExerciseDetailSheetProps = {
  exercise: Exercise | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function ExerciseDetailSheet({
  exercise,
  open,
  onOpenChange,
}: ExerciseDetailSheetProps) {
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    setFrameIndex(0);
  }, [exercise]);

  if (!exercise) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side='right'
        className='overflow-y-auto w-full sm:max-w-lg p-3 [&>button[data-slot=sheet-close]]:hidden'
        onPointerDownOutside={(e) => e.stopPropagation()}
        onInteractOutside={(e) => e.stopPropagation()}
      >
        <button
          type='button'
          aria-label='Close'
          className='absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 z-10'
          onClick={(e) => {
            e.stopPropagation();
            onOpenChange(false);
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <XIcon className='size-4' />
        </button>
        <SheetTitle className='text-lg font-semibold mt-4'>
          {exercise.name}
        </SheetTitle>

        {exercise.images.length > 0 && (
          <button
            type='button'
            className='relative aspect-square rounded-lg overflow-hidden mt-4 mx-auto w-full max-w-xs cursor-pointer shrink-0'
            onClick={() =>
              setFrameIndex((prev) => (prev + 1) % exercise.images.length)
            }
          >
            {exercise.images.map((img, i) => (
              <Image
                key={img}
                src={getExerciseImageUrl(img)}
                alt={`${exercise.name} - frame ${i + 1}`}
                fill
                className={`object-cover transition-opacity duration-300 ${
                  i === frameIndex ? 'opacity-100' : 'opacity-0'
                }`}
                sizes='(max-width: 640px) 80vw, 320px'
              />
            ))}
            {exercise.images.length > 1 && (
              <span className='absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full'>
                {frameIndex + 1} / {exercise.images.length}
              </span>
            )}
          </button>
        )}

        <div className='mt-4 space-y-3'>
          <div className='flex flex-wrap gap-1'>
            <Badge>{exercise.category}</Badge>
            <Badge variant='secondary'>{exercise.level}</Badge>
            {exercise.force && (
              <Badge variant='outline'>{exercise.force}</Badge>
            )}
            {exercise.mechanic && (
              <Badge variant='outline'>{exercise.mechanic}</Badge>
            )}
            {exercise.equipment && (
              <Badge variant='outline'>{exercise.equipment}</Badge>
            )}
          </div>

          <div>
            <h4 className='text-sm font-medium mb-1'>Primary Muscles</h4>
            <div className='flex flex-wrap gap-1'>
              {exercise.primaryMuscles.map((m) => (
                <Badge key={m} variant='secondary'>
                  {m}
                </Badge>
              ))}
            </div>
          </div>

          {exercise.secondaryMuscles.length > 0 && (
            <div>
              <h4 className='text-sm font-medium mb-1'>Secondary Muscles</h4>
              <div className='flex flex-wrap gap-1'>
                {exercise.secondaryMuscles.map((m) => (
                  <Badge key={m} variant='outline'>
                    {m}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {exercise.instructions.length > 0 && (
            <div>
              <h4 className='text-sm font-medium mb-1'>Instructions</h4>
              <ol className='list-decimal list-inside space-y-1 text-sm text-muted-foreground'>
                {exercise.instructions.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

