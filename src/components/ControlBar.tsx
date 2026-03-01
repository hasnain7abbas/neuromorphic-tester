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
    <div className="flex items-center gap-2 px-4 py-2 bg-lab-panel border-b border-lab-accent">
      <button
        onClick={onStart}
        disabled={!isConnected || isRunning}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded bg-lab-success text-lab-bg font-medium hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        title="Start test (Ctrl+Enter)"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="5,3 19,12 5,21" />
        </svg>
        Start
      </button>

      <button
        onClick={onAbort}
        disabled={!isRunning}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded bg-lab-danger text-white font-medium hover:bg-red-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        title="Abort test (Escape)"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <rect x="4" y="4" width="16" height="16" rx="2" />
        </svg>
        Abort
      </button>

      <button
        onClick={onClear}
        disabled={!isConnected || isRunning}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded bg-gray-600 text-gray-200 font-medium hover:bg-gray-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        title="Clear buffers and errors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="3,6 5,6 21,6" />
          <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2v2" />
        </svg>
        Clear
      </button>

      <div className="h-6 w-px bg-lab-accent mx-1" />

      <label className="flex items-center gap-2 cursor-pointer">
        <div
          className={`relative w-9 h-5 rounded-full transition-colors ${
            isAutoRecording ? 'bg-lab-success' : 'bg-gray-600'
          }`}
          onClick={() => onAutoRecordToggle(!isAutoRecording)}
        >
          <div
            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
              isAutoRecording ? 'translate-x-4' : 'translate-x-0.5'
            }`}
          />
        </div>
        <span className="text-xs text-gray-400">Auto-Record</span>
      </label>

      <div className="h-6 w-px bg-lab-accent mx-1" />

      <button
        onClick={onExportCsv}
        disabled={isRunning}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded bg-lab-accent text-gray-200 font-medium hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        title="Export CSV (Ctrl+S)"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21,15v4a2,2,0,0,1-2,2H5a2,2,0,0,1-2-2v-4" />
          <polyline points="7,10 12,15 17,10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        CSV
      </button>

      <button
        onClick={onExportXlsx}
        disabled={isRunning}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded bg-lab-accent text-gray-200 font-medium hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        title="Export Excel"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21,15v4a2,2,0,0,1-2,2H5a2,2,0,0,1-2-2v-4" />
          <polyline points="7,10 12,15 17,10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        XLSX
      </button>
    </div>
  );
}
