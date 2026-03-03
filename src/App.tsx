import { useState, useEffect, useCallback, useMemo } from 'react';
import ConnectionPanel from './components/ConnectionPanel';
import ControlBar from './components/ControlBar';
import ScriptEditor from './components/ScriptEditor';
import ConfigPanel from './components/ConfigPanel';
import GraphPanel from './components/GraphPanel';
import DataTable from './components/DataTable';
import SessionHistory from './components/SessionHistory';
import StatusBar from './components/StatusBar';
import { useSMUConnection } from './hooks/useSMUConnection';
import { useDataStream } from './hooks/useDataStream';
import { useSession } from './hooks/useSession';
import { TEMPLATES } from './lib/templates';
import {
  runScriptWithStreaming,
  abortTest,
  clearBuffers,
  checkErrors,
  exportSessionXlsx,
} from './lib/tauri-commands';
import './styles/globals.css';

function App() {
  const { connectionState, connect, disconnect, setConfig } = useSMUConnection();
  const { data, isComplete, clearData, loadData } = useDataStream();
  const {
    sessions,
    isAutoRecording,
    setIsAutoRecording,
    saveSession,
    removeSession,
    loadSessionData,
    loadSessions,
  } = useSession();

  const [selectedTemplate, setSelectedTemplate] = useState(
    localStorage.getItem('last_template') || 'epsc'
  );
  const [paramValues, setParamValues] = useState<Record<string, number>>({});
  const [script, setScript] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [showTable, setShowTable] = useState(false);

  const currentTemplate = useMemo(
    () => TEMPLATES.find((t) => t.id === selectedTemplate) || TEMPLATES[0],
    [selectedTemplate]
  );

  // Initialize param values from template defaults
  useEffect(() => {
    const defaults: Record<string, number> = {};
    currentTemplate.paramFields.forEach((p) => {
      defaults[p.key] = p.defaultValue;
    });
    setParamValues(defaults);
  }, [currentTemplate]);

  // Generate script from template + params
  useEffect(() => {
    if (selectedTemplate !== 'custom') {
      const generated = currentTemplate.generate(paramValues);
      setScript(generated);
    }
  }, [currentTemplate, paramValues, selectedTemplate]);

  // Initialize with saved template on first load
  useEffect(() => {
    const savedScript = localStorage.getItem('last_script');
    if (savedScript && selectedTemplate === 'custom') {
      setScript(savedScript);
    }
  }, []);

  // Save script to localStorage
  useEffect(() => {
    localStorage.setItem('last_script', script);
    localStorage.setItem('last_template', selectedTemplate);
  }, [script, selectedTemplate]);

  // When test completes
  useEffect(() => {
    if (isComplete && isRunning) {
      setIsRunning(false);
      checkErrors().then(setErrors).catch(() => {});
      if (isAutoRecording) {
        const name = `${currentTemplate.label} - ${new Date().toLocaleTimeString()}`;
        saveSession(name, selectedTemplate, script, JSON.stringify(paramValues)).catch(
          (err) => console.error('Auto-save failed:', err)
        );
      }
    }
  }, [isComplete]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        if (connectionState.status === 'connected' && !isRunning) handleStart();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (isRunning) handleAbort();
      } else if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handleExportCsv();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [connectionState.status, isRunning, script]);

  const handleStart = useCallback(async () => {
    if (!script.trim()) return;
    setIsRunning(true);
    setErrors([]);
    clearData();
    try {
      await runScriptWithStreaming(script);
    } catch (err) {
      setIsRunning(false);
      setErrors([String(err)]);
    }
  }, [script, clearData]);

  const handleAbort = useCallback(async () => {
    try { await abortTest(); } catch { /* ignore */ }
    setIsRunning(false);
  }, []);

  const handleClear = useCallback(async () => {
    try { await clearBuffers(); } catch { /* ignore */ }
    clearData();
    setErrors([]);
  }, [clearData]);

  const handleParamChange = useCallback((key: string, value: number) => {
    setParamValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleTemplateChange = useCallback((templateId: string) => {
    setSelectedTemplate(templateId);
  }, []);

  const handleLoadSession = useCallback(
    async (id: string) => {
      try {
        const result = await loadSessionData(id);
        loadData(result.voltages, result.currents, result.resistance);
        setScript(result.session.script);
        const tmpl = TEMPLATES.find((t) => t.id === result.session.test_type);
        if (tmpl) {
          setSelectedTemplate(tmpl.id);
          if (result.session.parameters) {
            try { setParamValues(JSON.parse(result.session.parameters)); } catch { /* ignore */ }
          }
        }
      } catch (err) {
        console.error('Failed to load session:', err);
      }
    },
    [loadSessionData, loadData]
  );

  const handleExportCsv = useCallback(async () => {
    await loadSessions();
  }, [loadSessions]);

  const handleExportXlsx = useCallback(async () => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const savePath = `C:\\Users\\Hasnain\\Documents\\neuromorphic_${timestamp}.xlsx`;
      await exportSessionXlsx(savePath);
    } catch (err) {
      console.error('XLSX export failed:', err);
    }
  }, []);

  const isConnected = connectionState.status === 'connected';

  return (
    <div className="flex flex-col h-screen bg-gray-100 text-gray-800">
      <ConnectionPanel
        connectionState={connectionState}
        onConnect={connect}
        onDisconnect={disconnect}
        onConfigChange={setConfig}
      />

      <ControlBar
        isConnected={isConnected}
        isRunning={isRunning}
        isAutoRecording={isAutoRecording}
        onStart={handleStart}
        onAbort={handleAbort}
        onClear={handleClear}
        onAutoRecordToggle={setIsAutoRecording}
        onExportCsv={handleExportCsv}
        onExportXlsx={handleExportXlsx}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Script Editor + Config */}
        <div className="w-[400px] min-w-[300px] flex flex-col border-r border-gray-200 bg-white">
          {/* Template Selector */}
          <div className="px-3 py-2 border-b border-gray-200">
            <label className="text-xs text-gray-500 block mb-1">Test Template</label>
            <select
              value={selectedTemplate}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:border-blue-500"
            >
              {TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Config Panel */}
          {currentTemplate.paramFields.length > 0 && (
            <div className="px-3 py-2 border-b border-gray-200">
              <ConfigPanel
                params={currentTemplate.paramFields}
                values={paramValues}
                onChange={handleParamChange}
              />
            </div>
          )}

          {/* Script Editor */}
          <div className="flex-1 min-h-0">
            <ScriptEditor value={script} onChange={setScript} />
          </div>
        </div>

        {/* Center Panel: Graph + Table */}
        <div className="flex-1 flex flex-col min-w-0 bg-gray-50">
          <div className="flex items-center gap-1 px-2 pt-2">
            <button
              onClick={() => setShowTable(false)}
              className={`px-3 py-1 text-xs rounded font-medium ${
                !showTable ? 'bg-white text-gray-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Graph
            </button>
            <button
              onClick={() => setShowTable(true)}
              className={`px-3 py-1 text-xs rounded font-medium ${
                showTable ? 'bg-white text-gray-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Data Table
            </button>
          </div>

          <div className="flex-1 p-2 min-h-0">
            {showTable ? <DataTable data={data} /> : <GraphPanel data={data} />}
          </div>
        </div>

        {/* Right Panel: Session History */}
        <SessionHistory
          sessions={sessions}
          onLoadSession={handleLoadSession}
          onDeleteSession={removeSession}
          isOpen={historyOpen}
          onToggle={() => setHistoryOpen(!historyOpen)}
        />
      </div>

      <StatusBar
        connectionStatus={connectionState.status}
        readingCount={data.currents.length}
        errors={errors}
        isRunning={isRunning}
      />
    </div>
  );
}

export default App;
