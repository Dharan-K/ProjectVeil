# Veil — Demo Video Scripts

Two ready-to-record voiceover scripts: a full **7-minute** walkthrough and a tight **2-minute** version. Record your screen roughly matching the timestamps, then narrate over it (or narrate first and trim the screen to fit).

> Tip: record in segments, leave a small pause at each `[wait]`, speak a little slower than feels natural, and smile while talking. 🙂

---

## 🎙️ 7-Minute Version

### [0:00 – 0:30] — Intro
**SCREEN:** Landing page, slow scroll down a little.
**SAY:**
"Hi everyone. This is **Veil** — a project we built for the Stellar Real-World ZK hackathon. The idea is simple: prove you're eligible for a payment, *without* revealing who you are. Over the next few minutes I'll walk you through the problem we're solving, how the zero-knowledge part actually works, and then show you a real claim happening live on Stellar. Let's get into it."

### [0:30 – 1:20] — The problem
**SCREEN:** Stay on the hero / the "Prove you're eligible" text.
**SAY:**
"So here's the thing about blockchains like Stellar — they're public. Every transaction is visible to anyone, forever. That's great for trust, but terrible for privacy. Think about it: imagine an NGO sending aid to 500 families on-chain. Now *anyone* can see exactly who received help. Same with private salaries, grants for activists, whistleblower payments. The moment money moves on a public ledger, the people receiving it get exposed. So we asked: can we keep all the trust of the blockchain, but hide *who's* actually getting paid? That's Veil."

### [1:20 – 2:25] — How it works
**SCREEN:** Scroll slowly through the "How it works" section.
**SAY:**
"Here's how it works, in plain English. First, the organization takes its list of approved people and turns it into one short fingerprint — called a Merkle root — and publishes it on Stellar. You can't read the list from the fingerprint, but you can prove something's inside it. Next, every approved person holds a secret — like a private ticket. When you claim, your browser creates a zero-knowledge proof that says: *'I'm holding a valid ticket on the approved list'* — but never reveals which one. It's like proving you're over eighteen without showing your birthday. And finally, there's a nullifier — a one-time tag — so nobody can claim twice. We'll see all of this live in a second."

### [2:25 – 3:00] — The tech
**SCREEN:** Scroll to the "Architecture / ZK is doing the work" section.
**SAY:**
"Quick word on what's under the hood. The proof is a Groth16 zk-SNARK, written as a Circom circuit. It's generated right in your browser with snarkjs — so your secret literally never leaves your device. And it's verified by a smart contract we deployed on Stellar, using the new BN254 functions Stellar added in their recent protocol upgrades. That's what makes verifying a proof on-chain cheap enough to actually work."

### [3:00 – 3:35] — Connect wallet + privacy
**SCREEN:** Go to the Live demo. Click **Connect wallet**, approve in Freighter, address appears.
**SAY:**
"Okay, let's do a real claim. First I'll connect my wallet — I'm using Freighter. There's my address. Now, something I really like: notice I'm *not* paying any gas myself. A relayer submits the transaction for me. That's on purpose — because if I paid from my own wallet, it would get linked to the claim on the public ledger, and the whole privacy idea falls apart. The relayer keeps me unlinkable."

### [3:35 – 4:35] — Generate the proof
**SCREEN:** Pick a recipient, show the ticket, click **Generate zero-knowledge proof**, let the tree light up.
**SAY:**
"Now I'll claim as one of the approved recipients. You can see my private ticket here — a nullifier and a secret, and these never leave my browser. I'll hit generate. And right now, my browser is building a real zero-knowledge proof. Watch the tree on the right — it's lighting up the path that proves my ticket is in the approved set. *[let it finish]* And there it is. You can see the proof and the public signals. Notice what's actually revealed: just the root and a one-time nullifier. Not my secret, not which recipient I am — nothing that ties back to me."

