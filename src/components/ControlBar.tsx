interface ControlBarProps {
  isConnected: boolean;
  isRunning: boolean;
  isAutoRecording: boolean;
  onStart: () => void;
  onAbort: () => void;
  onClear: () => void;
  onAutoRecordToggle: (value: boolean) => void;
  onExportCsv: () => void;
  onExportXlsx: () => void;
}

export default function ControlBar({
  isConnected,
  isRunning,
  isAutoRecording,
  onStart,
  onAbort,
  onClear,
  onAutoRecordToggle,
  onExportCsv,
  onExportXlsx,
}: ControlBarProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-1.5 bg-gray-50 border-b border-gray-200">
      <button
        onClick={onStart}
        disabled={!isConnected || isRunning}
        className="px-3 py-1 text-sm rounded bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed"
        title="Start test (Ctrl+Enter)"
      >
        Run
      </button>

      <button
        onClick={onAbort}
        disabled={!isRunning}
        className="px-3 py-1 text-sm rounded bg-red-500 text-white font-medium hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed"
        title="Abort test (Escape)"
      >
        Abort
      </button>

      <button
        onClick={onClear}
        disabled={!isConnected || isRunning}
        className="px-3 py-1 text-sm rounded bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
        title="Clear buffers and errors"
      >
        Clear
      </button>

      <div className="h-5 w-px bg-gray-300 mx-1" />

      <label className="flex items-center gap-1.5 cursor-pointer text-xs text-gray-600">
        <input
          type="checkbox"
          checked={isAutoRecording}
          onChange={(e) => onAutoRecordToggle(e.target.checked)}
          className="rounded border-gray-300"
        />
        Auto-Record
      </label>

      <div className="h-5 w-px bg-gray-300 mx-1" />

      <button
        onClick={onExportCsv}
        disabled={isRunning}
        className="px-2.5 py-1 text-xs rounded bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
        title="Export CSV (Ctrl+S)"
      >
        Export CSV
      </button>

      <button
        onClick={onExportXlsx}
        disabled={isRunning}
        className="px-2.5 py-1 text-xs rounded bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
        title="Export Excel"
      >
        Export XLSX
      </button>
    </div>
  );
}
