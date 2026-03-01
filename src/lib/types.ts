export interface ConnectionState {
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  ipAddress: string;
  port: number;
  instrumentId: string | null;
  errorMessage: string | null;
}

export interface TestState {
  status: 'idle' | 'running' | 'completed' | 'aborted' | 'error';
  currentScript: string;
  elapsedTime: number;
}

export interface MeasurementData {
  voltages: number[];
  currents: number[];
  timestamps: number[];
  resistance: number[];
}

export interface RecordingState {
  isAutoRecording: boolean;
  currentSessionId: string | null;
}

export interface SessionInfo {
  id: string;
  name: string;
  timestamp: string;
  test_type: string;
  script: string;
  parameters: string;
  notes: string;
  data_file_path: string;
}

export interface SessionData {
  session: SessionInfo;
  voltages: number[];
  currents: number[];
  resistance: number[];
}

export type PlotType = 'iv' | 'it' | 'rcycle' | 'logiv';

export interface TemplateParam {
  key: string;
  label: string;
  defaultValue: number;
  min: number;
  max: number;
  step: number;
  unit: string;
}

export interface TemplateDefinition {
  id: string;
  label: string;
  paramFields: TemplateParam[];
  generate: (params: Record<string, number>) => string;
}
