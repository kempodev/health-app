'use client';

import * as React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import type { Exercise } from '@/app/types';
import {
  searchExercises,
  ALL_MUSCLES,
  ALL_CATEGORIES,
  ALL_EQUIPMENT,
} from '@/lib/exercises';
import ExerciseCard from './ExerciseCard';
import ExerciseDetailSheet from './ExerciseDetailSheet';

type ExerciseBrowserProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (exercise: Exercise) => void;
};

const PAGE_SIZE = 30;

export default function ExerciseBrowser({
  open,
  onOpenChange,
  onSelect,
}: ExerciseBrowserProps) {
  const [query, setQuery] = React.useState('');
  const [muscle, setMuscle] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [equipment, setEquipment] = React.useState('');
  const [visibleCount, setVisibleCount] = React.useState(PAGE_SIZE);
  const [detailExercise, setDetailExercise] = React.useState<Exercise | null>(
    null,
  );

  const results = React.useMemo(
    () =>
      searchExercises({
        query: query || undefined,
        muscle: muscle && muscle !== 'all' ? muscle : undefined,
        category: category && category !== 'all' ? category : undefined,
        equipment: equipment && equipment !== 'all' ? equipment : undefined,
      }),
    [query, muscle, category, equipment],
  );

  const visibleResults = results.slice(0, visibleCount);

  React.useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query, muscle, category, equipment]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className='max-w-2xl h-[80vh] !flex flex-col p-0 overflow-hidden'>
          <div className='p-4 pb-0 space-y-3'>
            <DialogTitle>Add Exercise</DialogTitle>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Search exercises...'
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className='pl-9'
              />
            </div>
            <div className='grid grid-cols-3 gap-2'>
              <Select value={muscle} onValueChange={setMuscle}>
                <SelectTrigger className='text-xs w-full'>
                  <SelectValue placeholder='Muscle' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Muscles</SelectItem>
                  {ALL_MUSCLES.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className='text-xs w-full'>
                  <SelectValue placeholder='Category' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Categories</SelectItem>
                  {ALL_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={equipment} onValueChange={setEquipment}>
                <SelectTrigger className='text-xs w-full'>
                  <SelectValue placeholder='Equipment' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Equipment</SelectItem>
                  {ALL_EQUIPMENT.map((eq) => (
                    <SelectItem key={eq} value={eq}>
                      {eq}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className='text-xs text-muted-foreground'>
              {results.length} exercise{results.length !== 1 ? 's' : ''} found
            </p>
          </div>

          <ScrollArea className='flex-1 min-h-0 px-4 pb-4'>
            <div className='space-y-2'>
              {visibleResults.map((exercise) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  onSelect={(ex) => {
                    onSelect(ex);
                    onOpenChange(false);
                  }}
                  onViewDetails={setDetailExercise}
                />
              ))}
              {visibleCount < results.length && (
                <button
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                  className='w-full text-center py-2 text-sm text-muted-foreground hover:text-foreground transition-colors'
                >
                  Show more ({results.length - visibleCount} remaining)
                </button>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <ExerciseDetailSheet
        exercise={detailExercise}
        open={!!detailExercise}
        onOpenChange={(open) => {
          if (!open) setDetailExercise(null);
        }}
      />
    </>
  );
}

