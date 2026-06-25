import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// snarkjs + circomlibjs rely on a few Node builtins (Buffer, crypto, etc.)
// when generating proofs in the browser, so we polyfill them.
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    nodePolyfills({
      include: ['buffer', 'crypto', 'stream', 'util', 'process'],
      globals: { Buffer: true, process: true },
    }),
  ],
  optimizeDeps: {
    exclude: ['snarkjs'],
  },
})