### [4:35 – 5:35] — Verify on-chain
**SCREEN:** Click **Verify & claim on Stellar testnet**. Wait for success, then click the tx hash to open stellar.expert.
**SAY:**
"Now I'll send it to Stellar. *[click]* This goes to our smart contract on the testnet. The contract runs the actual cryptographic pairing check — on-chain — to confirm the proof is real, and records my nullifier so it can't be reused. *[wait for success]* And there we go — verified, disbursement released. Let me open this transaction on the Stellar explorer so you can see it's completely real. *[open link]* This is a live transaction on Stellar. And look — no name, no link to my wallet, nothing personal. The network confirmed I was eligible, paid me, and still has no idea who I am."

### [5:35 – 6:20] — Double-spend protection
**SCREEN:** Click **Run another claim**, pick the *same* recipient, generate, submit → rejection appears.
**SAY:**
"Now, an important question: what stops someone claiming over and over? Let me try. I'll run another claim with the exact same ticket, and submit. *[wait]* And — rejected. The contract sees this nullifier was already spent and refuses, right there on-chain. So even though everything's private, you still get a hard guarantee: one claim per person, enforced by Stellar itself. Privacy *and* integrity at the same time — that's the part I'm most proud of."

### [6:20 – 6:50] — What's real (honesty)
**SCREEN:** Back to the landing page, or show the GitHub repo / contract on the explorer.
**SAY:**
"I want to be upfront about what's real, because this hackathon values honesty. The circuit, the in-browser proving, the smart contract, the on-chain verification — all real, and you can check the contract on the explorer. The one thing that's illustrative is the actual stablecoin balance: the contract verifies eligibility and spends the nullifier, but it doesn't custody real funds yet. That's the natural next step."

### [6:50 – 7:00] — Close
**SCREEN:** Landing page / logo.
**SAY:**
"So that's Veil — real payments, real privacy, verified on Stellar. The zero-knowledge layer is doing the real work here. Thanks so much for watching!"

---

## ⚡ 2-Minute Version

### [0:00 – 0:20] — Hook + problem
**SCREEN:** Landing page.
**SAY:**
"This is **Veil**. Blockchains are public — so when an organization pays people on-chain, anyone can see exactly who got paid. For aid, salaries, or grants, that's a privacy nightmare. Veil fixes it: prove you're approved for a payment, without revealing who you are."

### [0:20 – 0:45] — How it works
**SCREEN:** Scroll "How it works".
**SAY:**
"The organization publishes a fingerprint of its approved list on Stellar. Each person holds a secret. To claim, your browser makes a zero-knowledge proof that you're on the list — without showing which person — plus a one-time tag that stops double-claims."

### [0:45 – 1:15] — Generate proof
**SCREEN:** Connect wallet, pick recipient, generate proof, tree lights up.
**SAY:**
"Let me show you. I connect my wallet — and notice a relayer pays the gas, so my wallet's never linked to the claim. I pick a recipient, and my browser generates a real Groth16 proof right here. Watch the tree light up the membership path. It reveals just a root and a nullifier — nothing about who I am."

### [1:15 – 1:45] — Verify on-chain
**SCREEN:** Submit to testnet, success, open tx on explorer.
**SAY:**
"Now it goes to our smart contract on Stellar, which verifies the proof on-chain and releases the payment. Here's the real transaction on the explorer — eligibility confirmed, identity hidden."

### [1:45 – 2:00] — Double-spend + close
**SCREEN:** Re-claim same recipient → rejected.
**SAY:**
"And if I try to claim twice with the same ticket — rejected on-chain. One claim per person, fully private. That's Veil: real payments, real privacy, verified on Stellar. Thanks for watching!"

---

### Recording checklist
- Close extra browser tabs; zoom the page so text is readable.
- Unlock Freighter before recording.
- Do one practice run (the testnet step takes ~10–15s — keep talking or trim it).
- Tools: Windows Game Bar (`Win+G`), OBS Studio, or Loom.
