export type GateType = 'H' | 'X' | 'Y' | 'Z' | 'CNOT'

export interface Gate {
  id: string
  type: GateType
  column: number
  target: number
  control?: number
}

export interface Complex {
  re: number
  im: number
}

export interface QuantumState {
  amplitudes: Complex[]
  probabilities: number[]
}

export interface Preset {
  id: string
  name: string
  description: string
  gates: Gate[]
}
