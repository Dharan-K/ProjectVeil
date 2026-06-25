import { motion } from 'framer-motion'
import { SectionTitle } from './ui'

const steps = [
  {
    n: '01',
    title: 'Org publishes a Merkle root',
    body: 'An NGO, DAO, or payroll provider commits the set of approved recipients as a Merkle root of Poseidon commitments — published on Stellar. Individual identities never leave their owners.',
    accent: 'var(--color-veil-violet)',
  },
  {
    n: '02',
    title: 'You hold a secret claim ticket',
    body: 'Each recipient privately holds (nullifier, secret). Their leaf is Poseidon(nullifier, secret). Knowing it proves eligibility — but the value alone reveals nothing about who they are.',
    accent: 'var(--color-veil-cyan)',
  },
  {
    n: '03',
    title: 'Browser builds a ZK proof',
    body: 'snarkjs generates a Groth16 proof in your browser: "my commitment is in the tree" — without disclosing which leaf — plus a nullifier hash that can only ever be spent once.',
    accent: 'var(--color-veil-teal)',
  },
  {
    n: '04',
    title: 'Stellar verifies on-chain',
    body: 'A Soroban contract verifies the BN254 proof using Stellar’s native ZK host functions, records the nullifier to block double-claims, and releases the disbursement. ~300 bytes, pennies to verify.',
    accent: 'var(--color-veil-pink)',
  },
]

export default function HowItWorks() {
  return (
    <section id="how" className="relative mx-auto max-w-6xl px-4 py-28">
      <SectionTitle
        kicker="The flow"
        title="Eligibility, not identity"
        sub="Four steps from a private allowlist to an on-chain claim — with zero personal data exposed at any point."
      />
      <div className="grid gap-5 md:grid-cols-2">
        {steps.map((s, i) => (
          <motion.div
            key={s.n}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, delay: (i % 2) * 0.1 }}
            whileHover={{ y: -4 }}
            className="glass group relative overflow-hidden rounded-2xl p-7"
          >
            <div
              className="absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-20 blur-3xl transition-opacity group-hover:opacity-40"
              style={{ background: s.accent }}
            />
            <div className="mono mb-4 text-sm" style={{ color: s.accent }}>{s.n}</div>
            <h3 className="font-display text-xl font-semibold text-white">{s.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-veil-dim">{s.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
