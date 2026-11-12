import { useMemo, useState } from 'react'
import SlideFrame from '../../components/SlideFrame.jsx'
import MapBase, { heatColor } from '../../components/charts/MapBase.jsx'
import Expandable from '../../components/charts/Expandable.jsx'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { TipBox, fmt } from '../../components/charts/kit.jsx'
import { map, risk } from '../../lib/data.js'
import { color } from '../../theme/theme.js'
import s from './style.module.css'

// สไลด์ 07: แก้เฉพาะไฟล์ในโฟลเดอร์นี้ (ดู CLAUDE.md)
// ตัวเลขทุกตัวต้องตรงกับ ข้อมูลรวม_ตรวจแล้ว.md

const pts = map.risk.points
const types = map.risk.types
const ddCount = risk.districts.find((d) => d.name === 'ดินแดง').points
const typeColor = (t) => color.riskType[t] || color.textMuted
const SIGMA_M = 300
const shortName = (n) => n.replace(/^บริเวณ(โดยรอบ)?/, '').trim()
const placeShort = (p) => p.replace('สถานประกอบการ/โรงงาน/อาคารพาณิชย์', 'อาคารพาณิชย์').replace('สวนสาธารณะ/สวนหย่อม', 'สวน/สวนหย่อม')
const repeats = pts.filter((p) => p.repeatOf).map((p) => `${p.repeatOf}–${p.no}`)

// ป้าย % บนกราฟวงกลม: ชิ้น ≥ 12% ตัวใหญ่ตรงกลางชิ้น · ชิ้น 5–12% ตัวเล็กใกล้ขอบ · จำนวนจุดดูจาก tooltip
const RAD = Math.PI / 180
function pieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  if (percent < 0.05) return null
  const small = percent < 0.12
  const r = innerRadius + (outerRadius - innerRadius) * (small ? 0.78 : 0.6)
  const x = cx + r * Math.cos(-midAngle * RAD)
  const y = cy + r * Math.sin(-midAngle * RAD)
  return (
    <text x={x} y={y} dy="0.35em" textAnchor="middle" fontSize={small ? 15 : 22} fontWeight={700} fill="#fff" style={{ fontFamily: 'var(--font)' }}>
      {Math.round(percent * 100)}%
    </text>
  )
}

/** heatmap แบบ KDE (Gaussian, σ = 300 ม.) วาดลง canvas แล้วใช้เป็นภาพ (เร็วกว่าวาด rect หลายหมื่นอัน) */
function useHeatImage(list, key) {
  return useMemo(() => {
    const [, , w, h] = map.viewBox
    const cell = 4
    const sg = SIGMA_M * map.pxPerM
    const cw = Math.ceil(w / cell)
    const ch = Math.ceil(h / cell)
    const vals = new Float32Array(cw * ch)
    let max = 0
    for (let j = 0; j < ch; j++)
      for (let i = 0; i < cw; i++) {
        const x = i * cell + cell / 2
        const y = j * cell + cell / 2
        let v = 0
        for (const p of list) v += Math.exp(-((x - p.x) ** 2 + (y - p.y) ** 2) / (2 * sg * sg))
        vals[j * cw + i] = v
        if (v > max) max = v
      }
    const cv = document.createElement('canvas')
    cv.width = cw
    cv.height = ch
    const ctx = cv.getContext('2d')
    const img = ctx.createImageData(cw, ch)
    vals.forEach((v, k) => {
      const n = v / max
      if (n < 0.06) return
      const [r, g, b] = heatColor(n).match(/\d+/g).map(Number)
      img.data.set([r, g, b, Math.round((0.25 + 0.65 * n) * 255)], k * 4)
    })
    ctx.putImageData(img, 0, 0)
    return { href: cv.toDataURL(), w, h }
  }, [key]) // eslint-disable-line react-hooks/exhaustive-deps
}

// ---- ภาพรวม: ดินแดงอยู่ตรงไหนเมื่อเทียบ 50 เขต ----
const districts = risk.districts // [{ name, points, score }]
const dd = districts.find((d) => d.name === 'ดินแดง')
const ddRank = districts.filter((d) => d.points < dd.points).length + 1 // เรียงจากจุดน้อยไปมาก
const ddTies = districts.filter((d) => d.points === dd.points).length
const TARGET = 9 // เป้าในฉากทัศน์ "ปีแรก ตามเป้า" (สไลด์สรุปผล)
const { lo: rLo, hi: rHi } = risk.scoreFormula
const targetScore = 1 + (49 * (rHi - TARGET)) / (rHi - rLo)
const minD = districts.filter((d) => d.points === rLo).map((d) => d.name)
const maxD = districts.filter((d) => d.points === rHi).map((d) => d.name)

