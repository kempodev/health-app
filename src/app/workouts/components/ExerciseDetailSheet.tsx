'use client';

import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet';
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
  if (!exercise) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto w-full sm:max-w-lg">
        <SheetTitle className="text-lg font-semibold mt-4">
          {exercise.name}
        </SheetTitle>

        {exercise.images.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mt-4">
            {exercise.images.map((img, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden">
                <Image
                  src={getExerciseImageUrl(img)}
                  alt={`${exercise.name} - ${i === 0 ? 'start' : 'end'}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, 250px"
                />
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap gap-1">
            <Badge>{exercise.category}</Badge>
            <Badge variant="secondary">{exercise.level}</Badge>
            {exercise.force && (
              <Badge variant="outline">{exercise.force}</Badge>
            )}
            {exercise.mechanic && (
              <Badge variant="outline">{exercise.mechanic}</Badge>
            )}
            {exercise.equipment && (
              <Badge variant="outline">{exercise.equipment}</Badge>
            )}
          </div>

          <div>
            <h4 className="text-sm font-medium mb-1">Primary Muscles</h4>
            <div className="flex flex-wrap gap-1">
              {exercise.primaryMuscles.map((m) => (
                <Badge key={m} variant="secondary">
                  {m}
                </Badge>
              ))}
            </div>
          </div>

          {exercise.secondaryMuscles.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-1">Secondary Muscles</h4>
              <div className="flex flex-wrap gap-1">
                {exercise.secondaryMuscles.map((m) => (
                  <Badge key={m} variant="outline">
                    {m}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {exercise.instructions.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-1">Instructions</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
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
