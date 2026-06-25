pragma circom 2.1.6;

include "circomlib/circuits/poseidon.circom";

/*
 * Veil — Private Eligibility Proofs for Stablecoin Disbursements on Stellar
 *
 * An organization publishes a Merkle root of approved-recipient *commitments*.
 * Each recipient privately holds (nullifier, secret) where their leaf is
 * commitment = Poseidon(nullifier, secret).
 *
 * To claim, a recipient proves in zero knowledge that:
 *   1. Their commitment is a leaf in the published Merkle tree (eligibility),
 *      WITHOUT revealing which leaf — so the org cannot link a claim to a person.
 *   2. They know the nullifier behind a publicly revealed nullifierHash, which
 *      the on-chain contract records once to prevent double-claims.
 *   3. The proof is bound to the `recipient` Stellar address, so it cannot be
 *      stolen and re-used by a front-runner.
 *
 * Public signals:  root, nullifierHash, recipient
 * Private signals: nullifier, secret, pathElements[levels], pathIndices[levels]
 */

// Poseidon hash of an ordered pair (left, right).
template HashLeftRight() {
    signal input left;
    signal input right;
    signal output hash;

    component hasher = Poseidon(2);
    hasher.inputs[0] <== left;
    hasher.inputs[1] <== right;
    hash <== hasher.out;
}

// If s == 0 -> [in[0], in[1]]; if s == 1 -> [in[1], in[0]].
// s is constrained to be boolean.
template DualMux() {
    signal input in[2];
    signal input s;
    signal output out[2];

    s * (1 - s) === 0;
    out[0] <== (in[1] - in[0]) * s + in[0];
    out[1] <== (in[0] - in[1]) * s + in[1];
}

// Verifies a Merkle inclusion proof: hashing `leaf` up the path with the
// sibling `pathElements` (ordered by the boolean `pathIndices`) yields `root`.
template MerkleTreeChecker(levels) {
    signal input leaf;
    signal input root;
    signal input pathElements[levels];
    signal input pathIndices[levels];

    component selectors[levels];
    component hashers[levels];

    signal levelHashes[levels + 1];
    levelHashes[0] <== leaf;

    for (var i = 0; i < levels; i++) {
        selectors[i] = DualMux();
        selectors[i].in[0] <== levelHashes[i];
        selectors[i].in[1] <== pathElements[i];
        selectors[i].s <== pathIndices[i];

        hashers[i] = HashLeftRight();
        hashers[i].left <== selectors[i].out[0];
        hashers[i].right <== selectors[i].out[1];
        levelHashes[i + 1] <== hashers[i].hash;
    }

    root === levelHashes[levels];
}

template Veil(levels) {
    // Public
    signal input root;
    signal input nullifierHash;
    signal input recipient;

    // Private
    signal input nullifier;
    signal input secret;
    signal input pathElements[levels];
    signal input pathIndices[levels];

    // commitment = Poseidon(nullifier, secret)
    component commitmentHasher = Poseidon(2);
    commitmentHasher.inputs[0] <== nullifier;
    commitmentHasher.inputs[1] <== secret;

    // nullifierHash = Poseidon(nullifier) — revealed and stored on-chain.
    component nullifierHasher = Poseidon(1);
    nullifierHasher.inputs[0] <== nullifier;
    nullifierHasher.out === nullifierHash;

    // Prove the commitment is in the approved Merkle tree.
    component tree = MerkleTreeChecker(levels);
    tree.leaf <== commitmentHasher.out;
    tree.root <== root;
    for (var i = 0; i < levels; i++) {
        tree.pathElements[i] <== pathElements[i];
        tree.pathIndices[i] <== pathIndices[i];
    }

    // Bind the proof to the recipient address. Squaring forces `recipient` into
    // the constraint system, so a relayer/front-runner cannot swap the address
    // without invalidating the proof. (Tornado-cash style anti-malleability.)
    signal recipientSquare;
    recipientSquare <== recipient * recipient;
}

component main {public [root, nullifierHash, recipient]} = Veil(10);
