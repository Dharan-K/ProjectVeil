// Shared Veil tree + commitment helpers.
// Used by the test harness now and mirrored by the browser frontend later.
// Poseidon parameters here MUST match the circom `Poseidon` template (circomlib).

import { buildPoseidon } from "circomlibjs";

export const LEVELS = 10;

// BN254 scalar field modulus (the field circom works in).
export const FIELD =
  21888242871839275222246405745257275088548364400416034343698204186575808495617n;

let poseidonInstance = null;
export async function getPoseidon() {
  if (!poseidonInstance) poseidonInstance = await buildPoseidon();
  return poseidonInstance;
}

// Hash helpers that return BigInt field elements.
export async function poseidon(inputs) {
  const p = await getPoseidon();
  return p.F.toObject(p(inputs.map((x) => BigInt(x))));
}

export async function commitmentOf(nullifier, secret) {
  return poseidon([nullifier, secret]);
}

export async function nullifierHashOf(nullifier) {
  return poseidon([nullifier]);
}

// A fixed "zero" leaf for padding empty slots in the tree.
export const ZERO_LEAF =
  21663839004416932945382355908790599225266501822907911457504978515578255421292n;

// Build a fixed-depth Merkle tree (Poseidon) from leaf commitments.
// Returns { root, layers } where layers[0] = leaves, layers[LEVELS] = [root].
export async function buildTree(leaves, levels = LEVELS) {
  const p = await getPoseidon();
  const hash2 = (l, r) => p.F.toObject(p([BigInt(l), BigInt(r)]));

  const size = 2 ** levels;
  const bottom = new Array(size).fill(ZERO_LEAF);
  leaves.forEach((leaf, i) => (bottom[i] = BigInt(leaf)));

  const layers = [bottom];
  for (let lvl = 0; lvl < levels; lvl++) {
    const cur = layers[lvl];
    const next = [];
    for (let i = 0; i < cur.length; i += 2) {
      next.push(hash2(cur[i], cur[i + 1]));
    }
    layers.push(next);
  }
  return { root: layers[levels][0], layers };
}

// Produce the Merkle inclusion path for the leaf at `index`.
export function merkleProof(layers, index, levels = LEVELS) {
  const pathElements = [];
  const pathIndices = [];
  let idx = index;
  for (let lvl = 0; lvl < levels; lvl++) {
    const isRight = idx % 2; // 1 if current node is a right child
    const siblingIdx = isRight ? idx - 1 : idx + 1;
    pathElements.push(layers[lvl][siblingIdx]);
    pathIndices.push(isRight); // matches DualMux selector `s` in the circuit
    idx = Math.floor(idx / 2);
  }
  return { pathElements, pathIndices };
}

// Reduce arbitrary bytes (e.g. a Stellar address) into a single field element
// to bind a proof to a recipient.
export async function addressToField(bytes) {
  // Poseidon-hash up to 2 field-sized chunks of the bytes.
  const hex = Buffer.from(bytes).toString("hex").padStart(64, "0");
  const lo = BigInt("0x" + hex.slice(0, 32)) % FIELD;
  const hi = BigInt("0x" + hex.slice(32, 64)) % FIELD;
  return poseidon([lo, hi]);
}
