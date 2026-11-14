import { useState } from 'react'
import SlideFrame from '../../components/SlideFrame.jsx'
import { ChartCard, DD, TipBox, fmt } from '../../components/charts/kit.jsx'
import { wastewater as ww } from '../../lib/data.js'
import { color } from '../../theme/theme.js'
import s from './style.module.css'

// สไลด์ 03: แก้เฉพาะไฟล์ในโฟลเดอร์นี้ (ดู CLAUDE.md)
// ตัวเลขทุกตัวต้องตรงกับ ข้อมูลรวม_ตรวจแล้ว.md

const rows = ww.districts // เรียงจาก BOD ต่ำ (ดี) ไปสูง (แย่)
const dd = rows.find((d) => d.name === DD)
const exceed = rows.filter((d) => d.bod > ww.standard).length
const highRank = rows.filter((d) => d.bod > dd.bod).length + 1
const BOD_MAX = 40
const BOD_TICKS = [0, 10, 20, 30, 40]
const pct = (bod) => `${(bod / BOD_MAX) * 100}%`
const standardLabel = `${ww.standard} มก./ล.`

const NEAR = new Set(ww.neighbors)
const neighborColor = 'var(--wastewater-neighbor-color)'

// กราฟฟอง: ขนาดวงตาม BOD (พื้นที่วง ∝ BOD) และวางทุกเขตตามทิศจริงจากดินแดง
// ทิศ/ระยะ (east, north กม.) มาจากจุดศูนย์ถ่วงของรูปเขต (build_data.py ส่วนน้ำเสีย)
// วางทีละเขตจากใกล้ไปไกล: เริ่มที่ทิศจริง ขยับออกจากกลางทีละน้อยจนไม่ทับวงที่วางแล้ว
// เขตที่ติดดินแดงเบี่ยงทิศได้ไม่เกิน 12° · เขตที่ไกลออกไปเบี่ยงได้ถึง 72° และบีบแนวตั้งเหลือ 60%
// ให้กราฟกว้างพอดีการ์ด (กรุงเทพฯ ยาวแนวเหนือ-ใต้) ทิศของเขตไกลจึงเป็นทิศโดยประมาณ
const K = 9 // รัศมี (หน่วย viewBox) = K × √BOD
const GAP = 3
const radius = (bod) => K * Math.sqrt(bod)
const bubbles = (() => {
  const placed = [{ ...dd, x: 0, y: 0, r: radius(dd.bod) }]
  const others = rows.filter((d) => d.name !== DD).sort((a, b) => Math.hypot(a.east, a.north) - Math.hypot(b.east, b.north))
  const free = (x, y, r) => placed.every((p) => Math.hypot(p.x - x, p.y - y) >= p.r + r + GAP)
  const turnsUpTo = (max) => [0].concat(...Array.from({ length: max / 6 }, (_, i) => [(i + 1) * 6, -(i + 1) * 6])).map((d) => (d * Math.PI) / 180)
  const TURNS_NEAR = turnsUpTo(12)
  const TURNS_FAR = turnsUpTo(72)
  for (const d of others) {
    const r = radius(d.bod)
    const theta = Math.atan2(-d.north, d.east)
    let spot = null
    for (let dist = placed[0].r + r + GAP; !spot; dist += 2) {
      for (const t of NEAR.has(d.name) ? TURNS_NEAR : TURNS_FAR) {
        const x = Math.cos(theta + t) * dist
        const y = Math.sin(theta + t) * dist * (NEAR.has(d.name) ? 1 : 0.6)
        if (free(x, y, r)) { spot = { x, y }; break }
      }
    }
    placed.push({ ...d, ...spot, r })
  }
  return placed
})()
const PAD = 8
const minX = Math.min(...bubbles.map((b) => b.x - b.r)) - PAD
const maxX = Math.max(...bubbles.map((b) => b.x + b.r)) + PAD
const minY = Math.min(...bubbles.map((b) => b.y - b.r)) - PAD
const maxY = Math.max(...bubbles.map((b) => b.y + b.r)) + PAD

