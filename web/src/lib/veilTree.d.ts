export const LEVELS: number;
export const FIELD: bigint;
export const ZERO_LEAF: bigint;

export function getPoseidon(): Promise<any>;
export function poseidon(inputs: (bigint | string | number)[]): Promise<bigint>;
export function commitmentOf(nullifier: bigint | string, secret: bigint | string): Promise<bigint>;
export function nullifierHashOf(nullifier: bigint | string): Promise<bigint>;
export function buildTree(
  leaves: (bigint | string)[],
  levels?: number
): Promise<{ root: bigint; layers: bigint[][] }>;
export function merkleProof(
  layers: bigint[][],
  index: number,
  levels?: number
): { pathElements: bigint[]; pathIndices: number[] };
export function addressToField(bytes: Uint8Array | number[]): Promise<bigint>;
