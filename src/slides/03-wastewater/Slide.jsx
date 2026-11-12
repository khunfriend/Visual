import {
  Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { useLayoutEffect, useRef, useState } from 'react'
import SlideFrame from '../../components/SlideFrame.jsx'
import { ChartCard, DD, SvgLabel, TipBox, axisCommon, fmt, gridProps } from '../../components/charts/kit.jsx'
import { wastewater as ww } from '../../lib/data.js'
import { color } from '../../theme/theme.js'
import s from './style.module.css'

// สไลด์ 03: แก้เฉพาะไฟล์ในโฟลเดอร์นี้ (ดู CLAUDE.md)
// ตัวเลขทุกตัวต้องตรงกับ ข้อมูลรวม_ตรวจแล้ว.md

const rows = ww.districts // เรียงจาก BOD ต่ำ (ดี) ไปสูง (แย่)
const dd = rows.find((d) => d.name === DD)
const exceed = rows.filter((d) => d.bod > ww.standard).length

// พญาไท: เขตข้างเคียงที่น้ำดีที่สุด ใช้เป็นคู่เทียบในหน้านี้
const PY = 'พญาไท'
const py = rows.find((d) => d.name === PY)
const barColor = (name) => (name === DD ? color.dindaeng : name === PY ? color.contrast : color.other)

// ดินแดงต้องลด BOD ลงเท่าไรถึงจะเท่ามาตรฐาน
const cut = dd.bod - ww.standard

/** แท่งเดียวของดินแดง: ส่วนที่ไม่เกินมาตรฐาน + ส่วนที่เกิน และลูกศรบอกว่าต้องลดเท่าไร */
function StandardBar() {
  const [tip, setTip] = useState(null)
  const W = 660
  const H = 260
  const x0 = 24
  const x1 = W - 24
  const MAX = 30
  const X = (v) => x0 + (v / MAX) * (x1 - x0)
  const y = 64
  const h = 64
  const ticks = [0, 5, 10, 15, 20, 25, 30]
  const segs = [
    { key: 'ok', from: 0, to: ww.standard, fill: color.other, title: 'ไม่เกินมาตรฐาน', rows: [['ช่วง', `0–${ww.standard} มก./ล.`]] },
    { key: 'over', from: ww.standard, to: dd.bod, fill: color.dindaeng, title: 'ส่วนที่เกินมาตรฐาน', rows: [['เกิน', `${fmt.dec(cut)} มก./ล.`], ['BOD ดินแดง', `${fmt.dec(dd.bod)} มก./ล.`]] },
  ]
  return (
    <div className={s.barWrap}>
      <svg viewBox={`0 0 ${W} ${H}`} className={s.barSvg} role="img" aria-label="BOD ดินแดงเทียบมาตรฐาน">
        <defs>
          <marker id="ww-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill={color.text} />
          </marker>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={X(t)} x2={X(t)} y1={y - 12} y2={y + h + 6} stroke={color.grid} />
            <text x={X(t)} y={y + h + 30} textAnchor="middle" fontSize={20} fill={color.textFaint}>{t}</text>
          </g>
        ))}
        {/* ส่วนไม่เกิน: ขอบซ้ายตรงติดฐาน · ส่วนเกิน: ปลายขวามน 4px · เว้น 2px ระหว่างสองส่วน */}
        <rect x={X(0)} y={y} width={X(ww.standard) - X(0) - 1} height={h} fill={segs[0].fill}
          onMouseEnter={() => setTip(segs[0])} onMouseLeave={() => setTip(null)} />
        <path
          d={`M${X(ww.standard) + 1},${y} H${X(dd.bod) - 4} a4,4 0 0 1 4,4 V${y + h - 4} a4,4 0 0 1 -4,4 H${X(ww.standard) + 1} z`}
          fill={segs[1].fill} onMouseEnter={() => setTip(segs[1])} onMouseLeave={() => setTip(null)} />
        <text x={(X(0) + X(ww.standard)) / 2} y={y + h / 2} dy="0.35em" textAnchor="middle" fontSize={22} fontWeight={600}
          fill={color.text} pointerEvents="none">มาตรฐาน {ww.standard}</text>
        <text x={(X(ww.standard) + X(dd.bod)) / 2} y={y + h / 2} dy="0.35em" textAnchor="middle" fontSize={22} fontWeight={700}
          fill={color.surface} pointerEvents="none">ส่วนที่เกิน</text>
        <text x={X(dd.bod)} y={y - 22} textAnchor="middle" fontSize={22} fontWeight={700} fill={color.text}>ดินแดง {fmt.dec(dd.bod)}</text>
        {/* ลูกศร: ต้องลดจาก 25.81 ลงมาที่ 15 */}
        <line x1={X(dd.bod)} x2={X(ww.standard) + 4} y1={y + h + 64} y2={y + h + 64} stroke={color.text} strokeWidth={2.5} markerEnd="url(#ww-arrow)" />
        <line x1={X(dd.bod)} x2={X(dd.bod)} y1={y + h + 54} y2={y + h + 74} stroke={color.text} strokeWidth={2} />
        <text x={(X(ww.standard) + X(dd.bod)) / 2} y={y + h + 100} textAnchor="middle" fontSize={22} fontWeight={700} fill={color.text}>
          ต้องลด {fmt.dec(cut)} มก./ล.
        </text>
      </svg>
      {tip && (
        <div className={s.barTip}>
          <TipBox active payload={[{ payload: tip }]} render={(r) => ({ title: r.title, rows: r.rows })} />
        </div>
      )}
    </div>
  )
}

