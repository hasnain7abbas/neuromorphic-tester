import type { TemplateDefinition } from './types';

export const TEMPLATES: TemplateDefinition[] = [
  // ─────────────────────────────────────────────────────────────────────────
  // SYNAPTIC PLASTICITY — BASIC
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'epsc',
    label: 'EPSC (Excitatory Post-Synaptic Current)',
    paramFields: [
      { key: 'writeV', label: 'Write Voltage', defaultValue: 8, min: 0, max: 20, step: 0.1, unit: 'V' },
      { key: 'readV', label: 'Read Voltage', defaultValue: 1.5, min: 0, max: 5, step: 0.1, unit: 'V' },
      { key: 'pulseWidth', label: 'Pulse Width', defaultValue: 0.1, min: 0.001, max: 10, step: 0.01, unit: 's' },
      { key: 'decayPoints', label: 'Decay Points', defaultValue: 200, min: 10, max: 1000, step: 10, unit: '' },
      { key: 'decayInterval', label: 'Decay Interval', defaultValue: 0.1, min: 0.01, max: 1, step: 0.01, unit: 's' },
      { key: 'compliance', label: 'Compliance', defaultValue: 0.001, min: 0.000001, max: 1, step: 0.001, unit: 'A' },
    ],
    generate: (p) => `smua.reset()
smua.source.func = smua.OUTPUT_DCVOLTS
smua.source.output = smua.OUTPUT_ON
smua.measure.autorangei = smua.AUTORANGE_OFF
smua.measure.rangei = 1e-4
smua.source.limiti = ${p.compliance}

smua.nvbuffer1.clear()
smua.nvbuffer1.appendmode = 1
smua.nvbuffer2.clear()
smua.nvbuffer2.appendmode = 1

-- BASELINE (2 seconds at read voltage)
smua.source.levelv = ${p.readV}
for i = 1, 20 do
    smua.measure.iv(smua.nvbuffer1, smua.nvbuffer2)
    delay(0.1)
end

-- STIMULUS PULSE
smua.source.levelv = ${p.writeV}
delay(${p.pulseWidth})
smua.measure.iv(smua.nvbuffer1, smua.nvbuffer2)

-- POST-PULSE DECAY
smua.source.levelv = ${p.readV}
for i = 1, ${p.decayPoints} do
    smua.measure.iv(smua.nvbuffer1, smua.nvbuffer2)
    delay(${p.decayInterval})
end

smua.source.output = smua.OUTPUT_OFF
printbuffer(1, smua.nvbuffer1.n, smua.nvbuffer1)
print("---SEPARATOR---")
printbuffer(1, smua.nvbuffer2.n, smua.nvbuffer2)`,
  },

  {
    id: 'ppf',
    label: 'PPF (Paired-Pulse Facilitation)',
    paramFields: [
      { key: 'writeV', label: 'Write Voltage', defaultValue: 8, min: 0, max: 20, step: 0.1, unit: 'V' },
      { key: 'readV', label: 'Read Voltage', defaultValue: 1.5, min: 0, max: 5, step: 0.1, unit: 'V' },
      { key: 'pulseWidth', label: 'Pulse Width', defaultValue: 0.1, min: 0.001, max: 10, step: 0.01, unit: 's' },
      { key: 'deltaT', label: 'Inter-Pulse Gap', defaultValue: 0.05, min: 0.001, max: 5, step: 0.01, unit: 's' },
      { key: 'decayTime', label: 'Decay Duration', defaultValue: 5, min: 1, max: 60, step: 1, unit: 's' },
      { key: 'compliance', label: 'Compliance', defaultValue: 0.001, min: 0.000001, max: 1, step: 0.001, unit: 'A' },
    ],
    generate: (p) => `smua.reset()
smua.source.func = smua.OUTPUT_DCVOLTS
smua.source.output = smua.OUTPUT_ON
smua.measure.autorangei = smua.AUTORANGE_OFF
smua.measure.rangei = 1e-4
smua.source.limiti = ${p.compliance}

smua.nvbuffer1.clear()
smua.nvbuffer1.appendmode = 1
smua.nvbuffer2.clear()
smua.nvbuffer2.appendmode = 1

-- BASELINE (2 seconds)
smua.source.levelv = ${p.readV}
for i = 1, 40 do
    smua.measure.iv(smua.nvbuffer1, smua.nvbuffer2)
    delay(0.05)
end

-- PULSE 1
smua.source.levelv = ${p.writeV}
delay(${p.pulseWidth})
smua.measure.iv(smua.nvbuffer1, smua.nvbuffer2)

-- GAP between pulses
smua.source.levelv = ${p.readV}
delay(${p.deltaT})

-- PULSE 2
smua.source.levelv = ${p.writeV}
delay(${p.pulseWidth})
smua.measure.iv(smua.nvbuffer1, smua.nvbuffer2)

-- DECAY
smua.source.levelv = ${p.readV}
decayPoints = ${p.decayTime} / 0.1
for i = 1, decayPoints do
    smua.measure.iv(smua.nvbuffer1, smua.nvbuffer2)
    delay(0.1)
end

smua.source.output = smua.OUTPUT_OFF
printbuffer(1, smua.nvbuffer1.n, smua.nvbuffer1)
print("---SEPARATOR---")
printbuffer(1, smua.nvbuffer2.n, smua.nvbuffer2)`,
  },

  {
    id: 'ppd',
    label: 'PPD (Paired-Pulse Depression)',
    paramFields: [
      { key: 'writeV', label: 'Write Voltage', defaultValue: -8, min: -20, max: 0, step: 0.1, unit: 'V' },
      { key: 'readV', label: 'Read Voltage', defaultValue: 1.5, min: 0, max: 5, step: 0.1, unit: 'V' },
      { key: 'pulseWidth', label: 'Pulse Width', defaultValue: 0.1, min: 0.001, max: 10, step: 0.01, unit: 's' },
      { key: 'deltaT', label: 'Inter-Pulse Gap', defaultValue: 0.05, min: 0.001, max: 5, step: 0.01, unit: 's' },
      { key: 'decayTime', label: 'Decay Duration', defaultValue: 5, min: 1, max: 60, step: 1, unit: 's' },
      { key: 'compliance', label: 'Compliance', defaultValue: 0.001, min: 0.000001, max: 1, step: 0.001, unit: 'A' },
    ],
    generate: (p) => `smua.reset()
smua.source.func = smua.OUTPUT_DCVOLTS
smua.source.output = smua.OUTPUT_ON
smua.measure.autorangei = smua.AUTORANGE_OFF
smua.measure.rangei = 1e-4
smua.source.limiti = ${p.compliance}

smua.nvbuffer1.clear()
smua.nvbuffer1.appendmode = 1
smua.nvbuffer2.clear()
smua.nvbuffer2.appendmode = 1

-- BASELINE
smua.source.levelv = ${p.readV}
for i = 1, 40 do
    smua.measure.iv(smua.nvbuffer1, smua.nvbuffer2)
    delay(0.05)
end

-- PULSE 1 (negative)
smua.source.levelv = ${p.writeV}
delay(${p.pulseWidth})
smua.measure.iv(smua.nvbuffer1, smua.nvbuffer2)

-- GAP
smua.source.levelv = ${p.readV}
delay(${p.deltaT})

-- PULSE 2 (negative)
smua.source.levelv = ${p.writeV}
delay(${p.pulseWidth})
smua.measure.iv(smua.nvbuffer1, smua.nvbuffer2)

-- DECAY
smua.source.levelv = ${p.readV}
decayPoints = ${p.decayTime} / 0.1
for i = 1, decayPoints do
    smua.measure.iv(smua.nvbuffer1, smua.nvbuffer2)
    delay(0.1)
end

smua.source.output = smua.OUTPUT_OFF
printbuffer(1, smua.nvbuffer1.n, smua.nvbuffer1)
print("---SEPARATOR---")
printbuffer(1, smua.nvbuffer2.n, smua.nvbuffer2)`,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SYNAPTIC PLASTICITY — DURATION / RATE DEPENDENT
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'sddp',
    label: 'SDDP (Spike-Duration Dependent Plasticity)',
    paramFields: [
      { key: 'writeV', label: 'Write Voltage', defaultValue: 8, min: 0, max: 20, step: 0.1, unit: 'V' },
      { key: 'readV', label: 'Read Voltage', defaultValue: 1.5, min: 0, max: 5, step: 0.1, unit: 'V' },
      { key: 'pulseWidth', label: 'Pulse Width', defaultValue: 0.1, min: 0.001, max: 10, step: 0.01, unit: 's' },
      { key: 'numPulses', label: 'Number of Pulses', defaultValue: 50, min: 1, max: 500, step: 1, unit: '' },
      { key: 'compliance', label: 'Compliance', defaultValue: 0.001, min: 0.000001, max: 1, step: 0.001, unit: 'A' },
    ],
    generate: (p) => `smua.reset()
smua.source.func = smua.OUTPUT_DCVOLTS
smua.source.output = smua.OUTPUT_ON
smua.measure.autorangei = smua.AUTORANGE_OFF
smua.measure.rangei = 1e-4
smua.source.limiti = ${p.compliance}

smua.nvbuffer1.clear()
smua.nvbuffer1.appendmode = 1
smua.nvbuffer2.clear()
smua.nvbuffer2.appendmode = 1

-- BASELINE
smua.source.levelv = ${p.readV}
delay(0.5)

for i = 1, ${p.numPulses} do
    -- WRITE PULSE
    smua.source.levelv = ${p.writeV}
    delay(${p.pulseWidth})

    -- READ AND MEASURE
    smua.source.levelv = ${p.readV}
    delay(0.05)
    smua.measure.iv(smua.nvbuffer1, smua.nvbuffer2)
end

smua.source.output = smua.OUTPUT_OFF
printbuffer(1, smua.nvbuffer1.n, smua.nvbuffer1)
print("---SEPARATOR---")
printbuffer(1, smua.nvbuffer2.n, smua.nvbuffer2)`,
  },

  {
    id: 'sddp_decay',
    label: 'SDDP Decay (Single Pulse + Decay)',
    paramFields: [
      { key: 'writeV', label: 'Write Voltage', defaultValue: 8, min: 0, max: 20, step: 0.1, unit: 'V' },
      { key: 'readV', label: 'Read Voltage', defaultValue: 1.5, min: 0, max: 5, step: 0.1, unit: 'V' },
      { key: 'pulseWidth', label: 'Pulse Width', defaultValue: 0.1, min: 0.001, max: 10, step: 0.01, unit: 's' },
      { key: 'decayPoints', label: 'Decay Points', defaultValue: 200, min: 10, max: 1000, step: 10, unit: '' },
      { key: 'compliance', label: 'Compliance', defaultValue: 0.001, min: 0.000001, max: 1, step: 0.001, unit: 'A' },
    ],
    generate: (p) => `smua.reset()
smua.source.func = smua.OUTPUT_DCVOLTS
smua.source.output = smua.OUTPUT_ON
smua.measure.autorangei = smua.AUTORANGE_OFF
smua.measure.rangei = 1e-4
smua.source.limiti = ${p.compliance}

smua.nvbuffer1.clear()
smua.nvbuffer1.appendmode = 1
smua.nvbuffer2.clear()
smua.nvbuffer2.appendmode = 1

-- BASELINE
smua.source.levelv = ${p.readV}
for i = 1, 20 do
    smua.measure.iv(smua.nvbuffer1, smua.nvbuffer2)
    delay(0.1)
end

-- WRITE PULSE
smua.source.levelv = ${p.writeV}
delay(${p.pulseWidth})

-- DECAY: measure at read voltage
smua.source.levelv = ${p.readV}
for i = 1, ${p.decayPoints} do
    smua.measure.iv(smua.nvbuffer1, smua.nvbuffer2)
    delay(0.1)
end

smua.source.output = smua.OUTPUT_OFF
printbuffer(1, smua.nvbuffer1.n, smua.nvbuffer1)
print("---SEPARATOR---")
printbuffer(1, smua.nvbuffer2.n, smua.nvbuffer2)`,
  },

  {
    id: 'srdp',
    label: 'SRDP (Spike-Rate Dependent Plasticity)',
    paramFields: [
      { key: 'writeV', label: 'Write Voltage', defaultValue: 8, min: 0, max: 20, step: 0.1, unit: 'V' },
      { key: 'readV', label: 'Read Voltage', defaultValue: 1.5, min: 0, max: 5, step: 0.1, unit: 'V' },
      { key: 'pulseWidth', label: 'Pulse Width', defaultValue: 0.1, min: 0.001, max: 10, step: 0.01, unit: 's' },
      { key: 'pulseCount', label: 'Pulse Count', defaultValue: 50, min: 1, max: 500, step: 1, unit: '' },
      { key: 'frequency', label: 'Frequency', defaultValue: 2.0, min: 0.1, max: 100, step: 0.1, unit: 'Hz' },
      { key: 'compliance', label: 'Compliance', defaultValue: 0.001, min: 0.000001, max: 1, step: 0.001, unit: 'A' },
    ],
    generate: (p) => `smua.reset()
smua.source.func = smua.OUTPUT_DCVOLTS
smua.source.output = smua.OUTPUT_ON
smua.measure.autorangei = smua.AUTORANGE_OFF
smua.measure.rangei = 1e-4
smua.source.limiti = ${p.compliance}

smua.nvbuffer1.clear()
smua.nvbuffer1.appendmode = 1
smua.nvbuffer2.clear()
smua.nvbuffer2.appendmode = 1

-- Calculate gap from frequency
period = 1 / ${p.frequency}
read_gap = period - ${p.pulseWidth}
if read_gap < 0.02 then read_gap = 0.02 end

-- BASELINE
smua.source.levelv = ${p.readV}
delay(2)

-- PULSE TRAIN
for i = 1, ${p.pulseCount} do
    -- WRITE
    smua.source.levelv = ${p.writeV}
    delay(${p.pulseWidth})

    -- READ
    smua.source.levelv = ${p.readV}
    delay(read_gap)
    smua.measure.iv(smua.nvbuffer1, smua.nvbuffer2)
end

smua.source.output = smua.OUTPUT_OFF
printbuffer(1, smua.nvbuffer1.n, smua.nvbuffer1)
print("---SEPARATOR---")
printbuffer(1, smua.nvbuffer2.n, smua.nvbuffer2)`,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SYNAPTIC PLASTICITY — TIMING / NUMBER DEPENDENT
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'stdp',
    label: 'STDP (Spike-Timing Dependent Plasticity)',
    paramFields: [
      { key: 'posV', label: 'Positive Voltage', defaultValue: 8, min: 0, max: 20, step: 0.1, unit: 'V' },
      { key: 'negV', label: 'Negative Voltage', defaultValue: -8, min: -20, max: 0, step: 0.1, unit: 'V' },
      { key: 'readV', label: 'Read Voltage', defaultValue: 1.5, min: 0, max: 5, step: 0.1, unit: 'V' },
      { key: 'pulseWidth', label: 'Pulse Width', defaultValue: 0.1, min: 0.001, max: 10, step: 0.01, unit: 's' },
      { key: 'deltaT', label: 'Delta T', defaultValue: 0.05, min: 0.005, max: 5, step: 0.01, unit: 's' },
      { key: 'orderMode', label: 'Order (1=Pre-Post, 2=Post-Pre)', defaultValue: 1, min: 1, max: 2, step: 1, unit: '' },
    ],
    generate: (p) => `smua.reset()
smua.source.func = smua.OUTPUT_DCVOLTS
smua.source.output = smua.OUTPUT_ON
smua.measure.autorangei = smua.AUTORANGE_OFF
smua.measure.rangei = 1e-4
smua.source.limiti = 1e-3

smua.nvbuffer1.clear()
smua.nvbuffer1.appendmode = 1
smua.nvbuffer2.clear()
smua.nvbuffer2.appendmode = 1

-- MEASURE INITIAL WEIGHT (10 readings at read voltage)
smua.source.levelv = ${p.readV}
delay(1)
for i = 1, 10 do
    smua.measure.iv(smua.nvbuffer1, smua.nvbuffer2)
    delay(0.05)
end

-- APPLY PULSE PAIR
order_mode = ${p.orderMode}
if order_mode == 1 then
    -- POSITIVE dt: Pre then Post (potentiation)
    smua.source.levelv = ${p.posV}
    delay(${p.pulseWidth})
    smua.source.levelv = 0
    delay(${p.deltaT})
    smua.source.levelv = ${p.negV}
    delay(${p.pulseWidth})
else
    -- NEGATIVE dt: Post then Pre (depression)
    smua.source.levelv = ${p.negV}
    delay(${p.pulseWidth})
    smua.source.levelv = 0
    delay(${p.deltaT})
    smua.source.levelv = ${p.posV}
    delay(${p.pulseWidth})
end

-- MEASURE FINAL WEIGHT (10 readings)
smua.source.levelv = ${p.readV}
delay(0.5)
for i = 1, 10 do
    smua.measure.iv(smua.nvbuffer1, smua.nvbuffer2)
    delay(0.05)
end

smua.source.output = smua.OUTPUT_OFF
printbuffer(1, smua.nvbuffer1.n, smua.nvbuffer1)
print("---SEPARATOR---")
printbuffer(1, smua.nvbuffer2.n, smua.nvbuffer2)`,
  },

  {
    id: 'sndp',
    label: 'SNDP (Spike-Number Dependent Plasticity)',
    paramFields: [
      { key: 'writeV', label: 'Write Voltage', defaultValue: 8, min: 0, max: 20, step: 0.1, unit: 'V' },
      { key: 'readV', label: 'Read Voltage', defaultValue: 1.5, min: 0, max: 5, step: 0.1, unit: 'V' },
      { key: 'pulseWidth', label: 'Pulse Width', defaultValue: 0.1, min: 0.001, max: 10, step: 0.01, unit: 's' },
      { key: 'numPulses', label: 'Number of Pulses', defaultValue: 1, min: 1, max: 200, step: 1, unit: '' },
      { key: 'decayTime', label: 'Decay Duration', defaultValue: 30, min: 1, max: 120, step: 1, unit: 's' },
      { key: 'compliance', label: 'Compliance', defaultValue: 0.001, min: 0.000001, max: 1, step: 0.001, unit: 'A' },
    ],
    generate: (p) => `smua.reset()
smua.source.func = smua.OUTPUT_DCVOLTS
smua.source.output = smua.OUTPUT_ON
smua.measure.autorangei = smua.AUTORANGE_OFF
smua.measure.rangei = 1e-4
smua.source.limiti = ${p.compliance}

smua.nvbuffer1.clear()
smua.nvbuffer1.appendmode = 1
smua.nvbuffer2.clear()
smua.nvbuffer2.appendmode = 1

-- BASELINE: measure 20 points
smua.source.levelv = ${p.readV}
delay(1)
for i = 1, 20 do
    smua.measure.iv(smua.nvbuffer1, smua.nvbuffer2)
    delay(0.1)
end

-- PULSE TRAIN
for i = 1, ${p.numPulses} do
    smua.source.levelv = ${p.writeV}
    delay(${p.pulseWidth})
    if i < ${p.numPulses} then
        smua.source.levelv = ${p.readV}
        delay(0.1)
    end
end

-- POST-PULSE DECAY
smua.source.levelv = ${p.readV}
decayPoints = ${p.decayTime} / 0.1
for i = 1, decayPoints do
    smua.measure.iv(smua.nvbuffer1, smua.nvbuffer2)
    delay(0.1)
end

smua.source.output = smua.OUTPUT_OFF
printbuffer(1, smua.nvbuffer1.n, smua.nvbuffer1)
print("---SEPARATOR---")
printbuffer(1, smua.nvbuffer2.n, smua.nvbuffer2)`,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // LONG-TERM PLASTICITY
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'ltp_ltd',
    label: 'LTP/LTD (Potentiation + Depression)',
    paramFields: [
      { key: 'posV', label: 'Potentiation Voltage', defaultValue: 8, min: 0, max: 20, step: 0.1, unit: 'V' },
      { key: 'negV', label: 'Depression Voltage', defaultValue: -8, min: -20, max: 0, step: 0.1, unit: 'V' },
      { key: 'readV', label: 'Read Voltage', defaultValue: 1.5, min: 0, max: 5, step: 0.1, unit: 'V' },
      { key: 'pulseWidth', label: 'Pulse Width', defaultValue: 0.1, min: 0.001, max: 10, step: 0.01, unit: 's' },
      { key: 'pulsesPerDir', label: 'Pulses Per Direction', defaultValue: 50, min: 10, max: 500, step: 10, unit: '' },
      { key: 'cycles', label: 'Cycles', defaultValue: 5, min: 1, max: 100, step: 1, unit: '' },
    ],
    generate: (p) => `smua.reset()
smua.source.func = smua.OUTPUT_DCVOLTS
smua.source.output = smua.OUTPUT_ON
smua.measure.autorangei = smua.AUTORANGE_OFF
smua.measure.rangei = 1e-4
smua.source.limiti = 1e-3

smua.nvbuffer1.clear()
smua.nvbuffer1.appendmode = 1
smua.nvbuffer2.clear()
smua.nvbuffer2.appendmode = 1

-- BASELINE
smua.source.levelv = ${p.readV}
delay(1)

for k = 1, ${p.cycles} do
    -- POTENTIATION: positive pulses
    for i = 1, ${p.pulsesPerDir} do
        smua.source.levelv = ${p.posV}
        delay(${p.pulseWidth})
        smua.source.levelv = ${p.readV}
        delay(0.05)
        smua.measure.iv(smua.nvbuffer1, smua.nvbuffer2)
    end

    -- DEPRESSION: negative pulses
    for i = 1, ${p.pulsesPerDir} do
        smua.source.levelv = ${p.negV}
        delay(${p.pulseWidth})
        smua.source.levelv = ${p.readV}
        delay(0.05)
        smua.measure.iv(smua.nvbuffer1, smua.nvbuffer2)
    end
end

smua.source.output = smua.OUTPUT_OFF
printbuffer(1, smua.nvbuffer1.n, smua.nvbuffer1)
print("---SEPARATOR---")
printbuffer(1, smua.nvbuffer2.n, smua.nvbuffer2)`,
  },

  {
    id: 'learning_forgetting',
    label: 'Learning / Forgetting Curves',
    paramFields: [
      { key: 'writeV', label: 'Write Voltage', defaultValue: 8, min: 0, max: 20, step: 0.1, unit: 'V' },
      { key: 'readV', label: 'Read Voltage', defaultValue: 1.5, min: 0, max: 5, step: 0.1, unit: 'V' },
      { key: 'pulseWidth', label: 'Pulse Width', defaultValue: 0.1, min: 0.001, max: 10, step: 0.01, unit: 's' },
      { key: 'numPulses', label: 'Training Pulses', defaultValue: 10, min: 1, max: 200, step: 1, unit: '' },
      { key: 'monitorTime', label: 'Monitor Duration', defaultValue: 60, min: 10, max: 600, step: 10, unit: 's' },
      { key: 'compliance', label: 'Compliance', defaultValue: 0.001, min: 0.000001, max: 1, step: 0.001, unit: 'A' },
    ],
    generate: (p) => `smua.reset()
smua.source.func = smua.OUTPUT_DCVOLTS
smua.source.output = smua.OUTPUT_ON
smua.measure.autorangei = smua.AUTORANGE_OFF
smua.measure.rangei = 1e-4
smua.source.limiti = ${p.compliance}

smua.nvbuffer1.clear()
smua.nvbuffer1.appendmode = 1
smua.nvbuffer2.clear()
smua.nvbuffer2.appendmode = 1

-- PRE-TRAINING BASELINE (10 reference points)
smua.source.levelv = ${p.readV}
delay(1)
for i = 1, 10 do
    smua.measure.iv(smua.nvbuffer1, smua.nvbuffer2)
    delay(0.1)
end

-- TRAINING: apply write pulses
for i = 1, ${p.numPulses} do
    smua.source.levelv = ${p.writeV}
    delay(${p.pulseWidth})
    if i < ${p.numPulses} then
        smua.source.levelv = ${p.readV}
        delay(0.1)
    end
end

-- FORGETTING: monitor decay at read voltage
smua.source.levelv = ${p.readV}
monitorPoints = ${p.monitorTime} / 0.5
for i = 1, monitorPoints do
    smua.measure.iv(smua.nvbuffer1, smua.nvbuffer2)
    delay(0.5)
end

smua.source.output = smua.OUTPUT_OFF
printbuffer(1, smua.nvbuffer1.n, smua.nvbuffer1)
print("---SEPARATOR---")
printbuffer(1, smua.nvbuffer2.n, smua.nvbuffer2)`,
  },

  {
    id: 'stp_to_ltp',
    label: 'STP to LTP Transition',
    paramFields: [
      { key: 'writeV', label: 'Write Voltage', defaultValue: 8, min: 0, max: 20, step: 0.1, unit: 'V' },
      { key: 'readV', label: 'Read Voltage', defaultValue: 1.5, min: 0, max: 5, step: 0.1, unit: 'V' },
      { key: 'pulseWidth', label: 'Pulse Width', defaultValue: 0.1, min: 0.001, max: 10, step: 0.01, unit: 's' },
      { key: 'pulsesPerSet', label: 'Pulses Per Set', defaultValue: 10, min: 1, max: 100, step: 1, unit: '' },
      { key: 'numSets', label: 'Number of Sets', defaultValue: 10, min: 1, max: 50, step: 1, unit: '' },
      { key: 'decayWait', label: 'Decay Wait Between Sets', defaultValue: 30, min: 5, max: 120, step: 5, unit: 's' },
    ],
    generate: (p) => `smua.reset()
smua.source.func = smua.OUTPUT_DCVOLTS
smua.source.output = smua.OUTPUT_ON
smua.measure.autorangei = smua.AUTORANGE_OFF
smua.measure.rangei = 1e-4
smua.source.limiti = 1e-3

smua.nvbuffer1.clear()
smua.nvbuffer1.appendmode = 1
smua.nvbuffer2.clear()
smua.nvbuffer2.appendmode = 1

-- BASELINE
smua.source.levelv = ${p.readV}
delay(2)
for i = 1, 10 do
    smua.measure.iv(smua.nvbuffer1, smua.nvbuffer2)
    delay(0.1)
end

for s = 1, ${p.numSets} do
    -- APPLY PULSE SET
    for i = 1, ${p.pulsesPerSet} do
        smua.source.levelv = ${p.writeV}
        delay(${p.pulseWidth})
        smua.source.levelv = ${p.readV}
        delay(0.1)
    end

    -- MEASURE IMMEDIATELY after pulses
    delay(0.05)
    for i = 1, 5 do
        smua.measure.iv(smua.nvbuffer1, smua.nvbuffer2)
        delay(0.02)
    end

    -- WAIT for STP to decay
    delay(${p.decayWait})

    -- MEASURE RESIDUAL (the LTP component)
    for i = 1, 5 do
        smua.measure.iv(smua.nvbuffer1, smua.nvbuffer2)
        delay(0.02)
    end
end

smua.source.output = smua.OUTPUT_OFF
printbuffer(1, smua.nvbuffer1.n, smua.nvbuffer1)
print("---SEPARATOR---")
printbuffer(1, smua.nvbuffer2.n, smua.nvbuffer2)`,
  },

  {
    id: 'multi_level',
    label: 'Multi-Level Conductance States',
    paramFields: [
      { key: 'writeV', label: 'Write Voltage', defaultValue: 8, min: 0, max: 20, step: 0.1, unit: 'V' },
      { key: 'readV', label: 'Read Voltage', defaultValue: 1.5, min: 0, max: 5, step: 0.1, unit: 'V' },
      { key: 'pulseWidth', label: 'Pulse Width', defaultValue: 0.1, min: 0.001, max: 10, step: 0.01, unit: 's' },
      { key: 'pulsesPerStep', label: 'Pulses Per Step', defaultValue: 5, min: 1, max: 50, step: 1, unit: '' },
      { key: 'numSteps', label: 'Number of Steps', defaultValue: 20, min: 2, max: 100, step: 1, unit: '' },
      { key: 'compliance', label: 'Compliance', defaultValue: 0.001, min: 0.000001, max: 1, step: 0.001, unit: 'A' },
    ],
    generate: (p) => `smua.reset()
smua.source.func = smua.OUTPUT_DCVOLTS
smua.source.output = smua.OUTPUT_ON
smua.measure.autorangei = smua.AUTORANGE_OFF
smua.measure.rangei = 1e-4
smua.source.limiti = ${p.compliance}

smua.nvbuffer1.clear()
smua.nvbuffer1.appendmode = 1
smua.nvbuffer2.clear()
smua.nvbuffer2.appendmode = 1

smua.source.levelv = ${p.readV}
delay(1)

for s = 1, ${p.numSteps} do
    -- APPLY PULSE SET
    for i = 1, ${p.pulsesPerStep} do
        smua.source.levelv = ${p.writeV}
        delay(${p.pulseWidth})
        smua.source.levelv = ${p.readV}
        delay(0.1)
    end

    -- SETTLE AND MEASURE (average 10 readings)
    delay(0.2)
    for i = 1, 10 do
        smua.measure.iv(smua.nvbuffer1, smua.nvbuffer2)
        delay(0.05)
    end
end

smua.source.output = smua.OUTPUT_OFF
printbuffer(1, smua.nvbuffer1.n, smua.nvbuffer1)
print("---SEPARATOR---")
printbuffer(1, smua.nvbuffer2.n, smua.nvbuffer2)`,
  },

  {
    id: 'linearity',
    label: 'LTP/LTD Linearity Test',
    paramFields: [
      { key: 'posV', label: 'Potentiation Voltage', defaultValue: 8, min: 0, max: 20, step: 0.1, unit: 'V' },
      { key: 'negV', label: 'Depression Voltage', defaultValue: -8, min: -20, max: 0, step: 0.1, unit: 'V' },
      { key: 'readV', label: 'Read Voltage', defaultValue: 1.5, min: 0, max: 5, step: 0.1, unit: 'V' },
      { key: 'pulseWidth', label: 'Pulse Width', defaultValue: 0.1, min: 0.001, max: 10, step: 0.01, unit: 's' },
      { key: 'numPulses', label: 'Pulses Per Direction', defaultValue: 50, min: 10, max: 500, step: 10, unit: '' },
      { key: 'numCycles', label: 'Cycles', defaultValue: 3, min: 1, max: 20, step: 1, unit: '' },
    ],
    generate: (p) => `smua.reset()
smua.source.func = smua.OUTPUT_DCVOLTS
smua.source.output = smua.OUTPUT_ON
smua.measure.autorangei = smua.AUTORANGE_OFF
smua.measure.rangei = 1e-4
smua.source.limiti = 1e-3

smua.nvbuffer1.clear()
smua.nvbuffer1.appendmode = 1
smua.nvbuffer2.clear()
smua.nvbuffer2.appendmode = 1

smua.source.levelv = ${p.readV}
delay(1)

for k = 1, ${p.numCycles} do
    -- POTENTIATION
    for i = 1, ${p.numPulses} do
        smua.source.levelv = ${p.posV}
        delay(${p.pulseWidth})
        smua.source.levelv = ${p.readV}
        delay(0.05)
        smua.measure.iv(smua.nvbuffer1, smua.nvbuffer2)
    end

    -- DEPRESSION
    for i = 1, ${p.numPulses} do
        smua.source.levelv = ${p.negV}
        delay(${p.pulseWidth})
        smua.source.levelv = ${p.readV}
        delay(0.05)
        smua.measure.iv(smua.nvbuffer1, smua.nvbuffer2)
    end
end

smua.source.output = smua.OUTPUT_OFF
printbuffer(1, smua.nvbuffer1.n, smua.nvbuffer1)
print("---SEPARATOR---")
printbuffer(1, smua.nvbuffer2.n, smua.nvbuffer2)`,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // DEVICE CHARACTERIZATION
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'bipolar_iv',
    label: 'Bipolar I-V Sweep',
    paramFields: [
      { key: 'maxV', label: 'Max Voltage', defaultValue: 10, min: 1, max: 20, step: 0.5, unit: 'V' },
      { key: 'stepV', label: 'Step Voltage', defaultValue: 0.2, min: 0.01, max: 1, step: 0.01, unit: 'V' },
      { key: 'cycles', label: 'Cycles', defaultValue: 5, min: 1, max: 100, step: 1, unit: '' },
      { key: 'compliance', label: 'Compliance', defaultValue: 0.01, min: 0.000001, max: 1, step: 0.001, unit: 'A' },
    ],
    generate: (p) => `smua.reset()
smua.measure.nplc = 1
smua.measure.filter.count = 5
smua.measure.filter.enable = smua.FILTER_ON
smua.measure.filter.type = smua.FILTER_REPEAT_AVG
smua.measure.sense = smua.SENSE_LOCAL
smua.source.func = smua.OUTPUT_DCVOLTS
smua.source.limiti = ${p.compliance}
smua.source.rangev = ${p.maxV}

smua.nvbuffer1.clear()
smua.nvbuffer1.appendmode = 1
smua.nvbuffer2.clear()
smua.nvbuffer2.appendmode = 1
smua.source.output = smua.OUTPUT_ON

for cycle = 1, ${p.cycles} do
    -- 0 -> +max
    for v = 0, ${p.maxV}, ${p.stepV} do
        smua.source.levelv = v
        delay(0.01)
        smua.measure.iv(smua.nvbuffer1, smua.nvbuffer2)
    end
    -- +max -> -max
    for v = ${p.maxV}, -${p.maxV}, -${p.stepV} do
        smua.source.levelv = v
        delay(0.01)
        smua.measure.iv(smua.nvbuffer1, smua.nvbuffer2)
    end
    -- -max -> 0
    for v = -${p.maxV}, 0, ${p.stepV} do
        smua.source.levelv = v
        delay(0.01)
        smua.measure.iv(smua.nvbuffer1, smua.nvbuffer2)
    end
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
      { key: 'setV', label: 'SET Voltage', defaultValue: 8, min: 0, max: 20, step: 0.1, unit: 'V' },
      { key: 'resetV', label: 'RESET Voltage', defaultValue: -8, min: -20, max: 0, step: 0.1, unit: 'V' },
      { key: 'readV', label: 'Read Voltage', defaultValue: 1.5, min: 0, max: 5, step: 0.1, unit: 'V' },
      { key: 'pulseWidth', label: 'Pulse Width', defaultValue: 0.1, min: 0.001, max: 10, step: 0.01, unit: 's' },
      { key: 'cycles', label: 'Cycles', defaultValue: 100, min: 1, max: 10000, step: 10, unit: '' },
      { key: 'compliance', label: 'Compliance', defaultValue: 0.01, min: 0.000001, max: 1, step: 0.001, unit: 'A' },
    ],
    generate: (p) => `smua.reset()
smua.source.func = smua.OUTPUT_DCVOLTS
smua.source.output = smua.OUTPUT_ON
smua.measure.autorangei = smua.AUTORANGE_OFF
smua.measure.rangei = 1e-3
smua.source.limiti = ${p.compliance}

smua.nvbuffer1.clear()
smua.nvbuffer1.appendmode = 1
smua.nvbuffer2.clear()
smua.nvbuffer2.appendmode = 1

for k = 1, ${p.cycles} do
    -- SET
    smua.source.levelv = ${p.setV}
    delay(${p.pulseWidth})

    -- READ LRS
    smua.source.levelv = ${p.readV}
    delay(0.02)
    smua.measure.iv(smua.nvbuffer1, smua.nvbuffer2)

    -- RESET
    smua.source.levelv = ${p.resetV}
    delay(${p.pulseWidth})

    -- READ HRS
    smua.source.levelv = ${p.readV}
    delay(0.02)
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
      { key: 'setV', label: 'SET Voltage', defaultValue: 8, min: 0, max: 20, step: 0.1, unit: 'V' },
      { key: 'resetV', label: 'RESET Voltage', defaultValue: -8, min: -20, max: 0, step: 0.1, unit: 'V' },
      { key: 'readV', label: 'Read Voltage', defaultValue: 1.5, min: 0, max: 5, step: 0.1, unit: 'V' },
      { key: 'pulseWidth', label: 'Initial Pulse Width', defaultValue: 0.1, min: 0.001, max: 10, step: 0.01, unit: 's' },
      { key: 'duration', label: 'Monitor Duration', defaultValue: 2000, min: 60, max: 10000, step: 60, unit: 's' },
      { key: 'readInterval', label: 'Read Interval', defaultValue: 10, min: 1, max: 60, step: 1, unit: 's' },
      { key: 'stateMode', label: 'State (1=LRS, 2=HRS)', defaultValue: 1, min: 1, max: 2, step: 1, unit: '' },
    ],
    generate: (p) => `smua.reset()
smua.source.func = smua.OUTPUT_DCVOLTS
smua.source.output = smua.OUTPUT_ON
smua.measure.autorangei = smua.AUTORANGE_OFF
smua.measure.rangei = 1e-3
smua.source.limiti = 0.01

smua.nvbuffer1.clear()
smua.nvbuffer1.appendmode = 1
smua.nvbuffer2.clear()
smua.nvbuffer2.appendmode = 1

-- Set initial state
state_mode = ${p.stateMode}
if state_mode == 1 then
    -- SET to LRS
    smua.source.levelv = ${p.setV}
    delay(${p.pulseWidth})
else
    -- RESET to HRS
    smua.source.levelv = ${p.resetV}
    delay(${p.pulseWidth})
end

-- Monitor at read voltage
smua.source.levelv = ${p.readV}
totalPoints = ${p.duration} / ${p.readInterval}

for i = 1, totalPoints do
    delay(${p.readInterval})
    smua.measure.iv(smua.nvbuffer1, smua.nvbuffer2)
end

smua.source.output = smua.OUTPUT_OFF
printbuffer(1, smua.nvbuffer1.n, smua.nvbuffer1)
print("---SEPARATOR---")
printbuffer(1, smua.nvbuffer2.n, smua.nvbuffer2)`,
  },

  {
    id: 'freq_response',
    label: 'Frequency Response',
    paramFields: [
      { key: 'writeV', label: 'Write Voltage', defaultValue: 8, min: 0, max: 20, step: 0.1, unit: 'V' },
      { key: 'readV', label: 'Read Voltage', defaultValue: 1.5, min: 0, max: 5, step: 0.1, unit: 'V' },
      { key: 'pulseWidth', label: 'Pulse Width', defaultValue: 0.1, min: 0.001, max: 10, step: 0.01, unit: 's' },
      { key: 'frequency', label: 'Frequency', defaultValue: 10, min: 0.1, max: 1000, step: 1, unit: 'Hz' },
      { key: 'numPulses', label: 'Number of Pulses', defaultValue: 10, min: 1, max: 500, step: 1, unit: '' },
      { key: 'compliance', label: 'Compliance', defaultValue: 0.01, min: 0.000001, max: 1, step: 0.001, unit: 'A' },
    ],
    generate: (p) => `smua.reset()
smua.source.func = smua.OUTPUT_DCVOLTS
smua.source.output = smua.OUTPUT_ON
smua.measure.autorangei = smua.AUTORANGE_OFF
smua.measure.rangei = 1e-3
smua.source.limiti = ${p.compliance}

smua.nvbuffer1.clear()
smua.nvbuffer1.appendmode = 1
smua.nvbuffer2.clear()
smua.nvbuffer2.appendmode = 1

period = 1 / ${p.frequency}
gap = period - ${p.pulseWidth}
if gap < 0.005 then gap = 0.005 end

smua.source.levelv = ${p.readV}
delay(1)

for i = 1, ${p.numPulses} do
    smua.source.levelv = ${p.writeV}
    delay(${p.pulseWidth})
    smua.source.levelv = ${p.readV}
    delay(gap)
    smua.measure.iv(smua.nvbuffer1, smua.nvbuffer2)
end

smua.source.output = smua.OUTPUT_OFF
printbuffer(1, smua.nvbuffer1.n, smua.nvbuffer1)
print("---SEPARATOR---")
printbuffer(1, smua.nvbuffer2.n, smua.nvbuffer2)`,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // DS345 FUNCTION GENERATOR TRIGGERED TESTS
  // Require DS345 connected via Digital I/O (25-pin): BNC -> Pin 1, GND -> Pin 12
  // DS345 settings: Square wave, 5Vpp, Offset +2.5V (clean 0-5V TTL)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'ds345_epsc',
    label: '[DS345] EPSC Triggered',
    paramFields: [
      { key: 'digioLine', label: 'Digital I/O Line', defaultValue: 1, min: 1, max: 14, step: 1, unit: '' },
      { key: 'writeV', label: 'Write Voltage', defaultValue: 8, min: 0, max: 20, step: 0.1, unit: 'V' },
      { key: 'readV', label: 'Read Voltage', defaultValue: 1.5, min: 0, max: 5, step: 0.1, unit: 'V' },
      { key: 'pulseWidth', label: 'Pulse Width', defaultValue: 0.1, min: 0.001, max: 10, step: 0.01, unit: 's' },
      { key: 'decayPoints', label: 'Decay Points', defaultValue: 200, min: 10, max: 1000, step: 10, unit: '' },
      { key: 'decayInterval', label: 'Decay Interval', defaultValue: 0.1, min: 0.01, max: 1, step: 0.01, unit: 's' },
      { key: 'compliance', label: 'Compliance', defaultValue: 0.001, min: 0.000001, max: 1, step: 0.001, unit: 'A' },
    ],
    generate: (p) => `-- DS345: Single burst trigger
reset()
smua.reset()
smua.source.func = smua.OUTPUT_DCVOLTS
smua.source.rangev = 10
smua.measure.autorangei = smua.AUTORANGE_OFF
smua.measure.rangei = 1e-4
smua.source.limiti = ${p.compliance}
smua.measure.nplc = 0.01

smua.nvbuffer1.clear()
smua.nvbuffer1.appendmode = 1
smua.nvbuffer2.clear()
smua.nvbuffer2.appendmode = 1

-- Digital I/O: Line 1 as input trigger from DS345
digio.trigger[${p.digioLine}].mode = digio.TRIG_FALLING
digio.trigger[${p.digioLine}].clear()

smua.source.levelv = ${p.readV}
smua.source.output = smua.OUTPUT_ON

-- BASELINE (20 points)
for i = 1, 20 do
    smua.measure.iv(smua.nvbuffer1, smua.nvbuffer2)
    delay(0.1)
end

-- WAIT FOR DS345 TRIGGER
print(">>> Press DS345 trigger button NOW <<<")
digio.trigger[${p.digioLine}].wait(60)

-- STIMULUS PULSE (trigger received)
smua.source.levelv = ${p.writeV}
delay(${p.pulseWidth})
smua.measure.iv(smua.nvbuffer1, smua.nvbuffer2)

-- POST-PULSE DECAY
smua.source.levelv = ${p.readV}
for i = 1, ${p.decayPoints} do
    smua.measure.iv(smua.nvbuffer1, smua.nvbuffer2)
    delay(${p.decayInterval})
end

smua.source.output = smua.OUTPUT_OFF
printbuffer(1, smua.nvbuffer1.n, smua.nvbuffer1)
print("---SEPARATOR---")
printbuffer(1, smua.nvbuffer2.n, smua.nvbuffer2)`,
  },

  {
    id: 'ds345_ppf',
    label: '[DS345] PPF Triggered',
    paramFields: [
      { key: 'digioLine', label: 'Digital I/O Line', defaultValue: 1, min: 1, max: 14, step: 1, unit: '' },
      { key: 'writeV', label: 'Write Voltage', defaultValue: 8, min: 0, max: 20, step: 0.1, unit: 'V' },
      { key: 'readV', label: 'Read Voltage', defaultValue: 1.5, min: 0, max: 5, step: 0.1, unit: 'V' },
      { key: 'pulseWidth', label: 'Pulse Width', defaultValue: 0.1, min: 0.001, max: 10, step: 0.01, unit: 's' },
      { key: 'deltaT', label: 'Inter-Pulse Gap (DS345 controls)', defaultValue: 0.05, min: 0.001, max: 5, step: 0.01, unit: 's' },
      { key: 'decayTime', label: 'Decay Duration', defaultValue: 5, min: 1, max: 60, step: 1, unit: 's' },
      { key: 'compliance', label: 'Compliance', defaultValue: 0.001, min: 0.000001, max: 1, step: 0.001, unit: 'A' },
    ],
    generate: (p) => `-- DS345: Burst=2, Freq = 1/(pulseWidth + deltaT)
-- Required DS345 freq: ${1 / (0.1 + 0.05)} Hz (recalculate for your params)
reset()
smua.reset()
smua.source.func = smua.OUTPUT_DCVOLTS
smua.source.rangev = 10
smua.measure.autorangei = smua.AUTORANGE_OFF
smua.measure.rangei = 1e-4
smua.source.limiti = ${p.compliance}

smua.nvbuffer1.clear()
smua.nvbuffer1.appendmode = 1
smua.nvbuffer2.clear()
smua.nvbuffer2.appendmode = 1

digio.trigger[${p.digioLine}].mode = digio.TRIG_FALLING
digio.trigger[${p.digioLine}].clear()

smua.source.levelv = ${p.readV}
smua.source.output = smua.OUTPUT_ON

-- BASELINE
for i = 1, 40 do
    smua.measure.iv(smua.nvbuffer1, smua.nvbuffer2)
    delay(0.05)
end

-- WAIT FOR DS345 PULSE 1
print(">>> Set DS345: Burst=1, then trigger <<<")
digio.trigger[${p.digioLine}].wait(60)

-- PULSE 1
smua.source.levelv = ${p.writeV}
delay(${p.pulseWidth})
smua.measure.iv(smua.nvbuffer1, smua.nvbuffer2)

-- GAP: DS345 controls precise timing
smua.source.levelv = ${p.readV}
print(">>> Waiting for DS345 pulse 2 (deltaT = ${p.deltaT}s) <<<")
digio.trigger[${p.digioLine}].wait(60)

-- PULSE 2
smua.source.levelv = ${p.writeV}
delay(${p.pulseWidth})
smua.measure.iv(smua.nvbuffer1, smua.nvbuffer2)

-- DECAY
smua.source.levelv = ${p.readV}
decayPoints = ${p.decayTime} / 0.1
for i = 1, decayPoints do
    smua.measure.iv(smua.nvbuffer1, smua.nvbuffer2)
    delay(0.1)
end

smua.source.output = smua.OUTPUT_OFF
printbuffer(1, smua.nvbuffer1.n, smua.nvbuffer1)
print("---SEPARATOR---")
printbuffer(1, smua.nvbuffer2.n, smua.nvbuffer2)`,
  },

  {
    id: 'ds345_sddp',
    label: '[DS345] SDDP Triggered',
    paramFields: [
      { key: 'digioLine', label: 'Digital I/O Line', defaultValue: 1, min: 1, max: 14, step: 1, unit: '' },
      { key: 'writeV', label: 'Write Voltage', defaultValue: 8, min: 0, max: 20, step: 0.1, unit: 'V' },
      { key: 'readV', label: 'Read Voltage', defaultValue: 1.5, min: 0, max: 5, step: 0.1, unit: 'V' },
      { key: 'pulseWidth', label: 'Pulse Width', defaultValue: 0.1, min: 0.001, max: 10, step: 0.01, unit: 's' },
      { key: 'numPulses', label: 'Number of Pulses', defaultValue: 50, min: 1, max: 500, step: 1, unit: '' },
      { key: 'compliance', label: 'Compliance', defaultValue: 0.001, min: 0.000001, max: 1, step: 0.001, unit: 'A' },
    ],
    generate: (p) => `-- DS345: Burst=${p.numPulses}, Freq based on pulseWidth + readGap
reset()
smua.reset()
smua.source.func = smua.OUTPUT_DCVOLTS
smua.source.rangev = 10
smua.measure.autorangei = smua.AUTORANGE_OFF
smua.measure.rangei = 1e-4
smua.source.limiti = ${p.compliance}

smua.nvbuffer1.clear()
smua.nvbuffer1.appendmode = 1
smua.nvbuffer2.clear()
smua.nvbuffer2.appendmode = 1

digio.trigger[${p.digioLine}].mode = digio.TRIG_FALLING
digio.trigger[${p.digioLine}].clear()

readGap = 0.05

smua.source.levelv = ${p.readV}
smua.source.output = smua.OUTPUT_ON
delay(0.5)

freq = 1 / (${p.pulseWidth} + readGap + 0.01)
print("Set DS345: Burst=${p.numPulses}, Freq=" .. freq .. " Hz")
print(">>> Trigger DS345 NOW <<<")

for i = 1, ${p.numPulses} do
    digio.trigger[${p.digioLine}].wait(10)

    -- Write pulse
    smua.source.levelv = ${p.writeV}
    delay(${p.pulseWidth})

    -- Read and measure
    smua.source.levelv = ${p.readV}
    delay(readGap)
    smua.measure.iv(smua.nvbuffer1, smua.nvbuffer2)
end

smua.source.output = smua.OUTPUT_OFF
printbuffer(1, smua.nvbuffer1.n, smua.nvbuffer1)
print("---SEPARATOR---")
printbuffer(1, smua.nvbuffer2.n, smua.nvbuffer2)`,
  },

  {
    id: 'ds345_sddp_decay',
    label: '[DS345] SDDP Decay Triggered',
    paramFields: [
      { key: 'digioLine', label: 'Digital I/O Line', defaultValue: 1, min: 1, max: 14, step: 1, unit: '' },
      { key: 'writeV', label: 'Write Voltage', defaultValue: 8, min: 0, max: 20, step: 0.1, unit: 'V' },
      { key: 'readV', label: 'Read Voltage', defaultValue: 1.5, min: 0, max: 5, step: 0.1, unit: 'V' },
      { key: 'pulseWidth', label: 'Pulse Width', defaultValue: 0.1, min: 0.001, max: 10, step: 0.01, unit: 's' },
      { key: 'decayPoints', label: 'Decay Points', defaultValue: 200, min: 10, max: 1000, step: 10, unit: '' },
      { key: 'compliance', label: 'Compliance', defaultValue: 0.001, min: 0.000001, max: 1, step: 0.001, unit: 'A' },
    ],
    generate: (p) => `-- DS345: Single trigger pulse
reset()
smua.reset()
smua.source.func = smua.OUTPUT_DCVOLTS
smua.source.rangev = 10
smua.measure.autorangei = smua.AUTORANGE_OFF
smua.measure.rangei = 1e-4
smua.source.limiti = ${p.compliance}

smua.nvbuffer1.clear()
smua.nvbuffer1.appendmode = 1
smua.nvbuffer2.clear()
smua.nvbuffer2.appendmode = 1

digio.trigger[${p.digioLine}].mode = digio.TRIG_FALLING
digio.trigger[${p.digioLine}].clear()

smua.source.levelv = ${p.readV}
smua.source.output = smua.OUTPUT_ON

-- Baseline
for i = 1, 20 do
    smua.measure.iv(smua.nvbuffer1, smua.nvbuffer2)
    delay(0.1)
end

print(">>> Trigger DS345 (single burst) <<<")
digio.trigger[${p.digioLine}].wait(60)

-- Write pulse
smua.source.levelv = ${p.writeV}
delay(${p.pulseWidth})

-- Decay
smua.source.levelv = ${p.readV}
for i = 1, ${p.decayPoints} do
    smua.measure.iv(smua.nvbuffer1, smua.nvbuffer2)
    delay(0.1)
end

smua.source.output = smua.OUTPUT_OFF
printbuffer(1, smua.nvbuffer1.n, smua.nvbuffer1)
print("---SEPARATOR---")
printbuffer(1, smua.nvbuffer2.n, smua.nvbuffer2)`,
  },

  {
    id: 'ds345_srdp',
    label: '[DS345] SRDP Triggered',
    paramFields: [
      { key: 'digioLine', label: 'Digital I/O Line', defaultValue: 1, min: 1, max: 14, step: 1, unit: '' },
      { key: 'writeV', label: 'Write Voltage', defaultValue: 8, min: 0, max: 20, step: 0.1, unit: 'V' },
      { key: 'readV', label: 'Read Voltage', defaultValue: 1.5, min: 0, max: 5, step: 0.1, unit: 'V' },
      { key: 'pulseWidth', label: 'Pulse Width', defaultValue: 0.1, min: 0.001, max: 10, step: 0.01, unit: 's' },
      { key: 'pulseCount', label: 'Pulse Count', defaultValue: 50, min: 1, max: 500, step: 1, unit: '' },
      { key: 'frequency', label: 'DS345 Frequency', defaultValue: 2.0, min: 0.1, max: 100, step: 0.1, unit: 'Hz' },
      { key: 'compliance', label: 'Compliance', defaultValue: 0.001, min: 0.000001, max: 1, step: 0.001, unit: 'A' },
    ],
    generate: (p) => `-- DS345: Burst=${p.pulseCount}, Freq=${p.frequency} Hz (crystal-precise)
-- DS345 oscillator is 1ppm accuracy — exact SRDP frequencies
reset()
smua.reset()
smua.source.func = smua.OUTPUT_DCVOLTS
smua.source.rangev = 10
smua.measure.autorangei = smua.AUTORANGE_OFF
smua.measure.rangei = 1e-4
smua.source.limiti = ${p.compliance}

smua.nvbuffer1.clear()
smua.nvbuffer1.appendmode = 1
smua.nvbuffer2.clear()
smua.nvbuffer2.appendmode = 1

digio.trigger[${p.digioLine}].mode = digio.TRIG_FALLING
digio.trigger[${p.digioLine}].clear()

period = 1 / ${p.frequency}
read_gap = period - ${p.pulseWidth}
if read_gap < 0.01 then read_gap = 0.01 end

smua.source.levelv = ${p.readV}
smua.source.output = smua.OUTPUT_ON
delay(2)

print("Set DS345: Burst=${p.pulseCount}, Freq=${p.frequency} Hz")
print(">>> Trigger DS345 NOW <<<")

for i = 1, ${p.pulseCount} do
    digio.trigger[${p.digioLine}].wait(10)

    -- Write
    smua.source.levelv = ${p.writeV}
    delay(${p.pulseWidth})

    -- Read
    smua.source.levelv = ${p.readV}
    delay(read_gap * 0.8)
    smua.measure.iv(smua.nvbuffer1, smua.nvbuffer2)
end

smua.source.output = smua.OUTPUT_OFF
printbuffer(1, smua.nvbuffer1.n, smua.nvbuffer1)
print("---SEPARATOR---")
printbuffer(1, smua.nvbuffer2.n, smua.nvbuffer2)`,
  },

  {
    id: 'ds345_stdp',
    label: '[DS345] STDP Triggered',
    paramFields: [
      { key: 'digioLine', label: 'Digital I/O Line', defaultValue: 1, min: 1, max: 14, step: 1, unit: '' },
      { key: 'posV', label: 'Positive Voltage', defaultValue: 8, min: 0, max: 20, step: 0.1, unit: 'V' },
      { key: 'negV', label: 'Negative Voltage', defaultValue: -8, min: -20, max: 0, step: 0.1, unit: 'V' },
      { key: 'readV', label: 'Read Voltage', defaultValue: 1.5, min: 0, max: 5, step: 0.1, unit: 'V' },
      { key: 'pulseWidth', label: 'Pulse Width', defaultValue: 0.1, min: 0.001, max: 10, step: 0.01, unit: 's' },
      { key: 'deltaT', label: 'Delta T (DS345 controls)', defaultValue: 0.05, min: 0.005, max: 5, step: 0.01, unit: 's' },
      { key: 'orderMode', label: 'Order (1=Pre-Post, 2=Post-Pre)', defaultValue: 1, min: 1, max: 2, step: 1, unit: '' },
    ],
    generate: (p) => `-- DS345: Burst=2, Freq = 1/(pulseWidth + dt) for precise dt
reset()
smua.reset()
smua.source.func = smua.OUTPUT_DCVOLTS
smua.source.rangev = 10
smua.measure.autorangei = smua.AUTORANGE_OFF
smua.measure.rangei = 1e-4
smua.source.limiti = 1e-3

smua.nvbuffer1.clear()
smua.nvbuffer1.appendmode = 1
smua.nvbuffer2.clear()
smua.nvbuffer2.appendmode = 1

digio.trigger[${p.digioLine}].mode = digio.TRIG_FALLING
digio.trigger[${p.digioLine}].clear()

smua.source.levelv = ${p.readV}
smua.source.output = smua.OUTPUT_ON

-- MEASURE INITIAL WEIGHT
delay(1)
for i = 1, 10 do
    smua.measure.iv(smua.nvbuffer1, smua.nvbuffer2)
    delay(0.05)
end

freq = 1 / (${p.pulseWidth} + ${p.deltaT})
print("Set DS345: Burst=2, Freq=" .. freq .. " Hz")
print(">>> Trigger DS345 NOW <<<")

-- Wait for first trigger
digio.trigger[${p.digioLine}].wait(60)

order_mode = ${p.orderMode}
if order_mode == 1 then
    -- Pre then Post (potentiation)
    smua.source.levelv = ${p.posV}
    delay(${p.pulseWidth})
    smua.source.levelv = 0

    -- Wait for second trigger (DS345 handles precise dt)
    digio.trigger[${p.digioLine}].wait(${p.deltaT} + 1)
    smua.source.levelv = ${p.negV}
    delay(${p.pulseWidth})
else
    -- Post then Pre (depression)
    smua.source.levelv = ${p.negV}
    delay(${p.pulseWidth})
    smua.source.levelv = 0

    digio.trigger[${p.digioLine}].wait(${p.deltaT} + 1)
    smua.source.levelv = ${p.posV}
    delay(${p.pulseWidth})
end

-- MEASURE FINAL WEIGHT
smua.source.levelv = ${p.readV}
delay(0.5)
for i = 1, 10 do
    smua.measure.iv(smua.nvbuffer1, smua.nvbuffer2)
    delay(0.05)
end

smua.source.output = smua.OUTPUT_OFF
printbuffer(1, smua.nvbuffer1.n, smua.nvbuffer1)
print("---SEPARATOR---")
printbuffer(1, smua.nvbuffer2.n, smua.nvbuffer2)`,
  },

  {
    id: 'ds345_sndp',
    label: '[DS345] SNDP Triggered',
    paramFields: [
      { key: 'digioLine', label: 'Digital I/O Line', defaultValue: 1, min: 1, max: 14, step: 1, unit: '' },
      { key: 'writeV', label: 'Write Voltage', defaultValue: 8, min: 0, max: 20, step: 0.1, unit: 'V' },
      { key: 'readV', label: 'Read Voltage', defaultValue: 1.5, min: 0, max: 5, step: 0.1, unit: 'V' },
      { key: 'pulseWidth', label: 'Pulse Width', defaultValue: 0.1, min: 0.001, max: 10, step: 0.01, unit: 's' },
      { key: 'numPulses', label: 'Number of Pulses', defaultValue: 1, min: 1, max: 200, step: 1, unit: '' },
      { key: 'decayTime', label: 'Decay Duration', defaultValue: 30, min: 1, max: 120, step: 1, unit: 's' },
      { key: 'compliance', label: 'Compliance', defaultValue: 0.001, min: 0.000001, max: 1, step: 0.001, unit: 'A' },
    ],
    generate: (p) => `-- DS345: Burst=${p.numPulses}, Freq = 1/(pulseWidth + gap) = 5 Hz
reset()
smua.reset()
smua.source.func = smua.OUTPUT_DCVOLTS
smua.source.rangev = 10
smua.measure.autorangei = smua.AUTORANGE_OFF
smua.measure.rangei = 1e-4
smua.source.limiti = ${p.compliance}

smua.nvbuffer1.clear()
smua.nvbuffer1.appendmode = 1
smua.nvbuffer2.clear()
smua.nvbuffer2.appendmode = 1

digio.trigger[${p.digioLine}].mode = digio.TRIG_FALLING
digio.trigger[${p.digioLine}].clear()

smua.source.levelv = ${p.readV}
smua.source.output = smua.OUTPUT_ON

-- Baseline
delay(1)
for i = 1, 20 do
    smua.measure.iv(smua.nvbuffer1, smua.nvbuffer2)
    delay(0.1)
end

width = ${p.pulseWidth}
gap = 0.1
freq = 1 / (width + gap)
print("Set DS345: Burst=${p.numPulses}, Freq=" .. freq .. " Hz")
print(">>> Trigger DS345 NOW <<<")

-- Pulse train synchronized to DS345
for i = 1, ${p.numPulses} do
    digio.trigger[${p.digioLine}].wait(10)
    smua.source.levelv = ${p.writeV}
    delay(width)
    if i < ${p.numPulses} then
        smua.source.levelv = ${p.readV}
    end
end

-- Decay measurement
smua.source.levelv = ${p.readV}
decayPoints = ${p.decayTime} / 0.1
for i = 1, decayPoints do
    smua.measure.iv(smua.nvbuffer1, smua.nvbuffer2)
    delay(0.1)
end

smua.source.output = smua.OUTPUT_OFF
printbuffer(1, smua.nvbuffer1.n, smua.nvbuffer1)
print("---SEPARATOR---")
printbuffer(1, smua.nvbuffer2.n, smua.nvbuffer2)`,
  },

  {
    id: 'ds345_ltp_ltd',
    label: '[DS345] LTP/LTD Triggered',
    paramFields: [
      { key: 'digioLine', label: 'Digital I/O Line', defaultValue: 1, min: 1, max: 14, step: 1, unit: '' },
      { key: 'posV', label: 'Potentiation Voltage', defaultValue: 8, min: 0, max: 20, step: 0.1, unit: 'V' },
      { key: 'negV', label: 'Depression Voltage', defaultValue: -8, min: -20, max: 0, step: 0.1, unit: 'V' },
      { key: 'readV', label: 'Read Voltage', defaultValue: 1.5, min: 0, max: 5, step: 0.1, unit: 'V' },
      { key: 'pulseWidth', label: 'Pulse Width', defaultValue: 0.1, min: 0.001, max: 10, step: 0.01, unit: 's' },
      { key: 'pulsesPerDir', label: 'Pulses Per Direction', defaultValue: 100, min: 10, max: 500, step: 10, unit: '' },
    ],
    generate: (p) => `-- DS345: Burst=${p.pulsesPerDir}, trigger TWICE (once for potentiation, once for depression)
reset()
smua.reset()
smua.source.func = smua.OUTPUT_DCVOLTS
smua.source.rangev = 10
smua.measure.autorangei = smua.AUTORANGE_OFF
smua.measure.rangei = 1e-3
smua.source.limiti = 0.01

smua.nvbuffer1.clear()
smua.nvbuffer1.appendmode = 1
smua.nvbuffer2.clear()
smua.nvbuffer2.appendmode = 1

digio.trigger[${p.digioLine}].mode = digio.TRIG_FALLING
digio.trigger[${p.digioLine}].clear()

readGap = 0.02

smua.source.levelv = ${p.readV}
smua.source.output = smua.OUTPUT_ON
delay(1)

freq = 1 / (${p.pulseWidth} + readGap + 0.01)
print("=== PHASE 1: POTENTIATION ===")
print("Set DS345: Burst=${p.pulsesPerDir}, Freq=" .. freq .. " Hz")
print(">>> Trigger DS345 NOW <<<")

-- Potentiation
for i = 1, ${p.pulsesPerDir} do
    digio.trigger[${p.digioLine}].wait(10)
    smua.source.levelv = ${p.posV}
    delay(${p.pulseWidth})
    smua.source.levelv = ${p.readV}
    delay(readGap)
    smua.measure.iv(smua.nvbuffer1, smua.nvbuffer2)
end

print("=== PHASE 2: DEPRESSION ===")
print("Set DS345: Keep same settings")
print(">>> Trigger DS345 AGAIN <<<")
digio.trigger[${p.digioLine}].clear()

-- Depression
for i = 1, ${p.pulsesPerDir} do
    digio.trigger[${p.digioLine}].wait(10)
    smua.source.levelv = ${p.negV}
    delay(${p.pulseWidth})
    smua.source.levelv = ${p.readV}
    delay(readGap)
    smua.measure.iv(smua.nvbuffer1, smua.nvbuffer2)
end

smua.source.output = smua.OUTPUT_OFF
printbuffer(1, smua.nvbuffer1.n, smua.nvbuffer1)
print("---SEPARATOR---")
printbuffer(1, smua.nvbuffer2.n, smua.nvbuffer2)`,
  },

  {
    id: 'ds345_endurance',
    label: '[DS345] Endurance Triggered',
    paramFields: [
      { key: 'digioLine', label: 'Digital I/O Line', defaultValue: 1, min: 1, max: 14, step: 1, unit: '' },
      { key: 'setV', label: 'SET Voltage', defaultValue: 8, min: 0, max: 20, step: 0.1, unit: 'V' },
      { key: 'resetV', label: 'RESET Voltage', defaultValue: -8, min: -20, max: 0, step: 0.1, unit: 'V' },
      { key: 'readV', label: 'Read Voltage', defaultValue: 1.5, min: 0, max: 5, step: 0.1, unit: 'V' },
      { key: 'pulseWidth', label: 'Pulse Width', defaultValue: 0.1, min: 0.001, max: 10, step: 0.01, unit: 's' },
      { key: 'cycles', label: 'Cycles', defaultValue: 100, min: 1, max: 10000, step: 10, unit: '' },
    ],
    generate: (p) => `-- DS345: Burst = cycles*2, each cycle needs SET + RESET triggers
reset()
smua.reset()
smua.source.func = smua.OUTPUT_DCVOLTS
smua.source.rangev = 10
smua.measure.autorangei = smua.AUTORANGE_OFF
smua.measure.rangei = 1e-3
smua.source.limiti = 0.01

smua.nvbuffer1.clear()
smua.nvbuffer1.appendmode = 1
smua.nvbuffer2.clear()
smua.nvbuffer2.appendmode = 1

digio.trigger[${p.digioLine}].mode = digio.TRIG_FALLING
digio.trigger[${p.digioLine}].clear()

readWidth = 0.02

smua.source.levelv = ${p.readV}
smua.source.output = smua.OUTPUT_ON

freq = 1 / (2 * ${p.pulseWidth} + 2 * readWidth + 0.02)
print("Set DS345: Burst=" .. ${p.cycles} * 2 .. ", Freq=" .. freq .. " Hz")
print(">>> Trigger DS345 NOW <<<")

for k = 1, ${p.cycles} do
    -- SET trigger
    digio.trigger[${p.digioLine}].wait(10)
    smua.source.levelv = ${p.setV}
    delay(${p.pulseWidth})
    smua.source.levelv = ${p.readV}
    delay(readWidth)
    smua.measure.iv(smua.nvbuffer1, smua.nvbuffer2)

    -- RESET trigger
    digio.trigger[${p.digioLine}].wait(10)
    smua.source.levelv = ${p.resetV}
    delay(${p.pulseWidth})
    smua.source.levelv = ${p.readV}
    delay(readWidth)
    smua.measure.iv(smua.nvbuffer1, smua.nvbuffer2)
end

smua.source.output = smua.OUTPUT_OFF
printbuffer(1, smua.nvbuffer1.n, smua.nvbuffer1)
print("---SEPARATOR---")
printbuffer(1, smua.nvbuffer2.n, smua.nvbuffer2)`,
  },

  {
    id: 'ds345_freq_response',
    label: '[DS345] Frequency Response Triggered',
    paramFields: [
      { key: 'digioLine', label: 'Digital I/O Line', defaultValue: 1, min: 1, max: 14, step: 1, unit: '' },
      { key: 'writeV', label: 'Write Voltage', defaultValue: 8, min: 0, max: 20, step: 0.1, unit: 'V' },
      { key: 'readV', label: 'Read Voltage', defaultValue: 1.5, min: 0, max: 5, step: 0.1, unit: 'V' },
      { key: 'pulseWidth', label: 'Pulse Width', defaultValue: 0.1, min: 0.001, max: 10, step: 0.01, unit: 's' },
      { key: 'frequency', label: 'DS345 Frequency', defaultValue: 10, min: 0.1, max: 1000, step: 1, unit: 'Hz' },
      { key: 'numPulses', label: 'Number of Pulses', defaultValue: 10, min: 1, max: 500, step: 1, unit: '' },
      { key: 'compliance', label: 'Compliance', defaultValue: 0.01, min: 0.000001, max: 1, step: 0.001, unit: 'A' },
    ],
    generate: (p) => `-- DS345: Burst=${p.numPulses}, Freq=${p.frequency} Hz
reset()
smua.reset()
smua.source.func = smua.OUTPUT_DCVOLTS
smua.source.rangev = 10
smua.measure.autorangei = smua.AUTORANGE_OFF
smua.measure.rangei = 1e-3
smua.source.limiti = ${p.compliance}

smua.nvbuffer1.clear()
smua.nvbuffer1.appendmode = 1
smua.nvbuffer2.clear()
smua.nvbuffer2.appendmode = 1

digio.trigger[${p.digioLine}].mode = digio.TRIG_FALLING
digio.trigger[${p.digioLine}].clear()

period = 1 / ${p.frequency}
gap = period - ${p.pulseWidth}
if gap < 0.005 then gap = 0.005 end

smua.source.levelv = ${p.readV}
smua.source.output = smua.OUTPUT_ON
delay(1)

print("Set DS345: Burst=${p.numPulses}, Freq=${p.frequency} Hz")
print(">>> Trigger DS345 NOW <<<")

for i = 1, ${p.numPulses} do
    digio.trigger[${p.digioLine}].wait(10)
    smua.source.levelv = ${p.writeV}
    delay(${p.pulseWidth})
    smua.source.levelv = ${p.readV}
    delay(gap * 0.8)
    smua.measure.iv(smua.nvbuffer1, smua.nvbuffer2)
end

smua.source.output = smua.OUTPUT_OFF
printbuffer(1, smua.nvbuffer1.n, smua.nvbuffer1)
print("---SEPARATOR---")
printbuffer(1, smua.nvbuffer2.n, smua.nvbuffer2)`,
  },

  {
    id: 'ds345_learning',
    label: '[DS345] Learning/Forgetting Triggered',
    paramFields: [
      { key: 'digioLine', label: 'Digital I/O Line', defaultValue: 1, min: 1, max: 14, step: 1, unit: '' },
      { key: 'writeV', label: 'Write Voltage', defaultValue: 8, min: 0, max: 20, step: 0.1, unit: 'V' },
      { key: 'readV', label: 'Read Voltage', defaultValue: 1.5, min: 0, max: 5, step: 0.1, unit: 'V' },
      { key: 'pulseWidth', label: 'Pulse Width', defaultValue: 0.1, min: 0.001, max: 10, step: 0.01, unit: 's' },
      { key: 'numPulses', label: 'Training Pulses', defaultValue: 10, min: 1, max: 200, step: 1, unit: '' },
      { key: 'monitorTime', label: 'Monitor Duration', defaultValue: 60, min: 10, max: 600, step: 10, unit: 's' },
      { key: 'compliance', label: 'Compliance', defaultValue: 0.001, min: 0.000001, max: 1, step: 0.001, unit: 'A' },
    ],
    generate: (p) => `-- DS345: Burst=${p.numPulses}, Freq = 5 Hz
reset()
smua.reset()
smua.source.func = smua.OUTPUT_DCVOLTS
smua.source.rangev = 10
smua.measure.autorangei = smua.AUTORANGE_OFF
smua.measure.rangei = 1e-4
smua.source.limiti = ${p.compliance}

smua.nvbuffer1.clear()
smua.nvbuffer1.appendmode = 1
smua.nvbuffer2.clear()
smua.nvbuffer2.appendmode = 1

digio.trigger[${p.digioLine}].mode = digio.TRIG_FALLING
digio.trigger[${p.digioLine}].clear()

smua.source.levelv = ${p.readV}
smua.source.output = smua.OUTPUT_ON

-- Pre-training baseline
delay(1)
for i = 1, 20 do
    smua.measure.iv(smua.nvbuffer1, smua.nvbuffer2)
    delay(0.1)
end

gap = 0.1
freq = 1 / (${p.pulseWidth} + gap)
print("Set DS345: Burst=${p.numPulses}, Freq=" .. freq .. " Hz")
print(">>> Trigger DS345 NOW <<<")

-- Training phase (DS345 timed)
for i = 1, ${p.numPulses} do
    digio.trigger[${p.digioLine}].wait(10)
    smua.source.levelv = ${p.writeV}
    delay(${p.pulseWidth})
    if i < ${p.numPulses} then
        smua.source.levelv = ${p.readV}
    end
end

-- Forgetting phase: monitor decay
smua.source.levelv = ${p.readV}
monitorPoints = ${p.monitorTime} / 0.5
for i = 1, monitorPoints do
    smua.measure.iv(smua.nvbuffer1, smua.nvbuffer2)
    delay(0.5)
end

smua.source.output = smua.OUTPUT_OFF
printbuffer(1, smua.nvbuffer1.n, smua.nvbuffer1)
print("---SEPARATOR---")
printbuffer(1, smua.nvbuffer2.n, smua.nvbuffer2)`,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // UTILITY
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'device_reset',
    label: 'Device Reset / Rest',
    paramFields: [
      { key: 'restTime', label: 'Rest Duration', defaultValue: 30, min: 1, max: 300, step: 1, unit: 's' },
    ],
    generate: (p) => `smua.reset()
smua.source.func = smua.OUTPUT_DCVOLTS
smua.source.output = smua.OUTPUT_ON
smua.source.levelv = 0

smua.nvbuffer1.clear()
smua.nvbuffer1.appendmode = 1
smua.nvbuffer2.clear()
smua.nvbuffer2.appendmode = 1

-- Rest at 0V, measure periodically
restPoints = ${p.restTime} / 1
for i = 1, restPoints do
    smua.measure.iv(smua.nvbuffer1, smua.nvbuffer2)
    delay(1)
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
