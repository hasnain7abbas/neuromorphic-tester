# Neuromorphic Memristor Tester

Desktop control software for the **Keithley 2602 SMU** — designed for neuromorphic memristor research. Built with Tauri 2.0, React, and Rust.

Connects to the SMU via **GPIB (NI-VISA)**, sends TSP/Lua scripts, streams measurement data in real time, and provides interactive plotting and data export.

---

## Features

- **GPIB Connection** — Communicates with Keithley 2602 via NI-VISA (`visa64.dll`), configurable VISA resource string
- **30+ Test Templates** — Pre-built synaptic plasticity tests with adjustable parameters:
  - EPSC, PPF, PPD, SDDP, SRDP, STDP, SNDP
  - LTP/LTD, Learning/Forgetting, STP-to-LTP Transition
  - Multi-Level Conductance, Linearity Test
  - Bipolar I-V Sweep, Endurance, Retention, Frequency Response
  - 11 DS345 function generator triggered variants (configurable Digital I/O line)
  - Device Reset utility and Custom Script mode
- **Real-Time Streaming** — Live data from SMU buffers displayed as it arrives
- **Interactive Graphs** — Plotly.js charts: I-V, I-t, R-Cycle, Log I-V
- **Script Editor** — Monaco editor with Lua/TSP syntax highlighting
- **Data Table** — Scrollable table with voltage, current, and resistance readings
- **Session History** — SQLite-backed session recording with auto-save on test completion
- **Export** — CSV and XLSX export of measurement data
- **Safety** — Sends `smua.source.output = smua.OUTPUT_OFF` on window close

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Tauri 2.0](https://tauri.app/) |
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS 3 |
| Charts | Plotly.js + react-plotly.js |
| Script Editor | Monaco Editor (@monaco-editor/react) |
| Backend | Rust, Tokio (async runtime) |
| SMU Communication | NI-VISA FFI (`visa64.dll` via raw-dylib) |
| Database | SQLite (rusqlite, bundled) |
| Export | csv, rust_xlsxwriter |
| CI/CD | GitHub Actions (auto version bump + release) |

---

## Prerequisites

- **Windows 10/11** (NI-VISA driver required for GPIB)
- **NI-VISA** runtime installed ([download from NI](https://www.ni.com/en/support/downloads/drivers/download.ni-visa.html))
- **GPIB interface** (e.g., NI GPIB-USB-HS) connected to Keithley 2602

### For Development

- [Rust](https://rustup.rs/) (stable)
- [Node.js](https://nodejs.org/) (v22+)
- [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/) with "Desktop development with C++" workload
- Tauri CLI: `cargo install tauri-cli`

---

## Getting Started

```bash
# Clone the repository
git clone https://github.com/hasnain7abbas/neuromorphic-tester.git
cd neuromorphic-tester

# Install frontend dependencies
npm install

# Run in development mode
cargo tauri dev

# Build for production
cargo tauri build
```

The production build outputs `.msi` and `.exe` installers in `src-tauri/target/release/bundle/`.

---

## Project Structure

```
neuromorphic-tester/
├── src/                            # React frontend
│   ├── components/
│   │   ├── ConfigPanel.tsx             # Test parameter inputs
│   │   ├── ConnectionPanel.tsx         # VISA resource + connect/disconnect
│   │   ├── ControlBar.tsx              # Start / Abort / Clear / Export
│   │   ├── DataTable.tsx               # Measurement data table
│   │   ├── GraphPanel.tsx              # Plotly charts (I-V, I-t, R-Cycle, Log I-V)
│   │   ├── ScriptEditor.tsx            # Monaco editor for TSP/Lua
│   │   ├── SessionHistory.tsx          # Saved sessions sidebar
│   │   └── StatusBar.tsx               # Status, reading count, errors
│   ├── hooks/
│   │   ├── useDataStream.ts            # Real-time data event listener
│   │   ├── useSMUConnection.ts         # GPIB connection state
│   │   └── useSession.ts              # Session CRUD + auto-recording
│   ├── lib/
│   │   ├── templates.ts               # 30+ TSP test script templates
│   │   ├── tauri-commands.ts          # Typed Tauri IPC wrappers
│   │   └── types.ts                   # TypeScript interfaces
│   ├── App.tsx
│   └── main.tsx
│
├── src-tauri/                      # Rust backend
│   ├── src/
│   │   ├── smu/
│   │   │   ├── connection.rs           # NI-VISA GPIB FFI (visa64.dll)
│   │   │   ├── commands.rs             # TSP command helpers
│   │   │   └── parser.rs              # SMU response parser
│   │   ├── recording/
│   │   │   ├── session.rs             # SQLite session manager
│   │   │   ├── csv_export.rs          # CSV export
│   │   │   └── xlsx_export.rs         # XLSX export
│   │   ├── commands.rs                # Tauri IPC command handlers
│   │   ├── state.rs                   # App state (Arc<Mutex<...>>)
│   │   └── lib.rs                     # Module tree + Tauri builder
│   └── tauri.conf.json
│
├── .github/workflows/
│   ├── ci.yml                         # TypeScript + Rust checks
│   └── release.yml                    # Auto version bump + GitHub Release
│
└── package.json
```

---

## Test Templates

### SMU-Only Tests

| Template | Description |
|----------|-------------|
| EPSC | Excitatory Post-Synaptic Current — baseline, pulse, decay |
| PPF | Paired-Pulse Facilitation — two pulses, measure A2/A1 ratio |
| PPD | Paired-Pulse Depression — negative pulse variant of PPF |
| SDDP | Spike-Duration Dependent Plasticity — conductance vs pulse count |
| SDDP Decay | Single pulse then conductance decay monitoring |
| SRDP | Spike-Rate Dependent Plasticity — conductance vs frequency |
| STDP | Spike-Timing Dependent Plasticity — weight change vs delta-t |
| SNDP | Spike-Number Dependent Plasticity — weight change vs pulse count |
| LTP/LTD | Long-Term Potentiation + Depression training cycles |
| Learning/Forgetting | Memory retention vs training amount |
| STP to LTP | Short-term to long-term plasticity transition |
| Multi-Level Conductance | Analog conductance staircase |
| Linearity Test | LTP/LTD symmetry and nonlinearity quantification |
| Bipolar I-V Sweep | Full hysteresis loop characterization |
| Endurance | SET/RESET cycling reliability |
| Retention | HRS/LRS state stability over time |
| Frequency Response | Current accumulation at different pulse frequencies |

### DS345 Function Generator Triggered Tests

All DS345 variants use `digio.trigger[]` for hardware-timed pulses via the 25-pin Digital I/O connector. The Digital I/O line number is configurable (default: Pin 1).

**Wiring:** DS345 BNC output to Pin 1 (or configured pin), DS345 BNC shield to Pin 12 (Digital Ground). DS345 settings: Square wave, 5 Vpp, Offset +2.5V.

Available: EPSC, PPF, SDDP, SDDP Decay, SRDP, STDP, SNDP, LTP/LTD, Endurance, Frequency Response, Learning/Forgetting.

### Utility

| Template | Description |
|----------|-------------|
| Device Reset | Rest device at 0V between experiments |
| Custom Script | Write arbitrary TSP/Lua code |

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + Enter` | Start test |
| `Escape` | Abort running test |
| `Ctrl + S` | Export data |

---

## CI/CD

Automated via GitHub Actions:

- **CI** (`ci.yml`) — Runs on every push and PR to `main`. Validates TypeScript (`tsc`) and Rust (`cargo check`).
- **Release** (`release.yml`) — On push to `main`, automatically bumps the patch version, builds Windows installers (`.msi` + `.exe`), and creates a GitHub Release with the binaries attached.

Version is synced across `tauri.conf.json`, `package.json`, and `Cargo.toml` automatically. No manual version editing needed.

---

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

---

## License

This project is for academic research purposes.
