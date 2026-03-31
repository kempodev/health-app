'use client';

import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import type { Exercise } from '@/app/types';
import { getExerciseImageUrl } from '@/lib/exercises';

type ExerciseCardProps = {
  exercise: Exercise;
  onSelect?: (exercise: Exercise) => void;
  onViewDetails?: (exercise: Exercise) => void;
};

export default function ExerciseCard({
  exercise,
  onSelect,
  onViewDetails,
}: ExerciseCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors">
      {exercise.images[0] && (
        <div
          className="relative h-16 w-16 flex-shrink-0 cursor-pointer overflow-hidden rounded-md"
          onClick={() => onViewDetails?.(exercise)}
        >
          <Image
            src={getExerciseImageUrl(exercise.images[0])}
            alt={exercise.name}
            fill
            className="object-cover"
            sizes="64px"
          />
        </div>
      )}
      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={() => onViewDetails?.(exercise)}
      >
        <p className="font-medium text-sm truncate">{exercise.name}</p>
        <div className="flex flex-wrap gap-1 mt-1">
          {exercise.primaryMuscles.map((m) => (
            <Badge key={m} variant="secondary" className="text-xs">
              {m}
            </Badge>
          ))}
          {exercise.equipment && (
            <Badge variant="outline" className="text-xs">
              {exercise.equipment}
            </Badge>
          )}
        </div>
      </div>
      {onSelect && (
        <Button
          size="icon"
          variant="ghost"
          onClick={() => onSelect(exercise)}
          className="flex-shrink-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
