import type { Exercise } from '@/app/types';
import exercisesData from '../../exercises.json';

const IMAGE_BASE_URL =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

const exercises: Exercise[] = exercisesData as Exercise[];

export function getExercises(): Exercise[] {
  return exercises;
}

export function getExerciseById(id: string): Exercise | undefined {
  return exercises.find((e) => e.id === id);
}

export type ExerciseFilters = {
  query?: string;
  muscle?: string;
  category?: string;
  equipment?: string;
};

export function searchExercises(filters: ExerciseFilters): Exercise[] {
  let results = exercises;

  if (filters.query) {
    const q = filters.query.toLowerCase();
    results = results.filter((e) => e.name.toLowerCase().includes(q));
  }

  if (filters.muscle) {
    const m = filters.muscle.toLowerCase();
    results = results.filter((e) =>
      e.primaryMuscles.some((pm) => pm.toLowerCase() === m)
    );
  }

  if (filters.category) {
    const c = filters.category.toLowerCase();
    results = results.filter((e) => e.category.toLowerCase() === c);
  }

  if (filters.equipment) {
    const eq = filters.equipment.toLowerCase();
    results = results.filter(
      (e) => e.equipment && e.equipment.toLowerCase() === eq
    );
  }

  return results;
}

export function getExerciseImageUrl(imagePath: string): string {
  return `${IMAGE_BASE_URL}${imagePath}`;
}

export const ALL_MUSCLES = [
  'abdominals',
  'abductors',
  'adductors',
  'biceps',
  'calves',
  'chest',
  'forearms',
  'glutes',
  'hamstrings',
  'lats',
  'lower back',
  'middle back',
  'neck',
  'quadriceps',
  'shoulders',
  'traps',
  'triceps',
] as const;

export const ALL_CATEGORIES = [
  'cardio',
  'olympic weightlifting',
  'plyometrics',
  'powerlifting',
  'strength',
  'stretching',
  'strongman',
] as const;

export const ALL_EQUIPMENT = [
  'bands',
  'barbell',
  'body only',
  'cable',
  'dumbbell',
  'e-z curl bar',
  'exercise ball',
  'foam roll',
  'kettlebells',
  'machine',
  'medicine ball',
  'other',
] as const;
