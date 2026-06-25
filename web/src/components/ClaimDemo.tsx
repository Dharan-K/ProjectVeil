import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { SectionTitle, Mono } from './ui'
import MerkleTreeViz from './MerkleTreeViz'
import {
  buildOrg,
  makeImpostor,
  proveClaim,
  verifyClaim,
  randField,
  type Org,
  type Identity,
  type ClaimWitness,
} from '../lib/prover'
import { submitClaim, EXPLORER_CONTRACT, CONTRACT_ID, type OnChainResult, type OnChainMode } from '../lib/stellar'
import { addressToField } from '../lib/veilTree'
import { useWallet } from './WalletContext'

const MEMBERS = 8

type Phase = 'loading' | 'pick' | 'ticket' | 'proving' | 'proved' | 'submitting' | 'done' | 'rejected'

const proveStages = [
  'Computing Poseidon commitment',
  'Walking Merkle path to root',
  'Generating R1CS witness',
  'Building Groth16 proof (BN254)',
]

function fakeStellarAddr() {
  const base32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let s = 'G'
  for (let i = 0; i < 55; i++) s += base32[Math.floor(Math.random() * base32.length)]
  return s
}

export default function ClaimDemo() {
  const [org, setOrg] = useState<Org | null>(null)
  const [identities, setIdentities] = useState<Identity[]>([])
  const [impostor, setImpostor] = useState<Identity | null>(null)
  const [spent, setSpent] = useState<Set<string>>(new Set())

  const [selected, setSelected] = useState<Identity | null>(null)
  const [phase, setPhase] = useState<Phase>('loading')
  const [stage, setStage] = useState(0)
  const [witness, setWitness] = useState<ClaimWitness | null>(null)
  const [onchain, setOnchain] = useState<OnChainResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [recipient] = useState(() => ({ addr: fakeStellarAddr(), field: randField() }))
  const [mode, setMode] = useState<OnChainMode>('testnet')
  const wallet = useWallet()
  const built = useRef(false)

  // The address the disbursement is bound to: the connected wallet if any.
  const claimAddr = wallet.address ?? recipient.addr

  useEffect(() => {
    if (built.current) return
    built.current = true
    ;(async () => {
      const { org, identities } = await buildOrg(MEMBERS)
      const imp = await makeImpostor()
      setOrg(org)
      setIdentities(identities)
      setImpostor(imp)
      setPhase('pick')
    })()
  }, [])

  function choose(id: Identity) {
    setSelected(id)
    setWitness(null)
    setOnchain(null)
    setError(null)
    setPhase('ticket')
  }

  async function runProof() {
    if (!org || !selected) return
    setPhase('proving')
    setStage(0)
    setError(null)
    const ticker = setInterval(
      () => setStage((s) => Math.min(s + 1, proveStages.length - 1)),
      550
    )
    try {
      // Bind the proof to the connected wallet address when present, so the
      // proof is cryptographically tied to whoever is claiming.
      const recipientField = wallet.address
        ? await addressToField(new TextEncoder().encode(wallet.address))
        : recipient.field
      const w = await proveClaim(org, selected, recipientField)
      clearInterval(ticker)
      setStage(proveStages.length - 1)
      setWitness(w)
      setPhase('proved')
    } catch {
      clearInterval(ticker)
      setError(
        'Witness generation failed — this wallet’s commitment is not in the approved Merkle tree. No valid proof exists.'
      )
      setPhase('rejected')
    }
  }

  async function submit() {
    if (!witness) return
    setPhase('submitting')
    const key = witness.nullifierHash.toString()

    // Always confirm the proof verifies locally first (instant feedback).
    const localOk = await verifyClaim(witness)
    if (!localOk) {
      setError('Proof failed verification.')
      setPhase('rejected')
      return
    }

    // In local mode we enforce the nullifier rule in-memory; on testnet the
    // deployed contract is the source of truth and will reject replays itself.
    if (mode === 'local' && spent.has(key)) {
      setError('This nullifier has already been spent. Double-claim rejected.')
      setPhase('rejected')
      return
    }

    const signer =
      mode === 'testnet' && wallet.address
        ? { address: wallet.address, signXdr: wallet.signXdr }
        : undefined
    const result = await submitClaim(witness, claimAddr, mode, signer)
    if (!result.ok) {
      setError(result.error ?? 'On-chain verification failed.')
      setPhase('rejected')
      return
    }
    setSpent((prev) => new Set(prev).add(key))
    setOnchain(result)
    setPhase('done')
  }

  function reset() {
    setSelected(null)
    setWitness(null)
    setOnchain(null)
    setError(null)
    setPhase('pick')
  }

  const allIdentities = impostor ? [...identities, impostor] : identities
  const highlight = selected ? selected.index : -1

  return (
    <section id="demo" className="relative mx-auto max-w-6xl px-4 py-28">
      <SectionTitle
        kicker="Live demo"
        title="Claim a disbursement, privately"
        sub="Everything below runs for real in your browser: Poseidon hashing, Merkle proofs, and a genuine Groth16 zk-SNARK. Nothing is faked except the disbursed funds."
      />

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        {/* LEFT: control panel */}
        <div className="glass rounded-2xl p-6 sm:p-8">
          {/* recipient identity bar */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-veil-border bg-black/20 px-4 py-3">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-veil-dim">
                {wallet.address ? 'Connected wallet' : 'Claiming wallet (demo)'}
              </div>
              <Mono value={claimAddr} chars={6} />
            </div>
            <div className="text-right">
              <div className="text-[11px] uppercase tracking-wider text-veil-dim">Org Merkle root</div>
              {org ? <Mono value={org.root} chars={6} /> : <span className="text-veil-dim">…</span>}
            </div>
          </div>

          {/* verification mode toggle */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex rounded-lg border border-veil-border bg-black/20 p-1 text-xs">
              {(['testnet', 'local'] as OnChainMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                    mode === m ? 'bg-veil-violet/30 text-white' : 'text-veil-dim hover:text-veil-text'
                  }`}
                >
                  {m === 'testnet' ? '🛰️ Verify on testnet' : '💻 Local verify'}
                </button>
              ))}
            </div>
            <a
              href={EXPLORER_CONTRACT}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-veil-dim underline transition-colors hover:text-veil-cyan"
              title={CONTRACT_ID}
            >
              contract ↗
            </a>
          </div>

          <AnimatePresence mode="wait">
            {phase === 'loading' && (
              <Stage key="loading">
                <div className="flex items-center gap-3 text-veil-dim">
                  <Spinner /> Building approved-recipient tree (Poseidon)…
                </div>
              </Stage>
            )}

            {(phase === 'pick' || phase === 'ticket' || phase === 'rejected') && (
              <Stage key="pick">
                <Label>Step 1 · Act as a recipient</Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {allIdentities.map((id) => {
                    const isImp = id.index === -1
                    const isSel = selected?.commitment === id.commitment
                    return (
                      <motion.button
                        key={id.label}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => choose(id)}
                        className={`rounded-lg border px-3 py-2.5 text-left text-xs transition-colors ${
                          isSel
                            ? 'border-veil-violet bg-veil-violet/15 text-white'
                            : isImp
                            ? 'border-veil-pink/40 bg-veil-pink/5 text-veil-pink/90 hover:bg-veil-pink/10'
                            : 'border-veil-border bg-white/5 text-veil-text hover:bg-white/10'
                        }`}
                      >
                        <div className="font-semibold">{isImp ? '🚫 Impostor' : id.label}</div>
                        <div className="text-[10px] text-veil-dim">
                          {isImp ? 'not on allowlist' : 'on allowlist'}
                        </div>
                      </motion.button>
                    )
                  })}
                </div>

                {selected && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-5"
                  >
                    <Label>Step 2 · Your private claim ticket</Label>
                    <div className="space-y-1.5 rounded-xl border border-veil-border bg-black/20 p-4 text-xs">
                      <Row k="nullifier (secret)" v={<Mono value={selected.nullifier} />} />
                      <Row k="secret" v={<Mono value={selected.secret} />} />
                      <Row k="commitment = Poseidon(n, s)" v={<Mono value={selected.commitment} />} />
                    </div>
                    <button
                      onClick={runProof}
                      className="glow-btn mt-5 w-full rounded-xl bg-white/10 px-6 py-3.5 font-display text-sm font-semibold text-white transition-colors hover:bg-white/15"
                    >
                      ⚡ Generate zero-knowledge proof
                    </button>
                  </motion.div>
                )}

                {error && phase === 'rejected' && <ErrorCard msg={error} onReset={reset} />}
              </Stage>
            )}

            {phase === 'proving' && (
              <Stage key="proving">
                <Label>Generating proof in your browser</Label>
                <div className="space-y-3">
                  {proveStages.map((s, i) => (
                    <div key={s} className="flex items-center gap-3">
                      {i < stage ? (
                        <Check />
                      ) : i === stage ? (
                        <Spinner />
                      ) : (
                        <div className="h-4 w-4 rounded-full border border-veil-border" />
                      )}
                      <span className={i <= stage ? 'text-veil-text' : 'text-veil-dim'}>{s}</span>
                    </div>
                  ))}
                </div>
              </Stage>
            )}

            {(phase === 'proved' || phase === 'submitting') && witness && (
              <Stage key="proved">
                <Label>Step 3 · Proof generated in {witness.ms} ms</Label>
                <div className="space-y-1.5 rounded-xl border border-veil-border bg-black/20 p-4 text-xs">
                  <Row k="public · root" v={<Mono value={witness.publicSignals[0]} />} />
                  <Row k="public · nullifierHash" v={<Mono value={witness.publicSignals[1]} />} />
                  <Row k="public · recipient" v={<Mono value={witness.publicSignals[2]} />} />
                  <div className="!mt-3 border-t border-veil-border pt-2">
                    <Row k="proof.π_a" v={<Mono value={witness.proof.pi_a[0]} />} />
                    <Row k="proof.π_c" v={<Mono value={witness.proof.pi_c[0]} />} />
                  </div>
                </div>
                <p className="mt-3 text-xs text-veil-dim">
                  Notice: the proof exposes the <span className="text-veil-teal">root</span> and a
                  one-time <span className="text-veil-teal">nullifier</span> — but never which leaf,
                  nullifier, or secret produced it.
                </p>
                <button
                  onClick={submit}
                  disabled={phase === 'submitting'}
                  className="glow-btn mt-5 w-full rounded-xl bg-white/10 px-6 py-3.5 font-display text-sm font-semibold text-white transition-colors hover:bg-white/15 disabled:opacity-60"
                >
                  {phase === 'submitting' ? (
                    <span className="flex items-center justify-center gap-2">
                      <Spinner /> {mode === 'testnet' ? 'Verifying on Stellar testnet…' : 'Verifying locally…'}
                    </span>
                  ) : mode === 'testnet' ? (
                    '🛰️ Verify & claim on Stellar testnet'
                  ) : (
                    '💻 Verify & claim (local)'
                  )}
                </button>
              </Stage>
            )}

            {phase === 'done' && onchain && (
              <Stage key="done">
                <SuccessCard onchain={onchain} onReset={reset} />
              </Stage>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT: tree viz */}
        <div className="glass flex flex-col rounded-2xl p-6 sm:p-8">
          <Label>Approved-recipient Merkle tree</Label>
          <div className="flex flex-1 items-center">
            <MerkleTreeViz
              leafCount={MEMBERS}
              highlight={highlight}
              active={phase === 'proving' || phase === 'proved' || phase === 'submitting' || phase === 'done'}
            />
          </div>
          <div className="mt-4 flex items-center justify-between text-[11px] text-veil-dim">
            <span>{MEMBERS} leaves shown · circuit depth 10</span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-veil-cyan" /> inclusion path
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- small presentational helpers ---------- */

function Stage({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  )
}
function Label({ children }: { children: React.ReactNode }) {
  return <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-veil-violet">{children}</div>
}
function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-veil-dim">{k}</span>
      {v}
    </div>
  )
}
function Spinner() {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
      className="h-4 w-4 rounded-full border-2 border-veil-cyan border-t-transparent"
    />
  )
}
function Check() {
  return (
    <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }} className="h-4 w-4 text-veil-teal" viewBox="0 0 24 24" fill="none">
      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </motion.svg>
  )
}
function ErrorCard({ msg, onReset }: { msg: string; onReset: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mt-5 rounded-xl border border-veil-pink/40 bg-veil-pink/10 p-4 text-sm text-veil-pink"
    >
      <div className="font-semibold">Claim rejected</div>
      <p className="mt-1 text-xs text-veil-pink/80">{msg}</p>
      <button onClick={onReset} className="mt-3 text-xs underline">
        Try another recipient
      </button>
    </motion.div>
  )
}

function SuccessCard({ onchain, onReset }: { onchain: OnChainResult; onReset: () => void }) {
  return (
    <div className="relative">
      <Confetti />
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
        className="rounded-2xl border border-veil-teal/40 bg-veil-teal/10 p-6 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 260 }}
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-veil-teal/20"
        >
          <Check />
        </motion.div>
        <h3 className="mt-4 font-display text-xl font-semibold text-white">Disbursement released</h3>
        <p className="mt-1 text-sm text-veil-dim">
          Proof verified {onchain.mode === 'testnet' ? 'on Stellar testnet' : 'and nullifier spent'} ·
          identity never revealed.
        </p>
        <div className="mt-4 space-y-1.5 rounded-xl border border-veil-border bg-black/30 p-4 text-left text-xs">
          <Row k="status" v={<span className="text-veil-teal">VERIFIED ✓</span>} />
          <Row k="nullifier spent" v={<Mono value={onchain.nullifierHash} chars={6} />} />
          <Row
            k={onchain.mode === 'testnet' ? 'tx hash (on-chain)' : 'tx hash (simulated)'}
            v={
              onchain.explorerUrl ? (
                <a href={onchain.explorerUrl} target="_blank" rel="noreferrer" className="mono text-veil-cyan underline">
                  {onchain.txHash.slice(0, 10)}…
                </a>
              ) : (
                <Mono value={onchain.txHash} chars={6} />
              )
            }
          />
        </div>
        <button onClick={onReset} className="mt-4 text-xs text-veil-dim underline">
          Run another claim
        </button>
      </motion.div>
    </div>
  )
}

function Confetti() {
  const bits = Array.from({ length: 28 })
  const colors = ['#7c5cff', '#22d3ee', '#2dd4bf', '#f472b6']
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {bits.map((_, i) => (
        <motion.span
          key={i}
          className="absolute left-1/2 top-1/2 h-2 w-2"
          style={{ background: colors[i % colors.length], borderRadius: i % 2 ? 999 : 2 }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{
            x: (Math.random() - 0.5) * 360,
            y: (Math.random() - 0.5) * 320,
            opacity: 0,
            rotate: Math.random() * 360,
          }}
          transition={{ duration: 1.1 + Math.random() * 0.6, ease: 'easeOut' }}
        />
      ))}
    </div>
  )
}
