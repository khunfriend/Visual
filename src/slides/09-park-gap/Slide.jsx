import { useState } from 'react'
import SlideFrame from '../../components/SlideFrame.jsx'
import { ChartCard, DD, PT, fmt } from '../../components/charts/kit.jsx'
import { parks } from '../../lib/data.js'
import { color } from '../../theme/theme.js'
import s from './style.module.css'

// สไลด์ 09: แก้เฉพาะไฟล์ในโฟลเดอร์นี้ (ดู CLAUDE.md)
// ตัวเลขทุกตัวต้องตรงกับ ข้อมูลรวม_ตรวจแล้ว.md
// หมายเหตุจากอาจารย์: (1) อธิบายว่าทำไมใช้ค่ามัธยฐาน (ย่อไว้ในที่มาด้านล่าง ตัวเต็มอยู่ใน ข้อมูลรวม) (2) ไม่ใส่ % เทียบค่ากลาง

const rows = parks.districts
const get = (name) => rows.find((d) => d.name === name)
const dd = get(DD)
const pt = get(PT)
const parkRank = rows.filter((d) => d.score > dd.score).length + 1
const greenRank = rows.filter((d) => d.greenPerCapita > dd.greenPerCapita).length + 1

const METRICS = [
  {
    key: 'greenPerCapita',
    title: 'พื้นที่สีเขียวต่อคน',
    sub: 'ตร.ม. ต่อคน · ตัวชี้วัดที่ 1 ของหัวข้อสวนสาธารณะ',
    median: parks.medianGreenPerCapita,
  },
  {
    key: 'accessiblePerCapita',
    title: 'สวนสาธารณะที่เข้าถึงได้ต่อคน',
    sub: 'ตร.ม. ต่อคน · ตัวชี้วัดที่ 2 ของหัวข้อสวนสาธารณะ',
    median: parks.medianAccessiblePerCapita,
  },
]

/** แท่ง 3 แท่ง (ปทุมวัน / มัธยฐาน / ดินแดง) ถ้าแท่งไหนสูงเกินกรอบจะแสดงเต็มกรอบ และแสดงค่าจริงบนแท่ง */
function BrokenBars({ metric }) {
  const [hover, setHover] = useState(null)
  const bars = [
    { label: 'ปทุมวัน', value: pt[metric.key], fill: color.pathumwan },
    { label: 'มัธยฐาน 50 เขต', value: metric.median, fill: color.other },
    { label: 'ดินแดง', value: dd[metric.key], fill: color.dindaeng },
  ]
  const W = 560
  const H = 420
  const top = 44
  const base = H - 56
  const cap = metric.median * 3 // กรอบสูงสุด = 3 เท่าของค่ากลาง ให้แท่งดินแดงกับค่ากลางยังเห็นต่างกัน
  const plotH = base - top
  const bw = 120
  const gap = (W - bars.length * bw) / (bars.length + 1)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={s.svg} role="img" aria-label={metric.title}>
      <line x1={0} x2={W} y1={base} y2={base} stroke={color.border} />
      {bars.map((b, i) => {
        const x = gap + i * (bw + gap)
        const broken = b.value > cap
        const h = broken ? plotH : (b.value / cap) * plotH
        const y = base - h
        return (
          <g key={b.label} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} style={{ cursor: 'default' }}>
            <rect x={x - gap / 2} y={top - 30} width={bw + gap} height={base - top + 30} fill={hover === i ? color.grid : 'transparent'} />
            <path d={`M${x},${base} V${y + 4} q0,-4 4,-4 H${x + bw - 4} q4,0 4,4 V${base} Z`} fill={b.fill} />
            <text x={x + bw / 2} y={y - 12} textAnchor="middle" fontSize={26} fontWeight={700} fill={color.text} className="num">
              {fmt.dec(b.value)}
            </text>
            <text x={x + bw / 2} y={base + 32} textAnchor="middle" fontSize={20} fill={color.textMuted}>
              {b.label}
            </text>
            <title>{`${b.label}: ${fmt.dec(b.value)} ตร.ม./คน`}</title>
          </g>
        )
      })}
    </svg>
  )
}

export default function ParkGap() {
  return (
    <SlideFrame
      kicker="10 · สวนหย่อม"
      title="ดินแดงมีพื้นที่สีเขียวและสวนที่เข้าถึงได้ต่อคนต่ำกว่าค่ากลาง"
      source="ที่มา: Bangkok Index 2025 – Rocket Media Lab (สวนสาธารณะ 2568) · ค่ากลาง = มัธยฐาน 50 เขต (ใช้แทนค่าเฉลี่ยเพราะไม่กี่เขตที่สูงมากดึงค่าเฉลี่ยขึ้น) · แท่งปทุมวันสูงเกินกรอบจึงแสดงเต็มกรอบ ตัวเลขบนแท่งคือค่าจริง"
    >
      <dl className={s.kpis}>
        <div className={`${s.kpi} ${s.rankKpi}`}>
          <dt>อันดับคะแนนสวนสาธารณะ</dt>
          <dd><strong className="num">{fmt.int(parkRank)}</strong> จาก {fmt.int(rows.length)} เขต</dd>
        </div>
        <div className={s.kpi}>
          <dt>อันดับพื้นที่สีเขียวต่อคน</dt>
          <dd><strong className="num">{fmt.int(greenRank)}</strong> จาก {fmt.int(rows.length)} เขต</dd>
        </div>
        <div className={s.kpi}>
          <dt>ประชากรเขตดินแดง</dt>
          <dd><strong className="num">{fmt.int(dd.population)}</strong> คน</dd>
        </div>
      </dl>
      <div className={s.legendRow}>
        {[
          ['ปทุมวัน (อันดับ 1 ของดัชนี)', color.pathumwan],
          ['มัธยฐาน 50 เขต', color.other],
          ['ดินแดง', color.dindaeng],
        ].map(([l, c]) => (
          <span key={l} className={s.legendItem}>
            <i style={{ background: c }} />
            {l}
          </span>
        ))}
      </div>
      <div className={s.grid}>
        {METRICS.map((m) => (
          <ChartCard key={m.key} title={m.title} note={m.sub} className={s.chart}>
            <BrokenBars metric={m} />
          </ChartCard>
        ))}
      </div>
    </SlideFrame>
  )
}
