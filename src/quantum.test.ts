import { describe, expect, it } from 'vitest'
import { basisLabel, measure, simulateCircuit } from './quantum'
import type { Gate } from './types'

const gate = (type: Gate['type'], column: number, target: number, control?: number): Gate => ({
  id: `${type}-${column}-${target}`,
  type,
  column,
  target,
  control,
})

describe('quantum simulator', () => {
  it('creates a balanced superposition with H', () => {
    const state = simulateCircuit(1, [gate('H', 0, 0)])
    expect(state.probabilities[0]).toBeCloseTo(0.5)
    expect(state.probabilities[1]).toBeCloseTo(0.5)
  })

  it('simulates a Bell state with H and CNOT', () => {
    const state = simulateCircuit(2, [gate('H', 0, 0), gate('CNOT', 1, 1, 0)])
    expect(state.probabilities[0]).toBeCloseTo(0.5)
    expect(state.probabilities[1]).toBeCloseTo(0)
    expect(state.probabilities[2]).toBeCloseTo(0)
    expect(state.probabilities[3]).toBeCloseTo(0.5)
  })

  it('samples based on cumulative probability', () => {
    expect(measure([0, 0.75, 0.25], 0.5)).toBe(1)
    expect(basisLabel(3, 2)).toBe('11')
  })
})