/** จุดของทั้ง 50 เขตบนแกนจำนวนจุดเสี่ยง (เขตที่ค่าเท่ากันซ้อนขึ้นเป็นคอลัมน์) */
function DotStrip() {
  const [hover, setHover] = useState(null)
  const W = 1040
  const H = 172
  const x0 = 30
  const x1 = W - 30
  const base = 118
  const X = (v) => x0 + ((v - (rLo - 1)) / (rHi + 1 - (rLo - 1))) * (x1 - x0)
  const stacks = {}
  const dots = [...districts]
    .sort((a, b) => (a.name === dd.name) - (b.name === dd.name)) // ดินแดงอยู่บนสุดของคอลัมน์
    .map((d) => {
      const k = (stacks[d.points] = (stacks[d.points] || 0) + 1) - 1
      return { ...d, cx: X(d.points), cy: base - 10 - k * 15 }
    })
  const ddDot = dots.find((d) => d.name === dd.name)
  return (
    <div className={s.stripWrap}>
    <svg viewBox={`0 0 ${W} ${H}`} className={s.stripSvg} role="img" aria-label="จำนวนจุดเสี่ยงของ 50 เขต">
      <line x1={x0} x2={x1} y1={base} y2={base} stroke={color.border} strokeWidth={2} />
      {Array.from({ length: rHi - rLo + 1 }, (_, i) => rLo + i).map((t) => (
        <g key={t}>
          <line x1={X(t)} x2={X(t)} y1={base} y2={base + 6} stroke={color.border} />
          <text x={X(t)} y={base + 26} textAnchor="middle" fontSize={18} fill={color.textFaint}>{t}</text>
        </g>
      ))}
      {/* ค่ากลาง */}
      <line x1={X(risk.median)} x2={X(risk.median)} y1={18} y2={base} stroke={color.reference} strokeDasharray="6 5" strokeWidth={2} />
      <text x={X(risk.median)} y={base + 48} textAnchor="middle" fontSize={20} fill={color.textMuted}>ค่ากลาง {risk.median} จุด</text>
      {/* 50 เขต */}
      {dots.map((d) => (
        <circle key={d.name} cx={d.cx} cy={d.cy} r={d.name === dd.name ? 10 : 6.5}
          fill={d.name === dd.name ? color.dindaeng : color.other}
          stroke={hover?.name === d.name ? color.text : color.surface} strokeWidth={2} />
      ))}
      {/* พื้นที่ hover ใหญ่กว่าจุด (มองไม่เห็น) */}
      {dots.map((d) => (
        <circle key={`hit-${d.name}`} cx={d.cx} cy={d.cy} r={8} fill="transparent" style={{ cursor: 'default' }}
          onMouseEnter={() => setHover(d)} onMouseLeave={() => setHover(null)} />
      ))}
      <line x1={ddDot.cx} x2={ddDot.cx} y1={ddDot.cy - 12} y2={ddDot.cy - 24} stroke={color.text} strokeWidth={1.5} />
      <text x={ddDot.cx} y={ddDot.cy - 30} textAnchor="middle" fontSize={22} fontWeight={700} fill={color.text}>ดินแดง {dd.points} จุด</text>
    </svg>
    {hover && (
      <div className={s.stripTip} style={{ left: `${(hover.cx / W) * 100}%`, top: `${(hover.cy / H) * 100}%` }}>
        <TipBox
          active
          payload={[{ payload: hover }]}
          render={(r) => ({
            title: `เขต${r.name}`,
            rows: [
              ['จุดเสี่ยง', `${r.points} จุด`],
              ['อันดับ', `${districts.filter((d) => d.points < r.points).length + 1} จาก 50`],
            ],
          })}
        />
      </div>
    )}
    </div>
  )
}

