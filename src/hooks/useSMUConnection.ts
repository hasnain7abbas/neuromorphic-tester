import { useState, useCallback } from 'react';
import type { ConnectionState } from '../lib/types';
import { connectSMU, disconnectSMU } from '../lib/tauri-commands';

const initialState: ConnectionState = {
  status: 'disconnected',
  resource: localStorage.getItem('smu_resource') || 'GPIB26::1::INSTR',
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
      localStorage.setItem('smu_resource', resource);
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
  }, []);

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

  const setResource = useCallback((resource: string) => {
    setConnectionState((prev) => ({ ...prev, resource }));
  }, []);

  return { connectionState, connect, disconnect, setResource };
}
