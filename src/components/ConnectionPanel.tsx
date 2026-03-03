import { useState } from 'react';
import type { ConnectionState, ConnectionConfig, ConnectionType } from '../lib/types';
import { buildResourceString } from '../lib/types';

interface ConnectionPanelProps {
  connectionState: ConnectionState;
  onConnect: (resource: string) => Promise<string>;
  onDisconnect: () => Promise<void>;
  onConfigChange: (config: ConnectionConfig) => void;
}

const CONNECTION_TYPES: { value: ConnectionType; label: string }[] = [
  { value: 'gpib', label: 'GPIB' },
  { value: 'tcpip', label: 'TCP/IP (LAN)' },
  { value: 'usb', label: 'USB' },
  { value: 'manual', label: 'Manual' },
];

export default function ConnectionPanel({
  connectionState,
  onConnect,
  onDisconnect,
  onConfigChange,
}: ConnectionPanelProps) {
  const [connecting, setConnecting] = useState(false);
  const { status, config, instrumentId, errorMessage } = connectionState;
  const isConnected = status === 'connected';
  const disabled = isConnected || connecting;
  const resource = buildResourceString(config);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await onConnect(resource);
    } catch {
      // error handled by hook
    }
    setConnecting(false);
  };

  const updateConfig = (patch: Partial<ConnectionConfig>) => {
    onConfigChange({ ...config, ...patch });
  };

  const statusColor =
    status === 'connected'
      ? 'bg-green-500'
      : status === 'error'
        ? 'bg-red-500'
        : status === 'connecting'
          ? 'bg-yellow-500'
          : 'bg-gray-400';

  const inputClass =
    'bg-gray-50 border border-gray-300 rounded px-2 py-1 text-sm text-gray-800 focus:outline-none focus:border-blue-500 disabled:opacity-50';

  return (
    <div className="px-4 py-2 bg-white border-b border-gray-200">
      {/* Top row: title + status */}
      <div className="flex items-center gap-3 mb-2">
        <span className="font-semibold text-sm text-gray-800">Neuromorphic Tester</span>
        <div className="h-4 w-px bg-gray-300" />
        <div className={`w-2 h-2 rounded-full ${statusColor}`} />
        <span className="text-xs text-gray-500">
          {status === 'connected'
            ? 'Connected'
            : status === 'connecting'
              ? 'Connecting...'
              : status === 'error'
                ? 'Error'
                : 'Disconnected'}
        </span>
        {instrumentId && (
          <span className="text-xs text-gray-400 truncate max-w-xs" title={instrumentId}>
            {instrumentId}
          </span>
        )}
        {errorMessage && (
          <span className="text-xs text-red-600 truncate max-w-sm ml-auto" title={errorMessage}>
            {errorMessage}
          </span>
        )}
      </div>

      {/* Bottom row: connection fields */}
      <div className="flex items-end gap-3 flex-wrap">
        {/* Connection Type */}
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] text-gray-400 uppercase tracking-wide">Interface</label>
          <select
            value={config.type}
            onChange={(e) => updateConfig({ type: e.target.value as ConnectionType })}
            disabled={disabled}
            className={`${inputClass} w-32`}
          >
            {CONNECTION_TYPES.map((ct) => (
              <option key={ct.value} value={ct.value}>
                {ct.label}
              </option>
            ))}
          </select>
        </div>

        {/* Dynamic fields based on connection type */}
        {config.type === 'gpib' && (
          <>
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Board #</label>
              <input
                type="number"
                value={config.gpibBoard}
                onChange={(e) => updateConfig({ gpibBoard: parseInt(e.target.value) || 0 })}
                disabled={disabled}
                className={`${inputClass} w-16`}
                min={0}
                max={31}
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Address</label>
              <input
                type="number"
                value={config.gpibAddress}
                onChange={(e) => updateConfig({ gpibAddress: parseInt(e.target.value) || 0 })}
                disabled={disabled}
                className={`${inputClass} w-16`}
                min={0}
                max={30}
              />
            </div>
          </>
        )}

        {config.type === 'tcpip' && (
          <>
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">IP Address</label>
              <input
                type="text"
                value={config.tcpipHost}
                onChange={(e) => updateConfig({ tcpipHost: e.target.value })}
                disabled={disabled}
                className={`${inputClass} w-40`}
                placeholder="192.168.1.100"
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Port</label>
              <input
                type="number"
                value={config.tcpipPort}
                onChange={(e) => updateConfig({ tcpipPort: parseInt(e.target.value) || 5025 })}
                disabled={disabled}
                className={`${inputClass} w-20`}
                min={1}
                max={65535}
              />
            </div>
          </>
        )}

        {config.type === 'usb' && (
          <>
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Vendor ID</label>
              <input
                type="text"
                value={config.usbVendor}
                onChange={(e) => updateConfig({ usbVendor: e.target.value })}
                disabled={disabled}
                className={`${inputClass} w-24`}
                placeholder="0x05E6"
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Product ID</label>
              <input
                type="text"
                value={config.usbProduct}
                onChange={(e) => updateConfig({ usbProduct: e.target.value })}
                disabled={disabled}
                className={`${inputClass} w-24`}
                placeholder="0x2602"
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Serial #</label>
              <input
                type="text"
                value={config.usbSerial}
                onChange={(e) => updateConfig({ usbSerial: e.target.value })}
                disabled={disabled}
                className={`${inputClass} w-28`}
                placeholder="Serial number"
              />
            </div>
          </>
        )}

        {config.type === 'manual' && (
          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] text-gray-400 uppercase tracking-wide">VISA Resource</label>
            <input
              type="text"
              value={config.manualResource}
              onChange={(e) => updateConfig({ manualResource: e.target.value })}
              disabled={disabled}
              className={`${inputClass} w-64`}
              placeholder="GPIB0::26::INSTR"
            />
          </div>
        )}

        {/* Separator */}
        <div className="h-7 w-px bg-gray-200" />

        {/* TSP Link */}
        <div className="flex items-end gap-2">
          <label className="flex items-center gap-1.5 pb-1 cursor-pointer">
            <input
              type="checkbox"
              checked={config.tspLinkEnabled}
              onChange={(e) => updateConfig({ tspLinkEnabled: e.target.checked })}
              disabled={disabled}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-xs text-gray-600">TSP Link</span>
          </label>
          {config.tspLinkEnabled && (
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Node</label>
              <input
                type="number"
                value={config.tspLinkNode}
                onChange={(e) => updateConfig({ tspLinkNode: parseInt(e.target.value) || 1 })}
                disabled={disabled}
                className={`${inputClass} w-14`}
                min={1}
                max={64}
              />
            </div>
          )}
        </div>

        {/* Separator */}
        <div className="h-7 w-px bg-gray-200" />

        {/* Connect / Disconnect */}
        <button
          onClick={handleConnect}
          disabled={disabled}
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

        {/* Resource string preview */}
        {config.type !== 'manual' && (
          <span className="text-[10px] text-gray-400 pb-1 ml-auto font-mono" title={resource}>
            {resource}
          </span>
        )}
      </div>
    </div>
  );
}
