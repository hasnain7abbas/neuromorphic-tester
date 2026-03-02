import type { SessionInfo } from '../lib/types';

interface SessionHistoryProps {
  sessions: SessionInfo[];
  onLoadSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

function formatDate(timestamp: string): string {
  try {
    const d = new Date(timestamp);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return timestamp;
  }
}

export default function SessionHistory({
  sessions,
  onLoadSession,
  onDeleteSession,
  isOpen,
  onToggle,
}: SessionHistoryProps) {
  return (
    <div
      className={`flex flex-col bg-white border-l border-gray-200 transition-all duration-200 ${
        isOpen ? 'w-56' : 'w-7'
      }`}
    >
      <button
        onClick={onToggle}
        className="p-1 text-gray-400 hover:text-gray-600 self-center"
        title={isOpen ? 'Hide history' : 'Show history'}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`transition-transform ${isOpen ? '' : 'rotate-180'}`}
        >
          <polyline points="15,18 9,12 15,6" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="px-3 py-1.5 border-b border-gray-200">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              History
            </h3>
          </div>
          <div className="flex-1 overflow-auto">
            {sessions.length === 0 ? (
              <p className="text-xs text-gray-400 p-3">No sessions yet</p>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  className="p-2 border-b border-gray-100 hover:bg-blue-50 cursor-pointer group"
                  onClick={() => onLoadSession(session.id)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-700 truncate">
                      {session.name}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(session.id);
                      }}
                      className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100"
                      title="Delete"
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                  <span className="text-[10px] text-gray-400">
                    {formatDate(session.timestamp)}
                  </span>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
