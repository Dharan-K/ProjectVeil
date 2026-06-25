import * as snarkjs from 'snarkjs'
import type { Groth16Proof } from 'snarkjs'
import {
  LEVELS,
  FIELD,
  commitmentOf,
  nullifierHashOf,
  buildTree,
  merkleProof,
} from './veilTree'

const WASM_URL = '/zk/veil.wasm'
const ZKEY_URL = '/zk/veil_final.zkey'
const VKEY_URL = '/zk/verification_key.json'

export interface Identity {
  label: string
  nullifier: bigint
  secret: bigint
  commitment: bigint
  /** index in the org's tree, or -1 if this identity is NOT approved */
  index: number
}

export interface Org {
  root: bigint
  layers: bigint[][]
  members: bigint[]
}

export interface ClaimWitness {
  proof: Groth16Proof
  publicSignals: string[]
  nullifierHash: bigint
  ms: number
}

/** Cryptographically-random BN254 field element. */
export function randField(): bigint {
  const bytes = crypto.getRandomValues(new Uint8Array(31))
  let x = 0n
  for (const b of bytes) x = (x << 8n) + BigInt(b)
  return x % FIELD
}

/** Build an organization's approved-recipient Merkle tree. */
export async function buildOrg(count: number): Promise<{ org: Org; identities: Identity[] }> {
  const identities: Identity[] = []
  for (let i = 0; i < count; i++) {
    const nullifier = randField()
    const secret = randField()
    const commitment = await commitmentOf(nullifier, secret)
    identities.push({ label: `Recipient #${i + 1}`, nullifier, secret, commitment, index: i })
  }
  const { root, layers } = await buildTree(identities.map((id) => id.commitment))
  return { org: { root, layers, members: identities.map((i) => i.commitment) }, identities }
}

/** Create an identity that is NOT in the tree (for the rejection demo). */
export async function makeImpostor(): Promise<Identity> {
  const nullifier = randField()
  const secret = randField()
  const commitment = await commitmentOf(nullifier, secret)
  return { label: 'Unapproved wallet', nullifier, secret, commitment, index: -1 }
}

/**
 * Generate a zero-knowledge eligibility proof for `identity` claiming to
 * `recipientField`. Throws if the identity is not actually in the tree
 * (the Merkle root constraint fails during witness generation).
 */
export async function proveClaim(
  org: Org,
  identity: Identity,
  recipientField: bigint
): Promise<ClaimWitness> {
  // Locate the identity in the current member set (handles re-derivation).
  const index = org.members.findIndex((m) => m === identity.commitment)
  if (index === -1) {
    // Still attempt — witness gen will fail, surfacing a clean "ineligible" error.
  }
  const { pathElements, pathIndices } = merkleProof(org.layers, index === -1 ? 0 : index, LEVELS)
  const nullifierHash = await nullifierHashOf(identity.nullifier)

  const input = {
    root: org.root.toString(),
    nullifierHash: nullifierHash.toString(),
    recipient: recipientField.toString(),
    nullifier: identity.nullifier.toString(),
    secret: identity.secret.toString(),
    pathElements: pathElements.map((x) => x.toString()),
    pathIndices: pathIndices.map((x) => x.toString()),
  }

  const t0 = performance.now()
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, WASM_URL, ZKEY_URL)
  const ms = Math.round(performance.now() - t0)
  return { proof, publicSignals, nullifierHash, ms }
}

let cachedVkey: unknown = null
export async function verifyClaim(witness: ClaimWitness): Promise<boolean> {
  if (!cachedVkey) cachedVkey = await fetch(VKEY_URL).then((r) => r.json())
  return snarkjs.groth16.verify(cachedVkey, witness.publicSignals, witness.proof)
}
