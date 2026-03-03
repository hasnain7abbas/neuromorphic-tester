import { useState, useCallback } from 'react';
import type { ConnectionState, ConnectionConfig } from '../lib/types';
import { DEFAULT_CONNECTION_CONFIG, buildResourceString } from '../lib/types';
import { connectSMU, disconnectSMU } from '../lib/tauri-commands';

function loadConfig(): ConnectionConfig {
  try {
    const saved = localStorage.getItem('smu_connection_config');
    if (saved) return { ...DEFAULT_CONNECTION_CONFIG, ...JSON.parse(saved) };
  } catch { /* ignore */ }
  return DEFAULT_CONNECTION_CONFIG;
}

const savedConfig = loadConfig();

const initialState: ConnectionState = {
  status: 'disconnected',
  resource: buildResourceString(savedConfig),
  config: savedConfig,
  instrumentId: null,
  errorMessage: null,
};

export function useSMUConnection() {
  const [connectionState, setConnectionState] = useState<ConnectionState>(initialState);

  const connect = useCallback(async (resource: string) => {
    setConnectionState((prev) => ({
      ...prev,
      status: 'connecting',
      resource,
      errorMessage: null,
    }));

    try {
      const idn = await connectSMU(resource);
      localStorage.setItem('smu_connection_config', JSON.stringify(connectionState.config));
      setConnectionState((prev) => ({
        ...prev,
        status: 'connected',
        instrumentId: idn,
        errorMessage: null,
      }));
      return idn;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setConnectionState((prev) => ({
        ...prev,
        status: 'error',
        instrumentId: null,
        errorMessage: message,
      }));
      throw err;
    }
  }, [connectionState.config]);

  const disconnect = useCallback(async () => {
    try {
      await disconnectSMU();
    } catch {
      // ignore disconnect errors
    }
    setConnectionState((prev) => ({
      ...prev,
      status: 'disconnected',
      instrumentId: null,
      errorMessage: null,
    }));
  }, []);

  const setConfig = useCallback((config: ConnectionConfig) => {
    const resource = buildResourceString(config);
    setConnectionState((prev) => ({ ...prev, config, resource }));
    localStorage.setItem('smu_connection_config', JSON.stringify(config));
  }, []);

  const setResource = useCallback((resource: string) => {
    setConnectionState((prev) => ({
      ...prev,
      resource,
      config: { ...prev.config, type: 'manual', manualResource: resource },
    }));
  }, []);

  return { connectionState, connect, disconnect, setConfig, setResource };
}
