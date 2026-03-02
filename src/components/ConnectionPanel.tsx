import { useState } from 'react';
import type { ConnectionState } from '../lib/types';

interface ConnectionPanelProps {
  connectionState: ConnectionState;
  onConnect: (resource: string) => Promise<string>;
  onDisconnect: () => Promise<void>;
  onResourceChange: (resource: string) => void;
}

export default function ConnectionPanel({
  connectionState,
  onConnect,
  onDisconnect,
  onResourceChange,
}: ConnectionPanelProps) {
  const [connecting, setConnecting] = useState(false);
  const { status, resource, instrumentId, errorMessage } = connectionState;
  const isConnected = status === 'connected';

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await onConnect(resource);
    } catch {
      // error handled by hook
    }
    setConnecting(false);
  };

  const statusColor =
    status === 'connected'
      ? 'bg-green-600'
      : status === 'error'
        ? 'bg-red-500'
        : status === 'connecting'
          ? 'bg-yellow-500'
          : 'bg-gray-400';

  const statusText =
    status === 'connected'
      ? `Connected: ${resource}`
      : status === 'connecting'
        ? 'Connecting...'
        : status === 'error'
          ? 'Connection Error'
          : 'Disconnected';

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-white border-b border-gray-200">
      <span className="font-semibold text-sm text-gray-800">Neuromorphic Tester</span>

      <div className="h-5 w-px bg-gray-300 mx-1" />

      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-500">VISA Resource:</label>
        <input
          type="text"
          value={resource}
          onChange={(e) => onResourceChange(e.target.value)}
          disabled={isConnected || connecting}
          className="bg-gray-50 border border-gray-300 rounded px-2 py-1 text-sm w-52 text-gray-800 focus:outline-none focus:border-blue-500 disabled:opacity-50"
          placeholder="GPIB26::1::INSTR"
        />
      </div>

      <button
        onClick={handleConnect}
        disabled={isConnected || connecting}
        className="px-3 py-1 text-sm rounded bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {connecting ? 'Connecting...' : 'Connect'}
      </button>

      <button
        onClick={onDisconnect}
        disabled={!isConnected}
        className="px-3 py-1 text-sm rounded bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Disconnect
      </button>

      <div className="ml-auto flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${statusColor}`} />
        <span className="text-xs text-gray-500">{statusText}</span>
      </div>

      {instrumentId && (
        <span className="text-xs text-gray-400 max-w-xs truncate" title={instrumentId}>
          {instrumentId}
        </span>
      )}

      {errorMessage && (
        <span className="text-xs text-red-600 max-w-xs truncate" title={errorMessage}>
          {errorMessage}
        </span>
      )}
    </div>
  );
}
