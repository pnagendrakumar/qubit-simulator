# QUBIT

QUBIT is a local React + TypeScript quantum circuit simulator. It includes a state-vector engine, a visual circuit editor for one to three qubits, measurement sampling, probability charts, presets, and an interactive Three.js Bloch sphere.

## Run locally

Requires Node.js 18+.

```bash
npm install
npm run dev
```

Open the local Vite URL shown in the terminal. The test suite and production build are:

```bash
npm test
npm run build
```

Select a gate in the left palette, then click an empty circuit cell to place it. Click a placed gate to remove it. CNOT uses the clicked qubit as the target and automatically selects the adjacent qubit as its control.
