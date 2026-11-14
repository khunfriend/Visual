import { CartesianGrid, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts'
import SlideFrame from '../../components/SlideFrame.jsx'
import { ChartCard, DD, PT, SvgLabel, TipBox, axisCommon, districtColor, fmt, gridProps } from '../../components/charts/kit.jsx'
import { map, parks } from '../../lib/data.js'
import { color, size } from '../../theme/theme.js'
import s from './style.module.css'

// สไลด์ 08: แก้เฉพาะไฟล์ในโฟลเดอร์นี้ (ดู CLAUDE.md)
// ตัวเลขทุกตัวต้องตรงกับ ข้อมูลรวม_ตรวจแล้ว.md

const rows = parks.districts.map((d) => ({ ...d, popK: d.population / 1000, acc: Math.max(d.accessiblePerCapita, 0.01) }))
const dd = rows.find((d) => d.name === DD)
const parkRisk = map.risk.points.filter((p) => p.place.includes('สวน'))

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
      kicker="10 · สวนหย่อม"
      title="สวนที่เข้าถึงได้ของดินแดงต่ำกว่าค่ากลาง"
      subtitle={`พื้นที่สีเขียว ${fmt.dec(dd.greenPerCapita)} ตร.ม./คน (มัธยฐาน ${fmt.dec(parks.medianGreenPerCapita)}) · ${parkRisk.length} จาก ${map.risk.points.length} จุดเสี่ยงอยู่ในสวนหรือสวนหย่อม`}
      source="ที่มา: Bangkok Index 2025 – Rocket Media Lab (สวนสาธารณะ 2568, เฉพาะสวนที่สำนักงานสวนสาธารณะดูแล); บัญชีพื้นที่เสี่ยง สำนักเทศกิจ 2567–2568 · Pocket Park คิดแห่งละ 300 ตร.ม."
    >
      <div className={s.grid}>
        <ChartCard
          title="ประชากร กับสวนที่เข้าถึงได้ต่อคน (50 เขต)"
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
              <YAxis type="number" dataKey="acc" scale="log" domain={[0.01, 30]} ticks={[0.01, 0.1, 1, 10]} allowDataOverflow {...axisCommon} width={96}
                label={{ value: 'สวนที่เข้าถึงได้ ตร.ม./คน (สเกล log)', angle: -90, position: 'insideLeft', offset: 0, style: { textAnchor: 'middle' }, fill: color.textMuted, fontSize: size.label }} />
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
      </div>
    </SlideFrame>
  )
}