const bodTip = <TipBox render={(r) => ({ title: `${r.name} · อันดับ ${r.rank}`, rows: [['BOD เฉลี่ย', `${fmt.dec(r.bod)} มก./ล.`], ['จำนวนคลอง', `${r.canals}`]] })} />

/**
 * การ์ดที่ขยายออกจากแท่งดินแดง: ตั้งจุดหมุนของการขยายไว้ที่ตำแหน่งแท่ง (from)
 * แล้วขยายจากเล็กมากเป็นขนาดเต็ม · ตอนปิดหดกลับเข้าแท่งก่อนแล้วค่อยหายไป
 */
function GrowFrom({ from, closing, onClosed, children }) {
  const ref = useRef(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || !from) return
    const r = el.getBoundingClientRect()
    const k = r.width / el.offsetWidth || 1 // สเกลของเวที 1920×1080 ที่ย่อให้พอดีจอ
    el.style.transformOrigin = `${(from.x + from.width / 2 - r.left) / k}px ${(from.y + from.height / 2 - r.top) / k}px`
    const small = { transform: 'scale(0.03)', opacity: 0 }
    const full = { transform: 'scale(1)', opacity: 1 }
    const anim = el.animate(closing ? [full, small] : [small, full], {
      duration: closing ? 320 : 480,
      easing: closing ? 'cubic-bezier(.5,0,.75,0)' : 'cubic-bezier(.16,1,.3,1)',
      fill: 'forwards',
    })
    if (closing) anim.onfinish = onClosed
    return () => anim.cancel()
  }, [closing]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div ref={ref} className={s.reveal}>
      {children}
    </div>
  )
}

export default function Wastewater() {
  // กดแท่งดินแดงแล้วกราฟเทียบมาตรฐานขยายออกมาจากแท่ง · กดอีกครั้งหดกลับ
  const [std, setStd] = useState(null) // null | { from: DOMRect, closing: boolean }
  const toggleStd = (e) => {
    const from = e.currentTarget.getBoundingClientRect()
    setStd((v) => (!v ? { from, closing: false } : v.closing ? v : { ...v, closing: true }))
  }
  return (
    <SlideFrame
      kicker="03 · น้ำเสีย"
      title="น้ำในคลองดินแดงแย่อันดับ 49 ทั้งที่มีโรงบำบัดใหญ่ที่สุดของกรุงเทพฯ"
      source="ที่มา: Bangkok Index 2025 – Rocket Media Lab (น้ำเสีย: ค่าเฉลี่ยคุณภาพคลองปี 2540–2567, สำนักการระบายน้ำ) · BOD ยิ่งสูงยิ่งเน่า · มาตรฐานคุณภาพน้ำในคลอง 15 มก./ล."
    >
      <div className={s.grid}>
        <ChartCard
          title="BOD เฉลี่ยของคลอง 50 เขต"
          note={`เรียงจากน้ำดีไปน้ำแย่ · ${exceed} เขตเกินมาตรฐาน`}
          legend={[
            { label: 'ดินแดง', color: color.dindaeng },
            { label: 'พญาไท (เขตข้างเคียง)', color: color.contrast },
            { label: 'เขตอื่น', color: color.other },
          ]}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} margin={{ top: 40, right: 8, bottom: 8, left: 0 }} barCategoryGap={2}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="name" tick={false} axisLine={{ stroke: color.border }} tickLine={false} />
              <YAxis {...axisCommon} domain={[0, 30]} ticks={[0, 10, 20, 30]} width={44} />
              <Tooltip cursor={{ fill: color.grid }} content={bodTip} />
              <Bar dataKey="bod" radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false}>
                {rows.map((d) => (
                  <Cell key={d.name} fill={barColor(d.name)} />
                ))}
                <LabelList
                  dataKey="name"
                  content={({ x, y, width, height, value }) =>
                    value === DD ? (
                      <g onClick={toggleStd} className={s.clickable}>
                        <SvgLabel x={x + width / 2} y={y - 12} anchor="end">ดินแดง {fmt.dec(dd.bod)}</SvgLabel>
                        {/* พื้นที่กดของแท่งดินแดง (โปร่งใส ครอบแท่งและป้าย) */}
                        <rect x={x - 4} y={y - 36} width={width + 8} height={height + 36} fill="transparent" />
                      </g>
                    ) : value === PY ? (
                      <SvgLabel x={x + width / 2} y={y - 12} anchor="middle">พญาไท {fmt.dec(py.bod)}</SvgLabel>
                    ) : null
                  }
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {std ? (
        <GrowFrom from={std.from} closing={std.closing} onClosed={() => setStd(null)}>
        <ChartCard
          title="BOD ดินแดงเทียบมาตรฐาน"
          note={`ต้องลดลง ${fmt.dec(cut)} มก./ล. ถึงจะเท่ามาตรฐาน ${ww.standard} มก./ล.`}
          legend={[
            { label: `ไม่เกินมาตรฐาน (0–${ww.standard})`, color: color.other },
            { label: 'ส่วนที่เกินมาตรฐาน', color: color.dindaeng },
          ]}
        >
          <StandardBar />
        </ChartCard>
        </GrowFrom>
        ) : (
          <div className={s.hint}>กดที่แท่งดินแดง เพื่อดู BOD เทียบมาตรฐาน</div>
        )}
      </div>
    </SlideFrame>
  )
}