function BodBubbles() {
  // ชี้ที่วง: วงขยาย (วาดทับวงอื่น) วงอื่นจางลง และขึ้นกล่องชื่อเขต ค่า BOD อันดับ
  const [hover, setHover] = useState(null)
  const fillOf = (b) => (b.name === DD ? color.dindaeng : NEAR.has(b.name) ? neighborColor : color.other)
  const h = bubbles.find((b) => b.name === hover)
  const ordered = h ? [...bubbles.filter((b) => b !== h), h] : bubbles
  const TIP_W = 250
  const TIP_H = 92
  const tipX = h && (h.x + h.r * 1.3 + 10 + TIP_W > maxX ? h.x - h.r * 1.3 - 10 - TIP_W : h.x + h.r * 1.3 + 10)
  const tipY = h && Math.min(Math.max(h.y - TIP_H / 2, minY + 4), maxY - TIP_H - 4)
  return (
    <svg className={`${s.bubbles} ${h ? s.hasHover : ''}`} viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`} role="img"
      aria-label={`BOD เฉลี่ยของคลอง ${rows.length} เขต วางตามทิศจริงจากดินแดง`} onMouseLeave={() => setHover(null)}>
      <g className={s.compass} transform={`translate(${minX + 18} ${minY + 10})`}>
        <path d="M0 22 L0 2 M-5 8 L0 0 L5 8" />
        <text x="10" y="14">เหนือ</text>
      </g>
      {ordered.map((b) => {
        const key = b.name === DD || NEAR.has(b.name)
        const over = b.bod > ww.standard
        return (
          <g key={b.name} className={`${s.bubble} ${b === h ? s.bubbleOn : ''}`}
            onMouseEnter={() => setHover(b.name)} onClick={() => setHover(b === h ? null : b.name)}>
            <circle cx={b.x} cy={b.y} r={b.r} fill={fillOf(b)} fillOpacity={key || over ? 1 : 0.4} stroke={color.surface} strokeWidth="1.5" />
            {key ? (
              <text x={b.x} y={b.y} textAnchor="middle" className={b.name === DD ? s.bLabelDd : s.bLabelKey}>
                <tspan x={b.x} dy="-0.15em">{b.name}</tspan>
                <tspan x={b.x} dy="1.15em" className="num">{fmt.dec(b.bod)}</tspan>
              </text>
            ) : null}
          </g>
        )
      })}
      {h && (
        <g className={s.bTip} transform={`translate(${tipX} ${tipY})`}>
          <rect width={TIP_W} height={TIP_H} rx="8" />
          <text x="14" y="28" className={s.bTipName}>{h.name}</text>
          <text x="14" y="52">BOD <tspan className="num">{fmt.dec(h.bod)}</tspan> มก./ล.{h.bod > ww.standard ? ' · เกินเกณฑ์' : ' · อยู่ในเกณฑ์'}</text>
          <text x="14" y="76">อันดับ {h.rank} จาก {rows.length} (1 = น้ำดีที่สุด)</text>
        </g>
      )}
    </svg>
  )
}

// จุดตรวจคุณภาพน้ำที่อยู่ในเขตดินแดง (ม.ค.–เม.ย. 2566) เรียงจาก BOD มากไปน้อย
const stations = ww.stations
const overCount = stations.filter((x) => x.bod > ww.standard).length
const MONTH = { '01': 'ม.ค.', '02': 'ก.พ.', '03': 'มี.ค.', '04': 'เม.ย.' }

function StationBars() {
  const [tip, setTip] = useState(null)
  return (
    <div className={s.stations}>
      <div className={s.stRows}>
        {stations.map((x) => {
          const over = x.bod > ww.standard
          return (
            <div key={x.id} className={s.stRow} onMouseEnter={() => setTip(x)} onMouseLeave={() => setTip(null)}>
              <div className={s.stLabel}>
                <b>{x.canal}</b>
                <span>{x.point}</span>
              </div>
              <div className={s.stTrack}>
                <div className={s.stBar} style={{ width: pct(x.bod), background: over ? color.dindaeng : color.good }} />
                <span className={`${s.stVal} num`} style={{ left: pct(x.bod) }}>{fmt.dec(x.bod)}</span>
              </div>
            </div>
          )
        })}
        <div className={`${s.stRow} ${s.stGuide}`} aria-hidden="true">
          <div className={s.stTrack}><span className={s.stStd} style={{ left: pct(ww.standard) }} /></div>
        </div>
      </div>
      <div className={s.stAxis}>
        <div className={s.stTrack}>
          {BOD_TICKS.map((bod) => (
            <span key={bod} className={`${s.stTick} num`} style={{ left: pct(bod) }}>{bod}</span>
          ))}
          <span className={s.stStdLabel} style={{ left: pct(ww.standard) }}>{standardLabel}</span>
        </div>
      </div>
      {tip && (
        <div className={s.stTip}>
          <TipBox
            active
            payload={[{ payload: tip }]}
            render={(r) => ({
              title: `${r.canal} · ${r.point}`,
              rows: [
                ['BOD เฉลี่ย', `${fmt.dec(r.bod)} มก./ล.`],
                ...Object.entries(r.months).map(([k, v]) => [`BOD ${MONTH[k.slice(5)]} ${k.slice(0, 4)}`, `${v}`]),
                ['ออกซิเจน (DO) เฉลี่ย', `${fmt.dec(r.do, 1)} มก./ล.`],
              ],
            })}
          />
        </div>
      )}
    </div>
  )
}


export default function Wastewater() {
  return (
    <SlideFrame
      kicker="04 · น้ำเสีย"
      title={`ดินแดงมีค่า BOD สูงเป็นอันดับ ${highRank} จาก ${rows.length} เขต`}
      subtitle={`BOD เฉลี่ย ${fmt.dec(dd.bod)} มก./ล. เทียบกับเกณฑ์ ${standardLabel} · BOD ยิ่งสูง คุณภาพน้ำยิ่งต่ำ`}
      source="ที่มา Bangkok Index 2025 – Rocket Media Lab (ข้อมูลคลองจากสำนักการระบายน้ำ) · จุดตรวจจากชุดข้อมูล waterquality ของกรุงเทพมหานคร (data.bangkok.go.th)"
    >
      <div className={s.grid}>
        <ChartCard
          title={`BOD เฉลี่ยของคลอง ${rows.length} เขต`}
          note={`ปี 2540–2567 · ${exceed} เขตเกินเกณฑ์ ${standardLabel} · วงใหญ่ = BOD สูง · วางทุกเขตตามทิศจริงจากดินแดง`}
          legend={[
            { label: 'ดินแดง', color: color.dindaeng },
            { label: 'เขตที่ติดดินแดง', color: neighborColor },
            { label: 'เขตอื่นที่เกินเกณฑ์', color: color.other },
            { label: 'เขตอื่นที่อยู่ในเกณฑ์', color: 'color-mix(in srgb, var(--c-other) 40%, transparent)' },
          ]}
        >
          <BodBubbles />
        </ChartCard>

        <ChartCard
          title={`${overCount} ใน ${stations.length} จุดตรวจในดินแดงมี BOD เกินเกณฑ์`}
          note="BOD เฉลี่ย ม.ค.–เม.ย. 2566 · หน่วย มก./ล."
          legend={[
            { label: 'เกินเกณฑ์', color: color.dindaeng },
            { label: 'อยู่ในเกณฑ์', color: color.good },
            { label: 'เกณฑ์ BOD', color: color.reference, kind: 'dash' },
          ]}
        >
          <StationBars />
        </ChartCard>
      </div>
    </SlideFrame>
  )
}
