import { useState, useEffect, useCallback } from 'react';
import { listen } from '@tauri-apps/api/event';
import type { MeasurementData } from '../lib/types';

const emptyData: MeasurementData = {
  voltages: [],
  currents: [],
  timestamps: [],
  resistance: [],
};

export function useDataStream() {
  const [data, setData] = useState<MeasurementData>(emptyData);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const unlistenData = listen<{
      currents: number[];
      voltages: number[];
      timestamps: string[];
    }>('data-update', (event) => {
      const { currents, voltages } = event.payload;
      setData((prev) => {
        const newResistance = voltages.map((v, i) =>
          currents[i] !== 0 ? Math.abs(v / currents[i]) : 0
        );
        return {
          voltages: [...prev.voltages, ...voltages],
          currents: [...prev.currents, ...currents],
          timestamps: [
            ...prev.timestamps,
            ...currents.map(() => Date.now()),
          ],
          resistance: [...prev.resistance, ...newResistance],
        };
      });
    });

    const unlistenComplete = listen('test-complete', () => {
      setIsComplete(true);
    });

    return () => {
      unlistenData.then((fn) => fn());
      unlistenComplete.then((fn) => fn());
    };
  }, []);

  const clearData = useCallback(() => {
    setData(emptyData);
    setIsComplete(false);
  }, []);

  const loadData = useCallback(
    (voltages: number[], currents: number[], resistance: number[]) => {
      setData({
        voltages,
        currents,
        timestamps: voltages.map(() => Date.now()),
        resistance,
      });
      setIsComplete(true);
    },
    []
  );

  return { data, isComplete, clearData, loadData };
}
