import { useState, useCallback } from 'react';
import type { ConnectionState } from '../lib/types';
import { connectSMU, disconnectSMU } from '../lib/tauri-commands';

const initialState: ConnectionState = {
  status: 'disconnected',
  ipAddress: localStorage.getItem('smu_ip') || '192.168.1.10',
  port: parseInt(localStorage.getItem('smu_port') || '5025', 10),
  instrumentId: null,
  errorMessage: null,
};

export function useSMUConnection() {
  const [connectionState, setConnectionState] = useState<ConnectionState>(initialState);

  const connect = useCallback(async (ip: string, port: number) => {
    setConnectionState((prev) => ({
      ...prev,
      status: 'connecting',
      ipAddress: ip,
      port,
      errorMessage: null,
    }));

    try {
      const idn = await connectSMU(ip, port);
      localStorage.setItem('smu_ip', ip);
      localStorage.setItem('smu_port', port.toString());
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

  const setIp = useCallback((ip: string) => {
    setConnectionState((prev) => ({ ...prev, ipAddress: ip }));
  }, []);

  const setPort = useCallback((port: number) => {
    setConnectionState((prev) => ({ ...prev, port }));
  }, []);

  return { connectionState, connect, disconnect, setIp, setPort };
}
