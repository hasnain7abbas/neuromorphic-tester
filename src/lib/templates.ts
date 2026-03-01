import type { TemplateDefinition } from './types';

export const TEMPLATES: TemplateDefinition[] = [
  {
    id: 'iv_sweep',
    label: 'I-V Sweep',
    paramFields: [
      { key: 'startV', label: 'Start Voltage', defaultValue: 0, min: -10, max: 10, step: 0.1, unit: 'V' },
      { key: 'stopV', label: 'Stop Voltage', defaultValue: 2, min: -10, max: 10, step: 0.1, unit: 'V' },
      { key: 'stepV', label: 'Step Voltage', defaultValue: 0.01, min: 0.001, max: 1, step: 0.001, unit: 'V' },
      { key: 'compliance', label: 'Compliance', defaultValue: 0.1, min: 0.000001, max: 1, step: 0.001, unit: 'A' },
    ],
    generate: (p) => `smua.reset()
smua.source.func = smua.OUTPUT_DCVOLTS
smua.source.rangev = ${Math.max(Math.abs(p.startV), Math.abs(p.stopV))}
smua.source.limiti = ${p.compliance}
smua.measure.rangei = ${p.compliance}
smua.measure.nplc = 1
smua.nvbuffer1.clear()
smua.nvbuffer1.appendmode = 1
smua.nvbuffer2.clear()
smua.nvbuffer2.appendmode = 1
smua.source.output = smua.OUTPUT_ON

for v = ${p.startV}, ${p.stopV}, ${p.stepV} do
    smua.source.levelv = v
    delay(0.01)
    smua.measure.iv(smua.nvbuffer1, smua.nvbuffer2)
end

smua.source.output = smua.OUTPUT_OFF
printbuffer(1, smua.nvbuffer1.n, smua.nvbuffer1)
print("---SEPARATOR---")
printbuffer(1, smua.nvbuffer2.n, smua.nvbuffer2)`,
  },
  {
    id: 'pulse_sequence',
    label: 'Pulse Sequence (SET/RESET)',
    paramFields: [
      { key: 'setVoltage', label: 'SET Voltage', defaultValue: 1.5, min: 0, max: 10, step: 0.1, unit: 'V' },
      { key: 'resetVoltage', label: 'RESET Voltage', defaultValue: -1.5, min: -10, max: 0, step: 0.1, unit: 'V' },
      { key: 'readVoltage', label: 'Read Voltage', defaultValue: 0.1, min: 0, max: 2, step: 0.01, unit: 'V' },
      { key: 'pulseWidth', label: 'Pulse Width', defaultValue: 0.001, min: 0.0001, max: 1, step: 0.0001, unit: 's' },
      { key: 'compliance', label: 'Compliance', defaultValue: 0.05, min: 0.000001, max: 1, step: 0.001, unit: 'A' },
      { key: 'cycles', label: 'Cycles', defaultValue: 10, min: 1, max: 10000, step: 1, unit: '' },
    ],
    generate: (p) => `smua.reset()
smua.source.func = smua.OUTPUT_DCVOLTS
smua.source.limiti = ${p.compliance}
smua.nvbuffer1.clear()
smua.nvbuffer1.appendmode = 1
smua.nvbuffer2.clear()
smua.nvbuffer2.appendmode = 1
smua.source.output = smua.OUTPUT_ON

for cycle = 1, ${p.cycles} do
    -- SET pulse
    smua.source.levelv = ${p.setVoltage}
    delay(${p.pulseWidth})
    smua.measure.iv(smua.nvbuffer1, smua.nvbuffer2)

    -- READ after SET
    smua.source.levelv = ${p.readVoltage}
    delay(${p.pulseWidth})
    smua.measure.iv(smua.nvbuffer1, smua.nvbuffer2)

    -- RESET pulse
    smua.source.levelv = ${p.resetVoltage}
    delay(${p.pulseWidth})
    smua.measure.iv(smua.nvbuffer1, smua.nvbuffer2)

    -- READ after RESET
    smua.source.levelv = ${p.readVoltage}
    delay(${p.pulseWidth})
    smua.measure.iv(smua.nvbuffer1, smua.nvbuffer2)
end

smua.source.output = smua.OUTPUT_OFF
printbuffer(1, smua.nvbuffer1.n, smua.nvbuffer1)
print("---SEPARATOR---")
printbuffer(1, smua.nvbuffer2.n, smua.nvbuffer2)`,
  },
  {
    id: 'forming',
    label: 'Forming Voltage Sweep',
    paramFields: [
      { key: 'startV', label: 'Start Voltage', defaultValue: 0, min: 0, max: 5, step: 0.1, unit: 'V' },
      { key: 'stopV', label: 'Max Voltage', defaultValue: 5, min: 0, max: 20, step: 0.1, unit: 'V' },
      { key: 'stepV', label: 'Step Voltage', defaultValue: 0.05, min: 0.001, max: 1, step: 0.001, unit: 'V' },
      { key: 'compliance', label: 'Compliance', defaultValue: 0.001, min: 0.000001, max: 1, step: 0.0001, unit: 'A' },
    ],
    generate: (p) => `smua.reset()
smua.source.func = smua.OUTPUT_DCVOLTS
smua.source.rangev = ${p.stopV}
smua.source.limiti = ${p.compliance}
smua.measure.rangei = ${p.compliance}
smua.measure.nplc = 1
smua.nvbuffer1.clear()
smua.nvbuffer1.appendmode = 1
smua.nvbuffer2.clear()
smua.nvbuffer2.appendmode = 1
smua.source.output = smua.OUTPUT_ON

for v = ${p.startV}, ${p.stopV}, ${p.stepV} do
    smua.source.levelv = v
    delay(0.05)
    smua.measure.iv(smua.nvbuffer1, smua.nvbuffer2)
end

smua.source.output = smua.OUTPUT_OFF
printbuffer(1, smua.nvbuffer1.n, smua.nvbuffer1)
print("---SEPARATOR---")
printbuffer(1, smua.nvbuffer2.n, smua.nvbuffer2)`,
  },
  {
    id: 'endurance',
    label: 'Endurance Test',
    paramFields: [
      { key: 'setVoltage', label: 'SET Voltage', defaultValue: 1.5, min: 0, max: 10, step: 0.1, unit: 'V' },
      { key: 'resetVoltage', label: 'RESET Voltage', defaultValue: -1.5, min: -10, max: 0, step: 0.1, unit: 'V' },
      { key: 'readVoltage', label: 'Read Voltage', defaultValue: 0.1, min: 0, max: 2, step: 0.01, unit: 'V' },
      { key: 'pulseWidth', label: 'Pulse Width', defaultValue: 0.001, min: 0.0001, max: 1, step: 0.0001, unit: 's' },
      { key: 'compliance', label: 'Compliance', defaultValue: 0.05, min: 0.000001, max: 1, step: 0.001, unit: 'A' },
      { key: 'cycles', label: 'Cycles', defaultValue: 100, min: 1, max: 100000, step: 1, unit: '' },
    ],
    generate: (p) => `smua.reset()
smua.source.func = smua.OUTPUT_DCVOLTS
smua.source.limiti = ${p.compliance}
smua.nvbuffer1.clear()
smua.nvbuffer1.appendmode = 1
smua.nvbuffer2.clear()
smua.nvbuffer2.appendmode = 1
smua.source.output = smua.OUTPUT_ON

for cycle = 1, ${p.cycles} do
    -- SET
    smua.source.levelv = ${p.setVoltage}
    delay(${p.pulseWidth})
    smua.measure.iv(smua.nvbuffer1, smua.nvbuffer2)

    -- READ after SET (LRS)
    smua.source.levelv = ${p.readVoltage}
    delay(${p.pulseWidth})
    smua.measure.iv(smua.nvbuffer1, smua.nvbuffer2)

    -- RESET
    smua.source.levelv = ${p.resetVoltage}
    delay(${p.pulseWidth})
    smua.measure.iv(smua.nvbuffer1, smua.nvbuffer2)

    -- READ after RESET (HRS)
    smua.source.levelv = ${p.readVoltage}
    delay(${p.pulseWidth})
    smua.measure.iv(smua.nvbuffer1, smua.nvbuffer2)
end

smua.source.output = smua.OUTPUT_OFF
printbuffer(1, smua.nvbuffer1.n, smua.nvbuffer1)
print("---SEPARATOR---")
printbuffer(1, smua.nvbuffer2.n, smua.nvbuffer2)`,
  },
  {
    id: 'retention',
    label: 'Retention Test',
    paramFields: [
      { key: 'readVoltage', label: 'Read Voltage', defaultValue: 0.1, min: 0, max: 2, step: 0.01, unit: 'V' },
      { key: 'interval', label: 'Read Interval', defaultValue: 1, min: 0.1, max: 60, step: 0.1, unit: 's' },
      { key: 'readings', label: 'Total Readings', defaultValue: 100, min: 1, max: 10000, step: 1, unit: '' },
      { key: 'compliance', label: 'Compliance', defaultValue: 0.01, min: 0.000001, max: 1, step: 0.001, unit: 'A' },
    ],
    generate: (p) => `smua.reset()
smua.source.func = smua.OUTPUT_DCVOLTS
smua.source.levelv = ${p.readVoltage}
smua.source.limiti = ${p.compliance}
smua.measure.rangei = ${p.compliance}
smua.nvbuffer1.clear()
smua.nvbuffer1.appendmode = 1
smua.nvbuffer2.clear()
smua.nvbuffer2.appendmode = 1
smua.source.output = smua.OUTPUT_ON

for i = 1, ${p.readings} do
    smua.measure.iv(smua.nvbuffer1, smua.nvbuffer2)
    delay(${p.interval})
end

smua.source.output = smua.OUTPUT_OFF
printbuffer(1, smua.nvbuffer1.n, smua.nvbuffer1)
print("---SEPARATOR---")
printbuffer(1, smua.nvbuffer2.n, smua.nvbuffer2)`,
  },
  {
    id: 'custom',
    label: 'Custom Script',
    paramFields: [],
    generate: () => `-- Write your custom TSP script here
smua.reset()
smua.source.func = smua.OUTPUT_DCVOLTS
smua.source.limiti = 100e-3
smua.nvbuffer1.clear()
smua.nvbuffer1.appendmode = 1
smua.nvbuffer2.clear()
smua.nvbuffer2.appendmode = 1
smua.source.output = smua.OUTPUT_ON

-- Your measurement code here

smua.source.output = smua.OUTPUT_OFF
printbuffer(1, smua.nvbuffer1.n, smua.nvbuffer1)
print("---SEPARATOR---")
printbuffer(1, smua.nvbuffer2.n, smua.nvbuffer2)`,
  },
];
