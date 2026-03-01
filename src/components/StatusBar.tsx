import { useState, useEffect, useRef } from 'react';

interface StatusBarProps {
  connectionStatus: string;
  readingCount: number;
  errors: string[];
  isRunning: boolean;
}

export default function StatusBar({
  connectionStatus,
  readingCount,
  errors,
  isRunning,
}: StatusBarProps) {
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRunning) {
      setElapsed(0);
      timerRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const statusColor =
    connectionStatus === 'connected'
      ? 'text-lab-success'
      : connectionStatus === 'error'
        ? 'text-lab-danger'
        : 'text-gray-500';

  const statusLabel =
    isRunning
      ? 'Running...'
      : connectionStatus === 'connected'
        ? 'Ready'
        : connectionStatus === 'connecting'
          ? 'Connecting...'
          : 'Disconnected';

  return (
    <div className="flex items-center gap-4 px-4 py-1.5 bg-lab-panel border-t border-lab-accent text-xs">
      <div className="flex items-center gap-1.5">
        <div
          className={`w-2 h-2 rounded-full ${
            isRunning
              ? 'bg-yellow-400 animate-pulse'
              : connectionStatus === 'connected'
                ? 'bg-lab-success'
                : 'bg-gray-500'
          }`}
        />
        <span className={statusColor}>{statusLabel}</span>
      </div>

      <div className="h-3 w-px bg-lab-accent" />

      <span className="text-gray-400">
        Readings: <span className="text-gray-200 font-mono">{readingCount}</span>
      </span>

      <div className="h-3 w-px bg-lab-accent" />

      <span className="text-gray-400">
        Errors:{' '}
        <span
          className={`font-mono ${errors.length > 0 ? 'text-lab-danger' : 'text-gray-200'}`}
        >
          {errors.length}
        </span>
      </span>

      {errors.length > 0 && (
        <span className="text-lab-danger truncate max-w-xs" title={errors[0]}>
          {errors[0]}
        </span>
      )}

      <div className="ml-auto flex items-center gap-1.5">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-500">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12,6 12,12 16,14" />
        </svg>
        <span className="text-gray-400 font-mono">{formatTime(elapsed)}</span>
      </div>
    </div>
  );
}
