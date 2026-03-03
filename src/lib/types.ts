export type ConnectionType = 'gpib' | 'tcpip' | 'usb' | 'manual';

export interface ConnectionConfig {
  type: ConnectionType;
  // GPIB
  gpibBoard: number;
  gpibAddress: number;
  // TCP/IP
  tcpipHost: string;
  tcpipPort: number;
  // USB
  usbVendor: string;
  usbProduct: string;
  usbSerial: string;
  // Manual
  manualResource: string;
  // TSP Link
  tspLinkEnabled: boolean;
  tspLinkNode: number;
}

export function buildResourceString(config: ConnectionConfig): string {
  switch (config.type) {
    case 'gpib':
      return `GPIB${config.gpibBoard}::${config.gpibAddress}::INSTR`;
    case 'tcpip':
      return `TCPIP0::${config.tcpipHost}::${config.tcpipPort}::SOCKET`;
    case 'usb':
      return `USB0::${config.usbVendor}::${config.usbProduct}::${config.usbSerial}::INSTR`;
    case 'manual':
      return config.manualResource;
  }
}

export const DEFAULT_CONNECTION_CONFIG: ConnectionConfig = {
  type: 'gpib',
  gpibBoard: 0,
  gpibAddress: 26,
  tcpipHost: '192.168.1.100',
  tcpipPort: 5025,
  usbVendor: '0x05E6',
  usbProduct: '0x2602',
  usbSerial: '',
  manualResource: 'GPIB0::26::INSTR',
  tspLinkEnabled: false,
  tspLinkNode: 1,
};

export interface ConnectionState {
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  resource: string;
  config: ConnectionConfig;
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
