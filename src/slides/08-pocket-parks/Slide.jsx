import { CartesianGrid, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts'
import SlideFrame from '../../components/SlideFrame.jsx'
import { ChartCard, DD, PT, Stat, SvgLabel, TipBox, axisCommon, districtColor, fmt, gridProps } from '../../components/charts/kit.jsx'
import { map, parks } from '../../lib/data.js'
import { color, size } from '../../theme/theme.js'
import s from './style.module.css'

// สไลด์ 08: แก้เฉพาะไฟล์ในโฟลเดอร์นี้ (ดู CLAUDE.md)
// ตัวเลขทุกตัวต้องตรงกับ ข้อมูลรวม_ตรวจแล้ว.md

const rows = parks.districts.map((d) => ({ ...d, popK: d.population / 1000, acc: Math.max(d.accessiblePerCapita, 0.01) }))
const dd = rows.find((d) => d.name === DD)
const greenRank = [...rows].sort((a, b) => b.greenPerCapita - a.greenPerCapita).findIndex((d) => d.name === DD) + 1
const gap = parks.dindaengGap
const parkRank = [...rows].sort((a, b) => b.score - a.score).findIndex((d) => d.name === DD) + 1
const POCKET = { count: 3, m2: 300 }
const pocketGain = (POCKET.count * POCKET.m2) / dd.population // ตร.ม./คน ที่เพิ่มได้
const parkRisk = map.risk.points.filter((p) => p.place.includes('สวน'))
const vacantDark = map.risk.points.filter((p) => /รกร้าง|มืด/.test(p.type))

function Dot({ cx, cy, payload }) {
  const hi = payload.name === DD || payload.name === PT
  return (
    <g>
      <circle cx={cx} cy={cy} r={hi ? 10 : 7} fill={districtColor(payload.name)} stroke={color.surface} strokeWidth={2} />
      {payload.name === DD && <SvgLabel x={cx + 14} y={cy} dy="0.35em" anchor="start">ดินแดง {fmt.dec(payload.accessiblePerCapita)} ตร.ม./คน</SvgLabel>}
      {payload.name === PT && <SvgLabel x={cx + 14} y={cy} dy="0.35em" anchor="start" weight={500} fill={color.textMuted}>ปทุมวัน</SvgLabel>}
    </g>
  )
}

export default function PocketParks() {
  return (
    <SlideFrame
      kicker="09 · สวนหย่อม"
      title={`คะแนนสวนอันดับ ${parkRank} แต่การไล่คะแนนสวนไม่คุ้ม สวนหย่อมควรใช้แก้จุดเสี่ยง`}
      source="ที่มา: Bangkok Index 2025 – Rocket Media Lab (สวนสาธารณะ 2568, เฉพาะสวนที่สำนักงานสวนสาธารณะดูแล); บัญชีพื้นที่เสี่ยง สำนักเทศกิจ 2567–2568 · Pocket Park คิดแห่งละ 300 ตร.ม."
    >
      <div className={s.grid}>
        <ChartCard
          title="ประชากร กับสวนที่เข้าถึงได้ต่อคน (50 เขต)"
          note={`แต่ละจุดคือ 1 เขต · แกนตั้งเป็นสเกล log · ดินแดงพื้นที่สีเขียวต่อคนอันดับ ${greenRank}`}
          legend={[
            { label: 'ดินแดง', color: color.dindaeng },
            { label: 'ปทุมวัน', color: color.pathumwan },
            { label: 'เขตอื่น', color: color.other },
            { label: `มัธยฐาน ${fmt.dec(parks.medianAccessiblePerCapita)} ตร.ม./คน`, color: color.reference, kind: 'dash' },
          ]}
        >
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 16, right: 40, bottom: 36, left: 8 }}>
              <CartesianGrid {...gridProps} vertical />
              <XAxis type="number" dataKey="popK" {...axisCommon} domain={[0, 225]} ticks={[0, 50, 100, 150, 200]}
                label={{ value: 'ประชากร (พันคน)', position: 'bottom', offset: 12, fill: color.textMuted, fontSize: size.label }} />
              <YAxis type="number" dataKey="acc" scale="log" domain={[0.01, 30]} ticks={[0.01, 0.1, 1, 10]} allowDataOverflow {...axisCommon} width={64} />
              <ReferenceLine y={parks.medianAccessiblePerCapita} stroke={color.reference} strokeDasharray="6 5" strokeWidth={2} />
              <Tooltip
                cursor={false}
                content={<TipBox render={(r) => ({
                  title: r.name,
                  rows: [['ประชากร', fmt.int(r.population)], ['สวนที่เข้าถึงได้ต่อคน', `${fmt.dec(r.accessiblePerCapita)} ตร.ม.`], ['พื้นที่สีเขียวต่อคน', `${fmt.dec(r.greenPerCapita)} ตร.ม.`]],
                })} />}
              />
              <Scatter data={rows} shape={Dot} isAnimationActive={false} />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className={s.side}>
          <section className={s.block}>
            <h2 className={s.blockTitle}>ถ้าจะไล่ให้ถึงค่ากลาง</h2>
            <div className={s.stats}>
              <Stat label="พื้นที่สีเขียวต้องเพิ่ม" value={`${fmt.dec(gap.greenTimes)}×`} sub={`จาก ${fmt.dec(dd.greenPerCapita)} เป็น ${fmt.dec(parks.medianGreenPerCapita)} ตร.ม./คน`} />
              <Stat label="หรือ Pocket Park" value={fmt.int(gap.pocketParks300m2)} unit="แห่ง" sub={`สวนที่เข้าถึงได้ต้องเพิ่ม ${fmt.int(gap.accessibleM2)} ตร.ม.`} />
            </div>
            <p className={s.note}>
              Pocket Park {POCKET.count} แห่งเพิ่มสวนได้แค่ <b className="num">{fmt.dec(pocketGain, 3)}</b> ตร.ม./คน คะแนนสวนแทบไม่ขยับ
            </p>
          </section>

          <section className={s.block}>
            <h2 className={s.blockTitle}>แต่สวนหย่อมช่วยเรื่องจุดเสี่ยงได้</h2>
            <ul className={s.points}>
              {[...parkRisk, ...vacantDark].map((p) => (
                <li key={p.no}>
                  <span className={s.badge} style={{ background: color.riskType[p.type] }}>{p.no}</span>
                  {p.name.replace(/^บริเวณ/, '')}
                  <small> · {p.type}</small>
                </li>
              ))}
            </ul>
            <p className={s.note}>ปรับปรุงสวนเดิมให้สว่างและมีคนใช้ และเปลี่ยนที่รกร้างเป็นสวนหย่อม ลดจุดเสี่ยงได้โดยตรง (หมายเลขตรงกับสไลด์ 7)</p>
          </section>
        </div>
      </div>
    </SlideFrame>
  )
}