export default function RiskPoints() {
  const [active, setActive] = useState(null)
  const [mode, setMode] = useState('pins') // 'pins' | 'heat'
  const [year, setYear] = useState('all') // 'all' | 2567 | 2568
  const shown = year === 'all' ? pts : pts.filter((p) => p.year === year)
  const heat = useHeatImage(shown, year)
  // กรองปีเดียวแล้วไม่มีสถานที่ซ้ำ จึงวางหมุดตรงตำแหน่งจริง (ไม่ต้องเลื่อนหลบ)
  const pos = (p) => (year === 'all' ? { x: p.pinX, y: p.pinY, moved: p.moved } : { x: p.x, y: p.y, moved: false })
  const yearLabel = year === 'all' ? 'ปี 2567–2568' : `ปี ${year}`
  // สัดส่วนประเภท: เรียงตามลำดับประเภทเดิม (สีผูกกับประเภท) และตัดประเภทที่เป็น 0 ในปีที่เลือก
  const typeData = types
    .map((t) => {
      const count = shown.filter((p) => p.type === t.type).length
      return { type: t.type, count, pct: (count / shown.length) * 100 }
    })
    .filter((t) => t.count > 0)

  const yearFilter = (
    <div className={s.toggle} role="tablist" aria-label="กรองตามปี">
      {[
        ['all', `ทุกปี (${pts.length})`],
        [2567, `2567 (${pts.filter((p) => p.year === 2567).length})`],
        [2568, `2568 (${pts.filter((p) => p.year === 2568).length})`],
      ].map(([k, label]) => (
        <button key={k} role="tab" aria-selected={year === k} className={year === k ? s.on : ''}
          onClick={(e) => (e.stopPropagation(), setYear(k), setActive(null))}>
          {label}
        </button>
      ))}
    </div>
  )

  const toggle = (
    <div className={s.toggle} role="tablist">
      {[
        ['pins', 'แผนที่หมุด'],
        ['heat', 'ความหนาแน่น'],
      ].map(([k, label]) => (
        <button key={k} role="tab" aria-selected={mode === k} className={mode === k ? s.on : ''}
          onClick={(e) => (e.stopPropagation(), setMode(k))}>
          {label}
        </button>
      ))}
    </div>
  )

  const renderMap = (expanded) => (
    <MapBase
      labelSize={expanded ? 18 : 26}
      overlay={
        <g>
          {shown.map((p) => {
            const q = pos(p)
            return (
              <g key={p.no} onMouseEnter={() => setActive(p.no)} onMouseLeave={() => setActive(null)}
                onClick={(e) => (e.stopPropagation(), setActive(p.no))} style={{ cursor: 'pointer' }}>
                {q.moved && <line x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke={color.text} strokeWidth={2} />}
                <circle cx={q.x} cy={q.y} r={active === p.no ? 27 : 22}
                  fill={mode === 'heat' ? color.text : typeColor(p.type)} stroke={color.surface} strokeWidth={2.5} />
                <text x={q.x} y={q.y} dy="0.36em" textAnchor="middle" fontSize={21} fontWeight={700} fill="#fff"
                  style={{ fontFamily: 'var(--font)', pointerEvents: 'none' }}>
                  {p.no}
                </text>
              </g>
            )
          })}
        </g>
      }
    >
      {() => mode === 'heat' && <image href={heat.href} x={0} y={0} width={heat.w} height={heat.h} preserveAspectRatio="none" />}
    </MapBase>
  )

  return (
    <SlideFrame
      kicker="07 · จุดเสี่ยง"
      title="17 จุดเสี่ยง กระจุกตัวช่วงสวนป่าวิภาวดีและถนนมิตรไมตรี"
      source={`ที่มา: บัญชีพื้นที่เสี่ยงและพื้นที่อันตราย กทม. สำนักเทศกิจ ปีงบประมาณ 2567–2568 (data.bangkok.go.th); ${map.credit} · เป็นพื้นที่เฝ้าระวัง ไม่ใช่จุดเกิดคดี · สถานที่เดิมอยู่ในบัญชีทั้ง 2 ปี: หมุด ${repeats.join(', ')} · heatmap σ = ${SIGMA_M} ม.`}
    >
      <div className={s.page}>
        {/* ---- แถวบน: 17 จุดมากแค่ไหนเมื่อเทียบ 50 เขต ---- */}
        <section className={s.context}>
          <div className={s.strip}>
            <p className={s.colTitle}>จำนวนจุดเสี่ยงของ 50 เขต (1 จุด = 1 เขต)</p>
            <DotStrip />
          </div>
          <div className={s.stats}>
            <div className={s.statCard}>
              <b className="num">{dd.points}<small> จุด</small></b>
              <span>มากกว่าค่ากลาง {dd.points - risk.median} จุด</span>
            </div>
            <div className={s.statCard}>
              <b className="num">{ddRank}<small> / 50</small></b>
              <span>อันดับ (ร่วม {ddTies} เขต) เรียงจากจุดน้อยไปมาก</span>
            </div>
            <div className={s.statCard}>
              <b className="num">{fmt.dec(dd.score)}<small> / 50</small></b>
              <span>คะแนนด้านนี้ · ถ้าเหลือ {TARGET} จุด ได้ {fmt.dec(targetScore)}</span>
            </div>
          </div>
        </section>

        {/* ---- แถวล่าง: อยู่ตรงไหน / ประเภทอะไร / ที่ไหนบ้าง (ตัวกรองมีผลทั้งแถว) ---- */}
        <div className={s.controls}>
          {toggle}
          {yearFilter}
        </div>
        <div className={s.grid}>
        <div className={s.mapCol}>
          <div className={s.map}>
            <Expandable
              title={`จุดเสี่ยงในเขตดินแดง ${yearLabel} (${shown.length} จุด)`}
              note={mode === 'heat' ? `ความหนาแน่นของจุดเสี่ยง (σ = ${SIGMA_M} ม.) · เป็นพื้นที่เฝ้าระวัง ไม่ใช่จุดเกิดคดี` : 'หมายเลขเรียงจากเหนือลงใต้ · สีบอกประเภทความเสี่ยง'}
              toolbar={<>{toggle}{yearFilter}</>}
              aside={
                <ol className={s.asideList}>
                  {shown.map((p) => (
                    <li key={p.no} className={active === p.no ? s.activeItem : ''} onMouseEnter={() => setActive(p.no)} onMouseLeave={() => setActive(null)}>
                      <span className={s.badge} style={{ background: typeColor(p.type) }}>{p.no}</span>
                      <span className={s.itemText}>
                        <b>{shortName(p.name)}</b>
                        <small>{p.type} · {placeShort(p.place)} · ปี {p.year}</small>
                      </span>
                    </li>
                  ))}
                </ol>
              }
            >
              {({ expanded }) => renderMap(expanded)}
            </Expandable>
          </div>
          {mode === 'heat' && (
            <div className={s.heatKey}>
              <span>น้อย</span>
              <i style={{ background: `linear-gradient(90deg, ${color.heat.join(',')})` }} />
              <span>หนาแน่น</span>
            </div>
          )}
        </div>
          <div className={s.typeCol}>
            <p className={s.colTitle}>แบ่งตามประเภท · {yearLabel}</p>
            <div className={s.pie}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={typeData} dataKey="count" nameKey="type" startAngle={90} endAngle={-270}
                    innerRadius={0} outerRadius="96%" stroke={color.surface} strokeWidth={2} isAnimationActive={false}
                    label={pieLabel} labelLine={false}>
                    {typeData.map((t) => (
                      <Cell key={t.type} fill={typeColor(t.type)} />
                    ))}
                  </Pie>
                  <Tooltip content={<TipBox render={(r) => ({ title: r.type, rows: [['จำนวน', `${r.count} จุด`], ['สัดส่วน', `${fmt.int(r.pct)}%`]] })} />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className={s.typeLegend}>
              
              <ul>
                {typeData.map((t) => (
                  <li key={t.type}>
                    <span className={s.swatch} style={{ background: typeColor(t.type) }} />
                    <span className={s.typeName}>{t.type}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className={s.listCol}>
          <p className={s.colTitle}>รายชื่อ {shown.length} จุด (เรียงจากเหนือลงใต้)</p>
          <ol className={s.list}>
            {shown.map((p) => (
              <li key={p.no} className={active === p.no ? s.activeItem : ''} onMouseEnter={() => setActive(p.no)} onMouseLeave={() => setActive(null)}>
                <span className={s.badge} style={{ background: typeColor(p.type) }}>{p.no}</span>
                <span className={s.itemLine}>
                  <b>{shortName(p.name)}</b>
                  <small>{p.year}</small>
                </span>
              </li>
            ))}
          </ol>
          </div>
        </div>
      </div>
    </SlideFrame>
  )
}
