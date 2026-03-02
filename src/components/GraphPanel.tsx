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

const baseLayout: Partial<Plotly.Layout> = {
  paper_bgcolor: '#ffffff',
  plot_bgcolor: '#fafafa',
  font: { color: '#333', size: 11 },
  margin: { t: 36, r: 16, b: 48, l: 64 },
  xaxis: {
    gridcolor: '#e5e5e5',
    zerolinecolor: '#ccc',
  },
  yaxis: {
    gridcolor: '#e5e5e5',
    zerolinecolor: '#ccc',
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
            marker: { color: '#2563eb', size: 3 },
            line: { color: '#2563eb', width: 1.5 },
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
            line: { color: '#dc2626', width: 1.5 },
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
            marker: { color: '#d97706', size: 5 },
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
            marker: { color: '#7c3aed', size: 3 },
            line: { color: '#7c3aed', width: 1.5 },
            name: '|I| vs V',
          },
        ];
      default:
        return [];
    }
  }, [activeTab, data]);

  const layout = useMemo((): Partial<Plotly.Layout> => {
    switch (activeTab) {
      case 'iv':
        return {
          ...baseLayout,
          title: { text: 'I-V Characteristic', font: { size: 13 } },
          xaxis: { ...baseLayout.xaxis, title: { text: 'Voltage (V)' } },
          yaxis: { ...baseLayout.yaxis, title: { text: 'Current (A)' } },
        };
      case 'it':
        return {
          ...baseLayout,
          title: { text: 'Current vs Measurement Index', font: { size: 13 } },
          xaxis: { ...baseLayout.xaxis, title: { text: 'Measurement #' } },
          yaxis: { ...baseLayout.yaxis, title: { text: 'Current (A)' } },
        };
      case 'rcycle':
        return {
          ...baseLayout,
          title: { text: 'Resistance vs Cycle', font: { size: 13 } },
          xaxis: { ...baseLayout.xaxis, title: { text: 'Reading #' } },
          yaxis: {
            ...baseLayout.yaxis,
            title: { text: 'Resistance (Ohm)' },
            type: 'log',
          },
        };
      case 'logiv':
        return {
          ...baseLayout,
          title: { text: 'Log |I| vs V', font: { size: 13 } },
          xaxis: { ...baseLayout.xaxis, title: { text: 'Voltage (V)' } },
          yaxis: {
            ...baseLayout.yaxis,
            title: { text: '|Current| (A)' },
            type: 'log',
          },
        };
      default:
        return baseLayout;
    }
  }, [activeTab]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-0.5 px-1 pt-1 bg-gray-100">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1 text-xs font-medium rounded-t border-t border-x transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-gray-800 border-gray-300'
                : 'bg-gray-100 text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex-1 bg-white border border-gray-200 rounded-b overflow-hidden">
        {data.currents.length > 0 ? (
          <Plot
            data={plotData}
            layout={layout}
            config={plotConfig}
            useResizeHandler
            style={{ width: '100%', height: '100%' }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            No data -- run a test to see results
          </div>
        )}
      </div>
    </div>
  );
}
