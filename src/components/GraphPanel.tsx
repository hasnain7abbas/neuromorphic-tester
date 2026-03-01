import { useState, useMemo } from 'react';
import Plot from 'react-plotly.js';
import type { MeasurementData, PlotType } from '../lib/types';

interface GraphPanelProps {
  data: MeasurementData;
}

const tabs: { id: PlotType; label: string }[] = [
  { id: 'iv', label: 'I-V' },
  { id: 'it', label: 'I-t' },
  { id: 'rcycle', label: 'R-Cycle' },
  { id: 'logiv', label: 'Log I-V' },
];

const darkLayout: Partial<Plotly.Layout> = {
  paper_bgcolor: '#0a0a1a',
  plot_bgcolor: '#0a0a1a',
  font: { color: '#eee', size: 11 },
  margin: { t: 40, r: 20, b: 50, l: 70 },
  xaxis: {
    gridcolor: '#1e2a4a',
    zerolinecolor: '#2a3a5a',
  },
  yaxis: {
    gridcolor: '#1e2a4a',
    zerolinecolor: '#2a3a5a',
    exponentformat: 'e',
  },
  hovermode: 'closest',
  dragmode: 'zoom',
};

const plotConfig: Partial<Plotly.Config> = {
  displayModeBar: true,
  scrollZoom: true,
  toImageButtonOptions: { format: 'png', scale: 3, filename: 'neuromorphic_plot' },
  responsive: true,
};

export default function GraphPanel({ data }: GraphPanelProps) {
  const [activeTab, setActiveTab] = useState<PlotType>('iv');

  const plotData = useMemo((): Plotly.Data[] => {
    if (data.currents.length === 0) return [];

    switch (activeTab) {
      case 'iv':
        return [
          {
            x: data.voltages,
            y: data.currents,
            type: 'scattergl',
            mode: 'lines+markers',
            marker: { color: '#4ecca3', size: 3 },
            line: { color: '#4ecca3', width: 1.5 },
            name: 'I-V',
          },
        ];
      case 'it':
        return [
          {
            x: data.currents.map((_, i) => i + 1),
            y: data.currents,
            type: 'scattergl',
            mode: 'lines',
            line: { color: '#e94560', width: 1.5 },
            name: 'Current',
          },
        ];
      case 'rcycle':
        return [
          {
            x: data.resistance.map((_, i) => i + 1),
            y: data.resistance,
            type: 'scattergl',
            mode: 'markers',
            marker: { color: '#f0a500', size: 5 },
            name: 'Resistance',
          },
        ];
      case 'logiv':
        return [
          {
            x: data.voltages,
            y: data.currents.map((c) => Math.abs(c)),
            type: 'scattergl',
            mode: 'lines+markers',
            marker: { color: '#8b5cf6', size: 3 },
            line: { color: '#8b5cf6', width: 1.5 },
            name: '|I| vs V',
          },
        ];
      default:
        return [];
    }
  }, [activeTab, data]);

  const layout = useMemo((): Partial<Plotly.Layout> => {
    const base = { ...darkLayout };
    switch (activeTab) {
      case 'iv':
        return {
          ...base,
          title: { text: 'I-V Characteristic', font: { size: 14 } },
          xaxis: { ...base.xaxis, title: { text: 'Voltage (V)' } },
          yaxis: { ...base.yaxis, title: { text: 'Current (A)' } },
        };
      case 'it':
        return {
          ...base,
          title: { text: 'Current vs Measurement Index', font: { size: 14 } },
          xaxis: { ...base.xaxis, title: { text: 'Measurement #' } },
          yaxis: { ...base.yaxis, title: { text: 'Current (A)' } },
        };
      case 'rcycle':
        return {
          ...base,
          title: { text: 'Resistance vs Cycle', font: { size: 14 } },
          xaxis: { ...base.xaxis, title: { text: 'Reading #' } },
          yaxis: {
            ...base.yaxis,
            title: { text: 'Resistance (Ohm)' },
            type: 'log',
          },
        };
      case 'logiv':
        return {
          ...base,
          title: { text: 'Log |I| vs V', font: { size: 14 } },
          xaxis: { ...base.xaxis, title: { text: 'Voltage (V)' } },
          yaxis: {
            ...base.yaxis,
            title: { text: '|Current| (A)' },
            type: 'log',
          },
        };
      default:
        return base;
    }
  }, [activeTab]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-1 px-1 pt-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1 text-xs rounded-t font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-lab-graph-bg text-lab-success border-t border-x border-lab-accent'
                : 'bg-lab-panel text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex-1 bg-lab-graph-bg rounded-b border border-lab-accent overflow-hidden">
        {data.currents.length > 0 ? (
          <Plot
            data={plotData}
            layout={layout}
            config={plotConfig}
            useResizeHandler
            style={{ width: '100%', height: '100%' }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            No data — run a test to see results
          </div>
        )}
      </div>
    </div>
  );
}
