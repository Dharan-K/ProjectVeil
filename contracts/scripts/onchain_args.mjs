// Read circuits/onchain.json and emit the JSON argument strings the Stellar CLI
// expects for `claim`/`verify`:  proof = {a,b,c} (hex), signals = [hex,hex,hex].
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const data = JSON.parse(
  readFileSync(join(__dirname, '..', '..', 'circuits', 'onchain.json'), 'utf8')
)

const proof = { a: data.proof.a, b: data.proof.b, c: data.proof.c }
const signals = data.signals

writeFileSync(join(__dirname, 'proof.arg.json'), JSON.stringify(proof))
writeFileSync(join(__dirname, 'signals.arg.json'), JSON.stringify(signals))
console.log('proof  :', JSON.stringify(proof))
console.log('signals:', JSON.stringify(signals))
console.log('nullifier (signals[1]):', signals[1])
