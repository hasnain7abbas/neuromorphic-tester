import { useState } from 'react';
import type { ConnectionState } from '../lib/types';

interface ConnectionPanelProps {
  connectionState: ConnectionState;
  onConnect: (ip: string, port: number) => Promise<string>;
  onDisconnect: () => Promise<void>;
  onIpChange: (ip: string) => void;
  onPortChange: (port: number) => void;
}

export default function ConnectionPanel({
  connectionState,
  onConnect,
  onDisconnect,
  onIpChange,
  onPortChange,
}: ConnectionPanelProps) {
  const [connecting, setConnecting] = useState(false);
  const { status, ipAddress, port, instrumentId, errorMessage } = connectionState;
  const isConnected = status === 'connected';

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await onConnect(ipAddress, port);
    } catch {
      // error is handled by the hook
    }
    setConnecting(false);
  };

  const statusColor =
    status === 'connected'
      ? 'bg-lab-success'
      : status === 'error'
        ? 'bg-lab-danger'
        : status === 'connecting'
          ? 'bg-yellow-500'
          : 'bg-gray-500';

  const statusText =
    status === 'connected'
      ? `Connected ${ipAddress}:${port}`
      : status === 'connecting'
        ? 'Connecting...'
        : status === 'error'
          ? 'Error'
          : 'Disconnected';

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-lab-panel border-b border-lab-accent">
      <div className="flex items-center gap-2">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-lab-success">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="font-bold text-sm text-gray-100">Neuromorphic Tester</span>
      </div>

      <div className="h-6 w-px bg-lab-accent mx-1" />

      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-400">IP:</label>
        <input
          type="text"
          value={ipAddress}
          onChange={(e) => onIpChange(e.target.value)}
          disabled={isConnected || connecting}
          className="bg-lab-bg border border-lab-accent rounded px-2 py-1 text-sm w-36 text-gray-200 focus:outline-none focus:border-lab-success disabled:opacity-50"
          placeholder="192.168.1.10"
        />
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-400">Port:</label>
        <input
          type="number"
          value={port}
          onChange={(e) => onPortChange(parseInt(e.target.value, 10) || 5025)}
          disabled={isConnected || connecting}
          className="bg-lab-bg border border-lab-accent rounded px-2 py-1 text-sm w-20 text-gray-200 focus:outline-none focus:border-lab-success disabled:opacity-50"
        />
      </div>

      <button
        onClick={handleConnect}
        disabled={isConnected || connecting}
        className="px-3 py-1 text-sm rounded bg-lab-success text-lab-bg font-medium hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {connecting ? 'Connecting...' : 'Connect'}
      </button>

      <button
        onClick={onDisconnect}
        disabled={!isConnected}
        className="px-3 py-1 text-sm rounded bg-lab-danger text-white font-medium hover:bg-red-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Disconnect
      </button>

      <div className="ml-auto flex items-center gap-2">
        <div className={`w-2.5 h-2.5 rounded-full ${statusColor}`} />
        <span className="text-xs text-gray-400">{statusText}</span>
      </div>

      {instrumentId && (
        <span className="text-xs text-gray-500 max-w-xs truncate" title={instrumentId}>
          {instrumentId}
        </span>
      )}

      {errorMessage && (
        <span className="text-xs text-lab-danger max-w-xs truncate" title={errorMessage}>
          {errorMessage}
        </span>
      )}
    </div>
  );
}
