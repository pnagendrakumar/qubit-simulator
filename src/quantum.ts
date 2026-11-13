import type { Complex, Gate, GateType, QuantumState } from './types'

export const MAX_QUBITS = 3

export const complex = (re: number, im = 0): Complex => ({ re, im })
const add = (a: Complex, b: Complex): Complex => complex(a.re + b.re, a.im + b.im)
const multiply = (a: Complex, b: Complex): Complex =>
  complex(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re)

const matrices: Record<Exclude<GateType, 'CNOT'>, Complex[][]> = {
  H: [[complex(1 / Math.sqrt(2)), complex(1 / Math.sqrt(2))], [complex(1 / Math.sqrt(2)), complex(-1 / Math.sqrt(2))]],
  X: [[complex(0), complex(1)], [complex(1), complex(0)]],
  Y: [[complex(0), complex(0, -1)], [complex(0, 1), complex(0)]],
  Z: [[complex(1), complex(0)], [complex(0), complex(-1)]],
}

const applySingleQubitGate = (state: Complex[], gate: GateType, qubit: number, qubitCount: number) => {
  const matrix = matrices[gate as Exclude<GateType, 'CNOT'>]
  const result = state.map(() => complex(0))
  // Apply the 2x2 unitary to each pair of basis states that differs at `qubit`.
  for (let basis = 0; basis < state.length; basis += 1) {
    const bit = (basis >> (qubitCount - qubit - 1)) & 1
    for (let outputBit = 0; outputBit < 2; outputBit += 1) {
      const output = bit === outputBit ? basis : basis ^ (1 << (qubitCount - qubit - 1))
      result[output] = add(result[output], multiply(matrix[outputBit][bit], state[basis]))
    }
  }
  return result
}

const applyCnot = (state: Complex[], control: number, target: number, qubitCount: number) => {
  const result = state.map(() => complex(0))
  const controlMask = 1 << (qubitCount - control - 1)
  const targetMask = 1 << (qubitCount - target - 1)
  // A controlled-NOT flips only the target bit when the control bit is 1.
  for (let basis = 0; basis < state.length; basis += 1) {
    const output = (basis & controlMask) !== 0 ? basis ^ targetMask : basis
    result[output] = add(result[output], state[basis])
  }
  return result
}

export function simulateCircuit(qubitCount: number, gates: Gate[]): QuantumState {
  if (!Number.isInteger(qubitCount) || qubitCount < 1 || qubitCount > MAX_QUBITS) {
    throw new Error(`Qubit count must be between 1 and ${MAX_QUBITS}.`)
  }
  let amplitudes = Array.from({ length: 2 ** qubitCount }, (_, index) => complex(index === 0 ? 1 : 0))
  const orderedGates = [...gates].sort((a, b) => a.column - b.column || a.target - b.target)
  for (const gate of orderedGates) {
    if (gate.target < 0 || gate.target >= qubitCount) throw new Error('Gate target is outside the circuit.')
    if (gate.type === 'CNOT') {
      if (gate.control === undefined || gate.control < 0 || gate.control >= qubitCount || gate.control === gate.target) {
        throw new Error('CNOT requires a distinct control qubit.')
      }
      amplitudes = applyCnot(amplitudes, gate.control, gate.target, qubitCount)
    } else {
      amplitudes = applySingleQubitGate(amplitudes, gate.type, gate.target, qubitCount)
    }
  }
  return {
    amplitudes,
    probabilities: amplitudes.map((amplitude) => amplitude.re ** 2 + amplitude.im ** 2),
  }
}

export function measure(probabilities: number[], random = Math.random()): number {
  const total = probabilities.reduce((sum, probability) => sum + probability, 0)
  if (total <= 0) throw new Error('Cannot measure a state with no probability mass.')
  const threshold = random * total
  let cumulative = 0
  for (let index = 0; index < probabilities.length; index += 1) {
    cumulative += probabilities[index]
    if (threshold < cumulative) return index
  }
  return probabilities.length - 1
}

export function formatComplex(value: Complex): string {
  const re = Math.abs(value.re) < 1e-10 ? 0 : value.re
  const im = Math.abs(value.im) < 1e-10 ? 0 : value.im
  if (im === 0) return re.toFixed(3)
  if (re === 0) return `${im.toFixed(3)}i`
  return `${re.toFixed(3)} ${im >= 0 ? '+' : '-'} ${Math.abs(im).toFixed(3)}i`
}

export function basisLabel(index: number, qubitCount: number): string {
  return index.toString(2).padStart(qubitCount, '0')
}

export function blochVector(state: QuantumState, qubit: number, qubitCount: number) {
  let x = 0
  let y = 0
  let z = 0
  const bit = 1 << (qubitCount - qubit - 1)
  for (let index = 0; index < state.amplitudes.length; index += 1) {
    if ((index & bit) === 0) {
      const paired = index | bit
      const a = state.amplitudes[index]
      const b = state.amplitudes[paired]
      x += 2 * (a.re * b.re + a.im * b.im)
      y += 2 * (a.re * b.im - a.im * b.re)
      z += state.probabilities[index] - state.probabilities[paired]
    }
  }
  return { x, y, z }
}
