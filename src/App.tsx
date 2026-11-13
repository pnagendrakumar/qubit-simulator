import { useMemo, useState } from 'react'
import { BlochSphere } from './BlochSphere'
import { basisLabel, blochVector, formatComplex, measure, simulateCircuit } from './quantum'
import type { Gate, GateType, Preset } from './types'

const GATE_OPTIONS: { type: GateType; label: string; tone: string }[] = [
  { type: 'H', label: 'Hadamard', tone: 'violet' },
  { type: 'X', label: 'Pauli-X', tone: 'cyan' },
  { type: 'Y', label: 'Pauli-Y', tone: 'amber' },
  { type: 'Z', label: 'Pauli-Z', tone: 'rose' },
  { type: 'CNOT', label: 'Controlled-NOT', tone: 'green' },
]

const presets: Preset[] = [
  { id: 'superposition', name: 'Superposition', description: 'H creates equal odds', gates: [{ id: 'p-h', type: 'H', column: 0, target: 0 }] },
  { id: 'flip', name: 'Bit flip', description: 'X rotates |0⟩ to |1⟩', gates: [{ id: 'p-x', type: 'X', column: 0, target: 0 }] },
  { id: 'bell', name: 'Bell state', description: 'Entangle two qubits', gates: [{ id: 'p-h', type: 'H', column: 0, target: 0 }, { id: 'p-cnot', type: 'CNOT', column: 1, target: 1, control: 0 }] },
]

