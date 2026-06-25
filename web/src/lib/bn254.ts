// Convert a snarkjs Groth16 (BN254) proof + public signals into the byte layout
// the Stellar `bn254` host functions expect. Mirrors circuits/export_fixture.mjs.
//
//   Fr/Fp  : 32-byte big-endian
//   G1Affine: be(X) || be(Y)                               (64 bytes)
//   G2Affine: be(X.c1)||be(X.c0)||be(Y.c1)||be(Y.c0)       (128 bytes)
// snarkjs gives G2 coords as [c0, c1]; proof.A is negated (−A).
import type { Groth16Proof } from 'snarkjs'

// BN254 base field prime (Fq), for point negation.
const FQ =
  21888242871839275222246405745257275088696311157297823662689037894645226208583n

function to32BE(dec: string | bigint): Uint8Array {
  let x = BigInt(dec)
  const out = new Uint8Array(32)
  for (let i = 31; i >= 0; i--) {
    out[i] = Number(x & 0xffn)
    x >>= 8n
  }
  return out
}
function concat(arrs: Uint8Array[]): Uint8Array {
  const len = arrs.reduce((n, a) => n + a.length, 0)
  const out = new Uint8Array(len)
  let o = 0
  for (const a of arrs) {
    out.set(a, o)
    o += a.length
  }
  return out
}

const g1 = (p: string[]) => concat([to32BE(p[0]), to32BE(p[1])])
const g2 = (p: string[][]) =>
  concat([to32BE(p[0][1]), to32BE(p[0][0]), to32BE(p[1][1]), to32BE(p[1][0])])
const negG1 = (p: string[]) =>
  concat([to32BE(p[0]), to32BE((FQ - (BigInt(p[1]) % FQ)) % FQ)])

export interface OnChainProof {
  a: Uint8Array // 64 (−A)
  b: Uint8Array // 128
  c: Uint8Array // 64
}

export interface OnChainClaim {
  proof: OnChainProof
  signals: Uint8Array[] // each 32 bytes: [root, nullifierHash, recipient]
}

export function witnessToOnChain(
  proof: Groth16Proof,
  publicSignals: string[]
): OnChainClaim {
  return {
    proof: {
      a: negG1(proof.pi_a),
      b: g2(proof.pi_b),
      c: g1(proof.pi_c),
    },
    signals: publicSignals.map((s) => to32BE(s)),
  }
}

export function toHex(u8: Uint8Array): string {
  return Array.from(u8)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
