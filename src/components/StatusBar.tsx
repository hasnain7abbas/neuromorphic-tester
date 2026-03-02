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

  const statusLabel =
    isRunning
      ? 'Running...'
      : connectionStatus === 'connected'
        ? 'Ready'
        : connectionStatus === 'connecting'
          ? 'Connecting...'
          : 'Disconnected';

  return (
    <div className="flex items-center gap-4 px-4 py-1 bg-white border-t border-gray-200 text-xs text-gray-500">
      <div className="flex items-center gap-1.5">
        <div
          className={`w-1.5 h-1.5 rounded-full ${
            isRunning
              ? 'bg-yellow-500 animate-pulse'
              : connectionStatus === 'connected'
                ? 'bg-green-500'
                : 'bg-gray-400'
          }`}
        />
        <span>{statusLabel}</span>
      </div>

      <span>Readings: <span className="text-gray-700 font-mono">{readingCount}</span></span>

      <span>
        Errors:{' '}
        <span className={errors.length > 0 ? 'text-red-600' : 'text-gray-700'}>
          {errors.length}
        </span>
      </span>

      {errors.length > 0 && (
        <span className="text-red-500 truncate max-w-xs" title={errors[0]}>
          {errors[0]}
        </span>
      )}

      <span className="ml-auto font-mono">{formatTime(elapsed)}</span>
    </div>
  );
}
