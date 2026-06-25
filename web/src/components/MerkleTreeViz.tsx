import { motion } from 'framer-motion'
import { useMemo } from 'react'

interface Props {
  /** number of displayed leaves (illustrative view; real circuit is depth 10) */
  leafCount: number
  /** index of the claimer's leaf, or -1 */
  highlight: number
  /** whether the membership path is "lit" */
  active: boolean
}

interface Node {
  x: number
  y: number
  level: number
  index: number
  onPath: boolean
}

const W = 520
const H = 260
const PAD = 28

/**
 * Illustrative Merkle-tree view. The real proof commits to a depth-10 tree;
 * here we render `leafCount` leaves and animate the inclusion path for the
 * highlighted claimer — exactly the relationship the ZK proof attests to.
 */
export default function MerkleTreeViz({ leafCount, highlight, active }: Props) {
  const levels = Math.ceil(Math.log2(leafCount))
  const { nodes, edges } = useMemo(() => {
    // Which node indices are on the path from the highlighted leaf to the root.
    const pathAt: number[] = []
    if (highlight >= 0) {
      let idx = highlight
      for (let l = 0; l <= levels; l++) {
        pathAt[l] = idx
        idx = Math.floor(idx / 2)
      }
    }

    const nodes: Node[] = []
    const usableW = W - PAD * 2
    for (let l = 0; l <= levels; l++) {
      const count = 2 ** (levels - l)
      const y = PAD + (l / levels) * (H - PAD * 2)
      for (let i = 0; i < count; i++) {
        const x = count === 1 ? W / 2 : PAD + (i / (count - 1)) * usableW
        nodes.push({ x, y, level: l, index: i, onPath: highlight >= 0 && pathAt[l] === i })
      }
    }

    const edges: { x1: number; y1: number; x2: number; y2: number; onPath: boolean }[] = []
    const find = (l: number, i: number) => nodes.find((n) => n.level === l && n.index === i)!
    for (let l = 0; l < levels; l++) {
      const count = 2 ** (levels - l)
      for (let i = 0; i < count; i++) {
        const child = find(l, i)
        const parent = find(l + 1, Math.floor(i / 2))
        const onPath = highlight >= 0 && pathAt[l] === i && pathAt[l + 1] === Math.floor(i / 2)
        edges.push({ x1: child.x, y1: child.y, x2: parent.x, y2: parent.y, onPath })
      }
    }
    return { nodes, edges }
  }, [leafCount, highlight, levels])

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <defs>
        <linearGradient id="edgeLit" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#7c5cff" />
        </linearGradient>
      </defs>

      {edges.map((e, i) => (
        <motion.line
          key={i}
          x1={e.x1}
          y1={e.y1}
          x2={e.x2}
          y2={e.y2}
          stroke={e.onPath && active ? 'url(#edgeLit)' : '#23233a'}
          strokeWidth={e.onPath && active ? 2.2 : 1}
          initial={false}
          animate={{ opacity: e.onPath && active ? 1 : 0.5 }}
          transition={{ duration: 0.4 }}
        />
      ))}

      {nodes.map((n, i) => {
        const isLeafHighlight = n.level === 0 && n.index === highlight
        const lit = n.onPath && active
        return (
          <g key={i}>
            {lit && (
              <motion.circle
                cx={n.x}
                cy={n.y}
                r={9}
                fill="none"
                stroke="#22d3ee"
                strokeWidth={1.5}
                initial={{ opacity: 0.8, r: 6 }}
                animate={{ opacity: 0, r: 16 }}
                transition={{ duration: 1.4, repeat: Infinity, delay: n.level * 0.15 }}
              />
            )}
            <motion.circle
              cx={n.x}
              cy={n.y}
              r={n.level === levels ? 6.5 : isLeafHighlight ? 5.5 : 4}
              fill={lit ? (n.level === levels ? '#7c5cff' : '#22d3ee') : '#15152a'}
              stroke={lit ? '#67e8f9' : '#2a2a44'}
              strokeWidth={1.4}
              initial={false}
              animate={{ scale: lit ? [1, 1.25, 1] : 1 }}
              transition={{ duration: 0.6, delay: n.level * 0.12 }}
            />
          </g>
        )
      })}

      {/* root label */}
      <text x={W / 2} y={PAD - 12} textAnchor="middle" className="mono" fill="#7c5cff" fontSize="9">
        root
      </text>
    </svg>
  )
}
