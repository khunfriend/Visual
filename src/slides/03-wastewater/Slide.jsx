import {
  Bar, BarChart, CartesianGrid, Cell, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { useState } from 'react'
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
const highRank = rows.filter((d) => d.bod > dd.bod).length + 1
const BOD_MAX = 40
const BOD_TICKS = [0, 10, 20, 30, 40]
const pct = (bod) => `${(bod / BOD_MAX) * 100}%`
const standardLabel = `${ww.standard} มก./ล.`

// ขยับป้ายของเขตที่มีแท่งอยู่ใกล้กันให้อ่านได้พร้อมกัน
const NEAR = {
  พญาไท: { anchor: 'end', dy: 0 },
  จตุจักร: { anchor: 'end', dy: 0 },
  ราชเทวี: { anchor: 'end', dy: 0 },
  ห้วยขวาง: { anchor: 'end', dy: 32 },
}
const neighborColor = 'var(--wastewater-neighbor-color)'
const barColor = (name) => (name === DD ? color.dindaeng : NEAR[name] ? neighborColor : color.other)

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
                <div className={s.stBar} style={{ width: pct(x.bod), background: over ? color.dindaeng : color.contrast }} />
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

const bodTip = <TipBox render={(r) => ({ title: `${r.name} · อันดับ ${r.rank}`, rows: [['BOD เฉลี่ย', `${fmt.dec(r.bod)} มก./ล.`], ['จำนวนคลอง', `${r.canals}`]] })} />

export default function Wastewater() {
  return (
    <SlideFrame
      kicker="04 · น้ำเสีย"
      title={`ดินแดงมีค่า BOD สูงเป็นอันดับ ${highRank} จาก ${rows.length} เขต`}
      source="ที่มา Bangkok Index 2025 – Rocket Media Lab (ข้อมูลคลองจากสำนักการระบายน้ำ) · จุดตรวจจากชุดข้อมูล waterquality ของกรุงเทพมหานคร (data.bangkok.go.th)"
    >
      <div className={s.grid}>
        <ChartCard
          title={`BOD เฉลี่ยของคลอง ${rows.length} เขต`}
          note={`ปี 2540–2567 · ${exceed} เขตเกินเกณฑ์ · ยิ่งสูง น้ำยิ่งเน่า`}
          legend={[
            { label: 'ดินแดง', color: color.dindaeng },
            { label: 'เขตข้างเคียง', color: neighborColor },
            { label: 'เขตอื่น', color: color.other },
          ]}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} margin={{ top: 12, right: 8, bottom: 8, left: 0 }} barCategoryGap={2}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="name" tick={false} axisLine={{ stroke: color.border }} tickLine={false} />
              <YAxis {...axisCommon} domain={[0, BOD_MAX]} ticks={BOD_TICKS} width={44} />
              <Tooltip cursor={{ fill: color.grid }} content={bodTip} />
              <Bar dataKey="bod" radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false}>
                {rows.map((d) => (
                  <Cell key={d.name} fill={barColor(d.name)} />
                ))}
                <LabelList
                  dataKey="name"
                  content={({ x, y, width, value }) =>
                    value === DD ? (
                      <SvgLabel x={x + width / 2} y={y - 12} anchor="end">ดินแดง {fmt.dec(dd.bod)}</SvgLabel>
                    ) : NEAR[value] ? (
                      <SvgLabel x={x + width / 2} y={y - 12 - NEAR[value].dy} anchor={NEAR[value].anchor} weight={500}>
                        {value} {fmt.dec(rows.find((d) => d.name === value).bod)}
                      </SvgLabel>
                    ) : null
                  }
                />
              </Bar>
              <ReferenceLine
                y={ww.standard} stroke={color.reference} strokeDasharray="6 5" strokeWidth={2}
                label={({ viewBox }) => (
                  <SvgLabel x={viewBox.x + 10} y={viewBox.y - 12} anchor="start" fill={color.reference}>
                    เกณฑ์ {standardLabel}
                  </SvgLabel>
                )}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title={`${overCount} ใน ${stations.length} จุดตรวจในดินแดงมี BOD เกินเกณฑ์`}
          note="BOD เฉลี่ย ม.ค.–เม.ย. 2566 · หน่วย มก./ล."
          legend={[
            { label: 'เกินเกณฑ์', color: color.dindaeng },
            { label: 'อยู่ในเกณฑ์', color: color.contrast },
            { label: 'เกณฑ์ BOD', color: color.reference, kind: 'dash' },
          ]}
        >
          <StationBars />
        </ChartCard>
      </div>
    </SlideFrame>
  )
}
