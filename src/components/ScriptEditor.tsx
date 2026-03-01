import Editor from '@monaco-editor/react';

interface ScriptEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function ScriptEditor({ value, onChange }: ScriptEditorProps) {
  return (
    <div className="h-full border border-lab-accent rounded overflow-hidden">
      <Editor
        height="100%"
        language="lua"
        theme="vs-dark"
        value={value}
        onChange={(v) => onChange(v || '')}
        options={{
          minimap: { enabled: false },
          fontSize: 13,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          wordWrap: 'on',
          lineNumbers: 'on',
          renderLineHighlight: 'line',
          folding: true,
          tabSize: 4,
          insertSpaces: true,
          contextmenu: true,
          suggestOnTriggerCharacters: false,
        }}
      />
    </div>
  );
}
