import type { MeasurementData } from '../lib/types';

interface DataTableProps {
  data: MeasurementData;
}

function formatSci(val: number): string {
  if (val === 0) return '0.000e+0';
  return val.toExponential(3);
}

export default function DataTable({ data }: DataTableProps) {
  const rowCount = data.currents.length;

  return (
    <div className="flex flex-col h-full border border-lab-accent rounded overflow-hidden">
      <div className="bg-lab-panel px-3 py-1.5 border-b border-lab-accent">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Data Table
        </span>
        <span className="text-xs text-gray-500 ml-2">({rowCount} readings)</span>
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-lab-accent text-gray-300">
            <tr>
              <th className="px-2 py-1.5 text-left font-medium">#</th>
              <th className="px-2 py-1.5 text-left font-medium">Voltage (V)</th>
              <th className="px-2 py-1.5 text-left font-medium">Current (A)</th>
              <th className="px-2 py-1.5 text-left font-medium">Resistance (Ohm)</th>
            </tr>
          </thead>
          <tbody>
            {rowCount === 0 ? (
              <tr>
                <td colSpan={4} className="px-2 py-6 text-center text-gray-500">
                  No data yet
                </td>
              </tr>
            ) : (
              data.currents.map((_, i) => (
                <tr
                  key={i}
                  className="border-b border-lab-accent/30 hover:bg-lab-accent/20"
                >
                  <td className="px-2 py-1 text-gray-400">{i + 1}</td>
                  <td className="px-2 py-1 font-mono">
                    {formatSci(data.voltages[i] ?? 0)}
                  </td>
                  <td className="px-2 py-1 font-mono">
                    {formatSci(data.currents[i])}
                  </td>
                  <td className="px-2 py-1 font-mono">
                    {formatSci(data.resistance[i] ?? 0)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
