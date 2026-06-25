import type { ClaimWitness } from './prover'

/**
 * On-chain integration layer.
 *
 * mode === 'local'   -> proofs are verified in-browser with snarkjs and a
 *                       deterministic mock tx hash is produced (offline demo).
 * mode === 'testnet' -> the Groth16 proof is submitted to the deployed Soroban
 *                       verifier contract on Stellar testnet, which verifies the
 *                       BN254 pairing on-chain and spends the nullifier.
 */
export type OnChainMode = 'local' | 'testnet'

// Deployed VeilVerifier — see deployment.json.
export const CONTRACT_ID = 'CCZVOEJROWSEN3MQWLSWRJXU5JWEKKLYK6FRWLKPRNAGA2MVSREZPWLA'
export const RPC_URL = 'https://soroban-testnet.stellar.org'
export const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015'
export const EXPLORER_TX = (h: string) =>
  `https://stellar.expert/explorer/testnet/tx/${h}`
export const EXPLORER_CONTRACT = `https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}`

// Throwaway testnet account used only to pay fees for the public demo.
// Testnet XLM has no value; this key is intentionally public.
export const DEMO_SECRET = 'SAO4RV4L2565MRGLT7IDNQJKH4GDL27XKZEAJWNGOBNGIZSUI6W4MDB3'

export interface OnChainResult {
  ok: boolean
  mode: OnChainMode
  txHash: string
  nullifierHash: bigint
  explorerUrl?: string
  error?: string
}

function mockHash(seed: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  let out = ''
  for (let i = 0; i < 8; i++) {
    h = Math.imul(h ^ (h >>> 13), 0x01000193)
    out += (h >>> 0).toString(16).padStart(8, '0')
  }
  return out
}

export async function submitClaim(
  witness: ClaimWitness,
  recipientAddr: string,
  mode: OnChainMode
): Promise<OnChainResult> {
  if (mode === 'local') {
    return {
      ok: true,
      mode,
      txHash: mockHash(witness.nullifierHash.toString() + recipientAddr),
      nullifierHash: witness.nullifierHash,
    }
  }

  // Lazy-load the heavy Stellar SDK only when actually going on-chain.
  const { invokeVerifier } = await import('./soroban')
  return invokeVerifier(witness)
}
