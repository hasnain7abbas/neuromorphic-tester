import { useState, useEffect, useCallback } from 'react';
import type { SessionInfo } from '../lib/types';
import {
  listSessions,
  createSession,
  deleteSession,
  getSessionData,
} from '../lib/tauri-commands';

export function useSession() {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [isAutoRecording, setIsAutoRecording] = useState(true);

  const loadSessions = useCallback(async () => {
    try {
      const list = await listSessions();
      setSessions(list);
    } catch {
      // Session manager may not be initialized yet
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const saveSession = useCallback(
    async (
      name: string,
      testType: string,
      script: string,
      parameters: string
    ) => {
      try {
        const id = await createSession(name, testType, script, parameters);
        await loadSessions();
        return id;
      } catch (err) {
        console.error('Failed to save session:', err);
        throw err;
      }
    },
    [loadSessions]
  );

  const removeSession = useCallback(
    async (id: string) => {
      await deleteSession(id);
      await loadSessions();
    },
    [loadSessions]
  );

  const loadSessionData = useCallback(async (id: string) => {
    return await getSessionData(id);
  }, []);

  return {
    sessions,
    isAutoRecording,
    setIsAutoRecording,
    loadSessions,
    saveSession,
    removeSession,
    loadSessionData,
  };
}
