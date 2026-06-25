import { motion } from 'framer-motion'
import { SectionTitle } from './ui'

const layers = [
  {
    name: 'Circom + Groth16',
    role: 'The circuit',
    detail: 'Merkle membership + nullifier over Poseidon, ~6.1k constraints. Tiny ~300-byte proofs.',
    color: 'var(--color-veil-violet)',
  },
  {
    name: 'snarkjs (in-browser)',
    role: 'The prover',
    detail: 'Witness + Groth16 proof generated client-side via WASM. Secrets never leave the device.',
    color: 'var(--color-veil-cyan)',
  },
  {
    name: 'Soroban verifier',
    role: 'On-chain',
    detail: 'Rust contract verifies the BN254 pairing using Stellar’s Protocol 25/26 ZK host functions.',
    color: 'var(--color-veil-teal)',
  },
  {
    name: 'Stellar testnet',
    role: 'Settlement',
    detail: 'Records the spent nullifier and releases the stablecoin disbursement — cheaply and finally.',
    color: 'var(--color-veil-pink)',
  },
]

export default function Stack() {
  return (
    <section id="stack" className="relative mx-auto max-w-6xl px-4 py-28">
      <SectionTitle
        kicker="Architecture"
        title="ZK is doing the work"
        sub="Remove the proof and the whole thing collapses into a public spreadsheet of who got paid. The zero-knowledge layer is load-bearing, not decorative."
      />
      <div className="relative">
        <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-gradient-to-b from-veil-violet/40 via-veil-cyan/40 to-veil-pink/40 md:block" />
        <div className="space-y-4">
          {layers.map((l, i) => (
            <motion.div
              key={l.name}
              initial={{ opacity: 0, x: i % 2 ? 40 : -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6 }}
              className={`glass relative w-full rounded-2xl p-6 md:w-[48%] ${
                i % 2 ? 'md:ml-auto' : ''
              }`}
            >
              <div className="mb-1 text-[11px] uppercase tracking-widest" style={{ color: l.color }}>
                {l.role}
              </div>
              <div className="font-display text-lg font-semibold text-white">{l.name}</div>
              <p className="mt-2 text-sm text-veil-dim">{l.detail}</p>
              <span
                className="absolute top-7 hidden h-3 w-3 rounded-full md:block"
                style={{
                  background: l.color,
                  [i % 2 ? 'left' : 'right']: '-1.65rem',
                  boxShadow: `0 0 12px ${l.color}`,
                }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