function App() {
  const [qubitCount, setQubitCount] = useState(2)
  const [gates, setGates] = useState<Gate[]>(presets[2].gates)
  const [selectedGate, setSelectedGate] = useState<GateType>('H')
  const [selectedQubit, setSelectedQubit] = useState(0)
  const [selectedBlochQubit, setSelectedBlochQubit] = useState(0)
  const [measurement, setMeasurement] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const columns = Math.max(4, ...gates.map((gate) => gate.column + 1))
  const state = useMemo(() => simulateCircuit(qubitCount, gates), [qubitCount, gates])
  const vector = useMemo(() => blochVector(state, selectedBlochQubit, qubitCount), [state, selectedBlochQubit, qubitCount])

  const addGate = (column: number, target: number) => {
    if (selectedGate === 'CNOT') {
      if (qubitCount < 2) { setNotice('CNOT needs at least two qubits.'); return }
      const control = target === 0 ? 1 : 0
      setGates((current) => [...current, { id: crypto.randomUUID(), type: 'CNOT', column, target, control }])
    } else {
      setGates((current) => [...current, { id: crypto.randomUUID(), type: selectedGate, column, target }])
    }
    setNotice(null)
  }
  const removeGate = (id: string) => setGates((current) => current.filter((gate) => gate.id !== id))
  const loadPreset = (preset: Preset) => {
    const count = preset.id === 'bell' ? 2 : 1
    setQubitCount(count)
    setGates(preset.gates)
    setMeasurement(null)
    setNotice(`${preset.name} experiment loaded`)
  }
  const doMeasure = () => {
    try { setMeasurement(basisLabel(measure(state.probabilities), qubitCount)) } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Measurement failed.')
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark">Ψ</span><div><strong>QUBIT</strong><small>QUANTUM LABORATORY</small></div></div>
        <div className="status"><span className="status-dot" /> Simulator online <span className="divider" /> State vector engine</div>
      </header>
      <div className="workspace">
        <aside className="sidebar">
          <div className="eyebrow">CONFIGURATION</div>
          <h2>Circuit setup</h2>
          <label className="field-label">QUBITS <span>{qubitCount} / 3</span></label>
          <div className="stepper"><button onClick={() => { setQubitCount(Math.max(1, qubitCount - 1)); setGates([]) }}>−</button><b>{qubitCount}</b><button onClick={() => { setQubitCount(Math.min(3, qubitCount + 1)); setGates([]) }}>+</button></div>
          <div className="eyebrow gate-heading">GATE PALETTE</div>
          <div className="gate-list">{GATE_OPTIONS.map((option) => <button key={option.type} className={`gate-option ${selectedGate === option.type ? 'active' : ''}`} onClick={() => setSelectedGate(option.type)}><span className={`gate-icon ${option.tone}`}>{option.type === 'CNOT' ? '⊕' : option.type}</span><span>{option.label}</span><kbd>{option.type === 'CNOT' ? '2Q' : '1Q'}</kbd></button>)}</div>
          <div className="eyebrow preset-heading">PRESETS</div>
          <div className="preset-list">{presets.map((preset) => <button className="preset" key={preset.id} onClick={() => loadPreset(preset)}><span className="preset-icon">{preset.id === 'bell' ? '↗' : preset.id === 'flip' ? '↻' : '✦'}</span><span><b>{preset.name}</b><small>{preset.description}</small></span><span>›</span></button>)}</div>
          <div className="sidebar-footer">QUBIT v1.0.0 <span>•</span> LOCAL MODE</div>
        </aside>
        <section className="circuit-panel">
          <div className="panel-title"><div><div className="eyebrow">WORKSPACE / CIRCUIT</div><h1>Quantum circuit</h1></div><button className="clear-button" onClick={() => { setGates([]); setMeasurement(null) }}>Clear circuit</button></div>
          <div className="circuit-card">
            <div className="circuit-meta"><span><i className="live-dot" /> EDITING</span><span>{gates.length} gate{gates.length === 1 ? '' : 's'}</span></div>
            <div className="circuit-grid" style={{ gridTemplateColumns: `88px repeat(${columns}, minmax(74px, 1fr))` }}>
              <div className="grid-corner">QUBIT</div>{Array.from({ length: columns }, (_, column) => <div className="column-label" key={column}>T{String(column + 1).padStart(2, '0')}</div>)}
              {Array.from({ length: qubitCount }, (_, qubit) => <div className="grid-row" key={qubit}><div className="qubit-label"><b>q{qubit}</b><small>|{qubit === 0 ? '0' : '0'}⟩</small></div>{Array.from({ length: columns }, (_, column) => { const cellGates = gates.filter((gate) => gate.column === column && (gate.target === qubit || gate.control === qubit)); return <button className={`grid-cell ${selectedQubit === qubit ? 'selected' : ''}`} key={column} onClick={() => { setSelectedQubit(qubit); if (!cellGates.length) addGate(column, qubit) }}>{cellGates.map((gate) => <span className={`placed-gate ${gate.type === 'CNOT' ? 'cnot' : gate.type.toLowerCase()}`} title="Click to remove" key={gate.id} onClick={(event) => { event.stopPropagation(); removeGate(gate.id) }}>{gate.type === 'CNOT' ? (gate.control === qubit ? '●' : '⊕') : gate.type}</span>)}</button> })}</div>)}
            </div>
            <p className="hint">Select a gate, then click an empty cell to place it. Click a gate to remove it.</p>
            {notice && <div className="notice">{notice}</div>}
          </div>
          <div className="probability-card"><div className="subheading"><span>MEASUREMENT PROBABILITIES</span><small>Σ {state.probabilities.reduce((a, b) => a + b, 0).toFixed(3)}</small></div><div className="probability-bars">{state.probabilities.map((probability, index) => <div className="probability-row" key={index}><span>|{basisLabel(index, qubitCount)}⟩</span><div className="bar-track"><div className="bar-fill" style={{ width: `${probability * 100}%` }} /></div><b>{(probability * 100).toFixed(1)}%</b></div>)}</div></div>
        </section>
        <aside className="inspector">
          <div className="inspector-header"><div><div className="eyebrow">STATE INSPECTOR</div><h2>Quantum state</h2></div><span className="state-badge">PURE</span></div>
          <div className="state-card"><div className="subheading"><span>AMPLITUDES</span><span>PROBABILITY</span></div>{state.amplitudes.map((amplitude, index) => <div className="amplitude-row" key={index}><span className="basis">|{basisLabel(index, qubitCount)}⟩</span><code>{formatComplex(amplitude)}</code><span className="amp-prob">{(state.probabilities[index] * 100).toFixed(1)}%</span></div>)}</div>
          <div className="bloch-card"><div className="subheading"><span>BLOCH SPHERE</span><select value={selectedBlochQubit} onChange={(event) => setSelectedBlochQubit(Number(event.target.value))}>{Array.from({ length: qubitCount }, (_, index) => <option value={index} key={index}>q{index}</option>)}</select></div><BlochSphere vector={vector} /><div className="bloch-legend"><span>X {vector.x.toFixed(2)}</span><span>Y {vector.y.toFixed(2)}</span><span>Z {vector.z.toFixed(2)}</span></div><small className="rotate-hint">Drag to rotate sphere</small></div>
          <button className="measure-button" onClick={doMeasure}><span>◎</span> Measure circuit <kbd>SPACE</kbd></button>
          {measurement && <div className="measurement-result"><small>MEASUREMENT RESULT</small><strong>|{measurement}⟩</strong><span>Sampled from state probabilities</span></div>}
        </aside>
      </div>
    </main>
  )
}

export default App
