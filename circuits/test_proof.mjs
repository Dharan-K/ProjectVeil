// End-to-end sanity test: build a tree of approved recipients, pick one,
// generate a Groth16 proof of eligibility, and verify it.
import * as snarkjs from "snarkjs";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import {
  LEVELS,
  FIELD,
  commitmentOf,
  nullifierHashOf,
  buildTree,
  merkleProof,
} from "./lib/veilTree.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

function rand() {
  // Random field element.
  const bytes = crypto.getRandomValues(new Uint8Array(31));
  let x = 0n;
  for (const b of bytes) x = (x << 8n) + BigInt(b);
  return x % FIELD;
}

async function main() {
  console.log("Building approved-recipient set...");
  const N = 8;
  const recipients = [];
  for (let i = 0; i < N; i++) {
    const nullifier = rand();
    const secret = rand();
    const commitment = await commitmentOf(nullifier, secret);
    recipients.push({ nullifier, secret, commitment });
  }

  const { root, layers } = await buildTree(recipients.map((r) => r.commitment));
  console.log("Merkle root:", root.toString());

  // Claimer is recipient #3.
  const claimerIndex = 3;
  const claimer = recipients[claimerIndex];
  const { pathElements, pathIndices } = merkleProof(layers, claimerIndex);
  const nullifierHash = await nullifierHashOf(claimer.nullifier);
  const recipientField = rand(); // stands in for the claiming Stellar address

  const input = {
    root: root.toString(),
    nullifierHash: nullifierHash.toString(),
    recipient: recipientField.toString(),
    nullifier: claimer.nullifier.toString(),
    secret: claimer.secret.toString(),
    pathElements: pathElements.map((x) => x.toString()),
    pathIndices: pathIndices.map((x) => x.toString()),
  };

  console.log("Generating Groth16 proof in browser-equivalent path...");
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    input,
    join(__dirname, "veil_js", "veil.wasm"),
    join(__dirname, "veil_final.zkey")
  );

  const vKey = JSON.parse(
    readFileSync(join(__dirname, "verification_key.json"), "utf8")
  );
  const ok = await snarkjs.groth16.verify(vKey, publicSignals, proof);

  console.log("Public signals:", publicSignals);
  console.log("\nProof verifies:", ok);
  if (!ok) process.exit(1);

  // Negative test: tamper with the root -> must fail.
  const badSignals = [...publicSignals];
  badSignals[0] = (BigInt(badSignals[0]) + 1n).toString();
  const bad = await snarkjs.groth16.verify(vKey, badSignals, proof);
  console.log("Tampered-root proof verifies (should be false):", bad);
  if (bad) process.exit(1);

  console.log("\n✅ Circuit pipeline is sound.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
