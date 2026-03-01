import type { TemplateParam } from '../lib/types';

interface ConfigPanelProps {
  params: TemplateParam[];
  values: Record<string, number>;
  onChange: (key: string, value: number) => void;
}

export default function ConfigPanel({ params, values, onChange }: ConfigPanelProps) {
  if (params.length === 0) return null;

  return (
    <div className="bg-lab-panel border border-lab-accent rounded p-3">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Parameters
      </h3>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {params.map((param) => (
          <div key={param.key} className="flex flex-col gap-0.5">
            <label className="text-xs text-gray-400">
              {param.label}
              {param.unit && (
                <span className="text-gray-500 ml-1">({param.unit})</span>
              )}
            </label>
            <input
              type="number"
              value={values[param.key] ?? param.defaultValue}
              min={param.min}
              max={param.max}
              step={param.step}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) {
                  onChange(param.key, val);
                }
              }}
              className="bg-lab-bg border border-lab-accent rounded px-2 py-1 text-sm text-gray-200 w-full focus:outline-none focus:border-lab-success"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
