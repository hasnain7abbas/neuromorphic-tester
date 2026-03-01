import { invoke } from '@tauri-apps/api/core';
import type { SessionInfo } from './types';

export async function connectSMU(ip: string, port: number): Promise<string> {
  return invoke<string>('connect_smu', { ip, port });
}

export async function disconnectSMU(): Promise<void> {
  return invoke('disconnect_smu');
}

export async function sendCommand(command: string): Promise<void> {
  return invoke('send_command', { command });
}

export async function sendQuery(command: string): Promise<string> {
  return invoke<string>('send_query', { command });
}

export async function abortTest(): Promise<void> {
  return invoke('abort_test');
}

export async function clearBuffers(): Promise<void> {
  return invoke('clear_buffers');
}

export async function runScript(script: string): Promise<string> {
  return invoke<string>('run_script', { script });
}

export async function runScriptWithStreaming(script: string): Promise<void> {
  return invoke('run_script_with_streaming', { script });
}

export async function checkErrors(): Promise<string[]> {
  return invoke<string[]>('check_errors');
}

export async function initSessionManager(): Promise<void> {
  return invoke('init_session_manager');
}

export async function createSession(
  name: string,
  testType: string,
  script: string,
  parameters: string
): Promise<string> {
  return invoke<string>('create_session', {
    name,
    testType,
    script,
    parameters,
  });
}

export async function listSessions(): Promise<SessionInfo[]> {
  return invoke<SessionInfo[]>('list_sessions');
}

export async function getSessionData(sessionId: string): Promise<{
  session: SessionInfo;
  voltages: number[];
  currents: number[];
  resistance: number[];
}> {
  return invoke('get_session_data', { sessionId });
}

export async function exportSessionCsv(
  sessionId: string,
  savePath: string
): Promise<string> {
  return invoke<string>('export_session_csv', { sessionId, savePath });
}

export async function exportSessionXlsx(savePath: string): Promise<string> {
  return invoke<string>('export_session_xlsx', { savePath });
}

export async function deleteSession(sessionId: string): Promise<void> {
  return invoke('delete_session', { sessionId });
}

export async function getCurrentData(): Promise<{
  voltages: number[];
  currents: number[];
  timestamps: string[];
}> {
  return invoke('get_current_data');
}
