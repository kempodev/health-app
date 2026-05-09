'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

type RestTimerProps = {
  seconds: number;
  onDone: () => void;
};

export default function RestTimer({ seconds, onDone }: RestTimerProps) {
  const [remaining, setRemaining] = React.useState(seconds);
  const audioCtxRef = React.useRef<AudioContext | null>(null);

  const getAudioContext = React.useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    return audioCtxRef.current;
  }, []);

  const playBeep = React.useCallback(
    (frequency: number, duration: number) => {
      try {
        const ctx = getAudioContext();
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        gain.gain.value = 0.3;
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.start();
        oscillator.stop(ctx.currentTime + duration / 1000);
      } catch {
        // Audio not supported — fail silently
      }
    },
    [getAudioContext],
  );

  React.useEffect(() => {
    return () => {
      audioCtxRef.current?.close();
    };
  }, []);

  React.useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  React.useEffect(() => {
    if (remaining <= 0) {
      playBeep(880, 300);
      const timeout = setTimeout(onDone, 350);
      return () => clearTimeout(timeout);
    }
    if (remaining <= 3) {
      playBeep(660, 150);
    }
    const timer = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(timer);
  }, [remaining, onDone, playBeep]);

  const progress = 1 - remaining / seconds;
  const minutes = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm">
      <p className="text-sm text-muted-foreground mb-6 uppercase tracking-wide font-medium">
        Rest
      </p>

      <div className="relative w-48 h-48 mb-8">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-muted/30"
          />
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 44}
            strokeDashoffset={2 * Math.PI * 44 * (1 - progress)}
            className="text-primary transition-[stroke-dashoffset] duration-1000 linear"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-5xl font-bold tabular-nums">
            {minutes}:{secs.toString().padStart(2, '0')}
          </span>
        </div>
      </div>

      <Button
        variant="outline"
        size="lg"
        className="text-base px-8"
        onClick={onDone}
      >
        <X className="h-4 w-4 mr-2" />
        Skip Rest
      </Button>
    </div>
  );
}
