import { VeilMark } from './VeilMark'

export default function Footer() {
  return (
    <footer className="relative mx-auto max-w-6xl px-4 py-16">
      <div className="glass flex flex-col items-center gap-6 rounded-3xl px-6 py-12 text-center">
        <VeilMark className="h-10 w-10" />
        <h2 className="max-w-xl font-display text-2xl font-semibold text-white sm:text-3xl">
          Real-world money. <span className="grad-text">Zero-knowledge</span> privacy.
        </h2>
        <p className="max-w-md text-sm text-veil-dim">
          Built for Stellar Hacks: Real-World ZK. Private eligibility proofs for
          stablecoin disbursements — verified on Stellar.
        </p>
        <div className="flex flex-wrap justify-center gap-3 text-xs text-veil-dim">
          <span className="rounded-full border border-veil-border px-3 py-1">Circom</span>
          <span className="rounded-full border border-veil-border px-3 py-1">Groth16 / BN254</span>
          <span className="rounded-full border border-veil-border px-3 py-1">snarkjs</span>
          <span className="rounded-full border border-veil-border px-3 py-1">Soroban</span>
          <span className="rounded-full border border-veil-border px-3 py-1">Poseidon</span>
        </div>
      </div>
      <p className="mt-8 text-center text-xs text-veil-dim">
        © {new Date().getFullYear()} Veil · A zero-knowledge proof-of-concept on Stellar testnet.
      </p>
    </footer>
  )
}
