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

// เขตข้างเคียงที่เน้นด้วยเขียวอ่อน · ห้วยขวางยกป้ายขึ้นอีกชั้น ไม่ให้ชนราชเทวี (ห่างกันแค่ 1 แท่ง) และไม่ทับแท่งที่สูงกว่าทางขวา
const NEAR = { พญาไท: { anchor: 'middle', dy: 0 }, ราชเทวี: { anchor: 'end', dy: 0 }, ห้วยขวาง: { anchor: 'end', dy: 30 } }
const barColor = (name) => (name === DD ? color.dindaeng : NEAR[name] ? color.neighbor : color.other)

// จุดตรวจคุณภาพน้ำที่อยู่ในเขตดินแดง (ม.ค.–เม.ย. 2566) เรียงจาก BOD มากไปน้อย
const stations = ww.stations
const overCount = stations.filter((x) => x.bod > ww.standard).length
const doZero = stations.filter((x) => x.doZeroAll).length
const MONTH = { '01': 'ม.ค.', '02': 'ก.พ.', '03': 'มี.ค.', '04': 'เม.ย.' }

/** แท่งแนวนอนรายจุดตรวจ: ส้ม = เกินมาตรฐาน · เขียว = ผ่าน · เส้นประ = มาตรฐาน 15 */
function StationBars() {
  const [tip, setTip] = useState(null)
  const MAX = 40
  const pct = (v) => `${(v / MAX) * 100}%`
  return (
    <div className={s.stations}>
      {stations.map((x) => {
        const over = x.bod > ww.standard
        return (
          <div key={x.id} className={s.stRow} onMouseEnter={() => setTip(x)} onMouseLeave={() => setTip(null)}>
            <div className={s.stLabel}>
              <b>{x.canal}</b>
              <span>{x.point}</span>
            </div>
            <div className={s.stTrack}>
              <div className={s.stBar} style={{ width: pct(x.bod), background: over ? color.dindaeng : color.contrast }} />
              <span className={`${s.stVal} num`} style={{ left: pct(x.bod) }}>{fmt.dec(x.bod)}</span>
              <div className={s.stStd} style={{ left: pct(ww.standard) }} />
            </div>
          </div>
        )
      })}
      <div className={s.stAxis}>
        <div />
        <div className={s.stTrack}>
          <span className={s.stStdLabel} style={{ left: pct(ww.standard) }}>มาตรฐาน {ww.standard}</span>
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
      source="ที่มา: Bangkok Index 2025 – Rocket Media Lab (น้ำเสีย: ค่าเฉลี่ยคุณภาพคลองปี 2540–2567, สำนักการระบายน้ำ); จุดตรวจรายจุด: data.bangkok.go.th ชุด waterquality ม.ค.–เม.ย. 2566 · BOD ยิ่งสูงยิ่งเน่า · มาตรฐานคุณภาพน้ำในคลอง 15 มก./ล."
    >
      <div className={s.grid}>
        <ChartCard
          title="BOD เฉลี่ยของคลอง 50 เขต"
          note={`เรียงจากน้ำดีไปน้ำแย่ · ${exceed} เขตเกินมาตรฐาน`}
          legend={[
            { label: 'ดินแดง', color: color.dindaeng },
            { label: 'เขตข้างเคียง', color: color.neighbor },
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
                    ) : NEAR[value] ? (
                      <SvgLabel x={x + width / 2} y={y - 12 - NEAR[value].dy} anchor={NEAR[value].anchor} weight={500}>
                        {value} {fmt.dec(rows.find((d) => d.name === value).bod)}
                      </SvgLabel>
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
          title={`${doZero} ใน ${stations.length} จุดตรวจในดินแดง น้ำไม่มีออกซิเจนเลย`}
          note={`BOD เฉลี่ย ม.ค.–เม.ย. 2566 · ${overCount} จุดเกินมาตรฐาน ${ww.standard} มก./ล.`}
          legend={[
            { label: 'เกินมาตรฐาน', color: color.dindaeng },
            { label: 'ผ่านมาตรฐาน', color: color.contrast },
            { label: `มาตรฐาน กทม. ${ww.standard}`, color: color.reference, kind: 'dash' },
          ]}
        >
          <StationBars />
        </ChartCard>
        </GrowFrom>
        ) : (
          <div className={s.hint}>กดที่แท่งดินแดง เพื่อดูจุดตรวจน้ำในเขต</div>
        )}
      </div>
    </SlideFrame>
  )
}
